#!/usr/bin/env node

// Simple test for Supabase Storage
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key for testing
const supabaseUrl = 'http://localhost:54321'
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'
const supabase = createClient(supabaseUrl, serviceRoleKey)

async function testStorage() {
  console.log('Testing Supabase Storage...\n')
  
  try {
    // Step 1: List buckets
    console.log('1. Listing storage buckets...')
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
    
    if (bucketsError) throw bucketsError
    console.log('✅ Buckets found:', buckets.map(b => b.name).join(', ') || 'None')
    
    // Step 2: Create test image data
    console.log('\n2. Creating test image data...')
    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )
    
    // Step 3: Upload test file
    console.log('\n3. Uploading test file to profile-photos bucket...')
    const testUserId = 'test-user-' + Date.now()
    const fileName = `${testUserId}/profile_test.png`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      throw uploadError
    }
    
    console.log('✅ File uploaded:', uploadData.path)
    
    // Step 4: Get public URL
    console.log('\n4. Getting public URL...')
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName)
    
    console.log('✅ Public URL:', publicUrl)
    
    // Step 5: List files in the bucket
    console.log('\n5. Listing files in profile-photos bucket...')
    const { data: files, error: listError } = await supabase.storage
      .from('profile-photos')
      .list(testUserId)
    
    if (listError) throw listError
    console.log('✅ Files found:', files.map(f => f.name).join(', '))
    
    // Step 6: Delete test file
    console.log('\n6. Cleaning up test file...')
    const { error: deleteError } = await supabase.storage
      .from('profile-photos')
      .remove([fileName])
    
    if (deleteError) {
      console.log('⚠️  Could not delete file:', deleteError.message)
    } else {
      console.log('✅ Test file deleted')
    }
    
    console.log('\n✅ Storage test completed successfully!')
    console.log('\nStorage is working properly:')
    console.log('- Can upload files')
    console.log('- Can generate public URLs')
    console.log('- Can list files')
    console.log('- Bucket "profile-photos" is configured')
    
  } catch (error) {
    console.error('\n❌ Storage test failed:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Run the test
testStorage()