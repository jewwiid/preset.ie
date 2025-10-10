/**
 * Engagement Email Templates
 * Weekly reports, tips, milestones, re-engagement
 */

import { getEmailTemplate } from './shared.templates';

export function getWeeklyDigestTemplate(
  recipientName: string,
  role: 'TALENT' | 'CONTRIBUTOR' | 'BOTH',
  stats: {
    newGigs?: number;
    applications?: number;
    messages?: number;
    profileViews?: number;
    showcases?: number;
  },
  highlights: Array<{ title: string; description: string; url: string }>,
  userEmail?: string,
  userId?: string
): string {
  const roleGreeting = {
    TALENT: 'Your week as Talent',
    CONTRIBUTOR: 'Your week as Contributor',
    BOTH: 'Your week on Preset'
  };

  const statsList = Object.entries(stats)
    .filter(([_, value]) => value && value > 0)
    .map(([key, value]) => {
      const labels: Record<string, string> = {
        newGigs: 'New Gigs Available',
        applications: 'Applications Submitted',
        messages: 'Messages Exchanged',
        profileViews: 'Profile Views',
        showcases: 'Showcases Published'
      };
      return `
        <div style="flex: 1; text-align: center; padding: 15px;">
          <p style="color: #00876f; font-size: 32px; font-weight: 800; margin: 0;">${value}</p>
          <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">${labels[key]}</p>
        </div>
      `;
    }).join('');

  const highlightsList = highlights.slice(0, 3).map(item => `
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${item.title}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">${item.description}</p>
      <a href="${item.url}" style="color: #00876f; text-decoration: none; font-weight: 600; font-size: 14px;">View →</a>
    </div>
  `).join('');

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Your Weekly Digest</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${roleGreeting[role]}</p>
    </div>

    ${statsList ? `
      <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 20px 0; text-align: center; text-transform: uppercase; font-weight: 600;">This Week's Stats</p>
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
          ${statsList}
        </div>
      </div>
    ` : ''}

    ${highlights.length > 0 ? `
      <div style="margin: 30px 0;">
        <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 20px 0;">This Week's Highlights</p>
        ${highlightsList}
      </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Go to Dashboard
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getTuesdayTipsTemplate(
  recipientName: string,
  topic: string,
  tips: Array<{ title: string; description: string }>,
  userEmail?: string,
  userId?: string
): string {
  const tipsList = tips.map((tip, index) => `
    <div style="background-color: #f9fafb; border-left: 4px solid #00876f; padding: 20px; margin-bottom: 20px; border-radius: 4px;">
      <p style="color: #00876f; font-size: 14px; font-weight: 700; margin: 0 0 8px 0;">TIP ${index + 1}</p>
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 10px 0;">${tip.title}</p>
      <p style="color: #4b5563; font-size: 14px; margin: 0;">${tip.description}</p>
    </div>
  `).join('');

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Tuesday Tips 💡</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">${topic}</p>
    </div>

    <div style="margin: 30px 0;">
      ${tipsList}
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 20px; margin-top: 30px; text-align: center;">
      <p style="color: #1e40af; font-size: 15px; margin: 0;">
        <strong>Want more tips?</strong> Follow us on social media for daily advice and inspiration!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getInactiveUserReengagementTemplate(
  recipientName: string,
  daysInactive: number,
  personalizedContent: {
    newGigs?: number;
    newFeatures?: string[];
    recommendedGigs?: Array<{ title: string; url: string }>;
  },
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">We Miss You, ${recipientName}! 👋</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">It's been ${daysInactive} days since you last visited</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Here's what you've missed:</p>
      
      ${personalizedContent.newGigs ? `
        <div style="margin-bottom: 15px;">
          <p style="color: #00876f; font-size: 24px; font-weight: 700; margin: 0;">${personalizedContent.newGigs}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">New gigs matching your profile</p>
        </div>
      ` : ''}

      ${personalizedContent.newFeatures && personalizedContent.newFeatures.length > 0 ? `
        <div style="margin-top: 20px; border-top: 1px solid #e5e7eb; padding-top: 15px;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; font-weight: 600;">New Features:</p>
          <ul style="margin: 0; padding-left: 20px; color: #4b5563; font-size: 14px;">
            ${personalizedContent.newFeatures.map(feature => `<li style="margin-bottom: 5px;">${feature}</li>`).join('')}
          </ul>
        </div>
      ` : ''}
    </div>

    ${personalizedContent.recommendedGigs && personalizedContent.recommendedGigs.length > 0 ? `
      <div style="margin: 30px 0;">
        <p style="color: #1a1a1a; font-size: 18px; font-weight: 600; margin: 0 0 15px 0;">Perfect Gigs for You:</p>
        ${personalizedContent.recommendedGigs.map(gig => `
          <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
            <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 8px 0;">${gig.title}</p>
            <a href="${gig.url}" style="color: #00876f; text-decoration: none; font-weight: 600; font-size: 14px;">View Gig →</a>
          </div>
        `).join('')}
      </div>
    ` : ''}

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Welcome Back
      </a>
    </div>

    <div style="background-color: #fffbeb; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #92400e; font-size: 14px; margin: 0; text-align: center;">
        <strong>Limited time:</strong> Come back within 7 days and get 50 bonus credits!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getMilestoneAchievedTemplate(
  recipientName: string,
  milestone: string,
  value: number,
  badge?: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      ${badge ? `
        <div style="font-size: 80px; margin-bottom: 20px;">${badge}</div>
      ` : `
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <svg width="40" height="40" fill="white" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
        </div>
      `}
      <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Milestone Unlocked!</h1>
      <p style="color: #6b7280; font-size: 18px; margin: 0;">Congratulations, ${recipientName}!</p>
    </div>

    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
      <p style="color: #92400e; font-size: 16px; margin: 0 0 15px 0; font-weight: 600; text-transform: uppercase;">${milestone}</p>
      <p style="color: #1a1a1a; font-size: 56px; font-weight: 800; margin: 0; line-height: 1;">${value}</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/profile" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Your Profile
      </a>
    </div>

    <div style="background-color: #f0fdf4; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #166534; font-size: 14px; margin: 0; text-align: center;">
        <strong>🎊 Keep it up!</strong> Milestones like this help you stand out to potential collaborators!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

