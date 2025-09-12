import { 
  NotificationService,
  NotificationPayload,
  Notification,
  NotificationFilters,
  NotificationRepository,
  NotificationPreferencesRepository,
  NotificationType,
  NotificationCategory
} from '@preset/types'

export class PresetNotificationService implements NotificationService {
  constructor(
    private notificationRepository: NotificationRepository,
    private preferencesRepository: NotificationPreferencesRepository
  ) {}

  async send(payload: NotificationPayload): Promise<Notification> {
    // Check user preferences before sending
    const category = this.getCategoryFromType(payload.type)
    const preferences = await this.preferencesRepository.shouldSendNotification(
      payload.recipient_id,
      category,
      'in_app'
    )

    if (!preferences.shouldSend) {
      throw new Error(`User has disabled ${category} notifications`)
    }

    // Create the notification with delivery tracking
    const notification = await this.notificationRepository.create({
      ...payload,
      category,
      delivered_push: false,
      delivered_email: false,
      delivered_in_app: true, // Always delivered to in-app initially
      scheduled_for: payload.scheduled_for?.toISOString() || new Date().toISOString(),
      expires_at: payload.expires_at?.toISOString() || null
    })

    // Mark as delivered for in-app
    await this.notificationRepository.markAsDelivered(notification.id, 'in_app')

    return notification
  }

  async sendBulk(payloads: NotificationPayload[]): Promise<Notification[]> {
    const results: Notification[] = []
    
    // Process in batches to avoid overwhelming the database
    const batchSize = 50
    for (let i = 0; i < payloads.length; i += batchSize) {
      const batch = payloads.slice(i, i + batchSize)
      const batchPromises = batch.map(payload => this.send(payload).catch(err => {
        console.error(`Failed to send notification to ${payload.recipient_id}:`, err)
        return null
      }))
      
      const batchResults = await Promise.all(batchPromises)
      results.push(...batchResults.filter(Boolean) as Notification[])
    }

    return results
  }

  // Platform Event Handlers
  async onGigCreated(gig: any): Promise<void> {
    console.log('📢 Processing gig creation notification:', gig.id)
    
    // Find talent who might be interested in this gig
    const matchingTalent = await this.findMatchingTalent(gig)
    
    if (matchingTalent.length === 0) {
      console.log('No matching talent found for gig:', gig.id)
      return
    }

    const notifications: NotificationPayload[] = matchingTalent.map(talent => ({
      recipient_id: talent.user_id,
      type: 'new_gig_match',
      title: `New ${gig.style} gig in ${gig.location || gig.city}`,
      message: `"${gig.title}" - ${gig.description?.substring(0, 100) || ''}${gig.description?.length > 100 ? '...' : ''}`,
      action_url: `/gigs/${gig.id}`,
      action_data: {
        gig_id: gig.id,
        gig_title: gig.title,
        location: gig.location || gig.city,
        style: gig.style
      },
      sender_id: gig.creator_id,
      related_gig_id: gig.id
    }))

    await this.sendBulk(notifications)
    console.log(`✅ Sent ${notifications.length} gig match notifications`)
  }

  async onApplicationSubmitted(application: any): Promise<void> {
    console.log('📝 Processing application submission notification:', application.id)
    
    // Notify the gig creator
    const notification: NotificationPayload = {
      recipient_id: application.gig.creator_id,
      type: 'application_received',
      title: 'New Application Received',
      message: `${application.talent.display_name} applied to your gig "${application.gig.title}"`,
      avatar_url: application.talent.profile_image_url,
      action_url: `/gigs/${application.gig_id}/applications`,
      action_data: {
        application_id: application.id,
        gig_id: application.gig_id,
        talent_name: application.talent.display_name
      },
      sender_id: application.talent_id,
      related_gig_id: application.gig_id,
      related_application_id: application.id
    }

    await this.send(notification)
    console.log(`✅ Sent application notification to gig creator`)
  }

  async onTalentBooked(booking: any): Promise<void> {
    console.log('🎉 Processing talent booking notifications:', booking.id)
    
    // Notify both the talent and contributor
    const notifications: NotificationPayload[] = [
      // Notify the talent
      {
        recipient_id: booking.talent_id,
        type: 'booking_confirmed',
        title: 'Congratulations! You\'re Booked',
        message: `${booking.contributor.display_name} has booked you for "${booking.gig.title}"`,
        avatar_url: booking.contributor.profile_image_url,
        action_url: `/bookings/${booking.id}`,
        action_data: {
          booking_id: booking.id,
          gig_id: booking.gig_id,
          contributor_name: booking.contributor.display_name,
          shoot_date: booking.shoot_date
        },
        sender_id: booking.contributor_id,
        related_gig_id: booking.gig_id
      },
      // Notify the contributor
      {
        recipient_id: booking.contributor_id,
        type: 'talent_booked',
        title: 'Booking Confirmed',
        message: `You've successfully booked ${booking.talent.display_name} for "${booking.gig.title}"`,
        avatar_url: booking.talent.profile_image_url,
        action_url: `/bookings/${booking.id}`,
        action_data: {
          booking_id: booking.id,
          gig_id: booking.gig_id,
          talent_name: booking.talent.display_name,
          shoot_date: booking.shoot_date
        },
        sender_id: booking.talent_id,
        related_gig_id: booking.gig_id
      }
    ]

    await this.sendBulk(notifications)
    console.log(`✅ Sent booking confirmation notifications to both parties`)
  }

  async onMessageReceived(message: any): Promise<void> {
    console.log('💬 Processing message notification:', message.id)
    
    const notification: NotificationPayload = {
      recipient_id: message.recipient_id,
      type: 'message_received',
      title: 'New Message',
      message: `${message.sender.display_name}: ${message.content.substring(0, 50)}${message.content.length > 50 ? '...' : ''}`,
      avatar_url: message.sender.profile_image_url,
      action_url: `/messages/${message.conversation_id}`,
      action_data: {
        message_id: message.id,
        conversation_id: message.conversation_id,
        sender_name: message.sender.display_name
      },
      sender_id: message.sender_id
    }

    await this.send(notification)
    console.log(`✅ Sent message notification`)
  }

  // User Management
  async getUserNotifications(userId: string, filters?: NotificationFilters): Promise<Notification[]> {
    return await this.notificationRepository.findByRecipient(userId, filters)
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.getUnreadCount(userId)
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    // Verify the notification belongs to the user (security check)
    const notification = await this.notificationRepository.findById(notificationId)
    if (!notification || notification.recipient_id !== userId) {
      throw new Error('Notification not found or access denied')
    }

    await this.notificationRepository.markAsRead(notificationId)
  }

  // Scheduled Notifications Processing
  async processScheduledNotifications(): Promise<number> {
    console.log('⏰ Processing scheduled notifications...')
    
    // This would typically be called by a cron job or background worker
    // For now, we'll return 0 as this requires more complex scheduling logic
    return 0
  }

  async sendDigestEmails(frequency: 'hourly' | 'daily' | 'weekly'): Promise<number> {
    console.log(`📧 Processing ${frequency} digest emails...`)
    
    // Get users who want digest emails at this frequency
    const userIds = await this.preferencesRepository.getUsersForDigest(frequency)
    
    // This would integrate with an email service
    // For now, we'll return the count of users who would receive digests
    return userIds.length
  }

  // Helper Methods
  private getCategoryFromType(type: NotificationType): NotificationCategory {
    const categoryMap: Record<NotificationType, NotificationCategory> = {
      // Gig events
      'gig_published': 'gig',
      'gig_expiring_soon': 'gig',
      'new_gig_match': 'gig',
      'gig_ending_soon': 'gig',
      
      // Application events
      'application_received': 'application',
      'application_withdrawn': 'application',
      'application_viewed': 'application',
      'shortlisted': 'application',
      'application_declined': 'application',
      
      // Booking events
      'talent_booked': 'booking',
      'booking_confirmed': 'booking',
      'shoot_reminder': 'booking',
      
      // Communication
      'message_received': 'message',
      
      // Growth & Engagement
      'showcase_submitted': 'system',
      'showcase_approved': 'system',
      'review_received': 'system',
      'profile_viewed': 'system',
      'new_follower': 'system',
      
      // System
      'credit_low': 'system',
      'subscription_expiring': 'system',
      'system_update': 'system',
      'account_verification': 'system'
    }

    return categoryMap[type] || 'system'
  }

  private async findMatchingTalent(gig: any): Promise<any[]> {
    // This is a simplified matching algorithm
    // In production, this would be more sophisticated with ML/AI matching
    
    // For now, return an empty array to avoid database queries we don't have yet
    // In real implementation, this would query users_profile table for:
    // - Location proximity
    // - Style preferences alignment  
    // - Skill level compatibility
    // - Availability
    // - Past performance ratings
    
    console.log(`🔍 Finding talent for gig: ${gig.title} in ${gig.location || gig.city}`)
    return []
  }
}