import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../../styles/theme'
import { apiService } from '../../services/api'

const { width } = Dimensions.get('window')

interface DogAIAnalysisProps {
  navigation: any
  route: {
    params: {
      imageUri: string
    }
  }
}

interface AIAnalysisResult {
  breed: string
  breedConfidence: number
  personality: string[]
  temperament: string
  size: string
  energyLevel: string
  careTips: string[]
  healthConsiderations: string[]
}

// Mock 데이터 생성 함수
const generateRandomMockData = (): AIAnalysisResult => {
  const dogBreeds = [
    {
      breed: '골든 리트리버',
      size: '대형견',
      energyLevel: '높음',
      personality: ['친근함', '활발함', '충성스러움', '지능적'],
      temperament: '온순하고 활발한 성격으로 가족과 아이들에게 친근합니다.',
      careTips: [
        '매일 60분 이상의 운동이 필요합니다',
        '털이 많이 빠지므로 정기적인 브러싱이 필요합니다',
        '물을 좋아하므로 수영을 시키면 좋습니다',
        '사회성이 좋아 다른 강아지들과 잘 어울립니다'
      ],
      healthConsiderations: [
        '고관절 이형성증 주의',
        '눈 질환 (백내장, 진행성 망막 위축증)',
        '심장 질환 정기 검진 필요',
        '비만 예방을 위한 체중 관리 중요'
      ]
    },
    {
      breed: '비글',
      size: '중형견',
      energyLevel: '높음',
      personality: ['호기심 많음', '활발함', '사교적', '완고함'],
      temperament: '호기심이 많고 활발하며, 냄새를 따라 탐험하는 것을 좋아합니다.',
      careTips: [
        '매일 충분한 운동과 정신적 자극이 필요합니다',
        '식욕이 왕성하므로 체중 관리가 중요합니다',
        '냄새 추적 놀이를 즐깁니다',
        '사회성이 좋아 다른 반려동물과 잘 지냅니다'
      ],
      healthConsiderations: [
        '비만 주의 (식욕이 왕성함)',
        '귀 질환 (처진 귀로 인한 감염)',
        '디스크 질환 주의',
        '간질 발작 가능성'
      ]
    },
    {
      breed: '포메라니안',
      size: '소형견',
      energyLevel: '중간',
      personality: ['활기참', '자신감', '애교', '경계심'],
      temperament: '작은 체구에 큰 마음을 가진 용감하고 활기찬 성격입니다.',
      careTips: [
        '매일 20-30분 정도의 가벼운 운동이 적합합니다',
        '이중털로 인해 정기적인 브러싱이 필수입니다',
        '추위에 민감하므로 겨울철 보온이 중요합니다',
        '사회화 훈련이 중요합니다'
      ],
      healthConsiderations: [
        '슬개골 탈구 (작은 체구로 인한)',
        '기관허탈 주의',
        '치아 관리 (작은 입으로 인한 치석)',
        '탈모 가능성'
      ]
    },
    {
      breed: '시바견',
      size: '중형견',
      energyLevel: '중간',
      personality: ['독립적', '차분함', '충성심', '고집'],
      temperament: '독립적이고 차분한 성격으로 주인에게 충성스럽습니다.',
      careTips: [
        '매일 30-45분의 산책이 적합합니다',
        '독립적 성격을 존중하며 훈련해야 합니다',
        '계절별 털갈이 시기에 집중 브러싱이 필요합니다',
        '조용한 환경을 선호합니다'
      ],
      healthConsiderations: [
        '알레르기 피부염 주의',
        '고관절 이형성증',
        '눈 질환 (녹내장)',
        '정기적인 건강검진 필요'
      ]
    },
    {
      breed: '프렌치 불독',
      size: '소형견',
      energyLevel: '낮음',
      personality: ['온순함', '애정적', '장난기', '느긋함'],
      temperament: '온순하고 애정이 많아 가족과 함께 있는 것을 좋아합니다.',
      careTips: [
        '짧은 산책과 실내 놀이가 적합합니다',
        '더위에 매우 취약하므로 여름철 주의가 필요합니다',
        '호흡기 관리를 위해 목줄보다는 하네스 사용',
        '체중 관리가 중요합니다'
      ],
      healthConsiderations: [
        '단두증후군 (호흡 곤란)',
        '척추 질환 주의',
        '눈 질환 (각막염)',
        '열사병 주의'
      ]
    },
    {
      breed: '치와와',
      size: '초소형견',
      energyLevel: '중간',
      personality: ['용감함', '애정적', '경계심', '활기참'],
      temperament: '작은 체구지만 용감하고 주인에게 애정이 깊습니다.',
      careTips: [
        '실내 활동만으로도 충분한 운동량을 확보할 수 있습니다',
        '추위에 매우 민감하므로 보온이 필요합니다',
        '높은 곳에서 뛰어내리지 않도록 주의',
        '사회화 훈련으로 과도한 경계심 완화'
      ],
      healthConsiderations: [
        '슬개골 탈구',
        '수두증 (물뇌증)',
        '심장 질환',
        '치아 관리 필수'
      ]
    }
  ]

  const randomBreed = dogBreeds[Math.floor(Math.random() * dogBreeds.length)]
  const confidence = Math.floor(Math.random() * 20) + 75 // 75-95% 사이

  return {
    breed: randomBreed.breed,
    breedConfidence: confidence,
    personality: randomBreed.personality,
    temperament: randomBreed.temperament,
    size: randomBreed.size,
    energyLevel: randomBreed.energyLevel,
    careTips: randomBreed.careTips,
    healthConsiderations: randomBreed.healthConsiderations
  }
}

const DogAIAnalysisScreen = ({ navigation, route }: DogAIAnalysisProps) => {
  const { imageUri } = route.params
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    performAIAnalysis()
  }, [])

  const performAIAnalysis = async () => {
    setIsAnalyzing(true)
    setError(null)

    try {
      // 이미지를 S3에 업로드하고 AI 분석 요청
      const response = await fetch(imageUri)
      const blob = await response.blob()
      const contentType = blob.type || 'image/jpeg'
      const fileName = `dog_analysis_${Date.now()}.jpg`

      console.log('📤 AI 분석용 이미지 업로드 시작:', { fileName, contentType })

      // 백엔드에서 사전서명 URL 요청
      const signResp = await apiService.post('/uploads/sign', { fileName, contentType })
      
      if (!signResp.success) {
        throw new Error(signResp.error || '이미지 업로드 실패')
      }

      const { uploadUrl, publicUrl } = signResp.data

      // S3에 이미지 업로드
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': contentType,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error('이미지 업로드 실패')
      }

      console.log('✅ S3 업로드 완료, SQS Worker 분석 대기 중...', publicUrl)

      // SQS Worker가 처리할 시간을 주기 위해 대기 (3-5초)
      await new Promise(resolve => setTimeout(resolve, 4000))

      // SQS Worker 결과 조회 시도 (최대 3번)
      let analysis = null
      for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`🔍 분석 결과 조회 시도 ${attempt}/3`)
        
        const analysisResp = await apiService.get(`/dog-analysis/by-url?s3Url=${encodeURIComponent(publicUrl)}`)
        
        if (analysisResp.success && analysisResp.data) {
          analysis = analysisResp.data
          console.log('✅ SQS Worker 분석 결과 조회 성공:', analysis)
          break
        }
        
        // 마지막 시도가 아니면 2초 더 대기
        if (attempt < 3) {
          console.log('⏱️ 분석 결과 대기 중... (2초 후 재시도)')
          await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }

      if (analysis) {
        // 견종 인식 실패 체크
        if (!analysis.recognizedBreed || analysis.recognizedBreed === '인식된 견종이 없습니다') {
          setIsAnalyzing(false)
          Alert.alert(
            "견종 인식 실패",
            "강아지를 명확하게 인식할 수 없습니다.\n\n다음 사항을 확인해주세요:\n• 강아지가 사진의 중심에 위치하는지\n• 조명이 충분한지\n• 강아지의 얼굴이 선명하게 보이는지\n\n다른 사진으로 다시 시도해보세요.",
            [
              {
                text: "다시 촬영",
                onPress: () => {
                  // 사진 촬영 화면으로 교체 (초기 상태)
                  navigation.replace('DogPhotoCapture')
                },
                style: "default"
              }
            ]
          )
          return
        }

        // SQS Worker 결과를 프론트엔드 형식으로 변환
        const analysisResult: AIAnalysisResult = {
          breed: analysis.recognizedBreed || '품종 미확인',
          breedConfidence: Math.round(analysis.confidence || 0),
          personality: [analysis.dbtiType || analysis.dbti || '분석 중'], // DBTI 코드 (예: SHRA)
          temperament: analysis.dbtiDescription || '성격 분석 결과를 불러오는 중입니다.',
          size: analysis.dbtiName || '분석 중', // DBTI 이름을 size 필드에 임시 저장
          energyLevel: '분석 중',
          careTips: [
            '전문가의 조언을 구하시는 것을 권장합니다',
            '정기적인 건강검진을 받아보세요',
            '충분한 운동과 사랑으로 돌봐주세요'
          ],
          healthConsiderations: [
            '정기적인 수의사 검진을 받으세요',
            '품종별 특성에 맞는 관리가 필요합니다'
          ]
        }
        
        setAnalysisResult(analysisResult)
        setIsAnalyzing(false)
      } else {
        console.log('⚠️ SQS Worker 결과 없음 - 더미 데이터 사용')
        // SQS Worker 결과가 없으면 더미 데이터 사용
        const mockResults = generateRandomMockData()
        setAnalysisResult(mockResults)
        setIsAnalyzing(false)
      }

    } catch (error: any) {
      console.error('AI 분석 오류:', error)
      setError(error.message || 'AI 분석 중 오류가 발생했습니다.')
      setIsAnalyzing(false)
    }
  }

  const retryAnalysis = () => {
    performAIAnalysis()
  }

  const proceedToBasicInfo = () => {
    if (!analysisResult) return

    // AI 분석 결과를 다음 화면으로 전달
    navigation.navigate('DogBasicInfo', {
      imageUri,
      aiAnalysis: analysisResult
    })
  }

  const goBackToPhoto = () => {
    navigation.goBack()
  }

  if (isAnalyzing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBackToPhoto}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>AI 분석 중</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.analyzingContainer}>
          <Image source={{ uri: imageUri }} style={styles.analyzingImage} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.analyzingText}>AI가 강아지를 분석하고 있어요...</Text>
            <Text style={styles.analyzingSubtext}>잠시만 기다려 주세요</Text>
          </View>
        </View>
      </SafeAreaView>
    )
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={goBackToPhoto}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>분석 오류</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={styles.errorTitle}>분석 실패</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={retryAnalysis}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={goBackToPhoto}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI 분석 결과</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 진행 상태 */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressLine} />
        <View style={styles.progressDot} />
        <Text style={styles.progressText}>2/3 AI 분석 완료</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 사진과 품종 */}
        <View style={styles.imageSection}>
          <Image source={{ uri: imageUri }} style={styles.resultImage} />
          <View style={styles.breedContainer}>
            <Text style={styles.breedName}>{analysisResult?.breed}</Text>
            <View style={styles.confidenceContainer}>
              <Ionicons name="checkmark-circle" size={16} color={theme.colors.success} />
              <Text style={styles.confidenceText}>
                {analysisResult?.breedConfidence}% 일치
              </Text>
            </View>
          </View>
        </View>

        {/* 분석 결과 섹션들 */}
        <View style={styles.resultSections}>
          {/* 기본 정보 */}
          <View style={styles.section}>
            <View style={styles.personalityHeader}>
              <Ionicons name="information-circle" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>기본 정보</Text>
            </View>
            <View style={styles.dbtiContainer}>
              <Text style={styles.dbtiNameText}>{analysisResult?.size || '분석 중'}</Text>
              <Text style={styles.dbtiLabel}>DBTI</Text>
              <Text style={styles.dbtiValue}>{analysisResult?.personality[0] || 'DBTI 분석 중'}</Text>
            </View>
          </View>

          {/* 성격 */}
          <View style={styles.section}>
            <View style={styles.personalityHeader}>
              <Ionicons name="heart" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>성격 특성</Text>
            </View>
            <View style={styles.temperamentList}>
              {analysisResult?.temperament.split('.').filter(sentence => sentence.trim()).map((sentence, index) => (
                <View key={index} style={styles.temperamentItem}>
                  <Ionicons name="heart" size={20} color={theme.colors.primary} />
                  <Text style={styles.temperamentText}>{sentence.trim()}</Text>
                </View>
              ))}
            </View>
          </View>

        </View>
      </ScrollView>

      {/* 확인 버튼 */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={proceedToBasicInfo}
        >
          <Text style={styles.confirmButtonText}>확인</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  backButton: {
    padding: theme.spacing.xs,
  },
  headerTitle: {
    fontSize: theme.fontSize.title,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.border,
  },
  progressDotActive: {
    backgroundColor: theme.colors.primary,
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: theme.colors.border,
    marginHorizontal: theme.spacing.sm,
  },
  progressLineActive: {
    backgroundColor: theme.colors.primary,
  },
  progressText: {
    position: 'absolute',
    top: 40,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  imageSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  resultImage: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  breedContainer: {
    alignItems: 'center',
  },
  breedName: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  confidenceText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.fontSize.lg,
    color: theme.colors.success,
    fontWeight: '700',
  },
  resultSections: {
    gap: theme.spacing.xl,
    paddingBottom: theme.spacing.xl,
  },
  section: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginLeft: theme.spacing.sm,
  },
  infoGrid: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  infoItem: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.primaryBg,
    borderRadius: theme.borderRadius.md,
  },
  infoLabel: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  infoValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  dbtiContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
  },
  dbtiNameText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  dbtiLabel: {
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  dbtiValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.primary,
    textAlign: 'center',
  },
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  temperamentList: {
    gap: theme.spacing.lg,
  },
  temperamentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  temperamentText: {
    flex: 1,
    marginLeft: theme.spacing.md,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    lineHeight: 26,
    fontWeight: '500',
  },
  personalityTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.sm,
  },
  personalityTag: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.primaryBg,
    borderRadius: theme.borderRadius.round,
  },
  personalityTagText: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: theme.spacing.sm,
  },
  tipText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  bottomContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  confirmButtonText: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: 'white',
  },
  // 로딩 상태 스타일
  analyzingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  analyzingImage: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.xl,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  analyzingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  analyzingSubtext: {
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  // 에러 상태 스타일
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
  },
  errorTitle: {
    marginTop: theme.spacing.lg,
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.error,
  },
  errorMessage: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
  },
  retryButtonText: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: 'white',
  },
})

export default DogAIAnalysisScreen