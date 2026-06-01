import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  FlatList,
  Dimensions,
  Image,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/auth'
import { apiService } from '../../services/api'
import { theme } from '../../styles/theme'
import { commonStyles } from '../../styles/commonStyles'

const { width } = Dimensions.get('window')

const SitterHomeScreen = ({ navigation }: any) => {
  const { user, activeRole, setActiveRole } = useAuthStore()
  const [isPostModalVisible, setIsPostModalVisible] = useState(false)
  const [postForm, setPostForm] = useState({
    title: '',
    description: '',
    location: '',
    availableFrom: '',
    availableTo: '',
  })
  const [myPosts, setMyPosts] = useState<any[]>([])
  const [posting, setPosting] = useState(false)
  const [ownerJobs, setOwnerJobs] = useState<any[]>([])
  const [loadingJobs, setLoadingJobs] = useState(false)
  
  // 날짜 선택기 상태
  const [showFromDatePicker, setShowFromDatePicker] = useState(false)
  const [showToDatePicker, setShowToDatePicker] = useState(false)
  const [fromDate, setFromDate] = useState(new Date())
  const [toDate, setToDate] = useState(new Date())

  // 날짜 포맷 함수
  const formatDate = (date: Date) => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // 날짜 선택 핸들러
  const handleFromDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowFromDatePicker(false)
    }
    if (selectedDate) {
      setFromDate(selectedDate)
      setPostForm({...postForm, availableFrom: formatDate(selectedDate)})
    }
  }

  const handleToDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowToDatePicker(false)
    }
    if (selectedDate) {
      setToDate(selectedDate)
      setPostForm({...postForm, availableTo: formatDate(selectedDate)})
    }
  }

  // 오늘 일정 (좌우 스와이프)
  const todaySchedules = [
    {
      id: '1',
      ownerName: '김견주',
      dogName: '멍멍이',
      dogBreed: '골든 리트리버',
      service: '산책 서비스',
      time: '14:00 - 16:00',
      location: '강남구 역삼동',
      hourlyRate: 15000,
      status: 'confirmed',
      ownerAvatar: '👨',
    },
    {
      id: '2',
      ownerName: '박견주',
      dogName: '초코',
      dogBreed: '시바견',
      service: '방문 돌봄',
      time: '16:00 - 18:00',
      location: '강남구 논현동',
      hourlyRate: 18000,
      status: 'confirmed',
      ownerAvatar: '👩',
    },
  ]

  // 견주 공고 불러오기
  useEffect(() => {
    const fetchJobs = async () => {
      setLoadingJobs(true)
      const resp = await apiService.get<{ jobs: any[] }>(`/jobs`)
      if (resp.success) setOwnerJobs((resp.data as any)?.jobs || [])
      setLoadingJobs(false)
    }
    fetchJobs()
  }, [])

  const loadMyPosts = async () => {
    const resp = await apiService.get<{ posts: any[] }>('/sitter-postings')
    if (resp.success) {
      const mine = (resp.data as any)?.posts?.filter((p: any) => p.sitter_id === user?.id) || []
      setMyPosts(mine)
    }
  }

  useEffect(() => {
    loadMyPosts()
  }, [user?.id])

  const handleCreateSitterPost = async () => {
    if (!user?.id) {
      Alert.alert('오류', '사용자 정보가 없습니다. 다시 로그인 해주세요.')
      return
    }
    if (!postForm.title.trim() || !postForm.availableFrom.trim() || !postForm.availableTo.trim()) {
      Alert.alert('필수 입력', '제목과 시작/종료 날짜를 입력하세요. (YYYY-MM-DD)')
      return
    }
    const payload = {
      sitter_id: user.id,
      title: postForm.title.trim(),
      description: postForm.description?.trim() || null,
      location: postForm.location?.trim() || null,
      available_from: postForm.availableFrom.trim(),
      available_to: postForm.availableTo.trim(),
    }
    try {
      setPosting(true)
    console.log('📤 시터 공고 등록 요청', payload)
    const resp = await apiService.post('/sitter-postings', payload)
    console.log('📥 시터 공고 등록 응답', resp)
      if (resp.success) {
        setIsPostModalVisible(false)
        setPostForm({ title: '', description: '', location: '', availableFrom: '', availableTo: '' })
        setFromDate(new Date())
        setToDate(new Date())
        setShowFromDatePicker(false)
        setShowToDatePicker(false)
        await loadMyPosts()
        Alert.alert('등록 완료', '시터 공고가 등록되었습니다.')
      } else {
        Alert.alert('등록 실패', resp.error || '시터 공고 등록에 실패했습니다.')
      }
    } catch (e: any) {
      Alert.alert('등록 실패', e?.message || '네트워크 오류가 발생했습니다.')
    } finally {
      setPosting(false)
    }
  }

  const handleSchedulePress = (schedule: any) => {
    Alert.alert(
      `${schedule.service} - 확정`,
      `견주: ${schedule.ownerName}\n강아지: ${schedule.dogName} (${schedule.dogBreed})\n시간: ${schedule.time}\n장소: ${schedule.location}\n수익: ${schedule.hourlyRate.toLocaleString()}원/시간`,
      [
        { text: '확인', style: 'cancel' },
        { text: '채팅하기', onPress: () => navigation.navigate('SitterChat') },
      ]
    )
  }

  const handleRequestAction = (request: any, action: 'accept' | 'decline') => {
    Alert.alert(
      action === 'accept' ? '매칭 요청 수락' : '매칭 요청 거절',
      `${(request.owner_name || request.owner_email || '견주')}님의 공고를 ${action === 'accept' ? '수락' : '거절'}하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: action === 'accept' ? '수락하고 채팅 시작' : '거절', 
          onPress: () => {
            if (action === 'accept') {
              Alert.alert('매칭 성사!', '채팅을 시작할 수 있습니다.', [
                { text: '확인', onPress: () => navigation.navigate('SitterChat') }
              ])
            } else {
              // 거절: 서버에 상태 업데이트 요청 후 목록 갱신
              (async ()=>{
                try {
                  const resp = await apiService.delete(`/jobs/${request.job_id}`)
                  if (resp.success) {
                    const refreshed = await apiService.get<{ jobs: any[] }>(`/jobs`)
                    if (refreshed.success) setOwnerJobs((refreshed.data as any)?.jobs || [])
                    Alert.alert('완료', '요청을 거절했습니다.')
                  } else {
                    Alert.alert('실패', resp.error || '거절 처리에 실패했습니다.')
                  }
                } catch (e: any) {
                  Alert.alert('실패', e?.message || '네트워크 오류가 발생했습니다.')
                }
              })()
            }
          }
        },
      ]
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>시터 대시보드</Text>
          <Text style={styles.userName}>{user?.fullName}님</Text>
        </View>
        <View style={styles.headerRight}>
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
            <Ionicons name="notifications-outline" size={24} color="{theme.colors.textSecondary}" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 활동 상태 UI 제거 */}

        {/* 오늘 일정 (좌우 스와이프) */}
        <View style={styles.schedulesContainer}>
          <Text style={styles.sectionTitle}>오늘 일정</Text>
          {todaySchedules.length > 0 ? (
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={todaySchedules}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.schedulesList}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.scheduleCard}
                  onPress={() => handleSchedulePress(item)}
                >
                  <View style={styles.scheduleHeader}>
                    <Text style={styles.scheduleService}>{item.service}</Text>
                    <View style={styles.confirmedStatus}>
                      <Text style={styles.confirmedStatusText}>확정</Text>
                    </View>
                  </View>
                  <Text style={styles.scheduleOwner}>👤 {item.ownerName}</Text>
                  <Text style={styles.scheduleDog}>🐕 {item.dogName} ({item.dogBreed})</Text>
                  <Text style={styles.scheduleTime}>🕐 {item.time}</Text>
                  <Text style={styles.scheduleLocation}>📍 {item.location}</Text>
                  <Text style={styles.scheduleEarning}>💰 {item.hourlyRate.toLocaleString()}원/시간</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptySchedule}>
              <Ionicons name="calendar-outline" size={48} color="{theme.colors.border}" />
              <Text style={styles.emptyText}>오늘 예정된 일정이 없습니다</Text>
            </View>
          )}
        </View>

        {/* 새로운 매칭 요청들 (견주 공고) */}
        <View style={styles.requestsContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.sectionTitle}>새로운 매칭 요청 ({ownerJobs.length})</Text>
            <TouchableOpacity onPress={() => setIsPostModalVisible(true)}>
              <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>+ 시터 공고 등록</Text>
            </TouchableOpacity>
          </View>
          {loadingJobs ? (
            <Text style={{ paddingHorizontal: 16, color: '{theme.colors.textSecondary}' }}>불러오는 중...</Text>
          ) : ownerJobs.map((job) => (
            <View key={job.job_id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <View style={styles.requestOwnerInfo}>
                  <Image source={{ uri: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=200&h=200&fit=crop&crop=face' }} style={styles.requestOwnerAvatarImage} />
                  <View style={styles.requestOwnerDetails}>
                    <Text style={styles.requestOwnerName}>{job.owner_name || job.owner_email || '익명 견주'}</Text>
                    <Text style={styles.requestTime}>{String(job.created_at || '').slice(0,10)}</Text>
                  </View>
                </View>
                {/* 헤더 우측 정보 제거 */}
              </View>
              
              {/* 강아지 사진 (플레이스홀더) */}
              <View style={styles.requestDogSection}>
                <Image source={{ uri: job.dog_photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=200&h=200&fit=crop&crop=face' }} style={styles.requestDogPhoto} />
                <View style={styles.requestDogInfo}>
                  <Text style={styles.requestDogName}>{job.title}</Text>
                  <Text style={styles.requestDogBreed}>{job.dog_breed || job.dog_name || (job.description ? String(job.description).slice(0,20) : '요청 공고')}</Text>
                </View>
              </View>
              
              <View style={styles.requestContent}>
                <Text style={styles.requestService}>견주 공고</Text>
                <Text style={styles.requestSchedule}>
                  📅 {String(job.start_date).slice(0,10)} ~ {String(job.end_date).slice(0,10)}
                </Text>
                <Text style={styles.requestLocation}>📍 {job.location || '지역 미지정'}</Text>
                {job.description ? (
                  <Text style={styles.requestNotes}>💬 {job.description}</Text>
                ) : null}
              </View>
              
              <View style={styles.requestActions}>
                <TouchableOpacity
                  style={styles.declineButton}
                  onPress={() => handleRequestAction(job, 'decline')}
                >
                  <Text style={styles.declineButtonText}>거절</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={() => handleRequestAction(job, 'accept')}
                >
                  <Text style={styles.acceptButtonText}>수락하고 채팅 시작</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* 내 시터 공고 요약 */}
        {myPosts.length > 0 && (
          <View style={styles.requestsContainer}>
            <Text style={styles.sectionTitle}>내 시터 공고</Text>
            {myPosts.map((p) => (
              <View key={p.post_id} style={styles.requestCard}>
                <Text style={styles.requestService}>{p.title}</Text>
                <Text style={styles.requestSchedule}>📅 {String(p.available_from).slice(0,10)} ~ {String(p.available_to).slice(0,10)}</Text>
                <Text style={styles.requestLocation}>📍 {p.location || '지역 미지정'}</Text>
                {p.description ? <Text style={styles.requestNotes}>💬 {p.description}</Text> : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* 시터 공고 등록 모달 (간단 폼) */}
      {isPostModalVisible && (
        <KeyboardAvoidingView 
          style={{ position:'absolute', left:0, right:0, top:0, bottom:0, backgroundColor:'rgba(45, 27, 20, 0.5)' }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <ScrollView 
            contentContainerStyle={{ flexGrow: 1, justifyContent:'center', alignItems:'center', paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ backgroundColor: theme.colors.surface, width:'90%', borderRadius: theme.borderRadius.xl, padding: theme.spacing.lg, ...theme.shadows.lg, maxHeight: '90%' }}>
            <Text style={{ fontSize: theme.fontSize.xl, fontWeight:'bold', marginBottom: theme.spacing.md, color: theme.colors.textPrimary }}>🐾 시터 공고 등록</Text>
            <TextInput 
              placeholder="제목 (예: 주말 강아지 돌봄 가능)" 
              value={postForm.title} 
              onChangeText={(t)=>setPostForm({...postForm,title:t})} 
              multiline 
              numberOfLines={2}
              style={{ 
                borderWidth: 2, 
                borderColor: theme.colors.border, 
                borderRadius: theme.borderRadius.lg, 
                padding: theme.spacing.md, 
                marginBottom: theme.spacing.sm,
                fontSize: theme.fontSize.md,
                backgroundColor: theme.colors.surface,
                height: 60,
                textAlignVertical: 'top'
              }} 
            />
            <TextInput 
              placeholder="위치 (예: 서울 강남구, 신림동 근처)" 
              value={postForm.location} 
              onChangeText={(t)=>setPostForm({...postForm,location:t})} 
              multiline 
              numberOfLines={2}
              style={{ 
                borderWidth: 2, 
                borderColor: theme.colors.border, 
                borderRadius: theme.borderRadius.lg, 
                padding: theme.spacing.md, 
                marginBottom: theme.spacing.sm,
                fontSize: theme.fontSize.md,
                backgroundColor: theme.colors.surface,
                height: 60,
                textAlignVertical: 'top'
              }} 
            />
            <View style={{ flexDirection:'row', gap: theme.spacing.sm }}>
              <View style={{ flex: 1 }}>
                <TouchableOpacity 
                  onPress={() => setShowFromDatePicker(!showFromDatePicker)}
                  style={{ 
                    borderWidth: 2, 
                    borderColor: theme.colors.border, 
                    borderRadius: theme.borderRadius.lg, 
                    padding: theme.spacing.md, 
                    marginBottom: theme.spacing.sm,
                    backgroundColor: theme.colors.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }} 
                >
                  <Text style={{ 
                    fontSize: theme.fontSize.md,
                    color: postForm.availableFrom ? theme.colors.textPrimary : '#9CA3AF'
                  }}>
                    {postForm.availableFrom || '시작일 선택'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                
                {showFromDatePicker && (
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <DateTimePicker
                      value={fromDate}
                      mode="date"
                      display="compact"
                      onChange={handleFromDateChange}
                      minimumDate={new Date()}
                    />
                  </View>
                )}
              </View>
              
              <View style={{ flex: 1 }}>
                <TouchableOpacity 
                  onPress={() => setShowToDatePicker(!showToDatePicker)}
                  style={{ 
                    borderWidth: 2, 
                    borderColor: theme.colors.border, 
                    borderRadius: theme.borderRadius.lg, 
                    padding: theme.spacing.md, 
                    marginBottom: theme.spacing.sm,
                    backgroundColor: theme.colors.surface,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }} 
                >
                  <Text style={{ 
                    fontSize: theme.fontSize.md,
                    color: postForm.availableTo ? theme.colors.textPrimary : '#9CA3AF'
                  }}>
                    {postForm.availableTo || '종료일 선택'}
                  </Text>
                  <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
                </TouchableOpacity>
                
                {showToDatePicker && (
                  <View style={{ marginBottom: theme.spacing.sm }}>
                    <DateTimePicker
                      value={toDate}
                      mode="date"
                      display="compact"
                      onChange={handleToDateChange}
                      minimumDate={fromDate}
                    />
                  </View>
                )}
              </View>
            </View>
            <TextInput 
              placeholder="상세 설명 (예: 대형견 경험 많음, 산책 및 놀이 서비스 제공, 평일 오후 2-6시 가능)" 
              value={postForm.description} 
              onChangeText={(t)=>setPostForm({...postForm,description:t})} 
              multiline 
              numberOfLines={5} 
              style={{ 
                borderWidth: 2, 
                borderColor: theme.colors.border, 
                borderRadius: theme.borderRadius.lg, 
                padding: theme.spacing.md, 
                marginBottom: theme.spacing.md,
                fontSize: theme.fontSize.md,
                backgroundColor: theme.colors.surface,
                textAlignVertical: 'top',
                height: 100
              }} 
            />
            <View style={{ flexDirection:'row', justifyContent:'flex-end', gap: theme.spacing.sm }}>
              <TouchableOpacity 
                onPress={() => {
                  setIsPostModalVisible(false)
                  setPostForm({ title: '', description: '', location: '', availableFrom: '', availableTo: '' })
                  setFromDate(new Date())
                  setToDate(new Date())
                  setShowFromDatePicker(false)
                  setShowToDatePicker(false)
                }} 
                style={{ 
                  paddingHorizontal: theme.spacing.lg, 
                  paddingVertical: theme.spacing.md,
                  borderRadius: theme.borderRadius.lg,
                  borderWidth: 1,
                  borderColor: theme.colors.border
                }}
              >
                <Text style={{ color: theme.colors.textSecondary, fontWeight: '600' }}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                disabled={posting} 
                onPress={handleCreateSitterPost} 
                style={{ 
                  backgroundColor: posting ? theme.colors.primaryLight : theme.colors.primary, 
                  paddingHorizontal: theme.spacing.lg, 
                  paddingVertical: theme.spacing.md, 
                  borderRadius: theme.borderRadius.lg,
                  ...theme.shadows.sm,
                  opacity: posting ? 0.7 : 1
                }}
              >
                <Text style={{ color: theme.colors.surface, fontWeight: 'bold', fontSize: theme.fontSize.md }}>
                  {posting ? '🐾 등록 중...' : '🐾 등록하기'}
                </Text>
              </TouchableOpacity>
            </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      )}


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
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: theme.fontSize.sm,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  notificationButton: {
    padding: theme.spacing.xs,
  },
  content: {
    flex: 1,
  },
  // 활동 상태 토글
  statusContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 8,
  },
  statusToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusInfo: {
    flex: 1,
    marginRight: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '{theme.colors.textPrimary}',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 12,
    color: '{theme.colors.textSecondary}',
  },
  // 일정 블록 (좌우 스와이프)
  schedulesContainer: {
    backgroundColor: 'white',
    paddingVertical: 20,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '{theme.colors.textPrimary}',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  schedulesList: {
    paddingHorizontal: 16,
  },
  scheduleCard: {
    width: width * 0.75,
    backgroundColor: '#EEF2FF',
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scheduleService: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '{theme.colors.textPrimary}',
  },
  confirmedStatus: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedStatusText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065F46',
  },
  scheduleOwner: {
    fontSize: 14,
    color: '{theme.colors.textSecondary}',
    marginBottom: 4,
  },
  scheduleDog: {
    fontSize: 14,
    color: '{theme.colors.textSecondary}',
    marginBottom: 4,
  },
  scheduleTime: {
    fontSize: 14,
    color: '{theme.colors.textSecondary}',
    marginBottom: 4,
  },
  scheduleLocation: {
    fontSize: 12,
    color: '{theme.colors.textTertiary}',
    marginBottom: 4,
  },
  scheduleEarning: {
    fontSize: 14,
    fontWeight: '600',
    color: '{theme.colors.primary}',
  },
  emptySchedule: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '{theme.colors.textTertiary}',
    marginTop: 12,
  },
  // 매칭 요청 블록 (상하 스크롤)
  requestsContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 8,
    marginBottom: 20,
  },
  requestCard: {
    borderWidth: 1,
    borderColor: '{theme.colors.border}',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FAFAFA',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  requestOwnerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestOwnerAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  // 강아지 사진 섹션
  requestDogSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
  },
  requestDogPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  requestDogInfo: {
    flex: 1,
  },
  requestDogName: {
    fontSize: 16,
    fontWeight: '600',
    color: '{theme.colors.textPrimary}',
    marginBottom: 2,
  },
  requestDogBreed: {
    fontSize: 12,
    color: '{theme.colors.textSecondary}',
  },
  requestOwnerDetails: {
    flex: 1,
  },
  requestOwnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '{theme.colors.textPrimary}',
  },
  requestTime: {
    fontSize: 12,
    color: '{theme.colors.textTertiary}',
  },
  requestDistance: {
    fontSize: 12,
    color: '{theme.colors.textSecondary}',
    fontWeight: '500',
  },
  requestContent: {
    marginBottom: 16,
  },
  requestService: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '{theme.colors.textPrimary}',
    marginBottom: 8,
  },
  requestDogInfo: {
    fontSize: 14,
    color: '{theme.colors.textSecondary}',
    marginBottom: 4,
  },
  requestSchedule: {
    fontSize: 14,
    color: '{theme.colors.textSecondary}',
    marginBottom: 4,
  },
  requestLocation: {
    fontSize: 14,
    color: '{theme.colors.textSecondary}',
    marginBottom: 4,
  },
  requestEarning: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '{theme.colors.primary}',
    marginBottom: 8,
  },
  requestNotes: {
    fontSize: 12,
    color: '{theme.colors.textSecondary}',
    fontStyle: 'italic',
    backgroundColor: '#F8FAFC',
    padding: 8,
    borderRadius: 8,
  },
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  declineButton: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    alignItems: 'center',
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '{theme.colors.textSecondary}',
  },
  acceptButton: {
    flex: 2,
    backgroundColor: '{theme.colors.primary}',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
})

export default SitterHomeScreen
