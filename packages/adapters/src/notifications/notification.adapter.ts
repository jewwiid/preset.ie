import { NotificationService } from '@preset/application';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../database/database.types';

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, any>;
  badge?: number;
  sound?: string;
}

export class SupabaseNotificationService implements NotificationService {
  private emailTemplates: Map<string, (data: any) => EmailTemplate> = new Map();

  constructor(
    private readonly supabase: SupabaseClient<Database>,
    private readonly resendApiKey?: string
  ) {
    this.initializeTemplates();
  }

  async sendEmail(
    to: string,
    templateId: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      const template = this.emailTemplates.get(templateId);
      if (!template) {
        throw new Error(`Email template ${templateId} not found`);
      }

      const { subject, html, text } = template(data);

      if (this.resendApiKey) {
        // Use Resend for production emails
        await this.sendViaResend(to, subject, html, text);
      } else {
        // Fallback to Supabase Edge Function
        await this.sendViaEdgeFunction(to, subject, html, text);
      }

      // Log notification in database
      await this.logNotification({
        userId: data.userId,
        type: 'email',
        templateId,
        recipient: to,
        data,
        status: 'sent',
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async sendPush(
    userId: string,
    notification: PushNotificationPayload
  ): Promise<void> {
    try {
      // Get user's push tokens
      const { data: tokens, error } = await this.supabase
        .from('push_tokens')
        .select('token, platform')
        .eq('user_id', userId)
        .eq('active', true);

      if (error) {
        throw error;
      }

      if (!tokens || tokens.length === 0) {
        console.log(`No active push tokens for user ${userId}`);
        return;
      }

      // Send to all user's devices
      const promises = tokens.map(token => 
        this.sendPushToDevice(token.token, token.platform, notification)
      );

      await Promise.all(promises);

      // Store notification in database
      await this.supabase.from('notifications').insert({
        user_id: userId,
        type: 'push',
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }

  async sendInApp(
    userId: string,
    notification: {
      type: string;
      title: string;
      body: string;
      data?: Record<string, any>;
    }
  ): Promise<void> {
    try {
      const { error } = await this.supabase.from('notifications').insert({
        user_id: userId,
        type: notification.type,
        title: notification.title,
        body: notification.body,
        data: notification.data,
      });

      if (error) {
        throw error;
      }

      // Trigger realtime update for connected clients
      await this.supabase.channel(`notifications:${userId}`).send({
        type: 'broadcast',
        event: 'new_notification',
        payload: notification,
      });
    } catch (error) {
      console.error('Failed to send in-app notification:', error);
      throw error;
    }
  }

  async sendBulk(
    recipients: Array<{
      userId: string;
      email?: string;
      templateId: string;
      data: Record<string, any>;
    }>
  ): Promise<void> {
    const promises = recipients.map(async recipient => {
      if (recipient.email) {
        await this.sendEmail(recipient.email, recipient.templateId, {
          ...recipient.data,
          userId: recipient.userId,
        });
      }
      
      // Also send in-app notification
      const template = this.emailTemplates.get(recipient.templateId);
      if (template) {
        const { subject } = template(recipient.data);
        await this.sendInApp(recipient.userId, {
          type: recipient.templateId,
          title: subject,
          body: '', // Body is in the template
          data: recipient.data,
        });
      }
    });

    await Promise.all(promises);
  }

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await this.supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId);

    if (error) {
      throw error;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    const { count, error } = await this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      throw error;
    }

    return count || 0;
  }

  private async sendViaResend(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Preset <noreply@preset.ie>',
        to,
        subject,
        html,
        text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Resend API error: ${response.statusText}`);
    }
  }

  private async sendViaEdgeFunction(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<void> {
    const { error } = await this.supabase.functions.invoke('send-email', {
      body: {
        to,
        subject,
        html,
        text,
      },
    });

    if (error) {
      throw error;
    }
  }

  private async sendPushToDevice(
    token: string,
    platform: 'ios' | 'android' | 'web',
    notification: PushNotificationPayload
  ): Promise<void> {
    // This would integrate with Firebase Cloud Messaging or similar
    // For now, we'll use an Edge Function
    const { error } = await this.supabase.functions.invoke('send-push', {
      body: {
        token,
        platform,
        notification,
      },
    });

    if (error) {
      console.error(`Failed to send push to ${platform} device:`, error);
    }
  }

  private async logNotification(log: {
    userId: string;
    type: string;
    templateId: string;
    recipient: string;
    data: Record<string, any>;
    status: string;
  }): Promise<void> {
    // Log to a notification_logs table for audit
    console.log('Notification sent:', log);
  }

  private initializeTemplates(): void {
    // Welcome email
    this.emailTemplates.set('welcome', (data) => ({
      subject: `Welcome to Preset, ${data.name}!`,
      html: `
        <h1>Welcome to Preset!</h1>
        <p>Hi ${data.name},</p>
        <p>We're excited to have you join our creative community.</p>
        <p>Get started by:</p>
        <ul>
          <li>Completing your profile</li>
          <li>Browsing available gigs</li>
          <li>Creating your first showcase</li>
        </ul>
        <a href="${data.ctaUrl}" style="background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Get Started</a>
      `,
      text: `Welcome to Preset, ${data.name}! Get started at ${data.ctaUrl}`,
    }));

    // Application received
    this.emailTemplates.set('application-received', (data) => ({
      subject: `New application for "${data.gigTitle}"`,
      html: `
        <h2>You have a new application!</h2>
        <p>${data.applicantName} has applied to your gig "${data.gigTitle}".</p>
        <p>Rating: ${data.applicantRating || 'New member'}</p>
        <p>Message: ${data.message || 'No message provided'}</p>
        <a href="${data.reviewUrl}" style="background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Review Application</a>
      `,
    }));

    // Application status update
    this.emailTemplates.set('application-status', (data) => ({
      subject: `Your application for "${data.gigTitle}" has been ${data.status}`,
      html: `
        <h2>Application Update</h2>
        <p>Your application for "${data.gigTitle}" has been ${data.status}.</p>
        ${data.status === 'accepted' ? `
          <p>Congratulations! The contributor would like to work with you.</p>
          <p>Next steps:</p>
          <ul>
            <li>Message the contributor to confirm details</li>
            <li>Review the gig requirements</li>
            <li>Prepare for the shoot</li>
          </ul>
          <a href="${data.gigUrl}" style="background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Gig Details</a>
        ` : `
          <p>Don't be discouraged! There are many other opportunities waiting for you.</p>
          <a href="${data.browseUrl}" style="background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Browse More Gigs</a>
        `}
      `,
    }));

    // Showcase approval request
    this.emailTemplates.set('showcase-approval', (data) => ({
      subject: `Approve showcase from "${data.gigTitle}"`,
      html: `
        <h2>Showcase Approval Required</h2>
        <p>${data.creatorName} has created a showcase from your collaboration on "${data.gigTitle}".</p>
        <p>Please review and approve the showcase to make it public.</p>
        <a href="${data.approveUrl}" style="background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Review Showcase</a>
      `,
    }));

    // Review request
    this.emailTemplates.set('review-request', (data) => ({
      subject: `How was your experience with ${data.otherUserName}?`,
      html: `
        <h2>Leave a Review</h2>
        <p>You recently completed a gig with ${data.otherUserName}.</p>
        <p>Your feedback helps build trust in our community.</p>
        <a href="${data.reviewUrl}" style="background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Write Review</a>
      `,
    }));

    // Subscription expiring
    this.emailTemplates.set('subscription-expiring', (data) => ({
      subject: 'Your Preset subscription is expiring soon',
      html: `
        <h2>Subscription Expiring</h2>
        <p>Your ${data.tier} subscription will expire on ${data.expiryDate}.</p>
        <p>Don't lose access to:</p>
        <ul>
          <li>${data.features.join('</li><li>')}</li>
        </ul>
        <a href="${data.renewUrl}" style="background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">Renew Subscription</a>
      `,
    }));

    // New message
    this.emailTemplates.set('new-message', (data) => ({
      subject: `New message from ${data.senderName}`,
      html: `
        <h2>New Message</h2>
        <p>You have a new message from ${data.senderName} regarding "${data.gigTitle}".</p>
        <blockquote style="border-left: 3px solid #00876f; padding-left: 12px; margin: 20px 0;">
          ${data.messagePreview}
        </blockquote>
        <a href="${data.messageUrl}" style="background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Message</a>
      `,
    }));

    // Gig reminder
    this.emailTemplates.set('gig-reminder', (data) => ({
      subject: `Reminder: "${data.gigTitle}" is tomorrow`,
      html: `
        <h2>Gig Reminder</h2>
        <p>This is a reminder that "${data.gigTitle}" is scheduled for tomorrow.</p>
        <p><strong>Time:</strong> ${data.time}</p>
        <p><strong>Location:</strong> ${data.location}</p>
        <p><strong>With:</strong> ${data.otherUsers.join(', ')}</p>
        <a href="${data.gigUrl}" style="background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Gig Details</a>
      `,
    }));
  }
}