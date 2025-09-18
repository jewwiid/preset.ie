import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// POST /api/marketplace/listings/[id]/images - Upload listing images
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const formData = await request.formData();
    const files = formData.getAll('images') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    // Get current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user owns the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get current image count
    const { data: existingImages, error: imagesError } = await supabase
      .from('listing_images')
      .select('id')
      .eq('listing_id', id);

    if (imagesError) {
      console.error('Error fetching existing images:', imagesError);
      return NextResponse.json({ error: 'Failed to fetch existing images' }, { status: 500 });
    }

    const maxImages = 10;
    if ((existingImages?.length || 0) + files.length > maxImages) {
      return NextResponse.json({ 
        error: `Maximum ${maxImages} images allowed per listing` 
      }, { status: 400 });
    }

    // Upload images
    const uploadedImages = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        return NextResponse.json({ 
          error: `File ${file.name} is not an image` 
        }, { status: 400 });
      }

      // Validate file size (5MB max)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return NextResponse.json({ 
          error: `File ${file.name} is too large (max 5MB)` 
        }, { status: 400 });
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${id}/${Date.now()}-${i}.${fileExt}`;
      const filePath = `listings/${fileName}`;

      // Upload to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('listings')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        return NextResponse.json({ 
          error: `Failed to upload ${file.name}` 
        }, { status: 500 });
      }

      // Get next sort order
      const nextSortOrder = (existingImages?.length || 0) + i;

      // Save image record
      const { data: imageRecord, error: insertError } = await supabase
        .from('listing_images')
        .insert({
          listing_id: id,
          path: filePath,
          sort_order: nextSortOrder,
          alt_text: `Listing image ${nextSortOrder + 1}`
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error saving image record:', insertError);
        // Clean up uploaded file
        await supabase.storage.from('listings').remove([filePath]);
        return NextResponse.json({ 
          error: `Failed to save image record for ${file.name}` 
        }, { status: 500 });
      }

      uploadedImages.push(imageRecord);
    }

    return NextResponse.json({ 
      images: uploadedImages,
      message: `Successfully uploaded ${uploadedImages.length} images`
    }, { status: 201 });

  } catch (error) {
    console.error('Upload images API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/marketplace/listings/[id]/images/[imageId] - Delete specific image
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 });
    }

    // Get current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get image record
    const { data: image, error: imageError } = await supabase
      .from('listing_images')
      .select(`
        *,
        listing:listings!listing_images_listing_id_fkey(
          owner_id
        )
      `)
      .eq('id', imageId)
      .single();

    if (imageError || !image) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Check if user owns the listing
    if (image.listing.owner_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete image record
    const { error: deleteError } = await supabase
      .from('listing_images')
      .delete()
      .eq('id', imageId);

    if (deleteError) {
      console.error('Error deleting image record:', deleteError);
      return NextResponse.json({ error: 'Failed to delete image record' }, { status: 500 });
    }

    // Delete file from storage
    const { error: storageError } = await supabase.storage
      .from('listings')
      .remove([image.path]);

    if (storageError) {
      console.error('Error deleting image file:', storageError);
      // Don't fail the request if storage deletion fails
    }

    return NextResponse.json({ message: 'Image deleted successfully' });

  } catch (error) {
    console.error('Delete image API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
