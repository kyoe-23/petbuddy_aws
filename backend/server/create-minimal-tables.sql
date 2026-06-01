-- 펫 버디(Pet Buddy) 앱 최소 기능 테이블 설계
-- 기존 테이블 삭제 (필요시)
-- DROP TABLE IF EXISTS bookings;
-- DROP TABLE IF EXISTS dogs;
-- DROP TABLE IF EXISTS sitters;
-- DROP TABLE IF EXISTS users;

-- 1. 사용자 (Users) 테이블
CREATE TABLE IF NOT EXISTS users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. 시터 프로필 (Sitters) 테이블
CREATE TABLE IF NOT EXISTS sitters (
    sitter_id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNIQUE NOT NULL,
    self_introduction TEXT,
    total_earnings DECIMAL(15, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

-- 3. 반려견 (Dogs) 테이블
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
);

-- 4. 예약/일정 (Bookings) 테이블
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
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_sitters_user_id ON sitters(user_id);
CREATE INDEX idx_dogs_user_id ON dogs(user_id);
CREATE INDEX idx_bookings_owner ON bookings(owner_user_id);
CREATE INDEX idx_bookings_sitter ON bookings(sitter_user_id);
CREATE INDEX idx_bookings_status ON bookings(booking_status);
CREATE INDEX idx_bookings_time ON bookings(start_time, end_time);

-- 샘플 데이터 삽입 (테스트용)
-- INSERT INTO users (email, password_hash, phone_number) VALUES 
-- ('owner1@test.com', 'hashed_password_1', '010-1111-1111'),
-- ('sitter1@test.com', 'hashed_password_2', '010-2222-2222'),
-- ('owner2@test.com', 'hashed_password_3', '010-3333-3333');

-- INSERT INTO sitters (user_id, self_introduction, total_earnings) VALUES 
-- (2, '안녕하세요! 5년 경력의 전문 펫시터입니다. 강아지를 정말 사랑하며, 안전하고 즐거운 돌봄을 제공합니다.', 150000.00);

-- INSERT INTO dogs (user_id, name, profile_image_url, breed, personality, birth_date, special_notes) VALUES 
-- (1, '멍멍이', 'https://example.com/dog1.jpg', '골든 리트리버', '온순하고 활발함', '2020-05-15', '산책을 매우 좋아하며, 다른 강아지들과 잘 어울립니다.'),
-- (3, '코코', 'https://example.com/dog2.jpg', '푸들', '조용하고 영리함', '2021-08-20', '털 알레르기가 있어서 특정 샴푸만 사용해야 합니다.');

-- INSERT INTO bookings (owner_user_id, sitter_user_id, dog_id, booking_status, start_time, end_time) VALUES 
-- (1, 2, 1, 'confirmed', '2024-01-15 09:00:00', '2024-01-15 18:00:00'),
-- (3, 2, 2, 'requested', '2024-01-20 10:00:00', '2024-01-20 16:00:00');

