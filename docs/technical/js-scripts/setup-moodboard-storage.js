/**
 * Setup Supabase Storage bucket for moodboard images
 * This ensures enhanced images are stored permanently
 */

require('dotenv').config({ path: './apps/web/.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      return
    }
    
    const bucketExists = buckets?.some(b => b.name === 'moodboard-images')
    
    if (!bucketExists) {
      console.log('Creating moodboard-images bucket...')
      
      const { data, error } = await supabase.storage.createBucket('moodboard-images', {
        public: true, // Make bucket public so images can be accessed directly
        fileSizeLimit: 10485760, // 10MB limit
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
      
      if (error) {
        console.error('Error creating bucket:', error)
      } else {
        console.log('✅ Bucket created successfully')
      }
    } else {
      console.log('✅ Bucket already exists')
      
      // Update bucket to ensure it's public
      const { data, error } = await supabase.storage.updateBucket('moodboard-images', {
        public: true,
        fileSizeLimit: 10485760,
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      })
      
      if (error) {
        console.error('Error updating bucket:', error)
      } else {
        console.log('✅ Bucket settings updated')
      }
    }
    
    // Create RLS policies for the bucket (if using Supabase's bucket policies)
    console.log('\n📋 Storage bucket setup complete!')
    console.log('Enhanced images will now be stored permanently in Supabase.')
    
  } catch (error) {
    console.error('Setup error:', error)
  }
}

setupStorage()