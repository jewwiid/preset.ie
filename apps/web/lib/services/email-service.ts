import { Plunk } from '@plunk/node';

export interface EmailTemplate {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailService {
  private plunk: Plunk;
  private isDevelopment: boolean;

  constructor() {
    this.plunk = new Plunk(process.env.PLUNK_API_KEY!);
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  async sendEmail(template: EmailTemplate): Promise<void> {
    try {
      if (this.isDevelopment) {
        // In development, log the email instead of sending
        console.log('📧 Email would be sent:', {
          to: template.to,
          subject: template.subject,
          preview: template.text.substring(0, 100) + '...'
        });
        return;
      }

      await this.plunk.emails.send({
        to: template.to,
        subject: template.subject,
        body: template.html,
        // Use your brand colors and styling
        reply_to: 'hello@preset.ie',
        from_name: 'Preset',
        from_email: 'noreply@preset.ie',
        // Track opens and clicks
        track_opens: true,
        track_clicks: true,
        // Add unsubscribe link
        unsubscribe_url: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`,
      });

      console.log(`✅ Email sent successfully to ${template.to}`);
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      throw new Error(`Failed to send email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async sendBulkEmails(templates: EmailTemplate[]): Promise<void> {
    try {
      if (this.isDevelopment) {
        console.log(`📧 ${templates.length} emails would be sent in bulk`);
        return;
      }

      const emails = templates.map(template => ({
        to: template.to,
        subject: template.subject,
        body: template.html,
        reply_to: 'hello@preset.ie',
        from_name: 'Preset',
        from_email: 'noreply@preset.ie',
        track_opens: true,
        track_clicks: true,
        unsubscribe_url: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe`,
      }));

      await this.plunk.emails.sendBulk(emails);
      console.log(`✅ ${templates.length} emails sent successfully`);
    } catch (error) {
      console.error('❌ Failed to send bulk emails:', error);
      throw new Error(`Failed to send bulk emails: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Test email functionality
  async sendTestEmail(to: string): Promise<void> {
    const testTemplate: EmailTemplate = {
      to,
      subject: '🧪 Preset Email Test',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Test</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .button { display: inline-block; background: #00876f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🧪 Email Test Successful!</h1>
              <p>Your Plunk integration is working perfectly</p>
            </div>
            
            <div class="content">
              <h2>Hello from Preset!</h2>
              <p>This is a test email to verify that your email service is working correctly.</p>
              <p>If you're receiving this email, it means:</p>
              <ul>
                <li>✅ Plunk is properly configured</li>
                <li>✅ Email templates are working</li>
                <li>✅ Brand colors are applied</li>
                <li>✅ Ready for production use</li>
              </ul>
              
              <div style="text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">Visit Preset</a>
              </div>
            </div>
            
            <div class="footer">
              <p>Best regards,<br>The Preset Team</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">Visit Preset</a></p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        🧪 Email Test Successful!
        
        Hello from Preset!
        
        This is a test email to verify that your email service is working correctly.
        
        If you're receiving this email, it means:
        ✅ Plunk is properly configured
        ✅ Email templates are working
        ✅ Brand colors are applied
        ✅ Ready for production use
        
        Visit Preset: ${process.env.NEXT_PUBLIC_APP_URL}
        
        Best regards,
        The Preset Team
      `
    };

    await this.sendEmail(testTemplate);
  }
}

// Export singleton instance
export const emailService = new EmailService();