import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Get user session
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check subscription tier (PLUS or PRO only)
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single();

    if (profileError) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to verify subscription' }, { status: 500 });
    }

    const tier = profile?.subscription_tier || 'FREE';
    if (tier === 'FREE') {
      return NextResponse.json({ 
        error: 'Voice transcription requires a PLUS or PRO subscription. Please upgrade to use this feature.' 
      }, { status: 403 });
    }

    // Get audio file
    const form = await req.formData() as unknown as FormData;
    const file = form.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    if (file.size > 2_000_000) {
      return NextResponse.json({ error: 'Audio file too large (max 2MB)' }, { status: 413 });
    }

    // Voice transcription is free for subscribed users (PLUS/PRO)
    // No credit deduction needed

    // Forward to OpenAI Whisper API
    const upstream = new FormData();
    upstream.append('file', file, 'speech.webm');
    upstream.append('model', 'whisper-1');
    upstream.append('language', 'en'); // Optimize for English
    upstream.append('response_format', 'json'); // Ensure consistent response format

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'multipart/form-data'
      },
      body: upstream
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return NextResponse.json({ 
        error: 'Transcription failed. Please try again.' 
      }, { status: 502 });
    }

    const data = await response.json();
    return NextResponse.json({ text: data.text || '' });

  } catch (error) {
    console.error('Transcription error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Transcription failed' 
    }, { status: 500 });
  }
}
