/**
 * Plunk Email Marketing Service
 * Provides email automation, event tracking, and transactional email capabilities
 * @see https://docs.useplunk.com
 */

export interface PlunkContact {
  id?: string;
  email: string;
  subscribed?: boolean;
  data?: Record<string, any>;
}

export interface PlunkEvent {
  event: string;
  email: string;
  subscribed?: boolean;
  data?: Record<string, any>;
}

export interface PlunkEventResponse {
  success: boolean;
  contact: string;
  event: string;
  timestamp: string;
}

export interface PlunkEmailOptions {
  to: string;
  subject: string;
  body: string;
  subscribed?: boolean;
  name?: string;
  from?: string;
  replyTo?: string;
  headers?: Record<string, string>;
}

export interface PlunkCampaignOptions {
  name: string;
  subject: string;
  body: string;
  from: string;
  replyTo?: string;
  style?: 'ORIGINAL' | 'PLAIN';
}

export class PlunkService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.useplunk.com/v1';

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Plunk API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Track an event for email automation
   * Events can trigger automated email sequences
   */
  async trackEvent(options: PlunkEvent): Promise<PlunkEventResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: options.event,
          email: options.email,
          subscribed: options.subscribed ?? true,
          data: options.data || {},
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to track Plunk event:', error);
      throw error;
    }
  }

  /**
   * Send a transactional email
   * Perfect for order confirmations, notifications, password resets, etc.
   */
  async sendTransactionalEmail(options: PlunkEmailOptions): Promise<{ success: boolean; emails: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          body: options.body,
          subscribed: options.subscribed ?? true,
          name: options.name,
          from: options.from,
          reply_to: options.replyTo,
          headers: options.headers,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send transactional email:', error);
      throw error;
    }
  }

  /**
   * Create or update a contact
   * Contacts can have custom metadata attached for personalization
   */
  async upsertContact(contact: PlunkContact): Promise<{ success: boolean; contact: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: contact.email,
          subscribed: contact.subscribed ?? true,
          data: contact.data || {},
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to upsert contact:', error);
      throw error;
    }
  }

  /**
   * Subscribe a contact to email marketing
   */
  async subscribeContact(email: string, data?: Record<string, any>): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts/${encodeURIComponent(email)}/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: data || {} }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to subscribe contact:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe a contact from email marketing
   */
  async unsubscribeContact(email: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts/${encodeURIComponent(email)}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to unsubscribe contact:', error);
      throw error;
    }
  }

  /**
   * Get contact by email
   */
  async getContact(email: string): Promise<{ success: boolean; contact: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts/${encodeURIComponent(email)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get contact:', error);
      throw error;
    }
  }

  /**
   * Delete a contact
   */
  async deleteContact(email: string): Promise<{ success: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/contacts/${encodeURIComponent(email)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      throw error;
    }
  }

  /**
   * Create a campaign
   */
  async createCampaign(options: PlunkCampaignOptions): Promise<{ success: boolean; campaign: any }> {
    try {
      const response = await fetch(`${this.baseUrl}/campaigns`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: options.name,
          subject: options.subject,
          body: options.body,
          from: options.from,
          reply_to: options.replyTo,
          style: options.style || 'ORIGINAL',
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to create campaign:', error);
      throw error;
    }
  }

  // Helper methods for common use cases

  /**
   * Track user signup and optionally subscribe them
   */
  async trackUserSignup(email: string, userData?: Record<string, any>): Promise<PlunkEventResponse> {
    return this.trackEvent({
      event: 'user.signup',
      email,
      subscribed: true,
      data: userData,
    });
  }

  /**
   * Track purchase event
   */
  async trackPurchase(email: string, purchaseData: Record<string, any>): Promise<PlunkEventResponse> {
    return this.trackEvent({
      event: 'purchase.completed',
      email,
      data: purchaseData,
    });
  }

  /**
   * Track preset generation
   */
  async trackPresetGenerated(email: string, presetData: Record<string, any>): Promise<PlunkEventResponse> {
    return this.trackEvent({
      event: 'preset.generated',
      email,
      data: presetData,
    });
  }

  /**
   * Send welcome email
   */
  async sendWelcomeEmail(to: string, name?: string): Promise<{ success: boolean; emails: any[] }> {
    return this.sendTransactionalEmail({
      to,
      subject: 'Welcome to Preset! 🎬 Let\'s get you started',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, sans-serif; color: #0f172a; background: #fafdfc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
            .header { background: #00876f; padding: 40px; text-align: center; }
            .logo { color: #ffffff; font-size: 32px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .button { display: inline-block; padding: 14px 28px; background: #00876f; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { background: #fafdfc; padding: 30px; text-align: center; color: #475569; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Preset</div>
              <p style="color: #ccfbef; margin: 5px 0 0 0;">Creative Collaboration Platform</p>
            </div>
            <div class="content">
              <h1>Welcome to Preset, ${name || 'Creative'}! 🎬</h1>
              <p>We're thrilled to have you join our creative community.</p>
              <p>Start connecting with amazing creatives and build your portfolio today!</p>
              <a href="https://presetie.com/dashboard" class="button">Get Started</a>
              <p>Need help? Check out our <a href="https://presetie.com/help" style="color: #00876f;">guides and tutorials</a>.</p>
            </div>
            <div class="footer">
              <p><strong>Presetie.com</strong> - Where Creatives Connect</p>
              <p>© 2025 Presetie.com. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      name,
    });
  }

  /**
   * Send credit purchase confirmation
   */
  async sendCreditPurchaseEmail(
    to: string,
    credits: number,
    amount: number,
    name?: string
  ): Promise<{ success: boolean; emails: any[] }> {
    return this.sendTransactionalEmail({
      to,
      subject: 'Credit Purchase Confirmed! 💳',
      body: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: -apple-system, sans-serif; color: #0f172a; background: #fafdfc; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; }
            .header { background: #00876f; padding: 40px; text-align: center; }
            .logo { color: #ffffff; font-size: 32px; font-weight: 600; }
            .content { padding: 40px 30px; }
            .credits-banner { background: #00876f; padding: 40px; border-radius: 12px; color: #ffffff; text-align: center; margin: 30px 0; }
            .credits-banner h2 { color: #ffffff; font-size: 48px; margin: 0; }
            .button { display: inline-block; padding: 14px 28px; background: #00876f; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; }
            .footer { background: #fafdfc; padding: 30px; text-align: center; color: #475569; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">Preset</div>
            </div>
            <div class="content">
              <h1>Credit Purchase Confirmed! 💳</h1>
              <p>Your credits have been added to your account.</p>
              <div class="credits-banner">
                <h2>${credits}</h2>
                <p style="color: #ccfbef; margin: 10px 0 0 0;">Credits Added</p>
              </div>
              <p>Amount paid: <strong>$${(amount / 100).toFixed(2)}</strong></p>
              <a href="https://presetie.com/playground" class="button">Start Creating</a>
            </div>
            <div class="footer">
              <p><strong>Presetie.com</strong> - Where Creatives Connect</p>
              <p>© 2025 Presetie.com. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      name,
    });
  }
}

// Singleton instance
let plunkServiceInstance: PlunkService | null = null;

export function getPlunkService(): PlunkService {
  if (!plunkServiceInstance) {
    const apiKey = process.env.PLUNK_API_KEY;
    if (!apiKey) {
      throw new Error('PLUNK_API_KEY environment variable is not set');
    }
    plunkServiceInstance = new PlunkService(apiKey);
  }
  return plunkServiceInstance;
}

