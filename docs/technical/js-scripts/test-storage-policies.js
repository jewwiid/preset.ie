// Test script for storage bucket policies
// Run with: node test-storage-policies.js

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

async function testStoragePolicies() {
  const envVars = loadEnvFile();
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    return;
  }

  try {
    console.log('🧪 Testing storage bucket policies...');
    
    // Test 1: Check if buckets exist and are accessible
    console.log('\n📦 Testing bucket access...');
    
    const bucketsResponse = await fetch(`${supabaseUrl}/storage/v1/bucket`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (bucketsResponse.ok) {
      const buckets = await bucketsResponse.json();
      console.log('✅ Buckets accessible:', buckets.map(b => b.name));
    } else {
      console.log('❌ Cannot access buckets:', bucketsResponse.status);
    }

    // Test 2: Check RLS status
    console.log('\n🔒 Testing RLS status...');
    
    const rlsResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/check_rls_status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (rlsResponse.ok) {
      const rlsStatus = await rlsResponse.json();
      console.log('✅ RLS Status:', rlsStatus);
    } else {
      console.log('⚠️  RLS check failed (this is normal if not set up yet)');
    }

    // Test 3: Check existing policies
    console.log('\n📋 Checking existing policies...');
    
    const policiesResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/get_policies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });

    if (policiesResponse.ok) {
      const policies = await policiesResponse.json();
      console.log('📋 Current policies:', policies.length);
      policies.forEach(policy => {
        console.log(`   - ${policy.policyname}: ${policy.cmd}`);
      });
    } else {
      console.log('⚠️  Could not fetch policies');
    }

    // Test 4: Test file upload (if possible)
    console.log('\n📤 Testing file upload...');
    
    // Create a simple test file
    const testFile = new Blob(['test content'], { type: 'text/plain' });
    const formData = new FormData();
    formData.append('file', testFile, 'test.txt');
    
    const uploadResponse = await fetch(`${supabaseUrl}/storage/v1/object/playground-gallery/test-user/test.txt`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: formData
    });

    if (uploadResponse.ok) {
      console.log('✅ Test upload successful');
      
      // Clean up test file
      await fetch(`${supabaseUrl}/storage/v1/object/playground-gallery/test-user/test.txt`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });
      console.log('🧹 Test file cleaned up');
    } else {
      console.log('❌ Test upload failed:', uploadResponse.status, await uploadResponse.text());
    }

  } catch (error) {
    console.error('❌ Error testing storage:', error.message);
  }
}

testStoragePolicies();
