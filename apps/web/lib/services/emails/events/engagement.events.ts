/**
 * Engagement Email Events
 * Weekly digests, tips, re-engagement, milestones
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getEmailPreferenceChecker } from '@/lib/services/email-preference-checker.service';
import * as templates from '../templates';

export class EngagementEvents {
  private plunk = getPlunkService();
  private checker = getEmailPreferenceChecker();

  /**
   * OPTIONAL EMAIL - Weekly digest (respects marketing preferences)
   */
  async sendWeeklyDigest(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    role: 'TALENT' | 'CONTRIBUTOR' | 'BOTH',
    stats: {
      newGigs?: number;
      applications?: number;
      messages?: number;
      profileViews?: number;
      showcases?: number;
    },
    highlights: Array<{ title: string; description: string; url: string }>
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'marketing');
    
    if (!shouldSend) {
      console.log(`Weekly digest skipped for user ${authUserId} (opted out of marketing)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: 'Your weekly digest from Preset',
      body: templates.getWeeklyDigestTemplate(
        recipientName,
        role,
        stats,
        highlights,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'engagement.weekly.digest',
      email: recipientEmail,
      data: { role, stats, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Tuesday tips (respects marketing preferences)
   */
  async sendTuesdayTips(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    topic: string,
    tips: Array<{ title: string; description: string }>
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'marketing');
    
    if (!shouldSend) {
      console.log(`Tuesday tips skipped for user ${authUserId} (opted out of marketing)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Tuesday Tips: ${topic}`,
      body: templates.getTuesdayTipsTemplate(
        recipientName,
        topic,
        tips,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'engagement.tuesday.tips',
      email: recipientEmail,
      data: { topic, authUserId }
    });
  }

  /**
   * OPTIONAL EMAIL - Re-engagement (respects marketing preferences)
   */
  async sendInactiveUserReengagement(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    daysInactive: number,
    personalizedContent: {
      newGigs?: number;
      newFeatures?: string[];
      recommendedGigs?: Array<{ title: string; url: string }>;
    }
  ) {
    const { shouldSend } = await this.checker.shouldSendEmail(authUserId, 'marketing');
    
    if (!shouldSend) {
      console.log(`Re-engagement email skipped for user ${authUserId} (opted out of marketing)`);
      return;
    }

    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `We miss you, ${recipientName}!`,
      body: templates.getInactiveUserReengagementTemplate(
        recipientName,
        daysInactive,
        personalizedContent,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'engagement.reengagement',
      email: recipientEmail,
      data: { daysInactive, authUserId }
    });
  }

  /**
   * IMPORTANT EMAIL - Milestone achieved (always sent)
   * This is a recognition/achievement notification
   */
  async sendMilestoneAchieved(
    authUserId: string,
    recipientEmail: string,
    recipientName: string,
    milestone: string,
    value: number,
    badge?: string
  ) {
    // ALWAYS SEND - This is an achievement notification
    await this.plunk.sendTransactionalEmail({
      to: recipientEmail,
      subject: `Milestone unlocked: ${milestone}!`,
      body: templates.getMilestoneAchievedTemplate(
        recipientName,
        milestone,
        value,
        badge,
        recipientEmail,
        authUserId
      ),
    });

    await this.plunk.trackEvent({
      event: 'engagement.milestone',
      email: recipientEmail,
      data: { milestone, value, authUserId, critical: true }
    });
  }
}

