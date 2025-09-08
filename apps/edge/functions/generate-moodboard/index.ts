import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface GenerateMoodboardRequest {
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

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
    });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Get user's subscription tier
    const { data: profile } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    const subscriptionTier = profile?.subscription_tier || 'free';
    const requestData: GenerateMoodboardRequest = await req.json();

    // Check rate limits
    await checkRateLimit(supabase, user.id, subscriptionTier);

    // Validate subscription limits
    validateSubscriptionLimits(requestData, subscriptionTier);

    let totalCost = 0;
    const moodboardItems: any[] = [];

    // Process Pexels images
    if (requestData.pexelsQuery) {
      const pexelsImages = await fetchPexelsImages(requestData.pexelsQuery);
      moodboardItems.push(...pexelsImages.map((img, idx) => ({
        ...img,
        position: idx
      })));
    }

    // Process user uploads
    if (requestData.userUploadIds?.length) {
      const userImages = await fetchUserUploads(supabase, requestData.userUploadIds, user.id);
      moodboardItems.push(...userImages.map((img, idx) => ({
        ...img,
        position: moodboardItems.length + idx
      })));
    }

    // Process AI enhancements
    if (requestData.enhancementRequests?.length) {
      const enhancedImages = await processAIEnhancements(
        requestData.enhancementRequests,
        moodboardItems
      );
      moodboardItems.push(...enhancedImages);
      totalCost += enhancedImages.length * 0.025;
    }

    // Create moodboard record
    const { data: moodboard, error: dbError } = await supabase
      .from('moodboards')
      .insert({
        gig_id: requestData.gigId,
        owner_user_id: user.id,
        title: requestData.title,
        summary: `Moodboard with ${moodboardItems.length} curated images`,
        items: moodboardItems,
        palette: extractColorPalette(moodboardItems),
        source_breakdown: calculateSourceBreakdown(moodboardItems),
        total_cost: totalCost,
        ai_provider: totalCost > 0 ? 'nanobanan' : null
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return new Response('Database error', { status: 500 });
    }

    // Update rate limit
    await updateRateLimit(supabase, user.id);

    return new Response(JSON.stringify({
      success: true,
      moodboard,
      totalCost,
      sourceBreakdown: calculateSourceBreakdown(moodboardItems)
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (error) {
    console.error('Moodboard generation error:', error);
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      message: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function checkRateLimit(supabase: any, userId: string, tier: string): Promise<void> {
  const limits = {
    free: 3,
    plus: 10,
    pro: 25
  };

  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('count, last_reset')
    .eq('user_id', userId)
    .eq('action', 'moodboard_generation')
    .single();

  const dailyLimit = limits[tier as keyof typeof limits] || 3;

  if (rateLimit) {
    const lastReset = new Date(rateLimit.last_reset);
    const now = new Date();
    const hoursSinceReset = (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60);

    if (hoursSinceReset < 24 && rateLimit.count >= dailyLimit) {
      throw new Error(`Daily limit of ${dailyLimit} moodboards reached`);
    }
  }
}

async function updateRateLimit(supabase: any, userId: string): Promise<void> {
  await supabase
    .from('rate_limits')
    .upsert({
      user_id: userId,
      action: 'moodboard_generation',
      count: 1,
      last_reset: new Date().toISOString()
    }, {
      onConflict: 'user_id,action',
      ignoreDuplicates: false
    });
}

function validateSubscriptionLimits(request: GenerateMoodboardRequest, tier: string): void {
  const limits = {
    free: { userUploads: 0, aiEnhancements: 0 },
    plus: { userUploads: 3, aiEnhancements: 2 },
    pro: { userUploads: 6, aiEnhancements: 4 }
  };

  const userLimits = limits[tier as keyof typeof limits] || limits.free;

  if (request.userUploadIds && request.userUploadIds.length > userLimits.userUploads) {
    throw new Error(`User uploads exceed limit: ${userLimits.userUploads}`);
  }

  if (request.enhancementRequests && request.enhancementRequests.length > userLimits.aiEnhancements) {
    throw new Error(`AI enhancements exceed limit: ${userLimits.aiEnhancements}`);
  }
}

async function fetchPexelsImages(query: string): Promise<any[]> {
  const pexelsApiKey = Deno.env.get('PEXELS_API_KEY');
  if (!pexelsApiKey) return [];

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&orientation=landscape&size=large&per_page=6`,
      {
        headers: {
          'Authorization': pexelsApiKey
        }
      }
    );

    if (!response.ok) return [];

    const data = await response.json();
    
    return data.photos?.map((photo: any) => ({
      id: `pexels_${photo.id}`,
      source: 'pexels',
      url: photo.src.large,
      thumbnail_url: photo.src.medium,
      attribution: `Photo by ${photo.photographer} on Pexels`,
      photographer_url: photo.photographer_url,
      width: photo.width,
      height: photo.height,
      palette: photo.avg_color ? [photo.avg_color] : []
    })) || [];

  } catch (error) {
    console.error('Pexels fetch error:', error);
    return [];
  }
}

async function fetchUserUploads(supabase: any, uploadIds: string[], userId: string): Promise<any[]> {
  const { data: userMedia } = await supabase
    .from('user_media')
    .select('*')
    .in('id', uploadIds)
    .eq('user_id', userId);

  return userMedia?.map((media: any) => ({
    id: `upload_${media.id}`,
    source: 'user-upload',
    url: media.file_path,
    thumbnail_url: media.file_path,
    attribution: undefined,
    width: media.width,
    height: media.height,
    palette: media.palette || [],
    blurhash: media.blurhash
  })) || [];
}

async function processAIEnhancements(
  enhancementRequests: any[],
  existingItems: any[]
): Promise<any[]> {
  const nanoBananaApiKey = Deno.env.get('NANOBANAN_API_KEY');
  if (!nanoBananaApiKey) return [];

  const enhanced: any[] = [];

  for (const request of enhancementRequests) {
    try {
      const originalItem = existingItems.find(item => item.id === request.imageId);
      if (!originalItem) continue;

      const enhancementPrompt = buildEnhancementPrompt(request.enhancementType, request.prompt);

      const response = await fetch('https://api.nanobananapi.ai/enhance', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${nanoBananaApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          input_image: originalItem.url,
          prompt: enhancementPrompt,
          strength: 0.8,
          aspect_ratio: '4:3'
        })
      });

      if (response.ok) {
        const data = await response.json();
        enhanced.push({
          id: `enhanced_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          source: 'ai-enhanced',
          url: data.output_image,
          thumbnail_url: data.output_image,
          attribution: `AI Enhanced - ${request.enhancementType}`,
          enhancement_prompt: request.prompt,
          original_image_id: originalItem.id,
          position: originalItem.position + 0.5
        });
      }

    } catch (error) {
      console.error(`Enhancement failed for ${request.imageId}:`, error);
    }
  }

  return enhanced;
}

function buildEnhancementPrompt(enhancementType: string, userPrompt: string): string {
  const templates: Record<string, string> = {
    'lighting': `Adjust the lighting in this image to create ${userPrompt} atmosphere`,
    'style': `Apply ${userPrompt} artistic style to this image`,
    'background': `Replace or enhance the background with ${userPrompt}`,
    'mood': `Enhance the overall mood to be ${userPrompt}`
  };

  return templates[enhancementType] || userPrompt;
}

function extractColorPalette(items: any[]): string[] {
  const allColors = items.flatMap(item => item.palette || []).filter(Boolean);
  return [...new Set(allColors)].slice(0, 5);
}

function calculateSourceBreakdown(items: any[]): any {
  return items.reduce((breakdown, item) => {
    switch (item.source) {
      case 'pexels':
        breakdown.pexels++;
        break;
      case 'user-upload':
        breakdown.user_uploads++;
        break;
      case 'ai-enhanced':
        breakdown.ai_enhanced++;
        break;
      case 'ai-generated':
        breakdown.ai_generated++;
        break;
    }
    return breakdown;
  }, { pexels: 0, user_uploads: 0, ai_enhanced: 0, ai_generated: 0 });
}

