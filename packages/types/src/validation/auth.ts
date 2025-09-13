import { z } from 'zod';
import { emailSchema, handleSchema, phoneSchema } from './common';
import { UserRole } from '../database/enums';

export const signUpSchema = z.object({
  email: emailSchema,
  password: z.string().min(8, 'Password must be at least 8 characters'),
  displayName: z.string().min(2).max(50),
  handle: handleSchema,
  role: z.nativeEnum(UserRole).refine(role => role !== UserRole.ADMIN, {
    message: 'Admin role cannot be selected during signup',
  }),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms of service' }),
  }),
  ageConfirmation: z.literal(true, {
    errorMap: () => ({ message: 'You must be 18 or older to use Preset' }),
  }),
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const verifyEmailSchema = z.object({
  token: z.string(),
});

export const verifyPhoneSchema = z.object({
  phone: phoneSchema,
  code: z.string().length(6, 'Verification code must be 6 digits'),
});

export const updateEmailSchema = z.object({
  email: emailSchema,
  password: z.string(),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type VerifyPhoneInput = z.infer<typeof verifyPhoneSchema>;
export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;