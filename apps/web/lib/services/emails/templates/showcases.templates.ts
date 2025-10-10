/**
 * Showcase Email Templates
 * Approvals, publishing, featuring
 */

import { getEmailTemplate } from './shared.templates';

export function getShowcaseApprovalRequestTemplate(
  recipientName: string,
  collaboratorName: string,
  gigTitle: string,
  showcaseUrl: string,
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
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Showcase Approval Needed</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${collaboratorName} wants to publish your collaboration</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Project</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">${gigTitle}</p>
      <p style="color: #6b7280; font-size: 15px; margin: 0 0 10px 0;">Collaborator: ${collaboratorName}</p>
      <p style="color: #4b5563; font-size: 14px; margin: 0;">Please review and approve the showcase before it goes live on both your portfolios.</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${showcaseUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin-right: 10px;">
        Review Showcase
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>💡 Tip:</strong> Make sure you're happy with how the work is presented before approving!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getShowcasePublishedTemplate(
  recipientName: string,
  collaboratorName: string,
  gigTitle: string,
  showcaseUrl: string,
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
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Showcase is Live!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Your collaboration is now visible on both portfolios</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Published Showcase</p>
      <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 10px 0;">${gigTitle}</p>
      <p style="color: #4b5563; font-size: 15px; margin: 0;">with ${collaboratorName}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${showcaseUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Showcase
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>🎉 Share it!</strong> Your showcase is now part of your public portfolio. Share it with your network!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getShowcaseFeaturedTemplate(
  recipientName: string,
  showcaseTitle: string,
  showcaseUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Featured Showcase! 🌟</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Your work has been selected as a featured showcase</p>
    </div>

    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Featured Showcase</p>
      <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 15px 0;">${showcaseTitle}</p>
      <p style="color: #4b5563; font-size: 15px; margin: 0;">Your showcase will be highlighted on the Preset homepage and in our newsletter!</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${showcaseUrl}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Featured Showcase
      </a>
    </div>

    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #166534; font-size: 14px; margin: 0;">
        <strong>🎊 Congratulations!</strong> Featured showcases get 10x more visibility. This is great exposure for your work!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

