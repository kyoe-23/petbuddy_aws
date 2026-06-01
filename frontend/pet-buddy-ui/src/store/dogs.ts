import { create } from 'zustand'
import { dogsService, Dog, CreateDogParams, UpdateDogParams } from '../services/dogs'

interface DogsState {
  dogs: Dog[]
  isLoading: boolean
  error: string | null

  // Actions
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  
  // Dogs CRUD
  fetchMyDogs: () => Promise<void>
  createDog: (params: CreateDogParams) => Promise<{ success: boolean; error?: string }>
  updateDog: (dogId: string, params: UpdateDogParams) => Promise<{ success: boolean; error?: string }>
  deleteDog: (dogId: string) => Promise<{ success: boolean; error?: string }>
  
  // Utility
  clearDogs: () => void
}

export const useDogsStore = create<DogsState>((set, get) => ({
  dogs: [],
  isLoading: false,
  error: null,

  setLoading: (isLoading: boolean) => {
    set({ isLoading })
  },

  setError: (error: string | null) => {
    set({ error })
  },

  // 내 강아지 목록 조회
  fetchMyDogs: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const result = await dogsService.getMyDogs()
      
      if (result.success && result.data) {
        set({ 
          dogs: result.data,
          isLoading: false,
          error: null
        })
      } else {
        set({ 
          isLoading: false,
          error: result.error || '강아지 목록을 불러올 수 없습니다.'
        })
      }
    } catch (error: any) {
      set({ 
        isLoading: false,
        error: error.message || '강아지 목록 조회 중 오류가 발생했습니다.'
      })
    }
  },

  // 강아지 등록
  createDog: async (params: CreateDogParams) => {
    set({ isLoading: true, error: null })
    
    try {
      const result = await dogsService.createDog(params)
      
      if (result.success && result.data) {
        // 새 강아지를 목록에 추가
        const currentDogs = get().dogs
        set({ 
          dogs: [...currentDogs, result.data],
          isLoading: false,
          error: null
        })
        
        return { success: true }
      } else {
        set({ 
          isLoading: false,
          error: result.error || '강아지 등록에 실패했습니다.'
        })
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      const errorMessage = error.message || '강아지 등록 중 오류가 발생했습니다.'
      set({ 
        isLoading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 강아지 정보 수정
  updateDog: async (dogId: string, params: UpdateDogParams) => {
    set({ isLoading: true, error: null })
    
    try {
      const result = await dogsService.updateDog(dogId, params)
      
      if (result.success) {
        // 목록에서 해당 강아지 정보 업데이트
        const currentDogs = get().dogs
        const updatedDogs = currentDogs.map(dog => 
          dog.id === dogId 
            ? { ...dog, ...params, updatedAt: new Date().toISOString() }
            : dog
        )
        
        set({ 
          dogs: updatedDogs,
          isLoading: false,
          error: null
        })
        
        return { success: true }
      } else {
        set({ 
          isLoading: false,
          error: result.error || '강아지 정보 수정에 실패했습니다.'
        })
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      const errorMessage = error.message || '강아지 정보 수정 중 오류가 발생했습니다.'
      set({ 
        isLoading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 강아지 삭제
  deleteDog: async (dogId: string) => {
    set({ isLoading: true, error: null })
    
    try {
      const result = await dogsService.deleteDog(dogId)
      
      if (result.success) {
        // 목록에서 해당 강아지 제거
        const currentDogs = get().dogs
        const filteredDogs = currentDogs.filter(dog => dog.id !== dogId)
        
        set({ 
          dogs: filteredDogs,
          isLoading: false,
          error: null
        })
        
        return { success: true }
      } else {
        set({ 
          isLoading: false,
          error: result.error || '강아지 삭제에 실패했습니다.'
        })
        return { success: false, error: result.error }
      }
    } catch (error: any) {
      const errorMessage = error.message || '강아지 삭제 중 오류가 발생했습니다.'
      set({ 
        isLoading: false,
        error: errorMessage
      })
      return { success: false, error: errorMessage }
    }
  },

  // 강아지 목록 초기화
  clearDogs: () => {
    set({ 
      dogs: [],
      isLoading: false,
      error: null
    })
  },
}))
