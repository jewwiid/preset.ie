#!/usr/bin/env node

/**
 * Google OAuth Setup Script for Preset Platform
 * 
 * This script helps you configure Google OAuth and Gmail integration
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Google OAuth Setup for Preset Platform\n');

// Check if .env file exists
const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../env.example');

if (!fs.existsSync(envPath)) {
  console.log('📝 Creating .env file from env.example...');
  fs.copyFileSync(envExamplePath, envPath);
  console.log('✅ .env file created!\n');
}

console.log('🔧 Next Steps:\n');

console.log('1. 📋 Copy your OAuth credentials from Google Cloud Console:');
console.log('   - Go to: https://console.cloud.google.com/');
console.log('   - Navigate to: APIs & Services > Credentials');
console.log('   - Click on your OAuth 2.0 Client ID');
console.log('   - Copy the Client ID and Client Secret\n');

console.log('2. ✏️  Update your .env file with these values:');
console.log('   GOOGLE_CLIENT_ID=your_actual_client_id_here');
console.log('   GOOGLE_CLIENT_SECRET=your_actual_client_secret_here\n');

console.log('3. 🎯 Configure OAuth Consent Screen:');
console.log('   - Go to: APIs & Services > OAuth consent screen');
console.log('   - Choose "External" user type');
console.log('   - Fill out app information:');
console.log('     * App name: Preset Platform');
console.log('     * User support email: support@presetie.com');
console.log('     * App domain: presetie.com');
console.log('   - Add scopes:');
console.log('     * https://www.googleapis.com/auth/userinfo.email');
console.log('     * https://www.googleapis.com/auth/userinfo.profile');
console.log('     * https://www.googleapis.com/auth/gmail.send');
console.log('     * https://www.googleapis.com/auth/gmail.readonly');
console.log('   - Add test users (your email address)\n');

console.log('4. 📧 Set up Gmail API (for email sending):');
console.log('   - Go to: APIs & Services > Library');
console.log('   - Search for "Gmail API"');
console.log('   - Click "Enable"\n');

console.log('5. 🔑 Create Service Account (for Gmail API):');
console.log('   - Go to: APIs & Services > Credentials');
console.log('   - Click "Create Credentials" > "Service Account"');
console.log('   - Name: preset-gmail-service');
console.log('   - Download the JSON key file');
console.log('   - Update .env with:');
console.log('     * GOOGLE_WORKSPACE_SERVICE_ACCOUNT_EMAIL');
console.log('     * GOOGLE_WORKSPACE_PRIVATE_KEY');
console.log('     * GOOGLE_WORKSPACE_PROJECT_ID\n');

console.log('6. 🧪 Test the integration:');
console.log('   - Run: npm run dev');
console.log('   - Try Google Sign-In');
console.log('   - Test email sending\n');

console.log('📚 Documentation:');
console.log('   - OAuth Setup: https://developers.google.com/identity/protocols/oauth2');
console.log('   - Gmail API: https://developers.google.com/gmail/api');
console.log('   - NextAuth.js: https://next-auth.js.org/providers/google\n');

console.log('🎉 Once configured, your Preset platform will have:');
console.log('   ✅ Google Sign-In authentication');
console.log('   ✅ Gmail API integration for emails');
console.log('   ✅ Professional email templates');
console.log('   ✅ Secure OAuth flow\n');

console.log('Need help? Check the documentation in docs/EMAIL_SYSTEM_IMPLEMENTATION.md');
