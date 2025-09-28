import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceKey)
}

export interface GearRequestWithMatches {
  id: string;
  category: string;
  equipment_spec?: string;
  quantity: number;
  borrow_preferred: boolean;
  retainer_acceptable: boolean;
  max_daily_rate_cents?: number;
  status: string;
  matching_listings: any[];
  suggested_listings: any[];
}

export class ProjectMarketplaceService {
  /**
   * Get gear requests for a project with matching marketplace listings
   */
  static async getGearRequestsWithMatches(projectId: string): Promise<GearRequestWithMatches[]> {
    try {
      const supabase = getSupabaseClient()
      // Get gear requests for the project
      const { data: gearRequests, error: gearRequestsError } = await supabase
        .from('collab_gear_requests')
        .select('*')
        .eq('project_id', projectId)
        .eq('status', 'open');

      if (gearRequestsError) {
        throw new Error('Failed to fetch gear requests');
      }

      // For each gear request, find matching marketplace listings
      const gearRequestsWithMatches = await Promise.all(
        gearRequests.map(async (gearRequest) => {
          const matches = await this.findMatchingListings(gearRequest);
          return {
            ...gearRequest,
            matching_listings: matches.exactMatches,
            suggested_listings: matches.suggestions
          };
        })
      );

      return gearRequestsWithMatches;

    } catch (error) {
      console.error('Error getting gear requests with matches:', error);
      return [];
    }
  }

  /**
   * Find marketplace listings that match a gear request
   */
  static async findMatchingListings(gearRequest: any): Promise<{
    exactMatches: any[];
    suggestions: any[];
  }> {
    try {
      const supabase = getSupabaseClient()
      // Build query for exact matches
      let exactQuery = supabase
        .from('listings')
        .select(`
          *,
          owner:users_profile!listings_owner_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            verified,
            rating,
            city,
            country
          )
        `)
        .eq('status', 'active')
        .limit(10);

      // Apply category filter
      if (gearRequest.category) {
        exactQuery = exactQuery.ilike('category', `%${gearRequest.category}%`);
      }

      // Apply price filter for rentals
      if (gearRequest.borrow_preferred && gearRequest.max_daily_rate_cents) {
        exactQuery = exactQuery.lte('rent_day_cents', gearRequest.max_daily_rate_cents);
      }

      const { data: exactMatches, error: exactError } = await exactQuery;

      if (exactError) {
        console.error('Error fetching exact matches:', exactError);
      }

      // Build query for suggestions (broader matches)
      let suggestionsQuery = supabase
        .from('listings')
        .select(`
          *,
          owner:users_profile!listings_owner_id_fkey(
            id,
            username,
            display_name,
            avatar_url,
            verified,
            rating,
            city,
            country
          )
        `)
        .eq('status', 'active')
        .limit(5);

      // Broader category matching
      if (gearRequest.category) {
        const broaderCategories = this.getBroaderCategories(gearRequest.category);
        suggestionsQuery = suggestionsQuery.or(
          broaderCategories.map(cat => `category.ilike.%${cat}%`).join(',')
        );
      }

      const { data: suggestions, error: suggestionsError } = await suggestionsQuery;

      if (suggestionsError) {
        console.error('Error fetching suggestions:', suggestionsError);
      }

      return {
        exactMatches: exactMatches || [],
        suggestions: suggestions || []
      };

    } catch (error) {
      console.error('Error finding matching listings:', error);
      return { exactMatches: [], suggestions: [] };
    }
  }

  /**
   * Convert a gear request to a marketplace listing
   */
  static async convertGearRequestToListing(
    gearRequestId: string,
    listingData: {
      title: string;
      description?: string;
      condition: string;
      rent_day_cents?: number;
      sale_price_cents?: number;
      location_city?: string;
      location_country?: string;
    }
  ): Promise<{ success: boolean; listingId?: string; error?: string }> {
    try {
      const supabase = getSupabaseClient()
      // Get gear request details
      const { data: gearRequest, error: gearRequestError } = await supabase
        .from('collab_gear_requests')
        .select(`
          *,
          project:collab_projects(
            id,
            creator_id
          )
        `)
        .eq('id', gearRequestId)
        .single();

      if (gearRequestError || !gearRequest) {
        return { success: false, error: 'Gear request not found' };
      }

      // Create marketplace listing
      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .insert({
          owner_id: gearRequest.project.creator_id,
          title: listingData.title,
          description: listingData.description,
          category: gearRequest.category,
          condition: listingData.condition,
          rent_day_cents: listingData.rent_day_cents,
          sale_price_cents: listingData.sale_price_cents,
          location_city: listingData.location_city,
          location_country: listingData.location_country,
          status: 'active'
        })
        .select()
        .single();

      if (listingError) {
        return { success: false, error: 'Failed to create listing' };
      }

      // Update gear request status to fulfilled
      const { error: updateError } = await supabase
        .from('collab_gear_requests')
        .update({ status: 'fulfilled' })
        .eq('id', gearRequestId);

      if (updateError) {
        console.error('Error updating gear request status:', updateError);
      }

      return { success: true, listingId: listing.id };

    } catch (error) {
      console.error('Error converting gear request to listing:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Link a gear request to an existing marketplace listing
   */
  static async linkGearRequestToListing(
    gearRequestId: string,
    listingId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const supabase = getSupabaseClient()
      // Verify both exist and are compatible
      const { data: gearRequest, error: gearRequestError } = await supabase
        .from('collab_gear_requests')
        .select('*')
        .eq('id', gearRequestId)
        .single();

      if (gearRequestError || !gearRequest) {
        return { success: false, error: 'Gear request not found' };
      }

      const { data: listing, error: listingError } = await supabase
        .from('listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError || !listing) {
        return { success: false, error: 'Listing not found' };
      }

      // Check compatibility
      const isCompatible = this.checkCompatibility(gearRequest, listing);
      if (!isCompatible.compatible) {
        return { success: false, error: isCompatible.reason };
      }

      // Create a gear offer linking the request to the listing
      const { error: offerError } = await supabase
        .from('collab_gear_offers')
        .insert({
          project_id: gearRequest.project_id,
          gear_request_id: gearRequestId,
          offerer_id: listing.owner_id,
          listing_id: listingId,
          offer_type: gearRequest.borrow_preferred ? 'rent' : 'sell',
          daily_rate_cents: listing.rent_day_cents,
          total_price_cents: listing.sale_price_cents,
          status: 'pending'
        });

      if (offerError) {
        return { success: false, error: 'Failed to create gear offer' };
      }

      return { success: true };

    } catch (error) {
      console.error('Error linking gear request to listing:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Check compatibility between gear request and listing
   */
  private static checkCompatibility(gearRequest: any, listing: any): {
    compatible: boolean;
    reason?: string;
  } {
    // Check category compatibility
    if (gearRequest.category && listing.category) {
      if (!listing.category.toLowerCase().includes(gearRequest.category.toLowerCase()) &&
          !gearRequest.category.toLowerCase().includes(listing.category.toLowerCase())) {
        return { compatible: false, reason: 'Category mismatch' };
      }
    }

    // Check price compatibility for rentals
    if (gearRequest.borrow_preferred && gearRequest.max_daily_rate_cents && listing.rent_day_cents) {
      if (listing.rent_day_cents > gearRequest.max_daily_rate_cents * 1.2) {
        return { compatible: false, reason: 'Price exceeds budget' };
      }
    }

    // Check if listing is available
    if (listing.status !== 'active') {
      return { compatible: false, reason: 'Listing not available' };
    }

    return { compatible: true };
  }

  /**
   * Get broader categories for suggestion matching
   */
  private static getBroaderCategories(category: string): string[] {
    const categoryMap: { [key: string]: string[] } = {
      'camera': ['photography', 'video', 'cinematography'],
      'lens': ['photography', 'camera', 'optics'],
      'lighting': ['studio', 'photography', 'video'],
      'audio': ['sound', 'recording', 'microphone'],
      'tripod': ['support', 'photography', 'video'],
      'gimbal': ['stabilization', 'video', 'camera'],
      'drone': ['aerial', 'video', 'photography'],
      'computer': ['editing', 'post-production', 'workstation'],
      'monitor': ['display', 'editing', 'post-production']
    };

    return categoryMap[category.toLowerCase()] || [category];
  }

  /**
   * Get project statistics including marketplace integration
   */
  static async getProjectMarketplaceStats(projectId: string): Promise<{
    totalGearRequests: number;
    fulfilledRequests: number;
    pendingOffers: number;
    matchingListings: number;
  }> {
    try {
      const supabase = getSupabaseClient()
      // Get gear requests count
      const { count: totalRequests } = await supabase
        .from('collab_gear_requests')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId);

      // Get fulfilled requests count
      const { count: fulfilledRequests } = await supabase
        .from('collab_gear_requests')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'fulfilled');

      // Get pending offers count
      const { count: pendingOffers } = await supabase
        .from('collab_gear_offers')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', projectId)
        .eq('status', 'pending');

      // Get total matching listings across all gear requests
      const gearRequests = await this.getGearRequestsWithMatches(projectId);
      const matchingListings = gearRequests.reduce(
        (total, request) => total + request.matching_listings.length,
        0
      );

      return {
        totalGearRequests: totalRequests || 0,
        fulfilledRequests: fulfilledRequests || 0,
        pendingOffers: pendingOffers || 0,
        matchingListings
      };

    } catch (error) {
      console.error('Error getting project marketplace stats:', error);
      return {
        totalGearRequests: 0,
        fulfilledRequests: 0,
        pendingOffers: 0,
        matchingListings: 0
      };
    }
  }
}
