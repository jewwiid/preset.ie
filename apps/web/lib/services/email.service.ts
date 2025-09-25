// Comprehensive Email Service for Preset Platform
// Handles all email notifications across the platform
// Updated to support Google Workspace Gmail API and comprehensive template system

import { google } from 'googleapis';
import { PresetEmailTemplates, EmailTemplate, EmailRecipient } from './email-templates';

// Re-export types from email-templates for backward compatibility
export type { EmailTemplate, EmailRecipient } from './email-templates';

export class EmailService {
  private static instance: EmailService;
  private gmail: any;
  private fromEmail: string;
  private fromName: string;
  private domain: string;

  constructor() {
    this.fromEmail = process.env.FROM_EMAIL || 'support@presetie.com';
    this.fromName = process.env.FROM_NAME || 'Preset Support';
    this.domain = process.env.GOOGLE_WORKSPACE_DOMAIN || 'presetie.com';
    
    // Initialize Gmail API
    this.initializeGmailAPI();
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  private initializeGmailAPI(): void {
    try {
      // Check if we have the required environment variables
      const serviceAccountEmail = process.env.GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL;
      const privateKey = process.env.GOOGLE_WORKSPACE_PRIVATE_KEY;
      const projectId = process.env.GOOGLE_WORKSPACE_PROJECT_ID;

      if (!serviceAccountEmail || !privateKey || !projectId) {
        console.warn('⚠️ Google Workspace credentials not found. Email service will run in development mode.');
        return;
      }

      // Create JWT client for service account
      const auth = new google.auth.JWT({
        email: serviceAccountEmail,
        key: privateKey.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/gmail.send']
      });

      // Initialize Gmail API
      this.gmail = google.gmail({ version: 'v1', auth });
      
      console.log('✅ Gmail API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Gmail API:', error);
    }
  }

  // Generate email templates for equipment request events
  static generateRequestResponseEmail(
    requesterName: string,
    responderName: string,
    requestTitle: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `New Response to Your Equipment Request: "${requestTitle}"`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .button { 
              display: inline-block; 
              background: #007bff; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎬 New Equipment Request Response</h1>
            </div>
            
            <div class="content">
              <p>Hi ${requesterName},</p>
              
              <p>Great news! <strong>${responderName}</strong> has responded to your equipment request:</p>
              
              <blockquote style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
                <strong>"${requestTitle}"</strong>
              </blockquote>
              
              <p>You can now view their response and start a conversation to discuss the details.</p>
              
              <a href="${actionUrl}" class="button">View Response & Respond</a>
              
              <p>This is an exciting opportunity to connect with equipment owners who can help with your project!</p>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The Preset Team</p>
              <p><small>You're receiving this because you have an active equipment request. 
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/settings/notifications">Manage your notification preferences</a></small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
New Equipment Request Response

Hi ${requesterName},

Great news! ${responderName} has responded to your equipment request: "${requestTitle}"

You can now view their response and start a conversation to discuss the details.

View Response: ${actionUrl}

This is an exciting opportunity to connect with equipment owners who can help with your project!

Best regards,
The Preset Team

You're receiving this because you have an active equipment request. 
Manage your notification preferences: ${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/settings/notifications
    `;

    return { subject, html, text };
  }

  static generateResponseAcceptedEmail(
    responderName: string,
    requesterName: string,
    requestTitle: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `Your Response Was Accepted! - "${requestTitle}"`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #d4edda; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .button { 
              display: inline-block; 
              background: #28a745; 
              color: white; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Congratulations! Your Response Was Accepted</h1>
            </div>
            
            <div class="content">
              <p>Hi ${responderName},</p>
              
              <p>Excellent news! <strong>${requesterName}</strong> has accepted your response to their equipment request:</p>
              
              <blockquote style="background: #f8f9fa; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
                <strong>"${requestTitle}"</strong>
              </blockquote>
              
              <p>You can now start a conversation to finalize the details and arrange the equipment rental or sale.</p>
              
              <a href="${actionUrl}" class="button">Start Conversation</a>
              
              <p>This is a great opportunity to help a fellow creator and earn from your equipment!</p>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The Preset Team</p>
              <p><small>You're receiving this because you responded to an equipment request. 
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/settings/notifications">Manage your notification preferences</a></small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Congratulations! Your Response Was Accepted

Hi ${responderName},

Excellent news! ${requesterName} has accepted your response to their equipment request: "${requestTitle}"

You can now start a conversation to finalize the details and arrange the equipment rental or sale.

Start Conversation: ${actionUrl}

This is a great opportunity to help a fellow creator and earn from your equipment!

Best regards,
The Preset Team

You're receiving this because you responded to an equipment request. 
Manage your notification preferences: ${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/settings/notifications
    `;

    return { subject, html, text };
  }

  static generateRequestExpiredEmail(
    userName: string,
    requestTitle: string,
    actionUrl: string
  ): EmailTemplate {
    const subject = `Equipment Request Expired: "${requestTitle}"`;
    
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { padding: 20px 0; }
            .button { 
              display: inline-block; 
              background: #ffc107; 
              color: #212529; 
              padding: 12px 24px; 
              text-decoration: none; 
              border-radius: 6px; 
              margin: 20px 0;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Equipment Request Expired</h1>
            </div>
            
            <div class="content">
              <p>Hi ${userName},</p>
              
              <p>Your equipment request has expired without being fulfilled:</p>
              
              <blockquote style="background: #f8f9fa; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0;">
                <strong>"${requestTitle}"</strong>
              </blockquote>
              
              <p>Don't worry! You can create a new request or browse available equipment listings.</p>
              
              <a href="${actionUrl}" class="button">Create New Request</a>
              
              <p>Consider adjusting your request details or expanding your search criteria for better results.</p>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The Preset Team</p>
              <p><small>You're receiving this because you had an active equipment request. 
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/settings/notifications">Manage your notification preferences</a></small></p>
            </div>
          </div>
        </body>
      </html>
    `;

    const text = `
Equipment Request Expired

Hi ${userName},

Your equipment request has expired without being fulfilled: "${requestTitle}"

Don't worry! You can create a new request or browse available equipment listings.

Create New Request: ${actionUrl}

Consider adjusting your request details or expanding your search criteria for better results.

Best regards,
The Preset Team

You're receiving this because you had an active equipment request. 
Manage your notification preferences: ${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/settings/notifications
    `;

    return { subject, html, text };
  }

  // Send email using Google Workspace Gmail API
  async sendEmail(
    to: EmailRecipient,
    template: EmailTemplate,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // If Gmail API is not initialized, log the email for development
      if (!this.gmail) {
        console.log('📧 EMAIL NOTIFICATION (Development Mode):', {
          to: to.email,
          subject: template.subject,
          from: this.fromEmail,
          metadata
        });
        return true;
      }

      // Create email message
      const message = this.createEmailMessage(to, template);
      
      // Send email via Gmail API
      const response = await this.gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message
        }
      });

      console.log('✅ Email sent successfully:', {
        messageId: response.data.id,
        to: to.email,
        subject: template.subject
      });

      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  private createEmailMessage(to: EmailRecipient, template: EmailTemplate): string {
    const boundary = 'boundary_' + Math.random().toString(36).substr(2, 9);
    
    const headers = [
      `From: ${this.fromName} <${this.fromEmail}>`,
      `To: ${to.name} <${to.email}>`,
      `Subject: ${template.subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      `Reply-To: ${this.fromEmail}`,
      `X-Mailer: Preset Platform`
    ].join('\r\n');

    const textPart = [
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      template.text
    ].join('\r\n');

    const htmlPart = [
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      template.html
    ].join('\r\n');

    const message = [
      headers,
      '',
      textPart,
      '',
      htmlPart,
      `--${boundary}--`
    ].join('\r\n');

    // Encode message in base64url format
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  // ===== COMPREHENSIVE EMAIL METHODS =====

  // User Onboarding & Authentication
  async sendWelcomeEmail(recipient: EmailRecipient, actionUrl: string): Promise<boolean> {
    const template = PresetEmailTemplates.generateWelcomeEmail(recipient.name, actionUrl);
    return await this.sendEmail(recipient, template, { type: 'welcome' });
  }

  async sendEmailVerification(recipient: EmailRecipient, verificationUrl: string): Promise<boolean> {
    const template = PresetEmailTemplates.generateEmailVerificationEmail(recipient.name, verificationUrl);
    return await this.sendEmail(recipient, template, { type: 'verification' });
  }

  async sendPasswordReset(recipient: EmailRecipient, resetUrl: string): Promise<boolean> {
    const template = PresetEmailTemplates.generatePasswordResetEmail(recipient.name, resetUrl);
    return await this.sendEmail(recipient, template, { type: 'password_reset' });
  }

  // Payment & Transaction Emails
  async sendPaymentConfirmation(
    recipient: EmailRecipient,
    amount: string,
    description: string,
    transactionId: string,
    actionUrl: string
  ): Promise<boolean> {
    const template = PresetEmailTemplates.generatePaymentConfirmationEmail(
      recipient.name,
      amount,
      description,
      transactionId,
      actionUrl
    );
    return await this.sendEmail(recipient, template, { type: 'payment_confirmation' });
  }

  // Marketplace Emails
  async sendListingCreated(recipient: EmailRecipient, listingTitle: string, actionUrl: string): Promise<boolean> {
    const template = PresetEmailTemplates.generateListingCreatedEmail(recipient.name, listingTitle, actionUrl);
    return await this.sendEmail(recipient, template, { type: 'listing_created' });
  }

  async sendNewOffer(
    recipient: EmailRecipient,
    offererName: string,
    listingTitle: string,
    offerAmount: string,
    actionUrl: string
  ): Promise<boolean> {
    const template = PresetEmailTemplates.generateNewOfferEmail(
      recipient.name,
      offererName,
      listingTitle,
      offerAmount,
      actionUrl
    );
    return await this.sendEmail(recipient, template, { type: 'new_offer' });
  }

  // Showcase & Portfolio Emails
  async sendShowcasePublished(recipient: EmailRecipient, showcaseTitle: string, actionUrl: string): Promise<boolean> {
    const template = PresetEmailTemplates.generateShowcasePublishedEmail(recipient.name, showcaseTitle, actionUrl);
    return await this.sendEmail(recipient, template, { type: 'showcase_published' });
  }

  // Collaboration Emails
  async sendCollaborationInvite(
    recipient: EmailRecipient,
    inviterName: string,
    projectTitle: string,
    actionUrl: string
  ): Promise<boolean> {
    const template = PresetEmailTemplates.generateCollaborationInviteEmail(
      recipient.name,
      inviterName,
      projectTitle,
      actionUrl
    );
    return await this.sendEmail(recipient, template, { type: 'collaboration_invite' });
  }

  // Gig Notifications
  async sendGigPosted(recipient: EmailRecipient, gigTitle: string, actionUrl: string): Promise<boolean> {
    const template = PresetEmailTemplates.generateGigPostedEmail(recipient.name, gigTitle, actionUrl);
    return await this.sendEmail(recipient, template, { type: 'gig_posted' });
  }

  // Marketing & Engagement Emails
  async sendWeeklyDigest(
    recipient: EmailRecipient,
    stats: { newGigs: number; newShowcases: number; newConnections: number },
    actionUrl: string
  ): Promise<boolean> {
    const template = PresetEmailTemplates.generateWeeklyDigestEmail(recipient.name, stats, actionUrl);
    return await this.sendEmail(recipient, template, { type: 'weekly_digest' });
  }

  async sendFeatureAnnouncement(
    recipient: EmailRecipient,
    featureName: string,
    featureDescription: string,
    actionUrl: string
  ): Promise<boolean> {
    const template = PresetEmailTemplates.generateFeatureAnnouncementEmail(
      recipient.name,
      featureName,
      featureDescription,
      actionUrl
    );
    return await this.sendEmail(recipient, template, { type: 'feature_announcement' });
  }

  // ===== LEGACY EQUIPMENT REQUEST METHODS (Backward Compatibility) =====

  // Send equipment request notification email
  async sendRequestNotification(
    notificationType: 'request_response_received' | 'response_accepted' | 'request_expired',
    recipient: EmailRecipient,
    data: {
      requesterName: string;
      responderName?: string;
      requestTitle: string;
      actionUrl: string;
    }
  ): Promise<boolean> {
    let template: EmailTemplate;

    switch (notificationType) {
      case 'request_response_received':
        template = EmailService.generateRequestResponseEmail(
          data.requesterName,
          data.responderName || 'Someone',
          data.requestTitle,
          data.actionUrl
        );
        break;
      case 'response_accepted':
        template = EmailService.generateResponseAcceptedEmail(
          recipient.name,
          data.requesterName,
          data.requestTitle,
          data.actionUrl
        );
        break;
      case 'request_expired':
        template = EmailService.generateRequestExpiredEmail(
          recipient.name,
          data.requestTitle,
          data.actionUrl
        );
        break;
      default:
        throw new Error(`Unknown notification type: ${notificationType}`);
    }

    return await this.sendEmail(recipient, template, {
      notificationType,
      requestTitle: data.requestTitle
    });
  }
}

export default EmailService;
