#!/usr/bin/env node

/**
 * Google OAuth Credentials Setup Script
 * 
 * This script helps you set up Google OAuth credentials for Preset.
 * Run this script to get step-by-step instructions.
 */

console.log('🔧 Google OAuth Credentials Setup for Preset\n')

console.log('📋 Step 1: Get Google OAuth Credentials')
console.log('1. Go to Google Cloud Console: https://console.cloud.google.com/')
console.log('2. Select your project (or create a new one)')
console.log('3. Go to: APIs & Services → Credentials')
console.log('4. Click "Create Credentials" → "OAuth 2.0 Client ID"')
console.log('5. Choose "Web application"')
console.log('6. Add these Authorized redirect URIs:')
console.log('   - https://zbsmgymyfhnwjdnmlelr.supabase.co/auth/v1/callback')
console.log('   - http://localhost:3000/auth/callback (for development)')
console.log('7. Copy the Client ID and Client Secret\n')

console.log('📋 Step 2: Add to Supabase Dashboard')
console.log('1. Go to: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr')
console.log('2. Navigate to: Authentication → Providers')
console.log('3. Find "Google" and toggle it ON')
console.log('4. Click "Configure"')
console.log('5. Add your Client ID and Client Secret')
console.log('6. Save the configuration\n')

console.log('📋 Step 3: Add to .env file')
console.log('Add these lines to your .env file:')
console.log('')
console.log('# Google OAuth Configuration (for Google Sign-In)')
console.log('GOOGLE_CLIENT_ID=your_google_client_id_here')
console.log('GOOGLE_CLIENT_SECRET=your_google_client_secret_here')
console.log('')

console.log('📋 Step 4: Apply Database Fix')
console.log('1. Go to Supabase SQL Editor')
console.log('2. Run this SQL:')
console.log('')
console.log('-- Fix Google OAuth user creation')
console.log('CREATE POLICY IF NOT EXISTS "Allow user creation during signup"')
console.log('  ON users')
console.log('  FOR INSERT')
console.log('  TO authenticated, anon')
console.log('  WITH CHECK (true);')
console.log('')

console.log('📋 Step 5: Test')
console.log('1. Restart your dev server: npm run dev')
console.log('2. Try Google signup again')
console.log('')

console.log('✅ After completing these steps, Google OAuth should work!')
console.log('')
console.log('🔍 If you still have issues, check:')
console.log('- Google Cloud Console OAuth consent screen is configured')
console.log('- Redirect URIs are correct')
console.log('- Supabase Google provider is enabled')
console.log('- Database policies are applied')
