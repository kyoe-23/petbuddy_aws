require('dotenv').config()
const mysql = require('mysql2/promise')

async function testRDSConnection() {
  console.log('🔍 RDS 연결 테스트 시작...')
  
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 10000
  }
  
  console.log(`📍 연결 정보: ${config.host}:${config.port}/${config.database}`)
  
  try {
    const connection = await mysql.createConnection(config)
    console.log('✅ RDS 연결 성공!')
    
    // 테이블 생성
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS dog_analyses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        file_name VARCHAR(255) NOT NULL,
        s3_url TEXT NOT NULL,
        recognized_breed VARCHAR(100),
        confidence DECIMAL(5,2),
        dbti_type VARCHAR(10),
        dbti_name VARCHAR(100),
        dbti_description TEXT,
        top5_breeds JSON,
        analysis_timestamp DATETIME,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_file_name (file_name),
        INDEX idx_breed (recognized_breed),
        INDEX idx_dbti (dbti_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
    
    await connection.execute(createTableSQL)
    console.log('✅ dog_analyses 테이블 생성/확인 완료')
    
    // 테스트 데이터 삽입
    const testInsert = `
      INSERT INTO dog_analyses (
        file_name, s3_url, recognized_breed, confidence, 
        dbti_type, dbti_name, dbti_description, top5_breeds
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `
    
    const testData = [
      'test_image.jpg',
      'https://test-bucket.s3.amazonaws.com/test_image.jpg',
      'Golden Retriever',
      85.5,
      'ESFP',
      '활발한 사교형',
      '에너지 넘치고 사람들과 어울리기 좋아하는 성격',
      JSON.stringify([
        {breed: 'Golden Retriever', confidence: 85.5},
        {breed: 'Labrador', confidence: 75.2}
      ])
    ]
    
    const [result] = await connection.execute(testInsert, testData)
    console.log(`✅ 테스트 데이터 삽입 완료 (ID: ${result.insertId})`)
    
    // 데이터 조회 테스트
    const [rows] = await connection.execute('SELECT * FROM dog_analyses ORDER BY id DESC LIMIT 1')
    console.log('✅ 데이터 조회 테스트:', rows[0])
    
    await connection.end()
    console.log('✅ RDS 연결 테스트 완료!')
    
  } catch (error) {
    console.error('❌ RDS 연결 실패:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 해결방법:')
      console.log('  1. RDS 인스턴스가 실행 중인지 확인')
      console.log('  2. 보안 그룹에서 포트 3306 허용 확인')
      console.log('  3. 퍼블릭 액세스 활성화 확인')
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('💡 해결방법:')
      console.log('  1. 사용자명/비밀번호 확인')
      console.log('  2. 데이터베이스 이름 확인')
    }
  }
}

testRDSConnection()