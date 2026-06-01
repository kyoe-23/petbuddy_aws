const mysql = require('mysql2/promise')
const { dbConfig } = require('../config/database-minimal')

async function columnExists(conn, table, column) {
  const [rows] = await conn.execute(
    'SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ? LIMIT 1',
    [table, column]
  )
  return rows.length > 0
}

async function main() {
  const pool = await mysql.createPool({ ...dbConfig })
  const conn = await pool.getConnection()
  try {
    console.log('🔧 Add users.id (UUID) and remap references')

    const hasUsersId = await columnExists(conn, 'users', 'id')
    if (!hasUsersId) {
      await conn.execute(`ALTER TABLE users ADD COLUMN id VARCHAR(36) NULL AFTER user_id`)
      console.log(' + users.id added')
    }

    // Fill users.id where null
    await conn.execute(`UPDATE users SET id = (SELECT UUID()) WHERE id IS NULL OR id = ''`)
    console.log(' * users.id filled')

    // Unique index
    try { await conn.execute(`ALTER TABLE users ADD UNIQUE INDEX ux_users_id (id)`) } catch (e) { console.log(' (ux skip)', e.message) }

    // Remap sitter_postings.sitter_id -> users.id when sitter_id is numeric or length!=36
    try {
      await conn.execute(`UPDATE sitter_postings sp JOIN users u ON sp.sitter_id = u.user_id SET sp.sitter_id = u.id WHERE LENGTH(sp.sitter_id) <> 36`)
      console.log(' * sitter_postings remapped to users.id')
    } catch (e) { console.log(' (sitter_postings map warn)', e.message) }

    // Remap job_postings.owner_id -> users.id when owner_id is numeric or length!=36
    try {
      await conn.execute(`UPDATE job_postings jp JOIN users u ON jp.owner_id = u.user_id SET jp.owner_id = u.id WHERE LENGTH(jp.owner_id) <> 36`)
      console.log(' * job_postings remapped to users.id')
    } catch (e) { console.log(' (job_postings map warn)', e.message) }

    console.log('✅ Done')
  } catch (e) {
    console.error('❌ Migration failed:', e)
  } finally {
    try { conn.release() } catch {}
    await pool.end()
  }
}

main()


