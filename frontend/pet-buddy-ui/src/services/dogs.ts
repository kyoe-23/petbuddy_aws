import { apiService } from './api'

export interface CreateDogParams {
  name: string
  breed: string
  age?: string
  weight?: string
  personality?: string
  dangbti?: string
  notes?: string
  photoUrl?: string
}

export interface UpdateDogParams {
  name?: string
  breed?: string
  age?: string
  weight?: string
  personality?: string
  dangbti?: string
  notes?: string
  photoUrl?: string
}

export interface Dog {
  id: string
  ownerId: string
  name: string
  breed: string
  age?: string
  weight?: string
  personality?: string
  dangbti?: string
  notes?: string
  photoUrl?: string
  aiBreedConfidence?: number
  aiCharacteristics?: string[]
  createdAt: string
  updatedAt: string
}

export const dogsService = {
  // 내 강아지 목록 조회
  async getMyDogs(): Promise<{ success: boolean; data?: Dog[]; error?: string }> {
    try {
      console.log('🐕 내 강아지 목록 조회 요청')
      
      const response = await apiService.get('/dogs')
      
      if (response.success) {
        console.log('✅ 강아지 목록 조회 성공:', response.data)
        return { success: true, data: response.data }
      } else {
        console.log('❌ 강아지 목록 조회 실패:', response.error)
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('❌ 강아지 목록 조회 오류:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '강아지 목록 조회 중 오류가 발생했습니다.',
      }
    }
  },

  // 강아지 등록
  async createDog(params: CreateDogParams): Promise<{ success: boolean; data?: Dog; error?: string }> {
    try {
      console.log('🐕 강아지 등록 요청:', { ...params, photoUrl: params.photoUrl ? '사진 있음' : '사진 없음' })
      
      const response = await apiService.post('/dogs', params)
      
      if (response.success) {
        console.log('✅ 강아지 등록 성공!')
        return { success: true, data: response.data }
      } else {
        console.log('❌ 강아지 등록 실패:', response.error)
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('❌ 강아지 등록 오류:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '강아지 등록 중 오류가 발생했습니다.',
      }
    }
  },

  // 강아지 정보 조회
  async getDog(dogId: string): Promise<{ success: boolean; data?: Dog; error?: string }> {
    try {
      console.log('🐕 강아지 정보 조회 요청:', dogId)
      
      const response = await apiService.get(`/dogs/${dogId}`)
      
      if (response.success) {
        console.log('✅ 강아지 정보 조회 성공!')
        return { success: true, data: response.data }
      } else {
        console.log('❌ 강아지 정보 조회 실패:', response.error)
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('❌ 강아지 정보 조회 오류:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '강아지 정보 조회 중 오류가 발생했습니다.',
      }
    }
  },

  // 강아지 정보 수정
  async updateDog(dogId: string, params: UpdateDogParams): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🐕 강아지 정보 수정 요청:', dogId, params)
      
      const response = await apiService.put(`/dogs/${dogId}`, params)
      
      if (response.success) {
        console.log('✅ 강아지 정보 수정 성공!')
        return { success: true }
      } else {
        console.log('❌ 강아지 정보 수정 실패:', response.error)
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('❌ 강아지 정보 수정 오류:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '강아지 정보 수정 중 오류가 발생했습니다.',
      }
    }
  },

  // 강아지 삭제
  async deleteDog(dogId: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🐕 강아지 삭제 요청:', dogId)
      
      const response = await apiService.delete(`/dogs/${dogId}`)
      
      if (response.success) {
        console.log('✅ 강아지 삭제 성공!')
        return { success: true }
      } else {
        console.log('❌ 강아지 삭제 실패:', response.error)
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('❌ 강아지 삭제 오류:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '강아지 삭제 중 오류가 발생했습니다.',
      }
    }
  },

  // AI 품종 분석
  async analyzeBreed(dogId: string, imageUrl: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log('🤖 AI 품종 분석 요청:', dogId)
      
      const response = await apiService.post(`/dogs/${dogId}/analyze-breed`, { imageUrl })
      
      if (response.success) {
        console.log('✅ AI 품종 분석 성공!')
        return { success: true, data: response.data }
      } else {
        console.log('❌ AI 품종 분석 실패:', response.error)
        return { success: false, error: response.error }
      }
    } catch (error) {
      console.error('❌ AI 품종 분석 오류:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI 품종 분석 중 오류가 발생했습니다.',
      }
    }
  },
}
