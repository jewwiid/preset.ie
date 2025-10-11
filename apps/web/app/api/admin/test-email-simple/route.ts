import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'Email system test endpoint',
    environment: {
      hasPlunkKey: !!process.env.PLUNK_API_KEY,
      plunkKeyLength: process.env.PLUNK_API_KEY?.length,
      plunkKeyPrefix: process.env.PLUNK_API_KEY?.substring(0, 10),
      nodeEnv: process.env.NODE_ENV,
      allEnvKeys: Object.keys(process.env).filter(k => k.includes('PLUNK'))
    },
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest) {
  try {
    const { adminEmail } = await request.json();
    
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Admin email is required' },
        { status: 400 }
      );
    }

    // Check environment variables
    const envCheck = {
      hasPlunkKey: !!process.env.PLUNK_API_KEY,
      plunkKeyLength: process.env.PLUNK_API_KEY?.length,
      plunkKeyPrefix: process.env.PLUNK_API_KEY?.substring(0, 10),
      nodeEnv: process.env.NODE_ENV
    };

    console.log('Environment check:', envCheck);

    if (!process.env.PLUNK_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'PLUNK_API_KEY not found',
        environment: envCheck,
        suggestion: 'Make sure PLUNK_API_KEY is in .env.local and restart dev server'
      });
    }

    // Simple email test without Plunk
    return NextResponse.json({
      success: true,
      message: `Would send email to ${adminEmail}`,
      environment: envCheck,
      emailPreview: {
        to: adminEmail,
        subject: '📊 Daily Admin Summary - Test',
        body: 'This is a test email that would be sent via Plunk API'
      }
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
