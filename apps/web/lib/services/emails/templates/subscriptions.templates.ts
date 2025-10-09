/**
 * Subscription Email Templates
 * Trials, upgrades, downgrades, renewals, payments
 */

import { getEmailTemplate, getButton, getHighlightCard, getWarningBox, baseUrl } from './shared.templates';

export function getTrialStartedTemplate(tier: string, expiryDate: string): string {
  const content = `
    <h1 style="color: #1f2937;">Your ${tier} Trial Has Started</h1>
    <p style="color: #10b981; font-size: 18px;">Enjoy all premium features for 14 days</p>
    
    ${getHighlightCard(`Welcome to ${tier}`, `
      <p style="margin: 0;">Your trial is active until ${new Date(expiryDate).toLocaleDateString()}</p>
    `)}
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Explore Features', `${baseUrl}/dashboard`)}
    </div>
  `;

  return getEmailTemplate(content);
}

export function getTrialEndingTemplate(tier: string, daysRemaining: number): string {
  const content = `
    <h1 style="color: #1f2937;">Your Trial Ends in ${daysRemaining} Days</h1>
    
    ${getWarningBox('Trial Ending Soon', `Your ${tier} trial will end in ${daysRemaining} days`)}
    
    <p style="color: #4b5563;">Upgrade now to keep your premium features!</p>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Upgrade Now', `${baseUrl}/subscription/upgrade`)}
    </div>
  `;

  return getEmailTemplate(content);
}

export function getSubscriptionUpgradedTemplate(oldTier: string, newTier: string): string {
  const content = `
    <h1 style="color: #1f2937;">Welcome to Preset ${newTier}</h1>
    <p style="color: #10b981; font-size: 18px;">Your upgrade is complete</p>
    
    ${getHighlightCard(`Upgraded: ${oldTier} → ${newTier}`, `
      <p style="margin: 0;">You now have access to all ${newTier} features</p>
    `)}
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Explore New Features', `${baseUrl}/dashboard`)}
    </div>
  `;

  return getEmailTemplate(content);
}

export function getSubscriptionDowngradedTemplate(oldTier: string, newTier: string): string {
  return getEmailTemplate(`<h1>Plan Changed</h1><p>From ${oldTier} to ${newTier}</p>`);
}

export function getSubscriptionCancelledTemplate(tier: string, accessUntil: string): string {
  return getEmailTemplate(`<h1>Subscription Cancelled</h1><p>Access until ${accessUntil}</p>`);
}

export function getSubscriptionRenewalTemplate(tier: string, daysUntil: number, amount: string): string {
  return getEmailTemplate(`<h1>Subscription Renewal</h1><p>Renews in ${daysUntil} days for ${amount}</p>`);
}

export function getPaymentFailedTemplate(tier: string, retryUrl: string): string {
  return getEmailTemplate(`<h1>Payment Issue</h1><p>Update payment method</p>`);
}

