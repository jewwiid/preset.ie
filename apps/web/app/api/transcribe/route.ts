import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    console.log('Transcribe API called');
    
    // Check environment variables
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Supabase environment variables not set');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Get user session
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (!token) {
      console.log('No auth token provided');
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

    // Check subscription tier and apply limits
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
    
    // For FREE users, check rate limiting
    if (tier === 'FREE') {
      // Check if user has exceeded their free usage (5 transcriptions per hour)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentTranscriptions, error: usageError } = await supabase
        .from('chatbot_messages')
        .select('id')
        .eq('role', 'user')
        .gte('created_at', oneHourAgo)
        .not('metadata->source', 'is', null);

      if (usageError) {
        console.error('Usage check error:', usageError);
        return NextResponse.json({ error: 'Failed to check usage limits' }, { status: 500 });
      }

      const transcriptionCount = recentTranscriptions?.length || 0;
      if (transcriptionCount >= 5) {
        return NextResponse.json({ 
          error: 'Free users are limited to 5 voice transcriptions per hour. Upgrade to Plus or Pro for unlimited usage.' 
        }, { status: 429 });
      }
    }

    // Get audio file
    const form = await req.formData();
    const fileEntry = (form as any).get('file');
    if (!fileEntry || typeof fileEntry === 'string') {
      console.log('No audio file provided');
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }
    const file = fileEntry as File;
    
    console.log(`Audio file received: ${file.name}, size: ${file.size} bytes, type: ${file.type}`);
    
    if (file.size > 2_000_000) {
      console.log(`File too large: ${file.size} bytes`);
      return NextResponse.json({ error: 'Audio file too large (max 2MB)' }, { status: 413 });
    }

    // Voice transcription is free for subscribed users (PLUS/PRO)
    // No credit deduction needed

    // Forward to OpenAI Whisper API
    console.log('Sending request to OpenAI Whisper API...');
    const upstream = new FormData();
    upstream.append('file', file, 'speech.webm');
    upstream.append('model', 'whisper-1');
    upstream.append('language', 'en'); // Optimize for English
    upstream.append('response_format', 'json'); // Ensure consistent response format

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: upstream
    });

    console.log(`OpenAI API response status: ${response.status}`);

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
