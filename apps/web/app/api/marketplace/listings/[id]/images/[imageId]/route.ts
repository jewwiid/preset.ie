import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

// DELETE /api/marketplace/listings/[id]/images/[imageId] - Delete a listing image
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    const supabase = getSupabaseClient();
    const resolvedParams = await params;
    const listingId = resolvedParams.id;
    const imageId = resolvedParams.imageId;

    // Get user from Authorization header
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
    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if user owns the listing
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', listingId)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    if (listing.owner_id !== userProfile.id) {
      return NextResponse.json({ error: 'Unauthorized to delete this image' }, { status: 403 });
    }

    // Get image details before deletion
    const { data: imageData, error: imageError } = await supabase
      .from('listing_images')
      .select('path')
      .eq('id', imageId)
      .eq('listing_id', listingId)
      .single();

    if (imageError || !imageData) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('listings')
      .remove([imageData.path]);

    if (storageError) {
      console.error('Storage deletion error:', storageError);
      // Continue with database deletion even if storage deletion fails
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('listing_images')
      .delete()
      .eq('id', imageId)
      .eq('listing_id', listingId);

    if (dbError) {
      console.error('Database deletion error:', dbError);
      return NextResponse.json({ error: 'Failed to delete image from database' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Image deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
