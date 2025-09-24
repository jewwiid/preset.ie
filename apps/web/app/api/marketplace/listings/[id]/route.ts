import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// PUT /api/marketplace/listings/[id] - Update a marketplace listing
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      cookieStore.get('sb-access-token')?.value
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const listingId = resolvedParams.id;
    const body = await request.json();
    const {
      salePrice,
      marketplaceTitle,
      marketplaceDescription,
      tags,
      status
    } = body;

    // Check if user owns this listing
    const { data: listing, error: fetchError } = await supabase
      .from('preset_marketplace_listings')
      .select('seller_user_id')
      .eq('id', listingId)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.seller_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to modify this listing' },
        { status: 403 }
      );
    }

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (salePrice !== undefined) updateData.sale_price = salePrice;
    if (marketplaceTitle !== undefined) updateData.marketplace_title = marketplaceTitle;
    if (marketplaceDescription !== undefined) updateData.marketplace_description = marketplaceDescription;
    if (tags !== undefined) updateData.tags = tags;
    if (status !== undefined) updateData.status = status;

    // Update listing
    const { data, error } = await supabase
      .from('preset_marketplace_listings')
      .update(updateData)
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Error updating listing:', error);
      return NextResponse.json(
        { error: 'Failed to update listing' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      listing: data
    });

  } catch (error) {
    console.error('Error in listing update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/marketplace/listings/[id] - Delete a marketplace listing
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      cookieStore.get('sb-access-token')?.value
    );

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const resolvedParams = await params;
    const listingId = resolvedParams.id;

    // Check if user owns this listing
    const { data: listing, error: fetchError } = await supabase
      .from('preset_marketplace_listings')
      .select('seller_user_id, preset_id')
      .eq('id', listingId)
      .single();

    if (fetchError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.seller_user_id !== user.id) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this listing' },
        { status: 403 }
      );
    }

    // Delete listing and update preset
    const { error: deleteError } = await supabase
      .from('preset_marketplace_listings')
      .delete()
      .eq('id', listingId);

    if (deleteError) {
      console.error('Error deleting listing:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      );
    }

    // Update preset to remove from marketplace
    await supabase
      .from('presets')
      .update({
        is_for_sale: false,
        marketplace_status: 'private'
      })
      .eq('id', listing.preset_id);

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully'
    });

  } catch (error) {
    console.error('Error in listing delete API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}