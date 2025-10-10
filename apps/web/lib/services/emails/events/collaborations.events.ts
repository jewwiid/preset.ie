/**
 * Collaboration & Project Email Events
 * Gig completion, project updates, cancellations, showcase uploads
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

export class CollaborationEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * IMPORTANT EMAIL - Gig completed (always sent)
   * Users need to know when to upload showcase media
   */
  async sendGigCompleted(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    collaboratorName: string,
    gigTitle: string,
    uploadMediaUrl: string
  ) {
    // ALWAYS SEND - Important project milestone
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Gig completed: ${gigTitle}`,
      body: templates.getGigCompletedTemplate(
        recipientName,
        collaboratorName,
        gigTitle,
        uploadMediaUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'gig.completed',
      email: recipientEmail,
      data: { gigTitle, collaboratorName, authUserId, critical: true }
    });
  }

  /**
   * OPTIONAL EMAIL - Collaborator invite (respects gig preferences)
   */
  async sendCollaboratorInvite(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    inviterName: string,
    gigTitle: string,
    gigUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    
    if (!shouldSend) {
      console.log(`Collaborator invite skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${inviterName} invited you to collaborate!`,
      body: templates.getCollaboratorInviteTemplate(
        recipientName,
        inviterName,
        gigTitle,
        gigUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'collaboration.invite.sent',
      email: recipientEmail,
      data: { inviterName, gigTitle, authUserId }
    });
  }

  /**
   * IMPORTANT EMAIL - Project update (always sent)
   * Collaborators need to know about changes
   */
  async sendProjectUpdate(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    updaterName: string,
    gigTitle: string,
    updateType: 'schedule_change' | 'location_change' | 'requirements_update' | 'general_update',
    updateMessage: string,
    gigUrl: string
  ) {
    // ALWAYS SEND - Important project information
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Project update: ${gigTitle}`,
      body: templates.getProjectUpdateTemplate(
        recipientName,
        updaterName,
        gigTitle,
        updateType,
        updateMessage,
        gigUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'project.update.sent',
      email: recipientEmail,
      data: { gigTitle, updateType, authUserId, critical: true }
    });
  }

  /**
   * IMPORTANT EMAIL - Collaboration cancelled (always sent)
   * Users need to know when a gig is cancelled
   */
  async sendCollaborationCancelled(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    cancellerName: string,
    gigTitle: string,
    reason: string,
    browseGigsUrl: string
  ) {
    // ALWAYS SEND - Important cancellation notice
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Gig cancelled: ${gigTitle}`,
      body: templates.getCollaborationCancelledTemplate(
        recipientName,
        cancellerName,
        gigTitle,
        reason,
        browseGigsUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'collaboration.cancelled',
      email: recipientEmail,
      data: { gigTitle, reason, authUserId, critical: true }
    });
  }

  /**
   * OPTIONAL EMAIL - Showcase upload reminder (respects booking preferences)
   */
  async sendShowcaseUploadReminder(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    collaboratorName: string,
    gigTitle: string,
    daysRemaining: number,
    uploadUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'booking');
    
    if (!shouldSend) {
      console.log(`Showcase reminder skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Don't forget your showcase: ${gigTitle}`,
      body: templates.getShowcaseUploadReminderTemplate(
        recipientName,
        collaboratorName,
        gigTitle,
        daysRemaining,
        uploadUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'showcase.upload.reminder',
      email: recipientEmail,
      data: { gigTitle, daysRemaining, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Collaborator uploaded media (respects booking preferences)
   */
  async sendCollaboratorMediaUploaded(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    uploaderName: string,
    gigTitle: string,
    mediaCount: number,
    reviewUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'booking');
    
    if (!shouldSend) {
      console.log(`Media upload notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${uploaderName} uploaded media for ${gigTitle}`,
      body: templates.getCollaboratorMediaUploadedTemplate(
        recipientName,
        uploaderName,
        gigTitle,
        mediaCount,
        reviewUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'collaboration.media.uploaded',
      email: recipientEmail,
      data: { gigTitle, uploaderName, mediaCount, authUserId }
    });
  }
}

