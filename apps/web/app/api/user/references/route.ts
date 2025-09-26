import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// GET /api/user/references - Fetch user's own references
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'moodboard', 'treatment', 'showcase', or 'all'

    let references: any[] = [];

    if (type === 'all' || type === 'moodboard') {
      const { data: moodboards, error: moodboardError } = await supabase
        .from('moodboards')
        .select('id, title, description, url, thumbnail_url, created_at')
        .eq('owner_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (moodboardError) {
        console.error('Error fetching moodboards:', moodboardError);
      } else {
        references = references.concat(
          (moodboards || []).map(m => ({ ...m, type: 'moodboard' }))
        );
      }
    }

    if (type === 'all' || type === 'treatment') {
      const { data: treatments, error: treatmentError } = await supabase
        .from('treatments')
        .select('id, title, description, url, thumbnail_url, created_at')
        .eq('owner_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (treatmentError) {
        console.error('Error fetching treatments:', treatmentError);
      } else {
        references = references.concat(
          (treatments || []).map(t => ({ ...t, type: 'treatment' }))
        );
      }
    }

    if (type === 'all' || type === 'showcase') {
      const { data: showcases, error: showcaseError } = await supabase
        .from('showcases')
        .select('id, title, description, url, thumbnail_url, created_at')
        .eq('owner_id', userProfile.id)
        .order('created_at', { ascending: false });

      if (showcaseError) {
        console.error('Error fetching showcases:', showcaseError);
      } else {
        references = references.concat(
          (showcases || []).map(s => ({ ...s, type: 'showcase' }))
        );
      }
    }

    // Sort all references by creation date
    references.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return NextResponse.json({
      references,
      counts: {
        moodboards: references.filter(r => r.type === 'moodboard').length,
        treatments: references.filter(r => r.type === 'treatment').length,
        showcases: references.filter(r => r.type === 'showcase').length,
        total: references.length
      }
    });

  } catch (error: any) {
    console.error('User references API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
