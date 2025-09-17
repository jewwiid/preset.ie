import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CinematicFilter } from '../../../../../packages/types/src/cinematic-parameters';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  console.log('Cinematic Search API called');
  
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      console.log('No authorization header provided');
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // Verify user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Parse request body
    const { 
      filters,
      searchQuery,
      limit = 20,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc',
      includePrivate = false
    } = await request.json();

    // Build the query
    let query = supabaseAdmin
      .from('media')
      .select(`
        id,
        owner_user_id,
        gig_id,
        type,
        bucket,
        path,
        filename,
        width,
        height,
        duration,
        palette,
        blurhash,
        exif_json,
        visibility,
        created_at,
        ai_metadata,
        cinematic_tags
      `)
      .eq('type', 'image')
      .not('ai_metadata', 'is', null); // Only include images with cinematic metadata

    // Apply visibility filter
    if (!includePrivate) {
      query = query.eq('visibility', 'public');
    }

    // Apply cinematic filters
    if (filters && typeof filters === 'object') {
      const cinematicFilters = filters as CinematicFilter;

      // Camera angles filter
      if (cinematicFilters.cameraAngles && cinematicFilters.cameraAngles.length > 0) {
        query = query.or(
          cinematicFilters.cameraAngles
            .map(angle => `ai_metadata->>'cameraAngle'.eq.${angle}`)
            .join(',')
        );
      }

      // Lens types filter
      if (cinematicFilters.lensTypes && cinematicFilters.lensTypes.length > 0) {
        query = query.or(
          cinematicFilters.lensTypes
            .map(lens => `ai_metadata->>'lensType'.eq.${lens}`)
            .join(',')
        );
      }

      // Director styles filter
      if (cinematicFilters.directorStyles && cinematicFilters.directorStyles.length > 0) {
        query = query.or(
          cinematicFilters.directorStyles
            .map(style => `ai_metadata->>'directorStyle'.eq.${style}`)
            .join(',')
        );
      }

      // Color palettes filter
      if (cinematicFilters.colorPalettes && cinematicFilters.colorPalettes.length > 0) {
        query = query.or(
          cinematicFilters.colorPalettes
            .map(palette => `ai_metadata->>'colorPalette'.eq.${palette}`)
            .join(',')
        );
      }

      // Scene moods filter
      if (cinematicFilters.sceneMoods && cinematicFilters.sceneMoods.length > 0) {
        query = query.or(
          cinematicFilters.sceneMoods
            .map(mood => `ai_metadata->>'sceneMood'.eq.${mood}`)
            .join(',')
        );
      }

      // Aspect ratios filter
      if (cinematicFilters.aspectRatios && cinematicFilters.aspectRatios.length > 0) {
        query = query.or(
          cinematicFilters.aspectRatios
            .map(ratio => `ai_metadata->>'aspectRatio'.eq.${ratio}`)
            .join(',')
        );
      }

      // Time settings filter
      if (cinematicFilters.timeSettings && cinematicFilters.timeSettings.length > 0) {
        query = query.or(
          cinematicFilters.timeSettings
            .map(time => `ai_metadata->>'timeSetting'.eq.${time}`)
            .join(',')
        );
      }

      // Weather conditions filter
      if (cinematicFilters.weatherConditions && cinematicFilters.weatherConditions.length > 0) {
        query = query.or(
          cinematicFilters.weatherConditions
            .map(weather => `ai_metadata->>'weatherCondition'.eq.${weather}`)
            .join(',')
        );
      }

      // Location types filter
      if (cinematicFilters.locationTypes && cinematicFilters.locationTypes.length > 0) {
        query = query.or(
          cinematicFilters.locationTypes
            .map(location => `ai_metadata->>'locationType'.eq.${location}`)
            .join(',')
        );
      }
    }

    // Apply text search if provided
    if (searchQuery && searchQuery.trim()) {
      // Search in cinematic tags using full-text search
      query = query.textSearch('cinematic_tags', searchQuery.trim());
    }

    // Apply sorting
    if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    } else if (sortBy === 'cinematic_score') {
      // Custom sorting by cinematic metadata richness
      query = query.order('created_at', { ascending: sortOrder === 'asc' });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: results, error: queryError, count } = await query;

    if (queryError) {
      console.error('Query error:', queryError);
      return NextResponse.json(
        { success: false, error: 'Database query failed' },
        { status: 500 }
      );
    }

    // Process results to include public URLs
    const processedResults = await Promise.all(
      (results || []).map(async (item) => {
        // Get public URL for the image
        const { data: urlData } = supabaseAdmin.storage
          .from(item.bucket)
          .getPublicUrl(item.path);

        return {
          ...item,
          url: urlData.publicUrl,
          cinematicMetadata: item.ai_metadata,
          cinematicTags: item.cinematic_tags
        };
      })
    );

    // Get filter options for UI
    const filterOptions = await getFilterOptions(supabaseAdmin);

    return NextResponse.json({
      success: true,
      results: processedResults,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit
      },
      filterOptions
    });

  } catch (error) {
    console.error('Cinematic search error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Get available filter options from the database
 */
async function getFilterOptions(supabaseAdmin: any) {
  try {
    // Get unique values for each cinematic parameter
    const [
      cameraAngles,
      lensTypes,
      directorStyles,
      colorPalettes,
      sceneMoods,
      aspectRatios,
      timeSettings,
      weatherConditions,
      locationTypes
    ] = await Promise.all([
      // Camera angles
      supabaseAdmin
        .from('media')
        .select('ai_metadata->>cameraAngle')
        .not('ai_metadata->>cameraAngle', 'is', null)
        .then(({ data }: any) => [...new Set(data.map((item: any) => item.cameraAngle).filter(Boolean))]),

      // Lens types
      supabaseAdmin
        .from('media')
        .select('ai_metadata->>lensType')
        .not('ai_metadata->>lensType', 'is', null)
        .then(({ data }: any) => [...new Set(data.map((item: any) => item.lensType).filter(Boolean))]),

      // Director styles
      supabaseAdmin
        .from('media')
        .select('ai_metadata->>directorStyle')
        .not('ai_metadata->>directorStyle', 'is', null)
        .then(({ data }: any) => [...new Set(data.map((item: any) => item.directorStyle).filter(Boolean))]),

      // Color palettes
      supabaseAdmin
        .from('media')
        .select('ai_metadata->>colorPalette')
        .not('ai_metadata->>colorPalette', 'is', null)
        .then(({ data }: any) => [...new Set(data.map((item: any) => item.colorPalette).filter(Boolean))]),

      // Scene moods
      supabaseAdmin
        .from('media')
        .select('ai_metadata->>sceneMood')
        .not('ai_metadata->>sceneMood', 'is', null)
        .then(({ data }: any) => [...new Set(data.map((item: any) => item.sceneMood).filter(Boolean))]),

      // Aspect ratios
      supabaseAdmin
        .from('media')
        .select('ai_metadata->>aspectRatio')
        .not('ai_metadata->>aspectRatio', 'is', null)
        .then(({ data }: any) => [...new Set(data.map((item: any) => item.aspectRatio).filter(Boolean))]),

      // Time settings
      supabaseAdmin
        .from('media')
        .select('ai_metadata->>timeSetting')
        .not('ai_metadata->>timeSetting', 'is', null)
        .then(({ data }: any) => [...new Set(data.map((item: any) => item.timeSetting).filter(Boolean))]),

      // Weather conditions
      supabaseAdmin
        .from('media')
        .select('ai_metadata->>weatherCondition')
        .not('ai_metadata->>weatherCondition', 'is', null)
        .then(({ data }: any) => [...new Set(data.map((item: any) => item.weatherCondition).filter(Boolean))]),

      // Location types
      supabaseAdmin
        .from('media')
        .select('ai_metadata->>locationType')
        .not('ai_metadata->>locationType', 'is', null)
        .then(({ data }: any) => [...new Set(data.map((item: any) => item.locationType).filter(Boolean))])
    ]);

    return {
      cameraAngles: cameraAngles.sort(),
      lensTypes: lensTypes.sort(),
      directorStyles: directorStyles.sort(),
      colorPalettes: colorPalettes.sort(),
      sceneMoods: sceneMoods.sort(),
      aspectRatios: aspectRatios.sort(),
      timeSettings: timeSettings.sort(),
      weatherConditions: weatherConditions.sort(),
      locationTypes: locationTypes.sort()
    };
  } catch (error) {
    console.error('Error getting filter options:', error);
    return {
      cameraAngles: [],
      lensTypes: [],
      directorStyles: [],
      colorPalettes: [],
      sceneMoods: [],
      aspectRatios: [],
      timeSettings: [],
      weatherConditions: [],
      locationTypes: []
    };
  }
}

// GET endpoint for filter options only
export async function GET(request: NextRequest) {
  try {
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const filterOptions = await getFilterOptions(supabaseAdmin);
    
    return NextResponse.json({
      success: true,
      filterOptions
    });
  } catch (error) {
    console.error('Filter options error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
