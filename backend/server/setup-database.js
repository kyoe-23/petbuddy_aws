const mysql = require('mysql2/promise');

// 데이터베이스 연결 설정
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'root',  // 기본 비밀번호 시도
  database: 'pet_buddy',
  port: 3307,
  charset: 'utf8mb4'
};

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🔍 데이터베이스 연결 중...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('✅ MySQL 연결 성공!');
    
    // 1. Users 테이블 생성
    console.log('📋 Users 테이블 생성 중...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        user_id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Users 테이블 생성 완료');
    
    // 2. Sitters 테이블 생성
    console.log('📋 Sitters 테이블 생성 중...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sitters (
        sitter_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT UNIQUE NOT NULL,
        self_introduction TEXT,
        total_earnings DECIMAL(15, 2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Sitters 테이블 생성 완료');
    
    // 3. Dogs 테이블 생성
    console.log('📋 Dogs 테이블 생성 중...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS dogs (
        dog_id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(50) NOT NULL,
        profile_image_url VARCHAR(255),
        breed VARCHAR(100),
        personality TEXT,
        birth_date DATE,
        special_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Dogs 테이블 생성 완료');
    
    // 4. Bookings 테이블 생성
    console.log('📋 Bookings 테이블 생성 중...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS bookings (
        booking_id INT PRIMARY KEY AUTO_INCREMENT,
        owner_user_id INT NOT NULL,
        sitter_user_id INT NOT NULL,
        dog_id INT NOT NULL,
        booking_status ENUM('requested', 'confirmed', 'completed', 'rejected', 'cancelled') NOT NULL DEFAULT 'requested',
        start_time DATETIME NOT NULL,
        end_time DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (owner_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (sitter_user_id) REFERENCES users(user_id) ON DELETE CASCADE,
        FOREIGN KEY (dog_id) REFERENCES dogs(dog_id) ON DELETE CASCADE
      )
    `);
    console.log('✅ Bookings 테이블 생성 완료');
    
    // 인덱스 생성
    console.log('📋 인덱스 생성 중...');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_sitters_user_id ON sitters(user_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_dogs_user_id ON dogs(user_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_bookings_owner ON bookings(owner_user_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_bookings_sitter ON bookings(sitter_user_id)');
    await connection.execute('CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status)');
    console.log('✅ 인덱스 생성 완료');
    
    // 테이블 확인
    console.log('\n📊 생성된 테이블 확인:');
    const [tables] = await connection.execute('SHOW TABLES');
    tables.forEach(table => {
      console.log(`  - ${Object.values(table)[0]}`);
    });
    
    console.log('\n🎉 데이터베이스 설정 완료!');
    
  } catch (error) {
    console.error('❌ 데이터베이스 설정 실패:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔒 데이터베이스 연결 종료');
    }
  }
}

// 스크립트 실행
setupDatabase();
