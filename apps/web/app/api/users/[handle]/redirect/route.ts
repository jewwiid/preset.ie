import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle parameter is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Use the resolve_current_handle function to get the current handle
    const { data: currentHandle, error } = await supabase
      .rpc('resolve_current_handle', { input_handle: handle });

    if (error) {
      console.error('Error resolving handle:', error);
      return NextResponse.json(
        { error: 'Failed to resolve handle' },
        { status: 500 }
      );
    }

    // If the handle is the same, no redirect needed
    if (currentHandle === handle) {
      return NextResponse.json(
        { redirect: false, current_handle: handle },
        { status: 200 }
      );
    }

    // Return redirect information
    return NextResponse.json({
      redirect: true,
      old_handle: handle,
      current_handle: currentHandle,
      redirect_url: `/users/${currentHandle}`
    }, { status: 200 });

  } catch (error: any) {
    console.error('Handle redirect API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
