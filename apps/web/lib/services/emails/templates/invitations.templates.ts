/**
 * Invitation Email Templates  
 * Gig invitations, collaboration invitations, team invites
 */

import { getEmailTemplate } from './shared.templates';

export function getGigInvitationTemplate(
  recipientName: string,
  inviterName: string,
  gigTitle: string,
  gigDetails: {
    location: string;
    date: string;
    compType: string;
    description: string;
  },
  inviteUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
          <path d="M21.99 4c0-1.1-.89-2-1.99-2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4-.01-18zM18 14H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">You're Personally Invited! 🎯</h1>
      <p style="color: #6b7280; font-size: 18px; margin: 0;">${inviterName} thinks you're perfect for this gig</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Personal Invitation</p>
        <h2 style="color: #1a1a1a; font-size: 26px; font-weight: 700; margin: 0; line-height: 1.3;">${gigTitle}</h2>
      </div>

      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-top: 20px;">
        <div style="display: grid; gap: 15px;">
          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="width: 24px; height: 24px; background-color: #f0fdf4; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="14" height="14" fill="#00876f" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
            <div>
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 3px 0; font-weight: 600;">Location</p>
              <p style="color: #1a1a1a; font-size: 15px; margin: 0;">${gigDetails.location}</p>
            </div>
          </div>

          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="width: 24px; height: 24px; background-color: #f0fdf4; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="14" height="14" fill="#00876f" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
            </div>
            <div>
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 3px 0; font-weight: 600;">Date</p>
              <p style="color: #1a1a1a; font-size: 15px; margin: 0;">${gigDetails.date}</p>
            </div>
          </div>

          <div style="display: flex; align-items: start; gap: 12px;">
            <div style="width: 24px; height: 24px; background-color: #f0fdf4; border-radius: 6px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
              <svg width="14" height="14" fill="#00876f" viewBox="0 0 24 24">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
              </svg>
            </div>
            <div>
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 3px 0; font-weight: 600;">Compensation</p>
              <p style="color: #1a1a1a; font-size: 15px; margin: 0;">${gigDetails.compType}</p>
            </div>
          </div>
        </div>
      </div>

      ${gigDetails.description ? `
        <div style="background-color: #f9fafb; border-left: 4px solid #00876f; padding: 15px; margin-top: 20px; border-radius: 4px;">
          <p style="color: #4b5563; font-size: 15px; margin: 0; font-style: italic;">"${gigDetails.description}"</p>
          <p style="color: #9ca3af; font-size: 13px; margin: 10px 0 0 0;">— ${inviterName}</p>
        </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 14px rgba(0, 135, 111, 0.4);">
        View Invitation & Apply
      </a>
    </div>

    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 20px; border-radius: 4px; margin-top: 30px;">
      <p style="color: #92400e; font-size: 14px; margin: 0;">
        <strong>💫 Why you?</strong> ${inviterName} reviewed your profile and thinks your style would be perfect for this project. This is a direct invitation - your application will get priority consideration!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getCollaborationInviteTemplate(
  recipientName: string,
  inviterName: string,
  inviterRole: 'photographer' | 'model' | 'creative',
  projectName: string,
  projectDescription: string,
  acceptUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const roleLabels = {
    photographer: 'Photographer',
    model: 'Model / Talent',
    creative: 'Creative'
  };

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Collaboration Invite</h1>
      <p style="color: #6b7280; font-size: 18px; margin: 0;">${inviterName} wants to work with you</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <div style="text-align: center; margin-bottom: 25px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0; text-transform: uppercase; font-weight: 600;">Project</p>
        <h2 style="color: #1a1a1a; font-size: 26px; font-weight: 700; margin: 0;">${projectName}</h2>
      </div>

      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
        <div style="display: flex; align-items: center; gap: 15px; margin-bottom: 15px;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 18px;">
            ${inviterName.charAt(0).toUpperCase()}
          </div>
          <div>
            <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0;">${inviterName}</p>
            <p style="color: #6b7280; font-size: 14px; margin: 3px 0 0 0;">${roleLabels[inviterRole]}</p>
          </div>
        </div>

        <div style="background-color: #f9fafb; padding: 15px; border-radius: 6px;">
          <p style="color: #4b5563; font-size: 15px; margin: 0; line-height: 1.6;">${projectDescription}</p>
        </div>
      </div>

      <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px;">
        <p style="color: #1e40af; font-size: 14px; margin: 0;">
          <strong>🤝 What's next?</strong> Accept this invitation to start collaborating. You'll be able to discuss project details, share ideas, and plan your creative session together.
        </p>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 14px rgba(0, 135, 111, 0.4);">
        Accept Invitation
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getTeamInviteTemplate(
  recipientName: string,
  inviterName: string,
  organizationName: string,
  role: string,
  acceptUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
          <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Team Invitation</h1>
      <p style="color: #6b7280; font-size: 18px; margin: 0;">Join ${organizationName} on Preset</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0; text-align: center;">
        ${inviterName} has invited you to join their team
      </p>

      <div style="background-color: #ffffff; border: 2px solid #00876f; border-radius: 10px; padding: 25px; text-align: center;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px 0; text-transform: uppercase; font-weight: 600;">Organization</p>
        <p style="color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 15px 0;">${organizationName}</p>
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Your Role</p>
        <p style="color: #00876f; font-size: 18px; font-weight: 600; margin: 0;">${role}</p>
      </div>

      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; margin-top: 20px;">
        <p style="color: #166534; font-size: 15px; margin: 0 0 10px 0; font-weight: 600;">As a team member, you'll be able to:</p>
        <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
          <li style="margin-bottom: 8px;">Access shared projects and gigs</li>
          <li style="margin-bottom: 8px;">Collaborate with team members</li>
          <li style="margin-bottom: 8px;">Manage team showcases</li>
          <li style="margin-bottom: 8px;">Represent ${organizationName} on the platform</li>
        </ul>
      </div>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${acceptUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 14px rgba(0, 135, 111, 0.4);">
        Join Team
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getInviteReminderTemplate(
  recipientName: string,
  inviterName: string,
  inviteType: 'gig' | 'collaboration' | 'team',
  itemName: string,
  daysRemaining: number,
  inviteUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const typeLabels = {
    gig: 'Gig Invitation',
    collaboration: 'Collaboration Invite',
    team: 'Team Invitation'
  };

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Invitation Pending</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Don't miss this opportunity!</p>
    </div>

    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">${typeLabels[inviteType]}</p>
      <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 15px 0;">${itemName}</p>
      <p style="color: #78716c; font-size: 15px; margin: 0;">from ${inviterName}</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0;">
        ⏰ ${daysRemaining} day${daysRemaining > 1 ? 's' : ''} remaining to respond
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
        This invitation will expire soon. Don't let this opportunity slip away!
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Respond to Invitation
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getInviteAcceptedTemplate(
  recipientName: string,
  accepterName: string,
  inviteType: 'gig' | 'collaboration' | 'team',
  itemName: string,
  nextStepsUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const typeLabels = {
    gig: 'Gig Invitation',
    collaboration: 'Collaboration',
    team: 'Team Invitation'
  };

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Invitation Accepted!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${accepterName} has accepted your invitation</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">${typeLabels[inviteType]}</p>
      <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0;">${itemName}</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 15px 0;">🎉 Great news!</p>
      <p style="color: #4b5563; font-size: 15px; margin: 0;">
        ${accepterName} has accepted your invitation. You can now start collaborating and planning your project together.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${nextStepsUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Start Collaborating
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>💬 Next step:</strong> Reach out via messages to discuss project details and coordinate your collaboration!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getInviteDeclinedTemplate(
  recipientName: string,
  declinerName: string,
  inviteType: 'gig' | 'collaboration' | 'team',
  itemName: string,
  reason?: string,
  browseUrl?: string,
  userEmail?: string,
  userId?: string
): string {
  const typeLabels = {
    gig: 'Gig Invitation',
    collaboration: 'Collaboration',
    team: 'Team Invitation'
  };

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Invitation Declined</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${declinerName} declined your invitation</p>
    </div>

    <div style="background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #991b1b; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">${typeLabels[inviteType]}</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0;">${itemName}</p>
      
      ${reason ? `
        <div style="background-color: #ffffff; border-left: 4px solid #ef4444; padding: 15px; margin-top: 15px; border-radius: 4px;">
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0; font-weight: 600;">Reason:</p>
          <p style="color: #4b5563; font-size: 15px; margin: 0;">${reason}</p>
        </div>
      ` : ''}
    </div>

    ${browseUrl ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${browseUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
          Find Other Talent
        </a>
      </div>
    ` : ''}

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
        Don't worry - there are plenty of talented creatives on Preset who would love to work with you!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

