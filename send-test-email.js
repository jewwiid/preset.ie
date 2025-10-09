#!/usr/bin/env node

/**
 * Send test email to support@presetie.com
 * This bypasses Next.js to test Plunk directly
 */

require('dotenv').config();

const PLUNK_API_KEY = process.env.PLUNK_API_KEY;
const BASE_URL = 'https://api.useplunk.com/v1';

async function sendTestEmail() {
  console.log('🚀 Sending test email to support@presetie.com...\n');

  if (!PLUNK_API_KEY) {
    console.error('❌ PLUNK_API_KEY not found in environment');
    process.exit(1);
  }

  console.log('✅ API Key found:', PLUNK_API_KEY.substring(0, 10) + '...\n');

  const testEmail = 'support@presetie.com';
  const results = {};

  // Test 1: Track Event
  console.log('📊 Test 1: Tracking event...');
  try {
    const trackResponse = await fetch(`${BASE_URL}/track`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PLUNK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'test.integration',
        email: testEmail,
        subscribed: true,
        data: {
          source: 'direct-test-script',
          timestamp: new Date().toISOString(),
          message: 'Testing Plunk integration for Preset.ie'
        },
      }),
    });

    if (trackResponse.ok) {
      const data = await trackResponse.json();
      results.trackEvent = data;
      console.log('   ✅ Event tracked successfully');
      console.log('   Contact ID:', data.contact);
      console.log('   Event ID:', data.event);
    } else {
      const error = await trackResponse.text();
      results.trackEvent = { error };
      console.log('   ❌ Failed:', error);
    }
  } catch (error) {
    results.trackEvent = { error: error.message };
    console.log('   ❌ Error:', error.message);
  }

  console.log('');

  // Test 2: Send Email
  console.log('📧 Test 2: Sending email...');
  try {
    const emailResponse = await fetch(`${BASE_URL}/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PLUNK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: testEmail,
        subject: '🎨 Plunk Integration Test - Preset.ie',
        body: `
          <!DOCTYPE html>
          <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
                .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
                .success-badge { background: #10b981; color: white; padding: 8px 16px; border-radius: 20px; display: inline-block; margin: 10px 0; }
                .info-box { background: white; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0; border-radius: 4px; }
                .footer { text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px; }
                h1 { margin: 0; font-size: 28px; }
                .emoji { font-size: 48px; margin-bottom: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="emoji">🎉</div>
                  <h1>Plunk Integration Test Successful!</h1>
                </div>
                <div class="content">
                  <div class="success-badge">✅ Integration Working</div>
                  
                  <h2>Hello from Preset.ie! 👋</h2>
                  
                  <p>This is a test email from your Plunk email marketing integration.</p>
                  
                  <div class="info-box">
                    <h3>📊 Test Details</h3>
                    <ul>
                      <li><strong>Sent to:</strong> ${testEmail}</li>
                      <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
                      <li><strong>Integration:</strong> Plunk Email Marketing</li>
                      <li><strong>Status:</strong> Active ✓</li>
                    </ul>
                  </div>
                  
                  <h3>✨ What's Working:</h3>
                  <ul>
                    <li>✅ API Connection established</li>
                    <li>✅ Event tracking active</li>
                    <li>✅ Transactional emails working</li>
                    <li>✅ Contact management ready</li>
                  </ul>
                  
                  <h3>🚀 Next Steps:</h3>
                  <ol>
                    <li>Set up email automation workflows in your <a href="https://app.useplunk.com">Plunk Dashboard</a></li>
                    <li>Add the newsletter signup component to your website</li>
                    <li>Integrate into your signup and purchase flows</li>
                    <li>Monitor performance in Plunk analytics</li>
                  </ol>
                  
                  <div class="info-box">
                    <strong>💡 Pro Tip:</strong> Check your Plunk dashboard to see this event and email in action!
                  </div>
                  
                  <div class="footer">
                    <p>This is an automated test email from Preset.ie</p>
                    <p>Powered by Plunk Email Marketing</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `,
      }),
    });

    if (emailResponse.ok) {
      const data = await emailResponse.json();
      results.sendEmail = data;
      console.log('   ✅ Email sent successfully!');
      console.log('   Check inbox at:', testEmail);
    } else {
      const error = await emailResponse.text();
      results.sendEmail = { error };
      console.log('   ❌ Failed:', error);
    }
  } catch (error) {
    results.sendEmail = { error: error.message };
    console.log('   ❌ Error:', error.message);
  }

  console.log('');

  // Test 3: Create/Update Contact
  console.log('👤 Test 3: Creating contact...');
  try {
    const contactResponse = await fetch(`${BASE_URL}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PLUNK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: testEmail,
        subscribed: true,
        data: {
          name: 'Preset.ie Support',
          testDate: new Date().toISOString(),
          source: 'integration-test',
          platform: 'Preset.ie'
        },
      }),
    });

    if (contactResponse.ok) {
      const data = await contactResponse.json();
      results.contactManagement = data;
      console.log('   ✅ Contact created/updated successfully');
    } else {
      const error = await contactResponse.text();
      results.contactManagement = { error };
      console.log('   ❌ Failed:', error);
    }
  } catch (error) {
    results.contactManagement = { error: error.message };
    console.log('   ❌ Error:', error.message);
  }

  // Summary
  console.log('\n════════════════════════════════════════');
  console.log('📋 Test Summary:\n');
  
  const allSuccess = results.trackEvent?.success && results.sendEmail?.success && results.contactManagement?.success;
  
  if (allSuccess) {
    console.log('✅ All tests passed!\n');
    console.log('Next steps:');
    console.log('1. Check your inbox at support@presetie.com');
    console.log('2. View the event in https://app.useplunk.com');
    console.log('3. Verify the contact was created');
    console.log('4. Restart your dev server to use Plunk in your app\n');
  } else {
    console.log('⚠️  Some tests had issues. Check the output above.\n');
  }
  
  console.log('════════════════════════════════════════\n');
}

sendTestEmail().catch(console.error);

