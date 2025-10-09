/**
 * Gig Lifecycle Email Events
 * Draft, published, applications, bookings, reminders
 * 
 * NOTE: Most gig emails are OPTIONAL and respect user preferences
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
  compDetails?: string;
}

export class GigEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * OPTIONAL EMAIL - Respects gig notification preferences
   */
  async sendGigDraftSaved(authUserId: string, email: string, gigTitle: string, gigId: string) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    if (!shouldSend) {
      console.log(`Gig draft notification skipped for user ${authUserId}`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your gig is saved as a draft',
      body: templates.getGigDraftTemplate(gigTitle, gigId, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'gig.draft.saved',
      email,
      data: { gigTitle, gigId, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects gig notification preferences
   */
  async sendGigPublished(authUserId: string, email: string, gigDetails: GigDetails) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    if (!shouldSend) {
      console.log(`Gig published notification skipped for user ${authUserId}`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Your gig "${gigDetails.title}" is now live`,
      body: templates.getGigPublishedTemplate(gigDetails, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'gig.published',
      email,
      data: {
        gigId: gigDetails.id,
        gigTitle: gigDetails.title,
        publishedAt: new Date().toISOString(),
        authUserId
      }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects gig notification preferences
   */
  async sendNewApplicationNotification(
    authUserId: string,
    email: string,
    gigTitle: string,
    applicantName: string,
    applicantId: string,
    applicationUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    if (!shouldSend) {
      console.log(`New application notification skipped for user ${authUserId}`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `New application for "${gigTitle}"`,
      body: templates.getNewApplicationTemplate(gigTitle, applicantName, applicationUrl, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'gig.application.received',
      email,
      data: { gigTitle, applicantName, applicantId, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects gig notification preferences
   */
  async sendApplicationMilestone(
    authUserId: string,
    email: string,
    gigTitle: string,
    currentCount: number,
    maxApplicants: number,
    milestone: number
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    if (!shouldSend) return;

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Application milestone for "${gigTitle}"`,
      body: templates.getApplicationMilestoneTemplate(gigTitle, currentCount, maxApplicants, milestone, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'gig.application.milestone',
      email,
      data: { gigTitle, currentCount, maxApplicants, milestone, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects gig notification preferences
   */
  async sendDeadlineApproaching(
    authUserId: string,
    email: string,
    gigTitle: string,
    gigId: string,
    applicationCount: number,
    hoursRemaining: number
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    if (!shouldSend) return;

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Application deadline approaching for "${gigTitle}"`,
      body: templates.getDeadlineApproachingTemplate(gigTitle, gigId, applicationCount, hoursRemaining, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'gig.deadline.approaching',
      email,
      data: { gigTitle, gigId, applicationCount, hoursRemaining, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Respects booking notification preferences
   */
  async sendTalentBookedConfirmation(
    authUserId: string,
    email: string,
    talentName: string,
    gigTitle: string,
    gigDetails: GigDetails
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'booking');
    if (!shouldSend) return;

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `You have booked ${talentName} for "${gigTitle}"`,
      body: templates.getContributorBookingTemplate(talentName, gigDetails, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'gig.talent.booked.contributor',
      email,
      data: { talentName, gigTitle, authUserId }
    });
  }

  /**
   * IMPORTANT EMAIL - Respects booking preferences but recommended to keep on
   */
  async sendShootReminder(authUserId: string, email: string, gigDetails: GigDetails, collaboratorName: string) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'booking');
    if (!shouldSend) return;

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Shoot reminder: "${gigDetails.title}" tomorrow`,
      body: templates.getShootReminderTemplate(gigDetails, collaboratorName, email, authUserId),
    });

    await this.plunk.trackEvent({
      event: 'gig.shoot.reminder',
      email,
      data: { gigTitle: gigDetails.title, gigId: gigDetails.id, authUserId }
    });
  }
}
