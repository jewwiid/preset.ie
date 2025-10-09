/**
 * Email Service Wrapper
 * 
 * @deprecated This service is deprecated. Use EmailEventsService instead.
 * 
 * MIGRATION GUIDE:
 * - OLD: import { getEmailService } from '@/lib/services/email-service'
 * - NEW: import { getEmailEventsService } from '@/lib/services/email-events.service'
 * 
 * All email functionality has been consolidated into EmailEventsService
 * which provides 49+ email event methods with:
 * - NO emojis (professional design)
 * - Brand colors (#00876f, #0d7d72)
 * - Comprehensive coverage of all platform events
 */

import { getEmailEventsService } from './email-events.service';

/**
 * @deprecated Use getEmailEventsService() instead
 * This is kept for backwards compatibility only
 */
export function getEmailService() {
  console.warn('⚠️  EmailService is deprecated. Use getEmailEventsService() instead.');
  return getEmailEventsService();
}

/**
 * @deprecated Use EmailEventsService type instead
 */
export type EmailService = ReturnType<typeof getEmailEventsService>;

