import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit');
    const includeInactive = searchParams.get('includeInactive') === 'true';

    // Fetch platform images from the database
    let query = supabase
      .from('platform_images')
      .select('*')
      .order('display_order', { ascending: true });

    // Only filter by is_active if includeInactive is false (default behavior)
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    // Apply limit if provided
    if (limit) {
      query = query.limit(parseInt(limit));
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching platform images:', error);
      return NextResponse.json({ error: 'Failed to fetch platform images' }, { status: 500 });
    }

    // Return in format expected by admin page
    return NextResponse.json({ images: data || [] });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const body = await request.json();
    console.log('POST body received:', JSON.stringify(body, null, 2));

    // Validate required fields
    if (!body.image_url) {
      console.error('Missing image_url in request');
      return NextResponse.json({ error: 'image_url is required' }, { status: 400 });
    }

    // Create the image record (exclude thumbnail_url as it may not exist in schema)
    const insertData: Record<string, any> = {
      image_key: body.image_key || `image_${Date.now()}`,
      image_type: body.image_type || 'general',
      image_url: body.image_url,
      alt_text: body.alt_text || '',
      title: body.title || '',
      width: body.width || 1024,
      height: body.height || 1024,
      file_size: body.file_size || 0,
      format: body.format || 'jpg',
      usage_context: body.usage_context || {},
      is_active: body.is_active !== undefined ? body.is_active : true,
      display_order: body.display_order || 0,
    };

    // Only add optional fields if they have values
    if (body.category) insertData.category = body.category;
    if (body.description) insertData.description = body.description;
    if (body.thumbnail_url) insertData.thumbnail_url = body.thumbnail_url;

    console.log('Inserting data:', JSON.stringify(insertData, null, 2));

    const { data: image, error } = await supabase
      .from('platform_images')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Supabase error creating platform image:', error);
      return NextResponse.json({
        error: 'Failed to create platform image',
        details: error.message
      }, { status: 500 });
    }

    console.log('Image created successfully:', image.id);
    return NextResponse.json({ image }, { status: 201 });
  } catch (error) {
    console.error('Error in platform images POST API:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}