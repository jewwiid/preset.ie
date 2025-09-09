const fetch = require('node-fetch');

async function testSupabaseCallback() {
  const supabaseUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co';
  const callbackUrl = `${supabaseUrl}/functions/v1/nanobanana-callback`;
  
  console.log('Testing Supabase Edge Function callback...');
  console.log('URL:', callbackUrl);
  console.log('');
  
  // Test 1: Check if endpoint is accessible
  console.log('1️⃣ Testing accessibility (POST)...');
  try {
    const response = await fetch(callbackUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code: 200,
        msg: 'test',
        data: {
          taskId: 'test123',
          info: {
            resultImageUrl: 'https://example.com/test.jpg'
          }
        }
      })
    });
    
    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.status === 200) {
      console.log('✅ Endpoint is accessible without authentication!');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  console.log('\n2️⃣ Testing with NanoBanana API...');
  
  const nanoBananaApiKey = 'e0847916744535b2241e366dbca9a465';
  
  const payload = {
    prompt: 'Enhance lighting and colors, make it more vibrant',
    type: 'IMAGETOIAMGE',
    imageUrls: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800'],
    callBackUrl: callbackUrl,
    numImages: 1
  };
  
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  try {
    const response = await fetch('https://api.nanobananaapi.ai/api/v1/nanobanana/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nanoBananaApiKey}`
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    console.log('\n📊 NanoBanana Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (data.code === 200 && data.data?.taskId) {
      console.log('\n✅ Task created successfully!');
      console.log('Task ID:', data.data.taskId);
      console.log('Callback will be sent to:', callbackUrl);
      console.log('\nNote: The Supabase Edge Function should receive the callback when processing completes.');
      console.log('Check Supabase Function logs to verify callback is received.');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSupabaseCallback();