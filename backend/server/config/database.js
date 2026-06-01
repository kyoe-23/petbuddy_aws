require('dotenv').config()
const mysql = require('mysql2/promise')

// 데이터베이스 연결 설정
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'shrigur03@',
  database: process.env.DB_NAME || 'pet_buddy',
  port: process.env.DB_PORT || 3307,
  charset: 'utf8mb4'
}

// 연결 풀 생성
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
})

// 단일 연결 생성 함수
async function createConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig)
    console.log('✅ MySQL 데이터베이스 연결 성공!')
    return connection
  } catch (error) {
    console.error('❌ MySQL 연결 실패:', error.message)
    throw error
  }
}

// 연결 테스트 함수
async function testConnection() {
  try {
    const connection = await pool.getConnection()
    console.log('🔍 데이터베이스 연결 테스트 중...')
    
    // 연결 테스트
    const [rows] = await connection.execute('SELECT 1 as test')
    console.log('✅ MySQL 연결 성공!')
    
    // 현재 데이터베이스 확인
    const [dbInfo] = await connection.execute('SELECT DATABASE() as currentDB')
    console.log('📁 현재 데이터베이스:', dbInfo[0].currentDB)
    
    // users 테이블 존재 확인
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'users'"
    )
    
    if (tables.length > 0) {
      console.log('✅ users 테이블 확인됨')
      
      // 테이블 구조 확인
      const [columns] = await connection.execute('DESCRIBE users')
      console.log('📋 users 테이블 컬럼:', columns.map(col => col.Field).join(', '))
    } else {
      console.log('⚠️  users 테이블이 없습니다. SQL 스크립트를 실행해주세요.')
    }
    
    connection.release()
    return true
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error.message)
    return false
  }
}

// 이메일로 사용자 찾기
async function findUserByEmail(email) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    )
    return rows[0] || null
  } catch (error) {
    console.error('사용자 조회 실패:', error)
    throw error
  }
}

// ID로 사용자 찾기
async function findUserById(userId) {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [userId]
    )
    return rows[0] || null
  } catch (error) {
    console.error('사용자 조회 실패:', error)
    throw error
  }
}

// 새 사용자 생성
async function createUser(userData) {
  const { email, password, fullName, phone } = userData
  const { v4: uuidv4 } = require('uuid')
  
  try {
    const userId = uuidv4() // UUID 생성
    
    const [result] = await pool.execute(
      `INSERT INTO users (id, email, password, full_name, phone) 
       VALUES (?, ?, ?, ?, ?)`,
      [userId, email, password, fullName, phone]
    )
    
    console.log('✅ 새 사용자 생성 완료. ID:', userId)
    
    return {
      success: true,
      userId: userId
    }
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      throw new Error('이미 존재하는 이메일입니다.')
    }
    console.error('사용자 생성 실패:', error)
    throw error
  }
}

// 사용자 정보 업데이트
async function updateUser(userId, updateData) {
  const fields = []
  const values = []
  
  // 업데이트 가능한 필드만 처리
  const allowedFields = ['email', 'password', 'full_name', 'phone']
  
  Object.keys(updateData).forEach(key => {
    if (allowedFields.includes(key) && updateData[key] !== undefined) {
      fields.push(`${key} = ?`)
      values.push(updateData[key])
    }
  })
  
  if (fields.length === 0) {
    return { success: false, message: '업데이트할 데이터가 없습니다.' }
  }
  
  values.push(userId)
  
  try {
    const [result] = await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    )
    
    return {
      success: result.affectedRows > 0,
      affectedRows: result.affectedRows
    }
  } catch (error) {
    console.error('사용자 업데이트 실패:', error)
    throw error
  }
}

// 사용자 삭제
async function deleteUser(userId) {
  try {
    const [result] = await pool.execute(
      'DELETE FROM users WHERE id = ?',
      [userId]
    )
    
    return {
      success: result.affectedRows > 0,
      affectedRows: result.affectedRows
    }
  } catch (error) {
    console.error('사용자 삭제 실패:', error)
    throw error
  }
}

// 모든 사용자 조회
async function getAllUsers() {
  try {
    const [rows] = await pool.execute(
      'SELECT id, email, full_name, phone FROM users ORDER BY id DESC'
    )
    return rows
  } catch (error) {
    console.error('사용자 목록 조회 실패:', error)
    throw error
  }
}

// 사용자 수 조회
async function getUserCount() {
  try {
    const [rows] = await pool.execute(
      'SELECT COUNT(*) as count FROM users'
    )
    return rows[0].count
  } catch (error) {
    console.error('사용자 수 조회 실패:', error)
    throw error
  }
}

// 비밀번호 검증 (로그인용)
async function verifyPassword(email, password) {
  try {
    const user = await findUserByEmail(email)
    if (!user) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' }
    }
    
    // 실제로는 bcrypt.compare를 사용해야 합니다
    // const bcrypt = require('bcrypt')
    // const isValid = await bcrypt.compare(password, user.password)
    
    // 임시로 직접 비교 (테스트용)
    const isValid = password === user.password
    
    if (isValid) {
      return { 
        success: true, 
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          phone: user.phone
        }
      }
    } else {
      return { success: false, message: '비밀번호가 일치하지 않습니다.' }
    }
  } catch (error) {
    console.error('비밀번호 검증 실패:', error)
    throw error
  }
}

// 연결 풀 종료 함수
async function closePool() {
  try {
    await pool.end()
    console.log('🔒 데이터베이스 연결 풀이 종료되었습니다.')
  } catch (error) {
    console.error('❌ 연결 풀 종료 실패:', error)
  }
}

// 모든 함수 내보내기
module.exports = {
  pool,
  createConnection,
  testConnection,
  findUserByEmail,
  findUserById,
  createUser,
  updateUser,
  deleteUser,
  getAllUsers,
  getUserCount,
  verifyPassword,
  closePool,
  dbConfig
}