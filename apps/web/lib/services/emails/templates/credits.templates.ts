/**
 * Credits & Billing Email Templates
 * Purchases, low balance, resets
 */

import { getEmailTemplate } from './shared.templates';

export function getCreditsPurchasedTemplate(
  recipientName: string,
  creditsAdded: number,
  amountPaid: number,
  newBalance: number,
  transactionId: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Credits Added!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Your purchase was successful</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
      <p style="color: #166534; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">Credits Purchased</p>
      <p style="color: #1a1a1a; font-size: 48px; font-weight: 800; margin: 0; line-height: 1;">+${creditsAdded}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0;">New balance: ${newBalance} credits</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="color: #6b7280; font-size: 14px;">Credits</span>
        <span style="color: #1a1a1a; font-size: 14px; font-weight: 600;">${creditsAdded} credits</span>
      </div>
      <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
        <span style="color: #6b7280; font-size: 14px;">Amount Paid</span>
        <span style="color: #1a1a1a; font-size: 14px; font-weight: 600;">$${(amountPaid / 100).toFixed(2)}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px solid #e5e7eb;">
        <span style="color: #6b7280; font-size: 14px;">Transaction ID</span>
        <span style="color: #9ca3af; font-size: 12px; font-family: monospace;">${transactionId}</span>
      </div>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Go to Dashboard
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>💡 Tip:</strong> Credits never expire! Use them anytime to boost your gigs or applications.
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getCreditsLowTemplate(
  recipientName: string,
  currentBalance: number,
  tier: string,
  topUpUrl: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Credits Running Low</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">You have ${currentBalance} credits remaining</p>
    </div>

    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 12px; padding: 25px; margin: 30px 0;">
      <p style="color: #92400e; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; font-weight: 600;">Current Balance</p>
      <p style="color: #1a1a1a; font-size: 42px; font-weight: 800; margin: 0; line-height: 1;">${currentBalance} credits</p>
      <p style="color: #78716c; font-size: 14px; margin: 15px 0 0 0;">${tier} Plan</p>
    </div>

    <div style="background-color: #f9fafb; border-radius: 8px; padding: 20px; margin: 30px 0;">
      <p style="color: #1a1a1a; font-size: 15px; font-weight: 600; margin: 0 0 15px 0;">What can you do with credits?</p>
      <ul style="color: #4b5563; font-size: 14px; margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Boost your gigs for more visibility</li>
        <li style="margin-bottom: 8px;">Apply to premium opportunities</li>
        <li style="margin-bottom: 8px;">Send priority messages</li>
        <li style="margin-bottom: 8px;">Access exclusive features</li>
      </ul>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${topUpUrl}" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Top Up Credits
      </a>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

export function getCreditsResetTemplate(
  recipientName: string,
  creditsAdded: number,
  newBalance: number,
  tier: string,
  userEmail?: string,
  userId?: string
): string {
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
        <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
          <path d="M12 6v3l4-4-4-4v3c-4.42 0-8 3.58-8 8 0 1.57.46 3.03 1.24 4.26L6.7 14.8c-.45-.83-.7-1.79-.7-2.8 0-3.31 2.69-6 6-6zm6.76 1.74L17.3 9.2c.44.84.7 1.79.7 2.8 0 3.31-2.69 6-6 6v-3l-4 4 4 4v-3c4.42 0 8-3.58 8-8 0-1.57-.46-3.03-1.24-4.26z"/>
        </svg>
      </div>
      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: 700; margin: 0 0 10px 0;">Credits Refreshed!</h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0;">Your monthly credits have been added</p>
    </div>

    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 12px; padding: 30px; margin: 30px 0; text-align: center;">
      <p style="color: #166534; font-size: 16px; margin: 0 0 15px 0; font-weight: 600;">Monthly Reset - ${tier} Plan</p>
      <p style="color: #1a1a1a; font-size: 48px; font-weight: 800; margin: 0; line-height: 1;">+${creditsAdded}</p>
      <p style="color: #6b7280; font-size: 14px; margin: 15px 0 0 0;">New balance: ${newBalance} credits</p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, #00876f 0%, #00a389 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
        Start Using Credits
      </a>
    </div>

    <div style="background-color: #eff6ff; border-radius: 8px; padding: 15px; margin-top: 30px;">
      <p style="color: #1e40af; font-size: 14px; margin: 0;">
        <strong>📅 Next reset:</strong> Your credits will refresh again on the 1st of next month.
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, userId);
}

