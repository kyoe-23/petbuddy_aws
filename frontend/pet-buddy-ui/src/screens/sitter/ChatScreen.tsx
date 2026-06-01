import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Swipeable } from 'react-native-gesture-handler'
import { useChatStore } from '../../store/chat'
import { useAuthStore } from '../../store/auth'
import { apiService } from '../../services/api'
import { theme } from '../../styles/theme'

const SitterChatScreen = ({ navigation }: any) => {
  const { user } = useAuthStore()
  const { conversations, setConversations } = useChatStore()

  useEffect(() => {
    let mounted = true
    const fetchConversations = async () => {
      try {
        if (!user?.id) return
        const res = await apiService.get(`/conversations?userId=${encodeURIComponent(user.id)}`)
        if (!mounted) return
        if (res?.success && Array.isArray((res.data as any))) {
          const mapped = (res.data as any).map((c: any) => ({
            id: c.id,
            recipientId: '',
            recipientName: c.lastMessageSenderName || c.displayName || c.otherEmail || c.otherFullName || '알 수 없음',
            recipientAvatar: 'https://placekitten.com/200/200',
            dogName: '',
            lastMessage: c.lastMessageText ? {
              id: 'last',
              conversationId: c.id,
              senderId: '',
              senderName: '',
              content: c.lastMessageText,
              type: 'text',
              createdAt: c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : new Date(0).toISOString(),
              readBy: [],
            } : undefined,
            unreadCount: 0,
            bookingStatus: undefined,
            updatedAt: c.lastMessageAt ? new Date(c.lastMessageAt).toISOString() : new Date(0).toISOString(),
          }))
          setConversations(mapped)
        }
      } catch {}
    }
    fetchConversations()
    return () => { mounted = false }
  }, [user?.id])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`
    }
  }

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'CONFIRMED': return '#10B981'
      case 'PENDING': return '#F59E0B'
      case 'COMPLETED': return '{theme.colors.textSecondary}'
      default: return '{theme.colors.textTertiary}'
    }
  }

  const getStatusText = (status?: string) => {
    switch (status) {
      case 'CONFIRMED': return '확정'
      case 'PENDING': return '대기'
      case 'COMPLETED': return '완료'
      default: return ''
    }
  }

  const renderRightActions = (onDelete: () => void) => (
    <View style={{ justifyContent:'center', alignItems:'center', width:80, backgroundColor:'#EF4444' }}>
      <TouchableOpacity onPress={onDelete} style={{ padding:16 }}>
        <Ionicons name="trash" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  )

  const renderConversation = ({ item }: { item: any }) => {
    const last = item.lastMessage
    const time = last?.createdAt ? formatTime(last.createdAt) : ''
    const handleDelete = async () => {
      try {
        await apiService.delete(`/conversations/${encodeURIComponent(item.id)}`)
        setConversations(conversations.filter((c:any)=>c.id!==item.id))
      } catch {}
    }
    return (
      <Swipeable renderRightActions={() => renderRightActions(handleDelete)}>
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => navigation.navigate('ChatRoom', {
          conversationId: item.id,
          recipientName: item.recipientName,
          dogName: item.dogName
        })}
      >
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🐾</Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadCount}>{item.unreadCount}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text style={styles.recipientName} numberOfLines={1} ellipsizeMode="tail">{item.recipientName}</Text>
            {!!item.dogName && <Text style={styles.dogName}>• {item.dogName}</Text>}
            </View>
            <View style={styles.metaContainer}>
              {!!time && <Text style={styles.timeText}>{time}</Text>}
              {item.bookingStatus && (
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.bookingStatus) }]}>
                  <Text style={styles.statusText}>{getStatusText(item.bookingStatus)}</Text>
                </View>
              )}
            </View>
          </View>
          
          <Text style={[
            styles.lastMessage,
            item.unreadCount > 0 ? styles.unreadMessage : styles.readMessage
          ]} numberOfLines={1}>
            {last?.content || '대화를 시작해보세요'}
          </Text>
        </View>
      </TouchableOpacity>
      </Swipeable>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>채팅</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search-outline" size={24} color="{theme.colors.textSecondary}" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="add-outline" size={24} color="{theme.colors.textSecondary}" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 대화 목록 */}
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>대화가 없습니다. 예약이 생성되면 대화를 시작해보세요.</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
        renderItem={renderConversation}
        keyExtractor={(item) => item.id}
        style={styles.conversationsList}
        showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '{theme.colors.background}',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '{theme.colors.border}',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '{theme.colors.textPrimary}',
  },
  headerActions: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 4,
    marginLeft: 8,
  },
  conversationsList: {
    flex: 1,
    backgroundColor: 'white',
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  
  avatarEmoji: {
    fontSize: 20,
  },
  unreadBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadCount: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  conversationContent: {
    flex: 1,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: '{theme.colors.textPrimary}',
  },
  dogName: {
    fontSize: 14,
    color: '{theme.colors.textSecondary}',
    marginLeft: 4,
  },
  metaContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    fontSize: 12,
    color: '{theme.colors.textTertiary}',
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    lineHeight: 18,
  },
  unreadMessage: {
    color: '{theme.colors.textPrimary}',
    fontWeight: '500',
  },
  readMessage: {
    color: '{theme.colors.textSecondary}',
  },
  separator: {
    height: 1,
    backgroundColor: '{theme.colors.secondaryBg}',
    marginLeft: 76,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  emptyText: {
    color: '{theme.colors.textSecondary}',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
})

export default SitterChatScreen
