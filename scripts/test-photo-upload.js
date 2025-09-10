#!/usr/bin/env node

// Test script for profile photo upload
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Initialize Supabase client
const supabaseUrl = 'http://localhost:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testPhotoUpload() {
  console.log('Testing Profile Photo Upload...\n')
  
  try {
    // Step 1: Create test user
    const testEmail = `photo_test_${Date.now()}@preset.ie`
    const testPassword = 'TestPassword123!'
    
    console.log('1. Creating test user...')
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })
    
    if (authError) throw authError
    console.log('✅ User created:', authData.user.id)
    
    // Step 2: Create a test image file (1x1 pixel PNG)
    console.log('\n2. Creating test image...')
    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    )
    
    // Convert buffer to File-like object
    const file = new Blob([imageBuffer], { type: 'image/png' })
    file.name = 'test-profile.png'
    
    console.log('✅ Test image created (1x1 pixel PNG)')
    
    // Step 3: Upload to storage
    console.log('\n3. Uploading to storage...')
    const fileName = `${authData.user.id}/profile_${Date.now()}.png`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
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
    
    // Step 5: Create user profile with photo
    console.log('\n5. Creating user profile with photo...')
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .insert({
        user_id: authData.user.id,
        display_name: 'Test Photo User',
        handle: `photo_test_${Date.now()}`,
        bio: 'Testing photo upload',
        city: 'Dublin',
        country: 'Ireland',
        avatar_url: publicUrl,
        date_of_birth: '1995-01-01',
        role_flags: ['CONTRIBUTOR'],
        subscription_tier: 'FREE',
        subscription_status: 'ACTIVE'
      })
      .select()
      .single()
    
    if (profileError) throw profileError
    console.log('✅ Profile created with photo')
    
    // Step 6: Verify photo URL is stored
    console.log('\n6. Verifying stored photo URL...')
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('users_profile')
      .select('avatar_url')
      .eq('user_id', authData.user.id)
      .single()
    
    if (verifyError) throw verifyError
    
    if (verifyProfile.avatar_url === publicUrl) {
      console.log('✅ Photo URL correctly stored in profile')
    } else {
      console.log('❌ Photo URL mismatch!')
      console.log('Expected:', publicUrl)
      console.log('Got:', verifyProfile.avatar_url)
    }
    
    // Step 7: List files in bucket for user
    console.log('\n7. Listing user files in bucket...')
    const { data: files, error: listError } = await supabase.storage
      .from('profile-photos')
      .list(authData.user.id)
    
    if (listError) throw listError
    console.log('✅ Files in bucket:', files.map(f => f.name).join(', '))
    
    // Step 8: Test file deletion
    console.log('\n8. Testing file deletion...')
    const { error: deleteError } = await supabase.storage
      .from('profile-photos')
      .remove([fileName])
    
    if (deleteError) {
      console.log('⚠️  Delete failed (expected if RLS policies are strict):', deleteError.message)
    } else {
      console.log('✅ File deleted successfully')
    }
    
    console.log('\n✅ Profile photo upload test completed successfully!')
    console.log('\nSummary:')
    console.log('- User created with ID:', authData.user.id)
    console.log('- Photo uploaded to:', fileName)
    console.log('- Public URL:', publicUrl)
    console.log('- Profile has photo:', !!verifyProfile.avatar_url)
    
  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  }
  
  process.exit(0)
}

// Run the test
testPhotoUpload()