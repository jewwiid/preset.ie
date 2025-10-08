// Comprehensive Notification Service for Preset Platform
// Handles all types of notifications across the platform

import EmailService, { EmailRecipient } from './email.service';

export interface NotificationData {
  userId: string;
  userEmail: string;
  userName: string;
  type: NotificationType;
  data: Record<string, unknown>;
  actionUrl?: string;
}

export type NotificationType = 
  // User Onboarding & Authentication
  | 'welcome'
  | 'email_verification'
  | 'password_reset'
  | 'profile_completion_reminder'
  | 'verification_status_update'
  
  // Marketplace (Gear Rent/Sell)
  | 'listing_created'
  | 'new_offer_received'
  | 'offer_accepted'
  | 'offer_declined'
  | 'booking_confirmed'
  | 'payment_received'
  | 'return_reminder'
  | 'review_request'
  | 'dispute_notification'
  
  // Presets Marketplace
  | 'preset_purchase'
  | 'preset_download'
  | 'new_preset_available'
  | 'preset_featured'
  | 'preset_review'
  
  // Showcases & Portfolio
  | 'showcase_published'
  | 'showcase_featured'
  | 'new_follower'
  | 'showcase_like'
  | 'showcase_comment'
  | 'showcase_share'
  
  // Collaboration System
  | 'collaboration_invite'
  | 'project_update'
  | 'file_shared'
  | 'deadline_reminder'
  | 'collaboration_complete'
  
  // Gigs & Applications
  | 'gig_posted'
  | 'new_application'
  | 'application_status'
  | 'gig_deadline'
  | 'gig_completed'
  
  // Credits & Payments
  | 'credit_purchase'
  | 'low_credit_warning'
  | 'credit_expired'
  | 'payment_failed'
  | 'refund_processed'
  
  // Admin & Moderation
  | 'account_suspended'
  | 'content_flagged'
  | 'verification_required'
  | 'platform_update'
  
  // Marketing & Engagement
  | 'weekly_digest'
  | 'new_feature'
  | 'success_story'
  | 'event_invitation';

export class NotificationService {
  private static instance: NotificationService;
  private emailService: EmailService;

  constructor() {
    this.emailService = EmailService.getInstance();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Main notification dispatch method
  async sendNotification(notification: NotificationData): Promise<boolean> {
    try {
      console.log(`📧 Sending ${notification.type} notification to ${notification.userEmail}`);

      const recipient: EmailRecipient = {
        email: notification.userEmail,
        name: notification.userName
      };

      // Generate action URL if not provided
      const actionUrl = notification.actionUrl || this.generateActionUrl(notification);

      // Dispatch based on notification type
      switch (notification.type) {
        // User Onboarding & Authentication
        case 'welcome':
          return await this.emailService.sendWelcomeEmail(recipient, actionUrl);
        
        case 'email_verification':
          return await this.emailService.sendEmailVerification(recipient, notification.data.verificationUrl as string);
        
        case 'password_reset':
          return await this.emailService.sendPasswordReset(recipient, notification.data.resetUrl as string);

        // Marketplace Emails
        case 'listing_created':
          return await this.emailService.sendListingCreated(
            recipient,
            notification.data.listingTitle as string,
            actionUrl
          );
        
        case 'new_offer_received':
          return await this.emailService.sendNewOffer(
            recipient,
            notification.data.offererName as string,
            notification.data.listingTitle as string,
            notification.data.offerAmount as string,
            actionUrl
          );

        // Showcase & Portfolio
        case 'showcase_published':
          return await this.emailService.sendShowcasePublished(
            recipient,
            notification.data.showcaseTitle as string,
            actionUrl
          );

        // Collaboration
        case 'collaboration_invite':
          return await this.emailService.sendCollaborationInvite(
            recipient,
            notification.data.inviterName as string,
            notification.data.projectTitle as string,
            actionUrl
          );

        // Gigs
        case 'gig_posted':
          return await this.emailService.sendGigPosted(
            recipient,
            notification.data.gigTitle as string,
            actionUrl
          );

        // Payments
        case 'credit_purchase':
        case 'payment_received':
          return await this.emailService.sendPaymentConfirmation(
            recipient,
            notification.data.amount as string,
            notification.data.description as string,
            notification.data.transactionId as string,
            actionUrl
          );

        // Marketing
        case 'weekly_digest':
          return await this.emailService.sendWeeklyDigest(
            recipient,
            notification.data.stats as { newGigs: number; newShowcases: number; newConnections: number },
            actionUrl
          );

        case 'new_feature':
          return await this.emailService.sendFeatureAnnouncement(
            recipient,
            notification.data.featureName as string,
            notification.data.featureDescription as string,
            actionUrl
          );

        default:
          console.warn(`⚠️ Unknown notification type: ${notification.type}`);
          return false;
      }
    } catch (error) {
      console.error(`❌ Failed to send ${notification.type} notification:`, error);
      return false;
    }
  }

  // Generate appropriate action URL based on notification type
  private generateActionUrl(notification: NotificationData): string {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com';
    
    switch (notification.type) {
      case 'welcome':
      case 'profile_completion_reminder':
        return `${baseUrl}/profile/setup`;
      
      case 'listing_created':
      case 'new_offer_received':
        return `${baseUrl}/marketplace/listings/${notification.data.listingId as string}`;
      
      case 'showcase_published':
        return `${baseUrl}/showcases/${notification.data.showcaseId as string}`;
      
      case 'collaboration_invite':
        return `${baseUrl}/collaborate/projects/${notification.data.projectId as string}`;
      
      case 'gig_posted':
      case 'new_application':
        return `${baseUrl}/gigs/${notification.data.gigId as string}`;
      
      case 'credit_purchase':
      case 'payment_received':
        return `${baseUrl}/dashboard/transactions`;
      
      case 'weekly_digest':
        return `${baseUrl}/dashboard`;
      
      default:
        return `${baseUrl}/dashboard`;
    }
  }

  // ===== CONVENIENCE METHODS FOR COMMON NOTIFICATIONS =====

  // User Onboarding
  async sendWelcomeNotification(userId: string, userEmail: string, userName: string): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'welcome',
      data: {}
    });
  }

  async sendEmailVerificationNotification(
    userId: string,
    userEmail: string,
    userName: string,
    verificationUrl: string
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'email_verification',
      data: { verificationUrl }
    });
  }

  async sendPasswordResetNotification(
    userId: string,
    userEmail: string,
    userName: string,
    resetUrl: string
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'password_reset',
      data: { resetUrl }
    });
  }

  // Marketplace
  async sendListingCreatedNotification(
    userId: string,
    userEmail: string,
    userName: string,
    listingId: string,
    listingTitle: string
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'listing_created',
      data: { listingId, listingTitle }
    });
  }

  async sendNewOfferNotification(
    userId: string,
    userEmail: string,
    userName: string,
    listingId: string,
    listingTitle: string,
    offererName: string,
    offerAmount: string
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'new_offer_received',
      data: { listingId, listingTitle, offererName, offerAmount }
    });
  }

  // Showcases
  async sendShowcasePublishedNotification(
    userId: string,
    userEmail: string,
    userName: string,
    showcaseId: string,
    showcaseTitle: string
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'showcase_published',
      data: { showcaseId, showcaseTitle }
    });
  }

  // Collaboration
  async sendCollaborationInviteNotification(
    userId: string,
    userEmail: string,
    userName: string,
    projectId: string,
    projectTitle: string,
    inviterName: string
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'collaboration_invite',
      data: { projectId, projectTitle, inviterName }
    });
  }

  // Gigs
  async sendGigPostedNotification(
    userId: string,
    userEmail: string,
    userName: string,
    gigId: string,
    gigTitle: string
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'gig_posted',
      data: { gigId, gigTitle }
    });
  }

  async sendNewApplicationNotification(
    userId: string,
    userEmail: string,
    userName: string,
    gigId: string,
    gigTitle: string,
    applicantName: string
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'new_application',
      data: { gigId, gigTitle, applicantName }
    });
  }

  // Payments
  async sendPaymentConfirmationNotification(
    userId: string,
    userEmail: string,
    userName: string,
    amount: string,
    description: string,
    transactionId: string
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'payment_received',
      data: { amount, description, transactionId }
    });
  }

  // Marketing
  async sendWeeklyDigestNotification(
    userId: string,
    userEmail: string,
    userName: string,
    stats: { newGigs: number; newShowcases: number; newConnections: number }
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'weekly_digest',
      data: { stats }
    });
  }

  async sendFeatureAnnouncementNotification(
    userId: string,
    userEmail: string,
    userName: string,
    featureName: string,
    featureDescription: string
  ): Promise<boolean> {
    return await this.sendNotification({
      userId,
      userEmail,
      userName,
      type: 'new_feature',
      data: { featureName, featureDescription }
    });
  }

  // ===== BULK NOTIFICATION METHODS =====

  async sendBulkNotifications(notifications: NotificationData[]): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    // Process notifications in batches to avoid overwhelming the email service
    const batchSize = 10;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const batch = notifications.slice(i, i + batchSize);
      
      const promises = batch.map(async (notification) => {
        try {
          const result = await this.sendNotification(notification);
          return result ? 'success' : 'failed';
        } catch (error) {
          console.error(`❌ Bulk notification failed:`, error);
          return 'failed';
        }
      });

      const results = await Promise.all(promises);
      results.forEach(result => {
        if (result === 'success') success++;
        else failed++;
      });

      // Small delay between batches to be respectful to email service
      if (i + batchSize < notifications.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return { success, failed };
  }

  // Send weekly digest to all active users
  async sendWeeklyDigestToAllUsers(stats: { newGigs: number; newShowcases: number; newConnections: number }): Promise<{ success: number; failed: number }> {
    // This would typically fetch users from your database
    // For now, we'll return a placeholder
    console.log('📊 Sending weekly digest to all users with stats:', stats);
    
    // TODO: Implement user fetching from database
    // const users = await this.getActiveUsers();
    // const notifications = users.map(user => ({
    //   userId: user.id,
    //   userEmail: user.email,
    //   userName: user.name,
    //   type: 'weekly_digest' as NotificationType,
    //   data: { stats }
    // }));
    
    // return await this.sendBulkNotifications(notifications);
    
    return { success: 0, failed: 0 };
  }
}

export default NotificationService;
