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
    
    // Handle cinematic preset IDs with prefix
    let actualId = id;
    let isCinematicPreset = false;
    
    if (id.startsWith('cinematic_')) {
      actualId = id.replace('cinematic_', '');
      isCinematicPreset = true;
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the preset exists
    const tableName = isCinematicPreset ? 'cinematic_presets' : 'presets';
    const { data: preset, error: presetError } = await supabase
      .from(tableName)
      .select('id, name, is_public')
      .eq('id', actualId)
      .single();

    if (presetError || !preset) {
      return NextResponse.json(
        { error: 'Preset not found' },
        { status: 404 }
      );
    }

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
        title,
        description,
        tags,
        created_at
      `)
      .eq('preset_id', actualId)
      .eq('is_verified', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching preset samples:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sample images', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      samples: samples || [],
      preset: {
        id: preset.id,
        name: preset.name
      }
    });

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
    
    // Handle cinematic preset IDs with prefix
    let actualId = id;
    let isCinematicPreset = false;
    
    if (id.startsWith('cinematic_')) {
      actualId = id.replace('cinematic_', '');
      isCinematicPreset = true;
    }

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
      generationSettings,
      title,
      description,
      tags
    } = body;

    // Validate required fields
    if (!resultImageUrl || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: resultImageUrl and prompt are required' },
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

    // Use the secure function to add the sample
    const { data, error } = await supabase.rpc('add_verified_preset_sample', {
      preset_uuid: actualId,
      result_image_url_param: resultImageUrl,
      prompt_param: prompt,
      generation_id_param: generationId,
      source_image_url_param: sourceImageUrl || null,
      source_image_hash_param: sourceImageHash || null,
      result_image_hash_param: resultImageHash || null,
      generation_provider_param: generationProvider || 'nanobanana',
      generation_model_param: generationModel || null,
      generation_credits_param: generationCredits || 0,
      negative_prompt_param: negativePrompt || null,
      generation_settings_param: generationSettings || {}
    });

    if (error) {
      console.error('Error adding preset sample:', error);
      return NextResponse.json(
        { error: error.message || 'Failed to add sample image' },
        { status: 400 }
      );
    }

    // Update the sample with additional metadata if provided
    if (title || description || tags) {
      const { error: updateError } = await supabase
        .from('preset_images')
        .update({
          title: title || null,
          description: description || null,
          tags: tags || []
        })
        .eq('id', data);

      if (updateError) {
        console.warn('Failed to update sample metadata:', updateError);
      }
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
    
    // Handle cinematic preset IDs with prefix
    let actualId = id;
    let isCinematicPreset = false;
    
    if (id.startsWith('cinematic_')) {
      actualId = id.replace('cinematic_', '');
      isCinematicPreset = true;
    }

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

    // Delete the sample image (RLS will ensure user owns the preset)
    const { error } = await supabase
      .from('preset_images')
      .delete()
      .eq('id', sampleId)
      .eq('preset_id', actualId)
      .eq('user_id', user.id);

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
