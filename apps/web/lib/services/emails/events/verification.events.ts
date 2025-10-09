import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { getVerifyEmailTemplate, getWelcomeAfterVerificationTemplate } from '../templates/verification.templates';

interface SendVerificationEmailParams {
  authUserId: string;
  email: string;
  name: string;
  verificationToken: string;
}

export async function sendVerificationEmail({
  authUserId,
  email,
  name,
  verificationToken,
}: SendVerificationEmailParams): Promise<void> {
  const plunkService = getPlunkService();
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://presetie.com';
  const verificationUrl = `${baseUrl}/api/auth/verify?token=${verificationToken}`;

  const emailContent = getVerifyEmailTemplate({
    name,
    verificationUrl,
    userEmail: email,
    authUserId,
  });

  await plunkService.sendTransactionalEmail({
    to: email,
    subject: 'Verify Your Email - Preset',
    body: emailContent,
  });

  // Track event
  await plunkService.trackEvent({
    email,
    event: 'email-verification-sent',
    data: {
      authUserId,
      name,
    },
  });
}

interface SendWelcomeAfterVerificationParams {
  authUserId: string;
  email: string;
  name: string;
  role: 'TALENT' | 'CONTRIBUTOR' | 'BOTH';
}

export async function sendWelcomeAfterVerification({
  authUserId,
  email,
  name,
  role,
}: SendWelcomeAfterVerificationParams): Promise<void> {
  const plunkService = getPlunkService();
  const emailContent = getWelcomeAfterVerificationTemplate({
    name,
    role,
    userEmail: email,
    authUserId,
  });

  await plunkService.sendTransactionalEmail({
    to: email,
    subject: 'Welcome to Preset - Email Verified',
    body: emailContent,
  });

  // Track event
  await plunkService.trackEvent({
    email,
    event: 'user-verified',
    data: {
      authUserId,
      name,
      role,
    },
  });
}

