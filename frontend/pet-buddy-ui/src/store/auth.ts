import { create } from 'zustand'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, UserRole } from '../types'
import { authService, SignUpParams, SignInParams } from '../services/auth'

// SignUpParams와 SignInParams는 이제 services/auth.ts에서 import

interface AuthState {
  user: User | null
  activeRole: UserRole
  isAuthenticated: boolean
  token: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  setUser: (user: User) => void
  setToken: (token: string) => void
  setActiveRole: (role: UserRole) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Simple Local Auth Actions
  signUp: (params: SignUpParams) => Promise<{ success: boolean; error?: string }>
  signIn: (params: SignInParams) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  initializeAuth: () => Promise<void>
  
  // Legacy actions
  logout: () => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      activeRole: 'owner',
      isAuthenticated: false,
      token: null,
      isLoading: false,
      error: null,

      setUser: (user: User) => {
        set({ 
          user, 
          isAuthenticated: true,
          error: null,
          activeRole: 'owner'
        })
      },

      setToken: (token: string) => {
        set({ token })
      },

      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },

      setError: (error: string | null) => {
        set({ error })
      },

      setActiveRole: (role: UserRole) => {
        // 최소 기능 모드: 사용자 역할 제한 없이 토글 허용
        set({ activeRole: role })
      },

      // 실제 백엔드 API를 통한 회원가입
      signUp: async (params: SignUpParams) => {
        set({ isLoading: true, error: null })
        
        try {
          const result = await authService.signUp(params)
          
          if (result.success && result.data) {
            const { user, token } = result.data
            
            // 토큰을 AsyncStorage에 저장
            await AsyncStorage.setItem('auth_token', token)
            
            set({ 
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              activeRole: 'owner'
            })
            
            return { success: true }
          } else {
            set({ isLoading: false, error: result.error })
            return { success: false, error: result.error }
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },

      // 실제 백엔드 API를 통한 로그인
      signIn: async (params: SignInParams) => {
        set({ isLoading: true, error: null })
        
        try {
          const result = await authService.signIn(params)
          
          if (result.success && result.data) {
            const { user, token } = result.data
            
            // 토큰을 AsyncStorage에 저장
            await AsyncStorage.setItem('auth_token', token)
            
            set({ 
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              activeRole: 'owner'
            })
            
            return { success: true }
          } else {
            set({ isLoading: false, error: result.error })
            return { success: false, error: result.error }
          }
        } catch (error: any) {
          set({ isLoading: false, error: error.message })
          return { success: false, error: error.message }
        }
      },

      // 실제 백엔드 API를 통한 로그아웃
      signOut: async () => {
        await authService.signOut()
        await AsyncStorage.removeItem('auth_token')
        
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          activeRole: 'owner',
          isLoading: false,
          error: null
        })
      },

      // 앱 시작 시 인증 상태 초기화 (토큰 검증)
      initializeAuth: async () => {
        set({ isLoading: true })
        
        try {
          const token = await AsyncStorage.getItem('auth_token')
          
          if (token) {
            const result = await authService.verifyToken(token)
            
            if (result.success && result.data) {
              set({
                user: result.data.user,
                token,
                isAuthenticated: true,
                isLoading: false,
                activeRole: result.data.user.roleOwner ? 'owner' : 'sitter'
              })
            } else {
              // 토큰이 유효하지 않으면 제거
              await AsyncStorage.removeItem('auth_token')
              set({ isLoading: false })
            }
          } else {
            set({ isLoading: false })
          }
        } catch (error) {
          console.error('Auth initialization error:', error)
          set({ isLoading: false })
        }
      },

      // Legacy 함수들
      logout: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          activeRole: 'owner',
          error: null
        })
      },

      clearAuth: () => {
        set({ 
          user: null, 
          token: null, 
          isAuthenticated: false,
          activeRole: 'owner',
          error: null
        })
      },
    }),
    {
      name: 'pet-buddy-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        activeRole: state.activeRole,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

