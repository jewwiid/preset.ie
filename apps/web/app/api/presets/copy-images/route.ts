import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase'
import { getUserFromRequest } from '../../../../lib/auth-utils'

export async function POST(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { presetId, sampleImages } = await request.json()
    
    if (!presetId || !sampleImages) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the preset belongs to the user
    const { data: preset, error: presetError } = await supabaseAdmin
      .from('presets')
      .select('id, user_id')
      .eq('id', presetId)
      .eq('user_id', user.id)
      .single()
    
    if (presetError || !preset) {
      return NextResponse.json(
        { error: 'Preset not found or unauthorized' },
        { status: 404 }
      )
    }

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
    
    try {
      await supabaseAdmin.rpc('exec_sql', { sql: createTableQuery })
    } catch (error) {
      // Table might already exist, continue
      console.log('Table creation failed (might already exist):', error)
    }

    // Delete existing sample images for this preset
    await supabaseAdmin
      .from('preset_images')
      .delete()
      .eq('preset_id', presetId)

    // Insert new sample images
    const imageInserts = []
    
    // Process before images
    if (sampleImages.before_images && sampleImages.before_images.length > 0) {
      for (const imageUrl of sampleImages.before_images) {
        imageInserts.push({
          preset_id: presetId,
          image_url: imageUrl,
          image_type: 'before',
          original_gallery_id: null // We'll track this if needed
        })
      }
    }
    
    // Process after images
    if (sampleImages.after_images && sampleImages.after_images.length > 0) {
      for (const imageUrl of sampleImages.after_images) {
        imageInserts.push({
          preset_id: presetId,
          image_url: imageUrl,
          image_type: 'after',
          original_gallery_id: null
        })
      }
    }

    if (imageInserts.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('preset_images')
        .insert(imageInserts)
      
      if (insertError) {
        console.error('Error inserting preset images:', insertError)
        return NextResponse.json(
          { error: 'Failed to save sample images' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Sample images saved successfully',
      count: imageInserts.length
    })
    
  } catch (error) {
    console.error('Failed to copy images for preset:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to copy images'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }

    const { searchParams } = new URL(request.url)
    const presetId = searchParams.get('presetId')
    
    if (!presetId) {
      return NextResponse.json(
        { error: 'Missing presetId parameter' },
        { status: 400 }
      )
    }

    // Verify the preset belongs to the user
    const { data: preset, error: presetError } = await supabaseAdmin
      .from('presets')
      .select('id, user_id')
      .eq('id', presetId)
      .eq('user_id', user.id)
      .single()
    
    if (presetError || !preset) {
      return NextResponse.json(
        { error: 'Preset not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get sample images for this preset
    const { data: images, error: imagesError } = await supabaseAdmin
      .from('preset_images')
      .select('*')
      .eq('preset_id', presetId)
      .order('image_type, created_at')
    
    if (imagesError) {
      console.error('Error fetching preset images:', imagesError)
      return NextResponse.json(
        { error: 'Failed to fetch sample images' },
        { status: 500 }
      )
    }

    // Group images by type
    const beforeImages = images?.filter(img => img.image_type === 'before').map(img => img.image_url) || []
    const afterImages = images?.filter(img => img.image_type === 'after').map(img => img.image_url) || []

    return NextResponse.json({
      success: true,
      sample_images: {
        before_images: beforeImages,
        after_images: afterImages,
        descriptions: [
          ...beforeImages.map(() => 'Original input image'),
          ...afterImages.map(() => 'Generated result')
        ]
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch preset images:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch images'
    }, { status: 500 })
  }
}
