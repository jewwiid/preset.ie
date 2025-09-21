#!/usr/bin/env node

const fetch = require('node-fetch');
require('dotenv').config();

async function testApiCall() {
  console.log('🧪 Testing Playground API Call...\n');

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  // This simulates the exact request from the frontend
  const requestData = {
    prompt: "Apply photorealistic rendering with natural lighting and detailed textures",
    style: "photorealistic", 
    resolution: "1024",
    consistencyLevel: "high",
    numImages: 1,
    baseImage: "https://images.pexels.com/photos/33928028/pexels-photo-33928028.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    generationMode: "image-to-image",
    aspectRatio: "16:10"
  };

  // We need a real session token - let's try without auth first to see the error
  console.log('1️⃣ Testing without authentication...');
  try {
    const response = await fetch(`${baseUrl}/api/playground/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    });

    const responseText = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', responseText);
    
    if (!response.ok) {
      console.log('❌ Expected error without auth');
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }

  console.log('\n2️⃣ The actual error is likely happening server-side...');
  console.log('Check the Next.js server console for detailed error logs.');
  console.log('The "Failed to store generation task" error suggests:');
  console.log('1. Database insert is failing');
  console.log('2. Foreign key constraint issue');
  console.log('3. RLS policy blocking the insert');
  console.log('4. Missing required fields in the insert');

  console.log('\n3️⃣ Suggested debugging steps:');
  console.log('- Add more console.log statements in the API route');
  console.log('- Check the exact error details in the catch block');
  console.log('- Verify the user_id being passed to the database insert');
}

testApiCall().catch(console.error);
