// Test script for Seedream API connection
// Run with: node test-seedream-api.js

const fetch = require('node-fetch');

async function testSeedreamAPI() {
  const apiKey = process.env.WAVESPEED_API_KEY;
  
  if (!apiKey) {
    console.error('❌ WAVESPEED_API_KEY not found in environment variables');
    console.log('Please add WAVESPEED_API_KEY to your .env.local file');
    return;
  }

  try {
    console.log('🧪 Testing Seedream API connection...');
    
    const response = await fetch('https://api.wavespeed.ai/api/v3/bytedance/seedream-v4', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: 'a beautiful sunset over mountains',
        size: '1024*1024',
        enable_base64_output: false,
        enable_sync_mode: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      return;
    }

    const data = await response.json();
    console.log('✅ API Connection successful!');
    console.log('📊 Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
  }
}

testSeedreamAPI();
