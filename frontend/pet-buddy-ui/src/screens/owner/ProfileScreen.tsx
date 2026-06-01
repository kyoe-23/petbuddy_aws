import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuthStore } from '../../store/auth'
import { theme } from '../../styles/theme'

const OwnerProfileScreen = ({ navigation }: any) => {
  const { user, signOut, activeRole, setActiveRole } = useAuthStore()

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '로그아웃', style: 'destructive', onPress: () => signOut() },
      ]
    )
  }

  const menuItems: any[] = []

  const handleMenuPress = (menuId: string) => {
    Alert.alert('준비 중', `${menuItems.find(item => item.id === menuId)?.title} 기능은 준비 중입니다.`)
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>프로필</Text>
        <TouchableOpacity style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 정보 */}
        <View style={styles.profileContainer}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face' }} 
                style={styles.avatar} 
              />
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.fullName}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <Text style={styles.userPhone}>{user?.phone}</Text>
            </View>
            <TouchableOpacity style={styles.editButton}>
              <Ionicons name="pencil-outline" size={20} color="{theme.colors.primary}" />
            </TouchableOpacity>
          </View>

          {/* 역할 정보 및 토글 */}
          <View style={styles.rolesContainer}>
            <Text style={styles.rolesTitle}>서비스 모드</Text>
            <View style={styles.rolesList}>
              {user?.roleOwner && (
                <View style={[styles.roleTag, activeRole === 'owner' ? styles.activeOwnerRole : styles.inactiveRole]}>
                  <Ionicons name="home" size={16} color={activeRole === 'owner' ? 'white' : '{theme.colors.primary}'} />
                  <Text style={[styles.roleTagText, activeRole === 'owner' ? styles.activeRoleText : styles.inactiveRoleText]}>
                    반려견 견주
                  </Text>
                </View>
              )}
              {user?.roleSitter && (
                <View style={[styles.roleTag, activeRole === 'sitter' ? styles.activeSitterRole : styles.inactiveRole]}>
                  <Ionicons name="briefcase" size={16} color={activeRole === 'sitter' ? 'white' : '#0ea5e9'} />
                  <Text style={[styles.roleTagText, activeRole === 'sitter' ? styles.activeRoleText : styles.inactiveRoleText]}>
                    펫시터
                  </Text>
                </View>
              )}
            </View>
            {user?.roleOwner && user?.roleSitter && (
              <TouchableOpacity
                style={styles.roleToggleButton}
                onPress={() => setActiveRole(activeRole === 'owner' ? 'sitter' : 'owner')}
              >
                <Ionicons 
                  name="swap-horizontal" 
                  size={20} 
                  color={activeRole === 'owner' ? theme.colors.secondary : theme.colors.primary} 
                />
                <Text style={[styles.roleToggleText, { color: activeRole === 'owner' ? theme.colors.secondary : theme.colors.primary }]}>
                  {activeRole === 'owner' ? '시터 모드로 전환' : '견주 모드로 전환'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 메뉴 목록 */}
        <View style={styles.menuContainer}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* 로그아웃 버튼 */}
        <View style={styles.logoutContainer}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>로그아웃</Text>
          </TouchableOpacity>
        </View>

        {/* 앱 정보 */}
        <View style={styles.appInfoContainer}>
          <Text style={styles.appVersion}>Pet Buddy v1.0.0</Text>
          <Text style={styles.appDescription}>
            반려견과 시터를 연결하는 특별한 서비스
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  settingsButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  profileContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 8,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  editButton: {
    padding: 8,
  },
  rolesContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 20,
  },
  rolesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  rolesList: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  roleTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  activeOwnerRole: {
    backgroundColor: '{theme.colors.primary}',
  },
  activeSitterRole: {
    backgroundColor: '#0ea5e9',
  },
  inactiveRole: {
    backgroundColor: '#F3F4F6',
  },
  roleTagText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 6,
  },
  activeRoleText: {
    color: 'white',
  },
  inactiveRoleText: {
    color: '#6B7280',
  },
  roleToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    marginTop: 8,
  },
  roleToggleText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  menuContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  logoutContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 8,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  appInfoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 8,
  },
  appVersion: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
})

export default OwnerProfileScreen
