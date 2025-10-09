/**
 * Application Email Templates
 * Submitted, shortlisted, accepted, declined, limits
 */

import { getEmailTemplate, getButton, getSuccessBox, getWarningBox, baseUrl } from './shared.templates';

interface GigDetails {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  compType: string;
}

export function getApplicationSubmittedTemplate(
  gigTitle: string,
  contributorName: string,
  gigUrl: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">Application Sent</h1>
    <p style="color: #10b981; font-size: 18px;">Your application has been submitted successfully</p>
    
    ${getSuccessBox('Application Details', `
      <strong>Gig:</strong> ${gigTitle}<br>
      <strong>Contributor:</strong> ${contributorName}
    `)}
    
    <h3 style="color: #1f2937; border-left: 4px solid #00876f; padding-left: 15px;">What Happens Next</h3>
    <ol style="color: #4b5563; line-height: 1.8;">
      <li>The contributor will review your application</li>
      <li>You may be shortlisted for further consideration</li>
      <li>You will be notified of the outcome</li>
    </ol>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('View Gig', gigUrl)}
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">Expected response: Within 3-5 days</p>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getApplicationShortlistedTemplate(
  gigTitle: string,
  contributorName: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">You Have Been Shortlisted</h1>
    <p style="color: #10b981; font-size: 18px;">Great news!</p>
    
    <p style="color: #4b5563;"><strong>${contributorName}</strong> has shortlisted you for <strong>${gigTitle}</strong>.</p>
    
    ${getSuccessBox('Next Steps', 'The contributor may reach out to you with more details or questions. Keep an eye on your messages!')}
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getTalentBookingTemplate(
  name: string,
  gigDetails: GigDetails,
  contributorName: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">Congratulations! You Are Booked</h1>
    <p style="color: #10b981; font-size: 18px;">You have been selected for this gig</p>
    
    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px; color: white; margin: 30px 0;">
      <h2 style="margin: 0 0 20px 0; color: white;">Shoot Details</h2>
      <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 8px;">
        <table cellpadding="8" cellspacing="0" style="color: white; width: 100%;">
          <tr>
            <td style="font-weight: 600;">Gig:</td>
            <td>${gigDetails.title}</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Contributor:</td>
            <td>${contributorName}</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Date:</td>
            <td>${new Date(gigDetails.startTime).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Location:</td>
            <td>${gigDetails.location}</td>
          </tr>
        </table>
      </div>
    </div>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Message ' + contributorName, `${baseUrl}/messages`)}
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getApplicationDeclinedTemplate(
  gigTitle: string,
  recommendedGigs: any[],
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">Application Update</h1>
    <p style="color: #4b5563;">Thank you for your interest in <strong>${gigTitle}</strong>.</p>
    
    <p style="color: #4b5563; line-height: 1.6;">Unfortunately, the contributor has selected another applicant for this gig. We encourage you to continue applying to other opportunities!</p>
    
    <h3 style="color: #1f2937; border-left: 4px solid #00876f; padding-left: 15px;">Recommended Gigs</h3>
    <p style="color: #4b5563;">Check out these gigs that match your profile:</p>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Browse Gigs', `${baseUrl}/gigs`)}
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getApplicationLimitWarningTemplate(
  currentCount: number,
  limit: number,
  tier: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">Application Limit Approaching</h1>
    
    ${getWarningBox('Monthly Limit', `You have used ${currentCount} of ${limit} applications this month`)}
    
    <p style="color: #4b5563;">Upgrade to Plus for unlimited applications!</p>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Upgrade to Plus', `${baseUrl}/subscription/upgrade`)}
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getApplicationLimitReachedTemplate(
  tier: string,
  resetDate: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">Monthly Application Limit Reached</h1>
    
    ${getWarningBox('Limit Reached', `You have reached your monthly application limit for the ${tier} tier`)}
    
    <p style="color: #4b5563;">Your limit will reset on <strong>${resetDate}</strong>.</p>
    
    <h3 style="color: #1f2937;">Want to apply to more gigs?</h3>
    <p style="color: #4b5563;">Upgrade to Plus for unlimited applications and more features.</p>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Upgrade Now', `${baseUrl}/subscription/upgrade`)}
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}
