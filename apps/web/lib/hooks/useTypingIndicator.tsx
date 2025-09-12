'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '../auth-context'
import { supabase } from '../supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface TypingUser {
  userId: string
  conversationId: string
  displayName?: string
  handle?: string
  lastActivity: string
}

export interface UseTypingIndicatorOptions {
  conversationId?: string
  typingTimeout?: number // milliseconds before auto-stopping typing indicator
  cleanupInterval?: number // milliseconds for cleanup of old indicators
}

export interface UseTypingIndicatorResult {
  // State
  typingUsers: TypingUser[]
  isCurrentUserTyping: boolean
  isConnected: boolean
  
  // Actions
  startTyping: (conversationId: string) => Promise<void>
  stopTyping: (conversationId: string) => Promise<void>
  setTyping: (conversationId: string, isTyping: boolean) => Promise<void>
  
  // Utils
  isUserTyping: (userId: string, conversationId?: string) => boolean
  getTypingUsersForConversation: (conversationId: string) => TypingUser[]
  getTypingUserNames: (conversationId: string) => string[]
}

export function useTypingIndicator(options: UseTypingIndicatorOptions = {}): UseTypingIndicatorResult {
  const { user } = useAuth()
  const {
    conversationId,
    typingTimeout = 3000,
    cleanupInterval = 10000
  } = options

  // State
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([])
  const [isCurrentUserTyping, setIsCurrentUserTyping] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  // Refs
  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cleanupIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const currentConversationRef = useRef<string | null>(conversationId || null)

  // Update conversation ref when conversationId changes
  useEffect(() => {
    currentConversationRef.current = conversationId || null
  }, [conversationId])

  // Start typing indicator
  const startTyping = useCallback(async (targetConversationId: string) => {
    if (!user) return

    try {
      // Clear any existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Upsert typing indicator in database
      const { error } = await supabase
        .from('typing_indicators')
        .upsert({
          conversation_id: targetConversationId,
          user_id: user.id,
          is_typing: true,
          last_activity: new Date().toISOString()
        }, {
          onConflict: 'conversation_id,user_id'
        })

      if (error) {
        console.error('Error starting typing indicator:', error)
        return
      }

      setIsCurrentUserTyping(true)

      // Set auto-stop timeout
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(targetConversationId)
      }, typingTimeout)

    } catch (error) {
      console.error('Error in startTyping:', error)
    }
  }, [user, typingTimeout])

  // Stop typing indicator
  const stopTyping = useCallback(async (targetConversationId: string) => {
    if (!user) return

    try {
      // Clear timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = null
      }

      // Remove typing indicator from database
      const { error } = await supabase
        .from('typing_indicators')
        .delete()
        .eq('conversation_id', targetConversationId)
        .eq('user_id', user.id)

      if (error) {
        console.error('Error stopping typing indicator:', error)
        return
      }

      setIsCurrentUserTyping(false)

    } catch (error) {
      console.error('Error in stopTyping:', error)
    }
  }, [user])

  // Set typing state (convenience method)
  const setTyping = useCallback(async (targetConversationId: string, isTyping: boolean) => {
    if (isTyping) {
      await startTyping(targetConversationId)
    } else {
      await stopTyping(targetConversationId)
    }
  }, [startTyping, stopTyping])

  // Utility functions
  const isUserTyping = useCallback((userId: string, targetConversationId?: string) => {
    return typingUsers.some(typingUser => 
      typingUser.userId === userId && 
      (!targetConversationId || typingUser.conversationId === targetConversationId)
    )
  }, [typingUsers])

  const getTypingUsersForConversation = useCallback((targetConversationId: string) => {
    return typingUsers.filter(typingUser => 
      typingUser.conversationId === targetConversationId
    )
  }, [typingUsers])

  const getTypingUserNames = useCallback((targetConversationId: string) => {
    return getTypingUsersForConversation(targetConversationId)
      .map(typingUser => typingUser.displayName || typingUser.handle || 'Someone')
      .filter(name => name !== 'Someone')
  }, [getTypingUsersForConversation])

  // Setup real-time subscription
  const setupSubscription = useCallback(() => {
    if (!user) return

    console.log('Setting up typing indicator subscription for user:', user.id)

    // Create channel for typing indicators
    const channel = supabase
      .channel(`typing-indicators:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'typing_indicators'
        },
        async (payload) => {
          console.log('Typing indicator change:', payload)

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const typingData = payload.new as any

            // Don't process our own typing indicators
            if (typingData.user_id === user.id) return

            // Get user profile information
            const { data: profile } = await supabase
              .from('users_profile')
              .select('display_name, handle')
              .eq('id', typingData.user_id)
              .single()

            const typingUser: TypingUser = {
              userId: typingData.user_id,
              conversationId: typingData.conversation_id,
              displayName: profile?.display_name,
              handle: profile?.handle,
              lastActivity: typingData.last_activity
            }

            // Update or add typing user
            setTypingUsers(prev => {
              const filtered = prev.filter(u => 
                u.userId !== typingData.user_id || 
                u.conversationId !== typingData.conversation_id
              )
              
              if (typingData.is_typing) {
                return [...filtered, typingUser]
              } else {
                return filtered
              }
            })

          } else if (payload.eventType === 'DELETE') {
            const typingData = payload.old as any

            // Remove typing user
            setTypingUsers(prev => prev.filter(u => 
              u.userId !== typingData.user_id || 
              u.conversationId !== typingData.conversation_id
            ))
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Typing indicator subscription established')
          setIsConnected(true)
        } else if (status === 'CLOSED') {
          console.log('Typing indicator subscription closed')
          setIsConnected(false)
        }
      })

    channelRef.current = channel

  }, [user])

  // Cleanup old typing indicators
  const cleanupOldIndicators = useCallback(() => {
    const cutoffTime = new Date(Date.now() - typingTimeout)
    
    setTypingUsers(prev => 
      prev.filter(user => new Date(user.lastActivity) > cutoffTime)
    )
  }, [typingTimeout])

  // Setup subscription when user changes
  useEffect(() => {
    if (user) {
      setupSubscription()
    }

    return () => {
      if (channelRef.current) {
        console.log('Cleaning up typing indicator subscription')
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      setIsConnected(false)
    }
  }, [user, setupSubscription])

  // Setup cleanup interval
  useEffect(() => {
    cleanupIntervalRef.current = setInterval(cleanupOldIndicators, cleanupInterval)

    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current)
      }
    }
  }, [cleanupOldIndicators, cleanupInterval])

  // Cleanup typing indicator when component unmounts or conversation changes
  useEffect(() => {
    return () => {
      // Clear timeouts
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }

      // Stop typing for current conversation if user is typing
      if (user && currentConversationRef.current && isCurrentUserTyping) {
        stopTyping(currentConversationRef.current)
      }
    }
  }, [user, stopTyping, isCurrentUserTyping])

  // Auto-stop typing when user switches conversations
  useEffect(() => {
    if (user && isCurrentUserTyping) {
      const previousConversation = currentConversationRef.current
      if (previousConversation && previousConversation !== conversationId) {
        stopTyping(previousConversation)
      }
    }
  }, [conversationId, user, isCurrentUserTyping, stopTyping])

  return {
    typingUsers,
    isCurrentUserTyping,
    isConnected,
    startTyping,
    stopTyping,
    setTyping,
    isUserTyping,
    getTypingUsersForConversation,
    getTypingUserNames
  }
}