import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Verify this is a cron request from Vercel
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Running monthly benefits reset cron job...');

    if (!supabaseAdmin) {
      return NextResponse.json({ 
        error: 'Database connection not available' 
      }, { status: 500 });
    }

    // Call the database function to reset monthly benefits
    const { data, error } = await supabaseAdmin
      .rpc('reset_monthly_subscription_benefits');

    if (error) {
      console.error('Error resetting monthly benefits:', error);
      return NextResponse.json({ 
        error: 'Failed to reset monthly benefits',
        details: error.message 
      }, { status: 500 });
    }

    console.log(`Reset monthly benefits for ${data || 0} users successfully`);

    return NextResponse.json({ 
      success: true, 
      reset_count: data || 0,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({ 
      error: 'Cron job failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Also support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request);
}
