import { NextRequest, NextResponse } from 'next/server';

const nanoBananaApiKey = process.env.NANOBANANA_API_KEY || process.env.NANOBANAN_API_KEY!;

/**
 * Check NanoBanana API credits
 * GET /api/nanobanana/credits
 */
export async function GET(request: NextRequest) {
  try {
    // Check NanoBanana credits
    const response = await fetch('https://api.nanobananaapi.ai/api/v1/common/credit', {
      headers: {
        'Authorization': `Bearer ${nanoBananaApiKey}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Failed to fetch NanoBanana credits:', error);
      
      // Handle specific error codes
      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      } else if (response.status === 402) {
        return NextResponse.json(
          { success: false, error: 'Insufficient credits', credits: 0 },
          { status: 402 }
        );
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to fetch credits' },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Response format: { code: 200, msg: "success", data: 100 }
    if (data.code === 200) {
      return NextResponse.json({
        success: true,
        credits: data.data,
        message: `${data.data} credits remaining`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.msg || 'Unknown error',
        credits: 0
      }, { status: data.code });
    }

  } catch (error: any) {
    console.error('Credit check error:', error);
    
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}