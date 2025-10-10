/**
 * Showcase Email Events
 * Approvals, publishing, featuring
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

export class ShowcaseEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * IMPORTANT EMAIL - Showcase approval request (sent even if preferences disabled)
   * Collaborator needs to approve before showcase goes live
   */
  async sendShowcaseApprovalRequest(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    collaboratorName: string,
    gigTitle: string,
    showcaseUrl: string
  ) {
    // ALWAYS SEND - Important collaboration action needed
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${collaboratorName} wants to publish your collaboration`,
      body: templates.getShowcaseApprovalRequestTemplate(
        recipientName,
        collaboratorName,
        gigTitle,
        showcaseUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'showcase.approval.requested',
      email: recipientEmail,
      data: { collaboratorName, gigTitle, authUserId, critical: true }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects system notification preferences
   */
  async sendShowcasePublished(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    collaboratorName: string,
    gigTitle: string,
    showcaseUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'system');
    
    if (!shouldSend) {
      console.log(`Showcase published notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: 'Your showcase is now live!',
      body: templates.getShowcasePublishedTemplate(
        recipientName,
        collaboratorName,
        gigTitle,
        showcaseUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'showcase.published',
      email: recipientEmail,
      data: { collaboratorName, gigTitle, authUserId }
    });
  }

  /**
   * IMPORTANT EMAIL - Featured showcase (always sent)
   * This is a recognition/achievement notification
   */
  async sendShowcaseFeatured(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    showcaseTitle: string,
    showcaseUrl: string
  ) {
    // ALWAYS SEND - This is a special achievement
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: 'Your showcase was featured! 🌟',
      body: templates.getShowcaseFeaturedTemplate(
        recipientName,
        showcaseTitle,
        showcaseUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'showcase.featured',
      email: recipientEmail,
      data: { showcaseTitle, authUserId, critical: true }
    });
  }
}

