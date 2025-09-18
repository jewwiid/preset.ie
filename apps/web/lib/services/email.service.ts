// Email Service for Equipment Request Notifications
// This service handles sending email notifications for equipment request events

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export interface EmailRecipient {
  email: string;
  name: string;
}

export class EmailService {
  private static instance: EmailService;
  private apiKey: string;
  private fromEmail: string;

  constructor() {
    this.apiKey = process.env.EMAIL_API_KEY || '';
    this.fromEmail = process.env.FROM_EMAIL || 'noreply@preset.ie';
  }

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
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
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">Manage your notification preferences</a></small></p>
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
Manage your notification preferences: ${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications
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
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">Manage your notification preferences</a></small></p>
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
Manage your notification preferences: ${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications
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
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications">Manage your notification preferences</a></small></p>
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
Manage your notification preferences: ${process.env.NEXT_PUBLIC_APP_URL}/settings/notifications
    `;

    return { subject, html, text };
  }

  // Send email using external service (SendGrid, AWS SES, etc.)
  async sendEmail(
    to: EmailRecipient,
    template: EmailTemplate,
    metadata?: Record<string, any>
  ): Promise<boolean> {
    try {
      // TODO: Integrate with actual email service
      // For now, we'll just log the email that would be sent
      console.log('📧 EMAIL NOTIFICATION:', {
        to: to.email,
        subject: template.subject,
        metadata
      });

      // In production, you would use a service like:
      // - SendGrid: https://sendgrid.com/
      // - AWS SES: https://aws.amazon.com/ses/
      // - Resend: https://resend.com/
      // - Mailgun: https://www.mailgun.com/

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

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
