import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'http://127.0.0.1:54321'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU'

const supabase = createClient(supabaseUrl, supabaseKey)

async function testStorage() {
  console.log('Testing storage setup...')
  
  try {
    // List storage buckets
    console.log('1. Listing storage buckets...')
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets()
    
    if (bucketError) {
      console.error('Bucket list error:', bucketError)
    } else {
      console.log('Available buckets:', buckets.map(b => b.name))
    }
    
    // Check if profile-photos bucket exists
    const profilePhotoBucket = buckets?.find(b => b.id === 'profile-photos')
    if (profilePhotoBucket) {
      console.log('✓ profile-photos bucket exists')
      console.log('Bucket details:', profilePhotoBucket)
    } else {
      console.log('✗ profile-photos bucket not found')
      
      // Try to create the bucket
      console.log('2. Creating profile-photos bucket...')
      const { data: newBucket, error: createError } = await supabase
        .storage
        .createBucket('profile-photos', {
          public: true,
          allowedMimeTypes: ['image/*']
        })
      
      if (createError) {
        console.error('Failed to create bucket:', createError)
      } else {
        console.log('✓ Created profile-photos bucket:', newBucket)
      }
    }
    
    // Test file upload with image
    console.log('3. Testing image file upload...')
    // Create a simple test image (1x1 PNG)
    const testImageData = new Uint8Array([
      0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
      0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
      0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
      0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
      0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
      0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
      0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
      0x42, 0x60, 0x82
    ])
    const testFile = new Blob([testImageData], { type: 'image/png' })
    const testPath = 'test-user-123/test-avatar.png'
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('profile-photos')
      .upload(testPath, testFile, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
    } else {
      console.log('✓ Test upload successful:', uploadData)
      
      // Clean up test file
      const { error: deleteError } = await supabase
        .storage
        .from('profile-photos')
        .remove([testPath])
        
      if (!deleteError) {
        console.log('✓ Test cleanup successful')
      }
    }
    
  } catch (error) {
    console.error('Storage test failed:', error)
  }
}

testStorage()