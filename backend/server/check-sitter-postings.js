 const mysql = require('mysql2/promise')
 const { dbConfig } = require('./config/database-minimal')
 
 async function main() {
   let conn
   try {
     conn = await mysql.createConnection(dbConfig)
     console.log('🔍 sitter_postings 컬럼 확인:')
     const [rows] = await conn.execute(
       `SELECT COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sitter_postings'
        ORDER BY ORDINAL_POSITION`,
       [dbConfig.database]
     )
     for (const r of rows) {
       console.log(`- ${r.COLUMN_NAME} :: ${r.COLUMN_TYPE} NULLABLE=${r.IS_NULLABLE} DEFAULT=${r.COLUMN_DEFAULT}`)
     }
   } catch (e) {
     console.error('❌ 오류:', e.message)
     process.exitCode = 1
   } finally {
     if (conn) await conn.end()
   }
 }
 
 main()
 



