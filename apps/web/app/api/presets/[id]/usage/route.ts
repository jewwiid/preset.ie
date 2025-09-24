import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      usageType,
      usageData = {}
    } = body;

    // Validate required fields
    if (!usageType) {
      return NextResponse.json(
        { error: 'Usage type is required' },
        { status: 400 }
      );
    }

    // Validate usage type
    const validUsageTypes = ['playground_generation', 'showcase_creation', 'sample_verification'];
    if (!validUsageTypes.includes(usageType)) {
      return NextResponse.json(
        { error: 'Invalid usage type' },
        { status: 400 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Create Supabase client with the user's access token for auth
    const supabase = createClient(
      supabaseUrl,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      }
    );
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Track the usage using the database function
    const { data, error } = await supabase.rpc('track_preset_usage', {
      preset_uuid: id,
      usage_type_param: usageType,
      usage_data_param: usageData
    });

    if (error) {
      console.error('Error tracking preset usage:', error);
      return NextResponse.json(
        { error: 'Failed to track usage', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      usageId: data,
      message: 'Usage tracked successfully' 
    });

  } catch (error) {
    console.error('Error in preset usage API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Create Supabase client with service role key for stats
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get usage statistics
    const { data: stats, error: statsError } = await supabase.rpc('get_preset_usage_stats', {
      preset_uuid: id
    });

    if (statsError) {
      console.error('Error fetching preset usage stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch usage stats', details: statsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      stats: stats[0] || {
        total_uses: 0,
        uses_24h: 0,
        uses_7d: 0,
        uses_30d: 0,
        unique_users: 0
      }
    });

  } catch (error) {
    console.error('Error in preset usage stats API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}