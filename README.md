<div align="center">

# 🐾 PetBuddy

**AI 기반 펫시터 매칭 플랫폼**

반려견 사진 한 장으로 성격을 분석하고, 딱 맞는 펫시터를 찾아드립니다.

<br/>

![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazonaws&logoColor=white)

</div>

---

## 📖 소개

PetBuddy는 견주와 펫시터를 연결하는 AI 기반 매칭 플랫폼입니다.

반려견 사진을 업로드하면 **AWS Rekognition** 커스텀 모델이 견종을 자동 감지하고, 견종별 특성 데이터를 바탕으로 **댕BTI(DangBTI)** 성격 유형을 자동으로 배정합니다. 견주는 댕BTI를 바탕으로 반려견과 잘 맞는 펫시터를 찾을 수 있고, 펫시터는 케어할 강아지의 특성을 미리 파악할 수 있습니다.

---

## ✨ 주요 기능

### 🤖 AI 견종 분석 & 댕BTI
- 사진 업로드 → AWS Rekognition 견종 감지 → 댕BTI 성격 유형 자동 배정
- MBTI 스타일의 4자리 코드로 반려견의 성격, 케어 팁, 건강 주의사항 제공
- SQS 기반 비동기 처리로 분석 결과를 논블로킹으로 반환

### 🔍 양방향 매칭 시스템
- **견주**: 펫시팅 구인 글 등록, 펫시터 프로필 탐색
- **펫시터**: 케어 가능 일정 등록, 견주 구인 글 탐색
- 예약 생성 시 채팅방 자동 개설

### 💬 실시간 채팅
- Socket.IO 기반 양방향 메시지 (텍스트 · 이미지 · 파일)
- 타이핑 인디케이터, 읽음 처리
- MongoDB 메시지 영구 저장

### 📅 예약 관리
- 견주 · 펫시터 · 반려견 3자 연결 예약
- 예약 상태 및 일정 관리

---

## 🏗️ 아키텍처

```
petbuddy/
├── frontend/pet-buddy-ui/   # React Native (Expo) 모바일 앱
├── backend/server/          # Node.js / Express REST API + Socket.IO
└── sqs-worker/              # AWS SQS 기반 AI 분석 백그라운드 워커
```

### 서비스 흐름

```
[모바일 앱]
    │
    ├── REST API ──────────────▶ [Express Server]
    │                                │
    ├── Socket.IO ─────────────▶     ├── MySQL  (유저, 예약, 구인글)
    │                                └── MongoDB (채팅, 메시지)
    │
    └── 이미지 업로드 ──────────▶ [AWS S3]
                                      │
                               [AWS SQS Queue]
                                      │
                               [SQS Worker]
                                      │
                               [AWS Rekognition]  ← 커스텀 견종 감지 모델
                                      │
                               견종 · 댕BTI → MySQL 업데이트
```

---

## 🛠️ 기술 스택

### Frontend
| 분류 | 기술 |
|------|------|
| Framework | React Native 0.79 + Expo 53 |
| Language | TypeScript |
| 상태 관리 | Zustand 5 + AsyncStorage |
| 서버 상태 | TanStack React Query 5 |
| 네비게이션 | React Navigation (Stack + Bottom Tabs) |

### Backend
| 분류 | 기술 |
|------|------|
| Runtime | Node.js |
| Framework | Express 5 |
| 실시간 통신 | Socket.IO 4 |
| 관계형 DB | MySQL 2 (유저 · 예약 · 포스팅) |
| 문서형 DB | MongoDB / Mongoose (채팅 · 메시지) |
| 인증 | JWT + bcryptjs |

### Infrastructure
| 분류 | 기술 |
|------|------|
| 이미지 저장 | AWS S3 |
| 비동기 큐 | AWS SQS |
| AI 분석 | AWS Rekognition (커스텀 모델) |
| 파일 업로드 | Multer + Presigned URL |

---

## 🚀 실행 방법

### 사전 요구사항
- Node.js 18+
- MySQL, MongoDB
- AWS 계정 (S3, SQS, Rekognition)

### 1. 백엔드

```bash
cd backend/server
npm install
cp .env.example .env   # 환경변수 설정
npm start
```

<details>
<summary>.env 설정 항목</summary>

```env
DB_HOST=
DB_PORT=
DB_USER=
DB_PASSWORD=
DB_NAME=

JWT_SECRET=

AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
S3_BUCKET=

MONGODB_URI=
PORT=3001
```
</details>

### 2. SQS 워커

```bash
cd sqs-worker
npm install
cp .env.example .env   # AWS 및 DB 설정
node worker.js
```

### 3. 프론트엔드

```bash
cd frontend/pet-buddy-ui
npm install
npx expo start
```

> iOS 시뮬레이터: `i` / Android 에뮬레이터: `a`

### 전체 동시 실행 (루트)

```bash
npm run dev
```

---

## 📁 주요 파일 구조

```
backend/server/
├── server.js                   # Express 서버 진입점 + Socket.IO 핸들러
├── config/database-minimal.js  # MySQL 쿼리 레이어
├── models/
│   ├── Conversation.js         # MongoDB 대화 스키마
│   └── Message.js              # MongoDB 메시지 스키마
└── db/mongo.js                 # MongoDB 연결

frontend/pet-buddy-ui/src/
├── navigation/AppNavigator.tsx # 앱 네비게이션 (역할별 분기)
├── screens/
│   ├── owner/                  # 견주 화면
│   └── sitter/                 # 펫시터 화면
├── store/
│   ├── auth.ts                 # 인증 상태 (Zustand)
│   ├── chat.ts                 # 채팅 상태 (Zustand)
│   └── dogs.ts                 # 반려견 상태 (Zustand)
└── services/
    ├── api.ts                  # API 클라이언트
    └── auth.ts                 # 인증 서비스

sqs-worker/
└── worker.js                   # SQS 리스너 + Rekognition 분석 + DB 업데이트
```

---

