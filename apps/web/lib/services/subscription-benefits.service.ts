import { supabase } from '@/lib/supabase';

export interface SubscriptionBenefit {
  id: string;
  user_id: string;
  subscription_tier: 'FREE' | 'PLUS' | 'PRO' | 'CREATOR';
  benefit_type: 'monthly_bump' | 'priority_support' | 'analytics';
  benefit_value: number;
  used_this_month: number;
  monthly_limit: number;
  last_reset_at: string;
}

export class SubscriptionBenefitsService {
  /**
   * Check if user can use their monthly bump benefit
   */
  static async checkMonthlyBumpEligibility(userId: string, subscriptionTier: string): Promise<boolean> {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return false;
      }
      
      const { data: benefit, error } = await supabase
        .from('subscription_benefits')
        .select('*')
        .eq('user_id', userId)
        .eq('benefit_type', 'monthly_bump')
        .eq('subscription_tier', subscriptionTier)
        .single();

      if (error) {
        console.error('Error checking monthly bump eligibility:', error);
        return false;
      }

      // Check if user has remaining bumps this month
      return benefit.used_this_month < benefit.monthly_limit;
    } catch (error) {
      console.error('Error in checkMonthlyBumpEligibility:', error);
      return false;
    }
  }

  /**
   * Use a monthly bump benefit for a listing
   */
  static async applyMonthlyBump(userId: string, listingId: string): Promise<boolean> {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return false;
      }
      
      // Get user's subscription tier
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('subscription_tier')
        .eq('user_id', userId)
        .single();

      if (profileError || !profile) {
        console.error('Error fetching user profile:', profileError);
        return false;
      }

      // Get the monthly bump benefit
      const { data: benefit, error: benefitError } = await supabase
        .from('subscription_benefits')
        .select('*')
        .eq('user_id', userId)
        .eq('benefit_type', 'monthly_bump')
        .eq('subscription_tier', profile.subscription_tier)
        .single();

      if (benefitError || !benefit) {
        console.error('Error fetching monthly bump benefit:', benefitError);
        return false;
      }

      // Check if user has remaining bumps
      if (benefit.used_this_month >= benefit.monthly_limit) {
        console.log('User has exceeded monthly bump limit');
        return false;
      }

      // Create enhancement using subscription benefit
      const enhancementData = {
        listing_id: listingId,
        user_id: userId,
        enhancement_type: 'basic_bump' as const,
        payment_intent_id: `subscription_${benefit.id}_${Date.now()}`,
        amount_cents: 0, // Free for subscription users
        status: 'active' as const,
        starts_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 1 day
      };

      // Create the enhancement
      const { error: enhancementError } = await supabase
        .from('listing_enhancements')
        .insert(enhancementData);

      if (enhancementError) {
        console.error('Error creating enhancement:', enhancementError);
        return false;
      }

      // Update usage count
      const { error: updateError } = await supabase
        .from('subscription_benefits')
        .update({ 
          used_this_month: benefit.used_this_month + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', benefit.id);

      if (updateError) {
        console.error('Error updating benefit usage:', updateError);
        return false;
      }

      console.log(`Monthly bump used successfully for listing: ${listingId}`);
      return true;
    } catch (error) {
      console.error('Error in applyMonthlyBump:', error);
      return false;
    }
  }

  /**
   * Get user's subscription benefits
   */
  static async getUserBenefits(userId: string): Promise<SubscriptionBenefit[]> {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return [];
      }
      
      const { data: benefits, error } = await supabase
        .from('subscription_benefits')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user benefits:', error);
        return [];
      }

      return benefits || [];
    } catch (error) {
      console.error('Error in getUserBenefits:', error);
      return [];
    }
  }

  /**
   * Initialize subscription benefits for a user
   */
  static async initializeUserBenefits(userId: string, subscriptionTier: string): Promise<void> {
    try {
      if (!supabase) {
        console.error('Supabase client not available');
        return;
      }
      
      const benefits = this.getDefaultBenefits(subscriptionTier);
      
      const { error } = await supabase
        .from('subscription_benefits')
        .upsert(
          benefits.map(benefit => ({
            ...benefit,
            user_id: userId,
            subscription_tier: subscriptionTier,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })),
          { onConflict: 'user_id,subscription_tier,benefit_type' }
        );

      if (error) {
        console.error('Error initializing user benefits:', error);
      } else {
        console.log(`Benefits initialized for user: ${userId} with tier: ${subscriptionTier}`);
      }
    } catch (error) {
      console.error('Error in initializeUserBenefits:', error);
    }
  }

  /**
   * Get default benefits for a subscription tier
   */
  private static getDefaultBenefits(subscriptionTier: string) {
    const baseBenefits = [
      {
        benefit_type: 'monthly_bump',
        benefit_value: 0,
        used_this_month: 0,
        monthly_limit: 0,
        last_reset_at: new Date().toISOString()
      }
    ];

    switch (subscriptionTier) {
      case 'PLUS':
        return [
          {
            benefit_type: 'monthly_bump',
            benefit_value: 3,
            used_this_month: 0,
            monthly_limit: 3,
            last_reset_at: new Date().toISOString()
          },
          {
            benefit_type: 'priority_support',
            benefit_value: 1,
            used_this_month: 0,
            monthly_limit: 1,
            last_reset_at: new Date().toISOString()
          }
        ];

      case 'PRO':
        return [
          {
            benefit_type: 'monthly_bump',
            benefit_value: 10,
            used_this_month: 0,
            monthly_limit: 10,
            last_reset_at: new Date().toISOString()
          },
          {
            benefit_type: 'priority_support',
            benefit_value: 1,
            used_this_month: 0,
            monthly_limit: 1,
            last_reset_at: new Date().toISOString()
          },
          {
            benefit_type: 'analytics',
            benefit_value: 1,
            used_this_month: 0,
            monthly_limit: 1,
            last_reset_at: new Date().toISOString()
          }
        ];

      case 'CREATOR':
        return [
          {
            benefit_type: 'monthly_bump',
            benefit_value: 25,
            used_this_month: 0,
            monthly_limit: 25,
            last_reset_at: new Date().toISOString()
          },
          {
            benefit_type: 'priority_support',
            benefit_value: 1,
            used_this_month: 0,
            monthly_limit: 1,
            last_reset_at: new Date().toISOString()
          },
          {
            benefit_type: 'analytics',
            benefit_value: 1,
            used_this_month: 0,
            monthly_limit: 1,
            last_reset_at: new Date().toISOString()
          }
        ];

      default: // FREE
        return baseBenefits;
    }
  }
}
