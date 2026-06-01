import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/auth'
import { theme } from '../styles/theme'
import { commonStyles } from '../styles/commonStyles'

const LoginScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)

  const { signIn, isLoading, error } = useAuthStore()

  const handleLogin = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.')
      return
    }

    try {
      const result = await signIn({
        email: formData.email,
        password: formData.password,
      })

      if (result.success) {
        // 성공 시 자동으로 홈 화면으로 이동됨 (store에서 처리)
        Alert.alert('성공', '로그인이 완료되었습니다.')
      } else {
        Alert.alert('로그인 실패', result.error || '이메일 또는 비밀번호를 확인해주세요.')
      }
    } catch (err) {
      Alert.alert('로그인 실패', '네트워크 오류가 발생했습니다.')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        {/* 로고 및 제목 */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="paw" size={32} color="white" />
          </View>
          <Text style={styles.title}>Pet Buddy</Text>
          <Text style={styles.subtitle}>반려견과 시터를 연결하는 특별한 서비스</Text>
        </View>

        {/* 로그인 폼 */}
        <View style={styles.formContainer}>
          {/* 이메일 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>이메일</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color={theme.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="이메일을 입력하세요"
                value={formData.email}
                onChangeText={(text) => setFormData(prev => ({ ...prev, email: text }))}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          {/* 비밀번호 입력 */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>비밀번호</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={20} color={theme.colors.textTertiary} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { paddingRight: 50 }]}
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChangeText={(text) => setFormData(prev => ({ ...prev, password: text }))}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={theme.colors.textTertiary} 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* 로그인 버튼 */}
          <TouchableOpacity
            style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.loginButtonText}>
              {isLoading ? '로그인 중...' : '로그인'}
            </Text>
          </TouchableOpacity>

          {/* 회원가입 링크 */}
          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>아직 계정이 없으신가요? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.registerLink}>회원가입</Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.lg,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
    ...theme.shadows.lg,
  },
  title: {
    fontSize: theme.fontSize.display,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
  },
  subtitle: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  formContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  inputContainer: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSize.md,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 52,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingLeft: 44,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  inputIcon: {
    position: 'absolute',
    left: theme.spacing.md,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: theme.spacing.md,
    zIndex: 1,
    padding: theme.spacing.xs,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: theme.borderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.md,
    ...theme.shadows.md,
  },
  loginButtonDisabled: {
    backgroundColor: theme.colors.primaryLight,
    opacity: 0.7,
  },
  loginButtonText: {
    color: theme.colors.surface,
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  registerText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  registerLink: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
})

export default LoginScreen

