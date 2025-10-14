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
      // Bounding box query
      const [minLng, minLat, maxLng, maxLat] = bbox.split(',').map(Number);
      const { data, error } = await supabase.rpc('get_gigs_in_bbox', {
        min_lng: minLng, min_lat: minLat,
        max_lng: maxLng, max_lat: maxLat,
        limit_count: limit
      });
      if (error) throw error;
      return NextResponse.json(data || []);
    } 
    
    if (center && radius) {
      // Radius query
      const [lng, lat] = center.split(',').map(Number);
      const { data, error } = await supabase.rpc('get_gigs_near_point', {
        center_lng: lng, center_lat: lat,
        search_radius_meters: parseInt(radius),
        limit_count: limit
      });
      if (error) throw error;
      return NextResponse.json(data || []);
    }

    return NextResponse.json({ error: 'Missing bbox or center+radius params' }, { status: 400 });
  } catch (err: any) {
    console.error('Map API error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
