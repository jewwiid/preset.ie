/**
 * Review Email Events
 * Review requests, received reviews, reminders
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

export class ReviewEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * OPTIONAL EMAIL - Respects booking notification preferences
   */
  async sendReviewRequest(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    collaboratorName: string,
    gigTitle: string,
    reviewUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'booking');
    
    if (!shouldSend) {
      console.log(`Review request skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `How was your experience with ${collaboratorName}?`,
      body: templates.getReviewRequestTemplate(
        recipientName,
        collaboratorName,
        gigTitle,
        reviewUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'review.request.sent',
      email: recipientEmail,
      data: { collaboratorName, gigTitle, authUserId }
    });
  }

  /**
   * IMPORTANT EMAIL - Review received (always sent)
   * Users should always know when they receive a review
   */
  async sendReviewReceived(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    reviewerName: string,
    rating: number,
    gigTitle: string,
    reviewText: string,
    profileUrl: string
  ) {
    // ALWAYS SEND - Users should always know about reviews
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${reviewerName} left you a ${rating}-star review`,
      body: templates.getReviewReceivedTemplate(
        recipientName,
        reviewerName,
        rating,
        gigTitle,
        reviewText,
        profileUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'review.received',
      email: recipientEmail,
      data: { reviewerName, rating, gigTitle, authUserId, critical: true }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects booking notification preferences
   */
  async sendReviewReminder(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    collaboratorName: string,
    gigTitle: string,
    daysAgo: number,
    reviewUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'booking');
    
    if (!shouldSend) {
      console.log(`Review reminder skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Don't forget to review ${collaboratorName}`,
      body: templates.getReviewReminderTemplate(
        recipientName,
        collaboratorName,
        gigTitle,
        daysAgo,
        reviewUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'review.reminder.sent',
      email: recipientEmail,
      data: { collaboratorName, gigTitle, daysAgo, authUserId }
    });
  }
}

