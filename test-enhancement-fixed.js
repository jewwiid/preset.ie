const fetch = require('node-fetch');

// Test enhancement with fixed callback URL
async function testEnhancement() {
  console.log('Testing NanoBanana enhancement with fixed callback URL...\n');
  
  const nanoBananaApiKey = 'e0847916744535b2241e366dbca9a465';
  
  // Use your deployed Vercel URL
  const callbackUrl = 'https://preset-51brxeczd-jewwiids-projects.vercel.app/api/nanobanana/callback';
  
  console.log('Callback URL (no trailing newline):', callbackUrl);
  console.log('URL length:', callbackUrl.length);
  console.log('Last char:', callbackUrl[callbackUrl.length - 1], 'Code:', callbackUrl.charCodeAt(callbackUrl.length - 1));
  
  const payload = {
    prompt: 'Enhance the lighting and make colors more vibrant',
    type: 'IMAGETOIAMGE',
    imageUrls: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800'],
    callBackUrl: callbackUrl,
    numImages: 1
  };
  
  console.log('\nPayload:', JSON.stringify(payload, null, 2));
  
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
    
    console.log('\n📊 Response:');
    console.log('Status:', response.status);
    console.log('Data:', JSON.stringify(data, null, 2));
    
    if (data.code === 200 && data.data?.taskId) {
      console.log('\n✅ Success! Task created with ID:', data.data.taskId);
      console.log('The callback should be received at:', callbackUrl);
      console.log('\nNote: Check your Vercel logs to see if the callback is received.');
    } else {
      console.log('\n❌ Failed to create task');
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testEnhancement();