import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const generationId = searchParams.get('generationId');

    if (!generationId) {
      return NextResponse.json(
        { error: 'Generation ID is required' },
        { status: 400 }
      );
    }

    // Handle cinematic preset IDs with prefix
    let actualId = id;
    let isCinematicPreset = false;
    
    if (id.startsWith('cinematic_')) {
      actualId = id.replace('cinematic_', '');
      isCinematicPreset = true;
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
        { error: 'Invalid authentication', details: userError?.message },
        { status: 401 }
      );
    }

    // Check if the generation can be submitted as a sample
    const { data: checkResult, error } = await supabase.rpc('can_submit_generation_as_sample', {
      preset_uuid: actualId,
      generation_id_param: generationId
    });

    if (error) {
      console.error('Error checking if generation can be submitted:', error);
      return NextResponse.json(
        { error: 'Failed to check generation eligibility', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      canSubmit: checkResult.can_submit,
      reason: checkResult.reason,
      presetId: actualId,
      generationId: generationId
    });

  } catch (error) {
    console.error('Error in can-submit-sample API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
