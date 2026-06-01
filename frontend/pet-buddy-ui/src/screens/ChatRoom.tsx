import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, SafeAreaView, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, StatusBar } from 'react-native'
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native'
import { Ionicons } from '@expo/vector-icons'
import io, { Socket } from 'socket.io-client'
import { useAuthStore } from '../store/auth'
import { useChatStore, ChatMessage } from '../store/chat'
import { apiService } from '../services/api'
import { theme } from '../styles/theme'
import { commonStyles } from '../styles/commonStyles'

type ChatRoomRouteParams = {
  ChatRoom: {
    conversationId: string
    recipientName?: string
    dogName?: string
  }
}

const ChatRoom = () => {
  const route = useRoute<RouteProp<ChatRoomRouteParams, 'ChatRoom'>>()
  const navigation = useNavigation()
  const { user } = useAuthStore()
  const { messages, setMessages, addMessage } = useChatStore()

  const conversationId = route.params?.conversationId
  const recipientName = route.params?.recipientName || '상대'
  const dogName = route.params?.dogName

  const [input, setInput] = useState('')
  const listRef = useRef<FlatList<any>>(null)
  const socketRef = useRef<Socket | null>(null)

  const serverRoot = useMemo(() => {
    const root = (global as any).__API_SERVER_ROOT || (global as any).API_BASE || ''
    if (root) return root
    if (Platform.OS === 'android') return 'http://10.0.2.2:3001'
    return 'http://localhost:3001'
  }, [])

  useEffect(() => {
    let mounted = true
    const load = async () => {
      // 메시지 초기 로드 (REST)
      const res = await apiService.get<ChatMessage[]>(`/conversations/${conversationId}/messages`)
      if (!mounted) return
      if (res.success) {
        const items = (res.data as any) as any[]
        const mapped: ChatMessage[] = (items || []).map((m: any) => ({
          id: String(m._id || m.id || Math.random()),
          conversationId: conversationId,
          senderId: String(m.senderId || ''),
          senderName: String(m.senderName || ''),
          type: (m.type as any) || 'text',
          content: String(m.content || ''),
          imageUri: m.imageUri,
          fileName: m.fileName,
          fileSize: m.fileSize,
          createdAt: new Date(m.createdAt || m.created_at || Date.now()).toISOString(),
          readBy: Array.isArray(m.readBy) ? m.readBy : [],
        }))
        setMessages(conversationId, mapped)
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50)
      }

      // 소켓 연결
      const s = io(serverRoot, { transports: ['websocket'] })
      socketRef.current = s
      s.emit('conversation:join', conversationId)
      s.on('message:received', (payload: any) => {
        if (String(payload?.conversationId) !== String(conversationId)) return
        const msg: ChatMessage = {
          id: String(payload?.id || Math.random()),
          conversationId: conversationId,
          senderId: String(payload?.senderId || ''),
          senderName: String(payload?.senderName || ''),
          type: (payload?.type as any) || 'text',
          content: String(payload?.content || ''),
          imageUri: payload?.imageUri,
          fileName: payload?.fileName,
          fileSize: payload?.fileSize,
          createdAt: new Date(payload?.createdAt || Date.now()).toISOString(),
          readBy: Array.isArray(payload?.readBy) ? payload.readBy : [],
        }
        addMessage(msg)
        setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50)
      })
    }
    load()
    return () => {
      mounted = false
      try {
        socketRef.current?.emit('conversation:leave', conversationId)
        socketRef.current?.disconnect()
      } catch {}
    }
  }, [conversationId])

  const data = messages[conversationId] || []

  const handleSend = () => {
    const text = input.trim()
    if (!text || !user?.id) return
    const payload = {
      conversationId,
      message: text,
      senderId: user.id,
      senderName: user.fullName || '사용자',
      type: 'text',
    }
    socketRef.current?.emit('message:send', payload)
    setInput('')
  }

  const renderItem = ({ item }: { item: ChatMessage }) => {
    const mine = String(item.senderId) === String(user?.id)
    const time = new Date(item.createdAt).toLocaleTimeString('ko-KR', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
    
    return (
      <View style={[styles.messageRow, mine ? styles.rowRight : styles.rowLeft]}>
        {!mine && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🐕</Text>
            </View>
          </View>
        )}
        <View style={styles.messageContainer}>
          {!mine && (
            <Text style={styles.senderName}>{item.senderName || recipientName}</Text>
          )}
          <View style={[styles.bubble, mine ? styles.bubbleRight : styles.bubbleLeft]}>
            <Text style={[styles.messageText, mine ? styles.textRight : styles.textLeft]}>
              {item.content}
            </Text>
          </View>
          <Text style={[styles.timeText, mine ? styles.timeRight : styles.timeLeft]}>
            {time}
          </Text>
        </View>
        {mine && (
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>🐾</Text>
            </View>
          </View>
        )}
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor={theme.colors.primary} barStyle="light-content" />
      
      {/* 개선된 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color={theme.colors.surface} />
        </TouchableOpacity>
        
        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>🐕</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerTitle}>{recipientName}</Text>
            {dogName && (
              <Text style={styles.headerSubtitle}>🐾 {dogName}</Text>
            )}
          </View>
        </View>
        
        <TouchableOpacity style={styles.headerAction}>
          <Ionicons name="call-outline" size={22} color={theme.colors.surface} />
        </TouchableOpacity>
      </View>
      <FlatList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputBar}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add-circle-outline" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="메시지를 입력하세요 🐾"
              placeholderTextColor={theme.colors.textTertiary}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity style={styles.emojiButton}>
              <Text style={styles.emojiText}>😊</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={[styles.sendBtn, input.trim() ? styles.sendBtnActive : styles.sendBtnInactive]} 
            onPress={handleSend}
            disabled={!input.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={input.trim() ? theme.colors.surface : theme.colors.textTertiary} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  // 컨테이너
  container: { 
    flex: 1, 
    backgroundColor: theme.colors.background,
  },
  
  // 헤더 스타일
  header: { 
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.primary,
    ...theme.shadows.md,
  },
  
  backButton: {
    padding: theme.spacing.xs,
  },
  
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
  },
  
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  
  headerAvatarText: {
    fontSize: 18,
  },
  
  headerInfo: {
    flex: 1,
  },
  
  headerTitle: { 
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.surface,
  },
  
  headerSubtitle: {
    fontSize: theme.fontSize.sm,
    color: theme.colors.surface,
    opacity: 0.8,
    marginTop: 2,
  },
  
  headerAction: {
    padding: theme.spacing.xs,
  },
  
  // 메시지 리스트
  list: { 
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: theme.spacing.sm,
  },
  
  // 메시지 스타일
  messageRow: { 
    paddingHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.xs,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  
  rowLeft: { 
    justifyContent: 'flex-start',
  },
  
  rowRight: { 
    justifyContent: 'flex-end',
  },
  
  avatarContainer: {
    marginHorizontal: theme.spacing.xs,
  },
  
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primaryBg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  avatarText: {
    fontSize: 14,
  },
  
  messageContainer: {
    maxWidth: '75%',
    marginHorizontal: theme.spacing.xs,
  },
  
  senderName: {
    fontSize: theme.fontSize.xs,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    marginLeft: theme.spacing.xs,
  },
  
  bubble: { 
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    ...theme.shadows.sm,
  },
  
  bubbleLeft: { 
    backgroundColor: theme.colors.surface,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  
  bubbleRight: { 
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: 4,
  },
  
  messageText: { 
    fontSize: theme.fontSize.md,
    lineHeight: 20,
  },
  
  textLeft: { 
    color: theme.colors.textPrimary,
  },
  
  textRight: { 
    color: theme.colors.surface,
  },
  
  timeText: { 
    marginTop: 4,
    fontSize: theme.fontSize.xs,
    color: theme.colors.textTertiary,
  },
  
  timeLeft: {
    textAlign: 'left',
    marginLeft: theme.spacing.xs,
  },
  
  timeRight: {
    textAlign: 'right',
    marginRight: theme.spacing.xs,
  },
  
  // 입력창 스타일
  inputBar: { 
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadows.sm,
  },
  
  attachButton: {
    padding: theme.spacing.xs,
    marginRight: theme.spacing.xs,
  },
  
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    marginHorizontal: theme.spacing.xs,
    maxHeight: 100,
  },
  
  input: { 
    flex: 1,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
    paddingVertical: theme.spacing.xs,
    maxHeight: 80,
  },
  
  emojiButton: {
    padding: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  
  emojiText: {
    fontSize: 18,
  },
  
  sendBtn: { 
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
    ...theme.shadows.sm,
  },
  
  sendBtnActive: {
    backgroundColor: theme.colors.primary,
  },
  
  sendBtnInactive: {
    backgroundColor: theme.colors.border,
  },
})

export default ChatRoom








