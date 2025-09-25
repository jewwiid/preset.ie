#!/usr/bin/env node

/**
 * Google Workspace Setup Helper Script
 * This script helps configure Google Workspace for Preset platform
 */

const fs = require('fs');
const path = require('path');

function generateDNSRecords() {
  console.log('🌐 DNS Records Configuration for presetie.com and presetie.io\n');
  
  console.log('📋 MX Records (Required for email):');
  console.log('Add these MX records to your DNS provider for both domains:\n');
  
  const mxRecords = [
    { priority: 1, value: 'aspmx.l.google.com' },
    { priority: 5, value: 'alt1.aspmx.l.google.com' },
    { priority: 5, value: 'alt2.aspmx.l.google.com' },
    { priority: 10, value: 'alt3.aspmx.l.google.com' },
    { priority: 10, value: 'alt4.aspmx.l.google.com' }
  ];
  
  mxRecords.forEach(record => {
    console.log(`Priority: ${record.priority}, Value: ${record.value}`);
  });
  
  console.log('\n📋 SPF Record (Anti-spam):');
  console.log('Add this TXT record to both domains:');
  console.log('v=spf1 include:_spf.google.com ~all\n');
  
  console.log('📋 DMARC Record (Email security):');
  console.log('Add this TXT record to both domains:');
  console.log('v=DMARC1; p=quarantine; rua=mailto:dmarc@presetie.com\n');
  
  console.log('📋 DKIM Record (Email authentication):');
  console.log('1. In Google Admin Console, go to Apps > Google Workspace > Gmail > Authenticate email');
  console.log('2. Generate DKIM key for each domain');
  console.log('3. Add the provided TXT record to your DNS\n');
}

function generateEnvironmentTemplate() {
  console.log('🔧 Environment Variables Template\n');
  
  const envTemplate = `# Google Workspace Email Configuration
GOOGLE_WORKSPACE_DOMAIN=presetie.com
GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL=your-service-account@presetie.com.iam.gserviceaccount.com
GOOGLE_WORKSPACE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"
GOOGLE_WORKSPACE_PROJECT_ID=your-project-id

# Email Configuration
FROM_EMAIL=support@presetie.com
FROM_NAME=Preset Support
REPLY_TO_EMAIL=support@presetie.com

# Email Templates
EMAIL_TEMPLATE_BRAND_COLOR=#007bff
EMAIL_TEMPLATE_LOGO_URL=https://presetie.com/logo.png`;

  console.log('Add these variables to your .env files:');
  console.log('─'.repeat(60));
  console.log(envTemplate);
  console.log('─'.repeat(60));
}

function generateServiceAccountInstructions() {
  console.log('\n🔑 Google Cloud Service Account Setup\n');
  
  console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/');
  console.log('2. Create a new project or select existing one');
  console.log('3. Enable Gmail API:');
  console.log('   - Go to APIs & Services > Library');
  console.log('   - Search for "Gmail API"');
  console.log('   - Click Enable');
  console.log('4. Create Service Account:');
  console.log('   - Go to IAM & Admin > Service Accounts');
  console.log('   - Click Create Service Account');
  console.log('   - Name: preset-email-service');
  console.log('   - Description: Service account for Preset email functionality');
  console.log('5. Grant Permissions:');
  console.log('   - Add role: Gmail API User');
  console.log('   - Add role: Service Account User');
  console.log('6. Create Key:');
  console.log('   - Click on the service account');
  console.log('   - Go to Keys tab');
  console.log('   - Click Add Key > Create new key');
  console.log('   - Choose JSON format');
  console.log('   - Download the key file');
  console.log('7. Extract credentials from the JSON file:');
  console.log('   - client_email: Use as GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL');
  console.log('   - private_key: Use as GOOGLE_WORKSPACE_PRIVATE_KEY');
  console.log('   - project_id: Use as GOOGLE_WORKSPACE_PROJECT_ID');
}

function generateEmailAddresses() {
  console.log('\n📧 Recommended Email Addresses\n');
  
  const emailAddresses = [
    { address: 'support@presetie.com', purpose: 'Customer support and general inquiries' },
    { address: 'noreply@presetie.com', purpose: 'Automated system emails' },
    { address: 'admin@presetie.com', purpose: 'Administrative communications' },
    { address: 'marketing@presetie.com', purpose: 'Marketing campaigns and newsletters' },
    { address: 'billing@presetie.com', purpose: 'Payment and billing related emails' },
    { address: 'security@presetie.com', purpose: 'Security notifications and alerts' },
    { address: 'partnerships@presetie.com', purpose: 'Business partnerships and collaborations' }
  ];
  
  emailAddresses.forEach(email => {
    console.log(`📮 ${email.address}`);
    console.log(`   Purpose: ${email.purpose}`);
    console.log('');
  });
}

function generateTestingChecklist() {
  console.log('\n🧪 Email Testing Checklist\n');
  
  const checklist = [
    '✅ DNS records propagated (check with MXToolbox)',
    '✅ Google Workspace account created and verified',
    '✅ Service account created with Gmail API access',
    '✅ Environment variables configured',
    '✅ Test email sent successfully',
    '✅ Email appears in inbox (not spam)',
    '✅ SPF record validated',
    '✅ DKIM signature verified',
    '✅ DMARC policy working',
    '✅ Reply functionality tested',
    '✅ Email templates rendering correctly',
    '✅ Mobile email client compatibility'
  ];
  
  checklist.forEach(item => {
    console.log(item);
  });
}

function main() {
  console.log('🚀 Google Workspace Setup for Preset Platform');
  console.log('=' .repeat(50));
  console.log('Domain: presetie.com / presetie.io');
  console.log('Primary Email: support@presetie.com');
  console.log('=' .repeat(50));
  
  generateDNSRecords();
  generateEnvironmentTemplate();
  generateServiceAccountInstructions();
  generateEmailAddresses();
  generateTestingChecklist();
  
  console.log('\n📚 Additional Resources:');
  console.log('- Google Workspace Help: https://support.google.com/a/');
  console.log('- Gmail API Documentation: https://developers.google.com/gmail/api');
  console.log('- DNS Configuration Guide: https://support.google.com/a/answer/140034');
  console.log('- MXToolbox (DNS Testing): https://mxtoolbox.com/');
  
  console.log('\n🎉 Setup Complete! Follow the steps above to configure your email service.');
}

// Run the setup helper
main();