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

// Messaging templates
export * from './messaging.templates';

// Showcase templates
export * from './showcases.templates';

// Review templates
export * from './reviews.templates';

// Credits templates
export * from './credits.templates';

// Marketplace templates
export * from './marketplace.templates';

// Engagement templates
export * from './engagement.templates';

// Collaboration templates
export * from './collaborations.templates';

// Invitation templates
export * from './invitations.templates';

// Discovery templates
export * from './discovery.templates';

// Safety & Trust (placeholders - to be expanded)
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

// Educational (placeholders - to be expanded)
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

// Engagement & Digest templates (placeholders - to be expanded)
export function getUnreadDigestTemplate(unreadCount: number, conversations: any[]): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>You have ${unreadCount} unread messages</h1><p>Check your conversations</p>`);
}

export function getInactiveUserTemplate(name: string, daysInactive: number): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>We miss you, ${name}!</h1><p>It's been ${daysInactive} days since your last visit</p>`);
}

export function getMilestoneTemplate(name: string, milestone: string, count: number): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Congratulations, ${name}! 🎉</h1><p>You've reached ${milestone}: ${count}</p>`);
}

export function getWeeklyReportTemplate(role: string, stats: any): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Your Weekly Report</h1><p>Here's what happened this week</p>`);
}

export function getMonthlyReportTemplate(stats: any): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Your Monthly Report</h1><p>Here's your monthly summary</p>`);
}

// Marketplace templates (placeholders - to be expanded)
export function getRentalRequestTemplate(itemName: string, requestUrl: string): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Rental Request for ${itemName}</h1><p><a href="${requestUrl}">View Request</a></p>`);
}

export function getRentalAcceptedTemplate(itemName: string, pickupDetails: any): string {
  const { getEmailTemplate } = require('./shared.templates');
  return getEmailTemplate(`<h1>Rental Request Accepted</h1><p>Your request for ${itemName} was accepted</p>`);
}

