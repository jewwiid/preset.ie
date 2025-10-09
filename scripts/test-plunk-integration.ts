#!/usr/bin/env tsx
/**
 * Test Plunk Integration
 * 
 * Run this script to verify your Plunk setup is working correctly.
 * 
 * Usage:
 *   npx tsx scripts/test-plunk-integration.ts
 * 
 * Or add to package.json:
 *   "test:plunk": "tsx scripts/test-plunk-integration.ts"
 */

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env') });

interface PlunkEvent {
  event: string;
  email: string;
  subscribed?: boolean;
  data?: Record<string, any>;
}

class PlunkTester {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.useplunk.com/v1';

  constructor() {
    const apiKey = process.env.PLUNK_API_KEY;
    if (!apiKey) {
      throw new Error('❌ PLUNK_API_KEY not found in environment variables');
    }
    this.apiKey = apiKey;
  }

  async testConnection(): Promise<boolean> {
    console.log('🔍 Testing Plunk API connection...\n');

    try {
      const response = await fetch(`${this.baseUrl}/contacts/test@example.com`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        console.log('✅ Connection successful! (Contact not found is expected)');
        return true;
      }

      if (response.ok) {
        console.log('✅ Connection successful!');
        return true;
      }

      if (response.status === 401) {
        console.log('❌ Authentication failed. Check your API key.');
        return false;
      }

      console.log(`⚠️  Unexpected response: ${response.status}`);
      return false;
    } catch (error) {
      console.log('❌ Connection failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async testTrackEvent(testEmail: string): Promise<boolean> {
    console.log('\n📊 Testing event tracking...');

    try {
      const response = await fetch(`${this.baseUrl}/track`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: 'test.event',
          email: testEmail,
          subscribed: true,
          data: {
            source: 'integration-test',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Event tracked successfully!');
        console.log('   Contact ID:', data.contact);
        console.log('   Event ID:', data.event);
        return true;
      }

      const error = await response.text();
      console.log('❌ Failed to track event:', error);
      return false;
    } catch (error) {
      console.log('❌ Event tracking failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async testSendEmail(testEmail: string): Promise<boolean> {
    console.log('\n📧 Testing transactional email...');

    try {
      const response = await fetch(`${this.baseUrl}/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmail,
          subject: 'Test Email from Plunk Integration',
          body: `
            <h1>Test Email</h1>
            <p>This is a test email from your Plunk integration.</p>
            <p>If you're seeing this, your Plunk setup is working correctly! ✅</p>
            <p><small>Sent at: ${new Date().toISOString()}</small></p>
          `,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Email sent successfully!');
        console.log('   Check your inbox at:', testEmail);
        return true;
      }

      const error = await response.text();
      console.log('❌ Failed to send email:', error);
      return false;
    } catch (error) {
      console.log('❌ Email sending failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }

  async testContactManagement(testEmail: string): Promise<boolean> {
    console.log('\n👤 Testing contact management...');

    try {
      // Create/update contact
      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: testEmail,
          subscribed: true,
          data: {
            name: 'Test User',
            source: 'integration-test',
            testDate: new Date().toISOString(),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Contact created/updated successfully!');
        console.log('   Contact ID:', data.contact.id);
        return true;
      }

      const error = await response.text();
      console.log('❌ Failed to manage contact:', error);
      return false;
    } catch (error) {
      console.log('❌ Contact management failed:', error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  }
}

async function main() {
  console.log('🚀 Plunk Integration Test\n');
  console.log('════════════════════════════════════════\n');

  try {
    const tester = new PlunkTester();
    
    // Get test email from args or use default
    const testEmail = process.argv[2] || 'test@example.com';
    console.log(`📫 Using test email: ${testEmail}\n`);

    let allPassed = true;

    // Test 1: Connection
    const connectionOk = await tester.testConnection();
    allPassed = allPassed && connectionOk;

    // Test 2: Track Event
    const trackingOk = await tester.testTrackEvent(testEmail);
    allPassed = allPassed && trackingOk;

    // Test 3: Send Email
    const emailOk = await tester.testSendEmail(testEmail);
    allPassed = allPassed && emailOk;

    // Test 4: Contact Management
    const contactOk = await tester.testContactManagement(testEmail);
    allPassed = allPassed && contactOk;

    // Summary
    console.log('\n════════════════════════════════════════\n');
    if (allPassed) {
      console.log('✅ All tests passed! Your Plunk integration is working correctly.\n');
      console.log('Next steps:');
      console.log('1. Check your Plunk dashboard at https://app.useplunk.com');
      console.log('2. Verify the test event appears in your events log');
      console.log('3. Check the test email in your inbox');
      console.log('4. Set up your first automation workflow\n');
      process.exit(0);
    } else {
      console.log('❌ Some tests failed. Please check the errors above.\n');
      console.log('Common issues:');
      console.log('- Verify PLUNK_API_KEY is set correctly in .env');
      console.log('- Check your API key has the correct permissions');
      console.log('- Ensure you have an active Plunk account\n');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test failed with error:', error);
    process.exit(1);
  }
}

main();

