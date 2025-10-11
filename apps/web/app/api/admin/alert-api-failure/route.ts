import { NextRequest, NextResponse } from 'next/server';

// Simple Plunk service for API failure alerts
class SimplePlunkService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.useplunk.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async sendTransactionalEmail(options: {
    to: string;
    subject: string;
    body: string;
    from?: string;
    name?: string;
  }): Promise<{ success: boolean; emails: any[] }> {
    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          body: options.body,
          subscribed: true,
          name: options.name,
          from: options.from,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Plunk API error: ${response.status} - ${error}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to send transactional email:', error);
      throw error;
    }
  }
}

function getPlunkService(): SimplePlunkService {
  // Try multiple sources for the API key
  const apiKey = process.env.PLUNK_API_KEY || 
                 process.env.NEXT_PUBLIC_PLUNK_API_KEY ||
                 'sk_410545c78baa04e967963991f1ca83d949bf156aeba302f1'; // Fallback for testing
  
  if (!apiKey) {
    throw new Error('PLUNK_API_KEY environment variable is not set');
  }
  return new SimplePlunkService(apiKey);
}

interface APIFailureAlert {
  type: 'credits_exhausted' | 'api_error' | 'timeout' | 'rate_limit' | 'provider_down' | 'unknown';
  provider: string; // 'nanobanana', 'seedream', 'seedance', etc.
  errorMessage: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  userEmail?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

function generateAlertEmailHTML(alert: APIFailureAlert): string {
  const severityColors = {
    critical: '#dc2626', // Red
    high: '#ea580c',     // Orange
    medium: '#d97706',   // Amber
    low: '#ca8a04'       // Yellow
  };

  const severityEmojis = {
    critical: '🚨',
    high: '⚠️',
    medium: '⚡',
    low: 'ℹ️'
  };

  const typeDescriptions = {
    credits_exhausted: 'API Credits Exhausted',
    api_error: 'API Error',
    timeout: 'Request Timeout',
    rate_limit: 'Rate Limit Exceeded',
    provider_down: 'Provider Service Down',
    unknown: 'Unknown Error'
  };

  const color = severityColors[alert.severity];
  const emoji = severityEmojis[alert.severity];
  const typeDesc = typeDescriptions[alert.type];

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>API Failure Alert - ${alert.provider}</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
      color: #0f172a; 
      background: #f8fafc; 
      margin: 0; 
      padding: 20px; 
      line-height: 1.6;
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      background: #ffffff; 
      border-radius: 12px; 
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header { 
      background: ${color}; 
      padding: 30px; 
      text-align: center; 
      color: white;
    }
    .alert-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }
    .alert-title {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .alert-subtitle {
      color: rgba(255, 255, 255, 0.9);
      font-size: 16px;
      margin: 0;
    }
    .content { 
      padding: 30px; 
    }
    .alert-details {
      background: #f1f5f9;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .detail-row {
      display: flex;
      margin-bottom: 12px;
    }
    .detail-label {
      font-weight: 600;
      min-width: 120px;
      color: #475569;
    }
    .detail-value {
      color: #0f172a;
      word-break: break-all;
    }
    .error-message {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 6px;
      padding: 16px;
      margin: 16px 0;
      font-family: 'Monaco', 'Menlo', monospace;
      font-size: 14px;
      color: #991b1b;
    }
    .action-required {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .action-title {
      font-weight: 600;
      color: #92400e;
      margin-bottom: 12px;
      font-size: 16px;
    }
    .action-steps {
      color: #92400e;
      margin: 0;
    }
    .action-steps li {
      margin-bottom: 8px;
    }
    .footer {
      background: #f8fafc;
      padding: 20px 30px;
      text-align: center;
      color: #64748b;
      font-size: 14px;
    }
    .footer a {
      color: #00876f;
      text-decoration: none;
    }
    .footer a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="alert-icon">${emoji}</div>
      <h1 class="alert-title">API Failure Alert</h1>
      <p class="alert-subtitle">${typeDesc} - ${alert.provider}</p>
    </div>
    
    <div class="content">
      <h2 style="margin-top: 0; color: ${color};">Immediate Action Required</h2>
      
      <div class="alert-details">
        <div class="detail-row">
          <span class="detail-label">Provider:</span>
          <span class="detail-value"><strong>${alert.provider}</strong></span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Severity:</span>
          <span class="detail-value" style="color: ${color}; font-weight: 600;">${alert.severity.toUpperCase()}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Type:</span>
          <span class="detail-value">${typeDesc}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${new Date(alert.timestamp).toLocaleString()}</span>
        </div>
        ${alert.requestId ? `
        <div class="detail-row">
          <span class="detail-label">Request ID:</span>
          <span class="detail-value">${alert.requestId}</span>
        </div>
        ` : ''}
        ${alert.userId ? `
        <div class="detail-row">
          <span class="detail-label">User ID:</span>
          <span class="detail-value">${alert.userId}</span>
        </div>
        ` : ''}
        ${alert.userEmail ? `
        <div class="detail-row">
          <span class="detail-label">User Email:</span>
          <span class="detail-value">${alert.userEmail}</span>
        </div>
        ` : ''}
      </div>

      <div class="error-message">
        <strong>Error Details:</strong><br>
        ${alert.errorMessage}
      </div>

      <div class="action-required">
        <div class="action-title">🚨 Immediate Actions Required:</div>
        <ol class="action-steps">
          ${alert.type === 'credits_exhausted' ? `
          <li><strong>Check WaveSpeed Credits:</strong> Log into your WaveSpeed dashboard and verify remaining credits</li>
          <li><strong>Purchase Additional Credits:</strong> If credits are low, purchase more to restore service</li>
          <li><strong>Update Credit Settings:</strong> Consider adjusting credit ratios or implementing better monitoring</li>
          ` : ''}
          ${alert.type === 'api_error' ? `
          <li><strong>Check API Status:</strong> Visit WaveSpeed status page or contact their support</li>
          <li><strong>Verify API Keys:</strong> Ensure your WaveSpeed API key is valid and has proper permissions</li>
          <li><strong>Review Error Logs:</strong> Check for any recent changes or configuration issues</li>
          ` : ''}
          ${alert.type === 'timeout' ? `
          <li><strong>Check Network Connectivity:</strong> Verify your server's connection to WaveSpeed</li>
          <li><strong>Review Timeout Settings:</strong> Consider increasing timeout values if appropriate</li>
          <li><strong>Monitor Server Performance:</strong> Check if your server is experiencing high load</li>
          ` : ''}
          ${alert.type === 'rate_limit' ? `
          <li><strong>Review Usage Patterns:</strong> Check if you're exceeding rate limits</li>
          <li><strong>Implement Rate Limiting:</strong> Add client-side rate limiting to prevent future issues</li>
          <li><strong>Contact WaveSpeed:</strong> Consider upgrading your plan if limits are too restrictive</li>
          ` : ''}
          <li><strong>Test Service:</strong> Try a manual generation to verify the fix</li>
          <li><strong>Monitor Dashboard:</strong> Watch the admin dashboard for continued issues</li>
        </ol>
      </div>
    </div>

    <div class="footer">
      <p>This alert was sent automatically by the Preset monitoring system.</p>
      <p>Visit your <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://preset.ie'}/admin">Admin Dashboard</a> for more details.</p>
      <p>Time: ${new Date().toLocaleString()}</p>
    </div>
  </div>
</body>
</html>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const alert: APIFailureAlert = await request.json();
    
    // Validate required fields
    if (!alert.type || !alert.provider || !alert.errorMessage || !alert.severity) {
      return NextResponse.json(
        { error: 'Missing required fields: type, provider, errorMessage, severity' },
        { status: 400 }
      );
    }

    // Get admin email from environment
    const adminEmail = process.env.ADMIN_EMAIL || 'support@presetie.com';
    
    // Generate email content
    const emailHTML = generateAlertEmailHTML(alert);
    
    // Send alert email
    const plunk = getPlunkService();
    await plunk.sendTransactionalEmail({
      to: adminEmail,
      subject: `🚨 API Alert: ${alert.type.replace('_', ' ').toUpperCase()} - ${alert.provider}`,
      body: emailHTML,
      from: 'support@presetie.com',
      name: 'Preset Monitoring'
    });

    // Log the alert for tracking
    console.error('API Failure Alert Sent:', {
      type: alert.type,
      provider: alert.provider,
      severity: alert.severity,
      timestamp: alert.timestamp,
      adminEmail: adminEmail
    });

    return NextResponse.json({
      success: true,
      message: 'API failure alert sent successfully',
      alert: {
        type: alert.type,
        provider: alert.provider,
        severity: alert.severity,
        timestamp: alert.timestamp
      }
    });

  } catch (error: any) {
    console.error('Failed to send API failure alert:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send API failure alert',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

// Test endpoint for manually triggering alerts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testType = searchParams.get('type') || 'credits_exhausted';
  const testProvider = searchParams.get('provider') || 'nanobanana';
  
  const testAlert: APIFailureAlert = {
    type: testType as any,
    provider: testProvider,
    errorMessage: 'This is a test alert to verify the API failure notification system is working correctly.',
    timestamp: new Date().toISOString(),
    requestId: 'test-request-123',
    userId: 'test-user-456',
    userEmail: 'test@example.com',
    severity: 'high'
  };

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
      message: 'Test alert sent',
      testAlert,
      result
    });

  } catch (error: any) {
    return NextResponse.json(
      { 
        error: 'Failed to send test alert',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
