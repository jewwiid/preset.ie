/**
 * Invitation Email Events
 * Gig invitations, collaboration invites, team invites
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

export class InvitationEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * OPTIONAL EMAIL - Gig invitation (respects gig preferences)
   */
  async sendGigInvitation(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    inviterName: string,
    gigTitle: string,
    gigDetails: {
      location: string;
      date: string;
      compType: string;
      description: string;
    },
    inviteUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    
    if (!shouldSend) {
      console.log(`Gig invitation skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${inviterName} invited you to "${gigTitle}"`,
      body: templates.getGigInvitationTemplate(
        recipientName,
        inviterName,
        gigTitle,
        gigDetails,
        inviteUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'invitation.gig.sent',
      email: recipientEmail,
      data: { inviterName, gigTitle, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Collaboration invite (respects gig preferences)
   */
  async sendCollaborationInvite(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    inviterName: string,
    inviterRole: 'photographer' | 'model' | 'creative',
    projectName: string,
    projectDescription: string,
    acceptUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    
    if (!shouldSend) {
      console.log(`Collaboration invite skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${inviterName} wants to collaborate with you!`,
      body: templates.getCollaborationInviteTemplate(
        recipientName,
        inviterName,
        inviterRole,
        projectName,
        projectDescription,
        acceptUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'invitation.collaboration.sent',
      email: recipientEmail,
      data: { inviterName, projectName, authUserId }
    });
  }

  /**
   * IMPORTANT EMAIL - Team invite (always sent)
   * Users should always know about team invitations
   */
  async sendTeamInvite(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    inviterName: string,
    organizationName: string,
    role: string,
    acceptUrl: string
  ) {
    // ALWAYS SEND - Team invitations are important
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Join ${organizationName} on Preset`,
      body: templates.getTeamInviteTemplate(
        recipientName,
        inviterName,
        organizationName,
        role,
        acceptUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'invitation.team.sent',
      email: recipientEmail,
      data: { inviterName, organizationName, role, authUserId, critical: true }
    });
  }

  /**
   * OPTIONAL EMAIL - Invite reminder (respects gig preferences)
   */
  async sendInviteReminder(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    inviterName: string,
    inviteType: 'gig' | 'collaboration' | 'team',
    itemName: string,
    daysRemaining: number,
    inviteUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    
    if (!shouldSend) {
      console.log(`Invite reminder skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Reminder: Invitation to ${itemName}`,
      body: templates.getInviteReminderTemplate(
        recipientName,
        inviterName,
        inviteType,
        itemName,
        daysRemaining,
        inviteUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'invitation.reminder.sent',
      email: recipientEmail,
      data: { inviterName, inviteType, itemName, daysRemaining, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Invite accepted (respects gig preferences)
   */
  async sendInviteAccepted(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    accepterName: string,
    inviteType: 'gig' | 'collaboration' | 'team',
    itemName: string,
    nextStepsUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    
    if (!shouldSend) {
      console.log(`Invite accepted notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${accepterName} accepted your invitation!`,
      body: templates.getInviteAcceptedTemplate(
        recipientName,
        accepterName,
        inviteType,
        itemName,
        nextStepsUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'invitation.accepted',
      email: recipientEmail,
      data: { accepterName, inviteType, itemName, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Invite declined (respects gig preferences)
   */
  async sendInviteDeclined(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    declinerName: string,
    inviteType: 'gig' | 'collaboration' | 'team',
    itemName: string,
    reason?: string,
    browseUrl?: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    
    if (!shouldSend) {
      console.log(`Invite declined notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${declinerName} declined your invitation`,
      body: templates.getInviteDeclinedTemplate(
        recipientName,
        declinerName,
        inviteType,
        itemName,
        reason,
        browseUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'invitation.declined',
      email: recipientEmail,
      data: { declinerName, inviteType, itemName, reason, authUserId }
    });
  }
}

