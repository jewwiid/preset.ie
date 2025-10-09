/**
 * Gig Lifecycle Email Templates
 * Draft, published, applications, bookings, reminders
 */

import { getEmailTemplate, getButton, getInfoBox, getWarningBox, baseUrl } from './shared.templates';

interface GigDetails {
  id: string;
  title: string;
  location: string;
  startTime: string;
  endTime: string;
  compType: string;
  compDetails?: string;
}

export function getGigDraftTemplate(
  title: string,
  id: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">Your Gig is Saved as a Draft</h1>
    <p style="color: #00876f; font-size: 18px;">Ready to publish when you are</p>
    
    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 30px; border-radius: 12px; color: white; margin: 30px 0;">
      <h2 style="color: white; margin: 0;">${title}</h2>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">Your gig has been saved and is ready to publish whenever you are ready.</p>
    </div>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Edit & Publish', `${baseUrl}/gigs/${id}/edit`)}
    </div>
    
    <p style="color: #4b5563;">Take your time to refine the details and publish when ready.</p>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getGigPublishedTemplate(
  gigDetails: GigDetails,
  userEmail?: string,
  authUserId?: string
): string {
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
      <li><strong style="color: #1f2937;">Talent start applying</strong> - You will receive notifications for each application</li>
      <li><strong style="color: #1f2937;">Review applications</strong> - Check portfolios and shortlist favorites</li>
      <li><strong style="color: #1f2937;">Message & book</strong> - Chat with applicants and select your talent</li>
    </ol>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('View Your Gig', `${baseUrl}/gigs/${gigDetails.id}`)}
    </div>
    
    ${getInfoBox('Tips for Great Applications', `
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Respond to applications within 24 hours</li>
        <li>Ask questions to find the right fit</li>
        <li>Keep your communication professional and friendly</li>
      </ul>
    `)}
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getNewApplicationTemplate(
  gigTitle: string,
  applicantName: string,
  applicationUrl: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">New Application Received</h1>
    <p style="color: #10b981; font-size: 18px;">For your gig: ${gigTitle}</p>
    
    <p style="color: #4b5563;"><strong>${applicantName}</strong> has applied to your gig.</p>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('View Application', applicationUrl)}
      ${getButton('View Profile', applicationUrl, 'secondary')}
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getDeadlineApproachingTemplate(
  gigTitle: string,
  gigId: string,
  applicationCount: number,
  hoursRemaining: number,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">Application Deadline Approaching</h1>
    <p style="color: #f59e0b; font-size: 18px;">For: ${gigTitle}</p>
    
    ${getWarningBox('Deadline Alert', `Only ${hoursRemaining} hours remaining to receive applications`)}
    
    <p style="color: #4b5563;">Current applications: <strong>${applicationCount}</strong></p>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Review Applications', `${baseUrl}/gigs/${gigId}/applications`)}
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

// Export other gig-related templates...
export function getApplicationMilestoneTemplate(
  gigTitle: string,
  current: number,
  max: number,
  milestone: number,
  userEmail?: string,
  authUserId?: string
): string {
  return getEmailTemplate(
    `<h1>Application Milestone</h1><p>${gigTitle}: ${current}/${max} applications (${milestone}% full)</p>`,
    userEmail,
    authUserId
  );
}

export function getContributorBookingTemplate(
  talentName: string,
  gigDetails: GigDetails,
  userEmail?: string,
  authUserId?: string
): string {
  return getEmailTemplate(
    `<h1>Talent Booked</h1><p>You have booked ${talentName} for ${gigDetails.title}</p>`,
    userEmail,
    authUserId
  );
}

export function getShootReminderTemplate(
  gigDetails: GigDetails,
  collaboratorName: string,
  userEmail?: string,
  authUserId?: string
): string {
  return getEmailTemplate(
    `<h1>Shoot Reminder</h1><p>${gigDetails.title} with ${collaboratorName} tomorrow</p>`,
    userEmail,
    authUserId
  );
}
