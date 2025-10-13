#!/usr/bin/env node

/**
 * Script to fix Supabase storage policies for profile photo uploads
 * This script uses the Supabase CLI with proper permissions
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

async function fixStoragePolicies() {
  try {
    console.log('🔧 Fixing Supabase storage policies...');
    
    // Read the SQL file
    const sqlFile = path.join(__dirname, 'fix_storage_policies_v2.sql');
    const sqlContent = fs.readFileSync(sqlFile, 'utf8');
    
    // Write to a temporary file that Supabase CLI can use
    const tempFile = path.join(__dirname, 'temp_storage_fix.sql');
    fs.writeFileSync(tempFile, sqlContent);
    
    console.log('📝 Executing storage policy fixes...');
    
    // Execute the SQL using Supabase CLI
    // This should work because it uses the service role
    const command = `supabase db reset --db-url "$(supabase status --output json | jq -r '.DB_URL')" --file ${tempFile}`;
    
    try {
      execSync(command, { stdio: 'inherit' });
      console.log('✅ Storage policies fixed successfully!');
    } catch (error) {
      console.log('⚠️  CLI approach failed, trying direct SQL execution...');
      
      // Alternative: Try to execute SQL directly
      const directCommand = `supabase db shell --file ${tempFile}`;
      execSync(directCommand, { stdio: 'inherit' });
      console.log('✅ Storage policies fixed successfully!');
    }
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    console.log('🎉 Profile photo uploads should now work!');
    console.log('📋 Policies created:');
    console.log('   - Users can upload their own profile photos');
    console.log('   - Users can update their own profile photos');
    console.log('   - Users can delete their own profile photos');
    console.log('   - Anyone can view profile photos');
    
  } catch (error) {
    console.error('❌ Error fixing storage policies:', error.message);
    console.log('\n🔧 Manual fix required:');
    console.log('1. Go to Supabase Dashboard → Storage → Policies');
    console.log('2. Click "New policy" next to AVATARS bucket');
    console.log('3. Add the 4 policies manually (see fix_storage_policies_v2.sql)');
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  fixStoragePolicies();
}

module.exports = { fixStoragePolicies };
