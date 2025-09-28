import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase client with service role
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    
    console.log('Starting self-offers cleanup...');

    // Step 1: Check for existing self-offers
    const { data: selfOffers, error: checkError } = await supabase
      .from('offers')
      .select('id, offerer_id, owner_id, listing_id')
      .filter('offerer_id', 'eq', supabase.rpc('get_user_id', { user_id: 'offerer_id' }))
      .filter('owner_id', 'eq', supabase.rpc('get_user_id', { user_id: 'owner_id' }));

    if (checkError) {
      console.error('Error checking self-offers:', checkError);
      // Try a simpler approach
      const { data: allOffers, error: allOffersError } = await supabase
        .from('offers')
        .select('id, offerer_id, owner_id, listing_id');

      if (allOffersError) {
        console.error('Error fetching all offers:', allOffersError);
        return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
      }

      // Filter self-offers in JavaScript
      const selfOffersFiltered = allOffers?.filter(offer => offer.offerer_id === offer.owner_id) || [];
      console.log(`Found ${selfOffersFiltered.length} self-offers`);

      // Step 2: Delete self-offers one by one
      for (const offer of selfOffersFiltered) {
        const { error: deleteError } = await supabase
          .from('offers')
          .delete()
          .eq('id', offer.id);

        if (deleteError) {
          console.error(`Error deleting offer ${offer.id}:`, deleteError);
        } else {
          console.log(`Deleted self-offer ${offer.id}`);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Self-offers cleanup completed',
        deletedOffers: selfOffersFiltered.length
      });
    }

    console.log(`Found ${selfOffers?.length || 0} self-offers`);

    // Step 2: Delete self-offers
    for (const offer of selfOffers || []) {
      const { error: deleteError } = await supabase
        .from('offers')
        .delete()
        .eq('id', offer.id);

      if (deleteError) {
        console.error(`Error deleting offer ${offer.id}:`, deleteError);
      } else {
        console.log(`Deleted self-offer ${offer.id}`);
      }
    }

    console.log('Self-offers cleanup completed successfully');

    return NextResponse.json({
      success: true,
      message: 'Self-offers cleanup completed successfully',
      deletedOffers: selfOffers?.length || 0
    });

  } catch (error: any) {
    console.error('Self-offers cleanup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
