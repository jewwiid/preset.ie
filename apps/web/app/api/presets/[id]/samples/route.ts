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
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get verified sample images for the preset
    const { data: samples, error } = await supabase
      .from('preset_images')
      .select(`
        id,
        source_image_url,
        result_image_url,
        prompt_used,
        negative_prompt_used,
        generation_settings,
        generation_provider,
        generation_model,
        is_verified,
        verification_timestamp,
        created_at
      `)
      .eq('preset_id', id)
      .eq('is_verified', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching preset samples:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sample images', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ samples: samples || [] });

  } catch (error) {
    console.error('Error in preset samples API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const {
      sourceImageUrl,
      sourceImageHash,
      resultImageUrl,
      resultImageHash,
      generationId,
      generationProvider,
      generationModel,
      generationCredits,
      prompt,
      negativePrompt,
      generationSettings
    } = body;

    // Validate required fields
    if (!sourceImageUrl || !resultImageUrl || !generationId || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    console.log('POST - Auth header:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('POST - No auth header or invalid format');
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    console.log('POST - Extracted token:', token ? 'present' : 'missing');
    
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
    console.log('POST - User auth result:', { user: user?.id, error: userError?.message });
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication', details: userError?.message },
        { status: 401 }
      );
    }

    // Use the secure function to add the sample
    const { data, error } = await supabase.rpc('add_verified_preset_sample', {
      preset_uuid: id,
      source_image_url_param: sourceImageUrl,
      source_image_hash_param: sourceImageHash || 'placeholder_hash', // In production, calculate actual hash
      result_image_url_param: resultImageUrl,
      result_image_hash_param: resultImageHash || 'placeholder_hash', // In production, calculate actual hash
      generation_id_param: generationId,
      generation_provider_param: generationProvider || 'nanobanana',
      generation_model_param: generationModel,
      generation_credits_param: generationCredits || 0,
      prompt_param: prompt,
      negative_prompt_param: negativePrompt,
      generation_settings_param: generationSettings || {}
    });

    if (error) {
      console.error('Error adding preset sample:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to add sample image' },
        { status: 400 }
      );
    }

    // Track preset usage for sample verification
    try {
      const usageResponse = await supabase.rpc('track_preset_usage', {
        preset_uuid: id,
        usage_type_param: 'sample_verification',
        usage_data_param: {
          sampleId: data,
          generationId: generationId,
          prompt: prompt,
          provider: generationProvider
        }
      });

      if (usageResponse.error) {
        console.warn('⚠️ Failed to track preset usage:', usageResponse.error);
      } else {
        console.log('✅ Preset usage tracked for sample verification');
      }
    } catch (usageError) {
      console.warn('⚠️ Error tracking preset usage:', usageError);
      // Don't fail the sample creation if usage tracking fails
    }

    return NextResponse.json({ 
      success: true, 
      sampleId: data,
      message: 'Sample image added successfully' 
    });

  } catch (error) {
    console.error('Error in preset samples POST API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const sampleId = searchParams.get('sampleId');

    if (!sampleId) {
      return NextResponse.json(
        { error: 'Sample ID required' },
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
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Invalid authentication' },
        { status: 401 }
      );
    }

    // Delete the sample image (RLS will ensure user owns the preset)
    const { error } = await supabase
      .from('preset_sample_images')
      .delete()
      .eq('id', sampleId)
      .eq('preset_id', id);

    if (error) {
      console.error('Error deleting preset sample:', error);
      return NextResponse.json(
        { error: 'Failed to delete sample image' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'Sample image deleted successfully' 
    });

  } catch (error) {
    console.error('Error in preset samples DELETE API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
