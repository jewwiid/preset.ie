'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../auth-context'
import { useToast } from '../../components/toast/ToastContext'
import { supabase } from '../supabase'
import type { MessageDTO } from '../api/messages'
import { RealtimeChannel, REALTIME_LISTEN_TYPES } from '@supabase/supabase-js'

export interface RealtimeMessage extends MessageDTO {
  conversation_id: string
  status: 'sent' | 'delivered' | 'read'
  updated_at?: string
}

export interface MessageStatusUpdate {
  messageId: string
  status: 'sent' | 'delivered' | 'read'
  updatedAt: string
}

export interface TypingEvent {
  conversationId: string
  userId: string
  isTyping: boolean
  userDisplayName?: string
}

export interface UseRealtimeMessagesOptions {
  conversationId?: string
  enableTypingIndicators?: boolean
  enableMessageStatus?: boolean
  enableToastNotifications?: boolean
  onNewMessage?: (message: RealtimeMessage) => void
  onMessageStatusUpdate?: (update: MessageStatusUpdate) => void
  onTypingUpdate?: (typing: TypingEvent) => void
  onConnectionChange?: (connected: boolean) => void
}

export interface UseRealtimeMessagesResult {
  // Connection state
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  
  // Message operations
  markAsDelivered: (conversationId: string) => Promise<void>
  markAsRead: (messageId: string) => Promise<void>
  
  // Typing indicators
  setTyping: (conversationId: string, isTyping: boolean) => Promise<void>
  typingUsers: Record<string, TypingEvent>
  
  // Control methods
  reconnect: () => void
  disconnect: () => void
}

export function useRealtimeMessages(options: UseRealtimeMessagesOptions = {}): UseRealtimeMessagesResult {
  const { user } = useAuth()
  const { showToast } = useToast()
  
  const {
    conversationId,
    enableTypingIndicators = true,
    enableMessageStatus = true,
    enableToastNotifications = true,
    onNewMessage,
    onMessageStatusUpdate,
    onTypingUpdate,
    onConnectionChange
  } = options

  // Connection state
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [typingUsers, setTypingUsers] = useState<Record<string, TypingEvent>>({})

  // Refs for cleanup and avoiding stale closures
  const channelsRef = useRef<RealtimeChannel[]>([])
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Clean up channels
  const cleanupChannels = useCallback(() => {
    channelsRef.current.forEach(channel => {
      supabase.removeChannel(channel)
    })
    channelsRef.current = []
  }, [])

  // Mark messages as delivered when user views conversation
  const markAsDelivered = useCallback(async (conversationId: string) => {
    if (!user || !enableMessageStatus) return

    try {
      const { error } = await supabase.rpc('mark_conversation_delivered', {
        conversation_uuid: conversationId,
        user_uuid: user.id
      })

      if (error) {
        console.error('Error marking messages as delivered:', error)
      }
    } catch (error) {
      console.error('Error in markAsDelivered:', error)
    }
  }, [user, enableMessageStatus])

  // Mark specific message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!user || !enableMessageStatus) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('to_user_id', user.id)

      if (error) {
        console.error('Error marking message as read:', error)
      }
    } catch (error) {
      console.error('Error in markAsRead:', error)
    }
  }, [user, enableMessageStatus])

  // Set typing indicator
  const setTyping = useCallback(async (conversationId: string, isTyping: boolean) => {
    if (!user || !enableTypingIndicators) return

    try {
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      if (isTyping) {
        // Upsert typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .upsert({
            conversation_id: conversationId,
            user_id: user.id,
            is_typing: true,
            last_activity: new Date().toISOString()
          }, {
            onConflict: 'conversation_id,user_id'
          })

        if (error) {
          console.error('Error setting typing indicator:', error)
          return
        }

        // Auto-clear typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(conversationId, false)
        }, 3000)
      } else {
        // Remove typing indicator
        const { error } = await supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)

        if (error) {
          console.error('Error clearing typing indicator:', error)
        }
      }
    } catch (error) {
      console.error('Error in setTyping:', error)
    }
  }, [user, enableTypingIndicators])

  // Setup real-time subscriptions
  const setupSubscriptions = useCallback(() => {
    if (!user) return

    setIsConnecting(true)
    setConnectionError(null)
    
    console.log('Setting up realtime message subscriptions for user:', user.id)

    // 1. Subscribe to new messages for conversations user participates in
    const messagesChannel = supabase
      .channel(`user-messages:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `to_user_id=eq.${user.id}`
        },
        (payload) => {
          const newMessage = payload.new as RealtimeMessage
          console.log('New message received:', newMessage)

          // Call handler if provided
          if (onNewMessage) {
            onNewMessage(newMessage)
          }

          // Mark as delivered if conversation is currently viewed
          if (conversationId === newMessage.conversation_id) {
            markAsDelivered(newMessage.conversation_id)
          }

          // Show toast notification
          if (enableToastNotifications && conversationId !== newMessage.conversation_id) {
            showToast({
              type: 'notification',
              title: 'New Message',
              message: newMessage.body.length > 50 
                ? `${newMessage.body.substring(0, 50)}...` 
                : newMessage.body,
              duration: 5000
            })
          }
        }
      )

    // 2. Subscribe to message status updates for sent messages
    const statusChannel = supabase
      .channel(`message-status:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'messages',
          filter: `from_user_id=eq.${user.id}`
        },
        (payload) => {
          const updatedMessage = payload.new as RealtimeMessage
          console.log('Message status updated:', updatedMessage)

          if (onMessageStatusUpdate && updatedMessage.status) {
            onMessageStatusUpdate({
              messageId: updatedMessage.id,
              status: updatedMessage.status,
              updatedAt: updatedMessage.updated_at || new Date().toISOString()
            })
          }
        }
      )

    // 3. Subscribe to typing indicators if enabled and conversation is specified
    let typingChannel: RealtimeChannel | null = null
    if (enableTypingIndicators && conversationId) {
      typingChannel = supabase
        .channel(`typing:${conversationId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'typing_indicators',
            filter: `conversation_id=eq.${conversationId}`
          },
          async (payload) => {
            console.log('Typing indicator update:', payload)

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const typingData = payload.new as any
              
              // Don't show own typing indicator
              if (typingData.user_id === user.id) return

              // Get user profile info for display
              const { data: profile } = await supabase
                .from('users_profile')
                .select('display_name')
                .eq('id', typingData.user_id)
                .single()

              const typingEvent: TypingEvent = {
                conversationId: typingData.conversation_id,
                userId: typingData.user_id,
                isTyping: typingData.is_typing,
                userDisplayName: profile?.display_name
              }

              setTypingUsers(prev => ({
                ...prev,
                [typingData.user_id]: typingEvent
              }))

              if (onTypingUpdate) {
                onTypingUpdate(typingEvent)
              }

            } else if (payload.eventType === 'DELETE') {
              const typingData = payload.old as any
              
              setTypingUsers(prev => {
                const updated = { ...prev }
                delete updated[typingData.user_id]
                return updated
              })

              if (onTypingUpdate) {
                onTypingUpdate({
                  conversationId: typingData.conversation_id,
                  userId: typingData.user_id,
                  isTyping: false
                })
              }
            }
          }
        )
    }

    // Store channel references
    const channels = [messagesChannel, statusChannel]
    if (typingChannel) channels.push(typingChannel)
    channelsRef.current = channels

    // Subscribe to all channels
    Promise.all(channels.map(channel => channel.subscribe()))
      .then((results) => {
        const allSuccessful = results.every(result => result === 'SUBSCRIBED')
        
        if (allSuccessful) {
          setIsConnected(true)
          setIsConnecting(false)
          setConnectionError(null)
          console.log('All realtime subscriptions established')
          
          if (onConnectionChange) {
            onConnectionChange(true)
          }
        } else {
          throw new Error('Some subscriptions failed')
        }
      })
      .catch((error) => {
        console.error('Error establishing realtime subscriptions:', error)
        setConnectionError(error.message)
        setIsConnected(false)
        setIsConnecting(false)
        
        if (onConnectionChange) {
          onConnectionChange(false)
        }

        // Attempt to reconnect after delay
        reconnectTimeoutRef.current = setTimeout(() => {
          reconnect()
        }, 5000)
      })

  }, [
    user, 
    conversationId, 
    enableTypingIndicators, 
    enableMessageStatus,
    enableToastNotifications,
    onNewMessage, 
    onMessageStatusUpdate, 
    onTypingUpdate, 
    onConnectionChange,
    markAsDelivered,
    showToast
  ])

  // Reconnect function
  const reconnect = useCallback(() => {
    console.log('Attempting to reconnect realtime subscriptions...')
    cleanupChannels()
    setupSubscriptions()
  }, [cleanupChannels, setupSubscriptions])

  // Disconnect function
  const disconnect = useCallback(() => {
    console.log('Disconnecting realtime subscriptions')
    cleanupChannels()
    setIsConnected(false)
    setIsConnecting(false)
    setTypingUsers({})
    
    if (onConnectionChange) {
      onConnectionChange(false)
    }
  }, [cleanupChannels, onConnectionChange])

  // Setup subscriptions when user changes or conversation changes
  useEffect(() => {
    if (user) {
      setupSubscriptions()
    } else {
      disconnect()
    }

    return () => {
      // Cleanup timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      
      cleanupChannels()
    }
  }, [user, conversationId, setupSubscriptions, disconnect, cleanupChannels])

  // Cleanup typing indicators when component unmounts or user changes
  useEffect(() => {
    return () => {
      if (user && conversationId && enableTypingIndicators) {
        // Clear any active typing indicators
        supabase
          .from('typing_indicators')
          .delete()
          .eq('conversation_id', conversationId)
          .eq('user_id', user.id)
          .then(({ error }) => {
            if (error) {
              console.error('Error cleaning up typing indicators:', error)
            }
          })
      }
    }
  }, [user, conversationId, enableTypingIndicators])

  return {
    isConnected,
    isConnecting,
    connectionError,
    markAsDelivered,
    markAsRead,
    setTyping,
    typingUsers,
    reconnect,
    disconnect
  }
}