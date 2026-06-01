## API 명세서

### 개요
- **Base URL**: `http://<host>:3001`
- **API Prefix**: `/api`
- **공통 응답 포맷**
  - 성공: `{ success: true, ... }`
  - 실패: `{ success: false, message?: string, error?: string }`
- **상태 코드**: 200, 201, 400, 401, 404, 500
- **인증**: 일부 요청에서 `Authorization: Bearer <token>` 헤더 사용 가능(강제 검증 없음)

### MongoDB 필수(채팅)
- 채팅 대화/메시지는 MongoDB에 저장됩니다. MongoDB가 실행/연결되지 않으면 채팅 관련 API와 메시지 저장이 실패합니다.
- 환경 변수
```bash
# backend/server/.env 예시
MONGODB_URI=mongodb://127.0.0.1:27017/pet_buddy
# 필요 시 DB 이름 별도 지정
# MONGODB_DB=pet_buddy
```
- Windows에서 빠른 실행(Docker 사용)
```bash
docker run -d --name pet-mongo -p 27017:27017 -v mongo-data:/data/db mongo:6
```
- 연결 확인
  - 서버 로그에 "🍃 MongoDB 연결 완료" 문구 확인
  - 이후 다음 요청이 정상 동작해야 합니다:
    - `POST /api/conversations` → 대화 생성/보장
    - `GET /api/conversations?userId=<id>` → 대화 목록 조회
    - Socket.IO `message:send` 후 MongoDB `messages` 컬렉션에 문서 생성

### 헬스체크
- GET `/`
  - 서버 동작 여부와 대표 엔드포인트 맵 반환

### Auth
| 메서드 | 경로 | 설명 |
| - | - | - |
| POST | `/api/auth/login` | 이메일/비밀번호 로그인 |
| POST | `/api/auth/register` | 회원가입 |

#### 요청/응답
```json
// POST /api/auth/login
{ "email": "user@example.com", "password": "secret" }
// 200
{ "success": true, "data": { "user": { "id": "string|number", "email": "user@example.com", "fullName": "string", "phone": "string|null" }, "token": "dev-token" } }
```
```json
// POST /api/auth/register
{ "email": "user@example.com", "password": "secret", "phone_number": "010-0000-0000" }
// 200
{ "success": true, "data": { "user": { "id": "string|number", "email": "user@example.com", "fullName": "user", "phone": "010-0000-0000" }, "token": "dev-token" } }
```

### Dogs
| 메서드 | 경로 | 설명 |
| - | - | - |
| GET | `/api/dogs/user/:userId` | 사용자의 반려견 목록 조회 |
| POST | `/api/dogs` | 반려견 등록 |
| DELETE | `/api/dogs/:dogId?user_id=<ownerId>` | 반려견 삭제(소유자 확인 쿼리 필요) |

#### 요청/응답
```json
// POST /api/dogs
{ "user_id": "owner-id", "name": "Coco", "profile_image_url": "https://...", "breed": "Poodle", "personality": "Friendly", "birth_date": "2020-01-01", "special_notes": "Allergic" }
// 200
{ "success": true, "dog": { "id": "dog-id", "user_id": "owner-id", "name": "Coco", "profile_image_url": "...", "breed": "Poodle", "personality": "Friendly", "birth_date": "2020-01-01", "special_notes": "Allergic" } }
```

#### 사진 업로드/형식
- `profile_image_url` 필드는 다음 형식을 지원합니다.
  - 원격 URL(S3 등): `https://...`
  - Data URI(Base64): `data:image/jpeg;base64,<...>` — 모바일에서 카메라 촬영/앨범 선택 이미지에 사용 가능
- 대용량 업로드가 필요한 경우 `Uploads` 섹션의 사전서명 URL 발급 후 S3에 PUT 업로드한 뒤, 반환된 공개 URL을 `profile_image_url`로 전달하는 방식을 권장합니다.

### Sitter Postings
| 메서드 | 경로 | 설명 |
| - | - | - |
| GET | `/api/sitter-postings` | 활성 시터 공고 목록 |
| POST | `/api/sitter-postings` | 시터 공고 생성 |
| POST | `/api/sitter-postings/:postId/close` | 시터 공고 비활성화(닫기) |

#### 요청/응답
```json
// POST /api/sitter-postings
{ "sitter_id": "sitter-id", "title": "Weekday evenings", "description": "Small dogs", "location": "Seoul", "available_from": "2025-08-01", "available_to": "2025-08-31", "status": "active" }
// 200
{ "success": true, "post_id": "post-id" }
```

### Owner Jobs
| 메서드 | 경로 | 설명 |
| - | - | - |
| GET | `/api/jobs` | 활성 견주 공고 목록 |
| POST | `/api/jobs` | 견주 공고 생성 |
| DELETE | `/api/jobs/:jobId` | 견주 공고를 `closed` 상태로 변경 |

#### 요청/응답
```json
// POST /api/jobs
{ "owner_id": "owner-id", "dog_id": "dog-id", "title": "Weekend sitter", "description": "2 nights", "location": "Busan", "start_date": "2025-08-10", "end_date": "2025-08-12", "status": "active" }
// 200
{ "success": true, "job_id": "job-id" }
```

### Bookings
| 메서드 | 경로 | 설명 |
| - | - | - |
| GET | `/api/bookings/owner/:ownerId` | 견주 예약 목록(가까운 시간 순) |
| POST | `/api/bookings` | 예약 생성(대화방 자동 보장, 원본 공고 닫기 시도) |

#### 요청/응답
```json
// POST /api/bookings
{ "owner_id": "owner-id", "sitter_id": "sitter-id", "dog_id": "dog-id", "start_time": "2025-08-15T09:00:00Z", "end_time": "2025-08-15T12:00:00Z", "source_post_id": "optional-post-id" }
// 200
{ "success": true, "booking_id": "booking-id" }
```

### Conversations (REST)
| 메서드 | 경로 | 설명 |
| - | - | - |
| POST | `/api/conversations` | 참가자 배열로 대화 생성/보장 |
| GET | `/api/conversations?userId=<id>` | 사용자의 대화 목록 |
| DELETE | `/api/conversations/:conversationId` | 대화 삭제(관련 메시지 제거) |
| GET | `/api/conversations/:conversationId/messages?before=<ISO>&limit=<n>` | 대화 메시지 조회(최신→과거, 반환은 시간순) |

#### 요청/응답
```json
// POST /api/conversations
{ "participantIds": ["owner-id", "sitter-id"] }
// 200
{ "success": true, "data": { "conversationId": "conv-id", "participants": ["owner-id", "sitter-id"], "lastMessageText": "", "lastMessageAt": "1970-01-01T00:00:00.000Z" } }
```
```json
// GET /api/conversations?userId=<id>
// 200
{ "success": true, "data": [ { "id": "conv-id", "participants": ["owner-id","sitter-id"], "otherId": "sitter-id", "otherEmail": "other@example.com|null", "otherFullName": "string|null", "lastMessageSenderName": "string|null", "displayName": "string|null", "lastMessageText": "string", "lastMessageAt": "2025-08-10T10:00:00.000Z" } ] }
```

### Uploads
| 메서드 | 경로 | 설명 |
| - | - | - |
| POST | `/api/uploads/sign` | S3 업로드용 사전서명 URL 발급 |

#### 요청/응답
```json
// POST /api/uploads/sign
{ "fileName": "photo.jpg", "contentType": "image/jpeg" }
// 200
{ "success": true, "uploadUrl": "https://s3-...", "key": "uploads/1690000000000_photo.jpg" }
```

#### 모바일 사진 입력(클라이언트 참고)
- 클라이언트(Expo/React Native)는 사진첩 선택과 카메라 촬영을 모두 지원합니다.
- 촬영/선택된 이미지는 Base64(Data URI)로 `profile_image_url`에 직접 전송하거나, `uploads/sign`으로 S3 URL을 받아 업로드 후 해당 URL을 전송할 수 있습니다.

### 실시간 채팅 (Socket.IO)
- 네임스페이스: 기본(`/`), CORS: 모든 오리진 허용
- 이벤트
  - 클라이언트 → 서버
    - `user:join` `{ ...userData }`
    - `conversation:join` `conversationId`
    - `conversation:leave` `conversationId`
    - `message:send` `{ conversationId, message, senderId, senderName, type: "text"|"image"|"file", imageUri?, fileName?, fileSize? }`
    - `message:read` `{ conversationId, messageId, userId }`
    - `typing:start` `{ conversationId, userId, userName }`
    - `typing:stop` `{ conversationId, userId }`
  - 서버 → 클라이언트
    - `messages:history` `[message]` (입장 시 히스토리)
    - `message:received` `{ id, conversationId, senderId, senderName, type, content, imageUri?, fileName?, fileSize?, createdAt }`
    - `message:error` `{ error }`
    - `message:read_updated` `{ messageId, readBy }`
    - `typing:user_started` `{ userId, userName }`
    - `typing:user_stopped` `{ userId }`

### 데이터 모델
- `Conversation`
  - `participants: string[]`, `lastMessageText?: string`, `lastMessageAt?: Date`, `lastMessageSenderName?: string`, `timestamps`
- `Message`
  - `conversationId: string`, `senderId: string`, `senderName?: string`, `type: 'text'|'image'|'file'`, `content?: string`, `imageUri?: string`, `fileName?: string`, `fileSize?: number`, `readBy: [{ userId, readAt }]`, `timestamps`

### 참고
- 프론트엔드 `apiService`는 실행 환경에 따라 자동으로 Base URL 후보를 생성하고 헬스체크 후 `/api` 프리픽스에 요청합니다.


