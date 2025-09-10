import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const emailSchema = z.string().email().toLowerCase();

export const handleSchema = z
  .string()
  .min(3, 'Handle must be at least 3 characters')
  .max(30, 'Handle must be at most 30 characters')
  .regex(/^[a-zA-Z0-9_]+$/, 'Handle can only contain letters, numbers, and underscores');

export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const urlSchema = z.string().url();

export const dateSchema = z.string().datetime();

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const radiusSchema = z
  .number()
  .positive()
  .max(100000, 'Radius cannot exceed 100km');

export const styleTagsSchema = z
  .array(z.string())
  .max(10, 'Maximum 10 style tags allowed');

export const ratingSchema = z.number().int().min(1).max(5);

export const colorPaletteSchema = z.array(z.string().regex(/^#[0-9A-F]{6}$/i));

export type UUID = z.infer<typeof uuidSchema>;
export type Email = z.infer<typeof emailSchema>;
export type Handle = z.infer<typeof handleSchema>;
export type Phone = z.infer<typeof phoneSchema>;
export type URL = z.infer<typeof urlSchema>;
export type DateTime = z.infer<typeof dateSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
export type Coordinates = z.infer<typeof coordinatesSchema>;
export type Radius = z.infer<typeof radiusSchema>;
export type StyleTags = z.infer<typeof styleTagsSchema>;
export type Rating = z.infer<typeof ratingSchema>;
export type ColorPalette = z.infer<typeof colorPaletteSchema>;