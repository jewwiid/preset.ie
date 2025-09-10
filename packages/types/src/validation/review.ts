import { z } from 'zod';
import { ratingSchema } from './common';

export const submitReviewSchema = z.object({
  gigId: z.string().uuid(),
  reviewedUserId: z.string().uuid(),
  rating: ratingSchema,
  comment: z.string().max(1000).optional(),
  tags: z.array(z.enum([
    'professional',
    'punctual',
    'creative',
    'communicative',
    'prepared',
    'friendly',
    'talented',
    'reliable'
  ])).max(5).optional(),
});

export const updateReviewSchema = z.object({
  reviewId: z.string().uuid(),
  rating: ratingSchema.optional(),
  comment: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(5).optional(),
});

export const deleteReviewSchema = z.object({
  reviewId: z.string().uuid(),
});

export const getReviewsSchema = z.object({
  userId: z.string().uuid().optional(),
  gigId: z.string().uuid().optional(),
  reviewerUserId: z.string().uuid().optional(),
  minRating: ratingSchema.optional(),
  tags: z.array(z.string()).optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  sortBy: z.enum(['created_at', 'rating']).default('created_at'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const reportReviewSchema = z.object({
  reviewId: z.string().uuid(),
  reason: z.enum(['fake', 'inappropriate', 'harassment', 'other']),
  description: z.string().max(500),
});

export const respondToReviewSchema = z.object({
  reviewId: z.string().uuid(),
  response: z.string().min(1).max(500),
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type DeleteReviewInput = z.infer<typeof deleteReviewSchema>;
export type GetReviewsInput = z.infer<typeof getReviewsSchema>;
export type ReportReviewInput = z.infer<typeof reportReviewSchema>;
export type RespondToReviewInput = z.infer<typeof respondToReviewSchema>;