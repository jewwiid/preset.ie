import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../../lib/supabase';

/**
 * SIMPLIFIED VIEW TRACKING
 * - One write per unique session
 * - No periodic updates
 * - No section tracking
 * - Just counts views and unique visitors
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const treatmentId = resolvedParams.id;
    
    const body = await request.json();
    const { session_id } = body;

    if (!supabase) {
      return NextResponse.json({ error: 'Database connection error' }, { status: 500 });
    }

    // Check if this session already viewed this treatment
    const { data: existingView } = await supabase
      .from('treatment_analytics')
      .select('id')
      .eq('treatment_id', treatmentId)
      .eq('session_id', session_id)
      .single();

    // Only record if it's a NEW view (prevents duplicate counting)
    if (!existingView) {
      const { error: insertError } = await supabase
        .from('treatment_analytics')
        .insert({
          treatment_id: treatmentId,
          session_id,
          page_views: 1,
          time_on_page_seconds: 0,
          pages_viewed: [],
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('Error tracking view:', insertError);
        return NextResponse.json({ error: 'Failed to track view' }, { status: 500 });
      }

      return NextResponse.json({ success: true, recorded: true });
    }

    // Already viewed, don't record again
    return NextResponse.json({ success: true, recorded: false });
  } catch (error) {
    console.error('Error in track-view:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

