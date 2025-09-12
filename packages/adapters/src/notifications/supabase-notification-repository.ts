import { SupabaseClient } from '@supabase/supabase-js'
import { 
  Notification, 
  NotificationRepository, 
  NotificationFilters,
  Database 
} from '@preset/types'

export class SupabaseNotificationRepository implements NotificationRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async create(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`)
    }

    return data
  }

  async findById(id: string): Promise<Notification | null> {
    const { data, error } = await this.supabase
      .from('notifications')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to find notification: ${error.message}`)
    }

    return data
  }

  async findByRecipient(recipientId: string, filters: NotificationFilters = {}): Promise<Notification[]> {
    let query = this.supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', recipientId)

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category)
    }

    if (filters.type) {
      query = query.eq('type', filters.type)
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
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    if (filters.offset) {
      query = query.range(filters.offset, (filters.offset + (filters.limit || 50)) - 1)
    }

    // Order by creation time (newest first)
    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to find notifications: ${error.message}`)
    }

    return data || []
  }

  async update(id: string, updates: Partial<Notification>): Promise<Notification> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update notification: ${error.message}`)
    }

    return data
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`)
    }
  }

  async markAsRead(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`)
    }
  }

  async markAsDelivered(id: string, channel: 'push' | 'email' | 'in_app'): Promise<void> {
    const updates: any = { delivered_at: new Date().toISOString() }
    
    switch (channel) {
      case 'push':
        updates.delivered_push = true
        break
      case 'email':
        updates.delivered_email = true
        break
      case 'in_app':
        updates.delivered_in_app = true
        break
    }

    const { error } = await this.supabase
      .from('notifications')
      .update(updates)
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to mark notification as delivered: ${error.message}`)
    }
  }

  async dismiss(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ dismissed_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to dismiss notification: ${error.message}`)
    }
  }

  async markAllAsRead(recipientId: string): Promise<number> {
    const { data, error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('recipient_id', recipientId)
      .is('read_at', null)
      .select('id')

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`)
    }

    return data?.length || 0
  }

  async cleanup(olderThanDays: number): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays)

    const { data, error } = await this.supabase
      .from('notifications')
      .delete()
      .lt('created_at', cutoffDate.toISOString())
      .not('read_at', 'is', null) // Only delete read notifications
      .select('id')

    if (error) {
      throw new Error(`Failed to cleanup old notifications: ${error.message}`)
    }

    return data?.length || 0
  }

  async getUnreadCount(recipientId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_id', recipientId)
      .is('read_at', null)

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`)
    }

    return count || 0
  }

  async getDeliveryStats(dateRange: { from: Date; to: Date }): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('notification_delivery_stats')
      .select('*')
      .gte('date', dateRange.from.toISOString().split('T')[0])
      .lte('date', dateRange.to.toISOString().split('T')[0])
      .order('date', { ascending: false })

    if (error) {
      throw new Error(`Failed to get delivery stats: ${error.message}`)
    }

    return data || []
  }

  // Real-time subscription for notifications
  subscribeToUserNotifications(recipientId: string, callback: (notification: Notification) => void) {
    return this.supabase
      .channel(`notifications:${recipientId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `recipient_id=eq.${recipientId}`
      }, (payload) => {
        callback(payload.new as Notification)
      })
      .subscribe()
  }
}