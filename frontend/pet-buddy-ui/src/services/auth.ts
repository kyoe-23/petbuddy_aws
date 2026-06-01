import { apiService } from './api'
import type { User } from '../types'

export interface SignUpParams {
  email: string
  password: string
  phone_number?: string | null
}

export interface SignInParams {
  email: string
  password: string
}

export interface AuthResponse {
  success: boolean
  data?: {
    user: User
    token: string
  }
  error?: string
  message?: string
}

function normalizeApiUser(raw: any): User {
  return {
    id: raw.id || raw.user_id || raw.userId || '',
    email: raw.email || '',
    phone: raw.phone || raw.phone_number || '',
    fullName: raw.fullName || raw.full_name || raw.name || (raw.email ? String(raw.email).split('@')[0] : ''),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export const authService = {
  // 회원가입
  async signUp(params: SignUpParams): Promise<AuthResponse> {
    try {
      console.log('🔐 회원가입 요청:', { ...params, password: '***' })
      
      const response = await apiService.post('/auth/register', params)
      
      if (response.success && response.data) {
        // 토큰이 있으면 API 서비스에 설정
        if (response.data.token) {
          apiService.setToken(response.data.token)
        }
        // 사용자 객체 정규화
        if (response.data.user) {
          const normalized = normalizeApiUser(response.data.user)
          ;(response.data as any).user = normalized
        }
        console.log('✅ 회원가입 성공!')
        return response as AuthResponse
      } else {
        console.log('❌ 회원가입 실패:', response.error)
        return response as AuthResponse
      }
    } catch (error) {
      console.error('❌ 회원가입 오류:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '회원가입 중 오류가 발생했습니다.',
      }
    }
  },

  // 로그인
  async signIn(params: SignInParams): Promise<AuthResponse> {
    try {
      console.log('🔐 로그인 요청:', { ...params, password: '***' })
      
      const response = await apiService.post('/auth/login', params)
      
      if (response.success && response.data) {
        // 토큰이 있으면 API 서비스에 설정
        if (response.data.token) {
          apiService.setToken(response.data.token)
        }
        // 사용자 객체 정규화
        if (response.data.user) {
          const normalized = normalizeApiUser(response.data.user)
          ;(response.data as any).user = normalized
        }
        
        console.log('✅ 로그인 성공!')
        return response as AuthResponse
      } else {
        console.log('❌ 로그인 실패:', response.error)
        return response as AuthResponse
      }
    } catch (error) {
      console.error('❌ 로그인 오류:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '로그인 중 오류가 발생했습니다.',
      }
    }
  },

  // 로그아웃
  async signOut(): Promise<void> {
    console.log('🔐 로그아웃')
    apiService.clearToken()
  },

  // 토큰 검증 및 사용자 정보 조회
  async verifyToken(token: string): Promise<AuthResponse> {
    try {
      console.log('🔐 토큰 검증 요청')
      
      apiService.setToken(token)
      const response = await apiService.get('/auth/profile')
      
      if (response.success && response.data) {
        console.log('✅ 토큰 검증 성공!')
        return {
          success: true,
          data: {
            user: response.data,
            token: token
          }
        }
      } else {
        console.log('❌ 토큰 검증 실패:', response.error)
        apiService.clearToken()
        return {
          success: false,
          error: response.error || '토큰 검증에 실패했습니다.'
        }
      }
    } catch (error) {
      console.error('❌ 토큰 검증 오류:', error)
      apiService.clearToken()
      return {
        success: false,
        error: '토큰 검증에 실패했습니다.',
      }
    }
  },
}
