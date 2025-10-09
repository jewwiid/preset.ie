/**
 * Email Events Service - Organized by Category
 * 
 * SINGLE IMPORT FOR ALL EMAILS:
 * import { getEmailEventsService } from '@/lib/services/emails';
 * 
 * Internally organized into:
 * - events/ (by category)
 * - templates/ (by category)
 */

import { OnboardingEvents } from './events/onboarding.events';
import { GigEvents } from './events/gigs.events';
import { ApplicationEvents } from './events/applications.events';

// Import remaining event classes (simplified for now - expand as needed)
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import * as templates from './templates';

/**
 * Main Email Events Service
 * Delegates to category-specific event classes
 */
export class EmailEventsService {
  // Category-specific event handlers
  private onboarding = new OnboardingEvents();
  private gigs = new GigEvents();
  private applications = new ApplicationEvents();
  private plunk = getPlunkService();

  // ============================================
  // 1. ONBOARDING (delegates to OnboardingEvents)
  // ============================================

  async sendWelcomeEmail(authUserId: string, email: string, name: string, role: string) {
    return this.onboarding.sendWelcomeEmail(authUserId, email, name, role);
  }

  async sendEmailVerification(authUserId: string, email: string, verificationUrl: string) {
    return this.onboarding.sendEmailVerification(authUserId, email, verificationUrl);
  }

  async sendPasswordReset(authUserId: string, email: string, resetUrl: string) {
    return this.onboarding.sendPasswordReset(authUserId, email, resetUrl);
  }

  async sendProfileCompletionReminder(authUserId: string, email: string, name: string, completionPercentage: number) {
    return this.onboarding.sendProfileCompletionReminder(authUserId, email, name, completionPercentage);
  }

  // ============================================
  // 2. GIGS (delegates to GigEvents)
  // ============================================

  async sendGigDraftSaved(authUserId: string, email: string, gigTitle: string, gigId: string) {
    return this.gigs.sendGigDraftSaved(authUserId, email, gigTitle, gigId);
  }

  async sendGigPublished(authUserId: string, email: string, gigDetails: any) {
    return this.gigs.sendGigPublished(authUserId, email, gigDetails);
  }

  async sendNewApplicationNotification(
    authUserId: string,
    email: string,
    gigTitle: string,
    applicantName: string,
    applicantId: string,
    applicationUrl: string
  ) {
    return this.gigs.sendNewApplicationNotification(authUserId, email, gigTitle, applicantName, applicantId, applicationUrl);
  }

  async sendApplicationMilestone(
    authUserId: string,
    email: string,
    gigTitle: string,
    currentCount: number,
    maxApplicants: number,
    milestone: number
  ) {
    return this.gigs.sendApplicationMilestone(authUserId, email, gigTitle, currentCount, maxApplicants, milestone);
  }

  async sendDeadlineApproaching(
    authUserId: string,
    email: string,
    gigTitle: string,
    gigId: string,
    applicationCount: number,
    hoursRemaining: number
  ) {
    return this.gigs.sendDeadlineApproaching(authUserId, email, gigTitle, gigId, applicationCount, hoursRemaining);
  }

  async sendTalentBookedConfirmation(
    authUserId: string,
    email: string,
    talentName: string,
    gigTitle: string,
    gigDetails: any
  ) {
    return this.gigs.sendTalentBookedConfirmation(authUserId, email, talentName, gigTitle, gigDetails);
  }

  async sendShootReminder(authUserId: string, email: string, gigDetails: any, collaboratorName: string) {
    return this.gigs.sendShootReminder(authUserId, email, gigDetails, collaboratorName);
  }

  // ============================================
  // 3. APPLICATIONS (delegates to ApplicationEvents)
  // ============================================

  async sendApplicationSubmittedConfirmation(
    authUserId: string,
    email: string,
    gigTitle: string,
    contributorName: string,
    gigUrl: string
  ) {
    return this.applications.sendApplicationSubmittedConfirmation(authUserId, email, gigTitle, contributorName, gigUrl);
  }

  async sendApplicationShortlisted(
    authUserId: string,
    email: string,
    gigTitle: string,
    contributorName: string
  ) {
    return this.applications.sendApplicationShortlisted(authUserId, email, gigTitle, contributorName);
  }

  async sendApplicationAccepted(
    authUserId: string,
    email: string,
    name: string,
    gigDetails: any,
    contributorName: string
  ) {
    return this.applications.sendApplicationAccepted(authUserId, email, name, gigDetails, contributorName);
  }

  async sendApplicationDeclined(
    authUserId: string,
    email: string,
    gigTitle: string,
    recommendedGigs: any[]
  ) {
    return this.applications.sendApplicationDeclined(authUserId, email, gigTitle, recommendedGigs);
  }

  async sendApplicationLimitWarning(
    authUserId: string,
    email: string,
    currentCount: number,
    limit: number,
    tier: string
  ) {
    return this.applications.sendApplicationLimitWarning(authUserId, email, currentCount, limit, tier);
  }

  async sendApplicationLimitReached(authUserId: string, email: string, tier: string, resetDate: string) {
    return this.applications.sendApplicationLimitReached(authUserId, email, tier, resetDate);
  }

  // ============================================
  // 4-12. OTHER CATEGORIES (simplified - expand as needed)
  // ============================================

  // Showcases
  async sendShowcaseApprovalRequest(email: string, collaboratorName: string, gigTitle: string, showcaseUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Approve showcase with ${collaboratorName}`,
      body: templates.getShowcaseApprovalTemplate(collaboratorName, gigTitle, showcaseUrl),
    });
    await this.plunk.trackEvent({ event: 'showcase.approval.requested', email, data: { collaboratorName, gigTitle } });
  }

  async sendShowcasePublished(email: string, name: string, collaboratorName: string, showcaseUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your showcase is now live',
      body: templates.getShowcasePublishedTemplate(name, collaboratorName, showcaseUrl),
    });
    await this.plunk.trackEvent({ event: 'showcase.published', email, data: { collaboratorName } });
  }

  async sendShowcaseFeatured(email: string, showcaseTitle: string, showcaseUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your showcase has been featured',
      body: templates.getShowcaseFeaturedTemplate(showcaseTitle, showcaseUrl),
    });
    await this.plunk.trackEvent({ event: 'showcase.featured', email, data: { showcaseTitle } });
  }

  // Messaging
  async sendNewMessageNotification(email: string, senderName: string, messagePreview: string, gigTitle: string, messageUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `New message from ${senderName}`,
      body: templates.getNewMessageTemplate(senderName, messagePreview, gigTitle, messageUrl),
    });
    await this.plunk.trackEvent({ event: 'message.received', email, data: { senderName, gigTitle } });
  }

  async sendUnreadMessagesDigest(email: string, unreadCount: number, conversations: any[]) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `You have ${unreadCount} unread messages`,
      body: templates.getUnreadDigestTemplate(unreadCount, conversations),
    });
    await this.plunk.trackEvent({ event: 'message.unread.digest', email, data: { unreadCount } });
  }

  // Reviews
  async sendReviewRequest(email: string, collaboratorName: string, gigTitle: string, reviewUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `How was your experience with ${collaboratorName}?`,
      body: templates.getReviewRequestTemplate(collaboratorName, gigTitle, reviewUrl),
    });
    await this.plunk.trackEvent({ event: 'review.requested', email, data: { collaboratorName, gigTitle } });
  }

  async sendReviewReceived(email: string, reviewerName: string, rating: number, gigTitle: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'You received a new review',
      body: templates.getReviewReceivedTemplate(reviewerName, rating, gigTitle),
    });
    await this.plunk.trackEvent({ event: 'review.received', email, data: { reviewerName, rating, gigTitle } });
  }

  // Subscriptions
  async sendTrialStarted(email: string, tier: string, expiryDate: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Your ${tier} trial has started`,
      body: templates.getTrialStartedTemplate(tier, expiryDate),
    });
    await this.plunk.trackEvent({ event: 'subscription.trial.started', email, data: { tier, expiryDate } });
  }

  async sendTrialEnding(email: string, tier: string, daysRemaining: number) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Your trial ends in ${daysRemaining} days`,
      body: templates.getTrialEndingTemplate(tier, daysRemaining),
    });
    await this.plunk.trackEvent({ event: 'subscription.trial.ending', email, data: { tier, daysRemaining } });
  }

  async sendSubscriptionUpgraded(email: string, oldTier: string, newTier: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Welcome to Preset ${newTier}`,
      body: templates.getSubscriptionUpgradedTemplate(oldTier, newTier),
    });
    await this.plunk.trackEvent({ event: 'subscription.upgraded', email, data: { oldTier, newTier } });
  }

  async sendSubscriptionDowngraded(email: string, oldTier: string, newTier: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your plan has changed',
      body: templates.getSubscriptionDowngradedTemplate(oldTier, newTier),
    });
    await this.plunk.trackEvent({ event: 'subscription.downgraded', email, data: { oldTier, newTier } });
  }

  async sendSubscriptionCancelled(email: string, tier: string, accessUntil: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Subscription cancelled',
      body: templates.getSubscriptionCancelledTemplate(tier, accessUntil),
    });
    await this.plunk.trackEvent({ event: 'subscription.cancelled', email, data: { tier, accessUntil } });
  }

  async sendSubscriptionRenewalReminder(email: string, tier: string, daysUntil: number, amount: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: daysUntil === 1 ? 'Your subscription renews tomorrow' : `Your subscription renews in ${daysUntil} days`,
      body: templates.getSubscriptionRenewalTemplate(tier, daysUntil, amount),
    });
    await this.plunk.trackEvent({ event: 'subscription.expiring.soon', email, data: { tier, daysUntil, amount } });
  }

  async sendPaymentFailed(email: string, tier: string, retryUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Payment issue with your subscription',
      body: templates.getPaymentFailedTemplate(tier, retryUrl),
    });
    await this.plunk.trackEvent({ event: 'subscription.payment.failed', email, data: { tier } });
  }

  // Credits
  async sendCreditsPurchased(email: string, credits: number, amount: number, transactionId: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Credit purchase confirmation',
      body: templates.getCreditsPurchasedTemplate(credits, amount, transactionId),
    });
    await this.plunk.trackEvent({ event: 'credits.purchased', email, data: { credits, amount, transactionId } });
  }

  async sendCreditsLow(email: string, currentBalance: number, tier: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your credits are running low',
      body: templates.getCreditsLowTemplate(currentBalance, tier),
    });
    await this.plunk.trackEvent({ event: 'credits.low', email, data: { currentBalance, tier } });
  }

  async sendMonthlyCreditsReset(email: string, newBalance: number, tier: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your monthly credits have been refreshed',
      body: templates.getCreditsResetTemplate(newBalance, tier),
    });
    await this.plunk.trackEvent({ event: 'credits.monthly.reset', email, data: { newBalance, tier } });
  }

  // Engagement
  async sendInactiveUserEmail(email: string, name: string, daysInactive: number) {
    const subjects = {
      7: 'We miss you at Preset',
      30: 'Your creative community is waiting',
      90: 'Your account will be archived soon'
    };
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: subjects[daysInactive as keyof typeof subjects] || 'Come back to Preset',
      body: templates.getInactiveUserTemplate(name, daysInactive),
    });
    const eventNames = {7: 'user.inactive.7days', 30: 'user.inactive.30days', 90: 'user.inactive.90days'};
    await this.plunk.trackEvent({ event: eventNames[daysInactive as keyof typeof eventNames] || 'user.inactive', email, data: { daysInactive } });
  }

  async sendMilestoneEmail(email: string, name: string, milestone: string, count: number) {
    const subjects = {
      'first.gig.created': 'Congratulations on your first gig',
      'first.application.sent': 'Your first application is out there',
      'first.booking': 'Your first booking',
      'first.showcase.published': 'Your first showcase is live',
      '5.completed.gigs': `You have completed ${count} gigs`,
      '10.completed.gigs': `${count} gigs completed`,
    };
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: subjects[milestone as keyof typeof subjects] || 'Milestone achieved',
      body: templates.getMilestoneTemplate(name, milestone, count),
    });
    await this.plunk.trackEvent({ event: `milestone.${milestone}`, email, data: { milestone, count } });
  }

  async sendWeeklyReport(email: string, role: string, stats: any) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your weekly Preset report',
      body: templates.getWeeklyReportTemplate(role, stats),
    });
    await this.plunk.trackEvent({ event: `report.weekly.${role.toLowerCase()}`, email, data: stats });
  }

  async sendMonthlyReport(email: string, stats: any) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your month in review',
      body: templates.getMonthlyReportTemplate(stats),
    });
    await this.plunk.trackEvent({ event: 'report.monthly.all.users', email, data: stats });
  }

  // Marketplace
  async sendRentalRequestCreated(email: string, itemName: string, requestUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Rental request sent',
      body: templates.getRentalRequestTemplate(itemName, requestUrl),
    });
    await this.plunk.trackEvent({ event: 'rental.request.created', email, data: { itemName } });
  }

  async sendRentalRequestAccepted(email: string, itemName: string, pickupDetails: any) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your rental request was accepted',
      body: templates.getRentalAcceptedTemplate(itemName, pickupDetails),
    });
    await this.plunk.trackEvent({ event: 'rental.request.accepted', email, data: { itemName } });
  }

  async sendPresetPurchased(email: string, presetName: string, downloadUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your preset is ready to download',
      body: templates.getPresetPurchasedTemplate(presetName, downloadUrl),
    });
    await this.plunk.trackEvent({ event: 'preset.purchased', email, data: { presetName } });
  }

  // Safety & Trust
  async sendIDVerificationSubmitted(email: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'ID verification submitted',
      body: templates.getIDVerificationSubmittedTemplate(),
    });
    await this.plunk.trackEvent({ event: 'id.verification.submitted', email, data: {} });
  }

  async sendIDVerificationApproved(email: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'You are now verified',
      body: templates.getIDVerificationApprovedTemplate(),
    });
    await this.plunk.trackEvent({ event: 'id.verification.approved', email, data: {} });
  }

  async sendIDVerificationRejected(email: string, reason: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'ID verification needs attention',
      body: templates.getIDVerificationRejectedTemplate(reason),
    });
    await this.plunk.trackEvent({ event: 'id.verification.rejected', email, data: { reason } });
  }

  async sendAccountSuspended(email: string, reason: string, duration: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Account suspended',
      body: templates.getAccountSuspendedTemplate(reason, duration),
    });
    await this.plunk.trackEvent({ event: 'account.suspended', email, data: { reason, duration } });
  }

  // Educational
  async sendTuesdayTips(email: string, topic: string, tips: string[]) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Tuesday Tips: ${topic}`,
      body: templates.getTuesdayTipsTemplate(topic, tips),
    });
    await this.plunk.trackEvent({ event: 'education.weekly.tips', email, data: { topic } });
  }

  async sendNewsletterSuccessStories(email: string, stories: any[]) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Community Spotlight: Success Stories',
      body: templates.getSuccessStoriesTemplate(stories),
    });
    await this.plunk.trackEvent({ event: 'newsletter.monthly.success.stories', email, data: { storiesCount: stories.length } });
  }

  async sendFeatureAnnouncement(email: string, featureName: string, description: string, featureUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `New Feature: ${featureName}`,
      body: templates.getFeatureAnnouncementTemplate(featureName, description, featureUrl),
    });
    await this.plunk.trackEvent({ event: 'feature.launched', email, data: { featureName } });
  }

  async sendPromotionalOffer(email: string, offerTitle: string, discount: number, expiryDate: string, offerUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Limited Time: ${offerTitle}`,
      body: templates.getPromotionalOfferTemplate(offerTitle, discount, expiryDate, offerUrl),
    });
    await this.plunk.trackEvent({ event: 'promo.discount.offer', email, data: { offerTitle, discount } });
  }
}

// Singleton instance
let emailEventsServiceInstance: EmailEventsService | null = null;

export function getEmailEventsService(): EmailEventsService {
  if (!emailEventsServiceInstance) {
    emailEventsServiceInstance = new EmailEventsService();
  }
  return emailEventsServiceInstance;
}

// Re-export for backwards compatibility
export { OnboardingEvents, GigEvents, ApplicationEvents };

