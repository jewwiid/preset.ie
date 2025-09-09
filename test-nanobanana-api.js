const fetch = require('node-fetch');

const nanoBananaApiKey = 'e0847916744535b2241e366dbca9a465';

async function testNanoBananaAPI() {
  console.log('Testing NanoBanana API...\n');
  
  try {
    // Test 1: Try to create a simple enhancement task
    console.log('1️⃣ Testing enhancement creation with a public image...');
    
    const testPayload = {
      prompt: 'Enhance the lighting and colors',
      type: 'IMAGETOIAMGE', // Note the typo in their API
      imageUrls: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800'],
      numImages: 1
    };
    
    console.log('Payload:', JSON.stringify(testPayload, null, 2));
    
    const response = await fetch('https://api.nanobananaapi.ai/api/v1/nanobanana/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nanoBananaApiKey}`
      },
      body: JSON.stringify(testPayload)
    });

    const data = await response.json();
    console.log('\n📊 API Response:');
    console.log('Status:', response.status);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.code === 200 && data.data && data.data.taskId) {
      console.log('\n✅ Task created successfully!');
      console.log('Task ID:', data.data.taskId);
      console.log('\nYou can check this task status later.');
      
      // Wait a bit then check status
      console.log('\n⏳ Waiting 5 seconds before checking status...');
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const statusUrl = `https://api.nanobananaapi.ai/api/v1/nanobanana/task/${data.data.taskId}`;
      const statusResponse = await fetch(statusUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${nanoBananaApiKey}`,
          'Content-Type': 'application/json'
        }
      });
      
      const statusData = await statusResponse.json();
      console.log('\n📊 Task Status:');
      console.log(JSON.stringify(statusData, null, 2));
      
    } else if (data.code === 402) {
      console.log('\n❌ Insufficient credits!');
      console.log('Message:', data.msg || 'No credits available');
      console.log('\n💡 Solution: Add credits to your NanoBanana account');
    } else if (data.code === 400) {
      console.log('\n❌ Bad request!');
      console.log('Message:', data.msg || 'Invalid request');
      console.log('\n💡 Possible issues:');
      console.log('- Image URL not accessible');
      console.log('- Invalid image format');
      console.log('- Missing required parameters');
    } else {
      console.log('\n⚠️ Unexpected response');
      console.log('This might indicate an API issue or configuration problem');
    }
    
    // Test 2: Check what endpoints are available
    console.log('\n2️⃣ Testing available endpoints...');
    
    const endpoints = [
      '/api/v1/nanobanana/generate',
      '/api/v1/nanobanana/tasks',
      '/api/v1/user/credits',
      '/api/v1/health'
    ];
    
    for (const endpoint of endpoints) {
      const url = `https://api.nanobananaapi.ai${endpoint}`;
      try {
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${nanoBananaApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 5000
        });
        console.log(`${endpoint}: ${res.status} ${res.statusText}`);
      } catch (err) {
        console.log(`${endpoint}: Failed - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run test
testNanoBananaAPI();