/**
 * Plunk Campaign Management Service
 * Create and send targeted email campaigns based on user specializations
 * 
 * Uses Plunk Campaigns API: https://docs.useplunk.com/api-reference/campaigns/create
 */

import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';
import { createClient } from '@supabase/supabase-js';

// Campaign targeting criteria
export interface CampaignTargeting {
  // Role-based targeting
  roles?: ('CONTRIBUTOR' | 'TALENT' | 'BOTH')[];
  
  // Skill-based targeting (from creative-options.ts)
  talentCategories?: string[];  // e.g., ['Actor', 'Model', 'Videographer']
  specializations?: string[];    // e.g., ['Fashion Photography', 'Cinematography']
  
  // Location-based
  cities?: string[];
  countries?: string[];
  
  // Subscription tier
  tiers?: ('FREE' | 'PLUS' | 'PRO' | 'CREATOR')[];
  
  // Engagement level
  verified?: boolean;
  active?: boolean; // Active in last 30 days
  
  // Custom
  styleTags?: string[];
  customFilter?: (user: any) => boolean;
}

export interface CampaignContent {
  subject: string;
  body: string; // HTML content
  style?: 'PLUNK' | 'HTML'; // Default: 'HTML'
}

export interface CampaignOptions {
  name: string;
  targeting: CampaignTargeting;
  content: CampaignContent;
  sendNow?: boolean; // If false, creates draft
  testEmails?: string[]; // Send test before sending to all
}

export class PlunkCampaignsService {
  private plunkApiKey: string;
  private plunkApiUrl = 'https://api.useplunk.com/v1';
  
  constructor() {
    this.plunkApiKey = process.env.PLUNK_API_KEY || '';
    if (!this.plunkApiKey) {
      throw new Error('PLUNK_API_KEY is not set');
    }
  }

  /**
   * Get Supabase admin client for fetching users
   */
  private getSupabaseAdmin() {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
  }

  /**
   * Filter users by marketing email preferences
   * Only returns emails of users who opted into marketing
   */
  private async filterByMarketingPreferences(userIds: string[]): Promise<string[]> {
    const supabase = this.getSupabaseAdmin();
    
    // Get users who opted into marketing emails
    const { data: preferences, error } = await supabase
      .from('notification_preferences')
      .select('user_id')
      .in('user_id', userIds)
      .eq('email_enabled', true)
      .eq('marketing_notifications', true);

    if (error) {
      console.warn('Error checking marketing preferences:', error);
      return []; // Return empty array if error (safe default)
    }

    const optedInUserIds = preferences?.map(p => p.user_id) || [];
    
    console.log(`📧 Marketing filter: ${userIds.length} users → ${optedInUserIds.length} opted-in`);
    
    return optedInUserIds;
  }

  /**
   * Fetch users matching targeting criteria
   */
  async getTargetedUsers(targeting: CampaignTargeting): Promise<string[]> {
    const supabase = this.getSupabaseAdmin();
    
    // Start with base query
    let query = supabase
      .from('users_profile')
      .select('user_id, account_type, primary_skill, talent_category, city, subscription_tier, verified_id, style_tags, last_active_at');

    // Apply role filter
    if (targeting.roles && targeting.roles.length > 0) {
      // Filter users who have any of the specified roles
      query = query.or(targeting.roles.map(role => `account_type.cs.{${role}}`).join(','));
    }

    // Apply subscription tier filter
    if (targeting.tiers && targeting.tiers.length > 0) {
      query = query.in('subscription_tier', targeting.tiers);
    }

    // Apply verified filter
    if (targeting.verified !== undefined) {
      query = query.eq('verified_id', targeting.verified);
    }

    // Apply city filter
    if (targeting.cities && targeting.cities.length > 0) {
      query = query.in('city', targeting.cities);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('Error fetching targeted users:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    if (!profiles || profiles.length === 0) {
      console.log('No users match the targeting criteria');
      return [];
    }

    // Filter by talent categories
    let filteredProfiles = profiles;

    if (targeting.talentCategories && targeting.talentCategories.length > 0) {
      filteredProfiles = filteredProfiles.filter(profile => 
        targeting.talentCategories!.some(category => 
          profile.talent_category === category || 
          profile.primary_skill === category
        )
      );
    }

    // Filter by specializations
    if (targeting.specializations && targeting.specializations.length > 0) {
      filteredProfiles = filteredProfiles.filter(profile =>
        targeting.specializations!.some(spec =>
          profile.primary_skill === spec
        )
      );
    }

    // Filter by style tags
    if (targeting.styleTags && targeting.styleTags.length > 0) {
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.style_tags && Array.isArray(profile.style_tags) &&
        targeting.styleTags!.some(tag => profile.style_tags.includes(tag))
      );
    }

    // Filter by activity (active in last 30 days)
    if (targeting.active) {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      filteredProfiles = filteredProfiles.filter(profile =>
        profile.last_active_at && new Date(profile.last_active_at) > thirtyDaysAgo
      );
    }

    // Apply custom filter
    if (targeting.customFilter) {
      filteredProfiles = filteredProfiles.filter(targeting.customFilter);
    }

    // Get emails from auth.users
    const userIds = filteredProfiles.map(p => p.user_id);
    
    // ✅ CRITICAL: Filter by marketing preferences (GDPR compliance)
    const optedInUserIds = await this.filterByMarketingPreferences(userIds);
    
    if (optedInUserIds.length === 0) {
      console.log('⚠️  No users opted into marketing emails in this segment');
      return [];
    }
    
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error('Error fetching auth users:', authError);
      throw new Error(`Failed to fetch user emails: ${authError.message}`);
    }

    const emails = (users as any[])
      .filter((u: any) => optedInUserIds.includes(u.id) && u.email)
      .map((u: any) => u.email!);

    console.log(`✅ Final recipients: ${emails.length} users (opted into marketing)`);

    return emails;
  }

  /**
   * Create a campaign in Plunk
   * Based on: https://docs.useplunk.com/api-reference/campaigns/create
   */
  async createCampaign(options: CampaignOptions): Promise<{ id: string; recipientCount: number }> {
    console.log(`🎯 Creating campaign: ${options.name}`);
    
    // Get targeted user emails
    const recipientEmails = await this.getTargetedUsers(options.targeting);
    
    if (recipientEmails.length === 0) {
      throw new Error('No recipients match the targeting criteria');
    }

    console.log(`📧 Found ${recipientEmails.length} recipients`);

    // Send test emails if requested
    if (options.testEmails && options.testEmails.length > 0) {
      console.log(`🧪 Sending test to ${options.testEmails.length} email(s)...`);
      await this.sendTestCampaign(options.content, options.testEmails);
    }

    // Create campaign via Plunk API
    const response = await fetch(`${this.plunkApiUrl}/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.plunkApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        subject: options.content.subject,
        body: options.content.body,
        recipients: recipientEmails,
        style: options.content.style || 'HTML'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to create campaign: ${response.status} - ${errorData}`);
    }

    const campaign = await response.json();
    
    console.log(`✅ Campaign created: ${campaign.id}`);
    console.log(`📊 Status: ${campaign.status}`);

    // Send campaign immediately if requested
    if (options.sendNow && campaign.id) {
      await this.sendCampaign(campaign.id);
    }

    return {
      id: campaign.id,
      recipientCount: recipientEmails.length
    };
  }

  /**
   * Send a test campaign to specific emails
   */
  private async sendTestCampaign(content: CampaignContent, testEmails: string[]): Promise<void> {
    const plunk = getPlunkService();
    
    for (const email of testEmails) {
      await plunk.sendTransactionalEmail({
        to: email,
        subject: `[TEST] ${content.subject}`,
        body: content.body
      });
    }
    
    console.log(`✅ Test emails sent to ${testEmails.length} recipient(s)`);
  }

  /**
   * Send an existing campaign
   * Based on: https://docs.useplunk.com/api-reference/campaigns/send
   */
  async sendCampaign(campaignId: string): Promise<void> {
    console.log(`📤 Sending campaign: ${campaignId}`);
    
    const response = await fetch(`${this.plunkApiUrl}/campaigns/${campaignId}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.plunkApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Failed to send campaign: ${response.status} - ${errorData}`);
    }

    console.log(`✅ Campaign sent successfully`);
  }

  /**
   * Get campaign statistics
   */
  async getCampaignStats(campaignId: string): Promise<any> {
    // Note: Plunk API doesn't expose campaign stats endpoint in the docs
    // This would require accessing Plunk dashboard or using webhooks
    console.log(`📊 Campaign stats: Check Plunk dashboard for ${campaignId}`);
    return {
      message: 'View stats in Plunk dashboard',
      campaignId
    };
  }
}

// ============================================
// Helper Functions for Common Campaign Types
// ============================================

/**
 * Create campaign for specific talent categories
 * Example: Target all actors, models, videographers
 */
export async function createTalentCampaign(
  talentCategories: string[],  // e.g., ['Actor', 'Model', 'Videographer']
  content: CampaignContent,
  options?: { sendNow?: boolean; testEmails?: string[] }
): Promise<{ id: string; recipientCount: number }> {
  const service = new PlunkCampaignsService();
  
  return await service.createCampaign({
    name: `Talent Campaign: ${talentCategories.join(', ')}`,
    targeting: {
      roles: ['TALENT', 'BOTH'],
      talentCategories
    },
    content,
    sendNow: options?.sendNow,
    testEmails: options?.testEmails
  });
}

/**
 * Create campaign for specific specializations
 * Example: Target all fashion photographers, cinematographers
 */
export async function createSpecializationCampaign(
  specializations: string[],  // e.g., ['Fashion Photography', 'Cinematography']
  content: CampaignContent,
  options?: { sendNow?: boolean; testEmails?: string[] }
): Promise<{ id: string; recipientCount: number }> {
  const service = new PlunkCampaignsService();
  
  return await service.createCampaign({
    name: `Specialization Campaign: ${specializations.join(', ')}`,
    targeting: {
      roles: ['CONTRIBUTOR', 'BOTH'],
      specializations
    },
    content,
    sendNow: options?.sendNow,
    testEmails: options?.testEmails
  });
}

/**
 * Create campaign for specific styles
 * Example: Target users who work with Fashion, Editorial, etc.
 */
export async function createStyleCampaign(
  styleTags: string[],  // e.g., ['Fashion', 'Editorial', 'Portrait']
  content: CampaignContent,
  options?: { sendNow?: boolean; testEmails?: string[] }
): Promise<{ id: string; recipientCount: number }> {
  const service = new PlunkCampaignsService();
  
  return await service.createCampaign({
    name: `Style Campaign: ${styleTags.join(', ')}`,
    targeting: {
      styleTags
    },
    content,
    sendNow: options?.sendNow,
    testEmails: options?.testEmails
  });
}

/**
 * Create campaign for specific location
 * Example: Target all users in Los Angeles, New York
 */
export async function createLocationCampaign(
  cities: string[],  // e.g., ['Los Angeles', 'New York', 'London']
  content: CampaignContent,
  options?: { sendNow?: boolean; testEmails?: string[] }
): Promise<{ id: string; recipientCount: number }> {
  const service = new PlunkCampaignsService();
  
  return await service.createCampaign({
    name: `Location Campaign: ${cities.join(', ')}`,
    targeting: {
      cities
    },
    content,
    sendNow: options?.sendNow,
    testEmails: options?.testEmails
  });
}

/**
 * Create campaign for verified professionals
 */
export async function createVerifiedProfessionalsCampaign(
  content: CampaignContent,
  options?: { sendNow?: boolean; testEmails?: string[] }
): Promise<{ id: string; recipientCount: number }> {
  const service = new PlunkCampaignsService();
  
  return await service.createCampaign({
    name: 'Verified Professionals Campaign',
    targeting: {
      verified: true,
      active: true
    },
    content,
    sendNow: options?.sendNow,
    testEmails: options?.testEmails
  });
}

/**
 * Create campaign for premium users
 */
export async function createPremiumUsersCampaign(
  content: CampaignContent,
  options?: { sendNow?: boolean; testEmails?: string[] }
): Promise<{ id: string; recipientCount: number }> {
  const service = new PlunkCampaignsService();
  
  return await service.createCampaign({
    name: 'Premium Users Campaign',
    targeting: {
      tiers: ['PLUS', 'PRO']
    },
    content,
    sendNow: options?.sendNow,
    testEmails: options?.testEmails
  });
}

// Export singleton
let instance: PlunkCampaignsService | null = null;

export function getPlunkCampaignsService(): PlunkCampaignsService {
  if (!instance) {
    instance = new PlunkCampaignsService();
  }
  return instance;
}

