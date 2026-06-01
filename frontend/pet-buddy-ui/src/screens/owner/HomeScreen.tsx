import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  FlatList,
  Dimensions,
  Image,
  Modal,
  TextInput,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/auth'
import { apiService } from '../../services/api'
import { theme } from '../../styles/theme'
import { commonStyles } from '../../styles/commonStyles'

const { width } = Dimensions.get('window')

const OwnerHomeScreen = ({ navigation }: any) => {
  const { user, activeRole, setActiveRole } = useAuthStore()
  const [selectedDog, setSelectedDog] = useState<any>(null)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isDogAddModalVisible, setIsDogAddModalVisible] = useState(false)
  const [dogForm, setDogForm] = useState({
    name: '',
    breed: '',
    dbti: '',
    personality: '',
    birthDate: '',
    notes: '',
    profileImageUrl: '',
  })
  const [isJobModalVisible, setIsJobModalVisible] = useState(false)
  const [jobForm, setJobForm] = useState({
    dogId: '',
    title: '',
    description: '',
    location: '',
    startDate: '',
    endDate: '',
  })
  const [editForm, setEditForm] = useState({
    name: '',
    breed: '',
    personality: '',
    dangbti: '',
    dbti: '',
    dbtiName: '',
    notes: '',
  })
  const [isUploading, setIsUploading] = useState(false)

  // S3 이미지 업로드 공통 함수
  const uploadImageToS3 = async (imageUri: string): Promise<string> => {
    setIsUploading(true)
    try {
      // 이미지 blob 변환
      const response = await fetch(imageUri)
      const blob = await response.blob()
      const contentType = blob.type || 'image/jpeg'
      const fileName = `dog_${Date.now()}.jpg`

      console.log('📤 S3 업로드 시작:', { fileName, contentType, size: blob.size })

      // 백엔드에서 사전서명 URL 요청
      const signResp = await apiService.post('/uploads/sign', { fileName, contentType })
      
      if (!signResp.success) {
        throw new Error(signResp.error || '사전서명 URL 요청 실패')
      }

      const { uploadUrl, publicUrl } = signResp.data
      if (!uploadUrl || !publicUrl) {
        throw new Error('업로드 URL이 없습니다')
      }

      console.log('📝 사전서명 URL 획득:', { uploadUrl: uploadUrl.substring(0, 100) + '...', publicUrl })

      // S3에 직접 업로드
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: blob,
        headers: {
          'Content-Type': contentType,
        },
      })

      if (!uploadResponse.ok) {
        throw new Error(`S3 업로드 실패: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }

      console.log('✅ S3 업로드 성공:', publicUrl)
      return publicUrl

    } catch (error: any) {
      console.error('❌ S3 업로드 오류:', error)
      throw error
    } finally {
      setIsUploading(false)
    }
  }

  // 내 강아지 프로필들: 기본은 + 버튼만 노출
  const myDogs: any[] = []

  // 예정된 일정 (API 연동)
  const [upcomingSchedules, setUpcomingSchedules] = useState<any[]>([])

  // 공고 목록 (API 연동)
  const [jobFeed, setJobFeed] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  const [myDogsFromApi, setMyDogsFromApi] = useState<any[]>([])
  const [jobDetailVisible, setJobDetailVisible] = useState(false)
  const [selectedJob, setSelectedJob] = useState<any | null>(null)

  useEffect(() => {
    const loadJobs = async () => {
      setLoadingJobs(true)
      // 견주 화면은 시터가 등록한 공고를 조회
      const resp = await apiService.get<{ posts: any[] }>('/sitter-postings')
      if (resp.success) {
        setJobFeed((resp.data as any)?.posts || [])
      }
      setLoadingJobs(false)
    }
    loadJobs()
  }, [])

  useEffect(() => {
    const loadDogs = async () => {
      if (!user?.id) return
      const resp = await apiService.get<{ dogs: any[] }>(`/dogs/user/${user.id}`)
      if (resp.success) {
        setMyDogsFromApi(resp.data?.dogs || [])
      }
    }
    loadDogs()
  }, [user?.id])

  useEffect(() => {
    const loadBookings = async () => {
      if (!user?.id) return
      const resp = await apiService.get<{ bookings: any[] }>(`/bookings/owner/${user.id}`)
      if (resp.success) {
        const list = (resp.data as any)?.bookings || []
        const sorted = [...list].sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
        // 카드 렌더링 포맷으로 변환 + 정렬 보장
        const mapped = sorted.map((b: any) => ({
          id: String(b.booking_id || b.id),
          dogName: b.dog_name || '강아지',
          sitterName: b.sitter_email || '시터',
          service: '돌봄 예약',
          date: String(b.start_time).slice(0, 10),
          time: `${String(b.start_time).slice(11,16)} - ${String(b.end_time).slice(11,16)}`,
          status: b.booking_status || 'confirmed',
          location: b.location || '-',
          startAt: new Date(b.start_time).getTime(),
        }))
        setUpcomingSchedules(mapped)
      }
    }
    loadBookings()
  }, [user?.id])

  const openJobDetail = (job: any) => {
    setSelectedJob(job)
    setJobDetailVisible(true)
  }

  const closeJobDetail = () => {
    setJobDetailVisible(false)
    setSelectedJob(null)
  }

  const handleReserveFromJob = async () => {
    if (!user?.id || !selectedJob) return
    // 필요한 최소 정보: 견주, 시터, 강아지, 시간
    const sitterId = selectedJob.sitter_id || selectedJob.user_id || selectedJob.sitter_user_id
    const dogId = jobForm.dogId || myDogsFromApi?.[0]?.id || myDogsFromApi?.[0]?.dog_id
    if (!dogId) {
      Alert.alert('예약 불가', '반드시 내 반려견을 하나 이상 등록하고 선택해주세요.')
      return
    }
    if (!sitterId || !dogId) {
      Alert.alert('예약 불가', '시터 또는 반려견을 확인해주세요.')
      return
    }
    // 날짜 범위 기반 단순 시간 설정 (09:00~18:00)
    const start = (selectedJob.available_from || selectedJob.start_date || '').toString().slice(0,10) + ' 09:00:00'
    const end = (selectedJob.available_to || selectedJob.end_date || '').toString().slice(0,10) + ' 18:00:00'
    try {
      const resp = await apiService.post('/bookings', {
        owner_id: user.id,
        sitter_id: sitterId,
        dog_id: dogId,
        start_time: start,
        end_time: end,
        source_post_id: selectedJob.post_id,
      })
      if (resp.success) {
        // 공고 목록 갱신(해당 공고 사라짐), 예약 목록 갱신
        const [jobs, bookings] = await Promise.all([
          apiService.get<{ posts: any[] }>('/sitter-postings'),
          apiService.get<{ bookings: any[] }>(`/bookings/owner/${user.id}`),
        ])
        if (jobs.success) setJobFeed((jobs.data as any)?.posts || [])
        if (bookings.success) {
          const list = (bookings.data as any)?.bookings || []
          const sorted = [...list].sort((a: any, b: any) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
          const mapped = sorted.map((b: any) => ({
            id: String(b.booking_id || b.id),
            dogName: b.dog_name || '강아지',
            sitterName: b.sitter_email || '시터',
            service: '돌봄 예약',
            date: String(b.start_time).slice(0, 10),
            time: `${String(b.start_time).slice(11,16)} - ${String(b.end_time).slice(11,16)}`,
            status: b.booking_status || 'confirmed',
            location: b.location || '-',
            startAt: new Date(b.start_time).getTime(),
          }))
          setUpcomingSchedules(mapped)
        }
        closeJobDetail()
        Alert.alert('예약 완료', '일정이 등록되었습니다.')
      } else {
        Alert.alert('예약 실패', resp.error || '예약을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
      }
    } catch (e: any) {
      Alert.alert('예약 실패', e?.message || '네트워크 오류가 발생했습니다.')
    }
  }

  const fmtDate = (d?: any) => {
    if (!d) return '-'
    try { return String(d).slice(0, 10) } catch { return '-' }
  }

  // 성격 설명을 깔끔하게 정리하는 함수
  const formatPersonalityText = (text?: string) => {
    if (!text) return ''
    
    // 1. 긴 문장을 점으로 분리
    const sentences = text.split('. ').filter(s => s.trim())
    
    // 2. 각 문장을 정리하고 핵심만 추출
    const cleanSentences = sentences.map(sentence => {
      return sentence
        .replace(/강아지예요|강아지입니다/g, '성격')
        .replace(/해 줍니다|해줍니다/g, '함')
        .replace(/하는 천사 같은 성격이에요/g, '함')
        .replace(/을 가장 소중히 여기며/g, '을 소중히 여기고')
        .replace(/에도 금세 적응하며/g, '에 잘 적응하고')
        .replace(/언제나 안정적이고 평화로운 분위기를 만들어/g, '평화로운 분위기 조성')
        .replace(/모든 가족 구성원에게 골고루 애정을 표현/g, '가족 모두에게 애정 표현')
        .trim()
    })
    
    // 3. 짧은 문장들을 줄바꿈으로 연결
    return cleanSentences.join('\n• ').replace(/^/, '• ')
  }

  const handleCreateJob = async () => {
    if (!user?.id) return
    if (!jobForm.dogId || !jobForm.title || !jobForm.startDate || !jobForm.endDate) {
      Alert.alert('필수 입력', '반려견, 제목, 시작/종료 날짜를 입력해주세요.')
      return
    }
    const payload = {
      owner_id: user.id,
      dog_id: jobForm.dogId,
      title: jobForm.title.trim(),
      description: jobForm.description?.trim() || null,
      location: jobForm.location?.trim() || null,
      start_date: jobForm.startDate.trim(),
      end_date: jobForm.endDate.trim(),
    }
    console.log('📌 공고 등록 요청', payload)
    const resp = await apiService.post('/jobs', payload)
    console.log('📌 공고 등록 응답', resp)
    if (resp.success) {
      setIsJobModalVisible(false)
      setJobForm({ dogId: '', title: '', description: '', location: '', startDate: '', endDate: '' })
      // refresh jobs
      const list = await apiService.get<{ jobs: any[] }>('/jobs')
      if (list.success) setJobFeed(list.data?.jobs || [])
      Alert.alert('등록 완료', '공고가 등록되었습니다.')
    } else {
      Alert.alert('실패', resp.error || '공고 등록에 실패했습니다.')
    }
  }

  // 댕BTI 설명 함수
  const getDangBTIDescription = (dangbti: string) => {
    const descriptions: { [key: string]: string } = {
      'ESFP': '🎉 활발한 엔터테이너 - 사교적이고 에너지 넘치는 성격',
      'ISFJ': '🛡️ 수호자 - 온순하고 보호본능이 강한 성격',
      'INTJ': '🏛️ 건축가 - 독립적이고 계획적인 성격',
      'ENFP': '🌟 열정적인 활동가 - 호기심 많고 친근한 성격',
      'INFP': '🎨 중재자 - 조용하고 평화로운 성격',
      'ESTJ': '👑 경영자 - 리더십 있고 활동적인 성격',
      'ISTJ': '⚖️ 현실주의자 - 차분하고 신중한 성격',
      'ESTP': '🏃‍♂️ 모험가 - 활동적이고 즉흥적인 성격',
      'ISTP': '🔧 장인 - 독립적이고 실용적인 성격',
      'ENFJ': '🤝 선도자 - 사교적이고 배려심 많은 성격',
      'INFJ': '🔮 옹호자 - 직관적이고 신비로운 성격',
      'ENTP': '💡 토론자 - 창의적이고 호기심 많은 성격',
      'INTP': '🤔 논리술사 - 분석적이고 사색적인 성격',
      'ESFJ': '💝 집정관 - 친근하고 돌봄을 좋아하는 성격',
      'ISFP': '🎭 모험가 - 예술적이고 자유로운 성격',
      'ENTJ': '🎯 통솔자 - 목표지향적이고 카리스마 있는 성격',
    }
    return descriptions[dangbti] || '🐕 특별한 성격의 강아지'
  }

  const handleDogProfilePress = (dog: any) => {
    console.log('🐕 Selected dog data:', dog)
    console.log('🔍 DBTI info:', { dbti: dog.dbti, dangbti: dog.dangbti })
    setSelectedDog(dog)
    setEditForm({
      name: dog.name,
      breed: dog.breed,
      personality: dog.personality,
      dangbti: dog.dangbti || dog.dbti,
      dbti: dog.dbti,
      dbtiName: dog.dbtiName,
      notes: dog.notes,
    })
    setIsEditing(false)
    setIsModalVisible(true)
  }

  const handleEditSave = () => {
    // 실제로는 여기서 API 호출하여 저장
    Alert.alert('저장 완료', '강아지 프로필이 업데이트되었습니다.', [
      { text: '확인', onPress: () => {
        setIsEditing(false)
        setIsModalVisible(false)
      }}
    ])
  }

  const handleDeleteDog = () => {
    if (!selectedDog?.id || !user?.id) return
    Alert.alert('프로필 삭제', `${selectedDog?.name}의 프로필을 삭제할까요?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            const resp = await apiService.delete(`/dogs/${selectedDog.id}?user_id=${encodeURIComponent(user.id)}`)
            if (resp.success) {
              // 목록 갱신
              const refreshed = await apiService.get<{ dogs: any[] }>(`/dogs/user/${user.id}`)
              if (refreshed.success) setMyDogsFromApi(refreshed.data?.dogs || [])
              setIsModalVisible(false)
              Alert.alert('삭제 완료', '강아지 프로필이 삭제되었습니다.')
            } else {
              Alert.alert('삭제 실패', resp.error || '강아지 삭제에 실패했습니다.')
            }
          } catch (e: any) {
            Alert.alert('삭제 실패', e?.message || '네트워크 오류가 발생했습니다.')
          }
        }
      }
    ])
  }

  const handleAddDogProfile = () => {
    if (!user?.id) {
      Alert.alert('로그인 필요', '강아지 등록을 위해 먼저 로그인하세요.')
      return
    }
    // 새로운 3단계 등록 플로우로 이동
    navigation.navigate('DogPhotoCapture')
  }

  const handleSchedulePress = (schedule: any) => {
    const statusText = schedule.status === 'confirmed' ? '확정' : '대기 중'
    Alert.alert(
      `${schedule.service} - ${statusText}`,
      `강아지: ${schedule.dogName}\n시터: ${schedule.sitterName}\n일시: ${schedule.date} ${schedule.time}\n장소: ${schedule.location}`,
      [
        { text: '취소', style: 'cancel' },
        { text: '일정 수정', onPress: () => Alert.alert('준비 중', '일정 수정 기능은 준비 중입니다.') },
        { text: '일정 삭제', style: 'destructive', onPress: () => Alert.alert('삭제', '일정 삭제 기능은 준비 중입니다.') },
      ]
    )
  }

  const handleSitterPress = (sitter: any) => {
    Alert.alert(
      sitter.name,
      `⭐ ${sitter.rating} (${sitter.reviewCount}개 리뷰)\n📍 ${sitter.distance}\n💰 시간당 ${sitter.hourlyRate.toLocaleString()}원\n🎯 ${sitter.experience} 경력\n⚡ ${sitter.responseTime}\n\n전문분야: ${sitter.specialties.join(', ')}`,
      [
        { text: '취소', style: 'cancel' },
        { text: '프로필 보기', onPress: () => Alert.alert('준비 중', '시터 상세 프로필 기능은 준비 중입니다.') },
        { text: '매칭 요청', onPress: () => Alert.alert('매칭 요청', '매칭 요청 기능은 준비 중입니다.') },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>안녕하세요</Text>
          <Text style={styles.userName}>{user?.fullName}님</Text>
        </View>
        <View style={styles.headerRight}>
          {/* 역할 전환 토글 */}
          <View style={commonStyles.roleToggleContainer}>
            <TouchableOpacity 
              onPress={() => setActiveRole('owner')} 
              style={[
                commonStyles.roleToggleButton,
                activeRole === 'owner' ? commonStyles.activeRoleButton : commonStyles.inactiveRoleButton
              ]}
            >
              <Text style={[
                commonStyles.roleToggleText,
                activeRole === 'owner' ? commonStyles.activeRoleText : commonStyles.inactiveRoleText
              ]}>견주</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setActiveRole('sitter')} 
              style={[
                commonStyles.roleToggleButton,
                activeRole === 'sitter' ? commonStyles.activeRoleButton : commonStyles.inactiveRoleButton
              ]}
            >
              <Text style={[
                commonStyles.roleToggleText,
                activeRole === 'sitter' ? commonStyles.activeRoleText : commonStyles.inactiveRoleText
              ]}>시터</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 강아지 프로필 (인스타 스토리 스타일) - 내 강아지 + 추가 버튼 */}
        <View style={styles.dogProfilesContainer}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[...(myDogsFromApi || []), { id: 'add', name: '추가', isAddButton: true }]}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.dogProfilesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.dogProfileItem}
                onPress={() => item.isAddButton ? handleAddDogProfile() : handleDogProfilePress(item)}
              >
                <View style={[
                  styles.dogProfileCircle,
                  item.isAddButton && styles.addProfileCircle
                ]}>
                  {item.isAddButton ? (
                    <Ionicons name="add" size={24} color={theme.colors.primary} />
                  ) : item.photo_url ? (
                    <Image source={{ uri: item.photo_url }} style={styles.dogProfilePhoto} />
                  ) : (
                    <Text style={{ color: theme.colors.primary, fontWeight:'700' }}>{String(item.name || '?').slice(0,1)}</Text>
                  )}
                </View>
                <Text style={styles.dogProfileName} numberOfLines={1}>
                  {item.isAddButton ? '추가' : (item.name || '이름없음')}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* 예정된 일정 (좌우 스와이프) */}
        <View style={styles.schedulesContainer}>
          <Text style={styles.sectionTitle}>예정된 일정</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={upcomingSchedules}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.schedulesList}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.scheduleCard}
                onPress={() => handleSchedulePress(item)}
              >
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleService}>{item.service}</Text>
                  <View style={[
                    styles.scheduleStatus,
                    item.status === 'confirmed' ? styles.confirmedStatus : styles.pendingStatus
                  ]}>
                    <Text style={[
                      styles.scheduleStatusText,
                      item.status === 'confirmed' ? styles.confirmedStatusText : styles.pendingStatusText
                    ]}>
                      {item.status === 'confirmed' ? '확정' : '대기'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.scheduleDog}>🐕 {item.dogName}</Text>
                <Text style={styles.scheduleSitter}>👨‍💼 {item.sitterName}</Text>
                <Text style={styles.scheduleTime}>📅 {item.date} {item.time}</Text>
                <Text style={styles.scheduleLocation}>📍 {item.location}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* 공고 피드 (상하 스크롤) */}
        <View style={styles.sittersContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>공고</Text>
            <TouchableOpacity onPress={() => setIsJobModalVisible(true)}>
              <Text style={styles.seeAllText}>+ 공고 등록</Text>
            </TouchableOpacity>
          </View>

          {loadingJobs ? (
            <Text style={{ paddingHorizontal: 16, color: '#6B7280' }}>불러오는 중...</Text>
          ) : jobFeed.length === 0 ? (
            <Text style={{ paddingHorizontal: 16, color: '#6B7280' }}>등록된 공고가 없습니다.</Text>
          ) : (
            jobFeed.map((job) => (
              <TouchableOpacity key={String(job.post_id || job.job_id)} style={styles.sitterCard} onPress={() => openJobDetail(job)}>
                <View style={styles.sitterInfo}>
                  <View style={styles.sitterAvatar}>
                    <Ionicons name="briefcase-outline" size={22} color={theme.colors.primary} />
                  </View>
                  <View style={styles.sitterDetails}>
                    <View style={styles.sitterHeader}>
                      <Text style={styles.sitterName}>{job.title}</Text>
                      <View style={styles.ratingContainer}>
                        <Text style={styles.reviewCount}>{job.status || 'active'}</Text>
                      </View>
                    </View>
                    <Text style={styles.sitterMeta}>
                      👤 시터: {job.sitter_name || job.sitter_email || '익명'} • 📍 {job.location || '지역 미지정'}
                    </Text>
                    <Text style={styles.sitterRate}>
                      📅 {fmtDate(job.available_from || job.start_date)} ~ {fmtDate(job.available_to || job.end_date)}
                    </Text>
                    {job.description ? (
                      <Text style={{ fontSize: 12, color: '#6B7280' }} numberOfLines={2}>{job.description}</Text>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 공고 등록 모달 */}
        <Modal
          visible={isJobModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setIsJobModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsJobModalVisible(false)}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>공고 등록</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>기본 정보</Text>

                {/* 반려견 선택 */}
                <View style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>반려견 선택</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {myDogsFromApi.map((d) => (
                      <TouchableOpacity
                        key={d.id}
                        style={{
                          paddingHorizontal: 12,
                          paddingVertical: 8,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: jobForm.dogId === d.id ? '{theme.colors.primary}' : '#D1D5DB',
                          marginRight: 8,
                          backgroundColor: jobForm.dogId === d.id ? '#FEF7EE' : 'white',
                        }}
                        onPress={() => setJobForm({ ...jobForm, dogId: d.id })}
                      >
                        <Text style={{ color: '#374151' }}>{d.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                  {myDogsFromApi.length === 0 && (
                    <Text style={{ fontSize: 12, color: '#6B7280' }}>등록된 반려견이 없습니다. 먼저 반려견을 추가해주세요.</Text>
                  )}
                </View>

                {/* 제목 */}
                <View style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>제목</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={jobForm.title}
                    onChangeText={(t) => setJobForm({ ...jobForm, title: t })}
                    placeholder="예) 하루 산책 돌봄 요청"
                  />
                </View>

                {/* 위치 */}
                <View style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>위치</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={jobForm.location}
                    onChangeText={(t) => setJobForm({ ...jobForm, location: t })}
                    placeholder="예) 서울 강남구"
                  />
                </View>

                {/* 기간 */}
                <View style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>기간 (YYYY-MM-DD)</Text>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TextInput
                      style={[styles.modalInput, { flex: 1 }]}
                      value={jobForm.startDate}
                      onChangeText={(t) => setJobForm({ ...jobForm, startDate: t })}
                      placeholder="시작일"
                    />
                    <TextInput
                      style={[styles.modalInput, { flex: 1 }]}
                      value={jobForm.endDate}
                      onChangeText={(t) => setJobForm({ ...jobForm, endDate: t })}
                      placeholder="종료일"
                    />
                  </View>
                </View>

                {/* 상세 설명 */}
                <View style={styles.modalField}>
                  <Text style={styles.modalFieldLabel}>상세 설명</Text>
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    value={jobForm.description}
                    onChangeText={(t) => setJobForm({ ...jobForm, description: t })}
                    placeholder="예) 친근한 강아지 산책 2회(오전/오후) 부탁드려요."
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <TouchableOpacity style={styles.modalSaveButton} onPress={handleCreateJob}>
                  <Text style={styles.modalSaveButtonText}>등록하기</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* 공고 상세 모달 */}
        <Modal
          visible={jobDetailVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={closeJobDetail}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity style={styles.modalCloseButton} onPress={closeJobDetail}>
                <Ionicons name="close" size={24} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>공고 상세</Text>
              <View style={{ width: 60 }} />
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>{selectedJob?.title || '제목 없음'}</Text>
                <View style={{ gap: 10 }}>
                  <Text style={styles.modalFieldValue}>📍 위치: {selectedJob?.location || '지역 미지정'}</Text>
                  <Text style={styles.modalFieldValue}>📅 기간: {fmtDate(selectedJob?.available_from || selectedJob?.start_date)} ~ {fmtDate(selectedJob?.available_to || selectedJob?.end_date)}</Text>
                  <Text style={styles.modalFieldValue}>상태: {selectedJob?.status || 'active'}</Text>
                </View>
              </View>

              {selectedJob?.description ? (
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>설명</Text>
                  <Text style={styles.modalFieldValue}>{selectedJob?.description}</Text>
                </View>
              ) : null}

              <View style={{ height: 20 }} />

              <TouchableOpacity style={styles.modalSaveButton} onPress={handleReserveFromJob}>
                <Text style={styles.modalSaveButtonText}>이 공고로 예약하기</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>

      {/* 강아지 등록 모달 */}
      <Modal
        visible={isDogAddModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsDogAddModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setIsDogAddModalVisible(false)}>
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>강아지 등록</Text>
            <View style={{ width: 60 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>기본 정보</Text>


              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>이름 (필수)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={dogForm.name}
                  onChangeText={(t) => setDogForm({ ...dogForm, name: t })}
                  placeholder="예) 멍멍이"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>품종</Text>
                <TextInput
                  style={styles.modalInput}
                  value={dogForm.breed}
                  onChangeText={(t) => setDogForm({ ...dogForm, breed: t })}
                  placeholder="예) 골든 리트리버"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>DBTI</Text>
                <TextInput
                  style={styles.modalInput}
                  value={dogForm.dbti}
                  onChangeText={(t) => setDogForm({ ...dogForm, dbti: t })}
                  placeholder="예) SHRA"
                  maxLength={10}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>성격</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={dogForm.personality}
                  onChangeText={(t) => setDogForm({ ...dogForm, personality: t })}
                  placeholder="예) 활발하고 사람을 좋아해요"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>생일 (YYYY-MM-DD)</Text>
                <TextInput
                  style={styles.modalInput}
                  value={dogForm.birthDate}
                  onChangeText={(t) => setDogForm({ ...dogForm, birthDate: t })}
                  placeholder="예) 2021-05-01"
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>사진</Text>
                <View style={{ flexDirection:'row', alignItems:'center', gap:12 }}>
                  {dogForm.profileImageUrl ? (
                    <Image source={{ uri: dogForm.profileImageUrl }} style={{ width:56, height:56, borderRadius:28, borderWidth:1, borderColor:'#E5E7EB' }} />
                  ) : (
                    <View style={{ width:56, height:56, borderRadius:28, backgroundColor:'#F3F4F6', borderWidth:1, borderColor:'#E5E7EB', alignItems:'center', justifyContent:'center' }}>
                      <Ionicons name="camera" size={20} color="#9CA3AF" />
                    </View>
                  )}
                  <TouchableOpacity
                    onPress={async () => {
                      if (isUploading) {
                        Alert.alert('업로드 중', '이미지 업로드가 진행 중입니다. 잠시 기다려주세요.')
                        return
                      }

                      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
                      if (status !== 'granted') {
                        Alert.alert('권한 필요', '사진 접근 권한이 필요합니다.')
                        return
                      }

                      const result = await ImagePicker.launchImageLibraryAsync({ 
                        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
                        quality: 0.8, 
                        base64: false 
                      })
                      
                      if (!result.canceled && result.assets?.[0]) {
                        try {
                          const publicUrl = await uploadImageToS3(result.assets[0].uri)
                          setDogForm({ ...dogForm, profileImageUrl: publicUrl })
                          Alert.alert('업로드 완료', '사진이 성공적으로 업로드되었습니다.')
                          
                          // 이미지 분석 결과 조회 함수
                          const checkAnalysisResult = async (attempt = 1, maxAttempts = 3) => {
                            try {
                              console.log('🔍 이미지 분석 결과 조회 시도:', publicUrl)
                              const analysisResp = await apiService.get(`/dog-analysis/by-url?s3Url=${encodeURIComponent(publicUrl)}`)
                              console.log('📊 분석 응답 전체:', analysisResp)
                              
                              if (analysisResp.success && analysisResp.data) {
                                console.log('✅ 분석 데이터:', analysisResp.data)
                                const { recognizedBreed, dbtiName, dbtiDescription } = analysisResp.data
                                
                                // 견종이 인식되었을 때
                                if (recognizedBreed && recognizedBreed.trim() !== '') {
                                  const { dbtiType, dbtiName, dbtiDescription } = analysisResp.data
                                  setDogForm(prev => ({
                                    ...prev,
                                    breed: recognizedBreed || prev.breed,
                                    dbti: dbtiType || prev.dbti,
                                    personality: formatPersonalityText(dbtiDescription) || prev.personality
                                  }))
                                  
                                  Alert.alert(
                                    '🤖 AI 분석 완료', 
                                    `인식된 견종: ${recognizedBreed}\nDBTI: ${dbtiType} - ${dbtiName}\n\n자동으로 입력되었습니다!`
                                  )
                                } else {
                                  // 견종이 인식되지 않았을 때
                                  Alert.alert(
                                    '🔍 견종 인식 실패',
                                    '이미지에서 인식된 견종이 없습니다.\n\n다른 각도에서 찍은 사진을 시도해보시거나, 직접 견종을 입력해주세요.',
                                    [
                                      {
                                        text: '확인',
                                        style: 'default'
                                      }
                                    ]
                                  )
                                }
                              } else {
                                // 분석 결과가 없을 때 또는 success가 false일 때
                                console.log('❌ 분석 결과 없음 또는 실패:', analysisResp)
                                if (analysisResp.success === false && analysisResp.message) {
                                  // 서버에서 명시적으로 "분석 결과 없음" 응답
                                  Alert.alert(
                                    '🔍 견종 인식 실패',
                                    '이미지에서 인식된 견종이 없습니다.\n\n다른 각도에서 찍은 사진을 시도해보시거나, 직접 견종을 입력해주세요.',
                                    [
                                      {
                                        text: '확인',
                                        style: 'default'
                                      }
                                    ]
                                  )
                                } else {
                                  // 아직 분석이 완료되지 않음 - 재시도
                                  if (attempt < maxAttempts) {
                                    console.log(`🔄 재시도 ${attempt + 1}/${maxAttempts} (3초 후)`)
                                    setTimeout(() => checkAnalysisResult(attempt + 1, maxAttempts), 3000)
                                  } else {
                                    Alert.alert(
                                      '⏱️ 분석 시간 초과',
                                      '이미지 분석이 예상보다 오래 걸리고 있습니다.\n잠시 후 다시 시도해주세요.'
                                    )
                                  }
                                }
                              }
                            } catch (error: any) {
                              console.log('ℹ️ 분석 결과 조회 실패:', error.message)
                              if (attempt < maxAttempts) {
                                console.log(`🔄 재시도 ${attempt + 1}/${maxAttempts} (3초 후)`)
                                setTimeout(() => checkAnalysisResult(attempt + 1, maxAttempts), 3000)
                              } else {
                                Alert.alert(
                                  '⏱️ 분석 확인 실패',
                                  '이미지 분석 결과를 확인할 수 없습니다.\n잠시 후 다시 시도해주세요.'
                                )
                              }
                            }
                          }
                          
                          // 첫 번째 시도 (5초 후 시작)
                          setTimeout(() => checkAnalysisResult(), 5000)
                        } catch (e: any) {
                          Alert.alert('업로드 실패', e?.message || '이미지 업로드에 실패했습니다.')
                        }
                      }
                    }}
                    style={{ 
                      paddingHorizontal: 12, 
                      paddingVertical: 10, 
                      borderWidth: 1, 
                      borderColor: isUploading ? '#9CA3AF' : '#E5E7EB', 
                      borderRadius: 8,
                      opacity: isUploading ? 0.6 : 1 
                    }}
                    disabled={isUploading}
                  >
                    <Text style={{ color: isUploading ? '#9CA3AF' : '#374151' }}>
                      {isUploading ? '업로드 중...' : '앨범에서 선택'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={async () => {
                      if (isUploading) {
                        Alert.alert('업로드 중', '이미지 업로드가 진행 중입니다. 잠시 기다려주세요.')
                        return
                      }

                      const { status } = await ImagePicker.requestCameraPermissionsAsync()
                      if (status !== 'granted') {
                        Alert.alert('권한 필요', '카메라 권한이 필요합니다.')
                        return
                      }

                      const result = await ImagePicker.launchCameraAsync({ 
                        mediaTypes: ImagePicker.MediaTypeOptions.Images, 
                        quality: 0.8, 
                        base64: false 
                      })
                      
                      if (!result.canceled && result.assets?.[0]) {
                        try {
                          const publicUrl = await uploadImageToS3(result.assets[0].uri)
                          setDogForm({ ...dogForm, profileImageUrl: publicUrl })
                          Alert.alert('업로드 완료', '사진이 성공적으로 업로드되었습니다.')
                          
                          // 이미지 분석 결과 조회 함수
                          const checkAnalysisResult = async (attempt = 1, maxAttempts = 3) => {
                            try {
                              console.log('🔍 이미지 분석 결과 조회 시도:', publicUrl)
                              const analysisResp = await apiService.get(`/dog-analysis/by-url?s3Url=${encodeURIComponent(publicUrl)}`)
                              console.log('📊 분석 응답 전체:', analysisResp)
                              
                              if (analysisResp.success && analysisResp.data) {
                                console.log('✅ 분석 데이터:', analysisResp.data)
                                const { recognizedBreed, dbtiName, dbtiDescription } = analysisResp.data
                                
                                // 견종이 인식되었을 때
                                if (recognizedBreed && recognizedBreed.trim() !== '') {
                                  const { dbtiType, dbtiName, dbtiDescription } = analysisResp.data
                                  setDogForm(prev => ({
                                    ...prev,
                                    breed: recognizedBreed || prev.breed,
                                    dbti: dbtiType || prev.dbti,
                                    personality: formatPersonalityText(dbtiDescription) || prev.personality
                                  }))
                                  
                                  Alert.alert(
                                    '🤖 AI 분석 완료', 
                                    `인식된 견종: ${recognizedBreed}\nDBTI: ${dbtiType} - ${dbtiName}\n\n자동으로 입력되었습니다!`
                                  )
                                } else {
                                  // 견종이 인식되지 않았을 때
                                  Alert.alert(
                                    '🔍 견종 인식 실패',
                                    '이미지에서 인식된 견종이 없습니다.\n\n다른 각도에서 찍은 사진을 시도해보시거나, 직접 견종을 입력해주세요.',
                                    [
                                      {
                                        text: '확인',
                                        style: 'default'
                                      }
                                    ]
                                  )
                                }
                              } else {
                                // 분석 결과가 없을 때 또는 success가 false일 때
                                console.log('❌ 분석 결과 없음 또는 실패:', analysisResp)
                                if (analysisResp.success === false && analysisResp.message) {
                                  // 서버에서 명시적으로 "분석 결과 없음" 응답
                                  Alert.alert(
                                    '🔍 견종 인식 실패',
                                    '이미지에서 인식된 견종이 없습니다.\n\n다른 각도에서 찍은 사진을 시도해보시거나, 직접 견종을 입력해주세요.',
                                    [
                                      {
                                        text: '확인',
                                        style: 'default'
                                      }
                                    ]
                                  )
                                } else {
                                  // 아직 분석이 완료되지 않음 - 재시도
                                  if (attempt < maxAttempts) {
                                    console.log(`🔄 재시도 ${attempt + 1}/${maxAttempts} (3초 후)`)
                                    setTimeout(() => checkAnalysisResult(attempt + 1, maxAttempts), 3000)
                                  } else {
                                    Alert.alert(
                                      '⏱️ 분석 시간 초과',
                                      '이미지 분석이 예상보다 오래 걸리고 있습니다.\n잠시 후 다시 시도해주세요.'
                                    )
                                  }
                                }
                              }
                            } catch (error: any) {
                              console.log('ℹ️ 분석 결과 조회 실패:', error.message)
                              if (attempt < maxAttempts) {
                                console.log(`🔄 재시도 ${attempt + 1}/${maxAttempts} (3초 후)`)
                                setTimeout(() => checkAnalysisResult(attempt + 1, maxAttempts), 3000)
                              } else {
                                Alert.alert(
                                  '⏱️ 분석 확인 실패',
                                  '이미지 분석 결과를 확인할 수 없습니다.\n잠시 후 다시 시도해주세요.'
                                )
                              }
                            }
                          }
                          
                          // 첫 번째 시도 (5초 후 시작)
                          setTimeout(() => checkAnalysisResult(), 5000)
                        } catch (e: any) {
                          Alert.alert('업로드 실패', e?.message || '이미지 업로드에 실패했습니다.')
                        }
                      }
                    }}
                    style={{ 
                      paddingHorizontal: 12, 
                      paddingVertical: 10, 
                      borderWidth: 1, 
                      borderColor: isUploading ? '#9CA3AF' : '#E5E7EB', 
                      borderRadius: 8,
                      opacity: isUploading ? 0.6 : 1 
                    }}
                    disabled={isUploading}
                  >
                    <Text style={{ color: isUploading ? '#9CA3AF' : '#374151' }}>
                      {isUploading ? '업로드 중...' : '사진 촬영'}
                    </Text>
                  </TouchableOpacity>
                </View>
                <Text style={{ fontSize:12, color:'#6B7280', marginTop:6 }}>🤖 사진 업로드 후 AI가 자동으로 품종과 성격을 분석합니다</Text>
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>특이사항</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea]}
                  value={dogForm.notes}
                  onChangeText={(t) => setDogForm({ ...dogForm, notes: t })}
                  placeholder="예) 알레르기 있음"
                  multiline
                  numberOfLines={3}
                />
              </View>

              <TouchableOpacity
                style={styles.modalSaveButton}
                onPress={async () => {
                  if (!user?.id) {
                    Alert.alert('오류', '사용자 정보가 없습니다. 다시 로그인 해주세요.')
                    return
                  }
                  if (!dogForm.name.trim()) {
                    Alert.alert('필수 입력', '강아지 이름을 입력해주세요.')
                    return
                  }
                  const payload = {
                    user_id: user.id,
                    name: dogForm.name.trim(),
                    profile_image_url: dogForm.profileImageUrl?.trim() || null,
                    breed: dogForm.breed?.trim() || null,
                    dbti: dogForm.dbti?.trim() || null,
                    personality: dogForm.personality?.trim() || null,
                    birth_date: dogForm.birthDate?.trim() || null,
                    special_notes: dogForm.notes?.trim() || null,
                  }
                  try {
                    const resp = await apiService.post('/dogs', payload)
                    if (resp.success) {
                      setIsDogAddModalVisible(false)
                      setDogForm({ name: '', breed: '', dbti: '', personality: '', birthDate: '', notes: '', profileImageUrl: '' })
                      // 목록 새로고침 (향후 노출용)
                      const refreshed = await apiService.get<{ dogs: any[] }>(`/dogs/user/${user.id}`)
                      if (refreshed.success) setMyDogsFromApi(refreshed.data?.dogs || [])
                      Alert.alert('등록 완료', '강아지 프로필이 등록되었습니다.')
                    } else {
                      Alert.alert('등록 실패', resp.error || '강아지 등록에 실패했습니다.')
                    }
                  } catch (e: any) {
                    Alert.alert('등록 실패', e?.message || '네트워크 오류가 발생했습니다.')
                  }
                }}
              >
                <Text style={styles.modalSaveButtonText}>등록하기</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* 강아지 프로필 모달 */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          {/* 모달 헤더 */}
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>
              {selectedDog?.name} 프로필
            </Text>
            <TouchableOpacity
              style={styles.modalEditButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Ionicons name={isEditing ? "checkmark" : "pencil"} size={20} color="{theme.colors.primary}" />
              <Text style={styles.modalEditText}>
                {isEditing ? '완료' : '편집'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* 강아지 사진 */}
            <View style={styles.modalPhotoContainer}>
              <Image source={{ uri: selectedDog?.profile_image_url || selectedDog?.photo }} style={styles.modalPhoto} />
              {isEditing && (
                <TouchableOpacity style={styles.changePhotoButton}>
                  <Ionicons name="camera" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>

            {/* 기본 정보 */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>기본 정보</Text>
              
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>이름</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.modalInput}
                    value={editForm.name}
                    onChangeText={(text) => setEditForm({...editForm, name: text})}
                    placeholder="강아지 이름"
                  />
                ) : (
                  <Text style={styles.modalFieldValue}>{selectedDog?.name}</Text>
                )}
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>품종</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.modalInput}
                    value={editForm.breed}
                    onChangeText={(text) => setEditForm({...editForm, breed: text})}
                    placeholder="품종"
                  />
                ) : (
                  <Text style={styles.modalFieldValue}>{selectedDog?.breed}</Text>
                )}
              </View>

            </View>

            {/* 성격 및 특성 */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>성격 및 특성</Text>
              
              <View style={styles.modalField}>
                <View style={styles.personalityHeader}>
                  <Ionicons name="heart" size={20} color={theme.colors.primary} />
                  <Text style={styles.modalFieldLabel}>성격</Text>
                </View>
                {isEditing ? (
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    value={editForm.personality}
                    onChangeText={(text) => setEditForm({...editForm, personality: text})}
                    placeholder="성격 설명"
                    multiline
                    numberOfLines={3}
                  />
                ) : (
                  <View style={styles.personalityCardList}>
                    {selectedDog?.personality ? 
                      selectedDog.personality.split('.').filter((sentence: string) => sentence.trim()).map((sentence: string, index: number) => (
                        <View key={index} style={styles.personalityCard}>
                          <Ionicons name="heart" size={16} color={theme.colors.primary} />
                          <Text style={styles.personalityCardText}>{sentence.trim()}</Text>
                        </View>
                      )) : 
                      <View style={styles.personalityCard}>
                        <Ionicons name="help-circle" size={16} color={theme.colors.textSecondary} />
                        <Text style={[styles.personalityCardText, { color: theme.colors.textSecondary }]}>성격 정보가 없습니다</Text>
                      </View>
                    }
                  </View>
                )}
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>DBTI</Text>
                {isEditing ? (
                  <View style={styles.dangbtiContainer}>
                    <TextInput
                      style={[styles.modalInput, styles.dangbtiInput]}
                      value={editForm.dangbti}
                      onChangeText={(text) => setEditForm({...editForm, dangbti: text.toUpperCase()})}
                      placeholder="SHRA"
                      maxLength={10}
                    />
                  </View>
                ) : (
                  <View style={styles.dangbtiDisplayContainer}>
                    <View style={styles.dangbtiBadge}>
                      <Text style={styles.dangbtiText}>{selectedDog?.dbti || 'DBTI 없음'}</Text>
                    </View>
                  </View>
                )}
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>특이사항</Text>
                {isEditing ? (
                  <TextInput
                    style={[styles.modalInput, styles.modalTextArea]}
                    value={editForm.notes}
                    onChangeText={(text) => setEditForm({...editForm, notes: text})}
                    placeholder="특이사항이나 주의할 점을 입력해주세요"
                    multiline
                    numberOfLines={3}
                  />
                ) : (
                  <Text style={styles.modalFieldValue}>{selectedDog?.notes}</Text>
                )}
              </View>
            </View>

            {/* 버튼들 */}
            <View style={styles.modalActions}>
              {isEditing ? (
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleEditSave}
                >
                  <Text style={styles.modalSaveButtonText}>저장하기</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.modalDeleteButton}
                  onPress={handleDeleteDog}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                  <Text style={styles.modalDeleteButtonText}>프로필 삭제</Text>
                </TouchableOpacity>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
  },
  userName: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  // 강아지 프로필 (인스타 스토리 스타일)
  dogProfilesContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.md,
    ...theme.shadows.sm,
  },
  dogProfilesList: {
    paddingHorizontal: theme.spacing.md,
  },
  dogProfileItem: {
    alignItems: 'center',
    marginRight: theme.spacing.md,
    width: 70,
  },
  dogProfileCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 3,
    borderColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  addProfileCircle: {
    backgroundColor: theme.colors.secondaryBg,
    borderColor: theme.colors.secondary,
    borderStyle: 'dashed',
  },
  dogProfilePhoto: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  dogProfileName: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
  },
  // 일정 블록 (좌우 스와이프)
  schedulesContainer: {
    backgroundColor: theme.colors.surface,
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  schedulesList: {
    paddingHorizontal: theme.spacing.md,
  },
  scheduleCard: {
    width: width * 0.75,
    backgroundColor: theme.colors.surfaceLight,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    marginRight: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    ...theme.shadows.md,
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  scheduleService: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  scheduleStatus: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.lg,
  },
  confirmedStatus: {
    backgroundColor: theme.colors.successBg,
  },
  pendingStatus: {
    backgroundColor: theme.colors.warningBg,
  },
  scheduleStatusText: {
    fontSize: theme.fontSize.xs,
    fontWeight: '600',
  },
  confirmedStatusText: {
    color: theme.colors.success,
  },
  pendingStatusText: {
    color: theme.colors.warning,
  },
  scheduleDog: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  scheduleSitter: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  scheduleTime: {
    fontSize: theme.fontSize.md,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  scheduleLocation: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
  },
  // 시터 목록 (상하 스크롤)
  sittersContainer: {
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  seeAllText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  sitterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  sitterInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  sitterAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  sitterAvatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  sitterDetails: {
    flex: 1,
  },
  sitterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sitterName: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 2,
  },
  reviewCount: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textTertiary,
    marginLeft: 2,
  },
  sitterMeta: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.xs,
  },
  sitterRate: {
    fontSize: theme.fontSize.md,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: theme.spacing.sm,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  specialtyTag: {
    backgroundColor: '#FEF7EE',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  specialtyText: {
    fontSize: 10,
    color: '{theme.colors.primary}',
    fontWeight: '500',
  },
  // 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  modalCloseButton: {
    padding: theme.spacing.xs,
    width: 60,
  },
  modalTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: 'bold',
    color: theme.colors.textPrimary,
    flex: 1,
    textAlign: 'center',
  },
  modalEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    justifyContent: 'flex-end',
  },
  modalEditText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: 'bold',
    marginLeft: theme.spacing.xs,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: theme.spacing.md,
  },
  modalPhotoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    position: 'relative',
  },
  modalPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '{theme.colors.primary}',
  },
  changePhotoButton: {
    position: 'absolute',
    bottom: 24,
    right: width/2 - 60 + 40,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '{theme.colors.primary}',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSection: {
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
  },
  modalSectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: '700',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.lg,
  },
  modalField: {
    marginBottom: theme.spacing.lg,
  },
  modalFieldLabel: {
    fontSize: theme.fontSize.lg,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  modalFieldValue: {
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    lineHeight: 22,
  },
  personalityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  personalityCardList: {
    gap: theme.spacing.sm,
  },
  personalityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'white',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  personalityCardText: {
    flex: 1,
    marginLeft: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    lineHeight: 22,
    fontWeight: '500',
  },
  modalInput: {
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    backgroundColor: theme.colors.surface,
  },
  modalTextArea: {
    height: 140,
    textAlignVertical: 'top',
  },
  modalActions: {
    paddingVertical: 20,
  },
  modalSaveButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  modalSaveButtonText: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  modalDeleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#FEF2F2',
  },
  modalDeleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  // 댕BTI 스타일
  dangbtiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangbtiInput: {
    flex: 1,
    marginRight: 12,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 18,
  },
  dangbtiTestButton: {
    backgroundColor: '#FEF7EE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '{theme.colors.primary}',
  },
  dangbtiTestText: {
    fontSize: 12,
    color: '{theme.colors.primary}',
    fontWeight: '600',
  },
  dangbtiDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangbtiBadge: {
    backgroundColor: '{theme.colors.primary}',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  dangbtiText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
  },
  dangbtiDescription: {
    flex: 1,
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 16,
  },
})

export default OwnerHomeScreen
