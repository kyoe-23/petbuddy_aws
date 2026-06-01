import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { theme } from '../../styles/theme'

const { width, height } = Dimensions.get('window')

interface DogPhotoCaptureProps {
  navigation: any
}

const DogPhotoCaptureScreen = ({ navigation }: DogPhotoCaptureProps) => {
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  // 권한 요청
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync()
    const { status: galleryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    
    if (cameraStatus !== 'granted' || galleryStatus !== 'granted') {
      Alert.alert(
        '권한 필요',
        '카메라와 사진 라이브러리 접근 권한이 필요합니다.',
        [{ text: '확인' }]
      )
      return false
    }
    return true
  }

  // 카메라로 촬영
  const takePhoto = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Camera error:', error)
      Alert.alert('오류', '카메라를 실행할 수 없습니다.')
    }
  }

  // 앨범에서 선택
  const pickFromGallery = async () => {
    const hasPermission = await requestPermissions()
    if (!hasPermission) return

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      })

      if (!result.canceled && result.assets[0]) {
        setCapturedImage(result.assets[0].uri)
      }
    } catch (error) {
      console.error('Gallery error:', error)
      Alert.alert('오류', '사진을 선택할 수 없습니다.')
    }
  }

  // 다시 찍기
  const retakePhoto = () => {
    setCapturedImage(null)
  }

  // AI 분석하기
  const analyzeWithAI = () => {
    if (!capturedImage) {
      Alert.alert('알림', '먼저 사진을 촬영해주세요.')
      return
    }
    
    setIsProcessing(true)
    // AI 분석 화면으로 이동
    navigation.navigate('DogAIAnalysis', { 
      imageUri: capturedImage 
    })
  }

  const showImageOptions = () => {
    Alert.alert(
      '사진 선택',
      '강아지 사진을 어떻게 준비하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        { text: '앨범에서 선택', onPress: pickFromGallery },
        { text: '사진 촬영', onPress: takePhoto },
      ]
    )
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
        <Text style={styles.headerTitle}>강아지 등록</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 진행 상태 */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, styles.progressDotActive]} />
        <View style={styles.progressLine} />
        <View style={styles.progressDot} />
        <View style={styles.progressLine} />
        <View style={styles.progressDot} />
        <Text style={styles.progressText}>1/3 사진 촬영</Text>
      </View>

      {/* 메인 콘텐츠 */}
      <View style={styles.content}>
        {!capturedImage ? (
          // 사진이 없을 때
          <View style={styles.emptyState}>
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={64} color={theme.colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>강아지 사진을 준비해주세요</Text>
            <Text style={styles.emptySubtitle}>
              AI가 강아지의 품종과 특성을{'\n'}자동으로 분석해드려요
            </Text>
          </View>
        ) : (
          // 사진이 있을 때
          <View style={styles.imageContainer}>
            <Image source={{ uri: capturedImage }} style={styles.capturedImage} />
            <TouchableOpacity style={styles.retakeButton} onPress={retakePhoto}>
              <Ionicons name="refresh" size={20} color={theme.colors.primary} />
              <Text style={styles.retakeText}>다시찍기</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* 하단 버튼 */}
      <View style={styles.bottomContainer}>
        {!capturedImage ? (
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.galleryButton]}
              onPress={pickFromGallery}
            >
              <Ionicons name="images" size={24} color={theme.colors.textPrimary} />
              <Text style={styles.galleryButtonText}>앨범</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.cameraButton]}
              onPress={takePhoto}
            >
              <Ionicons name="camera" size={24} color="white" />
              <Text style={styles.cameraButtonText}>사진 촬영</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.analyzeButton, isProcessing && styles.analyzeButtonDisabled]}
            onPress={analyzeWithAI}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons name="sparkles" size={24} color="white" />
                <Text style={styles.analyzeButtonText}>AI 분석하기</Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  emptySubtitle: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  capturedImage: {
    width: width - (theme.spacing.md * 2),
    height: width - (theme.spacing.md * 2),
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.lg,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'white',
  },
  retakeText: {
    marginLeft: theme.spacing.xs,
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  bottomContainer: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  galleryButton: {
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  galleryButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  cameraButton: {
    backgroundColor: theme.colors.primary,
  },
  cameraButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: 'white',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: theme.spacing.lg,
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.lg,
    gap: theme.spacing.xs,
  },
  analyzeButtonDisabled: {
    opacity: 0.6,
  },
  analyzeButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: '600',
    color: 'white',
  },
})

export default DogPhotoCaptureScreen