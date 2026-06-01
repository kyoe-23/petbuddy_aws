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
  ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../store/auth'
import { theme } from '../styles/theme'
import { commonStyles } from '../styles/commonStyles'

const RegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    phone_number: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { signUp, isLoading, error } = useAuthStore()

  const handleRegister = async () => {
    if (!formData.email || !formData.password) {
      Alert.alert('오류', '이메일과 비밀번호를 입력해주세요.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.')
      return
    }

    try {
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number || null,
      })

      if (result.success) {
        Alert.alert(
          '회원가입 성공', 
          '계정이 성공적으로 생성되었습니다!',
          [
            {
              text: '확인',
              onPress: () => {
                // 회원가입과 동시에 로그인되므로 홈 화면으로 이동
                console.log('회원가입 완료, 자동 로그인됨')
              }
            }
          ]
        )
      } else {
        Alert.alert('회원가입 실패', result.error || '다시 시도해주세요.')
      }
    } catch (err) {
      Alert.alert('회원가입 실패', '네트워크 오류가 발생했습니다.')
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* 로고 및 제목 */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Ionicons name="heart" size={24} color="white" />
            </View>
            <Text style={styles.title}>Pet Buddy</Text>
            <Text style={styles.subtitle}>새로운 계정을 만들어보세요</Text>
          </View>

          {/* 회원가입 폼 */}
          <View style={styles.formContainer}>
            {/* 이메일 입력 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>이메일</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={20} color="{theme.colors.textTertiary}" style={styles.inputIcon} />
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

            {/* 전화번호 입력 (선택사항) */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>전화번호 (선택사항)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={20} color="{theme.colors.textTertiary}" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="010-1234-5678"
                  value={formData.phone_number}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* 비밀번호 입력 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>비밀번호</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="{theme.colors.textTertiary}" style={styles.inputIcon} />
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
                    color="{theme.colors.textTertiary}" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* 비밀번호 확인 입력 */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="{theme.colors.textTertiary}" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { paddingRight: 50 }]}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, confirmPassword: text }))}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons 
                    name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="{theme.colors.textTertiary}" 
                  />
                </TouchableOpacity>
              </View>
            </View>



            {/* 회원가입 버튼 */}
            <TouchableOpacity
              style={[styles.registerButton, isLoading && styles.registerButtonDisabled]}
              onPress={handleRegister}
              disabled={isLoading}
            >
              <Text style={styles.registerButtonText}>
                {isLoading ? '가입 중...' : '회원가입'}
              </Text>
            </TouchableOpacity>

            {/* 로그인 링크 */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>이미 계정이 있으신가요? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>로그인</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '{theme.colors.background}',
  },
  content: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 32,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '{theme.colors.textPrimary}',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '{theme.colors.textSecondary}',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '{theme.colors.textSecondary}',
    marginBottom: 4,
  },
  inputWrapper: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '{theme.colors.border}',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingLeft: 40,
    fontSize: 16,
    backgroundColor: 'white',
  },
  inputIcon: {
    position: 'absolute',
    left: 12,
    zIndex: 1,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    zIndex: 1,
    padding: 4,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  roleText: {
    marginLeft: 8,
    fontSize: 14,
    color: '{theme.colors.textSecondary}',
  },
  registerButton: {
    backgroundColor: theme.colors.primary,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonDisabled: {
    backgroundColor: '{theme.colors.primaryLight}',
    opacity: 0.7,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
    color: '{theme.colors.textSecondary}',
  },
  loginLink: {
    fontSize: 14,
    color: '{theme.colors.primary}',
    fontWeight: '600',
  },
})

export default RegisterScreen

