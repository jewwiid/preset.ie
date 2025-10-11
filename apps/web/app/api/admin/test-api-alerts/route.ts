import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint for API failure alerts
 * Allows admins to test different types of alerts
 */

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const alertType = searchParams.get('type') || 'credits_exhausted';
  const provider = searchParams.get('provider') || 'nanobanana';
  
  const testAlerts = {
    credits_exhausted: {
      type: 'credits_exhausted' as const,
      provider: provider,
      errorMessage: 'Insufficient credits remaining. Please top up your account to continue using the service.',
      timestamp: new Date().toISOString(),
      requestId: 'test-request-123',
      userId: 'test-user-456',
      userEmail: 'test@example.com',
      severity: 'critical' as const
    },
    api_error: {
      type: 'api_error' as const,
      provider: provider,
      errorMessage: 'HTTP 500 Internal Server Error - The API service is experiencing technical difficulties.',
      timestamp: new Date().toISOString(),
      requestId: 'test-request-789',
      userId: 'test-user-101',
      userEmail: 'test2@example.com',
      severity: 'high' as const
    },
    timeout: {
      type: 'timeout' as const,
      provider: provider,
      errorMessage: 'Request timeout after 30 seconds. The API did not respond within the expected timeframe.',
      timestamp: new Date().toISOString(),
      requestId: 'test-request-456',
      userId: 'test-user-202',
      userEmail: 'test3@example.com',
      severity: 'high' as const
    },
    rate_limit: {
      type: 'rate_limit' as const,
      provider: provider,
      errorMessage: 'Rate limit exceeded. Too many requests in a short time period. Please wait before making another request.',
      timestamp: new Date().toISOString(),
      requestId: 'test-request-789',
      userId: 'test-user-303',
      userEmail: 'test4@example.com',
      severity: 'high' as const
    },
    provider_down: {
      type: 'provider_down' as const,
      provider: provider,
      errorMessage: 'Service temporarily unavailable. The API provider is experiencing outages.',
      timestamp: new Date().toISOString(),
      requestId: 'test-request-999',
      userId: 'test-user-404',
      userEmail: 'test5@example.com',
      severity: 'critical' as const
    }
  };

  const testAlert = testAlerts[alertType as keyof typeof testAlerts] || testAlerts.credits_exhausted;

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/alert-api-failure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testAlert)
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: `Test ${alertType} alert sent successfully`,
      testAlert,
      result
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send test alert',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

/**
 * POST endpoint to send custom test alerts
 */
export async function POST(request: NextRequest) {
  try {
    const customAlert = await request.json();
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/alert-api-failure`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customAlert)
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      message: 'Custom test alert sent successfully',
      customAlert,
      result
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send custom test alert',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
