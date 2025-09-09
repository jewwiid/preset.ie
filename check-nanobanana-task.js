const fetch = require('node-fetch');
require('dotenv').config();

const taskId = 'a1955c96ecd5573580bf32ceb35d7616';
const nanoBananaApiKey = process.env.NANOBANANA_API_KEY || process.env.NANOBANAN_API_KEY;

async function checkTaskStatus() {
  console.log('Checking NanoBanana task status...');
  console.log('Task ID:', taskId);
  console.log('API Key:', nanoBananaApiKey ? `${nanoBananaApiKey.substring(0, 8)}...` : 'NOT FOUND');
  
  if (!nanoBananaApiKey) {
    console.error('❌ NanoBanana API key not found in environment variables');
    return;
  }

  try {
    // Check task status
    const statusUrl = `https://api.nanobananaapi.ai/api/v1/nanobanana/task/${taskId}`;
    console.log('\nFetching from:', statusUrl);
    
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

    if (data.code === 200 && data.data) {
      const task = data.data;
      console.log('\n📝 Task Details:');
      console.log('- Status:', task.status);
      console.log('- Created:', task.createdAt);
      console.log('- Type:', task.type);
      
      if (task.status === 'FAILED') {
        console.log('\n❌ Task Failed!');
        console.log('Error Message:', task.errorMessage || 'No error message provided');
        
        // Common failure reasons
        console.log('\n🔍 Possible failure reasons:');
        console.log('1. Image URL not accessible by NanoBanana servers');
        console.log('2. Image format not supported (needs JPEG, PNG, WebP)');
        console.log('3. Image too large (>10MB)');
        console.log('4. Invalid prompt or parameters');
        console.log('5. NanoBanana service temporarily unavailable');
        console.log('6. Insufficient credits in NanoBanana account');
      } else if (task.status === 'SUCCESS' || task.status === 'COMPLETED') {
        console.log('\n✅ Task Completed Successfully!');
        console.log('Result URL:', task.resultUrl || task.imageUrl);
      } else if (task.status === 'PROCESSING' || task.status === 'PENDING') {
        console.log('\n⏳ Task still processing...');
        console.log('Please wait and check again in a few seconds');
      }
      
      if (task.imageUrls && task.imageUrls.length > 0) {
        console.log('\n📸 Input Images:');
        task.imageUrls.forEach((url, i) => {
          console.log(`  ${i + 1}. ${url}`);
        });
      }
      
      if (task.prompt) {
        console.log('\n💬 Prompt:', task.prompt);
      }
    } else {
      console.log('\n⚠️ Unexpected response structure');
      if (data.msg) {
        console.log('Message:', data.msg);
      }
    }

    // Also check our database for this task
    console.log('\n📦 Checking database record...');
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: dbTask, error: dbError } = await supabase
      .from('enhancement_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (dbTask) {
      console.log('\nDatabase Record:');
      console.log('- Status:', dbTask.status);
      console.log('- Input URL:', dbTask.input_image_url);
      console.log('- Enhancement Type:', dbTask.enhancement_type);
      console.log('- Prompt:', dbTask.prompt);
      console.log('- Error:', dbTask.error_message);
      console.log('- Created:', dbTask.created_at);
    } else if (dbError) {
      console.log('No database record found or error:', dbError.message);
    }

  } catch (error) {
    console.error('\n❌ Error checking task:', error.message);
    console.error('Full error:', error);
  }
}

// Also test if we can access a sample image URL
async function testImageAccess() {
  console.log('\n🔗 Testing image URL accessibility...');
  
  // Test a known working image
  const testUrl = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400';
  
  try {
    const response = await fetch(testUrl, { method: 'HEAD' });
    if (response.ok) {
      console.log('✅ Test image is accessible');
      console.log('- Status:', response.status);
      console.log('- Content-Type:', response.headers.get('content-type'));
      console.log('- Content-Length:', response.headers.get('content-length'));
    } else {
      console.log('❌ Test image not accessible:', response.status);
    }
  } catch (error) {
    console.log('❌ Could not access test image:', error.message);
  }
}

// Run checks
checkTaskStatus().then(() => testImageAccess());