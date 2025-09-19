import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { visibility, allowComments } = await request.json();

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate a unique share token
    const shareToken = crypto.randomUUID();
    
    // Update treatment with sharing settings
    const { data, error } = await supabase
      .from('treatments')
      .update({
        visibility,
        allow_comments: allowComments,
        share_token: shareToken,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating treatment:', error);
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    // Create shareable URL
    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/treatments/shared/${shareToken}`;

    return NextResponse.json({
      shareUrl,
      shareToken,
      visibility,
      allowComments
    });

  } catch (error) {
    console.error('Error creating share link:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Create Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get treatment sharing info
    const { data, error } = await supabase
      .from('treatments')
      .select('id, title, visibility, allow_comments, share_token, created_at')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching treatment:', error);
      return NextResponse.json(
        { error: 'Treatment not found' },
        { status: 404 }
      );
    }

    const shareUrl = data.share_token 
      ? `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/treatments/shared/${data.share_token}`
      : null;

    return NextResponse.json({
      id: data.id,
      title: data.title,
      visibility: data.visibility,
      allowComments: data.allow_comments,
      shareUrl,
      shareToken: data.share_token,
      createdAt: data.created_at
    });

  } catch (error) {
    console.error('Error fetching treatment sharing info:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
