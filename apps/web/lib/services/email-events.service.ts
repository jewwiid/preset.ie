/**
 * Email Events Service
 * Central service for handling ALL email events across Preset.ie
 * 
 * NO EMOJIS - Professional, clean email design
 * Brand Colors: #00876f, #0d7d72
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

// ============================================
// TYPES & INTERFACES
// ============================================

interface GigDetails {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  compType: string;
  compDetails?: string;
}

interface UserData {
  name: string;
  email: string;
  role: 'CONTRIBUTOR' | 'TALENT' | 'BOTH';
  tier: string;
}

// ============================================
// EMAIL EVENTS SERVICE
// ============================================

export class EmailEventsService {
  private plunk = getPlunkService();
  private baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com';

  // ============================================
  // 1. USER ONBOARDING & AUTHENTICATION
  // ============================================

  async sendWelcomeEmail(email: string, name: string, role: string) {
    const roleDescriptions = {
      CONTRIBUTOR: 'You can create gigs, find talent, and build your portfolio',
      TALENT: 'You can apply to gigs, collaborate with photographers, and showcase your work',
      BOTH: 'You have full access to create gigs and apply as talent'
    };

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Welcome to Preset',
      body: this.getWelcomeEmailTemplate(name, role, roleDescriptions[role as keyof typeof roleDescriptions]),
    });

    await this.plunk.trackEvent({
      event: 'email.welcome.sent',
      email,
      data: { name, role }
    });
  }

  async sendEmailVerification(email: string, verificationUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Verify your Preset account',
      body: this.getEmailVerificationTemplate(verificationUrl),
    });

    await this.plunk.trackEvent({
      event: 'email.verification.sent',
      email,
      data: { sentAt: new Date().toISOString() }
    });
  }

  async sendPasswordReset(email: string, resetUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Reset your Preset password',
      body: this.getPasswordResetTemplate(resetUrl),
    });

    await this.plunk.trackEvent({
      event: 'password.reset.sent',
      email,
      data: { sentAt: new Date().toISOString() }
    });
  }

  async sendProfileCompletionReminder(email: string, name: string, completionPercentage: number) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Complete your Preset profile',
      body: this.getProfileCompletionTemplate(name, completionPercentage),
    });

    await this.plunk.trackEvent({
      event: 'profile.completion.reminder',
      email,
      data: { completionPercentage }
    });
  }

  // ============================================
  // 2. GIG LIFECYCLE (CONTRIBUTOR)
  // ============================================

  async sendGigDraftSaved(email: string, gigTitle: string, gigId: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your gig is saved as a draft',
      body: this.getGigDraftTemplate(gigTitle, gigId),
    });

    await this.plunk.trackEvent({
      event: 'gig.draft.saved',
      email,
      data: { gigTitle, gigId }
    });
  }

  async sendGigPublished(email: string, gigDetails: GigDetails) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Your gig "${gigDetails.title}" is now live`,
      body: this.getGigPublishedTemplate(gigDetails),
    });

    await this.plunk.trackEvent({
      event: 'gig.published',
      email,
      data: {
        gigId: gigDetails.id,
        gigTitle: gigDetails.title,
        publishedAt: new Date().toISOString()
      }
    });
  }

  async sendNewApplicationNotification(
    email: string,
    gigTitle: string,
    applicantName: string,
    applicantId: string,
    applicationUrl: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `New application for "${gigTitle}"`,
      body: this.getNewApplicationTemplate(gigTitle, applicantName, applicationUrl),
    });

    await this.plunk.trackEvent({
      event: 'gig.application.received',
      email,
      data: { gigTitle, applicantName, applicantId }
    });
  }

  async sendApplicationMilestone(
    email: string,
    gigTitle: string,
    currentCount: number,
    maxApplicants: number,
    milestone: number
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Application milestone for "${gigTitle}"`,
      body: this.getApplicationMilestoneTemplate(gigTitle, currentCount, maxApplicants, milestone),
    });

    await this.plunk.trackEvent({
      event: 'gig.application.milestone',
      email,
      data: { gigTitle, currentCount, maxApplicants, milestone }
    });
  }

  async sendDeadlineApproaching(
    email: string,
    gigTitle: string,
    gigId: string,
    applicationCount: number,
    hoursRemaining: number
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Application deadline approaching for "${gigTitle}"`,
      body: this.getDeadlineApproachingTemplate(gigTitle, gigId, applicationCount, hoursRemaining),
    });

    await this.plunk.trackEvent({
      event: 'gig.deadline.approaching',
      email,
      data: { gigTitle, gigId, applicationCount, hoursRemaining }
    });
  }

  async sendTalentBookedConfirmation(
    email: string,
    talentName: string,
    gigTitle: string,
    gigDetails: GigDetails
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `You have booked ${talentName} for "${gigTitle}"`,
      body: this.getContributorBookingTemplate(talentName, gigDetails),
    });

    await this.plunk.trackEvent({
      event: 'gig.talent.booked.contributor',
      email,
      data: { talentName, gigTitle }
    });
  }

  async sendShootReminder(email: string, gigDetails: GigDetails, collaboratorName: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Shoot reminder: "${gigDetails.title}" tomorrow`,
      body: this.getShootReminderTemplate(gigDetails, collaboratorName),
    });

    await this.plunk.trackEvent({
      event: 'gig.shoot.reminder',
      email,
      data: { gigTitle: gigDetails.title, gigId: gigDetails.id }
    });
  }

  // ============================================
  // 3. APPLICATION LIFECYCLE (TALENT)
  // ============================================

  async sendApplicationSubmittedConfirmation(
    email: string,
    gigTitle: string,
    contributorName: string,
    gigUrl: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Application sent to ${contributorName}`,
      body: this.getApplicationSubmittedTemplate(gigTitle, contributorName, gigUrl),
    });

    await this.plunk.trackEvent({
      event: 'application.submitted',
      email,
      data: { gigTitle, contributorName }
    });
  }

  async sendApplicationShortlisted(
    email: string,
    gigTitle: string,
    contributorName: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'You have been shortlisted',
      body: this.getApplicationShortlistedTemplate(gigTitle, contributorName),
    });

    await this.plunk.trackEvent({
      event: 'application.shortlisted',
      email,
      data: { gigTitle, contributorName }
    });
  }

  async sendApplicationAccepted(
    email: string,
    name: string,
    gigDetails: GigDetails,
    contributorName: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Congratulations! You are booked for "${gigDetails.title}"`,
      body: this.getTalentBookingTemplate(name, gigDetails, contributorName),
    });

    await this.plunk.trackEvent({
      event: 'application.accepted',
      email,
      data: { gigTitle: gigDetails.title, contributorName }
    });
  }

  async sendApplicationDeclined(
    email: string,
    gigTitle: string,
    recommendedGigs: Array<{ id: string; title: string; url: string }>
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Update on your application',
      body: this.getApplicationDeclinedTemplate(gigTitle, recommendedGigs),
    });

    await this.plunk.trackEvent({
      event: 'application.declined',
      email,
      data: { gigTitle }
    });
  }

  async sendApplicationLimitWarning(
    email: string,
    currentCount: number,
    limit: number,
    tier: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Application limit approaching',
      body: this.getApplicationLimitWarningTemplate(currentCount, limit, tier),
    });

    await this.plunk.trackEvent({
      event: 'application.limit.approaching',
      email,
      data: { currentCount, limit, tier }
    });
  }

  async sendApplicationLimitReached(email: string, tier: string, resetDate: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Monthly application limit reached',
      body: this.getApplicationLimitReachedTemplate(tier, resetDate),
    });

    await this.plunk.trackEvent({
      event: 'application.limit.reached',
      email,
      data: { tier, resetDate }
    });
  }

  // ============================================
  // 4. SHOWCASE & PORTFOLIO
  // ============================================

  async sendShowcaseApprovalRequest(
    email: string,
    collaboratorName: string,
    gigTitle: string,
    showcaseUrl: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Approve showcase with ${collaboratorName}`,
      body: this.getShowcaseApprovalTemplate(collaboratorName, gigTitle, showcaseUrl),
    });

    await this.plunk.trackEvent({
      event: 'showcase.approval.requested',
      email,
      data: { collaboratorName, gigTitle }
    });
  }

  async sendShowcasePublished(
    email: string,
    name: string,
    collaboratorName: string,
    showcaseUrl: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your showcase is now live',
      body: this.getShowcasePublishedTemplate(name, collaboratorName, showcaseUrl),
    });

    await this.plunk.trackEvent({
      event: 'showcase.published',
      email,
      data: { collaboratorName }
    });
  }

  async sendShowcaseFeatured(email: string, showcaseTitle: string, showcaseUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your showcase has been featured',
      body: this.getShowcaseFeaturedTemplate(showcaseTitle, showcaseUrl),
    });

    await this.plunk.trackEvent({
      event: 'showcase.featured',
      email,
      data: { showcaseTitle }
    });
  }

  // ============================================
  // 5. MESSAGING
  // ============================================

  async sendNewMessageNotification(
    email: string,
    senderName: string,
    messagePreview: string,
    gigTitle: string,
    messageUrl: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `New message from ${senderName}`,
      body: this.getNewMessageTemplate(senderName, messagePreview, gigTitle, messageUrl),
    });

    await this.plunk.trackEvent({
      event: 'message.received',
      email,
      data: { senderName, gigTitle }
    });
  }

  async sendUnreadMessagesDigest(
    email: string,
    unreadCount: number,
    conversations: Array<{ senderName: string; gigTitle: string; url: string }>
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `You have ${unreadCount} unread messages`,
      body: this.getUnreadDigestTemplate(unreadCount, conversations),
    });

    await this.plunk.trackEvent({
      event: 'message.unread.digest',
      email,
      data: { unreadCount }
    });
  }

  // ============================================
  // 6. REVIEWS & RATINGS
  // ============================================

  async sendReviewRequest(
    email: string,
    collaboratorName: string,
    gigTitle: string,
    reviewUrl: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `How was your experience with ${collaboratorName}?`,
      body: this.getReviewRequestTemplate(collaboratorName, gigTitle, reviewUrl),
    });

    await this.plunk.trackEvent({
      event: 'review.requested',
      email,
      data: { collaboratorName, gigTitle }
    });
  }

  async sendReviewReceived(
    email: string,
    reviewerName: string,
    rating: number,
    gigTitle: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'You received a new review',
      body: this.getReviewReceivedTemplate(reviewerName, rating, gigTitle),
    });

    await this.plunk.trackEvent({
      event: 'review.received',
      email,
      data: { reviewerName, rating, gigTitle }
    });
  }

  // ============================================
  // 7. SUBSCRIPTION & MONETIZATION
  // ============================================

  async sendTrialStarted(email: string, tier: string, expiryDate: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Your ${tier} trial has started`,
      body: this.getTrialStartedTemplate(tier, expiryDate),
    });

    await this.plunk.trackEvent({
      event: 'subscription.trial.started',
      email,
      data: { tier, expiryDate }
    });
  }

  async sendTrialEnding(email: string, tier: string, daysRemaining: number) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Your trial ends in ${daysRemaining} days`,
      body: this.getTrialEndingTemplate(tier, daysRemaining),
    });

    await this.plunk.trackEvent({
      event: 'subscription.trial.ending',
      email,
      data: { tier, daysRemaining }
    });
  }

  async sendSubscriptionUpgraded(email: string, oldTier: string, newTier: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Welcome to Preset ${newTier}`,
      body: this.getSubscriptionUpgradedTemplate(oldTier, newTier),
    });

    await this.plunk.trackEvent({
      event: 'subscription.upgraded',
      email,
      data: { oldTier, newTier }
    });
  }

  async sendSubscriptionDowngraded(email: string, oldTier: string, newTier: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your plan has changed',
      body: this.getSubscriptionDowngradedTemplate(oldTier, newTier),
    });

    await this.plunk.trackEvent({
      event: 'subscription.downgraded',
      email,
      data: { oldTier, newTier }
    });
  }

  async sendSubscriptionCancelled(email: string, tier: string, accessUntil: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Subscription cancelled',
      body: this.getSubscriptionCancelledTemplate(tier, accessUntil),
    });

    await this.plunk.trackEvent({
      event: 'subscription.cancelled',
      email,
      data: { tier, accessUntil }
    });
  }

  async sendSubscriptionRenewalReminder(email: string, tier: string, daysUntil: number, amount: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: daysUntil === 1 ? 'Your subscription renews tomorrow' : `Your subscription renews in ${daysUntil} days`,
      body: this.getSubscriptionRenewalTemplate(tier, daysUntil, amount),
    });

    await this.plunk.trackEvent({
      event: 'subscription.expiring.soon',
      email,
      data: { tier, daysUntil, amount }
    });
  }

  async sendPaymentFailed(email: string, tier: string, retryUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Payment issue with your subscription',
      body: this.getPaymentFailedTemplate(tier, retryUrl),
    });

    await this.plunk.trackEvent({
      event: 'subscription.payment.failed',
      email,
      data: { tier }
    });
  }

  // ============================================
  // 8. CREDIT SYSTEM
  // ============================================

  async sendCreditsPurchased(
    email: string,
    credits: number,
    amount: number,
    transactionId: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Credit purchase confirmation',
      body: this.getCreditsPurchasedTemplate(credits, amount, transactionId),
    });

    await this.plunk.trackEvent({
      event: 'credits.purchased',
      email,
      data: { credits, amount, transactionId }
    });
  }

  async sendCreditsLow(email: string, currentBalance: number, tier: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your credits are running low',
      body: this.getCreditsLowTemplate(currentBalance, tier),
    });

    await this.plunk.trackEvent({
      event: 'credits.low',
      email,
      data: { currentBalance, tier }
    });
  }

  async sendMonthlyCreditsReset(email: string, newBalance: number, tier: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your monthly credits have been refreshed',
      body: this.getCreditsResetTemplate(newBalance, tier),
    });

    await this.plunk.trackEvent({
      event: 'credits.monthly.reset',
      email,
      data: { newBalance, tier }
    });
  }

  // ============================================
  // 9. ENGAGEMENT & RETENTION
  // ============================================

  async sendInactiveUserEmail(email: string, name: string, daysInactive: number) {
    const subjects = {
      7: 'We miss you at Preset',
      30: 'Your creative community is waiting',
      90: 'Your account will be archived soon'
    };

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: subjects[daysInactive as keyof typeof subjects] || 'Come back to Preset',
      body: this.getInactiveUserTemplate(name, daysInactive),
    });

    const eventNames = {
      7: 'user.inactive.7days',
      30: 'user.inactive.30days',
      90: 'user.inactive.90days'
    };

    await this.plunk.trackEvent({
      event: eventNames[daysInactive as keyof typeof eventNames] || 'user.inactive',
      email,
      data: { daysInactive }
    });
  }

  async sendMilestoneEmail(
    email: string,
    name: string,
    milestone: string,
    count: number
  ) {
    const milestoneSubjects = {
      'first.gig.created': 'Congratulations on your first gig',
      'first.application.sent': 'Your first application is out there',
      'first.booking': 'Your first booking',
      'first.showcase.published': 'Your first showcase is live',
      '5.completed.gigs': `You have completed ${count} gigs`,
      '10.completed.gigs': `${count} gigs completed`,
    };

    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: milestoneSubjects[milestone as keyof typeof milestoneSubjects] || 'Milestone achieved',
      body: this.getMilestoneTemplate(name, milestone, count),
    });

    await this.plunk.trackEvent({
      event: `milestone.${milestone}`,
      email,
      data: { milestone, count }
    });
  }

  async sendWeeklyReport(
    email: string,
    role: string,
    stats: Record<string, any>
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your weekly Preset report',
      body: this.getWeeklyReportTemplate(role, stats),
    });

    await this.plunk.trackEvent({
      event: `report.weekly.${role.toLowerCase()}`,
      email,
      data: stats
    });
  }

  async sendMonthlyReport(
    email: string,
    stats: Record<string, any>
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your month in review',
      body: this.getMonthlyReportTemplate(stats),
    });

    await this.plunk.trackEvent({
      event: 'report.monthly.all.users',
      email,
      data: stats
    });
  }

  // ============================================
  // 10. MARKETPLACE
  // ============================================

  async sendRentalRequestCreated(
    email: string,
    itemName: string,
    requestUrl: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Rental request sent',
      body: this.getRentalRequestTemplate(itemName, requestUrl),
    });

    await this.plunk.trackEvent({
      event: 'rental.request.created',
      email,
      data: { itemName }
    });
  }

  async sendRentalRequestAccepted(
    email: string,
    itemName: string,
    pickupDetails: Record<string, any>
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your rental request was accepted',
      body: this.getRentalAcceptedTemplate(itemName, pickupDetails),
    });

    await this.plunk.trackEvent({
      event: 'rental.request.accepted',
      email,
      data: { itemName }
    });
  }

  async sendPresetPurchased(
    email: string,
    presetName: string,
    downloadUrl: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Your preset is ready to download',
      body: this.getPresetPurchasedTemplate(presetName, downloadUrl),
    });

    await this.plunk.trackEvent({
      event: 'preset.purchased',
      email,
      data: { presetName }
    });
  }

  // ============================================
  // 11. SAFETY & TRUST
  // ============================================

  async sendIDVerificationSubmitted(email: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'ID verification submitted',
      body: this.getIDVerificationSubmittedTemplate(),
    });

    await this.plunk.trackEvent({
      event: 'id.verification.submitted',
      email,
      data: {}
    });
  }

  async sendIDVerificationApproved(email: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'You are now verified',
      body: this.getIDVerificationApprovedTemplate(),
    });

    await this.plunk.trackEvent({
      event: 'id.verification.approved',
      email,
      data: {}
    });
  }

  async sendIDVerificationRejected(email: string, reason: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'ID verification needs attention',
      body: this.getIDVerificationRejectedTemplate(reason),
    });

    await this.plunk.trackEvent({
      event: 'id.verification.rejected',
      email,
      data: { reason }
    });
  }

  async sendAccountSuspended(email: string, reason: string, duration: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Account suspended',
      body: this.getAccountSuspendedTemplate(reason, duration),
    });

    await this.plunk.trackEvent({
      event: 'account.suspended',
      email,
      data: { reason, duration }
    });
  }

  // ============================================
  // 12. EDUCATIONAL & PROMOTIONAL
  // ============================================

  async sendTuesdayTips(email: string, topic: string, tips: string[]) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Tuesday Tips: ${topic}`,
      body: this.getTuesdayTipsTemplate(topic, tips),
    });

    await this.plunk.trackEvent({
      event: 'education.weekly.tips',
      email,
      data: { topic }
    });
  }

  async sendNewsletterSuccessStories(email: string, stories: any[]) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: 'Community Spotlight: Success Stories',
      body: this.getSuccessStoriesTemplate(stories),
    });

    await this.plunk.trackEvent({
      event: 'newsletter.monthly.success.stories',
      email,
      data: { storiesCount: stories.length }
    });
  }

  async sendFeatureAnnouncement(email: string, featureName: string, description: string, featureUrl: string) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `New Feature: ${featureName}`,
      body: this.getFeatureAnnouncementTemplate(featureName, description, featureUrl),
    });

    await this.plunk.trackEvent({
      event: 'feature.launched',
      email,
      data: { featureName }
    });
  }

  async sendPromotionalOffer(
    email: string,
    offerTitle: string,
    discount: number,
    expiryDate: string,
    offerUrl: string
  ) {
    await this.plunk.sendTransactionalEmail({
      to: email,
      subject: `Limited Time: ${offerTitle}`,
      body: this.getPromotionalOfferTemplate(offerTitle, discount, expiryDate, offerUrl),
    });

    await this.plunk.trackEvent({
      event: 'promo.discount.offer',
      email,
      data: { offerTitle, discount }
    });
  }

  // ============================================
  // EMAIL TEMPLATES (NO EMOJIS)
  // Brand Colors: #00876f, #0d7d72
  // ============================================

  private getEmailTemplate(content: string): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 40px 30px; text-align: center;">
      <a href="${this.baseUrl}" style="color: #ffffff; font-size: 28px; font-weight: bold; text-decoration: none; letter-spacing: -0.5px;">Preset</a>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 30px;">
      ${content}
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0 0 10px 0;">© 2025 Preset.ie - Creative Collaboration Platform</p>
      <p style="margin: 0;">
        <a href="${this.baseUrl}/settings/email-preferences" style="color: #00876f; text-decoration: none;">Email Preferences</a> | 
        <a href="${this.baseUrl}/unsubscribe" style="color: #00876f; text-decoration: none;">Unsubscribe</a>
      </p>
    </div>
    
  </div>
</body>
</html>
    `.trim();
  }

  private getButton(text: string, url: string, type: 'primary' | 'secondary' | 'success' = 'primary'): string {
    const styles = {
      primary: 'background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); color: #ffffff;',
      secondary: 'background: #ffffff; color: #00876f; border: 2px solid #00876f;',
      success: 'background: #10b981; color: #ffffff;'
    };

    return `<a href="${url}" style="display: inline-block; padding: 16px 32px; ${styles[type]} text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">${text}</a>`;
  }

  // ============================================
  // TEMPLATE METHODS (To be expanded)
  // ============================================

  private getWelcomeEmailTemplate(name: string, role: string, roleDescription: string): string {
    const content = `
      <h1 style="color: #1f2937; margin-bottom: 10px;">Welcome to Preset, ${name}</h1>
      <p style="color: #00876f; font-size: 18px; margin-top: 0;">Your creative collaboration starts here</p>
      
      <p style="color: #4b5563; line-height: 1.6;">We are excited to have you join our community of photographers, videographers, and creative talent.</p>
      
      <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 25px; border-radius: 12px; color: white; margin: 30px 0;">
        <h3 style="margin: 0 0 10px 0; color: white;">You are signed up as a ${role}</h3>
        <p style="margin: 0; opacity: 0.95;">${roleDescription}</p>
      </div>
      
      <h3 style="color: #1f2937; border-left: 4px solid #00876f; padding-left: 15px;">Get Started in 3 Steps</h3>
      <ol style="color: #4b5563; line-height: 1.8;">
        <li><strong style="color: #1f2937;">Complete your profile</strong> - Add photos, bio, and skills</li>
        <li><strong style="color: #1f2937;">${role === 'CONTRIBUTOR' ? 'Create your first gig' : 'Browse and apply to gigs'}</strong></li>
        <li><strong style="color: #1f2937;">Connect & create</strong> - Start collaborating!</li>
      </ol>
      
      <div style="text-align: center; margin: 35px 0;">
        ${this.getButton('Complete Your Profile', `${this.baseUrl}/profile/edit`)}
      </div>
      
      <p style="color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px;">Need help? Reply to this email or visit our Help Center.</p>
      
      <p style="color: #4b5563;">
        Best regards,<br>
        <strong style="color: #1f2937;">The Preset Team</strong>
      </p>
    `;

    return this.getEmailTemplate(content);
  }

  private getGigPublishedTemplate(gigDetails: GigDetails): string {
    const content = `
      <h1 style="color: #1f2937; margin-bottom: 10px;">Your Gig is Now Live</h1>
      <p style="color: #10b981; font-size: 18px; margin-top: 0;">Successfully published and visible to talent</p>
      
      <p style="color: #4b5563; line-height: 1.6;">Great news! Your gig "<strong style="color: #1f2937;">${gigDetails.title}</strong>" is now published and ready to receive applications.</p>
      
      <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 30px; border-radius: 12px; color: white; margin: 30px 0;">
        <h2 style="margin: 0 0 20px 0; color: white; font-size: 24px;">${gigDetails.title}</h2>
        <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
          <table cellpadding="8" cellspacing="0" style="color: white; width: 100%;">
            <tr>
              <td style="font-weight: 600; padding-right: 15px;">Location:</td>
              <td>${gigDetails.location}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; padding-right: 15px;">Shoot Date:</td>
              <td>${new Date(gigDetails.startTime).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="font-weight: 600; padding-right: 15px;">Compensation:</td>
              <td>${gigDetails.compType}</td>
            </tr>
          </table>
        </div>
      </div>
      
      <h3 style="color: #1f2937; border-left: 4px solid #00876f; padding-left: 15px;">What Happens Next</h3>
      <ol style="color: #4b5563; line-height: 1.8;">
        <li><strong style="color: #1f2937;">Talent start applying</strong> - You'll receive notifications for each application</li>
        <li><strong style="color: #1f2937;">Review applications</strong> - Check portfolios and shortlist favorites</li>
        <li><strong style="color: #1f2937;">Message & book</strong> - Chat with applicants and select your talent</li>
      </ol>
      
      <div style="text-align: center; margin: 35px 0;">
        ${this.getButton('View Your Gig', `${this.baseUrl}/gigs/${gigDetails.id}`)}
      </div>
      
      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h4 style="margin-top: 0; color: #1f2937;">Tips for Great Applications</h4>
        <ul style="color: #4b5563; line-height: 1.8; margin-bottom: 0;">
          <li>Respond to applications within 24 hours</li>
          <li>Ask questions to find the right fit</li>
          <li>Keep your communication professional and friendly</li>
        </ul>
      </div>
    `;

    return this.getEmailTemplate(content);
  }

  // Add placeholder methods for other templates
  private getEmailVerificationTemplate(url: string): string { return this.getEmailTemplate(`<h1>Verify Email</h1><p><a href="${url}">Verify Now</a></p>`); }
  private getPasswordResetTemplate(url: string): string { return this.getEmailTemplate(`<h1>Reset Password</h1><p><a href="${url}">Reset Now</a></p>`); }
  private getProfileCompletionTemplate(name: string, pct: number): string { return this.getEmailTemplate(`<h1>Complete Profile</h1><p>${name}, you're ${pct}% complete</p>`); }
  private getGigDraftTemplate(title: string, id: string): string { return this.getEmailTemplate(`<h1>Draft Saved</h1><p>${title} saved</p>`); }
  private getNewApplicationTemplate(gig: string, applicant: string, url: string): string { return this.getEmailTemplate(`<h1>New Application</h1><p>${applicant} applied to ${gig}</p>`); }
  private getApplicationMilestoneTemplate(gig: string, current: number, max: number, milestone: number): string { return this.getEmailTemplate(`<h1>Milestone</h1><p>${current}/${max} applications</p>`); }
  private getDeadlineApproachingTemplate(gig: string, id: string, count: number, hours: number): string { return this.getEmailTemplate(`<h1>Deadline Approaching</h1><p>${hours} hours left</p>`); }
  private getContributorBookingTemplate(talent: string, gig: GigDetails): string { return this.getEmailTemplate(`<h1>Talent Booked</h1><p>${talent} for ${gig.title}</p>`); }
  private getShootReminderTemplate(gig: GigDetails, collab: string): string { return this.getEmailTemplate(`<h1>Shoot Tomorrow</h1><p>${gig.title} with ${collab}</p>`); }
  private getApplicationSubmittedTemplate(gig: string, contributor: string, url: string): string { return this.getEmailTemplate(`<h1>Application Sent</h1><p>To ${contributor}</p>`); }
  private getApplicationShortlistedTemplate(gig: string, contributor: string): string { return this.getEmailTemplate(`<h1>Shortlisted</h1><p>For ${gig}</p>`); }
  private getTalentBookingTemplate(name: string, gig: GigDetails, contributor: string): string { return this.getEmailTemplate(`<h1>You're Booked</h1><p>${gig.title}</p>`); }
  private getApplicationDeclinedTemplate(gig: string, recommended: any[]): string { return this.getEmailTemplate(`<h1>Application Update</h1><p>${gig}</p>`); }
  private getApplicationLimitWarningTemplate(current: number, limit: number, tier: string): string { return this.getEmailTemplate(`<h1>Limit Approaching</h1><p>${current}/${limit}</p>`); }
  private getApplicationLimitReachedTemplate(tier: string, reset: string): string { return this.getEmailTemplate(`<h1>Limit Reached</h1><p>Resets ${reset}</p>`); }
  private getShowcaseApprovalTemplate(collab: string, gig: string, url: string): string { return this.getEmailTemplate(`<h1>Approve Showcase</h1><p>With ${collab}</p>`); }
  private getShowcasePublishedTemplate(name: string, collab: string, url: string): string { return this.getEmailTemplate(`<h1>Showcase Live</h1><p>With ${collab}</p>`); }
  private getShowcaseFeaturedTemplate(title: string, url: string): string { return this.getEmailTemplate(`<h1>Showcase Featured</h1><p>${title}</p>`); }
  private getNewMessageTemplate(sender: string, preview: string, gig: string, url: string): string { return this.getEmailTemplate(`<h1>New Message</h1><p>From ${sender}</p>`); }
  private getUnreadDigestTemplate(count: number, convos: any[]): string { return this.getEmailTemplate(`<h1>Unread Messages</h1><p>${count} unread</p>`); }
  private getReviewRequestTemplate(collab: string, gig: string, url: string): string { return this.getEmailTemplate(`<h1>Review Request</h1><p>${collab}</p>`); }
  private getReviewReceivedTemplate(reviewer: string, rating: number, gig: string): string { return this.getEmailTemplate(`<h1>New Review</h1><p>${rating} stars</p>`); }
  private getTrialStartedTemplate(tier: string, expiry: string): string { return this.getEmailTemplate(`<h1>Trial Started</h1><p>${tier} trial</p>`); }
  private getTrialEndingTemplate(tier: string, days: number): string { return this.getEmailTemplate(`<h1>Trial Ending</h1><p>${days} days left</p>`); }
  private getSubscriptionUpgradedTemplate(old: string, newTier: string): string { return this.getEmailTemplate(`<h1>Upgraded to ${newTier}</h1>`); }
  private getSubscriptionDowngradedTemplate(old: string, newTier: string): string { return this.getEmailTemplate(`<h1>Plan Changed</h1><p>Now on ${newTier}</p>`); }
  private getSubscriptionCancelledTemplate(tier: string, until: string): string { return this.getEmailTemplate(`<h1>Subscription Cancelled</h1><p>Access until ${until}</p>`); }
  private getSubscriptionRenewalTemplate(tier: string, days: number, amount: string): string { return this.getEmailTemplate(`<h1>Subscription Renewal</h1><p>In ${days} days</p>`); }
  private getPaymentFailedTemplate(tier: string, url: string): string { return this.getEmailTemplate(`<h1>Payment Issue</h1><p>Update payment method</p>`); }
  private getCreditsPurchasedTemplate(credits: number, amount: number, txId: string): string { return this.getEmailTemplate(`<h1>Credits Purchased</h1><p>${credits} credits added</p>`); }
  private getCreditsLowTemplate(balance: number, tier: string): string { return this.getEmailTemplate(`<h1>Credits Low</h1><p>${balance} remaining</p>`); }
  private getCreditsResetTemplate(balance: number, tier: string): string { return this.getEmailTemplate(`<h1>Credits Refreshed</h1><p>${balance} credits</p>`); }
  private getInactiveUserTemplate(name: string, days: number): string { return this.getEmailTemplate(`<h1>We Miss You</h1><p>${name}, come back!</p>`); }
  private getMilestoneTemplate(name: string, milestone: string, count: number): string { return this.getEmailTemplate(`<h1>Milestone Achieved</h1><p>${milestone}</p>`); }
  private getWeeklyReportTemplate(role: string, stats: any): string { return this.getEmailTemplate(`<h1>Weekly Report</h1><p>Your stats</p>`); }
  private getMonthlyReportTemplate(stats: any): string { return this.getEmailTemplate(`<h1>Monthly Review</h1><p>Your month</p>`); }
  private getRentalRequestTemplate(item: string, url: string): string { return this.getEmailTemplate(`<h1>Rental Request</h1><p>${item}</p>`); }
  private getRentalAcceptedTemplate(item: string, details: any): string { return this.getEmailTemplate(`<h1>Rental Accepted</h1><p>${item}</p>`); }
  private getPresetPurchasedTemplate(preset: string, url: string): string { return this.getEmailTemplate(`<h1>Preset Ready</h1><p>${preset}</p>`); }
  private getIDVerificationSubmittedTemplate(): string { return this.getEmailTemplate(`<h1>ID Submitted</h1><p>Under review</p>`); }
  private getIDVerificationApprovedTemplate(): string { return this.getEmailTemplate(`<h1>Verified</h1><p>Badge activated</p>`); }
  private getIDVerificationRejectedTemplate(reason: string): string { return this.getEmailTemplate(`<h1>Verification Issue</h1><p>${reason}</p>`); }
  private getAccountSuspendedTemplate(reason: string, duration: string): string { return this.getEmailTemplate(`<h1>Account Suspended</h1><p>${duration}</p>`); }
  private getTuesdayTipsTemplate(topic: string, tips: string[]): string { return this.getEmailTemplate(`<h1>Tuesday Tips: ${topic}</h1>`); }
  private getSuccessStoriesTemplate(stories: any[]): string { return this.getEmailTemplate(`<h1>Success Stories</h1>`); }
  private getFeatureAnnouncementTemplate(name: string, desc: string, url: string): string { return this.getEmailTemplate(`<h1>New Feature: ${name}</h1><p>${desc}</p>`); }
  private getPromotionalOfferTemplate(title: string, discount: number, expiry: string, url: string): string { return this.getEmailTemplate(`<h1>${title}</h1><p>${discount}% off</p>`); }
}

// Singleton instance
let emailEventsServiceInstance: EmailEventsService | null = null;

export function getEmailEventsService(): EmailEventsService {
  if (!emailEventsServiceInstance) {
    emailEventsServiceInstance = new EmailEventsService();
  }
  return emailEventsServiceInstance;
}

