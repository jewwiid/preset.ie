'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../auth-context'
import { useFeedback } from '../../components/feedback/FeedbackContext'
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
  const { showFeedback } = useFeedback()
  
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
    if (supabase) {
      const client = supabase
      channelsRef.current.forEach(channel => {
        client.removeChannel(channel)
      })
    }
    channelsRef.current = []
  }, [])

  // Mark messages as delivered when user views conversation
  const markAsDelivered = useCallback(async (conversationId: string) => {
    if (!user || !enableMessageStatus || !supabase) return

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
    if (!user || !enableMessageStatus || !supabase) return

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
    if (!user || !enableTypingIndicators || !supabase) return

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
          // Don't return early, still set the timeout for UI consistency
        }

        // Auto-clear typing after 3 seconds of inactivity
        typingTimeoutRef.current = setTimeout(() => {
          setTyping(conversationId, false)
        }, 3000) as unknown as NodeJS.Timeout
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
      // Continue with timeout cleanup even if there's an error
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }
    }
  }, [user, enableTypingIndicators])

  // Setup real-time subscriptions
  const setupSubscriptions = useCallback(async () => {
    if (!user || !supabase) return

    setIsConnecting(true)
    setConnectionError(null)
    
    console.log('Setting up realtime message subscriptions for user:', user.id)
    
    // Check if WebSocket is available
    if (typeof window === 'undefined' || typeof WebSocket === 'undefined') {
      console.warn('WebSocket not available, skipping realtime setup')
      setConnectionError('WebSocket not supported in this environment')
      return
    }

    // Check if user is authenticated before setting up subscriptions
    if (!user.id) {
      console.error('User not authenticated, cannot setup realtime subscriptions')
      setIsConnecting(false)
      setConnectionError('User not authenticated')
      return
    }

    // Ensure we have a valid session before establishing realtime connection
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        console.error('No valid session for realtime connection:', sessionError)
        setIsConnecting(false)
        setConnectionError('Authentication required for realtime connection')
        return
      }
      
      // Check if session is expired
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.error('Session expired, refreshing...')
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
        if (refreshError || !refreshedSession) {
          console.error('Failed to refresh session:', refreshError)
          setIsConnecting(false)
          setConnectionError('Session expired and could not be refreshed')
          return
        }
        console.log('Session refreshed successfully')
      }
      
      console.log('Valid session found, proceeding with realtime setup')
    } catch (error) {
      console.error('Error checking session for realtime:', error)
      setIsConnecting(false)
      setConnectionError('Failed to verify authentication')
      return
    }

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
            showFeedback({
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
              if (!supabase) return
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

    // Subscribe to all channels with individual error handling
    const subscribePromises = channels.map(async (channel) => {
      try {
        const result = await channel.subscribe()
        
        // Listen for subscription errors
        channel.on('system', {}, (status) => {
          console.log('Realtime channel status:', status)
          if (status === 'CLOSED') {
            console.error('Realtime channel closed unexpectedly')
            setConnectionError('Connection lost')
            setIsConnected(false)
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Realtime channel error')
            setConnectionError('Channel error')
            setIsConnected(false)
          } else if (status === 'TIMED_OUT') {
            console.error('Realtime channel timed out')
            setConnectionError('Connection timed out')
            setIsConnected(false)
          }
        })
        
        return result
      } catch (error) {
        console.error('Error subscribing to channel:', error)
        throw error
      }
    })

         Promise.all(subscribePromises)
           .then((results) => {
             // All channels were subscribed successfully
             setIsConnected(true)
             setIsConnecting(false)
             setConnectionError(null)
             console.log('All realtime subscriptions established')

             if (onConnectionChange) {
               onConnectionChange(true)
             }
           })
           .catch((error) => {
             console.error('Error establishing realtime subscriptions:', error)
             
            // Handle specific error types
            let errorMessage = 'Failed to establish connection'
            if (error.message?.includes('401')) {
              errorMessage = 'Authentication required for realtime connection'
            } else if (error.message?.includes('NS_ERROR_WEBSOCKET_CONNECTION_REFUSED') || 
                       error.message?.includes('WebSocket connection failed')) {
              errorMessage = 'Realtime service unavailable. Please enable Realtime in Supabase dashboard.'
            } else if (error.message?.includes('WebSocket')) {
               errorMessage = 'WebSocket connection failed - check network connectivity'
             } else if (error.message?.includes('timeout')) {
               errorMessage = 'Connection timeout - server may be unavailable'
             }
             
             setConnectionError(errorMessage)
             setIsConnected(false)
             setIsConnecting(false)

             if (onConnectionChange) {
               onConnectionChange(false)
             }

             // Only attempt to reconnect for non-authentication errors
             if (!error.message?.includes('401')) {
               // Attempt to reconnect after delay (exponential backoff)
               const retryDelay = Math.min(5000 * Math.pow(2, 0), 30000) // Max 30 seconds
               reconnectTimeoutRef.current = setTimeout(() => {
                 reconnect()
               }, retryDelay) as unknown as NodeJS.Timeout
             }
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
    showFeedback
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
      if (user && conversationId && enableTypingIndicators && supabase) {
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