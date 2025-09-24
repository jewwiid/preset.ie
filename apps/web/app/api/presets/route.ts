import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'created_at';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('user_id');

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header if userId is 'me'
    let currentUserId = null;
    if (userId === 'me') {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (!authError && user) {
          currentUserId = user.id;
        }
      }
    } else if (userId) {
      currentUserId = userId;
    }

    // Fetch regular presets
    let query = supabase
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
      `);

    // Apply user filter if specified
    if (currentUserId) {
      query = query.eq('user_id', currentUserId);
    } else {
      // Only show public presets if no user filter
      query = query.eq('is_public', true);
    }

    query = query.order(sort === 'popular' ? 'usage_count' : (sort === 'likes' ? 'likes_count' : sort), { ascending: sort === 'created_at' ? false : (sort === 'name' ? true : false) });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%, description.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data: presets, error, count } = await query;

    // Fetch cinematic presets
    let cinematicQuery = supabase
      .from('cinematic_presets')
      .select(`
        id,
        name,
        display_name,
        description,
        category,
        parameters,
        sort_order,
        is_active,
        created_at,
        updated_at
      `)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    // Apply filters to cinematic presets
    if (category && category !== 'all') {
      cinematicQuery = cinematicQuery.eq('category', category);
    }

    if (search) {
      cinematicQuery = cinematicQuery.or(`display_name.ilike.%${search}%, description.ilike.%${search}%`);
    }

    const { data: cinematicPresets, error: cinematicError } = await cinematicQuery;

    if (error) {
      console.error('Error fetching presets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch presets' },
        { status: 500 }
      );
    }

    // Fetch user profiles for presets that have user_id
    const userIds = [...new Set(presets?.map(p => p.user_id).filter(Boolean) || [])];
    let userProfiles: Record<string, any> = {};
    
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('users_profile')
        .select('id, display_name, handle, avatar_url')
        .in('id', userIds);
      
      if (profiles) {
        userProfiles = profiles.reduce((acc: Record<string, any>, profile: any) => {
          acc[profile.id] = profile;
          return acc;
        }, {});
      }
    }

    // Format regular presets
    const formattedRegularPresets = presets?.map(preset => {
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
        cinematic_settings: undefined, // Regular presets should NOT have cinematic settings unless explicitly set
        sample_images: preset.ai_metadata?.sample_images, // Keep legacy sample_images from ai_metadata for backward compatibility
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
          display_name: preset.user_id ? 'Unknown' : 'Preset',
          handle: preset.user_id ? 'unknown' : 'preset',
          avatar_url: preset.user_id ? null : 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNjQiIHpvb21BbmRQYW49Im1hZ25pZnkiIHZpZXdCb3g9IjAgMCAzNzUgMzc1IiBoZWlnaHQ9IjY0IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2ZXJzaW9uPSIxLjAiPjxkZWZzPjxnLz48Y2xpcFBhdGggaWQ9ImUwNWI5MmY1MTgiPjxwYXRoIGQ9Ik0gMi41NzQyMTkgMi41NzQyMTkgTCAzNzIuNDI1NzgxIDIuNTc0MjE5IEwgMzcyLjQyNTc4MSAzNzIuNDI1NzgxIEwgMi41NzQyMTkgMzcyLjQyNTc4MSBaIE0gMi41NzQyMTkgMi41NzQyMTkgIiBjbGlwLXJ1bGU9Im5vbnplcm8iLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iNjA4M2Q1NTg3MCI+PHBhdGggZD0iTSAxODcuNSAyLjU3NDIxOSBDIDg1LjM2NzE4OCAyLjU3NDIxOSAyLjU3NDIxOSA4NS4zNjcxODggMi41NzQyMTkgMTg3LjUgQyAyLjU3NDIxOSAyODkuNjMyODEyIDg1LjM2NzE4OCAzNzIuNDI1NzgxIDE4Ny41IDM3Mi40MjU3ODEgQyAyODkuNjMyODEyIDM3Mi40MjU3ODEgMzcyLjQyNTc4MSAyODkuNjMyODEyIDM3Mi40MjU3ODEgMTg3LjUgQyAzNzIuNDI1NzgxIDg1LjM2NzE4OCAyODkuNjMyODEyIDIuNTc0MjE5IDE4Ny41IDIuNTc0MjE5IFogTSAxODcuNSAyLjU3NDIxOSAiIGNsaXAtcnVsZT0ibm9uemVybyIvPjwvY2xpcFBhdGg+PGNsaXBQYXRoIGlkPSI3MzhmOTdkMGI0Ij48cGF0aCBkPSJNIDAuNTc0MjE5IDAuNTc0MjE5IEwgMzcwLjQyNTc4MSAwLjU3NDIxOSBMIDM3MC40MjU3ODEgMzcwLjQyNTc4MSBMIDAuNTc0MjE5IDM3MC40MjU3ODEgWiBNIDAuNTc0MjE5IDAuNTc0MjE5ICIgY2xpcC1ydWxlPSJub256ZXJvIi8+PC9jbGlwUGF0aD48Y2xpcFBhdGggaWQ9Ijg4YjdiMDc5YWMiPjxwYXRoIGQ9Ik0gMTg1LjUgMC41NzQyMTkgQyA4My4zNjcxODggMC41NzQyMTkgMC41NzQyMTkgODMuMzY3MTg4IDAuNTc0MjE5IDE4NS41IEMgMC41NzQyMTkgMjg3LjYzMjgxMiA4My4zNjcxODggMzcwLjQyNTc4MSAxODUuNSAzNzAuNDI1NzgxIEMgMjg3LjYzMjgxMiAzNzAuNDI1NzgxIDM3MC40MjU3ODEgMjg3LjYzMjgxMiAzNzAuNDI1NzgxIDE4NS41IEMgMzcwLjQyNTc4MSA4My4zNjcxODggMjg3LjYzMjgxMiAwLjU3NDIxOSAxODUuNSAwLjU3NDIxOSBaIE0gMTg1LjUgMC41NzQyMTkgIiBjbGlwLXJ1bGU9Im5vbnplcm8iLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iMDI5OWY1MzY4MSI+PHJlY3QgeD0iMCIgd2lkdGg9IjM3MSIgeT0iMCIgaGVpZ2h0PSIzNzEiLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iYzM2YWE0MDY2NSI+PHJlY3QgeD0iMCIgd2lkdGg9IjM3NSIgeT0iMCIgaGVpZ2h0PSIzNzUiLz48L2NsaXBQYXRoPjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjZTA1YjkyZjUxOCkiPjxnIGNsaXAtcGF0aD0idXJsKCM2MDgzZDU1ODcwKSI+PGcgdHJhbnNmb3JtPSJtYXRyaXgoMSwgMCwgMCwgMSwgMiwgMikiPjxnIGNsaXAtcGF0aD0idXJsKCMwMjk5ZjUzNjgxKSI+PGcgY2xpcC1wYXRoPSJ1cmwoIzczOGY5N2QwYjQpIj48ZyBjbGlwLXBhdGg9InVybCgjODhiN2IwNzlhYykiPjxwYXRoIGZpbGw9IiMwMDg3NmYiIGQ9Ik0gMC41NzQyMTkgMC41NzQyMTkgTCAzNzAuNDI1NzgxIDAuNTc0MjE5IEwgMzcwLjQyNTc4MSAzNzAuNDI1NzgxIEwgMC41NzQyMTkgMzcwLjQyNTc4MSBaIE0gMC41NzQyMTkgMC41NzQyMTkgIiBmaWxsLW9wYWNpdHk9IjEiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvZz48L2c+PC9nPjwvZz48L2c+PC9nPjxnIHRyYW5zZm9ybT0ibWF0cml4KDEsIDAsIDAsIDEsIDAsIDApIj48ZyBjbGlwLXBhdGg9InVybCgjYzM2YWE0MDY2NSkiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTMuOTc0MiwgMzIzLjY2NTAyMykiPjxnPjxwYXRoIGQ9Ik0gLTI3LjUgLTIzMi4wNTg1OTQgQyAtMzEuMjM0Mzc1IC0yMzEuMDE1NjI1IC0zNC42MzY3MTkgLTIzMC41NzAzMTIgLTM4LjM5ODQzOCAtMjI1Ljk5NjA5NCBDIC00Mi4xNTYyNSAtMjIxLjQyMTg3NSAtNDEuNTgyMDMxIC0yMTcuNTU0Njg4IC0zNC44MDA3ODEgLTE5My4yNTc4MTIgTCAtMTcuMzc4OTA2IC0xMzIuNjQ0NTMxIEMgLTQuMjYxNzE5IC04Ny40NTMxMjUgLTMuMzM5ODQ0IC03NS4xMTcxODggMy4xMjg5MDYgLTUzLjc1MzkwNiBMIDcuNzY5NTMxIC0zOC45MzM1OTQgQyA4LjAyNzM0NCAtMzggOC4xNjAxNTYgLTM3LjUzMTI1IDguNDIxODc1IC0zNi41OTc2NTYgQyA5LjA3NDIxOSAtMzQuMjYxNzE5IDEwLjE5MTQwNiAtMzIuMDU0Njg4IDEwLjg0Mzc1IC0yOS43MTg3NSBDIDEwLjk3MjY1NiAtMjkuMjUzOTA2IDExLjIzNDM3NSAtMjguMzE2NDA2IDExLjM2NzE4OCAtMjcuODUxNTYyIEMgMTIuMDE1NjI1IC0yNS41MTU2MjUgMTIuODAwNzgxIC0yMi43MTA5MzggMTMuNDUzMTI1IC0yMC4zNzUgQyAxNC42MjUgLTE2LjE2Nzk2OSAxNS4yMDMxMjUgLTEyLjMwMDc4MSAxNi40Mjk2ODggLTYuMDk3NjU2IEMgMTYuNzQ2MDk0IC0zLjE2NDA2MiAxNy4zOTg0MzggLTAuODI4MTI1IDE4LjA1MDc4MSAxLjUxMTcxOSBDIDE5Ljc0NjA5NCA3LjU4NTkzOCAyMi41MDM5MDYgMTMuODYzMjgxIDIzLjczNDM3NSAyMC4wNzAzMTIgTCAyNS4zNTE1NjIgMjcuNjc1NzgxIEMgMjcuODA4NTk0IDQwLjA4NTkzOCAzNC45NDUzMTIgMzguNTk3NjU2IDM4LjY4MzU5NCAzNy41NTQ2ODggQyA0OC4wMzEyNSAzNC45NDUzMTIgNDkuMTcxODc1IDMzLjYxNzE4OCA1Mi45MTAxNTYgMzIuNTc0MjE5IEMgNTQuNzc3MzQ0IDMyLjA1NDY4OCA1Ni45MDYyNSAzMi40Njg3NSA1OC43NzczNDQgMzEuOTQ1MzEyIEwgNzUuMTI4OTA2IDI3LjM4MjgxMiBDIDgxLjY3MTg3NSAyNS41NTQ2ODggODMuNTM5MDYyIDI1LjAzNTE1NiA5MS4zMDA3ODEgMjAuMzUxNTYyIEMgOTQuMzA4NTk0IDE4LjUwMzkwNiA5NC44NTE1NjIgMTYuODM5ODQ0IDk0LjUzOTA2MiAxMy45MDYyNSBDIDk0LjE2Nzk2OSA4Ljk3MjY1NiA5Mi41ODIwMzEgNi44OTg0MzggOTEuNDA2MjUgMi42OTE0MDYgTCA4My4xMTcxODggLTI1LjIxMDkzOCBDIDgxLjY3OTY4OCAtMzAuMzUxNTYyIDg1LjE2MDE1NiAtMzIuMzI4MTI1IDg3LjQ5NjA5NCAtMzIuOTgwNDY5IEMgODkuMzYzMjgxIC0zMy41MDM5MDYgOTAuODk0NTMxIC0zMy40MjU3ODEgOTIuNDI5Njg4IC0zMy4zNTE1NjIgQyAxMDguODEyNSAtMzIuMzgyODEyIDEwMy44ODI4MTIgLTMyLjAxNTYyNSAxMTEuODAwNzgxIC0zMC42OTkyMTkgQyAxMTcuNTkzNzUgLTI5Ljc5Njg3NSAxMjcuMjUzOTA2IC0yOS40NzI2NTYgMTQ3LjgxMjUgLTM1LjIxMDkzOCBDIDE1OS4wMjczNDQgLTM4LjMzOTg0NCAyMTIuNTc0MjE5IC01NS44MDQ2ODggMjIyLjI1NzgxMiAtMTIzLjk4MDQ2OSBDIDIyMy42NDg0MzggLTEzMy40MzM1OTQgMjI1LjQxNzk2OSAtMTUwLjU0Njg3NSAyMTUuNTA3ODEyIC0xODYuMDU4NTk0IEMgMjA5Ljc2OTUzMSAtMjA2LjYxNzE4OCAyMDAuMDg1OTM4IC0yMjUuMDY2NDA2IDE3Ny40MTc5NjkgLTI0NC45Mjk2ODggQyAxNjQuMTYwMTU2IC0yNTYuMzM5ODQ0IDE1NC45ODgyODEgLTI2MC4zMjgxMjUgMTQ0LjA3ODEyNSAtMjYzLjMyODEyNSBDIDExMy4wMTE3MTkgLTI3MS43ODEyNSA5NS4zMzIwMzEgLTI2OC4zNTU0NjkgODQuMTIxMDk0IC0yNjUuMjI2NTYyIEMgNzEuOTcyNjU2IC0yNjEuODM1OTM4IDUyLjg2NzE4OCAtMjU0LjQ4ODI4MSA0Mi43MzA0NjkgLTI0Mi4wODk4NDQgQyA0MC43ODUxNTYgLTI0MC4wMzkwNjIgMzguODIwMzEyIC0yMzQuNDUzMTI1IDMzLjY3OTY4OCAtMjMzLjAxOTUzMSBDIDMxLjgwODU5NCAtMjMyLjQ5NjA5NCAyOS40NzI2NTYgLTIzMS44NDM3NSAyNi42OTE0MDYgLTIzNC41OTM3NSBDIDI0Ljc2OTUzMSAtMjM2LjA3MDMxMiAxOS4yMDMxMjUgLTI0MS41NzAzMTIgMTYuOTQ1MzEyIC0yNDIuNDQ5MjE5IEMgMTMuNDg4MjgxIC0yNDQuMDAzOTA2IDUuNDE0MDYyIC0yNDIuMjUzOTA2IC04LjAwMzkwNiAtMjM4LjAwMzkwNiBaIE0gODUuNSAtMTk3LjExNzE4OCBDIDk3LjE4MzU5NCAtMjAwLjM3ODkwNiAxMTQuMTY3OTY5IC0xOTkuMDc0MjE5IDEyNC4xOTUzMTIgLTE5My44MTY0MDYgQyAxMzYuNDg4MjgxIC0xODcuNjc1NzgxIDE0OC43MTA5MzggLTE3MC45NDE0MDYgMTUyLjM2MzI4MSAtMTU3Ljg1OTM3NSBDIDE1Ni4wMTU2MjUgLTE0NC43NzczNDQgMTUzLjg5NDUzMSAtMTM2LjEyNSAxNTIuMjY1NjI1IC0xMzEuMTQwNjI1IEMgMTQ1Ljk1MzEyNSAtMTEyLjI1MzkwNiAxMzAgLTk3LjIyMjY1NiAxMTcuMzg2NzE5IC05My43MDMxMjUgQyAxMDQuNzY5NTMxIC05MC4xODM1OTQgNzkuOTQxNDA2IC05NC4zMzIwMzEgNjguODY3MTg4IC0xMDMuMzI4MTI1IEMgNjEuNjQwNjI1IC0xMDkuMzcxMDk0IDU3LjUgLTExOC43OTI5NjkgNTUuNDE0MDYyIC0xMjYuMjY5NTMxIEMgNDkuOTkyMTg4IC0xNDMuODk0NTMxIDQ4LjkzNzUgLTE1Ni42OTUzMTIgNTYuNzYxNzE5IC0xNzEuOTcyNjU2IEMgNjMuMjM4MjgxIC0xODQuODU5Mzc1IDczLjgyMDMxMiAtMTkzLjg1NTQ2OSA4NS41IC0xOTcuMTE3MTg4IFogTSA4NS41IC0xOTcuMTE3MTg4ICIvPjwvZz48L2c+PC9nPjwvZz48L2c+PC9zdmc+'
        }
      };
    }) || [];

    // Format cinematic presets to match the expected structure
    const formattedCinematicPresets = cinematicPresets?.map(cinematicPreset => {
      // Map generic categories to more specific ones
      let specificCategory = cinematicPreset.category;
      if (cinematicPreset.name === 'portrait') specificCategory = 'portrait';
      else if (cinematicPreset.name === 'landscape') specificCategory = 'nature';
      else if (cinematicPreset.name === 'fashion') specificCategory = 'fashion';
      else if (cinematicPreset.name === 'street') specificCategory = 'street';
      else if (cinematicPreset.name === 'nature') specificCategory = 'nature';
      else if (cinematicPreset.name === 'cinematic') specificCategory = 'cinematic';
      else if (cinematicPreset.name === 'urban') specificCategory = 'cinematic';
      
      return {
        id: `cinematic_${cinematicPreset.id}`,
        name: cinematicPreset.display_name,
        description: cinematicPreset.description,
        category: specificCategory,
        prompt_template: `Create a ${cinematicPreset.display_name.toLowerCase()} image with cinematic quality and professional composition`,
        negative_prompt: '',
        style_settings: {},
        technical_settings: {},
        cinematic_settings: {
          enableCinematicMode: true,
          cinematicParameters: cinematicPreset.parameters,
          enhancedPrompt: true,
          includeTechnicalDetails: true,
          includeStyleReferences: true,
          generationMode: 'text-to-image',
          selectedProvider: 'nanobanana'
        },
        sample_images: undefined,
        ai_metadata: {
          cinematic_settings: {
            enableCinematicMode: true,
            cinematicParameters: cinematicPreset.parameters,
            enhancedPrompt: true,
            includeTechnicalDetails: true,
            includeStyleReferences: true,
            generationMode: 'text-to-image',
            selectedProvider: 'nanobanana'
          }
        },
        seedream_config: {},
        usage_count: 0,
        likes_count: 0,
        is_public: true,
        is_featured: false,
        created_at: cinematicPreset.created_at,
        updated_at: cinematicPreset.updated_at,
        creator: {
          id: 'preset',
          display_name: 'Preset',
          handle: 'preset',
          avatar_url: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iNjQiIHpvb21BbmRQYW49Im1hZ25pZnkiIHZpZXdCb3g9IjAgMCAzNzUgMzc1IiBoZWlnaHQ9IjY0IiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJ4TWlkWU1pZCBtZWV0IiB2ZXJzaW9uPSIxLjAiPjxkZWZzPjxnLz48Y2xpcFBhdGggaWQ9ImUwNWI5MmY1MTgiPjxwYXRoIGQ9Ik0gMi41NzQyMTkgMi41NzQyMTkgTCAzNzIuNDI1NzgxIDIuNTc0MjE5IEwgMzcyLjQyNTc4MSAzNzIuNDI1NzgxIEwgMi41NzQyMTkgMzcyLjQyNTc4MSBaIE0gMi41NzQyMTkgMi41NzQyMTkgIiBjbGlwLXJ1bGU9Im5vbnplcm8iLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iNjA4M2Q1NTg3MCI+PHBhdGggZD0iTSAxODcuNSAyLjU3NDIxOSBDIDg1LjM2NzE4OCAyLjU3NDIxOSAyLjU3NDIxOSA4NS4zNjcxODggMi41NzQyMTkgMTg3LjUgQyAyLjU3NDIxOSAyODkuNjMyODEyIDg1LjM2NzE4OCAzNzIuNDI1NzgxIDE4Ny41IDM3Mi40MjU3ODEgQyAyODkuNjMyODEyIDM3Mi40MjU3ODEgMzcyLjQyNTc4MSAyODkuNjMyODEyIDM3Mi40MjU3ODEgMTg3LjUgQyAzNzIuNDI1NzgxIDg1LjM2NzE4OCAyODkuNjMyODEyIDIuNTc0MjE5IDE4Ny41IDIuNTc0MjE5IFogTSAxODcuNSAyLjU3NDIxOSAiIGNsaXAtcnVsZT0ibm9uemVybyIvPjwvY2xpcFBhdGg+PGNsaXBQYXRoIGlkPSI3MzhmOTdkMGI0Ij48cGF0aCBkPSJNIDAuNTc0MjE5IDAuNTc0MjE5IEwgMzcwLjQyNTc4MSAwLjU3NDIxOSBMIDM3MC40MjU3ODEgMzcwLjQyNTc4MSBMIDAuNTc0MjE5IDM3MC40MjU3ODEgWiBNIDAuNTc0MjE5IDAuNTc0MjE5ICIgY2xpcC1ydWxlPSJub256ZXJvIi8+PC9jbGlwUGF0aD48Y2xpcFBhdGggaWQ9Ijg4YjdiMDc5YWMiPjxwYXRoIGQ9Ik0gMTg1LjUgMC41NzQyMTkgQyA4My4zNjcxODggMC41NzQyMTkgMC41NzQyMTkgODMuMzY3MTg4IDAuNTc0MjE5IDE4NS41IEMgMC41NzQyMTkgMjg3LjYzMjgxMiA4My4zNjcxODggMzcwLjQyNTc4MSAxODUuNSAzNzAuNDI1NzgxIEMgMjg3LjYzMjgxMiAzNzAuNDI1NzgxIDM3MC40MjU3ODEgMjg3LjYzMjgxMiAzNzAuNDI1NzgxIDE4NS41IEMgMzcwLjQyNTc4MSA4My4zNjcxODggMjg3LjYzMjgxMiAwLjU3NDIxOSAxODUuNSAwLjU3NDIxOSBaIE0gMTg1LjUgMC41NzQyMTkgIiBjbGlwLXJ1bGU9Im5vbnplcm8iLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iMDI5OWY1MzY4MSI+PHJlY3QgeD0iMCIgd2lkdGg9IjM3MSIgeT0iMCIgaGVpZ2h0PSIzNzEiLz48L2NsaXBQYXRoPjxjbGlwUGF0aCBpZD0iYzM2YWE0MDY2NSI+PHJlY3QgeD0iMCIgd2lkdGg9IjM3NSIgeT0iMCIgaGVpZ2h0PSIzNzUiLz48L2NsaXBQYXRoPjwvZGVmcz48ZyBjbGlwLXBhdGg9InVybCgjZTA1YjkyZjUxOCkiPjxnIGNsaXAtcGF0aD0idXJsKCM2MDgzZDU1ODcwKSI+PGcgdHJhbnNmb3JtPSJtYXRyaXgoMSwgMCwgMCwgMSwgMiwgMikiPjxnIGNsaXAtcGF0aD0idXJsKCMwMjk5ZjUzNjgxKSI+PGcgY2xpcC1wYXRoPSJ1cmwoIzczOGY5N2QwYjQpIj48ZyBjbGlwLXBhdGg9InVybCgjODhiN2IwNzlhYykiPjxwYXRoIGZpbGw9IiMwMDg3NmYiIGQ9Ik0gMC41NzQyMTkgMC41NzQyMTkgTCAzNzAuNDI1NzgxIDAuNTc0MjE5IEwgMzcwLjQyNTc4MSAzNzAuNDI1NzgxIEwgMC41NzQyMTkgMzcwLjQyNTc4MSBaIE0gMC41NzQyMTkgMC41NzQyMTkgIiBmaWxsLW9wYWNpdHk9IjEiIGZpbGwtcnVsZT0ibm9uemVybyIvPjwvZz48L2c+PC9nPjwvZz48L2c+PC9nPjxnIHRyYW5zZm9ybT0ibWF0cml4KDEsIDAsIDAsIDEsIDAsIDApIj48ZyBjbGlwLXBhdGg9InVybCgjYzM2YWE0MDY2NSkiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PGcgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoOTMuOTc0MiwgMzIzLjY2NTAyMykiPjxnPjxwYXRoIGQ9Ik0gLTI3LjUgLTIzMi4wNTg1OTQgQyAtMzEuMjM0Mzc1IC0yMzEuMDE1NjI1IC0zNC42MzY3MTkgLTIzMC41NzAzMTIgLTM4LjM5ODQzOCAtMjI1Ljk5NjA5NCBDIC00Mi4xNTYyNSAtMjIxLjQyMTg3NSAtNDEuNTgyMDMxIC0yMTcuNTU0Njg4IC0zNC44MDA3ODEgLTE5My4yNTc4MTIgTCAtMTcuMzc4OTA2IC0xMzIuNjQ0NTMxIEMgLTQuMjYxNzE5IC04Ny40NTMxMjUgLTMuMzM5ODQ0IC03NS4xMTcxODggMy4xMjg5MDYgLTUzLjc1MzkwNiBMIDcuNzY5NTMxIC0zOC45MzM1OTQgQyA4LjAyNzM0NCAtMzggOC4xNjAxNTYgLTM3LjUzMTI1IDguNDIxODc1IC0zNi41OTc2NTYgQyA5LjA3NDIxOSAtMzQuMjYxNzE5IDEwLjE5MTQwNiAtMzIuMDU0Njg4IDEwLjg0Mzc1IC0yOS43MTg3NSBDIDEwLjk3MjY1NiAtMjkuMjUzOTA2IDExLjIzNDM3NSAtMjguMzE2NDA2IDExLjM2NzE4OCAtMjcuODUxNTYyIEMgMTIuMDE1NjI1IC0yNS41MTU2MjUgMTIuODAwNzgxIC0yMi43MTA5MzggMTMuNDUzMTI1IC0yMC4zNzUgQyAxNC42MjUgLTE2LjE2Nzk2OSAxNS4yMDMxMjUgLTEyLjMwMDc4MSAxNi40Mjk2ODggLTYuMDk3NjU2IEMgMTYuNzQ2MDk0IC0zLjE2NDA2MiAxNy4zOTg0MzggLTAuODI4MTI1IDE4LjA1MDc4MSAxLjUxMTcxOSBDIDE5Ljc0NjA5NCA3LjU4NTkzOCAyMi41MDM5MDYgMTMuODYzMjgxIDIzLjczNDM3NSAyMC4wNzAzMTIgTCAyNS4zNTE1NjIgMjcuNjc1NzgxIEMgMjcuODA4NTk0IDQwLjA4NTkzOCAzNC45NDUzMTIgMzguNTk3NjU2IDM4LjY4MzU5NCAzNy41NTQ2ODggQyA0OC4wMzEyNSAzNC45NDUzMTIgNDkuMTcxODc1IDMzLjYxNzE4OCA1Mi45MTAxNTYgMzIuNTc0MjE5IEMgNTQuNzc3MzQ0IDMyLjA1NDY4OCA1Ni45MDYyNSAzMi40Njg3NSA1OC43NzczNDQgMzEuOTQ1MzEyIEwgNzUuMTI4OTA2IDI3LjM4MjgxMiBDIDgxLjY3MTg3NSAyNS41NTQ2ODggODMuNTM5MDYyIDI1LjAzNTE1NiA5MS4zMDA3ODEgMjAuMzUxNTYyIEMgOTQuMzA4NTk0IDE4LjUwMzkwNiA5NC44NTE1NjIgMTYuODM5ODQ0IDk0LjUzOTA2MiAxMy45MDYyNSBDIDk0LjE2Nzk2OSA4Ljk3MjY1NiA5Mi41ODIwMzEgNi44OTg0MzggOTEuNDA2MjUgMi42OTE0MDYgTCA4My4xMTcxODggLTI1LjIxMDkzOCBDIDgxLjY3OTY4OCAtMzAuMzUxNTYyIDg1LjE2MDE1NiAtMzIuMzI4MTI1IDg3LjQ5NjA5NCAtMzIuOTgwNDY5IEMgODkuMzYzMjgxIC0zMy41MDM5MDYgOTAuODk0NTMxIC0zMy40MjU3ODEgOTIuNDI5Njg4IC0zMy4zNTE1NjIgQyAxMDguODEyNSAtMzIuMzgyODEyIDEwMy44ODI4MTIgLTMyLjAxNTYyNSAxMTEuODAwNzgxIC0zMC42OTkyMTkgQyAxMTcuNTkzNzUgLTI5Ljc5Njg3NSAxMjcuMjUzOTA2IC0yOS40NzI2NTYgMTQ3LjgxMjUgLTM1LjIxMDkzOCBDIDE1OS4wMjczNDQgLTM4LjMzOTg0NCAyMTIuNTc0MjE5IC01NS44MDQ2ODggMjIyLjI1NzgxMiAtMTIzLjk4MDQ2OSBDIDIyMy42NDg0MzggLTEzMy40MzM1OTQgMjI1LjQxNzk2OSAtMTUwLjU0Njg3NSAyMTUuNTA3ODEyIC0xODYuMDU4NTk0IEMgMjA5Ljc2OTUzMSAtMjA2LjYxNzE4OCAyMDAuMDg1OTM4IC0yMjUuMDY2NDA2IDE3Ny40MTc5NjkgLTI0NC45Mjk2ODggQyAxNjQuMTYwMTU2IC0yNTYuMzM5ODQ0IDE1NC45ODgyODEgLTI2MC4zMjgxMjUgMTQ0LjA3ODEyNSAtMjYzLjMyODEyNSBDIDExMy4wMTE3MTkgLTI3MS43ODEyNSA5NS4zMzIwMzEgLTI2OC4zNTU0NjkgODQuMTIxMDk0IC0yNjUuMjI2NTYyIEMgNzEuOTcyNjU2IC0yNjEuODM1OTM4IDUyLjg2NzE4OCAtMjU0LjQ4ODI4MSA0Mi43MzA0NjkgLTI0Mi4wODk4NDQgQyA0MC43ODUxNTYgLTI0MC4wMzkwNjIgMzguODIwMzEyIC0yMzQuNDUzMTI1IDMzLjY3OTY4OCAtMjMzLjAxOTUzMSBDIDMxLjgwODU5NCAtMjMyLjQ5NjA5NCAyOS40NzI2NTYgLTIzMS44NDM3NSAyNi42OTE0MDYgLTIzNC41OTM3NSBDIDI0Ljc2OTUzMSAtMjM2LjA3MDMxMiAxOS4yMDMxMjUgLTI0MS41NzAzMTIgMTYuOTQ1MzEyIC0yNDIuNDQ5MjE5IEMgMTMuNDg4MjgxIC0yNDQuMDAzOTA2IDUuNDE0MDYyIC0yNDIuMjUzOTA2IC04LjAwMzkwNiAtMjM4LjAwMzkwNiBaIE0gODUuNSAtMTk3LjExNzE4OCBDIDk3LjE4MzU5NCAtMjAwLjM3ODkwNiAxMTQuMTY3OTY5IC0xOTkuMDc0MjE5IDEyNC4xOTUzMTIgLTE5My44MTY0MDYgQyAxMzYuNDg4MjgxIC0xODcuNjc1NzgxIDE0OC43MTA5MzggLTE3MC45NDE0MDYgMTUyLjM2MzI4MSAtMTU3Ljg1OTM3NSBDIDE1Ni4wMTU2MjUgLTE0NC43NzczNDQgMTUzLjg5NDUzMSAtMTM2LjEyNSAxNTIuMjY1NjI1IC0xMzEuMTQwNjI1IEMgMTQ1Ljk1MzEyNSAtMTEyLjI1MzkwNiAxMzAgLTk3LjIyMjY1NiAxMTcuMzg2NzE5IC05My43MDMxMjUgQyAxMDQuNzY5NTMxIC05MC4xODM1OTQgNzkuOTQxNDA2IC05NC4zMzIwMzEgNjguODY3MTg4IC0xMDMuMzI4MTI1IEMgNjEuNjQwNjI1IC0xMDkuMzcxMDk0IDU3LjUgLTExOC43OTI5NjkgNTUuNDE0MDYyIC0xMjYuMjY5NTMxIEMgNDkuOTkyMTg4IC0xNDMuODk0NTMxIDQ4LjkzNzUgLTE1Ni42OTUzMTIgNTYuNzYxNzE5IC0xNzEuOTcyNjU2IEMgNjMuMjM4MjgxIC0xODQuODU5Mzc1IDczLjgyMDMxMiAtMTkzLjg1NTQ2OSA4NS41IC0xOTcuMTE3MTg4IFogTSA4NS41IC0xOTcuMTE3MTg4ICIvPjwvZz48L2c+PC9nPjwvZz48L2c+PC9zdmc+'
        }
      };
    }) || [];

    // Combine both types of presets
    let formattedPresets = [...formattedCinematicPresets, ...formattedRegularPresets];


    // Apply client-side sorting for combined results
    if (sort === 'popular' || sort === 'usage_count') {
      formattedPresets.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0));
    } else if (sort === 'likes' || sort === 'likes_count') {
      formattedPresets.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
    } else if (sort === 'name') {
      formattedPresets.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'created_at') {
      formattedPresets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    // Fetch sample images from the dedicated table for each preset (only for regular presets)
    for (const preset of formattedPresets) {
      // Skip cinematic presets as they don't have sample images
      if (preset.id.startsWith('cinematic_')) {
        continue;
      }
      
      try {
        const { data: sampleImages } = await supabase
          .from('preset_images')
          .select('image_url, image_type')
          .eq('preset_id', preset.id)
          .order('image_type, created_at')
        
        if (sampleImages && sampleImages.length > 0) {
          const beforeImages = sampleImages.filter(img => img.image_type === 'before').map(img => img.image_url)
          const afterImages = sampleImages.filter(img => img.image_type === 'after').map(img => img.image_url)
          
          // Override sample_images with data from the dedicated table
          preset.sample_images = {
            before_images: beforeImages,
            after_images: afterImages,
            descriptions: [
              ...beforeImages.map(() => 'Original input image'),
              ...afterImages.map(() => 'Generated result')
            ]
          }
        }
      } catch (error) {
        console.error(`Error fetching sample images for preset ${preset.id}:`, error)
        // Keep the legacy sample_images from ai_metadata if the new table fails
      }
    }

    // Apply pagination to combined results
    const totalPresets = formattedPresets.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedPresets = formattedPresets.slice(startIndex, endIndex);
    
    const totalPages = Math.ceil(totalPresets / limit);

    return NextResponse.json({
      presets: paginatedPresets,
      pagination: {
        page,
        limit,
        total: totalPresets,
        pages: totalPages
      }
    });

  } catch (error) {
    console.error('Error in presets API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      category,
      prompt_template,
      negative_prompt,
        style_settings,
        technical_settings,
        cinematic_settings,
        sample_images,
        ai_metadata,
        seedream_config,
        is_public,
        is_featured
    } = body;

    // Merge cinematic_settings and sample_images into ai_metadata since that's what the database expects
    const mergedAiMetadata = {
      ...ai_metadata,
      cinematic_settings: cinematic_settings,
      sample_images: sample_images
    };

    // Validate required fields
    if (!name || !prompt_template) {
      return NextResponse.json(
        { error: 'Name and prompt template are required' },
        { status: 400 }
      );
    }

    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token and get user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Check for existing preset with same name (case-insensitive)
    const { data: existingPreset, error: checkError } = await supabase
      .from('presets')
      .select('id, name, user_id')
      .ilike('name', name.trim())
      .single();

    if (existingPreset) {
      // If it's a system preset (user_id is null), don't allow user to create duplicate
      if (existingPreset.user_id === null) {
        return NextResponse.json(
          { error: `A preset named "${name}" already exists. Please choose a different name.` },
          { status: 409 }
        );
      }
      // If it's the same user's preset, suggest updating instead
      if (existingPreset.user_id === user.id) {
        return NextResponse.json(
          { error: `You already have a preset named "${name}". Please choose a different name or update the existing one.` },
          { status: 409 }
        );
      }
      // If it's another user's preset, allow creation (different users can have same preset names)
    }

    // Create preset
    const { data: preset, error: insertError } = await supabase
      .from('presets')
      .insert({
        name,
        description,
        category,
        prompt_template,
        negative_prompt,
        style_settings,
        technical_settings,
        ai_metadata: mergedAiMetadata,
        seedream_config,
        is_public: is_public || false,
        is_featured: is_featured || false,
        user_id: user.id,
        usage_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating preset:', insertError);
      return NextResponse.json(
        { error: 'Failed to create preset' },
        { status: 500 }
      );
    }

    // Copy sample images to dedicated table if they exist
    if (sample_images && (sample_images.before_images?.length > 0 || sample_images.after_images?.length > 0)) {
      try {
        // Create preset_images table if it doesn't exist
        const createTableQuery = `
          CREATE TABLE IF NOT EXISTS preset_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            preset_id UUID NOT NULL REFERENCES presets(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            image_type VARCHAR(20) NOT NULL CHECK (image_type IN ('before', 'after')),
            original_gallery_id UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
          
          CREATE INDEX IF NOT EXISTS idx_preset_images_preset_id ON preset_images(preset_id);
          CREATE INDEX IF NOT EXISTS idx_preset_images_type ON preset_images(image_type);
          
          ALTER TABLE preset_images ENABLE ROW LEVEL SECURITY;
          
          DROP POLICY IF EXISTS "Users can manage preset images for their presets" ON preset_images;
          CREATE POLICY "Users can manage preset images for their presets" ON preset_images
            FOR ALL USING (
              auth.uid() = (SELECT user_id FROM presets WHERE id = preset_images.preset_id)
            );
        `
        
        // Execute the table creation (ignore errors if table already exists)
        try {
          await supabase.rpc('exec_sql', { sql: createTableQuery })
        } catch (error) {
          // Table might already exist, continue
          console.log('Table creation failed (might already exist):', error)
        }

        // Insert sample images
        const imageInserts = []
        
        // Process before images
        if (sample_images.before_images && sample_images.before_images.length > 0) {
          for (const imageUrl of sample_images.before_images) {
            imageInserts.push({
              preset_id: preset.id,
              image_url: imageUrl,
              image_type: 'before',
              original_gallery_id: null
            })
          }
        }
        
        // Process after images
        if (sample_images.after_images && sample_images.after_images.length > 0) {
          for (const imageUrl of sample_images.after_images) {
            imageInserts.push({
              preset_id: preset.id,
              image_url: imageUrl,
              image_type: 'after',
              original_gallery_id: null
            })
          }
        }

        if (imageInserts.length > 0) {
          const { error: imageInsertError } = await supabase
            .from('preset_images')
            .insert(imageInserts)
          
          if (imageInsertError) {
            console.error('Error inserting preset images:', imageInsertError)
            // Don't fail the entire preset creation, just log the error
          }
        }
      } catch (imageError) {
        console.error('Error copying sample images:', imageError)
        // Don't fail the entire preset creation, just log the error
      }
    }

    return NextResponse.json({
      id: preset.id,
      message: 'Preset created successfully'
    });

  } catch (error) {
    console.error('Error creating preset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { presetId } = body;

    if (!presetId) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if it's a cinematic preset
    if (presetId.startsWith('cinematic_')) {
      const actualId = presetId.replace('cinematic_', '');
      
      // For cinematic presets, we'll track usage in a separate table or add a usage_count field
      // For now, we'll just return success as cinematic presets don't have usage tracking yet
      return NextResponse.json({
        message: 'Usage tracked for cinematic preset'
      });
    }

    // Increment usage count for regular presets
    // First get the current usage count
    const { data: currentPreset, error: fetchError } = await supabase
      .from('presets')
      .select('usage_count')
      .eq('id', presetId)
      .single();

    if (fetchError || !currentPreset) {
      console.error('Error fetching preset for usage update:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch preset for usage update' },
        { status: 500 }
      );
    }

    // Increment the usage count
    const { error } = await supabase
      .from('presets')
      .update({ 
        usage_count: (currentPreset.usage_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', presetId);

    if (error) {
      console.error('Error updating preset usage:', error);
      return NextResponse.json(
        { error: 'Failed to update preset usage' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Usage tracked successfully'
    });

  } catch (error) {
    console.error('Error tracking preset usage:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const presetId = searchParams.get('id');

    if (!presetId) {
      return NextResponse.json(
        { error: 'Preset ID is required' },
        { status: 400 }
      );
    }

    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user token and get user ID
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Delete preset (RLS policy ensures user can only delete their own presets)
    const { error: deleteError } = await supabase
      .from('presets')
      .delete()
      .eq('id', presetId)
      .eq('user_id', user.id); // Double check ownership

    if (deleteError) {
      console.error('Error deleting preset:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete preset' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Preset deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting preset:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}