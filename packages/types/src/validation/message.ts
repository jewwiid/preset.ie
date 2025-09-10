import { z } from 'zod';

export const sendMessageSchema = z.object({
  gigId: z.string().uuid(),
  toUserId: z.string().uuid(),
  body: z.string().min(1).max(1000),
  attachments: z.array(z.string().uuid()).max(5).optional(),
});

export const getMessagesSchema = z.object({
  gigId: z.string().uuid(),
  withUserId: z.string().uuid().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
  before: z.string().datetime().optional(),
  after: z.string().datetime().optional(),
});

export const markMessageAsReadSchema = z.object({
  messageId: z.string().uuid(),
});

export const markConversationAsReadSchema = z.object({
  gigId: z.string().uuid(),
  withUserId: z.string().uuid(),
});

export const deleteMessageSchema = z.object({
  messageId: z.string().uuid(),
});

export const getConversationsSchema = z.object({
  userId: z.string().uuid().optional(),
  gigId: z.string().uuid().optional(),
  unreadOnly: z.boolean().default(false),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(50).default(20),
});

export const blockUserSchema = z.object({
  userId: z.string().uuid(),
  reason: z.string().max(500).optional(),
});

export const unblockUserSchema = z.object({
  userId: z.string().uuid(),
});

export const reportMessageSchema = z.object({
  messageId: z.string().uuid(),
  reason: z.enum(['spam', 'harassment', 'inappropriate', 'other']),
  description: z.string().max(500),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type GetMessagesInput = z.infer<typeof getMessagesSchema>;
export type MarkMessageAsReadInput = z.infer<typeof markMessageAsReadSchema>;
export type MarkConversationAsReadInput = z.infer<typeof markConversationAsReadSchema>;
export type DeleteMessageInput = z.infer<typeof deleteMessageSchema>;
export type GetConversationsInput = z.infer<typeof getConversationsSchema>;
export type BlockUserInput = z.infer<typeof blockUserSchema>;
export type UnblockUserInput = z.infer<typeof unblockUserSchema>;
export type ReportMessageInput = z.infer<typeof reportMessageSchema>;