const mysql = require('mysql2/promise')
const { dbConfig } = require('../config/database-minimal')

;(async () => {
  let pool
  try {
    pool = await mysql.createPool(dbConfig)
    console.log('🔍 Connecting to MySQL...')
    const [rows] = await pool.execute("SHOW COLUMNS FROM dogs LIKE 'photo_url'")
    if (!rows || rows.length === 0) {
      console.log('⚠️  Column photo_url not found on dogs. Skipping.')
      process.exit(0)
    }
    console.log('📐 Altering dogs.photo_url to MEDIUMTEXT ...')
    await pool.execute('ALTER TABLE dogs MODIFY photo_url MEDIUMTEXT NULL')
    console.log('✅ Alter complete.')
  } catch (e) {
    console.error('❌ Alter failed:', e.message)
    process.exit(1)
  } finally {
    if (pool) await pool.end()
  }
})()



