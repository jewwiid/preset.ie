/**
 * Campaign Email Templates
 * Targeted marketing campaigns for different user segments
 */

import { getEmailTemplate } from './shared.templates';

/**
 * Campaign template for actors
 */
export function getActorsCampaignTemplate(
  recipientName: string,
  campaignData: {
    heading: string;
    message: string;
    ctaText: string;
    ctaUrl: string;
    features?: Array<{ title: string; description: string }>;
  },
  userEmail?: string,
  userId?: string
): string {
  const featuresList = campaignData.features?.map(feature => `
    <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">${feature.title}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">${feature.description}</p>
    </div>
  `).join('') || '';

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">${campaignData.heading}</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">For Actors on Preset</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6;">${campaignData.message}</p>
    </div>

    ${featuresList ? `
      <div style="margin: 30px 0;">
        ${featuresList}
      </div>
    ` : ''}

    <div style="text-align: center; margin: 40px 0;">
      <a href="${campaignData.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 14px rgba(0, 135, 111, 0.4);">
        ${campaignData.ctaText}
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

/**
 * Campaign template for videographers
 */
export function getVideographersCampaignTemplate(
  recipientName: string,
  campaignData: {
    heading: string;
    message: string;
    ctaText: string;
    ctaUrl: string;
    features?: Array<{ title: string; description: string }>;
  },
  userEmail?: string,
  userId?: string
): string {
  const featuresList = campaignData.features?.map(feature => `
    <div style="background-color: #ffffff; border-left: 4px solid #00876f; padding: 15px; margin-bottom: 12px; border-radius: 4px;">
      <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">${feature.title}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 0;">${feature.description}</p>
    </div>
  `).join('') || '';

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">${campaignData.heading}</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">For Videographers on Preset</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6;">${campaignData.message}</p>
    </div>

    ${featuresList ? `
      <div style="margin: 30px 0;">
        ${featuresList}
      </div>
    ` : ''}

    <div style="text-align: center; margin: 40px 0;">
      <a href="${campaignData.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 14px rgba(0, 135, 111, 0.4);">
        ${campaignData.ctaText}
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

/**
 * Generic campaign template for any specialization
 */
export function getSegmentedCampaignTemplate(
  recipientName: string,
  segment: string,  // e.g., "Fashion Photographers", "Editorial Models"
  campaignData: {
    heading: string;
    message: string;
    ctaText: string;
    ctaUrl: string;
    highlights?: Array<{ icon: string; title: string; description: string }>;
    stats?: Array<{ value: string; label: string }>;
  },
  userEmail?: string,
  userId?: string
): string {
  const highlightsList = campaignData.highlights?.map(highlight => `
    <div style="background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 15px;">
      <div style="display: flex; align-items: start; gap: 15px;">
        <div style="font-size: 32px;">${highlight.icon}</div>
        <div style="flex: 1;">
          <p style="color: #1a1a1a; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">${highlight.title}</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">${highlight.description}</p>
        </div>
      </div>
    </div>
  `).join('') || '';

  const statsList = campaignData.stats?.map(stat => `
    <div style="flex: 1; text-align: center; padding: 15px;">
      <p style="color: #00876f; font-size: 32px; font-weight: 800; margin: 0;">${stat.value}</p>
      <p style="color: #6b7280; font-size: 13px; margin: 5px 0 0 0;">${stat.label}</p>
    </div>
  `).join('') || '';

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-4h4v4zm0-6H4v-4h4v4zm0-6H4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4zm6 12h-4v-4h4v4zm0-6h-4v-4h4v4zm0-6h-4V4h4v4z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">${campaignData.heading}</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Exclusively for ${segment}</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #4b5563; font-size: 16px; margin: 0; line-height: 1.6; text-align: center;">${campaignData.message}</p>
    </div>

    ${statsList ? `
      <div style="background-color: #f0fdf4; border-radius: 12px; padding: 20px; margin: 30px 0;">
        <div style="display: flex; justify-content: space-around; flex-wrap: wrap;">
          ${statsList}
        </div>
      </div>
    ` : ''}

    ${highlightsList ? `
      <div style="margin: 30px 0;">
        ${highlightsList}
      </div>
    ` : ''}

    <div style="text-align: center; margin: 40px 0;">
      <a href="${campaignData.ctaUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 16px 48px; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 18px; box-shadow: 0 4px 14px rgba(0, 135, 111, 0.4);">
        ${campaignData.ctaText}
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

