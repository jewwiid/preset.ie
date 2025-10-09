/**
 * Onboarding Email Events
 * Welcome, verification, password reset, profile completion
 * 
 * NOTE: Onboarding emails are CRITICAL and always sent (cannot be disabled)
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

export class OnboardingEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * CRITICAL EMAIL - Always sent regardless of preferences
   */
  async sendWelcomeEmail(authUserId: string, email: string, name: string, role: string) {
    const roleDescriptions = {
      CONTRIBUTOR: 'You can create gigs, find talent, and build your portfolio',
      TALENT: 'You can apply to gigs, collaborate with photographers, and showcase your work',
      BOTH: 'You have full access to create gigs and apply as talent'
    };

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Welcome to Preset',
      body: templates.getWelcomeEmailTemplate(
        name, 
        role, 
        roleDescriptions[role as keyof typeof roleDescriptions],
        email,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'email.welcome.sent',
      email,
      data: { name, role, authUserId }
    });
  }

  /**
   * CRITICAL EMAIL - Always sent regardless of preferences (security)
   */
  async sendEmailVerification(authUserId: string, email: string, verificationUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Verify your Preset account',
      body: templates.getEmailVerificationTemplate(verificationUrl, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'email.verification.sent',
      email,
      data: { sentAt: new Date().toISOString(), authUserId }
    });
  }

  /**
   * CRITICAL EMAIL - Always sent regardless of preferences (security)
   */
  async sendPasswordReset(authUserId: string, email: string, resetUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Reset your Preset password',
      body: templates.getPasswordResetTemplate(resetUrl, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'password.reset.sent',
      email,
      data: { sentAt: new Date().toISOString(), authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects user preferences
   */
  async sendProfileCompletionReminder(authUserId: string, email: string, name: string, completionPercentage: number) {
    // Check if user wants system notifications
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'system');
    
    if (!shouldSend) {
      console.log(`Profile completion reminder skipped for user ${authUserId} (opted out of system emails)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Complete your Preset profile',
      body: templates.getProfileCompletionTemplate(name, completionPercentage, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'profile.completion.reminder',
      email,
      data: { completionPercentage, authUserId }
    });
  }
}
