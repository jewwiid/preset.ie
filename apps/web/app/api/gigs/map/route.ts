import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const bbox = searchParams.get('bbox');
  const center = searchParams.get('center');
  const radius = searchParams.get('radius');
  const limit = parseInt(searchParams.get('limit') || '500');

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    if (bbox) {
      // Bounding box query - using direct query instead of RPC function
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          id,
          title,
          description,
          location_text,
          lat,
          lng,
          start_time,
          end_time,
          comp_type,
          budget_min,
          budget_max,
          moodboards!left(
            id,
            palette,
            items,
            summary
          )
        `)
        .eq('status', 'PUBLISHED')
        .gte('application_deadline', new Date().toISOString())
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .gte('lat', minLat)
        .lte('lat', maxLat)
        .gte('lng', minLng)
        .lte('lng', maxLng)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      return NextResponse.json(data || []);
    } 
    
    if (center && radius) {
      // Radius query - using direct query instead of RPC function
      const [lng, lat] = center.split(',').map(Number);
      const radiusMeters = parseInt(radius);
      
      const { data, error } = await supabase
        .from('gigs')
        .select(`
          id,
          title,
          description,
          location_text,
          lat,
          lng,
          start_time,
          end_time,
          comp_type,
          budget_min,
          budget_max,
          moodboards!left(
            id,
            palette,
            items,
            summary
          )
        `)
        .eq('status', 'PUBLISHED')
        .gte('application_deadline', new Date().toISOString())
        .not('lat', 'is', null)
        .not('lng', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit);
        
      if (error) throw error;
      
      // Filter by distance in JavaScript (since we can't use PostGIS functions easily)
      const filteredData = data?.filter(gig => {
        const distance = Math.sqrt(
          Math.pow(gig.lng - lng, 2) + Math.pow(gig.lat - lat, 2)
        ) * 111000; // Rough conversion to meters (1 degree ≈ 111km)
        return distance <= radiusMeters;
      }) || [];
      
      return NextResponse.json(filteredData);
    }

    return NextResponse.json({ error: 'Missing bbox or center+radius params' }, { status: 400 });
  } catch (err: any) {
    console.error('Map API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
