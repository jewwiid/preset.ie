import { NextRequest, NextResponse } from 'next/server';

/**
 * Test endpoint to manually trigger daily admin summary email
 * Useful for testing the email system without waiting for the cron job
 */
export async function POST(request: NextRequest) {
  try {
    const { adminEmail, preview } = await request.json();
    
    if (!adminEmail) {
      return NextResponse.json(
        { error: 'Admin email is required' },
        { status: 400 }
      );
    }

    if (preview) {
      // Just return the HTML preview without sending email
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/daily-summary`, {
        method: 'GET'
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate preview');
      }
      
      const html = await response.text();
      
      return new NextResponse(html, {
        headers: {
          'Content-Type': 'text/html',
        },
      });
    }

    // Send the actual email
    const summaryResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/admin/daily-summary`, {
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

    return NextResponse.json({
      success: true,
      message: `Daily summary email sent to ${adminEmail}`,
      summary: result.summary,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Test daily summary error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to send test daily summary',
        details: error.message,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint for testing - returns a simple form to test the email
 */
export async function GET() {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Daily Admin Summary</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input[type="email"] { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; }
    button { background: #00876f; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
    button:hover { background: #006b5a; }
    .preview-btn { background: #6b7280; }
    .preview-btn:hover { background: #4b5563; }
    .result { margin-top: 20px; padding: 15px; border-radius: 4px; }
    .success { background: #d1fae5; border: 1px solid #10b981; color: #065f46; }
    .error { background: #fee2e2; border: 1px solid #ef4444; color: #991b1b; }
  </style>
</head>
<body>
  <h1>Test Daily Admin Summary</h1>
  <p>Send a test daily summary email to see how it looks.</p>
  
  <div class="form-group">
    <label for="email">Admin Email:</label>
    <input type="email" id="email" placeholder="support@presetie.com" required>
  </div>
  
  <button onclick="sendEmail()">Send Test Email</button>
  <button onclick="previewEmail()" class="preview-btn">Preview HTML</button>
  
  <div id="result"></div>
  
  <script>
    async function sendEmail() {
      const email = document.getElementById('email').value;
      if (!email) {
        alert('Please enter an email address');
        return;
      }
      
      const resultDiv = document.getElementById('result');
      resultDiv.innerHTML = '<p>Sending email...</p>';
      
      try {
        const response = await fetch('/api/admin/test-daily-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminEmail: email })
        });
        
        const result = await response.json();
        
        if (result.success) {
          resultDiv.innerHTML = \`
            <div class="result success">
              <h3>✓ Email Sent Successfully!</h3>
              <p><strong>Sent to:</strong> \${email}</p>
              <p><strong>Date:</strong> \${result.summary?.date}</p>
              <p><strong>Generations:</strong> \${result.summary?.generationsToday}</p>
              <p><strong>Cost:</strong> $\${result.summary?.costTodayUsd}</p>
            </div>
          \`;
        } else {
          resultDiv.innerHTML = \`
            <div class="result error">
              <h3>✗ Failed to Send Email</h3>
              <p><strong>Error:</strong> \${result.error}</p>
              <p><strong>Details:</strong> \${result.details}</p>
            </div>
          \`;
        }
      } catch (error) {
        resultDiv.innerHTML = \`
          <div class="result error">
            <h3>✗ Network Error</h3>
            <p>\${error.message}</p>
          </div>
        \`;
      }
    }
    
    async function previewEmail() {
      const email = document.getElementById('email').value;
      if (!email) {
        alert('Please enter an email address');
        return;
      }
      
      try {
        const response = await fetch('/api/admin/test-daily-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminEmail: email, preview: true })
        });
        
        if (response.ok) {
          const html = await response.text();
          const newWindow = window.open('', '_blank');
          newWindow.document.write(html);
        } else {
          alert('Failed to generate preview');
        }
      } catch (error) {
        alert('Error generating preview: ' + error.message);
      }
    }
  </script>
</body>
</html>
  `;
  
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
    },
  });
}
