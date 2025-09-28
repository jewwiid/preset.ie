import { createClient } from '@supabase/supabase-js';
import { SubscriptionBenefitsService } from './subscription-benefits.service';

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export class EnhancementService {
  static async createListingEnhancement(data: {
    listingId: string;
    userId: string;
    enhancementType: string;
    paymentIntentId: string;
    amountCents: number;
    durationDays: number;
  }) {
    const supabase = getSupabaseClient()
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + data.durationDays * 24 * 60 * 60 * 1000);

    // Create enhancement record
    const { data: enhancement, error } = await supabase
      .from('listing_enhancements')
      .insert({
        listing_id: data.listingId,
        user_id: data.userId,
        enhancement_type: data.enhancementType,
        payment_intent_id: data.paymentIntentId,
        amount_cents: data.amountCents,
        duration_days: data.durationDays,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update listing with enhancement
    await supabase
      .from('listings')
      .update({
        current_enhancement_type: data.enhancementType,
        enhancement_expires_at: expiresAt.toISOString(),
        premium_badge: data.enhancementType === 'premium_bump',
        boost_level: this.getBoostLevel(data.enhancementType)
      })
      .eq('id', data.listingId);

    return enhancement;
  }

  static getBoostLevel(enhancementType: string): number {
    switch (enhancementType) {
      case 'premium_bump': return 3;
      case 'priority_bump': return 2;
      case 'basic_bump': return 1;
      default: return 0;
    }
  }

  static async getActiveEnhancements(listingId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('listing_enhancements')
      .select('*')
      .eq('listing_id', listingId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async getUserSubscriptionBenefits(userId: string) {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .rpc('get_user_subscription_benefits', { p_user_id: userId });

    if (error) throw error;
    return data;
  }

  static async checkMonthlyBumpEligibility(userId: string): Promise<boolean> {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .rpc('can_use_monthly_bump', { p_user_id: userId });

    if (error) throw error;
    return data;
  }

  static async expireEnhancements() {
    const supabase = getSupabaseClient()
    // Run this as a cron job to expire enhancements
    const { data, error } = await supabase
      .from('listing_enhancements')
      .update({ status: 'expired' })
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'active')
      .select();

    if (error) throw error;

    // Update listings to remove expired enhancements
    for (const enhancement of data || []) {
      await supabase
        .from('listings')
        .update({
          current_enhancement_type: null,
          enhancement_expires_at: null,
          premium_badge: false,
          boost_level: 0
        })
        .eq('id', enhancement.listing_id);
    }

    return data;
  }

  static getEnhancementPricing() {
    return {
      basic_bump: { amount: 100, duration_days: 1 }, // €1
      priority_bump: { amount: 500, duration_days: 3 }, // €5
      premium_bump: { amount: 700, duration_days: 7 } // €7
    };
  }

  static getSubscriptionTierBenefits() {
    return {
      FREE: { monthly_bumps: 0, bump_type: 'basic_bump' },
      PLUS: { monthly_bumps: 1, bump_type: 'priority_bump' },
      PRO: { monthly_bumps: 3, bump_type: 'premium_bump' }
    };
  }

  /**
   * Apply enhancement using subscription benefits (free for subscribers)
   */
  static async applyEnhancementWithSubscription(
    listingId: string, 
    userId: string, 
    enhancementType: string
  ): Promise<{ success: boolean; message: string; requiresPayment?: boolean }> {
    try {
      const supabase = getSupabaseClient()
      // Get user's subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('subscription_tier')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        return { success: false, message: 'User profile not found' };
      }

      // Check if user can use subscription benefits
      if (profile.subscription_tier !== 'FREE') {
        const canUseBenefit = await SubscriptionBenefitsService.checkMonthlyBumpEligibility(
          userId, 
          profile.subscription_tier
        );

        if (canUseBenefit && enhancementType === 'basic_bump') {
          const success = await SubscriptionBenefitsService.useMonthlyBump(userId, listingId);
          if (success) {
            return { 
              success: true, 
              message: 'Enhancement applied using subscription benefit' 
            };
          }
        }
      }

      // Fall back to requiring payment
      return { 
        success: false, 
        message: 'Payment required for enhancement', 
        requiresPayment: true 
      };
    } catch (error) {
      console.error('Error applying enhancement with subscription:', error);
      return { 
        success: false, 
        message: 'Failed to apply enhancement' 
      };
    }
  }
}
