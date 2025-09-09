// Test what callback URL we're actually using in production

const callbackUrls = [
  'https://preset-51brxeczd-jewwiids-projects.vercel.app/api/nanobanana/callback',
  'https://preset-pearl-two.vercel.app/api/nanobanana/callback',
  'https://preset.vercel.app/api/nanobanana/callback'
];

console.log('Testing callback URLs accessibility...\n');

async function testUrl(url) {
  try {
    console.log(`Testing: ${url}`);
    const response = await fetch(url, {
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
    
    console.log(`  Status: ${response.status}`);
    const text = await response.text();
    
    // Check if it's HTML (authentication page) or JSON (our API)
    if (text.includes('<!doctype html>')) {
      console.log('  ❌ Behind authentication - NanoBanana cannot access this');
    } else {
      try {
        const data = JSON.parse(text);
        console.log('  ✅ Accessible - Response:', data);
      } catch {
        console.log('  Response:', text.substring(0, 100));
      }
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
  }
  console.log('');
}

// Test all URLs
(async () => {
  for (const url of callbackUrls) {
    await testUrl(url);
  }
  
  console.log('\n📝 Summary:');
  console.log('If all URLs are behind authentication, NanoBanana cannot send callbacks.');
  console.log('Solutions:');
  console.log('1. Use Vercel protection bypass for the callback endpoint');
  console.log('2. Deploy callback handler as a Supabase Edge Function');
  console.log('3. Use a webhook service like webhook.site for testing');
})();