import { NextRequest, NextResponse } from 'next/server';

/**
 * Cron job endpoint for daily admin summary emails
 * This should be called by Vercel Cron or similar service daily at 9 AM UTC
 */
export async function GET(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin email from environment variable
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
      console.error('ADMIN_EMAIL environment variable not set');
      return NextResponse.json(
        { error: 'Admin email not configured' },
        { status: 500 }
      );
    }

    // Call the daily summary API
    const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/admin/daily-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        adminEmail: adminEmail
      })
    });

    if (!summaryResponse.ok) {
      const error = await summaryResponse.text();
      throw new Error(`Failed to send daily summary: ${error}`);
    }

    const result = await summaryResponse.json();

    console.log('Daily admin summary sent successfully:', {
      date: result.summary?.date,
      generations: result.summary?.generationsToday,
      cost: result.summary?.costTodayUsd
    });

    return NextResponse.json({
      success: true,
      message: 'Daily admin summary sent successfully',
      timestamp: new Date().toISOString(),
      summary: result.summary
    });

  } catch (error: any) {
    console.error('Daily admin summary cron job failed:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send daily admin summary',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
