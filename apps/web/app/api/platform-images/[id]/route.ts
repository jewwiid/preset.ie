import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // For now, allow any authenticated user to manage platform images
    // In production, you should implement proper admin role checking
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    
    // First, get the current image to check if we need to delete the old file
    const { data: currentImage, error: fetchError } = await supabaseAdmin
      .from('platform_images')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // If there's a new image_url and it's different from the current one,
    // we should delete the old file from storage
    if (body.image_url && body.image_url !== currentImage.image_url) {
      try {
        // Extract the file path from the URL
        const url = new URL(currentImage.image_url);
        const filePath = url.pathname.split('/').slice(-2).join('/'); // Get the last two path segments
        
        // Delete the old file from storage
        const { error: deleteError } = await supabaseAdmin.storage
          .from('platform-images')
          .remove([filePath]);
          
        if (deleteError) {
          console.warn('Failed to delete old image file:', deleteError);
          // Don't fail the update if file deletion fails
        }
      } catch (error) {
        console.warn('Error deleting old image file:', error);
        // Don't fail the update if file deletion fails
      }
    }

    // Prepare update data
    const updateData: any = {
      ...body,
      updated_at: new Date().toISOString()
    };

    // Remove id from update data if it exists
    delete updateData.id;

    // Update the image record
    const { data: image, error } = await supabaseAdmin
      .from('platform_images')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating platform image:', error);
      return NextResponse.json({ error: 'Failed to update platform image' }, { status: 500 });
    }

    return NextResponse.json({ image }, { status: 200 });
  } catch (error) {
    console.error('Error in platform images PUT API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin access
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // For now, allow any authenticated user to manage platform images
    // In production, you should implement proper admin role checking
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { id } = await params;

    // First, get the image to delete the file from storage
    const { data: image, error: fetchError } = await supabaseAdmin
      .from('platform_images')
      .select('image_url')
      .eq('id', id)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete the file from storage if it exists
    if (image.image_url) {
      try {
        // Extract the file path from the URL
        const url = new URL(image.image_url);
        const filePath = url.pathname.split('/').slice(-2).join('/'); // Get the last two path segments
        
        // Delete the file from storage
        const { error: deleteError } = await supabaseAdmin.storage
          .from('platform-images')
          .remove([filePath]);
          
        if (deleteError) {
          console.warn('Failed to delete image file:', deleteError);
          // Don't fail the delete if file deletion fails
        }
      } catch (error) {
        console.warn('Error deleting image file:', error);
        // Don't fail the delete if file deletion fails
      }
    }

    // Delete the database record
    const { error } = await supabaseAdmin
      .from('platform_images')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting platform image:', error);
      return NextResponse.json({ error: 'Failed to delete platform image' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in platform images DELETE API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
