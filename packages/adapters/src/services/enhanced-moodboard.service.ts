import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Moodboard, MoodboardItem, SourceBreakdown, EnhancementLogEntry } from '@preset/domain';
import { PexelsService } from '../external/PexelsService';
import { NanoBananaService } from '../external/NanoBananaService';

export interface SubscriptionTier {
  name: string;
  display_name: string;
  max_moodboards_per_day: number;
  max_user_uploads: number;
  max_ai_enhancements: number;
  ai_cost_per_enhancement: number;
}

export interface RateLimitInfo {
  count: number;
  last_reset: string;
  limit: number;
}

export interface GenerateMoodboardRequest {
  gigId: string;
  title: string;
  pexelsQuery?: string;
  userUploadIds?: string[];
  enhancementRequests?: Array<{
    imageId: string;
    enhancementType: string;
    prompt: string;
  }>;
}

export interface MoodboardGenerationResult {
  moodboard: any;
  totalCost: number;
  sourceBreakdown: SourceBreakdown;
}

export class EnhancedMoodboardService {
  private supabase: SupabaseClient;
  private pexelsService: PexelsService | null = null;
  private aiService: NanoBananaService | null = null;
  
  constructor(
    supabaseUrl: string, 
    supabaseKey: string, 
    pexelsApiKey?: string,
    aiApiKey?: string
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    if (pexelsApiKey) {
      this.pexelsService = new PexelsService(pexelsApiKey);
    }
    if (aiApiKey) {
      this.aiService = new NanoBananaService(aiApiKey);
    }
  }

  // Get user's subscription tier
  async getUserSubscriptionTier(userId: string): Promise<SubscriptionTier> {
    const { data: profile } = await this.supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', userId)
      .single();

    const tierName = profile?.subscription_tier || 'free';

    const { data: tier } = await this.supabase
      .from('subscription_tiers')
      .select('*')
      .eq('name', tierName)
      .single();

    return tier || {
      name: 'free',
      display_name: 'Free',
      max_moodboards_per_day: 3,
      max_user_uploads: 0,
      max_ai_enhancements: 0,
      ai_cost_per_enhancement: 0.025
    };
  }

  // Check rate limits
  async checkRateLimit(userId: string, action: string): Promise<RateLimitInfo> {
    const tier = await this.getUserSubscriptionTier(userId);
    const limit = action === 'moodboard_generation' ? tier.max_moodboards_per_day : 0;

    const { data: rateLimit } = await this.supabase
      .from('rate_limits')
      .select('count, last_reset')
      .eq('user_id', userId)
      .eq('action', action)
      .single();

    if (!rateLimit) {
      return { count: 0, last_reset: new Date().toISOString(), limit };
    }

    const lastReset = new Date(rateLimit.last_reset);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    // Reset if more than 24 hours have passed
    if (hoursSinceReset >= 24) {
      await this.supabase
        .from('rate_limits')
        .update({ count: 0, last_reset: now.toISOString() })
        .eq('user_id', userId)
        .eq('action', action);
      
      return { count: 0, last_reset: now.toISOString(), limit };
    }

    return { count: rateLimit.count, last_reset: rateLimit.last_reset, limit };
  }

  // Update rate limit
  async updateRateLimit(userId: string, action: string): Promise<void> {
    await this.supabase
      .from('rate_limits')
      .upsert({
        user_id: userId,
        action,
        count: 1,
        last_reset: new Date().toISOString()
      }, {
        onConflict: 'user_id,action',
        ignoreDuplicates: false
      });
  }

  // Generate enhanced moodboard
  async generateMoodboard(userId: string, request: GenerateMoodboardRequest): Promise<MoodboardGenerationResult> {
    // Check rate limits
    const rateLimit = await this.checkRateLimit(userId, 'moodboard_generation');
    if (rateLimit.count >= rateLimit.limit) {
      throw new Error(`Daily limit of ${rateLimit.limit} moodboards reached`);
    }

    // Get subscription tier
    const tier = await this.getUserSubscriptionTier(userId);

    // Validate subscription limits
    if (request.userUploadIds && request.userUploadIds.length > tier.max_user_uploads) {
      throw new Error(`User uploads exceed limit: ${tier.max_user_uploads}`);
    }

    if (request.enhancementRequests && request.enhancementRequests.length > tier.max_ai_enhancements) {
      throw new Error(`AI enhancements exceed limit: ${tier.max_ai_enhancements}`);
    }

    // Get user profile ID
    const { data: profile } = await this.supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      throw new Error('Profile not found');
    }

    let totalCost = 0;
    const moodboardItems: any[] = [];
    const sourceBreakdown: SourceBreakdown = {
      pexels: 0,
      userUploads: 0,
      aiEnhanced: 0,
      aiGenerated: 0
    };

    // Process Pexels images
    if (request.pexelsQuery && this.pexelsService) {
      const pexelsImages = await this.pexelsService.searchPhotos({
        query: request.pexelsQuery,
        orientation: 'landscape',
        count: 6
      });

      pexelsImages.forEach((photo, index) => {
        moodboardItems.push({
          id: `pexels_${photo.id}`,
          source: 'pexels',
          url: photo.url,
          thumbnail_url: photo.thumbnailUrl,
          attribution: photo.attribution,
          width: photo.width,
          height: photo.height,
          palette: photo.avgColor ? [photo.avgColor] : [],
          position: index
        });
        sourceBreakdown.pexels++;
      });
    }

    // Process user uploads
    if (request.userUploadIds?.length) {
      const userImages = await this.fetchUserUploads(request.userUploadIds, profile.id);
      userImages.forEach((media, index) => {
        moodboardItems.push({
          id: `upload_${media.id}`,
          source: 'user-upload',
          url: media.file_path,
          thumbnail_url: media.file_path,
          attribution: undefined,
          width: media.width,
          height: media.height,
          palette: media.palette || [],
          blurhash: media.blurhash,
          position: moodboardItems.length + index
        });
        sourceBreakdown.userUploads++;
      });
    }

    // Process AI enhancements
    if (request.enhancementRequests?.length && this.aiService) {
      const enhancedImages = await this.processAIEnhancements(
        request.enhancementRequests,
        moodboardItems
      );
      enhancedImages.forEach(enhanced => {
        moodboardItems.push(enhanced);
        sourceBreakdown.aiEnhanced++;
        totalCost += enhanced.cost || 0;
      });
    }

    // Create moodboard record
    const { data: moodboard, error: dbError } = await this.supabase
      .from('moodboards')
      .insert({
        gig_id: request.gigId,
        owner_user_id: profile.id,
        title: request.title,
        summary: `Moodboard with ${moodboardItems.length} curated images`,
        items: moodboardItems,
        palette: this.extractColorPalette(moodboardItems),
        source_breakdown: sourceBreakdown,
        total_cost: totalCost,
        ai_provider: totalCost > 0 ? 'nanobanan' : null
      })
      .select()
      .single();

    if (dbError) {
      throw new Error(`Database error: ${dbError.message}`);
    }

    // Update rate limit
    await this.updateRateLimit(userId, 'moodboard_generation');

    return {
      moodboard,
      totalCost,
      sourceBreakdown
    };
  }

  // Fetch user uploads
  private async fetchUserUploads(uploadIds: string[], userId: string): Promise<any[]> {
    const { data: userMedia } = await this.supabase
      .from('user_media')
      .select('*')
      .in('id', uploadIds)
      .eq('user_id', userId);

    return userMedia || [];
  }

  // Process AI enhancements
  private async processAIEnhancements(
    enhancementRequests: any[],
    existingItems: any[]
  ): Promise<any[]> {
    if (!this.aiService) return [];

    const enhanced: any[] = [];

    for (const request of enhancementRequests) {
      try {
        const originalItem = existingItems.find(item => item.id === request.imageId);
        if (!originalItem) continue;

        const enhanced = await this.aiService.enhanceImage({
          inputImageUrl: originalItem.url,
          enhancementType: request.enhancementType as any,
          prompt: request.prompt,
          strength: 0.8
        });

        enhanced.push({
          id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'ai-enhanced',
          url: enhanced.enhancedUrl,
          thumbnail_url: enhanced.enhancedUrl,
          attribution: `AI Enhanced - ${request.enhancementType}`,
          enhancement_prompt: request.prompt,
          original_image_id: originalItem.id,
          position: originalItem.position + 0.5,
          cost: enhanced.cost
        });

      } catch (error) {
        console.error(`Enhancement failed for ${request.imageId}:`, error);
      }
    }

    return enhanced;
  }

  // Extract color palette from items
  private extractColorPalette(items: any[]): string[] {
    const allColors = items.flatMap(item => item.palette || []).filter(Boolean);
    return [...new Set(allColors)].slice(0, 5);
  }

  // Search Pexels images
  async searchPexelsImages(query: string, page: number = 1): Promise<any[]> {
    if (!this.pexelsService) {
      throw new Error('Pexels API key not configured');
    }
    
    const photos = await this.pexelsService.searchPhotos({
      query,
      page,
      count: 12
    });

    return photos.map(photo => ({
      id: photo.id,
      url: photo.url,
      photographer: photo.attribution.split(' by ')[1]?.split(' on ')[0],
      photographer_url: photo.photographerUrl,
      src: {
        large2x: photo.url,
        medium: photo.thumbnailUrl
      },
      alt: '',
      width: photo.width,
      height: photo.height,
      avg_color: photo.avgColor
    }));
  }

  // Upload user image
  async uploadUserImage(userId: string, file: File): Promise<any> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${crypto.randomUUID()}.${fileExt}`;
    const filePath = `moodboard-uploads/${fileName}`;
    
    const { data, error } = await this.supabase.storage
      .from('moodboard-uploads')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from('moodboard-uploads')
      .getPublicUrl(filePath);
    
    // Save to user_media table
    const { data: mediaData, error: mediaError } = await this.supabase
      .from('user_media')
      .insert({
        user_id: userId,
        file_name: file.name,
        file_path: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        upload_purpose: 'moodboard'
      })
      .select()
      .single();
    
    if (mediaError) throw mediaError;
    
    return mediaData;
  }
}

