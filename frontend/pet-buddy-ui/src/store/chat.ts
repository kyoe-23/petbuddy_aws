import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export interface ChatMessage {
  id: string
  conversationId: string
  senderId: string
  senderName: string
  content: string
  type: 'text' | 'image' | 'file'
  imageUri?: string
  fileName?: string
  fileSize?: number
  createdAt: string
  readBy: string[]
}

export interface Conversation {
  id: string
  recipientId: string
  recipientName: string
  recipientAvatar: string
  dogName: string
  lastMessage?: ChatMessage
  unreadCount: number
  bookingStatus?: 'PENDING' | 'CONFIRMED' | 'COMPLETED'
  updatedAt: string
}

interface ChatState {
  conversations: Conversation[]
  messages: { [conversationId: string]: ChatMessage[] }
  activeConversationId?: string
  
  // Actions
  setConversations: (conversations: Conversation[]) => void
  createConversation: (conv: Omit<Conversation, 'updatedAt' | 'unreadCount'> & Partial<Pick<Conversation,'unreadCount'|'updatedAt'>>) => Conversation
  updateConversation: (conversation: Conversation) => void
  addMessage: (message: ChatMessage) => void
  setMessages: (conversationId: string, messages: ChatMessage[]) => void
  markAsRead: (conversationId: string, userId: string) => void
  incrementUnreadCount: (conversationId: string) => void
  resetUnreadCount: (conversationId: string) => void
  setActiveConversation: (conversationId: string | undefined) => void
}

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      messages: {},
      activeConversationId: undefined,

      setConversations: (conversations) => set({ conversations }),

      createConversation: (convInput) => {
        const newConv: Conversation = {
          id: convInput.id,
          recipientId: convInput.recipientId,
          recipientName: convInput.recipientName,
          recipientAvatar: convInput.recipientAvatar,
          dogName: convInput.dogName,
          unreadCount: convInput.unreadCount ?? 0,
          updatedAt: convInput.updatedAt ?? new Date().toISOString(),
        }
        set((state) => ({ conversations: [newConv, ...state.conversations] }))
        return newConv
      },

      updateConversation: (updatedConversation) => 
        set((state) => ({
          conversations: state.conversations.map(conv => 
            conv.id === updatedConversation.id ? updatedConversation : conv
          )
        })),

      addMessage: (message) => 
        set((state) => {
          const { conversationId } = message
          
          // 중복 메시지 체크 (같은 ID의 메시지가 이미 있는지 확인)
          const existingMessages = state.messages[conversationId] || []
          if (existingMessages.some(msg => msg.id === message.id)) {
            return state // 중복 메시지는 추가하지 않음
          }
          
          // 메시지 추가
          const updatedMessages = {
            ...state.messages,
            [conversationId]: [...existingMessages, message]
          }

          // 대화방 목록 업데이트
          const updatedConversations = state.conversations.map(conv => {
            if (conv.id === conversationId) {
              return {
                ...conv,
                lastMessage: message,
                updatedAt: message.createdAt,
                // 읽지 않은 메시지 카운트는 채팅방 화면에서 관리하므로 여기서는 건드리지 않음
              }
            }
            return conv
          })

          // 최신 메시지 순으로 정렬
          updatedConversations.sort((a, b) => 
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )

          return {
            messages: updatedMessages,
            conversations: updatedConversations
          }
        }),

      setMessages: (conversationId, messages) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [conversationId]: messages
          }
        })),

      markAsRead: (conversationId, userId) =>
        set((state) => {
          const messages = state.messages[conversationId]
          if (!messages) return state

          const updatedMessages = messages.map(msg => ({
            ...msg,
            readBy: msg.readBy.includes(userId) ? msg.readBy : [...msg.readBy, userId]
          }))

          return {
            messages: {
              ...state.messages,
              [conversationId]: updatedMessages
            }
          }
        }),

      incrementUnreadCount: (conversationId) =>
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId 
              ? { ...conv, unreadCount: conv.unreadCount + 1 }
              : conv
          )
        })),

      resetUnreadCount: (conversationId) =>
        set((state) => ({
          conversations: state.conversations.map(conv =>
            conv.id === conversationId 
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        })),

      setActiveConversation: (conversationId) => set({ activeConversationId: conversationId }),
    }),
    {
      name: 'pet-buddy-chat',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        conversations: state.conversations,
        messages: state.messages,
      }),
    }
  )
)

