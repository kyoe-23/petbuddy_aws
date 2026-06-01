require('dotenv').config()
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { RekognitionClient, DetectCustomLabelsCommand } = require('@aws-sdk/client-rekognition')
const XLSX = require('xlsx')
const mysql = require('mysql2/promise')

// AWS 클라이언트 설정 (EC2 IAM 역할 사용)
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION
})

const s3Client = new S3Client({
  region: process.env.AWS_REGION
})

const rekognitionClient = new RekognitionClient({
  region: process.env.AWS_REGION
})

// 프로젝트 ARN 설정
const PROJECT_VERSION_ARN = 'arn:aws:rekognition:ap-northeast-2:353641642408:project/test03/version/test03.2025-08-11T10.27.37/1754875657554'

// MySQL 연결 풀 설정
const dbPool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

console.log('🚀 고급 SQS 워커 시작됨 (견종 분석 + DBTI + RDS)')
console.log('📍 큐 URL:', process.env.SQS_QUEUE_URL)
console.log('🪣 S3 버킷:', process.env.S3_BUCKET)
console.log('🎯 Rekognition 프로젝트:', PROJECT_VERSION_ARN)
console.log('🗄️  데이터베이스:', `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`)

// Excel 파일에서 데이터 로딩
async function loadExcelData(bucketName) {
  try {
    // dogtraits_2.xlsx 파일 다운로드
    const traitsResponse = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: 'dogtraits_2.xlsx'
    }))
    
    const traitsBuffer = Buffer.from(await traitsResponse.Body.transformToByteArray())
    const traitsWorkbook = XLSX.read(traitsBuffer, { type: 'buffer' })
    const traitsSheet = traitsWorkbook.Sheets[traitsWorkbook.SheetNames[0]]
    const traitsData = XLSX.utils.sheet_to_json(traitsSheet)
    
    // dbti_descriptions.xlsx 파일 다운로드
    const descResponse = await s3Client.send(new GetObjectCommand({
      Bucket: bucketName,
      Key: 'dbti_descriptions.xlsx'
    }))
    
    const descBuffer = Buffer.from(await descResponse.Body.transformToByteArray())
    const descWorkbook = XLSX.read(descBuffer, { type: 'buffer' })
    const descSheet = descWorkbook.Sheets[descWorkbook.SheetNames[0]]
    const descData = XLSX.utils.sheet_to_json(descSheet)
    
    // 매핑 객체 생성
    const dbtiMapping = {}
    const dbtiNameMapping = {}
    const dbtiDescriptions = {}
    
    traitsData.forEach(row => {
      if (row.name && row.DBTI) {
        dbtiMapping[row.name] = row.DBTI
      }
    })
    
    descData.forEach(row => {
      if (row.DBTI) {
        if (row.name) dbtiNameMapping[row.DBTI] = row.name
        if (row.explanation) dbtiDescriptions[row.DBTI] = row.explanation
      }
    })
    
    console.log('✅ S3에서 엑셀 파일을 성공적으로 불러왔습니다.')
    console.log(`📊 견종-DBTI 매핑: ${Object.keys(dbtiMapping).length}개`)
    console.log(`📝 DBTI 설명: ${Object.keys(dbtiDescriptions).length}개`)
    
    return {
      dbtiMapping,
      dbtiNameMapping,
      dbtiDescriptions
    }
  } catch (error) {
    console.error('❌ 엑셀 파일 로딩 중 에러 발생:', error)
    throw new Error('엑셀 파일을 S3에서 불러오는 데 실패했습니다.')
  }
}

// RDS에 처리 결과 저장 함수
async function saveAnalysisToRDS(analysisResult) {
  try {
    const connection = await dbPool.getConnection()
    
    // dog_analyses 테이블에 분석 결과 저장 (필수 정보만)
    const insertQuery = `
      INSERT INTO dog_analyses (
        file_name,
        s3_url,
        recognized_breed,
        confidence,
        dbti_type,
        dbti_name,
        dbti_description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    
    const s3Url = `https://${process.env.S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${analysisResult.fileName}`
    
    const [result] = await connection.execute(insertQuery, [
      analysisResult.fileName,
      s3Url,
      analysisResult.recognizedBreed,
      analysisResult.confidence,
      analysisResult.dbti,
      analysisResult.dbtiName,
      analysisResult.dbtiDescription
    ])
    
    connection.release()
    
    console.log(`💾 RDS에 분석 결과 저장 완료 (ID: ${result.insertId})`)
    return { success: true, insertId: result.insertId }
    
  } catch (error) {
    console.error('❌ RDS 저장 실패:', error)
    return { success: false, error: error.message }
  }
}

// 이미지 처리 함수 (견종 분석 + DBTI)
async function processImageAdvanced(bucketName, fileKey) {
  try {
    console.log(`🖼️  고급 이미지 처리 시작: s3://${bucketName}/${fileKey}`)
    
    // Excel 데이터 로딩
    const { dbtiMapping, dbtiNameMapping, dbtiDescriptions } = await loadExcelData(bucketName)
    
    // AWS Rekognition Custom Labels로 견종 분석
    const rekognitionParams = {
      ProjectVersionArn: PROJECT_VERSION_ARN,
      Image: {
        S3Object: {
          Bucket: bucketName,
          Name: fileKey
        }
      }
    }

    const rekognitionResult = await rekognitionClient.send(new DetectCustomLabelsCommand(rekognitionParams))
    
    const imageResults = {}
    
    if (rekognitionResult.CustomLabels && rekognitionResult.CustomLabels.length > 0) {
      console.log('🔍 견종 분석 결과:')
      rekognitionResult.CustomLabels.forEach(label => {
        const breed = label.Name
        const confidence = label.Confidence
        imageResults[breed] = confidence
        console.log(`  - ${breed}: ${confidence.toFixed(2)}%`)
      })
    } else {
      console.log('🔍 이미지에서 인식된 견종이 없습니다.')
      return {
        success: true,
        result: '인식된 견종이 없습니다.',
        fileName: fileKey
      }
    }

    // 신뢰도 순으로 정렬
    const sortedBreeds = Object.entries(imageResults)
      .sort(([,a], [,b]) => b - a)
    
    const [bestMatchBreed, confidence] = sortedBreeds[0]
    const matchedDbti = dbtiMapping[bestMatchBreed] || 'DBTI 정보 없음'
    const matchedName = dbtiNameMapping[matchedDbti] || '정보 없음'
    const matchedDescription = dbtiDescriptions[matchedDbti] || '설명 정보 없음'
    
    const finalResult = {
      success: true,
      fileName: fileKey,
      recognizedBreed: bestMatchBreed,
      confidence: confidence,
      dbti: matchedDbti,
      dbtiName: matchedName,
      dbtiDescription: matchedDescription,
      top5Breeds: sortedBreeds.slice(0, 5).map(([breed, conf]) => ({
        breed: breed,
        confidence: conf
      }))
    }
    
    console.log('✅ 최종 결과:')
    console.log(JSON.stringify(finalResult, null, 2))
    
    // RDS에 분석 결과 저장
    const saveResult = await saveAnalysisToRDS(finalResult)
    if (saveResult.success) {
      finalResult.dbSaveId = saveResult.insertId
      console.log(`✅ 데이터베이스 저장 완료 (ID: ${saveResult.insertId})`)
    } else {
      console.log(`❌ 데이터베이스 저장 실패: ${saveResult.error}`)
    }
    
    return finalResult

  } catch (error) {
    console.error('❌ 고급 이미지 처리 실패:', error)
    return {
      success: false,
      error: error.message,
      fileName: fileKey
    }
  }
}

// SQS 메시지 처리 함수
async function processMessage(message) {
  try {
    const body = JSON.parse(message.Body)
    console.log('📨 SQS 메시지 받음:', JSON.stringify(body, null, 2))
    
    // S3 이벤트가 아닌 테스트 메시지 처리
    if (!body.Records) {
      console.log('❗ S3 이벤트 형식이 아닌 메시지입니다. (예: 테스트 메시지)')
      console.log(`메시지 본문: ${JSON.stringify(body)}`)
      
      // 메시지 삭제
      const deleteParams = {
        QueueUrl: process.env.SQS_QUEUE_URL,
        ReceiptHandle: message.ReceiptHandle
      }
      await sqsClient.send(new DeleteMessageCommand(deleteParams))
      console.log('🗑️  테스트 메시지 삭제 완료')
      return
    }
    
    // S3 이벤트 메시지 파싱
    for (const record of body.Records) {
      if (record.s3) {
        const bucketName = record.s3.bucket.name
        const fileKey = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
        
        console.log(`✅ 새 메시지 수신: S3 버킷 '${bucketName}', 파일 '${fileKey}'`)
        
        // 고급 이미지 처리 (견종 분석 + DBTI)
        const result = await processImageAdvanced(bucketName, fileKey)
        
        if (result.success) {
          console.log('✅ 고급 이미지 처리 완료')
          if (result.recognizedBreed) {
            console.log(`🐕 인식된 견종: ${result.recognizedBreed} (${result.confidence.toFixed(2)}%)`)
            console.log(`🎭 DBTI: ${result.dbti} - ${result.dbtiName}`)
          }
        } else {
          console.log('❌ 고급 이미지 처리 실패:', result.error)
        }
        
        console.log(`✅ 메시지 처리 완료: '${fileKey}'`)
      }
    }
    
    // 메시지 처리 완료 후 삭제
    const deleteParams = {
      QueueUrl: process.env.SQS_QUEUE_URL,
      ReceiptHandle: message.ReceiptHandle
    }
    
    await sqsClient.send(new DeleteMessageCommand(deleteParams))
    console.log('🗑️  SQS 메시지 삭제 완료')
    
  } catch (error) {
    console.error('❌ 메시지 처리 실패:', error)
  }
}

// SQS 폴링 루프
async function pollSQS() {
  console.log('🔍 SQS 큐에서 메시지를 대기 중입니다...')
  
  while (true) {
    try {
      const receiveParams = {
        QueueUrl: process.env.SQS_QUEUE_URL,
        MaxNumberOfMessages: 1,
        WaitTimeSeconds: 20 // Long polling (20초 대기)
      }
      
      const result = await sqsClient.send(new ReceiveMessageCommand(receiveParams))
      
      if (result.Messages && result.Messages.length > 0) {
        for (const message of result.Messages) {
          await processMessage(message)
        }
      } else {
        console.log('📭 메시지가 없습니다. 계속 대기 중...')
      }
      
    } catch (error) {
      console.error('❌ SQS 폴링 에러:', error)
      console.log('⏰ 60초 후 재시도합니다...')
      await new Promise(resolve => setTimeout(resolve, 60000))
    }
  }
}

// 워커 시작
pollSQS().catch(console.error)