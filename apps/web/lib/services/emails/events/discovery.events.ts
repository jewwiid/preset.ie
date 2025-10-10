/**
 * Discovery & Engagement Email Events
 * Gig matches, profile views, followers, application tracking
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

export class DiscoveryEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * OPTIONAL EMAIL - Gig match notification (respects gig preferences)
   */
  async sendNewGigMatch(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    matchScore: number,
    gigTitle: string,
    gigDetails: {
      location: string;
      date: string;
      compType: string;
      contributorName: string;
    },
    gigUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    
    if (!shouldSend) {
      console.log(`Gig match notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Perfect match: ${gigTitle}`,
      body: templates.getNewGigMatchTemplate(
        recipientName,
        matchScore,
        gigTitle,
        gigDetails,
        gigUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'gig.match.sent',
      email: recipientEmail,
      data: { gigTitle, matchScore, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Profile viewed (respects marketing preferences)
   */
  async sendProfileViewed(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    viewerName: string,
    viewerRole: 'CONTRIBUTOR' | 'TALENT' | 'BOTH',
    viewCount: number,
    profileUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'marketing');
    
    if (!shouldSend) {
      console.log(`Profile view notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${viewerName} viewed your profile`,
      body: templates.getProfileViewedTemplate(
        recipientName,
        viewerName,
        viewerRole,
        viewCount,
        profileUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'profile.viewed.notification',
      email: recipientEmail,
      data: { viewerName, viewerRole, viewCount, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - New follower (respects marketing preferences)
   */
  async sendNewFollower(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    followerName: string,
    followerRole: 'CONTRIBUTOR' | 'TALENT' | 'BOTH',
    followerBio: string,
    followerCount: number,
    followerProfileUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'marketing');
    
    if (!shouldSend) {
      console.log(`New follower notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${followerName} is now following you!`,
      body: templates.getNewFollowerTemplate(
        recipientName,
        followerName,
        followerRole,
        followerBio,
        followerCount,
        followerProfileUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'follower.new',
      email: recipientEmail,
      data: { followerName, followerRole, followerCount, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Gig expiring (respects gig preferences)
   */
  async sendGigExpiring(
    authUserId: string,
    contributorEmail: string,
    contributorName: string,
    gigTitle: string,
    hoursRemaining: number,
    applicationCount: number,
    gigUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    
    if (!shouldSend) {
      console.log(`Gig expiring notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: contributorEmail,
      subject: `Application deadline in ${hoursRemaining}h: ${gigTitle}`,
      body: templates.getGigExpiringTemplate(
        contributorName,
        gigTitle,
        hoursRemaining,
        applicationCount,
        gigUrl,
        contributorEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'gig.expiring.notification',
      email: contributorEmail,
      data: { gigTitle, hoursRemaining, applicationCount, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Application viewed (respects application preferences)
   */
  async sendApplicationViewed(
    authUserId: string,
    talentEmail: string,
    talentName: string,
    contributorName: string,
    gigTitle: string,
    viewedAt: string,
    gigUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'application');
    
    if (!shouldSend) {
      console.log(`Application viewed notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: talentEmail,
      subject: `${contributorName} viewed your application`,
      body: templates.getApplicationViewedTemplate(
        talentName,
        contributorName,
        gigTitle,
        viewedAt,
        gigUrl,
        talentEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'application.viewed.notification',
      email: talentEmail,
      data: { contributorName, gigTitle, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Application withdrawn (respects gig preferences)
   */
  async sendApplicationWithdrawn(
    authUserId: string,
    contributorEmail: string,
    contributorName: string,
    talentName: string,
    gigTitle: string,
    reason: string,
    browseUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'gig');
    
    if (!shouldSend) {
      console.log(`Application withdrawn notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: contributorEmail,
      subject: `${talentName} withdrew from ${gigTitle}`,
      body: templates.getApplicationWithdrawnTemplate(
        contributorName,
        talentName,
        gigTitle,
        reason,
        browseUrl,
        contributorEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'application.withdrawn.notification',
      email: contributorEmail,
      data: { talentName, gigTitle, reason, authUserId }
    });
  }

  /**
   * IMPORTANT EMAIL - Gig ending soon (always sent)
   * Final reminder before shoot starts
   */
  async sendGigEndingSoon(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    gigTitle: string,
    hoursUntilStart: number,
    location: string,
    collaboratorName: string,
    gigUrl: string
  ) {
    // ALWAYS SEND - Important shoot reminder
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Shoot starts in ${hoursUntilStart}h: ${gigTitle}`,
      body: templates.getGigEndingSoonTemplate(
        recipientName,
        gigTitle,
        hoursUntilStart,
        location,
        collaboratorName,
        gigUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'gig.ending.soon',
      email: recipientEmail,
      data: { gigTitle, hoursUntilStart, collaboratorName, authUserId, critical: true }
    });
  }

  /**
   * IMPORTANT EMAIL - Showcase submitted for review (always sent)
   */
  async sendShowcaseSubmitted(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    submitterName: string,
    gigTitle: string,
    mediaCount: number,
    reviewUrl: string
  ) {
    // ALWAYS SEND - Action required from collaborator
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `${submitterName} submitted showcase for ${gigTitle}`,
      body: templates.getShowcaseSubmittedTemplate(
        recipientName,
        submitterName,
        gigTitle,
        mediaCount,
        reviewUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'showcase.submitted.notification',
      email: recipientEmail,
      data: { submitterName, gigTitle, mediaCount, authUserId, critical: true }
    });
  }

  /**
   * OPTIONAL EMAIL - System update (respects system preferences)
   */
  async sendSystemUpdate(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    updateTitle: string,
    updateDescription: string,
    features: Array<{ title: string; description: string }>,
    changelogUrl: string
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'system');
    
    if (!shouldSend) {
      console.log(`System update notification skipped for user ${authUserId} (opted out)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Platform update: ${updateTitle}`,
      body: templates.getSystemUpdateTemplate(
        recipientName,
        updateTitle,
        updateDescription,
        features,
        changelogUrl,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'system.update.notification',
      email: recipientEmail,
      data: { updateTitle, featureCount: features.length, authUserId }
    });
  }
}

