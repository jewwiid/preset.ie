/**
 * Collaboration & Project Email Templates
 * Gig completion, showcases, mutual approvals, project updates
 */

import { getEmailTemplate } from './shared.templates';

export function getGigCompletedTemplate(
  recipientName: string,
  collaboratorName: string,
  gigTitle: string,
  uploadMediaUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Gig Completed!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Great work with ${collaboratorName}</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Completed Gig</p>
      <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 15px 0;">${gigTitle}</p>
      <p style="color: #4b5563; font-size: 15px; margin: 0;">Now it's time to create your showcase and share your work!</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">Next Steps:</p>
      <ol style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
        <li style="margin-bottom: 10px;">Upload 3-6 of your best photos from the shoot</li>
        <li style="margin-bottom: 10px;">Both you and ${collaboratorName} will approve the selections</li>
        <li style="margin-bottom: 10px;">Once approved, the showcase will appear on both your portfolios</li>
      </ol>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${uploadMediaUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Upload Media
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>💡 Tip:</strong> High-quality showcases attract more opportunities! Choose your best work.
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getCollaboratorInviteTemplate(
  recipientName: string,
  inviterName: string,
  gigTitle: string,
  gigUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">You're Invited!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${inviterName} wants to collaborate with you</p>
    </div>

    <div style="background-color: #f9fafb; border-left: 4px solid #00876f; padding: 20px; margin: 30px 0; border-radius: 8px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Gig Invitation</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 10px 0;">${gigTitle}</p>
      <p style="color: #4b5563; font-size: 15px; margin: 0;">You've been personally invited to apply for this opportunity.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${gigUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Gig & Apply
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>🎯 Personal Invite:</strong> ${inviterName} thinks you'd be perfect for this gig!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getProjectUpdateTemplate(
  recipientName: string,
  updaterName: string,
  gigTitle: string,
  updateType: 'schedule_change' | 'location_change' | 'requirements_update' | 'general_update',
  updateMessage: string,
  gigUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const updateTitles = {
    schedule_change: 'Schedule Update',
    location_change: 'Location Change',
    requirements_update: 'Requirements Updated',
    general_update: 'Project Update'
  };

  const updateIcons = {
    schedule_change: '📅',
    location_change: '📍',
    requirements_update: '📋',
    general_update: '📢'
  };

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 60px; margin-bottom: 15px;">${updateIcons[updateType]}</div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">${updateTitles[updateType]}</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${updaterName} updated the gig details</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Gig</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 20px 0;">${gigTitle}</p>
      
      <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 4px;">
        <p style="color: #92400e; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">What Changed:</p>
        <p style="color: #78716c; font-size: 15px; margin: 0;">${updateMessage}</p>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${gigUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Updated Gig
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>📬 Stay Updated:</strong> Make sure the new details work for you before the shoot!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getCollaborationCancelledTemplate(
  recipientName: string,
  cancellerName: string,
  gigTitle: string,
  reason: string,
  browseGigsUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Collaboration Cancelled</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${cancellerName} has cancelled the gig</p>
    </div>

    <div style="background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #991b1b; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Cancelled Gig</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">${gigTitle}</p>
      
      ${reason ? `
        <div style="background-color: #ffffff; border-left: 4px solid #ef4444; padding: 15px; margin-top: 15px; border-radius: 4px;">
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0; font-weight: 600;">Reason:</p>
          <p style="color: #4b5563; font-size: 15px; margin: 0;">${reason}</p>
        </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${browseGigsUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Browse Other Gigs
      </a>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
        Don't worry - there are plenty of other exciting opportunities waiting for you!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getShowcaseUploadReminderTemplate(
  recipientName: string,
  collaboratorName: string,
  gigTitle: string,
  daysRemaining: number,
  uploadUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Don't Forget Your Showcase!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Time to upload your best shots</p>
    </div>

    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Completed Gig</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 10px 0;">${gigTitle}</p>
      <p style="color: #78716c; font-size: 15px; margin: 0;">with ${collaboratorName}</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">⏰ You have ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left to upload!</p>
      <p style="color: #4b5563; font-size: 14px; margin: 0;">Upload 3-6 of your best photos to create a showcase. Once both you and ${collaboratorName} approve, it'll appear on your portfolios.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${uploadUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Upload Now
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>💡 Pro Tip:</strong> Showcases significantly boost your profile visibility. Don't miss out!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getCollaboratorMediaUploadedTemplate(
  recipientName: string,
  uploaderName: string,
  gigTitle: string,
  mediaCount: number,
  reviewUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Media Uploaded!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${uploaderName} has uploaded ${mediaCount} photo${mediaCount > 1 ? 's' : ''}</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">For Gig</p>
      <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 10px 0;">${gigTitle}</p>
      <p style="color: #4b5563; font-size: 15px; margin: 0;">${uploaderName} has selected their favorite shots. Now it's your turn to upload yours!</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Upload Your Photos
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>📸 Remember:</strong> Upload 3-6 of your best shots. Both of you need to approve before the showcase goes live!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

