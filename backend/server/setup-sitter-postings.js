 /**
  * Restore sitter_postings table to the original schema
  * Columns: post_id, sitter_id, title, description, location, available_from, available_to, status, created_at, updated_at
  */
 const mysql = require('mysql2/promise')
 const { dbConfig } = require('./config/database-minimal')
 
 async function ensureSitterPostingsTable() {
   let connection
   try {
     connection = await mysql.createConnection(dbConfig)
     console.log('🔧 연결 성공. sitter_postings 테이블을 복원합니다...')
 
     // Create table if not exists with the desired schema
     const createTableSQL = `
       CREATE TABLE IF NOT EXISTS sitter_postings (
         post_id INT PRIMARY KEY AUTO_INCREMENT,
         sitter_id VARCHAR(36) NOT NULL,
         title VARCHAR(200) NOT NULL,
         description TEXT,
         location VARCHAR(100),
         available_from DATE NOT NULL,
         available_to DATE NOT NULL,
         status ENUM('active','closed') DEFAULT 'active',
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         INDEX idx_sitter_postings_sitter_id (sitter_id)
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
     `
 
     await connection.execute(createTableSQL)
     console.log('✅ sitter_postings 테이블 존재 보장')
 
     // Ensure required columns exist (for cases where table exists but columns were removed)
     const [columns] = await connection.execute(
       `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'sitter_postings'`,
       [dbConfig.database]
     )
     const columnSet = new Set(columns.map(c => c.COLUMN_NAME))
 
     const alters = []
     if (!columnSet.has('description')) {
       alters.push("ADD COLUMN description TEXT AFTER title")
     }
     if (!columnSet.has('status')) {
       alters.push("ADD COLUMN status ENUM('active','closed') DEFAULT 'active' AFTER available_to")
     }
     if (!columnSet.has('created_at')) {
       alters.push("ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER status")
     }
     if (!columnSet.has('updated_at')) {
       alters.push("ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at")
     }
 
     if (alters.length > 0) {
       const alterSQL = `ALTER TABLE sitter_postings ${alters.join(', ')}`
       await connection.execute(alterSQL)
       console.log('🔁 누락된 컬럼 복구:', alters.join(', '))
     } else {
       console.log('ℹ️  컬럼 구조는 이미 원하는 상태입니다.')
     }
 
     console.log('🎉 완료: sitter_postings 컬럼을 수정 전 상태로 복원했습니다.')
   } catch (err) {
     console.error('❌ 오류:', err.message)
     process.exitCode = 1
   } finally {
     if (connection) await connection.end()
   }
 }
 
 ensureSitterPostingsTable()
 



