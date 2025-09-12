// =====================================================
// Notification System Types - Phase 2
// =====================================================

export type NotificationType = 
  // Gig Lifecycle
  | 'gig_published'
  | 'gig_expiring_soon'
  | 'new_gig_match'
  | 'gig_ending_soon'
  
  // Application Process
  | 'application_received'
  | 'application_withdrawn'
  | 'application_viewed'
  | 'shortlisted'
  | 'application_declined'
  
  // Bookings & Talent
  | 'talent_booked'
  | 'booking_confirmed'
  | 'shoot_reminder'
  
  // Communication
  | 'message_received'
  
  // Post-Shoot & Growth
  | 'showcase_submitted'
  | 'showcase_approved'
  | 'review_received'
  | 'profile_viewed'
  | 'new_follower'
  
  // System & Account
  | 'credit_low'
  | 'subscription_expiring'
  | 'system_update'
  | 'account_verification'

export type NotificationCategory = 
  | 'gig'
  | 'application'
  | 'message'
  | 'booking'
  | 'system'
  | 'marketing'

export type DigestFrequency = 
  | 'real-time'
  | 'hourly'
  | 'daily'
  | 'weekly'

export interface NotificationAction {
  label: string
  action_type: 'url' | 'api_call' | 'dismiss'
  action_data: Record<string, any>
  style?: 'primary' | 'secondary' | 'destructive'
}

export interface Notification {
  id: string
  recipient_id: string
  
  // Content
  type: NotificationType
  category: NotificationCategory
  title: string
  message?: string
  
  // Rich Content
  avatar_url?: string
  thumbnail_url?: string
  action_url?: string
  action_data?: Record<string, any>
  
  // Relationships
  sender_id?: string
  related_gig_id?: string
  related_application_id?: string
  
  // State
  read_at?: string | null
  dismissed_at?: string | null
  delivered_at?: string | null
  
  // Delivery Tracking
  delivered_push: boolean
  delivered_email: boolean
  delivered_in_app: boolean
  
  // Scheduling
  scheduled_for: string
  expires_at?: string | null
  
  // Metadata
  created_at: string
  updated_at: string
}

export interface NotificationPreferences {
  id: string
  user_id: string
  
  // Channel Controls
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  
  // Category Controls
  gig_notifications: boolean
  application_notifications: boolean
  message_notifications: boolean
  booking_notifications: boolean
  system_notifications: boolean
  marketing_notifications: boolean
  
  // Delivery Timing
  digest_frequency: DigestFrequency
  quiet_hours_start?: string | null
  quiet_hours_end?: string | null
  timezone: string
  
  // Mobile Specific
  badge_count_enabled: boolean
  sound_enabled: boolean
  vibration_enabled: boolean
  
  created_at: string
  updated_at: string
}

// =====================================================
// Repository Interfaces
// =====================================================

export interface NotificationFilters {
  category?: NotificationCategory
  type?: NotificationType
  read_status?: 'all' | 'unread' | 'read'
  date_range?: {
    from: Date
    to: Date
  }
  limit?: number
  offset?: number
}

export interface NotificationRepository {
  // Core CRUD
  create(notification: Omit<Notification, 'id' | 'created_at' | 'updated_at'>): Promise<Notification>
  findById(id: string): Promise<Notification | null>
  findByRecipient(recipientId: string, filters?: NotificationFilters): Promise<Notification[]>
  update(id: string, updates: Partial<Notification>): Promise<Notification>
  delete(id: string): Promise<void>
  
  // State Management
  markAsRead(id: string): Promise<void>
  markAsDelivered(id: string, channel: 'push' | 'email' | 'in_app'): Promise<void>
  dismiss(id: string): Promise<void>
  
  // Bulk Operations
  markAllAsRead(recipientId: string): Promise<number>
  cleanup(olderThanDays: number): Promise<number>
  
  // Analytics
  getUnreadCount(recipientId: string): Promise<number>
  getDeliveryStats(dateRange: { from: Date; to: Date }): Promise<any[]>
}

export interface NotificationPreferencesRepository {
  // Preferences Management
  getByUserId(userId: string): Promise<NotificationPreferences | null>
  createDefault(userId: string): Promise<NotificationPreferences>
  update(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>
  
  // Category Controls
  updateCategoryPreference(userId: string, category: NotificationCategory, enabled: boolean): Promise<void>
  updateChannelPreference(userId: string, channel: 'email' | 'push' | 'in_app', enabled: boolean): Promise<void>
}

// =====================================================
// Service Interfaces
// =====================================================

export interface NotificationPayload {
  recipient_id: string
  type: NotificationType
  title: string
  message?: string
  avatar_url?: string
  action_url?: string
  action_data?: Record<string, any>
  sender_id?: string
  related_gig_id?: string
  related_application_id?: string
  scheduled_for?: Date
  expires_at?: Date
}

export interface NotificationService {
  // Core Operations
  send(payload: NotificationPayload): Promise<Notification>
  sendBulk(payloads: NotificationPayload[]): Promise<Notification[]>
  
  // Event-Driven Notifications
  onGigCreated(gig: any): Promise<void>
  onApplicationSubmitted(application: any): Promise<void>
  onTalentBooked(booking: any): Promise<void>
  onMessageReceived(message: any): Promise<void>
  
  // Delivery Management
  processScheduledNotifications(): Promise<number>
  sendDigestEmails(frequency: DigestFrequency): Promise<number>
  
  // User Management
  getUserNotifications(userId: string, filters?: NotificationFilters): Promise<Notification[]>
  getUnreadCount(userId: string): Promise<number>
  markAsRead(notificationId: string, userId: string): Promise<void>
}

// =====================================================
// Database Table Types (for Supabase)
// =====================================================

export interface Database {
  public: {
    Tables: {
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Notification, 'id' | 'created_at' | 'updated_at'>>
      }
      notification_preferences: {
        Row: NotificationPreferences
        Insert: Omit<NotificationPreferences, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<NotificationPreferences, 'id' | 'created_at' | 'updated_at'>>
      }
    }
    Views: {
      notification_delivery_stats: {
        Row: {
          date: string
          category: NotificationCategory
          total_sent: number
          delivered_in_app: number
          delivered_email: number
          delivered_push: number
          read_count: number
          avg_time_to_read_minutes: number | null
        }
      }
    }
    Functions: {
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
    }
  }
}