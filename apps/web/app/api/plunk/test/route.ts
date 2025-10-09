/**
 * Test Plunk Integration Endpoint
 * 
 * Use this endpoint to quickly test if your Plunk integration is working.
 * 
 * Usage:
 *   curl -X POST http://localhost:3000/api/plunk/test \
 *     -H "Content-Type: application/json" \
 *     -d '{"email":"your-test-email@example.com"}'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getPlunkService } from '@/../../packages/adapters/src/external/PlunkService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required for testing' },
        { status: 400 }
      );
    }

    const plunk = getPlunkService();
    const results = {
      trackEvent: null as any,
      sendEmail: null as any,
      contactManagement: null as any,
    };

    // Test 1: Track Event
    try {
      results.trackEvent = await plunk.trackEvent({
        event: 'test.integration',
        email,
        subscribed: true,
        data: {
          source: 'api-test',
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      results.trackEvent = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 2: Send Test Email
    try {
      results.sendEmail = await plunk.sendTransactionalEmail({
        to: email,
        subject: 'Plunk Integration Test',
        body: `
          <h1>Test Successful! ✅</h1>
          <p>Your Plunk integration is working correctly.</p>
          <p>This test email was sent at ${new Date().toISOString()}</p>
        `,
      });
    } catch (error) {
      results.sendEmail = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    // Test 3: Contact Management
    try {
      results.contactManagement = await plunk.upsertContact({
        email,
        subscribed: true,
        data: {
          testRun: new Date().toISOString(),
          source: 'integration-test',
        },
      });
    } catch (error) {
      results.contactManagement = {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      success: true,
      message: 'Plunk integration test completed',
      testEmail: email,
      results,
      nextSteps: [
        'Check your Plunk dashboard at https://app.useplunk.com',
        'Verify the test event appears in your events log',
        `Check the test email in inbox: ${email}`,
        'Review the contact data in your contacts list',
      ],
    });

  } catch (error) {
    console.error('Plunk test error:', error);
    return NextResponse.json(
      { 
        error: 'Test failed', 
        details: error instanceof Error ? error.message : 'Unknown error',
        troubleshooting: [
          'Verify PLUNK_API_KEY is set in your .env file',
          'Check your API key is valid in Plunk dashboard',
          'Ensure your Plunk account is active',
        ],
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Plunk Integration Test Endpoint',
    usage: 'POST to this endpoint with { "email": "test@example.com" }',
    curl: `curl -X POST http://localhost:3000/api/plunk/test -H "Content-Type: application/json" -d '{"email":"test@example.com"}'`,
  });
}

