/**
 * Test Supabase Storage upload functionality
 */

require('dotenv').config({ path: './apps/web/.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testUpload() {
  try {
    // Test 1: List buckets
    console.log('1. Listing buckets...')
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }
    
    console.log('Available buckets:', buckets.map(b => b.name))
    
    // Test 2: Check if moodboard-images exists
    const hasMoodboardBucket = buckets.some(b => b.name === 'moodboard-images')
    console.log('Has moodboard-images bucket:', hasMoodboardBucket)
    
    if (!hasMoodboardBucket) {
      console.log('Creating moodboard-images bucket...')
      const { data, error } = await supabase.storage.createBucket('moodboard-images', {
        public: true,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp']
      })
      
      if (error) {
        console.error('Error creating bucket:', error)
        return
      }
      console.log('Bucket created successfully')
    }
    
    // Test 3: Upload a test image
    console.log('\n2. Testing image upload...')
    
    // Create a simple test image buffer (1x1 red pixel)
    const testImageHex = 'ffd8ffe000104a46494600010100000100010000ffdb004300080606070605080707070909080a0c140d0c0b0b0c1912130f141d1a1f1e1d1a1c1c20242e2720222c231c1c2837292c30313434341f27393d38323c2e333432ffdb0043010909090c0b0c180d0d1832211c213232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232323232ffc00011080001000103012200021101031101ffc4001f0000010501010101010100000000000000000102030405060708090a0bffc400b5100002010303020403050504040000017d01020300041105122131410613516107227114328191a1082342b1c11552d1f02433627282090a161718191a25262728292a3435363738393a434445464748494a535455565758595a636465666768696a737475767778797a838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae1e2e3e4e5e6e7e8e9eaf1f2f3f4f5f6f7f8f9faffc4001f0100030101010101010101010000000000000102030405060708090a0bffc400b51100020102040403040705040400010277000102031104052131061241510761711322328108144291a1b1c109233352f0156272d10a162434e125f11718191a262728292a35363738393a434445464748494a535455565758595a636465666768696a737475767778797a82838485868788898a92939495969798999aa2a3a4a5a6a7a8a9aab2b3b4b5b6b7b8b9bac2c3c4c5c6c7c8c9cad2d3d4d5d6d7d8d9dae2e3e4e5e6e7e8e9eaf2f3f4f5f6f7f8f9faffda000c03010002110311003f00f8ff00ffd9'
    const testImageBuffer = Buffer.from(testImageHex, 'hex')
    
    const fileName = `test_${Date.now()}.jpg`
    console.log('Uploading test file:', fileName)
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('moodboard-images')
      .upload(fileName, testImageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      })
    
    if (uploadError) {
      console.error('Upload error:', uploadError)
      console.error('Error details:', JSON.stringify(uploadError, null, 2))
      return
    }
    
    console.log('✅ Upload successful:', uploadData)
    
    // Test 4: Get public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('moodboard-images')
      .getPublicUrl(fileName)
    
    console.log('✅ Public URL:', publicUrl)
    
    // Test 5: List files in bucket
    console.log('\n3. Listing files in bucket...')
    const { data: files, error: listFilesError } = await supabase
      .storage
      .from('moodboard-images')
      .list()
    
    if (listFilesError) {
      console.error('Error listing files:', listFilesError)
    } else {
      console.log('Files in bucket:', files.length)
      if (files.length > 0) {
        console.log('Sample files:', files.slice(0, 5).map(f => f.name))
      }
    }
    
    // Test 6: Delete test file
    console.log('\n4. Cleaning up test file...')
    const { error: deleteError } = await supabase
      .storage
      .from('moodboard-images')
      .remove([fileName])
    
    if (deleteError) {
      console.error('Error deleting test file:', deleteError)
    } else {
      console.log('✅ Test file deleted')
    }
    
    console.log('\n✅ All tests completed successfully!')
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

testUpload()