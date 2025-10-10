/**
 * Marketplace Email Templates
 * Preset sales, rentals, equipment
 */

import { getEmailTemplate } from './shared.templates';

export function getPresetPurchasedTemplate(
  buyerName: string,
  presetName: string,
  downloadUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Preset Ready to Download!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Your purchase is complete</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Preset Purchased</p>
      <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 15px 0;">${presetName}</p>
      <p style="color: #4b5563; font-size: 15px; margin: 0;">Your preset is ready to download and use in your editing workflow!</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${downloadUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Download Preset
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>💡 Tip:</strong> You can re-download this preset anytime from your library!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getPresetSoldTemplate(
  sellerName: string,
  presetName: string,
  buyerName: string,
  salePrice: number,
  salesUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">You Made a Sale! 🎉</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Someone just purchased your preset</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <div style="text-align: center; margin-bottom: 20px;">
        <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Sale Amount</p>
        <p style="color: #1a1a1a; font-size: 48px; font-weight: 800; margin: 0; line-height: 1;">$${(salePrice / 100).toFixed(2)}</p>
      </div>
      <div style="border-top: 1px solid #86efac; padding-top: 15px;">
        <p style="color: #6b7280; font-size: 14px; margin: 0 0 5px 0;">Preset: <strong style="color: #1a1a1a;">${presetName}</strong></p>
        <p style="color: #6b7280; font-size: 14px; margin: 0;">Purchased by: <strong style="color: #1a1a1a;">${buyerName}</strong></p>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${salesUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Sales Dashboard
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>💰 Payout:</strong> Earnings will be transferred to your account within 3-5 business days.
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getPresetListingApprovedTemplate(
  sellerName: string,
  presetName: string,
  listingUrl: string,
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
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Listing Approved!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Your preset is now live in the marketplace</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
      <p style="color: #166534; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Now Available</p>
      <p style="color: #1a1a1a; font-size: 22px; font-weight: 700; margin: 0 0 10px 0;">${presetName}</p>
      <p style="color: #4b5563; font-size: 15px; margin: 0;">Your preset has been reviewed and approved for sale!</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${listingUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Listing
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>📣 Promote it!</strong> Share your listing on social media to drive sales!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getPresetListingRejectedTemplate(
  sellerName: string,
  presetName: string,
  reason: string,
  guidelinesUrl: string,
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
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Listing Needs Revision</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Your preset submission requires changes</p>
    </div>

    <div style="background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #991b1b; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Submission</p>
      <p style="color: #1a1a1a; font-size: 20px; font-weight: 600; margin: 0 0 15px 0;">${presetName}</p>
      
      <div style="background-color: #ffffff; border-left: 4px solid #ef4444; padding: 15px; margin-top: 15px; border-radius: 4px;">
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 5px 0; font-weight: 600;">Reason for Rejection:</p>
        <p style="color: #4b5563; font-size: 15px; margin: 0;">${reason}</p>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${guidelinesUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Review Guidelines
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>📝 Next steps:</strong> Make the necessary changes and resubmit for review.
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getSalesMilestoneTemplate(
  sellerName: string,
  milestone: number,
  totalEarnings: number,
  userEmail?: string,
  userId?: string
): string {
  const milestones = {
    1: { emoji: '🎉', message: 'First Sale!' },
    10: { emoji: '🔟', message: '10 Sales!' },
    50: { emoji: '⭐', message: '50 Sales!' },
    100: { emoji: '💯', message: '100 Sales!' },
    500: { emoji: '🚀', message: '500 Sales!' },
    1000: { emoji: '🏆', message: '1,000 Sales!' }
  };

  const milestoneInfo = milestones[milestone as keyof typeof milestones] || { emoji: '🎊', message: `${milestone} Sales!` };

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="font-size: 80px; margin-bottom: 20px;">${milestoneInfo.emoji}</div>
      <h1 style="color: #1a1a1a; font-size: 32px; font-weight: 700; margin: 0 0 10px 0;">Milestone Achieved!</h1>
      <p style="color: #6b7280; font-size: 18px; margin: 0;">${milestoneInfo.message}</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
      <p style="color: #166534; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">Total Earnings</p>
      <p style="color: #1a1a1a; font-size: 48px; font-weight: 800; margin: 0; line-height: 1;">$${(totalEarnings / 100).toFixed(2)}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0;">from ${milestone} sales</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/marketplace/my-sales" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        View Sales Dashboard
      </a>
    </div>

    <div style="background-color: #fffbeb; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #92400e; font-size: 14px; margin: 0;">
        <strong>🌟 Amazing work!</strong> Keep creating quality presets and your sales will continue to grow!
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

