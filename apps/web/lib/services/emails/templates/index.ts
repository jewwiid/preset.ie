/**
 * Email Templates Index
 * Central export for all email templates
 */

// Shared components
export * from './shared.templates';

// Onboarding templates
export * from './onboarding.templates';

// Gig lifecycle templates
export * from './gigs.templates';

// Application templates
export * from './applications.templates';

// Subscription templates
export * from './subscriptions.templates';

// Placeholder exports for other categories
// (These will be expanded as you build out full templates)

// Showcases
export function getShowcaseApprovalTemplate(collab: string, gig: string, url: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Approve Showcase</h1><p>With ${collab} for ${gig}</p>`);
}

export function getShowcasePublishedTemplate(name: string, collab: string, url: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Showcase Live</h1><p>${name}, your showcase with ${collab} is now live</p>`);
}

export function getShowcaseFeaturedTemplate(title: string, url: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Showcase Featured</h1><p>${title}</p>`);
}

// Messaging
export function getNewMessageTemplate(sender: string, preview: string, gig: string, url: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>New Message</h1><p>From ${sender}</p><p>"${preview}"</p>`);
}

export function getUnreadDigestTemplate(count: number, convos: any[]): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Unread Messages</h1><p>${count} unread conversations</p>`);
}

// Reviews
export function getReviewRequestTemplate(collab: string, gig: string, url: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Review Request</h1><p>How was your experience with ${collab}?</p>`);
}

export function getReviewReceivedTemplate(reviewer: string, rating: number, gig: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>New Review</h1><p>${reviewer} left you a ${rating}-star review for ${gig}</p>`);
}

// Credits
export function getCreditsPurchasedTemplate(credits: number, amount: number, txId: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Credits Purchased</h1><p>${credits} credits added for $${(amount / 100).toFixed(2)}</p>`);
}

export function getCreditsLowTemplate(balance: number, tier: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Credits Running Low</h1><p>${balance} credits remaining</p>`);
}

export function getCreditsResetTemplate(balance: number, tier: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Credits Refreshed</h1><p>${balance} credits added to your account</p>`);
}

// Engagement
export function getInactiveUserTemplate(name: string, daysInactive: number): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>We Miss You</h1><p>${name}, come back to Preset!</p>`);
}

export function getMilestoneTemplate(name: string, milestone: string, count: number): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Milestone Achieved</h1><p>${name}, you reached: ${milestone}</p>`);
}

export function getWeeklyReportTemplate(role: string, stats: any): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Weekly Report</h1><p>Your ${role} stats</p>`);
}

export function getMonthlyReportTemplate(stats: any): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Monthly Review</h1><p>Your month on Preset</p>`);
}

// Marketplace
export function getRentalRequestTemplate(item: string, url: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Rental Request</h1><p>Request sent for ${item}</p>`);
}

export function getRentalAcceptedTemplate(item: string, details: any): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Rental Accepted</h1><p>Your request for ${item} was accepted</p>`);
}

export function getPresetPurchasedTemplate(preset: string, url: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Preset Ready</h1><p>${preset} is ready to download</p>`);
}

// Safety & Trust
export function getIDVerificationSubmittedTemplate(): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>ID Verification Submitted</h1><p>Your ID is under review</p>`);
}

export function getIDVerificationApprovedTemplate(): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>You Are Now Verified</h1><p>Verification badge activated</p>`);
}

export function getIDVerificationRejectedTemplate(reason: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>ID Verification Issue</h1><p>${reason}</p>`);
}

export function getAccountSuspendedTemplate(reason: string, duration: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Account Suspended</h1><p>Duration: ${duration}</p>`);
}

// Educational
export function getTuesdayTipsTemplate(topic: string, tips: string[]): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Tuesday Tips: ${topic}</h1><ul>${tips.map(t => `<li>${t}</li>`).join('')}</ul>`);
}

export function getSuccessStoriesTemplate(stories: any[]): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Community Success Stories</h1><p>${stories.length} stories this month</p>`);
}

export function getFeatureAnnouncementTemplate(name: string, desc: string, url: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>New Feature: ${name}</h1><p>${desc}</p>`);
}

export function getPromotionalOfferTemplate(title: string, discount: number, expiry: string, url: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>${title}</h1><p>${discount}% off until ${expiry}</p>`);
}

