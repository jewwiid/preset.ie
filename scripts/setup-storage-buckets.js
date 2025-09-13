const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../apps/web/.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl)
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey)
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorageBuckets() {
  console.log('🚀 Setting up storage buckets...')
  
  try {
    // Check existing buckets
    console.log('📋 Checking existing buckets...')
    const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('❌ Failed to list buckets:', listError.message)
      process.exit(1)
    }
    
    console.log(`Found ${existingBuckets.length} existing buckets:`)
    existingBuckets.forEach(bucket => {
      console.log(`   - ${bucket.name} (${bucket.public ? 'public' : 'private'})`)
    })
    
    // Create avatars bucket if it doesn't exist
    const avatarsExists = existingBuckets.some(bucket => bucket.name === 'avatars')
    if (!avatarsExists) {
      console.log('📝 Creating avatars bucket...')
      const { error: avatarsError } = await supabase.storage.createBucket('avatars', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
      
      if (avatarsError) {
        console.error('❌ Failed to create avatars bucket:', avatarsError.message)
      } else {
        console.log('✅ Avatars bucket created successfully')
      }
    } else {
      console.log('✅ Avatars bucket already exists')
    }
    
    // Create moodboard-uploads bucket if it doesn't exist
    const moodboardExists = existingBuckets.some(bucket => bucket.name === 'moodboard-uploads')
    if (!moodboardExists) {
      console.log('📝 Creating moodboard-uploads bucket...')
      const { error: moodboardError } = await supabase.storage.createBucket('moodboard-uploads', {
        public: false,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
      
      if (moodboardError) {
        console.error('❌ Failed to create moodboard-uploads bucket:', moodboardError.message)
      } else {
        console.log('✅ Moodboard-uploads bucket created successfully')
      }
    } else {
      console.log('✅ Moodboard-uploads bucket already exists')
    }
    
    console.log('\n🎉 Storage bucket setup completed!')
    console.log('\n📋 Manual steps required:')
    console.log('1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/storage')
    console.log('2. Run the SQL from scripts/setup-storage-buckets.sql to create storage policies')
    console.log('3. Verify buckets are created and policies are applied')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupStorageBuckets()
