#!/usr/bin/env node

/**
 * Test script for Google Workspace Email Service
 * This script tests the email functionality with the new presetie.com domain
 */

const { EmailService } = require('../apps/web/lib/services/email.service.ts');

async function testEmailService() {
  console.log('🧪 Testing Google Workspace Email Service...\n');

  try {
    const emailService = EmailService.getInstance();

    // Test data
    const testRecipient = {
      email: 'test@example.com',
      name: 'Test User'
    };

    const testTemplate = {
      subject: 'Welcome to Preset - Email Service Test',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to Preset</title>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
              .content { padding: 20px 0; }
              .button { 
                display: inline-block; 
                background: #007bff; 
                color: white; 
                padding: 12px 24px; 
                text-decoration: none; 
                border-radius: 6px; 
                margin: 20px 0;
              }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 14px; color: #666; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎬 Welcome to Preset!</h1>
              </div>
              
              <div class="content">
                <p>Hi Test User,</p>
                
                <p>Welcome to Preset - the premier platform for creative professionals!</p>
                
                <p>This is a test email to verify that our Google Workspace email service is working correctly with the new presetie.com domain.</p>
                
                <a href="https://presetie.com" class="button">Visit Preset</a>
                
                <p>Thank you for being part of our creative community!</p>
              </div>
              
              <div class="footer">
                <p>Best regards,<br>The Preset Team</p>
                <p><small>This is a test email from the Preset platform.</small></p>
              </div>
            </div>
          </body>
        </html>
      `,
      text: `
Welcome to Preset!

Hi Test User,

Welcome to Preset - the premier platform for creative professionals!

This is a test email to verify that our Google Workspace email service is working correctly with the new presetie.com domain.

Visit Preset: https://presetie.com

Thank you for being part of our creative community!

Best regards,
The Preset Team

This is a test email from the Preset platform.
      `
    };

    console.log('📧 Sending test email...');
    console.log(`   To: ${testRecipient.email}`);
    console.log(`   Subject: ${testTemplate.subject}`);
    console.log(`   From: ${process.env.FROM_EMAIL || 'support@presetie.com'}\n`);

    const result = await emailService.sendEmail(testRecipient, testTemplate, {
      test: true,
      timestamp: new Date().toISOString()
    });

    if (result) {
      console.log('✅ Email service test completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Check your Google Workspace Gmail account for the test email');
      console.log('2. Verify the email appears in the inbox (not spam)');
      console.log('3. Test reply functionality');
      console.log('4. Check email authentication (SPF, DKIM, DMARC)');
    } else {
      console.log('❌ Email service test failed!');
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check Google Workspace credentials in environment variables');
      console.log('2. Verify Gmail API is enabled in Google Cloud Console');
      console.log('3. Ensure service account has proper permissions');
      console.log('4. Check DNS configuration for email authentication');
    }

  } catch (error) {
    console.error('❌ Error testing email service:', error);
    console.log('\n🔧 Common Issues:');
    console.log('1. Missing environment variables');
    console.log('2. Invalid Google Workspace credentials');
    console.log('3. Gmail API not enabled');
    console.log('4. Service account permissions');
  }
}

// Run the test
testEmailService().catch(console.error);
