import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.NANOBANANA_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'NanoBanana API key not configured' },
        { status: 500 }
      );
    }

    // Call NanoBanana API to get account credits
    const response = await fetch('https://api.nanobananaapi.ai/api/v1/common/credit', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: 'Failed to fetch NanoBanana credits',
          details: errorData.message || `HTTP ${response.status}`
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // NanoBanana API returns: {"code": 200, "msg": "success", "data": 100}
    return NextResponse.json({
      success: true,
      credits: {
        remaining: data.data || 0,
        api_response: data
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('NanoBanana credits API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch NanoBanana credits',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
