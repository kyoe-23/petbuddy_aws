// 사용자 관련 타입
export interface User {
  id: string
  email: string
  phone: string
  fullName: string
  createdAt?: string
  updatedAt?: string
}

// 강아지 관련 타입
export interface Dog {
  id: string
  ownerId: string
  name: string
  breed: string
  gender: 'male' | 'female'
  birthdate: string
  weightKg: number
  temperament: string
  neutered: boolean
  photoUrl?: string
  notes?: string
  createdAt: string
}

// 시터 관련 타입
export interface SitterProfile {
  id: string
  userId: string
  bio: string
  experienceYears: number
  skills: string[]
  hourlyRate: number
  serviceRadiusKm: number
  lat: number
  lng: number
  verified: boolean
  ratingAvg: number
  ratingCount: number
  updatedAt: string
}

// 일정/요청 관련 타입
export interface JobRequest {
  id: string
  ownerId: string
  sitterId?: string
  dogId: string
  status: 'REQUESTED' | 'ACCEPTED' | 'DECLINED' | 'CANCELLED' | 'EXPIRED'
  startAt: string
  endAt: string
  addressLat: number
  addressLng: number
  notes?: string
  createdAt: string
  // 조인된 데이터
  dog?: Dog
  owner?: User
  sitter?: SitterProfile & { user: User }
}

// 앱 상태 타입
export type UserRole = 'owner' | 'sitter'

export interface AppState {
  user: User | null
  activeRole: UserRole
  isAuthenticated: boolean
}

