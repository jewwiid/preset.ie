import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const days = parseInt(searchParams.get('days') || '7'); // Default to last 7 days

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get trending presets based on recent likes
    const { data: trendingPresets, error } = await supabase
      .from('presets')
      .select(`
        id,
        name,
        description,
        category,
        prompt_template,
        negative_prompt,
        style_settings,
        technical_settings,
        ai_metadata,
        seedream_config,
        usage_count,
        likes_count,
        is_public,
        is_featured,
        created_at,
        updated_at,
        user_id
      `)
      .eq('is_public', true)
      .gte('likes_count', 1) // Only presets with at least 1 like
      .order('likes_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching trending presets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch trending presets' },
        { status: 500 }
      );
    }

    // Get recent likes for these presets to calculate trending score
    const presetIds = trendingPresets?.map(p => p.id) || [];

    if (presetIds.length > 0) {
      const { data: recentLikes } = await supabase
        .from('preset_likes')
        .select('preset_id, created_at')
        .in('preset_id', presetIds)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

      // Calculate trending score (recent likes weighted more heavily)
      const trendingScores = new Map();

      recentLikes?.forEach(like => {
        const daysAgo = (Date.now() - new Date(like.created_at).getTime()) / (24 * 60 * 60 * 1000);
        const weight = Math.max(0, 1 - (daysAgo / days)); // Weight decreases over time
        const currentScore = trendingScores.get(like.preset_id) || 0;
        trendingScores.set(like.preset_id, currentScore + weight);
      });

      // Sort presets by trending score
      trendingPresets?.sort((a, b) => {
        const scoreA = trendingScores.get(a.id) || 0;
        const scoreB = trendingScores.get(b.id) || 0;
        return scoreB - scoreA;
      });
    }

    // Fetch user profiles for creators
    // NOTE: presets.user_id references auth.users.id, so lookup users_profile by user_id field
    const userIds = [...new Set(trendingPresets?.map(p => p.user_id).filter(Boolean) || [])];
    let userProfiles: Record<string, any> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('users_profile')
        .select('id, user_id, display_name, handle, avatar_url')
        .in('user_id', userIds); // Fixed: lookup by user_id, not id

      if (profiles) {
        userProfiles = profiles.reduce((acc: Record<string, any>, profile: any) => {
          acc[profile.user_id] = profile; // Fixed: index by user_id to match presets.user_id
          return acc;
        }, {});
      }
    }

    // Format response
    const formattedPresets = trendingPresets?.map(preset => {
      const userProfile = preset.user_id ? userProfiles[preset.user_id] : null;

      return {
        id: preset.id,
        name: preset.name,
        description: preset.description,
        category: preset.category,
        prompt_template: preset.prompt_template,
        negative_prompt: preset.negative_prompt,
        style_settings: preset.style_settings,
        technical_settings: preset.technical_settings,
        cinematic_settings: preset.ai_metadata?.cinematic_settings,
        sample_images: preset.ai_metadata?.sample_images,
        ai_metadata: preset.ai_metadata,
        seedream_config: preset.seedream_config,
        usage_count: preset.usage_count || 0,
        likes_count: preset.likes_count || 0,
        is_public: preset.is_public,
        is_featured: preset.is_featured,
        created_at: preset.created_at,
        updated_at: preset.updated_at,
        creator: userProfile ? {
          id: userProfile.id,
          display_name: userProfile.display_name || 'Unknown',
          handle: userProfile.handle || 'unknown',
          avatar_url: userProfile.avatar_url
        } : {
          id: preset.user_id || 'preset',
          display_name: preset.user_id ? 'Unknown' : 'System',
          handle: preset.user_id ? 'unknown' : 'preset',
          avatar_url: null
        }
      };
    }) || [];

    return NextResponse.json({
      presets: formattedPresets,
      period: `${days} days`,
      count: formattedPresets.length
    });

  } catch (error) {
    console.error('Error in trending presets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
