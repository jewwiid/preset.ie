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

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json();
    const { offerId, action } = body; // action: 'accept' or 'reject'

    if (!offerId || !action) {
      return NextResponse.json({ 
        error: 'Missing required fields: offerId, action' 
      }, { status: 400 });
    }

    if (!['accept', 'reject', 'cancel'].includes(action)) {
      return NextResponse.json({ 
        error: 'Invalid action. Must be "accept", "reject", or "cancel"' 
      }, { status: 400 });
    }

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

    // Check if the offer exists and user owns the listing
    const { data: offer, error: fetchError } = await supabase
      .from('offers')
      .select(`
        *,
        listing:listings!offers_listing_id_fkey (
          id,
          owner_id
        )
      `)
      .eq('id', offerId)
      .single();

    if (fetchError || !offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Check if user owns the listing
    if (offer.listing.owner_id !== userProfile.id) {
      return NextResponse.json({ 
        error: 'Unauthorized: You can only manage offers for your own listings' 
      }, { status: 403 });
    }

    // Check offer status based on action
    if (action === 'cancel') {
      // Only allow canceling accepted offers
      if (offer.status !== 'accepted') {
        return NextResponse.json({ 
          error: 'Only accepted offers can be canceled' 
        }, { status: 400 });
      }
    } else {
      // For accept/reject, only allow pending offers
      if (offer.status !== 'pending') {
        return NextResponse.json({ 
          error: 'Offer is no longer pending and cannot be modified' 
        }, { status: 400 });
      }
    }

    // If accepting, check if there are already accepted offers for this listing
    if (action === 'accept') {
      const { data: existingAcceptedOffers, error: acceptedError } = await supabase
        .from('offers')
        .select('id, offerer_id')
        .eq('listing_id', offer.listing_id)
        .eq('status', 'accepted');

      if (acceptedError) {
        console.error('Error checking existing accepted offers:', acceptedError);
        return NextResponse.json({ 
          error: 'Failed to check existing offers' 
        }, { status: 500 });
      }

      if (existingAcceptedOffers && existingAcceptedOffers.length > 0) {
        return NextResponse.json({ 
          error: 'This listing already has an accepted offer. You cannot accept multiple offers for the same item.' 
        }, { status: 400 });
      }
    }

    // Update the offer status
    let newStatus: string;
    if (action === 'accept') {
      newStatus = 'accepted';
    } else if (action === 'reject') {
      newStatus = 'rejected';
    } else if (action === 'cancel') {
      newStatus = 'withdrawn'; // Use 'withdrawn' status for canceled accepted offers
    } else {
      newStatus = 'pending'; // fallback
    }
    const { data: updatedOffer, error: updateError } = await supabase
      .from('offers')
      .update({ 
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', offerId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating offer:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update offer' 
      }, { status: 500 });
    }

    // If canceling an accepted offer, check for and cancel any associated sale orders
    if (action === 'cancel' && offer.status === 'accepted') {
      try {
        // Check if there are any sale orders for this offer
        const { data: saleOrders, error: saleOrderError } = await supabase
          .from('sale_orders')
          .select('id, status')
          .eq('listing_id', offer.listing_id)
          .eq('buyer_id', offer.offerer_id)
          .in('status', ['placed', 'confirmed']);

        if (!saleOrderError && saleOrders && saleOrders.length > 0) {
          // Cancel any active sale orders
          for (const saleOrder of saleOrders) {
            await supabase
              .from('sale_orders')
              .update({ 
                status: 'cancelled',
                updated_at: new Date().toISOString()
              })
              .eq('id', saleOrder.id);
          }
        }
      } catch (cancelError) {
        console.error('Error canceling associated sale orders:', cancelError);
        // Don't fail the offer cancellation if sale order cancellation fails
      }
    }

    // TODO: Send notification to offerer
    // TODO: Create sale transaction if accepted

    // If offer was accepted, share contact details based on preference
    if (action === 'accept' && offer.contact_preference !== 'message') {
      try {
        // Get offerer's profile with contact details
        const { data: offererProfile, error: offererError } = await supabase
          .from('users_profile')
          .select('id, phone_number, email, phone_public, email_public, display_name, handle')
          .eq('id', offer.offerer_id)
          .single();

        if (offererError || !offererProfile) {
          console.error('Error fetching offerer profile:', offererError);
        } else {
          // Share contact details based on preference and privacy settings
          if (offer.contact_preference === 'phone' && 
              offererProfile.phone_number && 
              offererProfile.phone_public) {
            
            await supabase.rpc('share_contact_details', {
              p_conversation_id: offer.listing_id,
              p_conversation_type: 'listing',
              p_offer_id: offerId,
              p_sharer_id: offer.offerer_id,
              p_recipient_id: userProfile.id,
              p_contact_type: 'phone',
              p_contact_value: offererProfile.phone_number
            });
          }
          
          if (offer.contact_preference === 'email' && 
              offererProfile.email && 
              offererProfile.email_public) {
            
            await supabase.rpc('share_contact_details', {
              p_conversation_id: offer.listing_id,
              p_conversation_type: 'listing',
              p_offer_id: offerId,
              p_sharer_id: offer.offerer_id,
              p_recipient_id: userProfile.id,
              p_contact_type: 'email',
              p_contact_value: offererProfile.email
            });
          }
        }
      } catch (contactError) {
        console.error('Error sharing contact details:', contactError);
        // Don't fail the offer acceptance if contact sharing fails
      }
    }

    return NextResponse.json({
      success: true,
      message: `Offer ${action}ed successfully`,
      offer: updatedOffer
    });

  } catch (error: any) {
    console.error('Offer action API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
