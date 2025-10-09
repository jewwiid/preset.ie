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
      subject: 'Welcome to Preset! 🎨',
      body: `
        <h1>Welcome ${name ? name : 'to Preset'}!</h1>
        <p>We're excited to have you on board. Start creating amazing presets today!</p>
        <p>Need help getting started? Check out our guides and tutorials.</p>
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
      subject: 'Credit Purchase Confirmation',
      body: `
        <h1>Thank you for your purchase!</h1>
        <p>You've successfully purchased ${credits} credits for $${(amount / 100).toFixed(2)}.</p>
        <p>Your credits are now available in your account.</p>
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

