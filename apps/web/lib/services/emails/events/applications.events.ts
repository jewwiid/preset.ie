/**
 * Application Email Events
 * Submitted, shortlisted, accepted, declined, limits
 * 
 * NOTE: Booking confirmations are CRITICAL, others are optional
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

interface GigDetails {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  compType: string;
}

export class ApplicationEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * OPTIONAL EMAIL - Respects application notification preferences
   */
  async sendApplicationSubmittedConfirmation(
    authUserId: string,
    email: string,
    gigTitle: string,
    contributorName: string,
    gigUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'application');
    if (!shouldSend) {
      console.log(`Application confirmation skipped for user ${authUserId}`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Application sent to ${contributorName}`,
      body: templates.getApplicationSubmittedTemplate(gigTitle, contributorName, gigUrl, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'application.submitted',
      email,
      data: { gigTitle, contributorName, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects application notification preferences
   */
  async sendApplicationShortlisted(
    authUserId: string,
    email: string,
    gigTitle: string,
    contributorName: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'application');
    if (!shouldSend) return;

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'You have been shortlisted',
      body: templates.getApplicationShortlistedTemplate(gigTitle, contributorName, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'application.shortlisted',
      email,
      data: { gigTitle, contributorName, authUserId }
    });
  }

  /**
   * CRITICAL EMAIL - Booking confirmation (always sent)
   * This is a contractual/transactional email
   */
  async sendApplicationAccepted(
    authUserId: string,
    email: string,
    name: string,
    gigDetails: GigDetails,
    contributorName: string
  ) {
    // ALWAYS SEND - This is a booking confirmation (legal requirement)
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Congratulations! You are booked for "${gigDetails.title}"`,
      body: templates.getTalentBookingTemplate(name, gigDetails, contributorName, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'application.accepted',
      email,
      data: { gigTitle: gigDetails.title, contributorName, authUserId, critical: true }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects application notification preferences
   */
  async sendApplicationDeclined(
    authUserId: string,
    email: string,
    gigTitle: string,
    recommendedGigs: Array<{ id: string; title: string; url: string }>
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'application');
    if (!shouldSend) return;

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Update on your application',
      body: templates.getApplicationDeclinedTemplate(gigTitle, recommendedGigs, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'application.declined',
      email,
      data: { gigTitle, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects application notification preferences
   */
  async sendApplicationLimitWarning(
    authUserId: string,
    email: string,
    currentCount: number,
    limit: number,
    tier: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'application');
    if (!shouldSend) return;

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Application limit approaching',
      body: templates.getApplicationLimitWarningTemplate(currentCount, limit, tier, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'application.limit.approaching',
      email,
      data: { currentCount, limit, tier, authUserId }
    });
  }

  /**
   * IMPORTANT EMAIL - Limit reached (send even if preferences disabled)
   * User needs to know they can't apply more
   */
  async sendApplicationLimitReached(authUserId: string, email: string, tier: string, resetDate: string) {
    // ALWAYS SEND - Important account limitation notification
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Monthly application limit reached',
      body: templates.getApplicationLimitReachedTemplate(tier, resetDate, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'application.limit.reached',
      email,
      data: { tier, resetDate, authUserId, critical: true }
    });
  }
}
