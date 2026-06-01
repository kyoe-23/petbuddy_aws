 const mysql = require('mysql2/promise')
 const { dbConfig } = require('./config/database-minimal')
 
 async function main() {
   let conn
   try {
     conn = await mysql.createConnection(dbConfig)
     console.log('🔧 sitter_postings 컬럼 강제 보정 시작')
 
     // description 컬럼 추가
     try {
       await conn.execute("ALTER TABLE sitter_postings ADD COLUMN description TEXT AFTER title")
       console.log('✅ description 컬럼 추가 완료')
     } catch (e) {
       if (e && String(e.code) === 'ER_DUP_FIELDNAME') {
         console.log('ℹ️  description 컬럼은 이미 존재')
       } else {
         console.log('⚠️  description 추가 시도 중 메시지:', e.message)
       }
     }
 
     // status 컬럼 추가
     try {
       await conn.execute("ALTER TABLE sitter_postings ADD COLUMN status ENUM('active','closed') DEFAULT 'active' AFTER available_to")
       console.log('✅ status 컬럼 추가 완료')
     } catch (e) {
       if (e && String(e.code) === 'ER_DUP_FIELDNAME') {
         console.log('ℹ️  status 컬럼은 이미 존재')
       } else {
         console.log('⚠️  status 추가 시도 중 메시지:', e.message)
       }
     }
 
     // created_at / updated_at 보정
     try {
       await conn.execute("ALTER TABLE sitter_postings ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
       console.log('✅ created_at 컬럼 추가 완료')
     } catch (e) {
       if (e && String(e.code) === 'ER_DUP_FIELDNAME') {
         console.log('ℹ️  created_at 컬럼은 이미 존재')
       }
     }
 
     try {
       await conn.execute("ALTER TABLE sitter_postings ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP")
       console.log('✅ updated_at 컬럼 추가 완료')
     } catch (e) {
       if (e && String(e.code) === 'ER_DUP_FIELDNAME') {
         console.log('ℹ️  updated_at 컬럼은 이미 존재')
       }
     }
 
     console.log('🎉 보정 완료')
   } catch (e) {
     console.error('❌ 보정 오류:', e.message)
     process.exitCode = 1
   } finally {
     if (conn) await conn.end()
   }
 }
 
 main()
 



