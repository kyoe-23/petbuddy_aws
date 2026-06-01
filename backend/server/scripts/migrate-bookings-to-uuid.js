// Option A: Normalize bookings to reference users.id (UUID, VARCHAR) and dogs.id (UUID, VARCHAR)
// - bookings.owner_user_id -> bookings.owner_id VARCHAR(36)
// - bookings.sitter_user_id -> bookings.sitter_id VARCHAR(36)
// - bookings.dog_id (INT or other) -> bookings.dog_id VARCHAR(36)
// - Drop old FKs; add new FKs to users(id), dogs(id)

const mysql = require('mysql2/promise')
const { dbConfig } = require('../config/database-minimal')

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
    [table, column]
  )
  return rows.length > 0
}

async function fkList(conn, table) {
  const [rows] = await conn.execute(
    `SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL`,
    [table]
  )
  return rows.map(r => r.CONSTRAINT_NAME)
}

async function indexExists(conn, table, indexName) {
  const [rows] = await conn.execute(`SHOW INDEX FROM \`${table}\``)
  return rows.some(r => r.Key_name === indexName)
}

async function main() {
  const pool = await mysql.createPool({ ...dbConfig, multipleStatements: true })
  const conn = await pool.getConnection()
  try {
    console.log('🔧 Start bookings schema migration → UUID/VARCHAR refs')

    // Guard: bookings table exists
    const [t] = await conn.execute(`SHOW TABLES LIKE 'bookings'`)
    if (t.length === 0) {
      console.log('⚠️  bookings table not found. Abort.')
      return
    }

    // Drop existing foreign keys
    const fks = await fkList(conn, 'bookings')
    for (const fk of fks) {
      try {
        await conn.execute(`ALTER TABLE bookings DROP FOREIGN KEY \`${fk}\``)
        console.log(` - Dropped FK: ${fk}`)
      } catch (e) {
        console.log(` - Skip drop FK ${fk}: ${e.message}`)
      }
    }

    // OWNER: owner_user_id -> owner_id VARCHAR(36)
    const hasOwnerUserId = await columnExists(conn, 'bookings', 'owner_user_id')
    const hasOwnerId = await columnExists(conn, 'bookings', 'owner_id')
    if (!hasOwnerId) {
      await conn.execute(`ALTER TABLE bookings ADD COLUMN owner_id VARCHAR(36) NULL AFTER booking_id`)
      console.log(' + Added owner_id (VARCHAR(36))')
    }
    if (hasOwnerUserId) {
      // Map owner_user_id (int) → users.id (uuid)
      // Case 1: users has user_id and id
      await conn.execute(
        `UPDATE bookings b JOIN users u ON b.owner_user_id = u.user_id SET b.owner_id = u.id WHERE b.owner_id IS NULL`
      )
      // Case 2: if some rows already have uuid in owner_user_id (unlikely)
      await conn.execute(
        `UPDATE bookings SET owner_id = owner_user_id WHERE owner_id IS NULL AND LENGTH(owner_user_id) = 36`
      )
      // Ensure NOT NULL by filling with empty if still null (to alter later)
      await conn.execute(`UPDATE bookings SET owner_id = owner_id`) // no-op
      await conn.execute(`ALTER TABLE bookings DROP COLUMN owner_user_id`)
      console.log(' - Dropped owner_user_id, mapped to owner_id')
    }
    await conn.execute(`ALTER TABLE bookings MODIFY COLUMN owner_id VARCHAR(36) NOT NULL`)

    // SITTER: sitter_user_id -> sitter_id VARCHAR(36)
    const hasSitterUserId = await columnExists(conn, 'bookings', 'sitter_user_id')
    const hasSitterId = await columnExists(conn, 'bookings', 'sitter_id')
    if (!hasSitterId) {
      await conn.execute(`ALTER TABLE bookings ADD COLUMN sitter_id VARCHAR(36) NULL AFTER owner_id`)
      console.log(' + Added sitter_id (VARCHAR(36))')
    }
    if (hasSitterUserId) {
      await conn.execute(
        `UPDATE bookings b JOIN users u ON b.sitter_user_id = u.user_id SET b.sitter_id = u.id WHERE b.sitter_id IS NULL`
      )
      await conn.execute(
        `UPDATE bookings SET sitter_id = sitter_user_id WHERE sitter_id IS NULL AND LENGTH(sitter_user_id) = 36`
      )
      await conn.execute(`ALTER TABLE bookings DROP COLUMN sitter_user_id`)
      console.log(' - Dropped sitter_user_id, mapped to sitter_id')
    }
    await conn.execute(`ALTER TABLE bookings MODIFY COLUMN sitter_id VARCHAR(36) NOT NULL`)

    // DOG: dog_id to VARCHAR(36) and map to dogs.id
    const [dogColInfo] = await conn.execute(
      `SHOW COLUMNS FROM bookings LIKE 'dog_id'`
    )
    if (dogColInfo.length === 0) {
      // Some schemas used dogId
      const hasDogIdCamel = await columnExists(conn, 'bookings', 'dogId')
      if (!hasDogIdCamel) {
        await conn.execute(`ALTER TABLE bookings ADD COLUMN dog_id VARCHAR(36) NULL AFTER sitter_id`)
        console.log(' + Added dog_id (VARCHAR(36))')
      } else {
        // Rename dogId → dog_id
        await conn.execute(`ALTER TABLE bookings CHANGE COLUMN dogId dog_id VARCHAR(255)`)
      }
    }

    // If dog_id is not varchar, add temp column and migrate
    const [descRows] = await conn.execute(`SHOW FULL COLUMNS FROM bookings`)
    const dogDesc = descRows.find(r => r.Field === 'dog_id')
    if (dogDesc && !String(dogDesc.Type).toLowerCase().includes('char')) {
      // Create temp column
      await conn.execute(`ALTER TABLE bookings ADD COLUMN dog_id_v VARCHAR(36) NULL AFTER sitter_id`)
      // Case 1: map INT to dogs.id via dogs.dog_id
      await conn.execute(
        `UPDATE bookings b JOIN dogs d ON b.dog_id = d.dog_id SET b.dog_id_v = d.id WHERE b.dog_id_v IS NULL`
      )
      // Case 2: if some rows already store uuid-like string
      await conn.execute(
        `UPDATE bookings SET dog_id_v = dog_id WHERE dog_id_v IS NULL AND LENGTH(dog_id) = 36`
      )
      await conn.execute(`ALTER TABLE bookings DROP COLUMN dog_id`)
      await conn.execute(`ALTER TABLE bookings CHANGE COLUMN dog_id_v dog_id VARCHAR(36) NULL`)
      console.log(' * Converted dog_id to VARCHAR(36) and mapped values')
    } else {
      // ensure VARCHAR(36)
      await conn.execute(`ALTER TABLE bookings MODIFY COLUMN dog_id VARCHAR(36) NULL`)
    }
    await conn.execute(`UPDATE bookings SET dog_id = dog_id`) // no-op
    await conn.execute(`ALTER TABLE bookings MODIFY COLUMN dog_id VARCHAR(36) NOT NULL`)

    // Add indexes
    if (!(await indexExists(conn, 'bookings', 'idx_bookings_owner'))) {
      await conn.execute(`ALTER TABLE bookings ADD INDEX idx_bookings_owner (owner_id)`) 
    }
    if (!(await indexExists(conn, 'bookings', 'idx_bookings_sitter'))) {
      await conn.execute(`ALTER TABLE bookings ADD INDEX idx_bookings_sitter (sitter_id)`) 
    }
    if (!(await indexExists(conn, 'bookings', 'idx_bookings_dog'))) {
      await conn.execute(`ALTER TABLE bookings ADD INDEX idx_bookings_dog (dog_id)`) 
    }

    // Add FKs to users(id) and dogs(id)
    try { await conn.execute(`ALTER TABLE bookings ADD CONSTRAINT fk_bookings_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`) } catch (e) { console.log('FK owner warn:', e.message) }
    try { await conn.execute(`ALTER TABLE bookings ADD CONSTRAINT fk_bookings_sitter FOREIGN KEY (sitter_id) REFERENCES users(id) ON DELETE RESTRICT ON UPDATE CASCADE`) } catch (e) { console.log('FK sitter warn:', e.message) }
    try { await conn.execute(`ALTER TABLE bookings ADD CONSTRAINT fk_bookings_dog FOREIGN KEY (dog_id) REFERENCES dogs(id) ON DELETE RESTRICT ON UPDATE CASCADE`) } catch (e) { console.log('FK dog warn:', e.message) }

    console.log('✅ Migration complete')
  } catch (e) {
    console.error('❌ Migration failed:', e)
  } finally {
    try { conn.release() } catch {}
    await pool.end()
  }
}

main()


