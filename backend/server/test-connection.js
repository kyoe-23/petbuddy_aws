const { 
    testConnection, 
    getAllUsers, 
    getUserCount,
    createUser,
    findUserByEmail,
    verifyPassword,
    closePool 
  } = require('./config/database')
  
  async function main() {
    console.log('🚀 데이터베이스 연결 테스트 시작...\n')
    
    try {
      // 1. 연결 테스트
      const isConnected = await testConnection()
      
      if (!isConnected) {
        console.log('\n❌ 데이터베이스 연결 실패. .env 파일과 MySQL 서버를 확인하세요.')
        return
      }
      
      console.log('\n' + '='.repeat(60))
      
      // 2. 전체 사용자 목록 조회
      console.log('\n📋 현재 등록된 사용자 목록:')
      const users = await getAllUsers()
      
      if (users.length === 0) {
        console.log('   (등록된 사용자가 없습니다)')
      } else {
        console.log(`   총 ${users.length}명의 사용자가 등록되어 있습니다.\n`)
        
        users.forEach((user, index) => {
          console.log(`   ${index + 1}. ${user.full_name}`)
          console.log(`      - ID: ${user.id}`)
          console.log(`      - 이메일: ${user.email}`)
          console.log(`      - 전화: ${user.phone}`)
          console.log('')
        })
      }
      
      console.log('='.repeat(60))
      
      // 3. 사용자 수 조회
      const userCount = await getUserCount()
      console.log(`\n📊 통계: 전체 사용자 수 = ${userCount}명`)
      
      console.log('\n' + '='.repeat(60))
      
      // 4. 새 사용자 생성 테스트 (선택사항)
      const testNewUser = false // true로 변경하면 테스트 실행
      
      if (testNewUser) {
        console.log('\n🆕 새 사용자 생성 테스트:')
        
        const newUserData = {
          email: `test_${Date.now()}@example.com`,
          password: 'test_password_123', // 실제로는 bcrypt로 암호화해야 함
          fullName: '테스트유저',
          phone: '010-0000-0000'
        }
        
        try {
          const result = await createUser(newUserData)
          console.log(`   ✅ 새 사용자 생성 성공! (ID: ${result.userId})`)
          
          // 생성한 사용자 조회
          const createdUser = await findUserByEmail(newUserData.email)
          console.log(`   - 이름: ${createdUser.full_name}`)
          console.log(`   - 이메일: ${createdUser.email}`)
        } catch (error) {
          console.log(`   ❌ 사용자 생성 실패: ${error.message}`)
        }
        
        console.log('\n' + '='.repeat(60))
      }
      
      // 5. 로그인 테스트 (선택사항)
      const testLogin = false // true로 변경하면 테스트 실행
      
      if (testLogin) {
        console.log('\n🔐 로그인 테스트:')
        
        const loginTests = [
          { email: 'user1@test.com', password: 'password123', expected: true },
          { email: 'user1@test.com', password: 'wrong_password', expected: false },
          { email: 'nonexist@test.com', password: 'any_password', expected: false }
        ]
        
        for (const test of loginTests) {
          const result = await verifyPassword(test.email, test.password)
          const icon = result.success ? '✅' : '❌'
          console.log(`   ${icon} ${test.email} / ${test.password}`)
          console.log(`      → ${result.message || '로그인 성공'}`)
        }
        
        console.log('\n' + '='.repeat(60))
      }
      
      console.log('\n✅ 모든 테스트 완료!')
      
    } catch (error) {
      console.error('\n❌ 테스트 중 오류 발생:', error.message)
      console.error('상세 오류:', error)
    } finally {
      // 연결 풀 종료
      await closePool()
    }
  }
  
  // 프로그램 실행
  console.clear() // 화면 정리 (선택사항)
  main()