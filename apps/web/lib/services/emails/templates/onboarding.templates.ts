/**
 * Onboarding Email Templates
 * Welcome, verification, password reset, profile completion
 */

import { getEmailTemplate, getButton, baseUrl } from './shared.templates';

export function getWelcomeEmailTemplate(
  name: string, 
  role: string, 
  roleDescription: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937; margin-bottom: 10px;">Welcome to Preset, ${name}</h1>
    <p style="color: #00876f; font-size: 18px; margin-top: 0;">Your creative collaboration starts here</p>
    
    <p style="color: #4b5563; line-height: 1.6;">We are excited to have you join our community of photographers, videographers, and creative talent.</p>
    
    <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); padding: 25px; border-radius: 12px; color: white; margin: 30px 0;">
      <h3 style="margin: 0 0 10px 0; color: white;">You are signed up as a ${role}</h3>
      <p style="margin: 0; opacity: 0.95;">${roleDescription}</p>
    </div>
    
    <h3 style="color: #1f2937; border-left: 4px solid #00876f; padding-left: 15px;">Get Started in 3 Steps</h3>
    <ol style="color: #4b5563; line-height: 1.8;">
      <li><strong style="color: #1f2937;">Complete your profile</strong> - Add photos, bio, and skills</li>
      <li><strong style="color: #1f2937;">${role === 'CONTRIBUTOR' ? 'Create your first gig' : 'Browse and apply to gigs'}</strong></li>
      <li><strong style="color: #1f2937;">Connect & create</strong> - Start collaborating!</li>
    </ol>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Complete Your Profile', `${baseUrl}/profile/edit`)}
    </div>
    
    <p style="color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; margin-top: 40px;">Need help? Reply to this email or visit our Help Center.</p>
    
    <p style="color: #4b5563;">
      Best regards,<br>
      <strong style="color: #1f2937;">The Preset Team</strong>
    </p>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getEmailVerificationTemplate(
  verificationUrl: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">Verify Your Email Address</h1>
    <p style="color: #4b5563; line-height: 1.6;">Please verify your email address to complete your Preset account setup.</p>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Verify Email Address', verificationUrl)}
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">This link expires in 24 hours. If you did not create a Preset account, you can safely ignore this email.</p>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getPasswordResetTemplate(
  resetUrl: string,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">Reset Your Password</h1>
    <p style="color: #4b5563; line-height: 1.6;">We received a request to reset your Preset password.</p>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Reset Password', resetUrl)}
    </div>
    
    <p style="color: #6b7280; font-size: 14px;">This link expires in 1 hour. If you did not request a password reset, you can safely ignore this email.</p>
    
    <div style="background: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 0; color: #92400e;">
        <strong>Security Tip:</strong> Never share your password with anyone.
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

export function getProfileCompletionTemplate(
  name: string,
  completionPercentage: number,
  userEmail?: string,
  authUserId?: string
): string {
  const content = `
    <h1 style="color: #1f2937;">Complete Your Preset Profile</h1>
    <p style="color: #4b5563;">Hi ${name}, your profile is ${completionPercentage}% complete.</p>
    
    <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
      <div style="background: #e5e7eb; height: 12px; border-radius: 6px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #00876f 0%, #0d7d72 100%); height: 100%; width: ${completionPercentage}%;"></div>
      </div>
      <p style="text-align: center; margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">${completionPercentage}% Complete</p>
    </div>
    
    <h3 style="color: #1f2937;">Complete your profile to:</h3>
    <ul style="color: #4b5563; line-height: 1.8;">
      <li>Increase visibility to ${completionPercentage < 50 ? 'contributors' : 'potential collaborators'}</li>
      <li>Get more ${completionPercentage < 50 ? 'application opportunities' : 'gig invitations'}</li>
      <li>Build trust with your portfolio</li>
    </ul>
    
    <div style="text-align: center; margin: 35px 0;">
      ${getButton('Complete Profile', `${baseUrl}/profile/edit`)}
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}
