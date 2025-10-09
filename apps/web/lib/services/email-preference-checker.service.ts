/**
 * Email Preference Checker Service
 * Checks if a user should receive a specific email based on their preferences
 * Integrates notification_preferences table with Plunk email system
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

export type EmailCategory = 
  | 'gig'
  | 'application'
  | 'message'
  | 'booking'
  | 'system'
  | 'marketing'
  | 'showcase'
  | 'review'
  | 'credit'
  | 'subscription';

interface EmailPreferences {
  email_enabled: boolean;
  gig_notifications: boolean;
  application_notifications: boolean;
  message_notifications: boolean;
  booking_notifications: boolean;
  system_notifications: boolean;
  marketing_notifications: boolean;
}

export class EmailPreferenceChecker {
  /**
   * Check if user should receive this email
   */
  async shouldSendEmail(
    userId: string,
    category: EmailCategory
  ): Promise<{ shouldSend: boolean; reason?: string }> {
    try {
      const supabase = await createClient();

      // Get user's email preferences
      const { data: preferences, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // If no preferences found, create default (emails enabled)
      if (error || !preferences) {
        return { shouldSend: true, reason: 'default_preferences' };
      }

      // Check if emails are globally disabled
      if (!preferences.email_enabled) {
        return { shouldSend: false, reason: 'emails_disabled' };
      }

      // Check category-specific preferences
      const categoryMap: Record<EmailCategory, keyof EmailPreferences> = {
        gig: 'gig_notifications',
        application: 'application_notifications',
        message: 'message_notifications',
        booking: 'booking_notifications',
        system: 'system_notifications',
        marketing: 'marketing_notifications',
        showcase: 'booking_notifications', // Showcases fall under bookings
        review: 'booking_notifications', // Reviews fall under bookings
        credit: 'system_notifications', // Credits are system notifications
        subscription: 'system_notifications', // Subscriptions are system
      };

      const preferenceKey = categoryMap[category];
      const categoryEnabled = preferences[preferenceKey];

      if (!categoryEnabled) {
        return { shouldSend: false, reason: `${category}_disabled` };
      }

      return { shouldSend: true };
    } catch (error) {
      console.error('Error checking email preferences:', error);
      // Default to sending if error (don't block emails due to preference check failure)
      return { shouldSend: true, reason: 'error_checking_preferences' };
    }
  }

  /**
   * Get user's email address and preferences
   */
  async getUserEmailInfo(userId: string): Promise<{
    email: string | null;
    canSend: boolean;
    preferences: EmailPreferences | null;
  }> {
    try {
      const supabase = await createClient();
      const adminClient = createAdminClient();

      // Get user email from auth using admin client
      const { data: { user }, error: userError } = await adminClient.auth.admin.getUserById(userId);
      
      if (userError || !user?.email) {
        return { email: null, canSend: false, preferences: null };
      }

      // Get preferences
      const { data: preferences } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      const canSend = preferences?.email_enabled ?? true;

      return {
        email: user.email,
        canSend,
        preferences: preferences as EmailPreferences | null,
      };
    } catch (error) {
      console.error('Error getting user email info:', error);
      return { email: null, canSend: false, preferences: null };
    }
  }

  /**
   * Unsubscribe user from specific category
   */
  async unsubscribeFromCategory(userId: string, category: EmailCategory): Promise<void> {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    const categoryMap: Record<EmailCategory, string> = {
      gig: 'gig_notifications',
      application: 'application_notifications',
      message: 'message_notifications',
      booking: 'booking_notifications',
      system: 'system_notifications',
      marketing: 'marketing_notifications',
      showcase: 'booking_notifications',
      review: 'booking_notifications',
      credit: 'system_notifications',
      subscription: 'system_notifications',
    };

    const column = categoryMap[category];

    await supabase
      .from('notification_preferences')
      .update({ [column]: false })
      .eq('user_id', userId);

    // Also unsubscribe in Plunk
    const { data: { user } } = await adminClient.auth.admin.getUserById(userId);
    if (user?.email) {
      const plunk = getPlunkService();
      await plunk.trackEvent({
        event: `unsubscribed.${category}`,
        email: user.email,
        data: { category, unsubscribedAt: new Date().toISOString() }
      });
    }
  }

  /**
   * Unsubscribe user from ALL emails
   */
  async unsubscribeFromAllEmails(userId: string): Promise<void> {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Disable all emails in database
    await supabase
      .from('notification_preferences')
      .update({ email_enabled: false })
      .eq('user_id', userId);

    // Unsubscribe in Plunk
    const { data: { user } } = await adminClient.auth.admin.getUserById(userId);
    if (user?.email) {
      const plunk = getPlunkService();
      await plunk.unsubscribeContact(user.email);
    }
  }

  /**
   * Re-subscribe user to emails
   */
  async resubscribeToEmails(userId: string): Promise<void> {
    const supabase = await createClient();
    const adminClient = createAdminClient();

    await supabase
      .from('notification_preferences')
      .update({ email_enabled: true })
      .eq('user_id', userId);

    // Re-subscribe in Plunk
    const { data: { user } } = await adminClient.auth.admin.getUserById(userId);
    if (user?.email) {
      const plunk = getPlunkService();
      await plunk.subscribeContact(user.email, {
        resubscribedAt: new Date().toISOString()
      });
    }
  }
}

// Singleton instance
let checkerInstance: EmailPreferenceChecker | null = null;

export function getEmailPreferenceChecker(): EmailPreferenceChecker {
  if (!checkerInstance) {
    checkerInstance = new EmailPreferenceChecker();
  }
  return checkerInstance;
}

