#!/usr/bin/env node

// Test script to verify the enhance-image API endpoint
const fetch = require('node-fetch');

async function testAPIEndpoint() {
  console.log('🧪 Testing Enhance Image API Endpoint...\n');

  const baseUrl = 'http://localhost:3000';
  
  // Test data
  const testRequest = {
    inputImageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    enhancementType: 'lighting',
    prompt: 'warm golden hour lighting',
    strength: 0.8
  };

  try {
    console.log('📡 Testing POST /api/enhance-image...');
    console.log('Request data:', JSON.stringify(testRequest, null, 2));

    const response = await fetch(`${baseUrl}/api/enhance-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // This will fail auth, but we can see the response
      },
      body: JSON.stringify(testRequest)
    });

    const responseData = await response.json();
    
    console.log(`\n📊 Response Status: ${response.status}`);
    console.log('Response Data:', JSON.stringify(responseData, null, 2));

    if (response.status === 401) {
      console.log('\n✅ API endpoint is working! (Authentication required as expected)');
      console.log('   The endpoint is properly rejecting requests without valid auth tokens');
    } else if (response.status === 200) {
      console.log('\n✅ API endpoint is working! Task submitted successfully');
      console.log(`   Task ID: ${responseData.taskId}`);
      console.log(`   Status: ${responseData.status}`);
    } else {
      console.log(`\n⚠️  Unexpected response status: ${response.status}`);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - is the Next.js server running?');
      console.log('   Start the server with: npm run dev');
    } else {
      console.log('❌ Error testing API:', error.message);
    }
  }

  console.log('\n📋 Manual Testing Instructions:');
  console.log('1. Make sure the Next.js server is running: npm run dev');
  console.log('2. Get a valid user token from your auth system');
  console.log('3. Test with curl:');
  console.log(`
curl -X POST http://localhost:3000/api/enhance-image \\
  -H "Authorization: Bearer YOUR_USER_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "inputImageUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop",
    "enhancementType": "lighting",
    "prompt": "warm golden hour lighting",
    "strength": 0.8
  }'
  `);
  console.log('\n4. Check task status:');
  console.log(`
curl -X GET "http://localhost:3000/api/enhance-image?taskId=TASK_ID" \\
  -H "Authorization: Bearer YOUR_USER_TOKEN"
  `);
}

// Run the test
testAPIEndpoint();
