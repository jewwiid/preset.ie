'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../auth-context'
import { useFeedback } from '../../components/feedback/FeedbackContext'
import { supabase } from '../supabase'
// Define types locally to avoid import issues
export interface NotificationFilters {
  category?: string
  read?: boolean
  read_status?: 'all' | 'read' | 'unread'
  date_range?: {
    from: Date
    to: Date
  }
  limit?: number
  offset?: number
}

export interface NotificationPreferences {
  email_enabled: boolean
  push_enabled: boolean
  digest_frequency: 'immediate' | 'daily' | 'weekly' | 'never'
  categories: Record<string, boolean>
}

// Define Notification type locally
export interface Notification {
  id: string
  user_id: string
  recipient_id: string
  type: string
  category: string
  title: string
  message?: string
  avatar_url?: string
  thumbnail_url?: string
  action_url?: string
  data?: any
  read: boolean
  read_at?: string | null
  created_at: string
}

export interface UseNotificationsResult {
  // State
  notifications: Notification[]
  unreadCount: number
  preferences: NotificationPreferences | null
  loading: boolean
  error: string | null

  // Actions
  markAsRead: (notificationId: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  dismiss: (notificationId: string) => Promise<void>
  refresh: () => Promise<void>
  updatePreferences: (updates: Partial<any>) => Promise<void>

  // Filters
  setFilters: (filters: NotificationFilters) => void
  filters: NotificationFilters
}

export function useNotifications(): UseNotificationsResult {
  const { user } = useAuth()
  const { showFeedback } = useFeedback()
  
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<NotificationFilters>({
    read_status: 'all',
    limit: 50
  })

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user || !supabase) return

    try {
      setLoading(true)
      setError(null)

      // Build query with filters
      let query = supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', user.id)

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category)
      }

      if (filters.read_status === 'unread') {
        query = query.is('read_at', null)
      } else if (filters.read_status === 'read') {
        query = query.not('read_at', 'is', null)
      }

      if (filters.date_range) {
        query = query
          .gte('created_at', filters.date_range.from.toISOString())
          .lte('created_at', filters.date_range.to.toISOString())
      }

      // Apply pagination
      query = query
        .order('created_at', { ascending: false })
        .limit(filters.limit || 50)

      if (filters.offset) {
        query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        // Handle table not found gracefully
        if (fetchError.code === 'PGRST205' || fetchError.message.includes('Could not find the table')) {
          console.log('Notifications table not found, returning empty array')
          setNotifications([])
          setUnreadCount(0)
          return
        }
        throw new Error(`Failed to fetch notifications: ${fetchError.message}`)
      }

      setNotifications(data || [])

      // Get unread count
      const { count, error: countError } = await supabase
        .from('notifications')
        .select('id', { count: 'exact', head: true })
        .eq('recipient_id', user.id)
        .is('read_at', null)

      if (countError) {
        // Handle table not found gracefully
        if (countError.code === 'PGRST205' || countError.message.includes('Could not find the table')) {
          console.log('Notifications table not found for count, setting to 0')
          setUnreadCount(0)
        } else {
          console.warn('Failed to get unread count:', countError.message)
        }
      } else {
        setUnreadCount(count || 0)
      }

    } catch (err: any) {
      setError(err.message)
      console.error('Error fetching notifications:', err)
    } finally {
      setLoading(false)
    }
  }, [user, filters])

  // Fetch user preferences
  const fetchPreferences = useCallback(async () => {
    if (!user || !supabase) return

    try {
      // Ensure we have an active session
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData.session) {
        console.warn('No active session when fetching notification preferences')
        return
      }

      let { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code === 'PGRST116') {
        // Create default preferences if none exist
        console.log('Creating default notification preferences for user:', user.id)
        const defaultPrefs = {
          user_id: user.id,
          email_enabled: true,
          push_enabled: true,
          in_app_enabled: true,
          gig_notifications: true,
          application_notifications: true,
          message_notifications: true,
          booking_notifications: true,
          system_notifications: true,
          marketing_notifications: false,
          digest_frequency: 'real-time' as const,
          timezone: 'UTC',
          badge_count_enabled: true,
          sound_enabled: true,
          vibration_enabled: true
        }

        const { data: newPrefs, error: createError } = await supabase
          .from('notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single()

        if (createError) {
          console.error('Failed to create default preferences:', createError)
          console.error('Error details:', {
            message: createError.message || 'No message',
            code: createError.code || 'No code',
            details: createError.details || 'No details',
            hint: createError.hint || 'No hint'
          })
          
          // If table doesn't exist, set default preferences in memory
          if (createError.code === 'PGRST205' || createError.message.includes('Could not find the table')) {
            console.log('Notification preferences table not found, using defaults in memory')
            data = defaultPrefs
          } else {
            return
          }
        } else {
          data = newPrefs
        }
      } else if (error) {
        // Handle table not found gracefully
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          console.log('Notification preferences table not found, using defaults')
          // Set default preferences in memory
          data = {
            user_id: user.id,
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
            gig_notifications: true,
            application_notifications: true,
            message_notifications: true,
            booking_notifications: true,
            system_notifications: true,
            marketing_notifications: false,
            digest_frequency: 'real-time' as const,
            timezone: 'UTC',
            badge_count_enabled: true,
            sound_enabled: true,
            vibration_enabled: true
          }
        } else {
          console.error('Failed to fetch preferences:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint,
            fullError: error
          })
          return
        }
      }

      setPreferences(data)

    } catch (err) {
      console.error('Error fetching notification preferences:', err)
    }
  }, [user])

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user || !supabase) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user.id) // Security: ensure user owns the notification

      if (error) {
        throw new Error(`Failed to mark as read: ${error.message}`)
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId 
            ? { ...n, read_at: new Date().toISOString() }
            : n
        )
      )

      setUnreadCount(prev => Math.max(0, prev - 1))

    } catch (err: any) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: err.message
      })
    }
  }, [user, showFeedback])

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    if (!user || !supabase) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .is('read_at', null)

      if (error) {
        throw new Error(`Failed to mark all as read: ${error.message}`)
      }

      // Update local state
      setNotifications(prev => 
        prev.map(n => ({ ...n, read_at: new Date().toISOString() }))
      )

      setUnreadCount(0)

      showFeedback({
        type: 'success',
        title: 'Success',
        message: 'All notifications marked as read'
      })

    } catch (err: any) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: err.message
      })
    }
  }, [user, showFeedback])

  // Dismiss notification
  const dismiss = useCallback(async (notificationId: string) => {
    if (!user || !supabase) return

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ dismissed_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('recipient_id', user.id)

      if (error) {
        throw new Error(`Failed to dismiss: ${error.message}`)
      }

      // Remove from local state
      setNotifications(prev => prev.filter(n => n.id !== notificationId))

      // Update unread count if notification was unread
      const notification = notifications.find(n => n.id === notificationId)
      if (notification && !notification.read_at) {
        setUnreadCount(prev => Math.max(0, prev - 1))
      }

    } catch (err: any) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: err.message
      })
    }
  }, [user, notifications, showFeedback])

  // Refresh data
  const refresh = useCallback(async () => {
    await Promise.all([
      fetchNotifications(),
      fetchPreferences()
    ])
  }, [fetchNotifications, fetchPreferences])

  // Update preferences
  const updatePreferences = useCallback(async (updates: Partial<any>) => {
    if (!user || !supabase) return

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        // If table doesn't exist, just update local state
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          console.log('Notification preferences table not found, updating local state only')
          setPreferences(prev => prev ? { ...prev, ...updates } : null)
          return
        }
        throw error
      }

      // Update local state
      setPreferences(data)

      showFeedback({
        type: 'success',
        title: 'Preferences updated',
        message: 'Your notification preferences have been saved'
      })
    } catch (err: any) {
      console.error('Failed to update preferences:', err)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to update preferences'
      })
    }
  }, [user, showFeedback])

  // Real-time subscription disabled - using manual refresh instead
  // TODO: Re-enable when real-time is properly configured in Supabase
  // useEffect(() => {
  //   if (!user || !supabase) return
  //   console.log('Setting up notification real-time subscription for user:', user.id)
  //   try {
  //     const channel = supabase
  //       .channel(`notifications:${user.id}`)
  //       .on('postgres_changes', {
  //         event: 'INSERT',
  //         schema: 'public',
  //         table: 'notifications',
  //         filter: `recipient_id=eq.${user.id}`
  //       }, (payload) => {
  //         const newNotification = payload.new as Notification
  //         console.log('Real-time notification received:', newNotification)
  //         setNotifications(prev => [newNotification, ...prev])
  //         setUnreadCount(prev => prev + 1)
  //         showFeedback({
  //           type: 'notification',
  //           title: newNotification.title,
  //           message: newNotification.message,
  //           avatar: newNotification.avatar_url,
  //           actions: newNotification.action_url ? [
  //             { label: 'View', action: () => { if (typeof window !== 'undefined' && newNotification.action_url) { window.location.href = newNotification.action_url } }, style: 'primary' }
  //           ] : undefined,
  //           duration: 8000
  //         })
  //       })
  //       .subscribe((status) => {
  //         if (status === 'SUBSCRIBED') { console.log('✅ Notification subscription established') }
  //         else if (status === 'CHANNEL_ERROR') { console.error('❌ Notification subscription error') }
  //         else if (status === 'TIMED_OUT') { console.warn('⏰ Notification subscription timeout') }
  //       })
  //     return () => {
  //       console.log('Cleaning up notification subscription')
  //       try { if (supabase) { supabase.removeChannel(channel) } }
  //       catch (error) { console.error('Error removing notification channel:', error) }
  //     }
  //   } catch (error) {
  //     console.error('Error setting up notification subscription:', error)
  //   }
  // }, [user, showFeedback])

  // Initial data fetch
  useEffect(() => {
    if (user) {
      refresh()
    } else {
      // Reset state when user logs out
      setNotifications([])
      setUnreadCount(0)
      setPreferences(null)
      setLoading(false)
      setError(null)
    }
  }, [user, refresh])

  // Refetch when filters change
  useEffect(() => {
    if (user) {
      fetchNotifications()
    }
  }, [filters, fetchNotifications])

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    dismiss,
    refresh,
    updatePreferences,
    setFilters,
    filters
  }
}