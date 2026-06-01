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
    console.log('🔧 Ensure dogs.id UUID and remap references')

    const hasDogsId = await columnExists(conn, 'dogs', 'id')
    if (!hasDogsId) {
      await conn.execute(`ALTER TABLE dogs ADD COLUMN id VARCHAR(36) NULL AFTER dog_id`)
      console.log(' + dogs.id added')
    }
    await conn.execute(`UPDATE dogs SET id = (SELECT UUID()) WHERE id IS NULL OR id = ''`)
    try { await conn.execute(`ALTER TABLE dogs ADD UNIQUE INDEX ux_dogs_id (id)`) } catch (e) { console.log('(ux skip)', e.message) }

    // Map job_postings.dog_id → dogs.id if needed
    try {
      await conn.execute(`UPDATE job_postings jp JOIN dogs d ON jp.dog_id = d.dog_id SET jp.dog_id = d.id WHERE LENGTH(jp.dog_id) <> 36`)
      console.log(' * job_postings.dog_id remapped to dogs.id')
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


