/**
 * Referral & Invite Email Templates
 * Signup notifications, referral success, welcome with invite code
 *
 * NO EMOJIS - Professional design
 * Brand Colors: #00876f, #0d7d72
 */

import { getEmailTemplate, getButton, getHighlightCard, baseUrl } from './shared.templates';

/**
 * Email sent when someone signs up using an invite code
 * Notifies the referrer immediately
 */
export function getNewSignupNotificationTemplate(
  referrerName: string,
  newUserName: string,
  inviteCode: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937; margin-bottom: 10px;">Great news, ${referrerName}</h1>
    <p style="color: #00876f; font-size: 18px; margin-top: 0;">Someone just used your invite code</p>

    <p style="color: #4b5563; line-height: 1.6;"><strong style="color: #1f2937;">${newUserName}</strong> just signed up to Preset using your invite code.</p>

    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 30px; border-radius: 12px; color: white; margin: 30px 0;">
      <p style="color: white; font-size: 14px; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 1px; opacity: 0.9;">Your Invite Code</p>
      <p style="font-size: 32px; font-weight: bold; font-family: monospace; color: white; margin: 0; letter-spacing: 3px;">
        ${inviteCode}
      </p>
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.3);">
        <p style="color: white; margin: 0; font-size: 16px;">
          <strong>${newUserName}</strong> just joined
        </p>
      </div>
    </div>

    <div style="background: #ecfdf5; padding: 20px; border-left: 4px solid #10b981; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #065f46;">
        <strong>Almost there</strong><br>
        You'll earn <strong>5 credits</strong> once they complete their profile.
      </p>
    </div>

    <h3 style="color: #1f2937; border-left: 4px solid #00876f; padding-left: 15px;">How to Earn More</h3>
    <ol style="color: #4b5563; line-height: 1.8;">
      <li>Keep sharing your invite code: <code style="background: #f9fafb; padding: 4px 8px; border-radius: 4px; font-family: monospace; color: #00876f; border: 1px solid #e5e7eb;">${inviteCode}</code></li>
      <li>More signups = more potential credits</li>
      <li>Earn 5 credits for each user who completes their profile</li>
    </ol>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1f2937;">Your Shareable Link</h4>
      <div style="background: white; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 13px; word-break: break-all; border: 1px solid #e5e7eb; color: #4b5563;">
        ${baseUrl}/auth/signup?invite=${inviteCode}
      </div>
    </div>

    <div style="text-align: center; margin: 35px 0;">
      ${getButton('View Dashboard', `${baseUrl}/dashboard`)}
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

/**
 * Email sent when invitee completes their profile
 * Credits are awarded at this point
 */
export function getReferralSuccessTemplate(
  referrerName: string,
  newUserName: string,
  creditsEarned: number,
  totalReferrals: number,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937; margin-bottom: 10px;">You earned ${creditsEarned} credits</h1>
    <p style="color: #00876f; font-size: 18px; margin-top: 0;">Congratulations, ${referrerName}</p>

    <p style="color: #4b5563; line-height: 1.6;"><strong style="color: #1f2937;">${newUserName}</strong> just completed their profile on Preset.</p>

    <div style="background: #ecfdf5; padding: 30px; border-radius: 12px; margin: 30px 0; text-align: center; border: 2px solid #10b981;">
      <h3 style="margin: 0 0 10px 0; color: #065f46;">Your Referral Reward</h3>
      <p style="font-size: 48px; font-weight: bold; color: #00876f; margin: 10px 0; line-height: 1;">
        +${creditsEarned}
      </p>
      <p style="margin: 0; color: #059669; font-size: 16px;">Credits Added</p>
    </div>

    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 25px; border-radius: 12px; color: white; margin: 30px 0;">
      <div style="display: flex; justify-content: space-around; text-align: center;">
        <div>
          <p style="margin: 0; opacity: 0.9; font-size: 14px;">Total Referrals</p>
          <p style="margin: 5px 0 0 0; font-size: 32px; font-weight: bold;">${totalReferrals}</p>
        </div>
      </div>
    </div>

    <p style="color: #4b5563; line-height: 1.6;"><strong style="color: #1f2937;">${newUserName}</strong> is now an active member thanks to you.</p>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <p style="margin: 0; color: #4b5563;">
        <strong style="color: #1f2937;">Keep going!</strong><br>
        Continue sharing your invite code to earn more credits. Every completed referral gets you ${creditsEarned} credits.
      </p>
    </div>

    <div style="text-align: center; margin: 35px 0;">
      ${getButton('View Dashboard', `${baseUrl}/dashboard`)}
    </div>

    <p style="color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px; font-size: 14px;">
      Your credits have been automatically added to your account.
    </p>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

/**
 * Welcome email with user's personal invite code
 * Sent after successful signup
 */
export function getWelcomeWithInviteTemplate(
  userName: string,
  inviteCode: string,
  userEmail?: string,
  authUserId?: string
): string {
  const shareUrl = `${baseUrl}/auth/signup?invite=${inviteCode}`;

  const content = `
    <h1 style="color: #1f2937; margin-bottom: 10px;">Welcome to Preset, ${userName}</h1>
    <p style="color: #00876f; font-size: 18px; margin-top: 0;">Your creative journey starts now</p>

    <p style="color: #4b5563; line-height: 1.6;">We're excited to have you join our creative community. You're now part of a platform connecting photographers, videographers, and creative talent.</p>

    <div style="background: #f9fafb; padding: 25px; border-radius: 12px; margin: 30px 0; text-align: center;">
      <h3 style="margin: 0 0 10px 0; color: #1f2937;">Your Personal Invite Code</h3>
      <p style="font-size: 36px; font-weight: bold; font-family: monospace; color: #00876f; margin: 10px 0; letter-spacing: 3px;">
        ${inviteCode}
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">
        Share this code to earn 5 credits per referral
      </p>
    </div>

    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 30px; border-radius: 12px; color: white; margin: 30px 0;">
      <h3 style="color: white; margin: 0 0 15px 0;">How Referrals Work</h3>
      <ol style="color: white; margin: 0; padding-left: 20px; line-height: 2;">
        <li>Share your invite link with friends and colleagues</li>
        <li>They sign up using your code</li>
        <li>When they complete their profile, you earn 5 credits</li>
      </ol>
    </div>

    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 25px 0;">
      <h4 style="margin: 0 0 10px 0; color: #1f2937;">Your Shareable Link</h4>
      <div style="background: white; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 13px; word-break: break-all; border: 1px solid #e5e7eb; color: #4b5563;">
        ${shareUrl}
      </div>
    </div>

    <h3 style="color: #1f2937; border-left: 4px solid #00876f; padding-left: 15px;">Next Steps</h3>
    <ol style="color: #4b5563; line-height: 1.8;">
      <li><strong style="color: #1f2937;">Complete your profile</strong> - Add photos, bio, and skills</li>
      <li><strong style="color: #1f2937;">Explore the platform</strong> - Browse gigs and showcases</li>
      <li><strong style="color: #1f2937;">Start collaborating</strong> - Connect with other creatives</li>
    </ol>

    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Complete Your Profile', `${baseUrl}/profile/edit`)}
    </div>

    <p style="color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px;">
      Need help getting started? Reply to this email and we'll be happy to assist.
    </p>

    <p style="color: #4b5563;">
      Best regards,<br>
      <strong style="color: #1f2937;">The Preset Team</strong>
    </p>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}
