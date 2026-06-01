require('dotenv').config()
console.log('[boot] server.js loaded')
process.on('beforeExit', (code) => console.log('[lifecycle] beforeExit', code))
process.on('exit', (code) => console.log('[lifecycle] exit', code))
process.on('uncaughtException', (err) => { console.error('[lifecycle] uncaughtException', err); process.exit(1) })
process.on('unhandledRejection', (reason) => { console.error('[lifecycle] unhandledRejection', reason) })
const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner')
const { connectMongo } = require('./db/mongo')
const Conversation = require('./models/Conversation')
const Message = require('./models/Message')

// 라우터 import (최소 기능용 DB 직접 사용)
const {
  testConnection,
  ensureDogsSchema,
  findUserByEmail,
  createUser,
  createDog,
  getDogsByUserId,
  deleteDogByIdOwner,
  createSitterPosting,
  getAllSitters,
  getSitterByUserId,
  getBookingsByOwnerId,
  getBookingsBySitterId,
  createBooking,
  createJobPosting,
  getAllActiveOwnerJobs,
  updateJobPostingStatus,
  pool,
} = require('./config/database-minimal')

const app = express()
console.log('[boot] express created')
const server = http.createServer(app)

// CORS 설정
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}))

const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

// AWS 클라이언트 설정
const REGION = process.env.AWS_REGION || 'ap-northeast-2'
const MESSAGES_TABLE = process.env.MESSAGES_TABLE || 'PetBuddyMessages'
const s3Bucket = process.env.S3_BUCKET || 'pet-buddy-uploads'
const s3Prefix = process.env.S3_UPLOAD_PREFIX || 'uploads'

const s3Config = {
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  }
}

const s3 = new S3Client(s3Config)

console.log('🔧 S3 설정:', {
  region: REGION,
  bucket: s3Bucket,
  hasCredentials: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY)
})

// Base64 이미지를 S3에 업로드하는 함수
async function uploadBase64ToS3(base64Data, fileName) {
  try {
    // data:image/jpeg;base64,/9j/4AAQ... 형태에서 base64 부분만 추출
    const base64Match = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/)
    if (!base64Match) {
      throw new Error('Invalid base64 format')
    }
    
    const contentType = base64Match[1]
    const base64Content = base64Match[2]
    const buffer = Buffer.from(base64Content, 'base64')
    
    const key = `${s3Prefix}/${Date.now()}_${fileName || 'photo.jpg'}`
    const command = new PutObjectCommand({
      Bucket: s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
    
    await s3.send(command)
    const publicUrl = `https://${s3Bucket}.s3.${REGION}.amazonaws.com/${key}`
    
    console.log('✅ S3 업로드 성공:', publicUrl)
    return publicUrl
  } catch (error) {
    console.error('❌ S3 업로드 실패:', error)
    throw error
  }
}

// 로컬 캐시(선택): 최근 대화방 메시지 캐시 (Mongo로 이전해도 핫 캐시로 유지 가능)
const messageHistory = new Map()
const activeUsers = new Map()

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 요청 로깅 미들웨어 (간소화)
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`)
  next()
})

// === 최소 기능 Auth ===
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {}
  try {
    if (!email || !password) return res.status(400).json({ success: false, message: '이메일/비밀번호 필요' })
    const user = await findUserByEmail(email)
    if (!user) return res.status(401).json({ success: false, message: '사용자를 찾을 수 없습니다.' })

    const stored = user.password_hash ?? user.password ?? ''
    let isMatch = false
    try {
      // bcrypt 해시 형태면 비교, 아니면 문자열 비교
      if (typeof stored === 'string' && stored.startsWith('$2')) {
        isMatch = await bcrypt.compare(String(password), stored)
      } else {
        isMatch = String(stored) === String(password)
      }
    } catch (_) {
      isMatch = String(stored) === String(password)
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: '비밀번호 불일치' })
    }

    return res.json({ success: true, data: { user: { id: user.id || user.user_id, email: user.email, fullName: user.full_name || user.email.split('@')[0], phone: user.phone || user.phone_number }, token: 'dev-token' } })
  } catch (e) {
    console.error('login error', e)
    res.status(500).json({ success: false, message: '로그인 실패' })
  }
})

app.post('/api/auth/register', async (req, res) => {
  const { email, password, phone_number } = req.body || {}
  try {
    if (!email || !password) return res.status(400).json({ success: false, message: '이메일/비밀번호 필요' })
    const exist = await findUserByEmail(email)
    if (exist) return res.status(400).json({ success: false, message: '이미 존재하는 이메일입니다.' })
    // DB 스키마에 따라 password_hash 또는 password 컬럼로 저장됩니다
    const result = await createUser({ email, password_hash: password, phone_number: phone_number || null })
    return res.json({ success: true, data: { user: { id: result.userId, email, fullName: email.split('@')[0], phone: phone_number || null }, token: 'dev-token' } })
  } catch (e) {
    console.error('register error', e)
    res.status(500).json({ success: false, message: e?.message || '회원가입 실패' })
  }
})

// === Dogs ===
app.get('/api/dogs/user/:userId', async (req, res) => {
  try {
    console.log('🔍 Fetching dogs for user:', req.params.userId)
    const dogs = await getDogsByUserId(req.params.userId)
    console.log('📤 Returning dogs:', dogs.map(dog => ({ id: dog.id, name: dog.name, dbti: dog.dbti })))
    res.json({ success: true, dogs })
  } catch (e) {
    console.error('dogs list error', e)
    res.status(500).json({ success: false, message: '강아지 조회 실패' })
  }
})

app.post('/api/dogs', async (req, res) => {
  const { user_id, name, profile_image_url, breed, personality, dbti, birth_date, special_notes } = req.body || {}
  if (!user_id || !name) {
    return res.status(400).json({ success: false, message: '필수 필드 누락 (user_id, name)' })
  }
  try {
    console.log('🐶 강아지 등록 요청:', { user_id, name, breed, personality, dbti, birth_date, hasPhoto: !!profile_image_url })
    
    let finalImageUrl = profile_image_url
    
    // base64 이미지가 있으면 S3에 업로드 (AWS 자격증명이 있을 때만)
    if (profile_image_url && profile_image_url.startsWith('data:')) {
      console.log('📸 base64 이미지 감지됨')
      if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
        console.log('📸 S3 업로드 시작...')
        try {
          finalImageUrl = await uploadBase64ToS3(profile_image_url, `${name}_${Date.now()}.jpg`)
          console.log('✅ 이미지 업로드 완료:', finalImageUrl)
        } catch (uploadError) {
          console.error('❌ 이미지 업로드 실패:', uploadError)
          // 이미지 업로드 실패해도 강아지 등록은 계속 진행 (base64 그대로 사용)
          finalImageUrl = profile_image_url
        }
      } else {
        console.log('⚠️ AWS 자격증명 없음, base64 이미지 그대로 사용')
        finalImageUrl = profile_image_url
      }
    }
    
    const result = await createDog({ user_id, name, profile_image_url: finalImageUrl, breed, personality, dbti, birth_date, special_notes })
    res.json({ success: true, data: { id: result.dogId, user_id, name, profile_image_url: finalImageUrl, breed, personality, dbti, birth_date, special_notes } })
  } catch (e) {
    console.error('dog create error', e)
    res.status(500).json({ success: false, message: e?.message || '반려견 등록 실패' })
  }
})

// 강아지 정보 업데이트 API
app.patch('/api/dogs/:dogId', async (req, res) => {
  const { dogId } = req.params
  const { user_id, name, breed, personality, dbti, notes } = req.body || {}
  
  if (!dogId || !user_id) {
    return res.status(400).json({ success: false, message: '필수 필드 누락 (dogId, user_id)' })
  }
  
  try {
    console.log('🔄 Updating dog:', { dogId, user_id, name, breed, dbti })

    const updates = []
    const values = []

    if (name) { updates.push('name = ?'); values.push(name) }
    if (breed) { updates.push('breed = ?'); values.push(breed) }
    if (personality) { updates.push('personality = ?'); values.push(personality) }
    if (dbti) { updates.push('dbti = ?'); values.push(dbti) }
    if (notes !== undefined) { updates.push('notes = ?'); values.push(notes) }
    
    if (updates.length > 0) {
      values.push(dogId, user_id)
      const query = `UPDATE dogs SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ? AND owner_id = ?`
      const [result] = await pool.execute(query, values)
      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: '강아지를 찾을 수 없습니다' })
      }
      console.log('✅ Dog updated successfully')
    }
    
    res.json({ success: true, message: '강아지 정보가 업데이트되었습니다' })
  } catch (e) {
    console.error('dog update error', e)
    res.status(500).json({ success: false, message: '강아지 정보 업데이트 실패' })
  }
})

app.delete('/api/dogs/:dogId', async (req, res) => {
  const { dogId } = req.params
  const { user_id } = req.query
  if (!dogId || !user_id) return res.status(400).json({ success: false, message: '필수 필드 누락 (dogId, user_id)' })
  try {
    const result = await deleteDogByIdOwner(dogId, String(user_id))
    if (result.success) return res.json({ success: true })
    return res.status(404).json({ success: false, message: '대상 없음' })
  } catch (e) {
    console.error('dog delete error', e)
    res.status(500).json({ success: false, message: '반려견 삭제 실패' })
  }
})

// === Sitter postings ===
app.get('/api/sitter-postings', async (_req, res) => {
  try {
    // 활성 공고만 반환
    const [rows] = await pool.execute(`SELECT * FROM sitter_postings WHERE status = 'active' ORDER BY created_at DESC`)
    res.json({ success: true, posts: rows })
  } catch (e) {
    console.error('sitter postings list error', e)
    res.status(500).json({ success: false, message: '시터 공고 목록 조회 실패' })
  }
})

// 시터 공고 비활성화(예약 후 숨김)
app.post('/api/sitter-postings/:postId/close', async (req, res) => {
  const { postId } = req.params
  try {
    const [result] = await pool.execute(`UPDATE sitter_postings SET status='closed' WHERE post_id = ?`, [postId])
    return res.json({ success: (result.affectedRows ?? 0) > 0 })
  } catch (e) {
    console.error('sitter posting close error', e)
    res.status(500).json({ success: false, message: '시터 공고 상태 변경 실패' })
  }
})

// === Owner jobs ===
app.get('/api/jobs', async (_req, res) => {
  try {
    const jobs = await getAllActiveOwnerJobs()
    res.json({ success: true, jobs })
  } catch (e) {
    console.error('jobs list error', e)
    res.status(500).json({ success: false, message: '공고 목록 조회 실패' })
  }
})

app.post('/api/jobs', async (req, res) => {
  const { owner_id, dog_id, title, description, location, start_date, end_date, status } = req.body || {}
  if (!owner_id || !dog_id || !title || !start_date || !end_date) {
    return res.status(400).json({ success: false, message: '필수 필드 누락 (owner_id, dog_id, title, start_date, end_date)' })
  }
  try {
    const result = await createJobPosting({ owner_id, dog_id, title, description, location, start_date, end_date, status })
    res.json({ success: true, data: { job_id: result.jobId } })
  } catch (e) {
    console.error('job create error', e)
    res.status(500).json({ success: false, message: '공고 생성 실패' })
  }
})

app.delete('/api/jobs/:jobId', async (req, res) => {
  const { jobId } = req.params
  try {
    const result = await updateJobPostingStatus(jobId, 'closed')
    if (result.success) return res.json({ success: true })
    return res.status(404).json({ success: false, message: '대상 없음' })
  } catch (e) {
    console.error('job delete error', e)
    res.status(500).json({ success: false, message: '공고 취소 실패' })
  }
})
app.post('/api/sitter-postings', async (req, res) => {
  const { sitter_id, title, description, location, available_from, available_to, status } = req.body || {}
  if (!sitter_id || !title || !available_from || !available_to) {
    return res.status(400).json({ success: false, message: '필수 필드 누락 (sitter_id, title, available_from, available_to)' })
  }
  try {
    const result = await createSitterPosting({ sitter_id, title, description, location, available_from, available_to, status })
    res.json({ success: true, data: { post_id: result.postId } })
  } catch (e) {
    console.error('sitter posting create error', e)
    res.status(500).json({ success: false, message: e?.message || '시터 공고 생성 실패' })
  }
})

// === AI 품종 분석 ===
app.post('/api/dogs/:dogId/analyze-breed', async (req, res) => {
  const { dogId } = req.params;
  const { imageUrl } = req.body;
  
  if (!dogId || !imageUrl) {
    return res.status(400).json({ 
      success: false, 
      error: '필수 파라미터가 누락되었습니다. (dogId, imageUrl)' 
    });
  }

  try {
    console.log(`🤖 AI 품종 분석 요청: dogId=${dogId}, imageUrl=${imageUrl}`);
    
    // AWS Lambda 함수 호출
    const AWS = require('aws-sdk');
    const lambda = new AWS.Lambda({
      region: process.env.AWS_REGION || 'ap-northeast-2'
    });

    // Lambda 함수에 전달할 페이로드
    const lambdaPayload = {
      file_name: `temp_analysis_${Date.now()}.jpg`,
      dog_id: dogId,
      user_id: 'temp-user',
      image_data: imageUrl // Base64 이미지 데이터
    };

    console.log('🚀 Lambda 함수 호출 중...');
    
    const lambdaParams = {
      FunctionName: process.env.LAMBDA_FUNCTION_NAME || 'pet_breed_analyzer',
      Payload: JSON.stringify(lambdaPayload)
    };

    const lambdaResult = await lambda.invoke(lambdaParams).promise();
    
    if (lambdaResult.StatusCode === 200) {
      const responsePayload = JSON.parse(lambdaResult.Payload);
      
      if (responsePayload.statusCode === 200) {
        const analysisResult = JSON.parse(responsePayload.body);
        console.log('✅ Lambda 함수 실행 성공:', analysisResult);
        
        res.json({
          success: true,
          data: analysisResult
        });
      } else {
        console.error('❌ Lambda 함수 오류:', responsePayload);
        throw new Error(responsePayload.body || 'Lambda 함수 실행 실패');
      }
    } else {
      throw new Error(`Lambda 함수 호출 실패: StatusCode ${lambdaResult.StatusCode}`);
    }

  } catch (error) {
    console.error('❌ AI 품종 분석 오류:', error);
    res.status(500).json({
      success: false,
      error: '품종 분석 중 오류가 발생했습니다.'
    });
  }
});

// 기본 엔드포인트
app.get('/', (req, res) => {
  res.json({ 
    message: 'Pet Buddy Server is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      dogs: '/api/dogs',
      pets: '/api/pets', // 새로 추가
      bookings: '/api/bookings',
      sitters: '/api/sitters',
      chat: '/api/conversations'
    }
  })
})

// === Pet 관리 (Dogs와 동일하지만 새로운 구조) ===
app.post('/api/pets', async (req, res) => {
  console.log('🐕 반려견 등록 요청:', req.body)
  const { user_id, name, breed, personality, birth_date, special_notes } = req.body || {}
  
  if (!user_id || !name) {
    return res.status(400).json({ 
      success: false, 
      message: '사용자 ID와 반려견 이름은 필수입니다.' 
    })
  }

  try {
    const dog = await createDog({
      user_id,
      name,
      breed: breed || '품종 미확인',
      personality: personality || '',
      birth_date: birth_date || null,
      special_notes: special_notes || ''
    })

    console.log('✅ 반려견 등록 성공:', dog)
    
    res.status(201).json({
      success: true,
      data: {
        dog_id: dog.dog_id || dog.id,
        name: dog.name,
        breed: dog.breed,
        message: '반려견이 성공적으로 등록되었습니다.'
      }
    })
  } catch (error) {
    console.error('❌ 반려견 등록 실패:', error)
    res.status(500).json({
      success: false,
      message: '반려견 등록에 실패했습니다.'
    })
  }
})

app.get('/api/pets/user/:userId', async (req, res) => {
  console.log('🐕 사용자 반려견 목록 조회:', req.params.userId)
  const { userId } = req.params
  
  try {
    const dogs = await getDogsByUserId(userId)
    console.log('✅ 반려견 목록 조회 성공:', dogs)
    
    res.json({
      success: true,
      data: dogs
    })
  } catch (error) {
    console.error('❌ 반려견 목록 조회 실패:', error)
    res.status(500).json({
      success: false,
      message: '반려견 목록 조회에 실패했습니다.'
    })
  }
})

// === Conversations (Mongo) ===
// 대화 생성 또는 조회 (participants는 문자열 ID 배열)
app.post('/api/conversations', async (req, res) => {
  try {
    const { participantIds } = req.body || {}
    if (!Array.isArray(participantIds) || participantIds.length < 2) {
      return res.status(400).json({ success: false, message: 'participantIds(2명 이상)가 필요합니다.' })
    }
    const participants = [...new Set(participantIds.map(String))].sort()
    let conv = await Conversation.findOne({ participants }).lean()
    if (!conv) {
      const created = await Conversation.create({ participants, lastMessageAt: new Date(0) })
      conv = created.toObject()
    }
    return res.json({ success: true, data: { conversationId: String(conv._id), participants: conv.participants, lastMessageText: conv.lastMessageText || '', lastMessageAt: conv.lastMessageAt } })
  } catch (e) {
    console.error('create/get conversation error', e)
    res.status(500).json({ success: false, message: '대화 생성 실패' })
  }
})

// 사용자의 대화 목록 조회
app.get('/api/conversations', async (req, res) => {
  const { userId } = req.query
  if (!userId) return res.status(400).json({ success: false, message: 'userId 필요' })
  try {
    const list = await Conversation.find({ participants: String(userId) })
      .sort({ lastMessageAt: -1 })
      .lean()

    // 참여자 이메일 매핑 (상대방만 표시)
    const otherIds = Array.from(new Set(list
      .map(c => (c.participants || []).find(p => String(p) !== String(userId)))
      .filter(Boolean)
      .map(String)))

    let idHas = false, userIdHas = false, fullNameHas = false
    try {
      const [cols] = await pool.execute('SHOW COLUMNS FROM users')
      const names = cols.map(c => c.Field)
      idHas = names.includes('id')
      userIdHas = names.includes('user_id')
      fullNameHas = names.includes('full_name')
    } catch {}

    const emailMap = new Map()
    const nameMap = new Map()
    if (otherIds.length > 0 && (idHas || userIdHas)) {
      if (idHas && userIdHas) {
        const [rows] = await pool.execute(
          `SELECT ${idHas ? 'id' : 'NULL'} AS id, ${userIdHas ? 'user_id' : 'NULL'} AS user_id, email, ${fullNameHas ? 'full_name' : 'NULL'} AS full_name FROM users 
           WHERE ${idHas ? 'id IN (?)' : '1=0'} OR ${userIdHas ? 'user_id IN (?)' : '1=0'}`,
          [otherIds, otherIds]
        )
        for (const r of rows) {
          if (r.id != null) emailMap.set(String(r.id), r.email)
          if (r.user_id != null) emailMap.set(String(r.user_id), r.email)
          if (r.id != null) nameMap.set(String(r.id), r.full_name)
          if (r.user_id != null) nameMap.set(String(r.user_id), r.full_name)
        }
      } else if (idHas) {
        const [rows] = await pool.execute(`SELECT id, email, ${fullNameHas ? 'full_name' : 'NULL'} AS full_name FROM users WHERE id IN (?)`, [otherIds])
        for (const r of rows) { emailMap.set(String(r.id), r.email); nameMap.set(String(r.id), r.full_name) }
      } else if (userIdHas) {
        const [rows] = await pool.execute(`SELECT user_id, email, ${fullNameHas ? 'full_name' : 'NULL'} AS full_name FROM users WHERE user_id IN (?)`, [otherIds])
        for (const r of rows) { emailMap.set(String(r.user_id), r.email); nameMap.set(String(r.user_id), r.full_name) }
      }
    }

    const data = list.map(c => {
      const other = (c.participants || []).find(p => String(p) !== String(userId))
      const email = other ? (emailMap.get(String(other)) || null) : null
      const fullName = other ? (nameMap.get(String(other)) || null) : null
      const displayName = (c.lastMessageSenderName || null) || email || fullName || (other ? String(other) : null)
      return {
        id: String(c._id),
        participants: c.participants,
        otherId: other ? String(other) : null,
        otherEmail: email,
        otherFullName: fullName,
        lastMessageSenderName: c.lastMessageSenderName || null,
        displayName,
        lastMessageText: c.lastMessageText || '',
        lastMessageAt: c.lastMessageAt || null,
      }
    })
    return res.json({ success: true, data })
  } catch (e) {
    console.error('list conversations error', e)
    res.status(500).json({ success: false, message: '대화 목록 조회 실패' })
  }
})

// 대화 삭제 (대화와 관련 메시지 모두 제거)
app.delete('/api/conversations/:conversationId', async (req, res) => {
  const { conversationId } = req.params
  try {
    await Message.deleteMany({ conversationId })
    const result = await Conversation.deleteOne({ _id: conversationId })
    return res.json({ success: result.deletedCount > 0 })
  } catch (e) {
    console.error('delete conversation error', e)
    res.status(500).json({ success: false, message: '대화 삭제 실패' })
  }
})

// === Bookings ===
// 견주 예약 목록 조회 (가까운 시간 순)
app.get('/api/bookings/owner/:ownerId', async (req, res) => {
  try {
    const rows = await getBookingsByOwnerId(String(req.params.ownerId))
    // 정렬 보장 (DB 정렬 실패 대비)
    const sorted = [...(rows || [])].sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    res.json({ success: true, bookings: sorted })
  } catch (e) {
    console.error('bookings list error', e)
    res.status(500).json({ success: false, message: '예약 목록 조회 실패' })
  }
})

// 예약 생성 (시터 공고 기준으로 생성 가능)
app.post('/api/bookings', async (req, res) => {
  const { owner_id, sitter_id, dog_id, start_time, end_time, source_post_id } = req.body || {}
  if (!owner_id || !sitter_id || !dog_id || !start_time || !end_time) {
    return res.status(400).json({ success: false, message: '필수 필드 누락 (owner_id, sitter_id, dog_id, start_time, end_time)' })
  }
  try {
    console.log('📦 booking payload:', { owner_id, sitter_id, dog_id, start_time, end_time, source_post_id })
    let location = undefined
    if (source_post_id) {
      try {
        const [rows] = await pool.execute(`SELECT location FROM sitter_postings WHERE post_id = ? LIMIT 1`, [source_post_id])
        location = rows?.[0]?.location || undefined
      } catch {}
    }
    const hourlyRate = Number(process.env.DEFAULT_HOURLY_RATE || 0)
    const result = await createBooking({ owner_id, sitter_id, dog_id, start_time, end_time, location, hourly_rate: hourlyRate })
    // 대화방 자동 생성/보장 (Mongo)
    try {
      const participants = [String(owner_id), String(sitter_id)].sort()
      let conv = await Conversation.findOne({ participants })
      if (!conv) {
        conv = await Conversation.create({ participants, lastMessageAt: new Date(0) })
      }
    } catch (e) {
      console.warn('ensure conversation warn:', e?.message)
    }
    // 예약 성공 시, 관련 시터 공고 닫기
    if (source_post_id) {
      try {
        await pool.execute(`UPDATE sitter_postings SET status='closed' WHERE post_id = ?`, [source_post_id])
      } catch (e) {
        console.warn('sitter posting close warn:', e?.message)
      }
    }
    return res.json({ success: true, data: { booking_id: result.bookingId } })
  } catch (e) {
    console.error('booking create error', e)
    res.status(500).json({ success: false, message: e?.message || '예약 생성 실패' })
  }
})

// 예약 삭제 API
app.delete('/api/bookings/:bookingId', async (req, res) => {
  const { bookingId } = req.params
  const { user_id } = req.query
  
  if (!bookingId || !user_id) {
    return res.status(400).json({ 
      success: false, 
      message: '필수 파라미터가 누락되었습니다. (bookingId, user_id)' 
    });
  }

  try {
    console.log(`🗑️ 예약 삭제 요청: bookingId=${bookingId}, userId=${user_id}`);

    // 예약 정보 조회 및 권한 확인
    const [rows] = await pool.execute(
      `SELECT * FROM bookings WHERE booking_id = ? AND owner_id = ? LIMIT 1`,
      [bookingId, user_id]
    )

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: '예약을 찾을 수 없거나 삭제 권한이 없습니다.'
      });
    }

    // 예약 삭제 (실제로는 상태를 'cancelled'로 변경)
    const [result] = await pool.execute(
      `UPDATE bookings SET booking_status = 'cancelled', updated_at = NOW() WHERE booking_id = ? AND owner_id = ?`,
      [bookingId, user_id]
    )

    if (result.affectedRows > 0) {
      console.log('✅ 예약 삭제 성공');
      res.json({ success: true, message: '예약이 성공적으로 삭제되었습니다.' });
    } else {
      res.status(404).json({ success: false, message: '예약 삭제에 실패했습니다.' });
    }
    
  } catch (error) {
    console.error('❌ 예약 삭제 오류:', error);
    res.status(500).json({
      success: false,
      error: '예약 삭제 중 오류가 발생했습니다.'
    });
  }
});

// 대화방 메시지 히스토리 조회 (MongoDB)
app.get('/api/conversations/:conversationId/messages', async (req, res) => {
  const { conversationId } = req.params
  const { before, limit = 30 } = req.query
  try {
    const q = { conversationId }
    if (before) q.createdAt = { $lt: new Date(String(before)) }
    const items = await Message.find(q)
      .sort({ createdAt: -1 })
      .limit(Math.min(Number(limit) || 30, 100))
      .lean()
    res.json({ success: true, data: items.reverse() })
  } catch (e) {
    console.error('Query messages error', e)
    res.status(500).json({ success: false, error: 'Failed to fetch messages' })
  }
})

// === 이미지 분석 결과 조회 ===
// S3 URL로 최신 분석 결과 조회
app.get('/api/dog-analysis/by-url', async (req, res) => {
  const { s3Url } = req.query
  
  if (!s3Url) {
    return res.status(400).json({ 
      success: false, 
      error: 's3Url 파라미터가 필요합니다' 
    })
  }

  try {
    console.log('🔍 분석 결과 조회 요청:', s3Url)
    const { getLatestAnalysisByS3Url, getLatestAnalysisByFilename } = require('./config/database-minimal')
    
    // 1차: S3 URL로 정확히 검색
    let analysis = await getLatestAnalysisByS3Url(s3Url)
    console.log('📊 S3 URL 검색 결과:', analysis)
    
    // 2차: S3 URL에서 파일명 추출해서 검색
    if (!analysis) {
      const fileName = s3Url.split('/').pop() // URL에서 파일명 추출
      console.log('🔍 파일명으로 재검색:', fileName)
      analysis = await getLatestAnalysisByFilename(fileName)
      console.log('📊 파일명 검색 결과:', analysis)
    }
    
    // 3차: 최신 분석 결과 중에서 유사한 시간대 검색 (타임스탬프 기반)
    if (!analysis) {
      const timestamp = s3Url.match(/(\d{13})/)?.[1] // URL에서 타임스탬프 추출
      if (timestamp) {
        console.log('🔍 타임스탬프로 검색:', timestamp)
        const { pool } = require('./config/database-minimal')
        const [rows] = await pool.execute(
          'SELECT * FROM dog_analyses WHERE file_name LIKE ? ORDER BY created_at DESC LIMIT 1',
          [`%${timestamp}%`]
        )
        analysis = rows.length > 0 ? rows[0] : null
        console.log('📊 타임스탬프 검색 결과:', analysis)
      }
    }
    
    if (!analysis) {
      console.log('❌ 분석 결과 없음 - S3 URL:', s3Url)
      return res.json({
        success: false,
        message: '해당 이미지에 대한 분석 결과를 찾을 수 없습니다'
      })
    }

    // 분석 결과 반환 (품종과 DBTI 정보)
    const responseData = {
      success: true,
      data: {
        recognizedBreed: analysis.recognized_breed,
        confidence: analysis.confidence,
        dbtiType: analysis.dbti_type,
        dbtiName: analysis.dbti_name,
        dbtiDescription: analysis.dbti_description,
        createdAt: analysis.created_at
      }
    }
    console.log('✅ API 응답 데이터:', responseData)
    res.json(responseData)
  } catch (e) {
    console.error('❌ 분석 결과 조회 실패:', e)
    res.status(500).json({
      success: false,
      message: '분석 결과 조회 실패'
    })
  }
})

// 파일명으로 분석 결과 조회
app.get('/api/dog-analysis/by-filename', async (req, res) => {
  const { fileName } = req.query
  
  if (!fileName) {
    return res.status(400).json({ 
      success: false, 
      error: 'fileName 파라미터가 필요합니다' 
    })
  }

  try {
    const { getLatestAnalysisByFilename } = require('./config/database-minimal')
    const analysis = await getLatestAnalysisByFilename(fileName)
    
    if (!analysis) {
      return res.json({
        success: false,
        message: '해당 파일에 대한 분석 결과를 찾을 수 없습니다'
      })
    }

    res.json({
      success: true,
      data: {
        recognizedBreed: analysis.recognized_breed,
        confidence: analysis.confidence,
        dbtiType: analysis.dbti_type,
        dbtiName: analysis.dbti_name,
        dbtiDescription: analysis.dbti_description,
        createdAt: analysis.created_at
      }
    })
  } catch (e) {
    console.error('❌ 분석 결과 조회 실패:', e)
    res.status(500).json({
      success: false,
      message: '분석 결과 조회 실패'
    })
  }
})

// S3 사전서명 URL 발급
app.post('/api/uploads/sign', async (req, res) => {
  const { fileName, contentType } = req.body || {}
  
  if (!fileName || !contentType) {
    return res.status(400).json({ 
      success: false, 
      error: 'fileName과 contentType이 필요합니다' 
    })
  }

  // AWS 자격 증명 확인
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error('❌ AWS 자격 증명이 설정되지 않았습니다')
    return res.status(500).json({
      success: false,
      error: 'AWS 자격 증명이 설정되지 않았습니다'
    })
  }

  try {
    const key = `${s3Prefix}/${Date.now()}_${fileName}`
    const command = new PutObjectCommand({ 
      Bucket: s3Bucket, 
      Key: key, 
      ContentType: contentType 
    })
    
    // 사전서명 URL 생성 (5분 만료)
    const uploadUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
    const publicUrl = `https://${s3Bucket}.s3.${REGION}.amazonaws.com/${key}`
    
    console.log('✅ S3 사전서명 URL 생성 성공:', { key, publicUrl })
    
    res.json({ 
      success: true, 
      uploadUrl, 
      key, 
      publicUrl 
    })
  } catch (e) {
    console.error('❌ S3 사전서명 URL 생성 실패:', e)
    res.status(500).json({
      success: false,
      message: 'S3 사전서명 URL 생성 실패'
    })
  }
})

// 데이터베이스 초기화 함수 제거
// MongoDB 및 MySQL 의존성 제거됨

// Socket.IO 연결 처리
io.on('connection', (socket) => {
  console.log('사용자 연결됨:', socket.id)

  // 사용자 정보 저장
  socket.on('user:join', (userData) => {
    activeUsers.set(socket.id, userData)
    console.log('사용자 정보 등록:', userData)
  })

  // 대화방 참가
  socket.on('conversation:join', (conversationId) => {
    socket.join(conversationId)
    console.log(`사용자 ${socket.id}가 대화방 ${conversationId}에 참가`)
    
    // 대화방의 기존 메시지 히스토리 전송
    const messages = messageHistory.get(conversationId) || []
    socket.emit('messages:history', messages)
  })

  // 대화방 나가기
  socket.on('conversation:leave', (conversationId) => {
    socket.leave(conversationId)
    console.log(`사용자 ${socket.id}가 대화방 ${conversationId}에서 나감`)
  })

  // 메시지 전송 (MongoDB 저장)
  socket.on('message:send', async (data) => {
    const { conversationId, message, senderId, senderName, type = 'text', imageUri, fileName, fileSize } = data
    
    const newMessage = {
      conversationId,
      senderId,
      senderName,
      type,
      content: message,
      createdAt: new Date(),
      readBy: [{
        userId: senderId,
        readAt: new Date()
      }]
    }

    // 이미지나 파일의 경우 추가 정보 포함
    if (type === 'image' && imageUri) {
      newMessage.imageUri = imageUri
    } else if (type === 'file' && fileName) {
      newMessage.fileName = fileName
      newMessage.fileSize = fileSize
    }

    try {
      const saved = await Message.create(newMessage)
      await Conversation.updateOne({ _id: conversationId }, {
        lastMessageText: newMessage.type === 'text' ? newMessage.content : newMessage.type,
        lastMessageAt: new Date(),
        lastMessageSenderName: newMessage.senderName || '',
      }, { upsert: true })

      // 대화방의 모든 사용자에게 메시지 전송
      io.to(conversationId).emit('message:received', {
        id: String(saved._id),
        ...newMessage,
        createdAt: saved.createdAt.toISOString(),
      })
      
      console.log(`대화방 ${conversationId}에서 메시지 전송:`, newMessage.content)
      
    } catch (error) {
      console.error('메시지 저장 오류:', error)
      socket.emit('message:error', { error: '메시지 전송에 실패했습니다.' })
    }
  })

  // 메시지 읽음 처리
  socket.on('message:read', async (data) => {
    try {
      const { conversationId, messageId, userId } = data

      // MongoDB에서 읽음 처리
      await Message.updateOne(
        { _id: messageId, 'readBy.userId': { $ne: userId } },
        { $push: { readBy: { userId, readAt: new Date() } } }
      )

      // 대화방의 다른 사용자들에게 읽음 상태 알림
      socket.to(conversationId).emit('message:read_updated', {
        messageId,
        userId
      })
    } catch (error) {
      console.error('메시지 읽음 처리 오류:', error)
      socket.emit('message:error', { error: '읽음 처리에 실패했습니다.' })
    }
  })

  // 타이핑 상태
  socket.on('typing:start', (data) => {
    const { conversationId, userId, userName } = data
    socket.to(conversationId).emit('typing:user_started', { userId, userName })
  })

  socket.on('typing:stop', (data) => {
    const { conversationId, userId } = data
    socket.to(conversationId).emit('typing:user_stopped', { userId })
  })

  // 연결 해제
  socket.on('disconnect', () => {
    const userData = activeUsers.get(socket.id)
    activeUsers.delete(socket.id)
    console.log('사용자 연결 해제:', socket.id, userData?.name || 'Unknown')
  })
})

const PORT = process.env.PORT || 3001

console.log('[boot] starting http server on', PORT)
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Pet Buddy Server가 포트 ${PORT}에서 실행 중입니다!`)
  console.log(`💬 Socket.IO 서버가 활성화되었습니다.`)
  console.log(`🌐 서버 주소: http://localhost:${PORT}`)

  // DB 스키마 보장 (1회)
  try {
    await ensureDogsSchema()
  } catch (e) {
    console.warn('⚠️ 스키마 초기화 경고:', e.message)
  }
});

// Mongo 연결은 백그라운드에서 시도 (서버 기동과 무관)
(async () => {
  try {
    console.log('[boot] connecting to Mongo...')
    await connectMongo(process.env.MONGODB_URI)
    console.log('🍃 MongoDB 연결 완료')
  } catch (e) {
    console.warn('🍃 MongoDB 연결 경고:', e?.message)
  }
})()

