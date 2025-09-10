import { z } from 'zod';
import { coordinatesSchema, radiusSchema, dateSchema } from './common';
import { CompensationType, GigStatus } from '../database/enums';

export const createGigSchema = z.object({
  title: z.string().min(5).max(100),
  description: z.string().min(20).max(2000),
  purpose: z.string().max(500).optional(),
  compType: z.nativeEnum(CompensationType),
  locationText: z.string().min(3).max(200),
  coordinates: coordinatesSchema.optional(),
  radiusM: radiusSchema.optional(),
  startTime: dateSchema,
  endTime: dateSchema.optional(),
  applicationDeadline: dateSchema,
  maxApplicants: z.number().int().positive().max(100).optional(),
  usageRights: z.string().max(1000).optional(),
  safetyNotes: z.string().max(1000).optional(),
});

export const updateGigSchema = createGigSchema.partial();

export const publishGigSchema = z.object({
  gigId: z.string().uuid(),
});

export const closeGigSchema = z.object({
  gigId: z.string().uuid(),
});

export const boostGigSchema = z.object({
  gigId: z.string().uuid(),
  boostLevel: z.number().int().min(1).max(3),
});

export const searchGigsSchema = z.object({
  query: z.string().optional(),
  compType: z.nativeEnum(CompensationType).optional(),
  status: z.nativeEnum(GigStatus).optional(),
  location: coordinatesSchema.optional(),
  radiusKm: z.number().positive().max(100).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  styleTags: z.array(z.string()).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sortBy: z.enum(['created_at', 'start_time', 'application_deadline', 'boost_level']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const gigFiltersSchema = z.object({
  compTypes: z.array(z.nativeEnum(CompensationType)).optional(),
  location: z.object({
    coordinates: coordinatesSchema,
    radiusKm: z.number().positive().max(100),
  }).optional(),
  dateRange: z.object({
    start: dateSchema,
    end: dateSchema,
  }).optional(),
  hasOpenApplications: z.boolean().optional(),
});

export type CreateGigInput = z.infer<typeof createGigSchema>;
export type UpdateGigInput = z.infer<typeof updateGigSchema>;
export type PublishGigInput = z.infer<typeof publishGigSchema>;
export type CloseGigInput = z.infer<typeof closeGigSchema>;
export type BoostGigInput = z.infer<typeof boostGigSchema>;
export type SearchGigsInput = z.infer<typeof searchGigsSchema>;
export type GigFilters = z.infer<typeof gigFiltersSchema>;