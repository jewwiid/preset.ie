import { z } from 'zod';
import { ApplicationStatus } from '../database/enums';

export const applyToGigSchema = z.object({
  gigId: z.string().uuid(),
  note: z.string().max(500).optional(),
});

export const updateApplicationStatusSchema = z.object({
  applicationId: z.string().uuid(),
  status: z.nativeEnum(ApplicationStatus),
  notifyApplicant: z.boolean().default(true),
});

export const shortlistApplicantsSchema = z.object({
  gigId: z.string().uuid(),
  applicantIds: z.array(z.string().uuid()).min(1),
});

export const bookTalentSchema = z.object({
  gigId: z.string().uuid(),
  applicantId: z.string().uuid(),
  sendConfirmation: z.boolean().default(true),
});

export const withdrawApplicationSchema = z.object({
  applicationId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const getApplicationsSchema = z.object({
  gigId: z.string().uuid().optional(),
  applicantId: z.string().uuid().optional(),
  status: z.nativeEnum(ApplicationStatus).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sortBy: z.enum(['created_at', 'status']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const bulkUpdateApplicationsSchema = z.object({
  applicationIds: z.array(z.string().uuid()).min(1),
  status: z.nativeEnum(ApplicationStatus),
  notifyApplicants: z.boolean().default(false),
});

export type ApplyToGigInput = z.infer<typeof applyToGigSchema>;
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>;
export type ShortlistApplicantsInput = z.infer<typeof shortlistApplicantsSchema>;
export type BookTalentInput = z.infer<typeof bookTalentSchema>;
export type WithdrawApplicationInput = z.infer<typeof withdrawApplicationSchema>;
export type GetApplicationsInput = z.infer<typeof getApplicationsSchema>;
export type BulkUpdateApplicationsInput = z.infer<typeof bulkUpdateApplicationsSchema>;