require('dotenv').config()
const mysql = require('mysql2/promise')

async function showTableData() {
  const config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  }

  try {
    const connection = await mysql.createConnection(config)
    
    console.log('🏗️  dog_analyses 테이블 구조:')
    const [columns] = await connection.execute('DESCRIBE dog_analyses')
    console.table(columns)
    
    console.log('\n📊 저장된 데이터 개수:')
    const [count] = await connection.execute('SELECT COUNT(*) as total FROM dog_analyses')
    console.log(`총 ${count[0].total}개의 레코드가 있습니다.`)
    
    console.log('\n📝 저장된 분석 결과들:')
    const [rows] = await connection.execute('SELECT * FROM dog_analyses ORDER BY created_at DESC')
    
    if (rows.length === 0) {
      console.log('❌ 저장된 데이터가 없습니다.')
    } else {
      rows.forEach((row, index) => {
        console.log(`\n📝 분석 결과 #${index + 1}:`)
        console.log(`   ID: ${row.id}`)
        console.log(`   파일명: ${row.file_name}`)
        console.log(`   S3 URL: ${row.s3_url}`)
        console.log(`   인식된 견종: ${row.recognized_breed}`)
        console.log(`   신뢰도: ${row.confidence}%`)
        console.log(`   DBTI: ${row.dbti_type} - ${row.dbti_name}`)
        console.log(`   설명: ${row.dbti_description}`)
        
        if (row.top5_breeds) {
          const top5 = JSON.parse(row.top5_breeds)
          console.log('   상위 5개 견종:')
          top5.forEach((breed, i) => {
            console.log(`     ${i+1}. ${breed.breed}: ${breed.confidence}%`)
          })
        }
        
        console.log(`   분석 시각: ${row.analysis_timestamp || 'N/A'}`)
        console.log(`   생성 시각: ${row.created_at}`)
        console.log('   ' + '─'.repeat(50))
      })
    }
    
    await connection.end()
    console.log('\n✅ 테이블 조회 완료!')
    
  } catch (error) {
    console.error('❌ 오류:', error.message)
  }
}

showTableData()