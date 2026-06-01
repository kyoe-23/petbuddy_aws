# Pet Buddy Backend Server

반려견 견주와 시터를 매칭하는 Pet Buddy 앱의 백엔드 서버입니다.

## 🏗️ 아키텍처

### 현재 구성
- **Node.js** + **Express.js**
- **Socket.IO** (실시간 채팅)
- **AWS DynamoDB** (메시지 저장 - 선택사항)
- **AWS S3** (이미지 및 파일 저장)
- **메모리 기반 데이터 저장** (임시)

### 기술 스택
- **Node.js** + **Express.js**
- **Socket.IO** (실시간 채팅)
- **JWT** (인증)
- **bcryptjs** (비밀번호 해싱)

## 🚀 현재 사용 가능한 기능

### 기본 서버
- `GET /` - 서버 상태 확인

### 채팅 (`Socket.IO`)
- `user:join` - 사용자 정보 등록
- `conversation:join` - 채팅방 입장
- `message:send` - 메시지 전송
- `message:read` - 메시지 읽음 처리
- `typing:start/stop` - 타이핑 상태

### 파일 업로드 (AWS S3)
- `POST /api/uploads/sign` - S3 사전서명 URL 발급

### 메시지 히스토리
- `GET /api/conversations/:conversationId/messages` - 대화방 메시지 조회

## 🔧 설치 및 실행

### 1. 의존성 설치
```bash
cd backend/server
npm install
```

### 2. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

## 🌟 주요 기능

### 📱 실시간 채팅
- Socket.IO 기반 실시간 메시징
- 읽음 상태 표시
- 타이핑 인디케이터
- 이미지/파일 전송

### ☁️ 클라우드 연동
- AWS S3 파일 업로드
- AWS DynamoDB 메시지 저장 (선택사항)

## 📈 개발 예정 기능

- [ ] 사용자 인증 시스템
- [ ] 강아지 프로필 관리
- [ ] 시터 매칭 시스템
- [ ] 예약 관리
- [ ] 결제 시스템 연동
- [ ] Push 알림 서비스
- [ ] AI 품종 분석

## 🔐 보안

- JWT 토큰 기반 인증 (준비됨)
- bcrypt 비밀번호 해싱 (준비됨)
- CORS 설정
- 입력 데이터 검증

## 🐛 문제 해결

### Socket.IO 연결 실패
1. CORS 설정 확인
2. 포트 충돌 확인
3. 방화벽 설정 확인

---

**Pet Buddy Team** 🐾

## 🗂️ 프로젝트 상태

✅ **완료된 작업:**
- 기본 Express 서버 설정
- Socket.IO 실시간 채팅 기능
- AWS S3 파일 업로드 준비
- CORS 설정

🚧 **진행 중:**
- 새로운 데이터베이스 설계
- API 엔드포인트 재구성

📋 **다음 단계:**
- 데이터베이스 선택 및 설정
- 사용자 인증 시스템 구현
- API 라우트 재작성