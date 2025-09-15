// Script to check storage buckets and their policies
// Run with: node check-storage-buckets.js

const fs = require('fs');
const path = require('path');

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found');
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
  
  return envVars;
}

async function checkStorageBuckets() {
  const envVars = loadEnvFile();
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    return;
  }

  try {
    console.log('🔍 Checking storage buckets...');
    
    // Check if buckets exist
    const bucketsResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!bucketsResponse.ok) {
      throw new Error(`Failed to fetch buckets: ${bucketsResponse.status}`);
    }

    const buckets = await bucketsResponse.json();
    console.log('📦 Available buckets:', buckets.map(b => b.name));

    // Check specific buckets
    const requiredBuckets = ['moodboard-uploads', 'playground-gallery'];
    
    for (const bucketName of requiredBuckets) {
      const bucket = buckets.find(b => b.name === bucketName);
      if (bucket) {
        console.log(`✅ ${bucketName}: Found`);
        console.log(`   - Public: ${bucket.public}`);
        console.log(`   - File size limit: ${bucket.file_size_limit || 'No limit'}`);
        console.log(`   - Allowed MIME types: ${bucket.allowed_mime_types?.join(', ') || 'All types'}`);
      } else {
        console.log(`❌ ${bucketName}: Missing`);
      }
    }

    // Check RLS policies
    console.log('\n🔒 Checking RLS policies...');
    
    const policiesResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_storage_policies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (policiesResponse.ok) {
      const policies = await policiesResponse.json();
      console.log('📋 Current storage policies:', policies.length);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd} on ${policy.qual}`);
      });
    } else {
      console.log('⚠️  Could not fetch policies (this is normal if RLS is not set up yet)');
    }

  } catch (error) {
    console.error('❌ Error checking storage:', error.message);
  }
}

checkStorageBuckets();
