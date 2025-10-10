/**
 * Email Service Wrapper
 * Provides a unified interface for sending emails using Plunk
 * Can be used in server-side code (API routes, server actions)
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

export class EmailService {
  private plunk = getPlunkService();

  /**
   * Send welcome email to new users
   */
  async sendWelcomeEmail(email: string, name: string): Promise<void> {
    await this.plunk.sendWelcomeEmail(email, name);
    
    // Track the event for analytics
    await this.plunk.trackEvent({
      event: 'email.welcome.sent',
      email,
      data: { name }
    });
  }

  /**
   * Send credit purchase confirmation
   */
  async sendCreditPurchaseConfirmation(
    email: string,
    credits: number,
    amount: number,
    name?: string
  ): Promise<void> {
    await this.plunk.sendCreditPurchaseEmail(email, credits, amount, name);
    
    // Track purchase event
    await this.plunk.trackPurchase(email, {
      credits,
      amount,
      currency: 'USD',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send preset generation notification
   */
  async sendPresetGeneratedEmail(
    email: string,
    presetName: string,
    presetUrl: string,
    name?: string
  ): Promise<void> {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Your preset "${presetName}" is ready! 🎨`,
      body: `
        <h1>Your Preset is Ready!</h1>
        <p>Hi ${name || 'there'},</p>
        <p>Your preset <strong>${presetName}</strong> has been generated successfully.</p>
        <p><a href="${presetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Your Preset</a></p>
        <p>Happy creating!</p>
      `,
      name,
    });

    // Track the event
    await this.plunk.trackPresetGenerated(email, {
      presetName,
      presetUrl,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Send collaboration invitation
   */
  async sendCollaborationInvite(
    email: string,
    inviterName: string,
    projectName: string,
    inviteUrl: string
  ): Promise<void> {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `${inviterName} invited you to collaborate on "${projectName}"`,
      body: `
        <h1>You've been invited to collaborate!</h1>
        <p><strong>${inviterName}</strong> has invited you to join their project: <strong>${projectName}</strong></p>
        <p><a href="${inviteUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a></p>
        <p>Join the collaboration and start creating together!</p>
      `,
    });

    // Track collaboration invite
    await this.plunk.trackEvent({
      event: 'collaboration.invited',
      email,
      data: {
        inviterName,
        projectName,
        inviteUrl,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Send gig invitation
   */
  async sendGigInvitation(
    email: string,
    gigTitle: string,
    inviterName: string,
    gigUrl: string,
    name?: string
  ): Promise<void> {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `You've been invited to a gig: ${gigTitle}`,
      body: `
        <h1>New Gig Invitation</h1>
        <p>Hi ${name || 'there'},</p>
        <p><strong>${inviterName}</strong> has invited you to join their gig: <strong>${gigTitle}</strong></p>
        <p><a href="${gigUrl}" style="display: inline-block; padding: 12px 24px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">View Gig Details</a></p>
        <p>Check out the details and apply if you're interested!</p>
      `,
      name,
    });

    // Track gig invitation
    await this.plunk.trackEvent({
      event: 'gig.invited',
      email,
      data: {
        gigTitle,
        inviterName,
        gigUrl,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Track user signup
   */
  async trackUserSignup(email: string, userData: Record<string, any>): Promise<void> {
    await this.plunk.trackUserSignup(email, userData);
  }

  /**
   * Subscribe user to newsletter
   */
  async subscribeToNewsletter(email: string, metadata?: Record<string, any>): Promise<void> {
    await this.plunk.subscribeContact(email, {
      source: 'newsletter',
      subscribedAt: new Date().toISOString(),
      ...metadata
    });
  }

  /**
   * Unsubscribe user from marketing emails
   */
  async unsubscribeFromMarketing(email: string): Promise<void> {
    await this.plunk.unsubscribeContact(email);
  }
}

// Singleton instance
let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
  if (!emailServiceInstance) {
    emailServiceInstance = new EmailService();
  }
  return emailServiceInstance;
}

