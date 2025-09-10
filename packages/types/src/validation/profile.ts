import { z } from 'zod';
import { handleSchema, urlSchema, styleTagsSchema } from './common';
import { UserRole, VerificationStatus } from '../database/enums';

export const updateProfileSchema = z.object({
  displayName: z.string().min(2).max(50).optional(),
  handle: handleSchema.optional(),
  bio: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  styleTags: styleTagsSchema.optional(),
  avatarUrl: urlSchema.optional(),
  portfolioUrl: urlSchema.optional(),
  instagramHandle: z.string().max(30).optional(),
  websiteUrl: urlSchema.optional(),
});

export const completeOnboardingSchema = z.object({
  displayName: z.string().min(2).max(50),
  handle: handleSchema,
  bio: z.string().max(500),
  city: z.string().max(100),
  styleTags: styleTagsSchema.min(1, 'Select at least one style tag'),
  role: z.nativeEnum(UserRole).exclude([UserRole.ADMIN]),
});

export const getProfileSchema = z.object({
  userId: z.string().uuid().optional(),
  handle: handleSchema.optional(),
}).refine(data => data.userId || data.handle, {
  message: 'Either userId or handle must be provided',
});

export const searchProfilesSchema = z.object({
  query: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  styleTags: z.array(z.string()).optional(),
  city: z.string().optional(),
  verificationStatus: z.nativeEnum(VerificationStatus).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sortBy: z.enum(['created_at', 'rating', 'showcases_count']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const uploadAvatarSchema = z.object({
  file: z.instanceof(File).refine(
    file => file.size <= 5 * 1024 * 1024,
    'Avatar must be less than 5MB'
  ).refine(
    file => ['image/jpeg', 'image/png', 'image/webp'].includes(file.type),
    'Avatar must be a JPEG, PNG or WebP image'
  ),
});

export const verifyIdentitySchema = z.object({
  documentType: z.enum(['passport', 'drivers_license', 'national_id']),
  documentNumber: z.string(),
  documentFrontUrl: urlSchema,
  documentBackUrl: urlSchema.optional(),
  selfieUrl: urlSchema,
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
export type GetProfileInput = z.infer<typeof getProfileSchema>;
export type SearchProfilesInput = z.infer<typeof searchProfilesSchema>;
export type UploadAvatarInput = z.infer<typeof uploadAvatarSchema>;
export type VerifyIdentityInput = z.infer<typeof verifyIdentitySchema>;