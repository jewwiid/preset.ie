/**
 * Discovery & Engagement Email Templates
 * Gig matches, profile views, followers, recommendations
 */

import { getEmailTemplate } from './shared.templates';

export function getNewGigMatchTemplate(
  recipientName: string,
  matchScore: number,
  gigTitle: string,
  gigDetails: {
    location: string;
    date: string;
    compType: string;
    contributorName: string;
  },
  gigUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const matchPercentage = Math.round(matchScore * 100);
  const matchColor = matchPercentage >= 90 ? '#10b981' : matchPercentage >= 75 ? '#00876f' : '#f59e0b';

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Perfect Match Found! 🎯</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">We found a gig that matches your profile</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 100px; height: 100px; margin: 0 auto 15px; position: relative;">
          <svg viewBox="0 0 100 100" style="transform: rotate(-90deg);">
            <circle cx="50" cy="50" r="45" fill="none" stroke="#e5e7eb" stroke-width="10"/>
            <circle cx="50" cy="50" r="45" fill="none" stroke="${matchColor}" stroke-width="10"
                    stroke-dasharray="${matchPercentage * 2.83} 283"
                    stroke-linecap="round"/>
          </svg>
          <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;">
            <p style="color: ${matchColor}; font-size: 24px; font-weight: 800; margin: 0; line-height: 1;">${matchPercentage}%</p>
            <p style="color: #6b7280; font-size: 11px; margin: 2px 0 0 0; font-weight: 600;">MATCH</p>
          </div>
        </div>
      </div>

      <h2 style="color: #1a1a1a; font-size: 22px; font-weight: 700; text-align: center; margin: 0 0 20px 0;">${gigTitle}</h2>

      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
        <div style="display: grid; gap: 12px;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="18" height="18" fill="#00876f" viewBox="0 0 24 24">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            </svg>
            <span style="color: #4b5563; font-size: 14px;">${gigDetails.location}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="18" height="18" fill="#00876f" viewBox="0 0 24 24">
              <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"/>
            </svg>
            <span style="color: #4b5563; font-size: 14px;">${gigDetails.date}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="18" height="18" fill="#00876f" viewBox="0 0 24 24">
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
            </svg>
            <span style="color: #4b5563; font-size: 14px;">${gigDetails.compType}</span>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <svg width="18" height="18" fill="#00876f" viewBox="0 0 24 24">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
            </svg>
            <span style="color: #4b5563; font-size: 14px;">${gigDetails.contributorName}</span>
          </div>
        </div>
      </div>
    </div>

    <div style="background-color: #eff6ff; border-left: 4px solid #00876f; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">Why this is a great match:</p>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
        <li style="margin-bottom: 5px;">Matches your style and experience</li>
        <li style="margin-bottom: 5px;">Location is in your preferred area</li>
        <li style="margin-bottom: 5px;">Compatible with your schedule</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 40px 0;">
      <a href="${gigUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 14px rgba(0, 135, 111, 0.4);">
        View Gig & Apply
      </a>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-top: 30px; text-align: center;">
      <p style="color: #6b7280; font-size: 13px; margin: 0;">
        <strong>💡 Pro Tip:</strong> High-match gigs have better booking rates. Apply early for the best chance!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getProfileViewedTemplate(
  recipientName: string,
  viewerName: string,
  viewerRole: 'CONTRIBUTOR' | 'TALENT' | 'BOTH',
  viewCount: number,
  profileUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const roleLabels = {
    CONTRIBUTOR: 'Photographer',
    TALENT: 'Talent',
    BOTH: 'Creative Professional'
  };

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Someone Viewed Your Profile!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${viewerName} checked out your work</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 10px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 24px;">
          ${viewerName.charAt(0).toUpperCase()}
        </div>
        <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0;">${viewerName}</p>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">${roleLabels[viewerRole]}</p>
      </div>

      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Total Profile Views This Week</p>
        <p style="color: #1a1a1a; font-size: 42px; font-weight: 800; margin: 0; line-height: 1;">${viewCount}</p>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${profileUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Your Profile
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>📈 Growing:</strong> More profile views mean more opportunities. Keep your portfolio updated!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getNewFollowerTemplate(
  recipientName: string,
  followerName: string,
  followerRole: 'CONTRIBUTOR' | 'TALENT' | 'BOTH',
  followerBio: string,
  followerCount: number,
  followerProfileUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const roleLabels = {
    CONTRIBUTOR: 'Photographer',
    TALENT: 'Talent',
    BOTH: 'Creative Professional'
  };

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">New Follower!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${followerName} is now following you</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 32px;">
          ${followerName.charAt(0).toUpperCase()}
        </div>
        <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0;">${followerName}</p>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">${roleLabels[followerRole]}</p>
      </div>

      ${followerBio ? `
        <div style="background-color: #ffffff; border-radius: 8px; padding: 15px; margin-top: 15px;">
          <p style="color: #4b5563; font-size: 14px; margin: 0; font-style: italic; text-align: center;">"${followerBio}"</p>
        </div>
      ` : ''}

      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; margin-top: 20px; text-align: center;">
        <p style="color: #166534; font-size: 14px; margin: 0 0 5px 0; font-weight: 600;">Total Followers</p>
        <p style="color: #1a1a1a; font-size: 32px; font-weight: 800; margin: 0; line-height: 1;">${followerCount}</p>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${followerProfileUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Their Profile
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>🌟 Tip:</strong> Follow them back to stay connected and build your network!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getGigExpiringTemplate(
  contributorName: string,
  gigTitle: string,
  hoursRemaining: number,
  applicationCount: number,
  gigUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const urgencyColor = hoursRemaining <= 6 ? '#ef4444' : hoursRemaining <= 24 ? '#f59e0b' : '#00876f';

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor === '#ef4444' ? '#dc2626' : urgencyColor === '#f59e0b' ? '#d97706' : '#00a389'} 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Application Deadline Soon!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Your gig's application window is closing</p>
    </div>

    <div style="background-color: ${urgencyColor === '#ef4444' ? '#fef2f2' : urgencyColor === '#f59e0b' ? '#fffbeb' : '#f0fdf4'}; border: 2px solid ${urgencyColor === '#ef4444' ? '#fca5a5' : urgencyColor === '#f59e0b' ? '#fbbf24' : '#86efac'}; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
      <p style="color: ${urgencyColor === '#ef4444' ? '#991b1b' : urgencyColor === '#f59e0b' ? '#92400e' : '#166534'}; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Time Remaining</p>
      <p style="color: #1a1a1a; font-size: 48px; font-weight: 800; margin: 0; line-height: 1;">${hoursRemaining}h</p>
      <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">until application deadline</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Your Gig</p>
      <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 20px 0;">${gigTitle}</p>
      
      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px;">
        <p style="color: #00876f; font-size: 36px; font-weight: 800; margin: 0;">${applicationCount}</p>
        <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Application${applicationCount !== 1 ? 's' : ''} received</p>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${gigUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Review Applications
      </a>
    </div>

    ${hoursRemaining <= 6 ? `
      <div style="background-color: #fef2f2; border-radius: 8px; padding: 15px; margin-top: 30px;">
        <p style="color: #991b1b; font-size: 14px; margin: 0; text-align: center;">
          <strong>⚠️ Urgent:</strong> Less than ${hoursRemaining} hours left! Review applications and make your selections now.
        </p>
      </div>
    ` : `
      <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
        <p style="color: #1e40af; font-size: 14px; margin: 0; text-align: center;">
          <strong>💡 Tip:</strong> Review applications early to have first pick of the best talent!
        </p>
      </div>
    `}
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getApplicationViewedTemplate(
  talentName: string,
  contributorName: string,
  gigTitle: string,
  viewedAt: string,
  gigUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Application Viewed!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${contributorName} is reviewing your application</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <div style="text-align: center;">
        <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Application for</p>
        <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 15px 0;">${gigTitle}</p>
        <p style="color: #6b7280; font-size: 15px; margin: 0;">Viewed by ${contributorName}</p>
        <p style="color: #9ca3af; font-size: 13px; margin: 5px 0 0 0;">${viewedAt}</p>
      </div>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 10px 0; text-align: center;">What happens next?</p>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
        <li style="margin-bottom: 8px;">The contributor is reviewing your profile and application</li>
        <li style="margin-bottom: 8px;">You may be shortlisted or contacted for more details</li>
        <li style="margin-bottom: 8px;">You'll receive an update when a decision is made</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${gigUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Gig
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>📊 Good sign!</strong> Your application is being actively considered. Stay tuned for updates!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getApplicationWithdrawnTemplate(
  contributorName: string,
  talentName: string,
  gigTitle: string,
  reason: string,
  browseUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Application Withdrawn</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${talentName} withdrew their application</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">For Gig</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">${gigTitle}</p>
      
      ${reason ? `
        <div style="background-color: #ffffff; border-left: 4px solid #6b7280; padding: 15px; margin-top: 15px; border-radius: 4px;">
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0; font-weight: 600;">Reason:</p>
          <p style="color: #4b5563; font-size: 15px; margin: 0;">${reason}</p>
        </div>
      ` : ''}
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${browseUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Browse Other Applicants
      </a>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #6b7280; font-size: 14px; margin: 0; text-align: center;">
        Don't worry - you still have other applicants to review!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getGigEndingSoonTemplate(
  recipientName: string,
  gigTitle: string,
  hoursUntilStart: number,
  location: string,
  collaboratorName: string,
  gigUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Your Shoot is Tomorrow!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Final reminder for your upcoming gig</p>
    </div>

    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 30px; margin: 30px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Starting in</p>
        <p style="color: #1a1a1a; font-size: 48px; font-weight: 800; margin: 0; line-height: 1;">${hoursUntilStart}h</p>
      </div>

      <div style="background-color: #ffffff; border-radius: 8px; padding: 20px; margin-top: 20px;">
        <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0; text-align: center;">${gigTitle}</p>
        <div style="border-top: 1px solid #e5e7eb; padding-top: 15px;">
          <div style="margin-bottom: 10px;">
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 3px 0;">Location</p>
            <p style="color: #1a1a1a; font-size: 15px; margin: 0; font-weight: 600;">${location}</p>
          </div>
          <div>
            <p style="color: #6b7280; font-size: 13px; margin: 0 0 3px 0;">Collaborating with</p>
            <p style="color: #1a1a1a; font-size: 15px; margin: 0; font-weight: 600;">${collaboratorName}</p>
          </div>
        </div>
      </div>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 12px 0;">📋 Pre-Shoot Checklist:</p>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
        <li style="margin-bottom: 8px;">Confirm location and arrival time</li>
        <li style="margin-bottom: 8px;">Prepare your equipment</li>
        <li style="margin-bottom: 8px;">Review safety notes and requirements</li>
        <li style="margin-bottom: 8px;">Bring valid ID and signed release forms</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${gigUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Gig Details
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>💬 Last minute questions?</strong> Message ${collaboratorName} if you need any clarifications!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getShowcaseSubmittedTemplate(
  recipientName: string,
  submitterName: string,
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
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Showcase Submitted for Review</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${submitterName} submitted ${mediaCount} photos for approval</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">From Gig</p>
      <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 20px 0;">${gigTitle}</p>
      
      <div style="background-color: #f0fdf4; border-radius: 8px; padding: 20px; text-align: center;">
        <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">Photos Submitted</p>
        <p style="color: #1a1a1a; font-size: 42px; font-weight: 800; margin: 0; line-height: 1;">${mediaCount}</p>
        <p style="color: #6b7280; font-size: 13px; margin: 10px 0 0 0;">Ready for your review</p>
      </div>
    </div>

    <div style="background-color: #eff6ff; border-left: 4px solid #00876f; padding: 20px; margin: 30px 0; border-radius: 4px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">⏰ Action Required:</p>
      <p style="color: #4b5563; font-size: 14px; margin: 0;">Review and approve the photos so the showcase can go live on both your portfolios!</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${reviewUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Review Photos
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getSystemUpdateTemplate(
  recipientName: string,
  updateTitle: string,
  updateDescription: string,
  features: Array<{ title: string; description: string }>,
  changelogUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const featuresList = features.slice(0, 3).map(feature => `
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 12px;">
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">${feature.title}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">${feature.description}</p>
    </div>
  `).join('');

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Platform Update 🚀</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">New features and improvements</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="color: #1a1a1a; font-size: 24px; font-weight: 700; margin: 0 0 10px 0;">${updateTitle}</p>
      <p style="color: #4b5563; font-size: 15px; margin: 0;">${updateDescription}</p>
    </div>

    ${features.length > 0 ? `
      <div style="margin: 30px 0;">
        <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">What's New:</p>
        ${featuresList}
      </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${changelogUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Full Changelog
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>📣 Feedback?</strong> We'd love to hear your thoughts on these updates!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

