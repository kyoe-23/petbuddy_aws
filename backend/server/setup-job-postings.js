 const mysql = require('mysql2/promise')
 const { dbConfig } = require('./config/database-minimal')
 
 async function main() {
   let conn
   try {
     conn = await mysql.createConnection(dbConfig)
     console.log('🔧 job_postings 테이블을 확인/생성합니다...')
     await conn.execute(`
       CREATE TABLE IF NOT EXISTS job_postings (
         job_id INT PRIMARY KEY AUTO_INCREMENT,
         owner_id INT NOT NULL,
         dog_id INT NOT NULL,
         title VARCHAR(200) NOT NULL,
         description TEXT,
         location VARCHAR(100),
         start_date DATE NOT NULL,
         end_date DATE NOT NULL,
         status ENUM('active','closed') DEFAULT 'active',
         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
         INDEX idx_job_owner (owner_id),
         INDEX idx_job_dog (dog_id),
         INDEX idx_job_status (status)
       ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
     `)
     console.log('✅ job_postings OK')
   } catch (e) {
     console.error('❌ job_postings 생성 오류:', e.message)
     process.exitCode = 1
   } finally {
     if (conn) await conn.end()
   }
 }
 
 main()
 



