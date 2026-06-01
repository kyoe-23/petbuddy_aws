import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../../styles/theme'
import { apiService } from '../../services/api'
import { useAuthStore } from '../../store/auth'

const { width } = Dimensions.get('window')

interface DogBasicInfoProps {
  navigation: any
  route: {
    params: {
      imageUri: string
      aiAnalysis: {
        breed: string
        breedConfidence: number
        personality: string[]
        temperament: string
        size: string
        energyLevel: string
        careTips: string[]
        healthConsiderations: string[]
      }
    }
  }
}

const DogBasicInfoScreen = ({ navigation, route }: DogBasicInfoProps) => {
  const { imageUri, aiAnalysis } = route.params
  const { user } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 폼 상태 - AI 분석 결과로 초기화
  const [formData, setFormData] = useState({
    name: '',
    breed: aiAnalysis.breed || '',
    personality: aiAnalysis.temperament || '', // 성격 특성 내용으로 변경
    dbti: aiAnalysis.personality.join(', ') || '', // DBTI 필드 추가
    birthDate: '',
    size: aiAnalysis.size || '',
    notes: '',
  })

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string>('')

  // 컴포넌트 마운트 시 이미지 업로드
  useEffect(() => {
    uploadImageToS3()
  }, [])

  const uploadImageToS3 = async () => {
    try {
      const response = await fetch(imageUri)
      const blob = await response.blob()
      const contentType = blob.type || 'image/jpeg'
      const fileName = `dog_profile_${Date.now()}.jpg`

      // 사전서명 URL 요청
      const signResp = await apiService.post('/uploads/sign', { fileName, contentType })
      
      if (!signResp.success) {
        throw new Error('이미지 업로드 준비 실패')
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

      setUploadedImageUrl(publicUrl)
    } catch (error) {
      console.error('이미지 업로드 오류:', error)
      Alert.alert('오류', '이미지 업로드에 실패했습니다.')
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('알림', '강아지 이름을 입력해주세요.')
      return false
    }
    if (!formData.breed.trim()) {
      Alert.alert('알림', '품종을 입력해주세요.')
      return false
    }
    return true
  }

  const handleSubmit = async () => {
    if (!validateForm()) return
    if (!uploadedImageUrl) {
      Alert.alert('알림', '이미지 업로드가 완료되지 않았습니다. 잠시 후 다시 시도해주세요.')
      return
    }

    setIsSubmitting(true)

    try {
      const dogData = {
        user_id: user?.id,
        name: formData.name.trim(),
        breed: formData.breed.trim(),
        personality: formData.personality.trim(),
        dbti: formData.dbti.trim(), // DBTI 필드 추가
        birth_date: formData.birthDate || null,
        special_notes: formData.notes.trim() || null,
        profile_image_url: uploadedImageUrl,
        // AI 분석 추가 정보
        size: formData.size,
        ai_confidence: aiAnalysis.breedConfidence,
      }

      const response = await apiService.post('/dogs', dogData)

      if (response.success) {
        Alert.alert(
          '등록 완료',
          '강아지가 성공적으로 등록되었습니다!',
          [
            {
              text: '확인',
              onPress: () => {
                // 홈 화면으로 돌아가기
                navigation.navigate('OwnerTabs', { 
                  screen: 'OwnerHome',
                  params: { refresh: true }
                })
              }
            }
          ]
        )
      } else {
        throw new Error(response.error || '등록에 실패했습니다.')
      }
    } catch (error: any) {
      console.error('강아지 등록 오류:', error)
      Alert.alert('오류', error.message || '등록 중 오류가 발생했습니다.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>기본 정보</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 진행 상태 */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={[styles.progressLine, styles.progressLineActive]} />
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <Text style={styles.progressText}>3/3 정보 입력</Text>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        {/* 프로필 이미지 */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: imageUri }} style={styles.profileImage} />
          <View style={styles.aiTagContainer}>
            <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
            <Text style={styles.aiTagText}>AI 분석 완료</Text>
          </View>
        </View>

        {/* AI 분석 요약 */}
        <View style={styles.aiSummaryContainer}>
          <Text style={styles.aiSummaryTitle}>AI 분석 정보</Text>
          <View style={styles.aiInfoGrid}>
            <View style={styles.aiInfoItem}>
              <Text style={styles.aiInfoLabel}>품종</Text>
              <Text style={styles.aiInfoValue}>{aiAnalysis.breed}</Text>
              <Text style={styles.aiInfoConfidence}>{aiAnalysis.breedConfidence}% 일치</Text>
            </View>
            <View style={styles.aiInfoItem}>
              <Text style={styles.aiInfoLabel}>DBTI</Text>
              <Text style={styles.aiInfoValue}>{aiAnalysis.personality.join(', ')}</Text>
            </View>
          </View>
        </View>

        {/* 입력 폼 */}
        <View style={styles.formContainer}>
          {/* 이름 (필수) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              이름 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="강아지 이름을 입력해주세요"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          {/* 품종 (AI 자동 입력, 읽기 전용) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              품종 <Text style={styles.aiAutoFilled}>AI 자동 입력</Text>
            </Text>
            <View style={[styles.textInput, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>{formData.breed || '품종 분석 중...'}</Text>
            </View>
          </View>

          {/* 성격 (AI 자동 입력, 읽기 전용) */}
          <View style={styles.inputGroup}>
            <View style={styles.personalityHeader}>
              <Ionicons name="heart" size={20} color={theme.colors.primary} />
              <Text style={styles.inputLabel}>
                성격 <Text style={styles.aiAutoFilled}>AI 자동 입력</Text>
              </Text>
            </View>
            <View style={styles.personalityList}>
              {formData.personality ? 
                formData.personality.split('.').filter(sentence => sentence.trim()).map((sentence, index) => (
                  <View key={index} style={styles.personalityItem}>
                    <Ionicons name="heart" size={16} color={theme.colors.primary} />
                    <Text style={styles.personalityText}>{sentence.trim()}</Text>
                  </View>
                )) : 
                <View style={styles.personalityItem}>
                  <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.personalityText, { color: theme.colors.textSecondary }]}>성격 분석 중...</Text>
                </View>
              }
            </View>
          </View>

          {/* DBTI (AI 자동 입력, 읽기 전용) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              DBTI <Text style={styles.aiAutoFilled}>AI 자동 입력</Text>
            </Text>
            <View style={[styles.textInput, styles.readOnlyInput]}>
              <Text style={styles.readOnlyText}>{formData.dbti || 'DBTI 분석 중...'}</Text>
            </View>
          </View>

          {/* 생년월일 (선택) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>생년월일</Text>
            <TextInput
              style={styles.textInput}
              value={formData.birthDate}
              onChangeText={(value) => handleInputChange('birthDate', value)}
              placeholder="YYYY-MM-DD (예: 2020-05-15)"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>

          {/* 특이사항 (선택) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>특이사항 / 메모</Text>
            <TextInput
              style={[styles.textInput, styles.multilineInput]}
              value={formData.notes}
              onChangeText={(value) => handleInputChange('notes', value)}
              placeholder="알레르기, 주의사항 등을 입력해주세요"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              numberOfLines={4}
            />
          </View>
        </View>

        </ScrollView>

        {/* 등록 버튼 */}
        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>등록 완료</Text>
                <Ionicons name="checkmark" size={20} color="white" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
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
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xl,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: theme.spacing.sm,
  },
  aiTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.primaryBg,
    borderRadius: theme.borderRadius.round,
  },
  aiTagText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  aiSummaryContainer: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  aiSummaryTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
  },
  aiInfoGrid: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  aiInfoItem: {
    flex: 1,
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.md,
  },
  aiInfoLabel: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  aiInfoValue: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  aiInfoConfidence: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.success,
    marginTop: 2,
  },
  formContainer: {
    gap: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  inputGroup: {
    gap: theme.spacing.md,
  },
  inputLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  required: {
    color: theme.colors.error,
  },
  aiAutoFilled: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '600',
    backgroundColor: theme.colors.primaryBg,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.sm,
  },
  textInput: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    backgroundColor: 'white',
    ...theme.shadows.sm,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  readOnlyInput: {
    backgroundColor: theme.colors.surfaceLight,
    borderColor: theme.colors.surfaceLight,
    justifyContent: 'center',
  },
  readOnlyText: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  personalityList: {
    gap: theme.spacing.md,
  },
  personalityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  personalityText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    fontWeight: '500',
  },
  tipsPreviewContainer: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.xl,
    ...theme.shadows.sm,
  },
  tipsPreviewTitle: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  tipsPreviewSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
  },
  tipsPreview: {
    gap: theme.spacing.sm,
  },
  tipPreviewItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tipPreviewText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
  moreTypes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
  bottomContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: 'white',
  },
  moreTypes: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.primary,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: theme.spacing.xs,
  },
})

export default DogBasicInfoScreen