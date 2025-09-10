import { z } from 'zod';
import { MediaType } from '../database/enums';
import { colorPaletteSchema } from './common';

export const uploadMediaSchema = z.object({
  file: z.instanceof(File).refine(
    file => file.size <= 50 * 1024 * 1024,
    'File must be less than 50MB'
  ),
  type: z.nativeEnum(MediaType),
  gigId: z.string().uuid().optional(),
  showcaseId: z.string().uuid().optional(),
  visibility: z.enum(['public', 'private']).default('private'),
  stripExif: z.boolean().default(true),
});

export const updateMediaSchema = z.object({
  mediaId: z.string().uuid(),
  visibility: z.enum(['public', 'private']).optional(),
  caption: z.string().max(500).optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const deleteMediaSchema = z.object({
  mediaId: z.string().uuid(),
});

export const getMediaSchema = z.object({
  mediaId: z.string().uuid(),
  generateSignedUrl: z.boolean().default(false),
});

export const createMoodboardSchema = z.object({
  gigId: z.string().uuid(),
  title: z.string().max(100).optional(),
  summary: z.string().max(500).optional(),
  mediaUrls: z.array(z.string().url()).min(1).max(20),
});

export const updateMoodboardSchema = z.object({
  moodboardId: z.string().uuid(),
  title: z.string().max(100).optional(),
  summary: z.string().max(500).optional(),
  palette: colorPaletteSchema.optional(),
});

export const addMoodboardItemSchema = z.object({
  moodboardId: z.string().uuid(),
  mediaId: z.string().uuid(),
  order: z.number().int().positive(),
  caption: z.string().max(200).optional(),
});

export const removeMoodboardItemSchema = z.object({
  moodboardId: z.string().uuid(),
  mediaId: z.string().uuid(),
});

export const reorderMoodboardItemsSchema = z.object({
  moodboardId: z.string().uuid(),
  items: z.array(z.object({
    mediaId: z.string().uuid(),
    order: z.number().int().positive(),
  })),
});

export const generateBlurhashSchema = z.object({
  imageUrl: z.string().url(),
});

export const extractPaletteSchema = z.object({
  imageUrl: z.string().url(),
  maxColors: z.number().int().positive().max(10).default(5),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;
export type DeleteMediaInput = z.infer<typeof deleteMediaSchema>;
export type GetMediaInput = z.infer<typeof getMediaSchema>;
export type CreateMoodboardInput = z.infer<typeof createMoodboardSchema>;
export type UpdateMoodboardInput = z.infer<typeof updateMoodboardSchema>;
export type AddMoodboardItemInput = z.infer<typeof addMoodboardItemSchema>;
export type RemoveMoodboardItemInput = z.infer<typeof removeMoodboardItemSchema>;
export type ReorderMoodboardItemsInput = z.infer<typeof reorderMoodboardItemsSchema>;
export type GenerateBlurhashInput = z.infer<typeof generateBlurhashSchema>;
export type ExtractPaletteInput = z.infer<typeof extractPaletteSchema>;