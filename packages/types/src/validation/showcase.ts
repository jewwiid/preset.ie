import { z } from 'zod';
import { colorPaletteSchema } from './common';
import { ShowcaseStatus } from '../database/enums';

export const createShowcaseSchema = z.object({
  gigId: z.string().uuid(),
  mediaIds: z.array(z.string().uuid()).min(3).max(6),
  caption: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const updateShowcaseSchema = z.object({
  showcaseId: z.string().uuid(),
  caption: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
  palette: colorPaletteSchema.optional(),
});

export const approveShowcaseSchema = z.object({
  showcaseId: z.string().uuid(),
  releaseFormUrl: z.string().url().optional(),
});

export const rejectShowcaseSchema = z.object({
  showcaseId: z.string().uuid(),
  reason: z.string().max(500),
});

export const publishShowcaseSchema = z.object({
  showcaseId: z.string().uuid(),
});

export const unpublishShowcaseSchema = z.object({
  showcaseId: z.string().uuid(),
});

export const getShowcasesSchema = z.object({
  gigId: z.string().uuid().optional(),
  creatorUserId: z.string().uuid().optional(),
  talentUserId: z.string().uuid().optional(),
  status: z.nativeEnum(ShowcaseStatus).optional(),
  visibility: z.enum(['public', 'private']).optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sortBy: z.enum(['created_at', 'updated_at']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const addShowcaseMediaSchema = z.object({
  showcaseId: z.string().uuid(),
  mediaId: z.string().uuid(),
});

export const removeShowcaseMediaSchema = z.object({
  showcaseId: z.string().uuid(),
  mediaId: z.string().uuid(),
});

export const generateReleaseFormSchema = z.object({
  showcaseId: z.string().uuid(),
  creatorSignature: z.string(),
  talentSignature: z.string(),
  usageRights: z.string().max(2000),
  duration: z.enum(['perpetual', '1_year', '2_years', '5_years']),
  territory: z.enum(['worldwide', 'country', 'region']),
  territoryDetails: z.string().max(500).optional(),
});

export type CreateShowcaseInput = z.infer<typeof createShowcaseSchema>;
export type UpdateShowcaseInput = z.infer<typeof updateShowcaseSchema>;
export type ApproveShowcaseInput = z.infer<typeof approveShowcaseSchema>;
export type RejectShowcaseInput = z.infer<typeof rejectShowcaseSchema>;
export type PublishShowcaseInput = z.infer<typeof publishShowcaseSchema>;
export type UnpublishShowcaseInput = z.infer<typeof unpublishShowcaseSchema>;
export type GetShowcasesInput = z.infer<typeof getShowcasesSchema>;
export type AddShowcaseMediaInput = z.infer<typeof addShowcaseMediaSchema>;
export type RemoveShowcaseMediaInput = z.infer<typeof removeShowcaseMediaSchema>;
export type GenerateReleaseFormInput = z.infer<typeof generateReleaseFormSchema>;