'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../auth-context'
import { supabase } from '../supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export type MessageStatus = 'sent' | 'delivered' | 'read'

export interface MessageStatusData {
  messageId: string
  status: MessageStatus
  updatedAt: string
  fromUserId: string
  toUserId: string
}

export interface UseMessageStatusOptions {
  conversationId?: string
  enableRealtimeUpdates?: boolean
}

export interface UseMessageStatusResult {
  // Status tracking
  messageStatuses: Record<string, MessageStatusData>
  
  // Actions
  markAsDelivered: (messageId: string) => Promise<void>
  markAsRead: (messageId: string) => Promise<void>
  markConversationAsDelivered: (conversationId: string) => Promise<void>
  markConversationAsRead: (conversationId: string) => Promise<void>
  
  // Queries
  getMessageStatus: (messageId: string) => MessageStatus | null
  isMessageDelivered: (messageId: string) => boolean
  isMessageRead: (messageId: string) => boolean
  getUnreadCount: (conversationId?: string) => number
  getDeliveredCount: (conversationId?: string) => number
  
  // State
  isConnected: boolean
  lastUpdate: string | null
}

export function useMessageStatus(options: UseMessageStatusOptions = {}): UseMessageStatusResult {
  const { user } = useAuth()
  const { conversationId, enableRealtimeUpdates = true } = options

  // State
  const [messageStatuses, setMessageStatuses] = useState<Record<string, MessageStatusData>>({})
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)

  // Refs
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Mark message as delivered
  const markAsDelivered = useCallback(async (messageId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          status: 'delivered',
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('to_user_id', user.id)
        .eq('status', 'sent') // Only update if currently sent

      if (error) {
        console.error('Error marking message as delivered:', error)
        return
      }

      // Update local state
      setMessageStatuses(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          messageId,
          status: 'delivered',
          updatedAt: new Date().toISOString(),
          fromUserId: prev[messageId]?.fromUserId || '',
          toUserId: user.id
        }
      }))

      setLastUpdate(new Date().toISOString())

    } catch (error) {
      console.error('Error in markAsDelivered:', error)
    }
  }, [user])

  // Mark message as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('messages')
        .update({ 
          read_at: new Date().toISOString(),
          status: 'read',
          updated_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('to_user_id', user.id)
        .neq('status', 'read') // Only update if not already read

      if (error) {
        console.error('Error marking message as read:', error)
        return
      }

      // Update local state
      setMessageStatuses(prev => ({
        ...prev,
        [messageId]: {
          ...prev[messageId],
          messageId,
          status: 'read',
          updatedAt: new Date().toISOString(),
          fromUserId: prev[messageId]?.fromUserId || '',
          toUserId: user.id
        }
      }))

      setLastUpdate(new Date().toISOString())

    } catch (error) {
      console.error('Error in markAsRead:', error)
    }
  }, [user])

  // Mark all messages in conversation as delivered
  const markConversationAsDelivered = useCallback(async (targetConversationId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ 
          status: 'delivered',
          updated_at: new Date().toISOString()
        })
        .eq('conversation_id', targetConversationId)
        .eq('to_user_id', user.id)
        .eq('status', 'sent')
        .select('id, from_user_id')

      if (error) {
        console.error('Error marking conversation as delivered:', error)
        return
      }

      // Update local state for all affected messages
      const now = new Date().toISOString()
      if (data) {
        setMessageStatuses(prev => {
          const updated = { ...prev }
          data.forEach(message => {
            updated[message.id] = {
              messageId: message.id,
              status: 'delivered',
              updatedAt: now,
              fromUserId: message.from_user_id,
              toUserId: user.id
            }
          })
          return updated
        })
      }

      setLastUpdate(now)

    } catch (error) {
      console.error('Error in markConversationAsDelivered:', error)
    }
  }, [user])

  // Mark all messages in conversation as read
  const markConversationAsRead = useCallback(async (targetConversationId: string) => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .update({ 
          read_at: new Date().toISOString(),
          status: 'read',
          updated_at: new Date().toISOString()
        })
        .eq('conversation_id', targetConversationId)
        .eq('to_user_id', user.id)
        .neq('status', 'read')
        .select('id, from_user_id')

      if (error) {
        console.error('Error marking conversation as read:', error)
        return
      }

      // Update local state for all affected messages
      const now = new Date().toISOString()
      if (data) {
        setMessageStatuses(prev => {
          const updated = { ...prev }
          data.forEach(message => {
            updated[message.id] = {
              messageId: message.id,
              status: 'read',
              updatedAt: now,
              fromUserId: message.from_user_id,
              toUserId: user.id
            }
          })
          return updated
        })
      }

      setLastUpdate(now)

    } catch (error) {
      console.error('Error in markConversationAsRead:', error)
    }
  }, [user])

  // Query functions
  const getMessageStatus = useCallback((messageId: string): MessageStatus | null => {
    return messageStatuses[messageId]?.status || null
  }, [messageStatuses])

  const isMessageDelivered = useCallback((messageId: string): boolean => {
    const status = getMessageStatus(messageId)
    return status === 'delivered' || status === 'read'
  }, [getMessageStatus])

  const isMessageRead = useCallback((messageId: string): boolean => {
    const status = getMessageStatus(messageId)
    return status === 'read'
  }, [getMessageStatus])

  const getUnreadCount = useCallback((targetConversationId?: string) => {
    return Object.values(messageStatuses).filter(status => 
      status.status !== 'read' &&
      status.toUserId === user?.id &&
      (!targetConversationId || true) // TODO: Add conversation filtering when needed
    ).length
  }, [messageStatuses, user])

  const getDeliveredCount = useCallback((targetConversationId?: string) => {
    return Object.values(messageStatuses).filter(status => 
      (status.status === 'delivered' || status.status === 'read') &&
      status.toUserId === user?.id &&
      (!targetConversationId || true) // TODO: Add conversation filtering when needed
    ).length
  }, [messageStatuses, user])

  // Load initial message statuses for conversation
  const loadMessageStatuses = useCallback(async () => {
    if (!user || !conversationId) return

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('id, status, updated_at, from_user_id, to_user_id')
        .eq('conversation_id', conversationId)
        .not('status', 'is', null)

      if (error) {
        console.error('Error loading message statuses:', error)
        return
      }

      // Update local state
      if (data) {
        const statusMap: Record<string, MessageStatusData> = {}
        data.forEach(message => {
          statusMap[message.id] = {
            messageId: message.id,
            status: message.status as MessageStatus,
            updatedAt: message.updated_at || new Date().toISOString(),
            fromUserId: message.from_user_id,
            toUserId: message.to_user_id
          }
        })
        
        setMessageStatuses(prev => ({ ...prev, ...statusMap }))
      }

    } catch (error) {
      console.error('Error in loadMessageStatuses:', error)
    }
  }, [user, conversationId])

  // Setup real-time subscription for message status updates
  const setupRealtimeSubscription = useCallback(() => {
    if (!user || !enableRealtimeUpdates) return

    console.log('Setting up message status subscription for user:', user.id)

    const channel = supabase
      .channel(`message-status:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `to_user_id=eq.${user.id}`
        },
        (payload) => {
          const message = payload.new as any
          console.log('Message status update:', message)

          if (message.status) {
            setMessageStatuses(prev => ({
              ...prev,
              [message.id]: {
                messageId: message.id,
                status: message.status as MessageStatus,
                updatedAt: message.updated_at || new Date().toISOString(),
                fromUserId: message.from_user_id,
                toUserId: message.to_user_id
              }
            }))

            setLastUpdate(new Date().toISOString())
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `from_user_id=eq.${user.id}`
        },
        (payload) => {
          const message = payload.new as any
          console.log('Sent message status update:', message)

          if (message.status) {
            setMessageStatuses(prev => ({
              ...prev,
              [message.id]: {
                messageId: message.id,
                status: message.status as MessageStatus,
                updatedAt: message.updated_at || new Date().toISOString(),
                fromUserId: message.from_user_id,
                toUserId: message.to_user_id
              }
            }))

            setLastUpdate(new Date().toISOString())
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Message status subscription established')
          setIsConnected(true)
        } else if (status === 'CLOSED') {
          console.log('Message status subscription closed')
          setIsConnected(false)
        }
      })

    channelRef.current = channel

  }, [user, enableRealtimeUpdates])

  // Setup subscription when user changes
  useEffect(() => {
    if (user && enableRealtimeUpdates) {
      setupRealtimeSubscription()
    }

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up message status subscription')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [user, setupRealtimeSubscription, enableRealtimeUpdates])

  // Load initial data when conversation changes
  useEffect(() => {
    if (conversationId) {
      loadMessageStatuses()
    }
  }, [conversationId, loadMessageStatuses])

  return {
    messageStatuses,
    markAsDelivered,
    markAsRead,
    markConversationAsDelivered,
    markConversationAsRead,
    getMessageStatus,
    isMessageDelivered,
    isMessageRead,
    getUnreadCount,
    getDeliveredCount,
    isConnected,
    lastUpdate
  }
}