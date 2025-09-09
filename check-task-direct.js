const fetch = require('node-fetch');

const taskId = 'a1955c96ecd5573580bf32ceb35d7616';
const nanoBananaApiKey = 'e0847916744535b2241e366dbca9a465';

async function checkTaskStatus() {
  console.log('Checking NanoBanana task status directly...');
  console.log('Task ID:', taskId);
  
  try {
    // Method 1: Check task status endpoint
    const statusUrl = `https://api.nanobananaapi.ai/api/v1/nanobanana/task/${taskId}`;
    console.log('\n1️⃣ Checking task status endpoint:', statusUrl);
    
    const response = await fetch(statusUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${nanoBananaApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    console.log('\n📊 Task Status Response:');
    console.log(JSON.stringify(data, null, 2));

    // Method 2: Try fetching result directly
    const resultUrl = `https://api.nanobananaapi.ai/api/v1/nanobanana/result/${taskId}`;
    console.log('\n2️⃣ Checking result endpoint:', resultUrl);
    
    const resultResponse = await fetch(resultUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${nanoBananaApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const resultData = await resultResponse.json();
    console.log('\n📊 Result Response:');
    console.log(JSON.stringify(resultData, null, 2));

    // Method 3: Check account status
    console.log('\n3️⃣ Checking account/credits...');
    const accountUrl = 'https://api.nanobananaapi.ai/api/v1/account/info';
    
    const accountResponse = await fetch(accountUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${nanoBananaApiKey}`,
        'Content-Type': 'application/json'
      }
    });

    const accountData = await accountResponse.json();
    console.log('\n💳 Account Info:');
    console.log(JSON.stringify(accountData, null, 2));

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Full error:', error);
  }
}

// Run check
checkTaskStatus();