import { getEmailTemplate, getButton } from './shared.templates';

interface VerifyEmailTemplateProps {
  name: string;
  verificationUrl: string;
  userEmail: string;
  authUserId: string;
}

export function getVerifyEmailTemplate({
  name,
  verificationUrl,
  userEmail,
  authUserId,
}: VerifyEmailTemplateProps): string {
  const content = `
    <h1 style="color: #1f2937; font-size: 28px; margin: 0 0 16px 0; font-weight: 600;">
      Verify Your Email
    </h1>
    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      Hi ${name}, welcome to Preset! Please verify your email address to complete your registration.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      ${getButton('Verify Email Address', verificationUrl, 'primary')}
    </div>

    <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 24px 0 0 0;">
      This verification link will expire in 24 hours. If you didn't create an account with Preset, you can safely ignore this email.
    </p>

    <div style="margin-top: 24px; padding: 20px; background-color: #f9fafb; border-radius: 8px; border-left: 4px solid #00876f;">
      <p style="color: #4b5563; font-size: 14px; margin: 0 0 8px 0; font-weight: 500;">
        Button not working?
      </p>
      <p style="color: #6b7280; font-size: 14px; margin: 0; word-break: break-all;">
        Copy and paste this link into your browser:<br/>
        <a href="${verificationUrl}" style="color: #00876f; text-decoration: none;">
          ${verificationUrl}
        </a>
      </p>
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

interface WelcomeAfterVerificationTemplateProps {
  name: string;
  role: 'TALENT' | 'CONTRIBUTOR' | 'BOTH';
  userEmail: string;
  authUserId: string;
}

export function getWelcomeAfterVerificationTemplate({
  name,
  role,
  userEmail,
  authUserId,
}: WelcomeAfterVerificationTemplateProps): string {
  const roleSpecific = {
    TALENT: {
      title: 'Your Creative Journey Starts Now',
      description: 'Connect with photographers, filmmakers, and creative professionals for exciting collaborations.',
      cta: 'Complete Your Profile',
      ctaUrl: 'https://presetie.com/onboarding/complete-profile',
    },
    CONTRIBUTOR: {
      title: 'Start Finding Amazing Talent',
      description: 'Discover models, actors, and creative professionals for your next project.',
      cta: 'Browse Talent',
      ctaUrl: 'https://presetie.com/search/talent',
    },
    BOTH: {
      title: 'Welcome to the Creative Community',
      description: 'Collaborate as both talent and contributor in our creative network.',
      cta: 'Explore Preset',
      ctaUrl: 'https://presetie.com/dashboard',
    },
  };

  const config = roleSpecific[role];

  const content = `
    <div style="text-align: center;">
      <h1 style="color: #1f2937; font-size: 28px; margin: 0 0 16px 0; font-weight: 600;">
        Email Verified Successfully
      </h1>
      <p style="color: #4b5563; font-size: 18px; line-height: 1.6; margin: 0;">
        Welcome to Preset, ${name}!
      </p>
    </div>

    <h2 style="color: #1f2937; font-size: 20px; margin: 32px 0 16px 0; font-weight: 600;">
      ${config.title}
    </h2>

    <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 24px 0;">
      ${config.description}
    </p>

    <div style="text-align: center; margin: 32px 0;">
      ${getButton(config.cta, config.ctaUrl, 'primary')}
    </div>

    <div style="margin-top: 32px; padding: 24px; background-color: #f9fafb; border-radius: 8px;">
      <h3 style="color: #1f2937; font-size: 18px; margin: 0 0 16px 0; font-weight: 600;">
        Getting Started
      </h3>
      <ul style="color: #4b5563; font-size: 15px; line-height: 1.8; margin: 0; padding-left: 20px;">
        <li>Complete your profile to attract the right collaborators</li>
        <li>Browse ${role === 'TALENT' ? 'available gigs' : 'talented creatives'}</li>
        <li>Connect with the community</li>
        <li>Start your first collaboration</li>
      </ul>
    </div>
  `;

  return getEmailTemplate(content, userEmail, authUserId);
}

