import { SupabaseClient } from '@supabase/supabase-js'
import { 
  NotificationPreferences, 
  NotificationPreferencesRepository, 
  NotificationCategory,
  Database 
} from '@preset/types'

export class SupabaseNotificationPreferencesRepository implements NotificationPreferencesRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async getByUserId(userId: string): Promise<NotificationPreferences | null> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Failed to get notification preferences: ${error.message}`)
    }

    return data
  }

  async createDefault(userId: string): Promise<NotificationPreferences> {
    const defaultPreferences = {
      user_id: userId,
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

    const { data, error } = await this.supabase
      .from('notification_preferences')
      .insert(defaultPreferences)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create default notification preferences: ${error.message}`)
    }

    return data
  }

  async update(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .update(preferences)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update notification preferences: ${error.message}`)
    }

    return data
  }

  async updateCategoryPreference(
    userId: string, 
    category: NotificationCategory, 
    enabled: boolean
  ): Promise<void> {
    const columnMap = {
      'gig': 'gig_notifications',
      'application': 'application_notifications',
      'message': 'message_notifications',
      'booking': 'booking_notifications',
      'system': 'system_notifications',
      'marketing': 'marketing_notifications'
    }

    const column = columnMap[category]
    if (!column) {
      throw new Error(`Invalid notification category: ${category}`)
    }

    const { error } = await this.supabase
      .from('notification_preferences')
      .update({ [column]: enabled })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update category preference: ${error.message}`)
    }
  }

  async updateChannelPreference(
    userId: string, 
    channel: 'email' | 'push' | 'in_app', 
    enabled: boolean
  ): Promise<void> {
    const columnMap = {
      'email': 'email_enabled',
      'push': 'push_enabled',
      'in_app': 'in_app_enabled'
    }

    const column = columnMap[channel]

    const { error } = await this.supabase
      .from('notification_preferences')
      .update({ [column]: enabled })
      .eq('user_id', userId)

    if (error) {
      throw new Error(`Failed to update channel preference: ${error.message}`)
    }
  }

  async getOrCreatePreferences(userId: string): Promise<NotificationPreferences> {
    // First try to get existing preferences
    let preferences = await this.getByUserId(userId)
    
    // If none exist, create default preferences
    if (!preferences) {
      preferences = await this.createDefault(userId)
    }
    
    return preferences
  }

  // Bulk operations for admin/system use
  async updateDigestFrequencyForAll(frequency: NotificationPreferences['digest_frequency']): Promise<number> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .update({ digest_frequency: frequency })
      .select('id')

    if (error) {
      throw new Error(`Failed to update digest frequency for all users: ${error.message}`)
    }

    return data?.length || 0
  }

  async getUsersForDigest(frequency: NotificationPreferences['digest_frequency']): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('notification_preferences')
      .select('user_id')
      .eq('digest_frequency', frequency)
      .eq('email_enabled', true)

    if (error) {
      throw new Error(`Failed to get users for digest: ${error.message}`)
    }

    return data?.map(row => row.user_id) || []
  }

  async isNotificationEnabled(
    userId: string, 
    category: NotificationCategory, 
    channel: 'email' | 'push' | 'in_app'
  ): Promise<boolean> {
    const preferences = await this.getByUserId(userId)
    if (!preferences) return false

    // Check if channel is enabled
    const channelEnabled = {
      'email': preferences.email_enabled,
      'push': preferences.push_enabled,
      'in_app': preferences.in_app_enabled
    }[channel]

    if (!channelEnabled) return false

    // Check if category is enabled
    const categoryEnabled = {
      'gig': preferences.gig_notifications,
      'application': preferences.application_notifications,
      'message': preferences.message_notifications,
      'booking': preferences.booking_notifications,
      'system': preferences.system_notifications,
      'marketing': preferences.marketing_notifications
    }[category]

    return categoryEnabled
  }

  async shouldSendNotification(
    userId: string,
    category: NotificationCategory,
    channel: 'email' | 'push' | 'in_app'
  ): Promise<{
    shouldSend: boolean
    preferences: NotificationPreferences | null
    quietHours?: boolean
  }> {
    const preferences = await this.getByUserId(userId)
    if (!preferences) {
      return { shouldSend: false, preferences: null }
    }

    const enabled = await this.isNotificationEnabled(userId, category, channel)
    if (!enabled) {
      return { shouldSend: false, preferences }
    }

    // Check quiet hours for push notifications
    if (channel === 'push' && preferences.quiet_hours_start && preferences.quiet_hours_end) {
      const now = new Date()
      const userTimezone = preferences.timezone || 'UTC'
      
      // Convert current time to user's timezone
      const userTime = new Intl.DateTimeFormat('en-US', {
        timeZone: userTimezone,
        hour12: false,
        hour: '2-digit',
        minute: '2-digit'
      }).format(now)

      const currentTime = userTime.replace(':', '')
      const startTime = preferences.quiet_hours_start.replace(':', '')
      const endTime = preferences.quiet_hours_end.replace(':', '')

      let inQuietHours = false
      
      if (startTime <= endTime) {
        // Same day quiet hours (e.g., 22:00 - 08:00)
        inQuietHours = currentTime >= startTime && currentTime <= endTime
      } else {
        // Quiet hours spanning midnight (e.g., 22:00 - 08:00)
        inQuietHours = currentTime >= startTime || currentTime <= endTime
      }

      if (inQuietHours) {
        return { shouldSend: false, preferences, quietHours: true }
      }
    }

    return { shouldSend: true, preferences }
  }
}