import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get treatment by share token
    const { data: treatment, error: treatmentError } = await supabase
      .from('treatments')
      .select(`
        id,
        title,
        format,
        theme,
        sections,
        loglines,
        visibility,
        allow_comments,
        created_at,
        user_id,
        users_profile!treatments_user_id_fkey (
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq('share_token', token)
      .single();

    if (treatmentError || !treatment) {
      console.error('Error fetching shared treatment:', treatmentError);
      return NextResponse.json(
        { error: 'Treatment not found or no longer available' },
        { status: 404 }
      );
    }

    // Check if treatment is shareable
    if (treatment.visibility === 'private') {
      return NextResponse.json(
        { error: 'This treatment is private and not shareable' },
        { status: 403 }
      );
    }

    // Format the response
    const response = {
      id: treatment.id,
      title: treatment.title,
      format: treatment.format,
      theme: treatment.theme,
      sections: treatment.sections || [],
      loglines: treatment.loglines || [],
      visibility: treatment.visibility,
      allow_comments: treatment.allow_comments,
      created_at: treatment.created_at,
      creator: {
        display_name: treatment.users_profile?.[0]?.display_name || 'Unknown',
        handle: treatment.users_profile?.[0]?.handle || 'unknown',
        avatar_url: treatment.users_profile?.[0]?.avatar_url
      }
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching shared treatment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
