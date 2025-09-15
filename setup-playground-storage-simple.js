// Simple storage setup script using existing Supabase client
// Run with: node setup-playground-storage-simple.js

const { createClient } = require('@supabase/supabase-js')

async function setupPlaygroundStorage() {
  // You'll need to set these environment variables or replace with your actual values
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'
  
  if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseServiceKey === 'YOUR_SERVICE_ROLE_KEY') {
    console.log('📝 Please set your environment variables:')
    console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
    console.log('')
    console.log('Or manually create the storage bucket in Supabase Dashboard:')
    console.log('1. Go to Storage in your Supabase dashboard')
    console.log('2. Create a new bucket named "playground-gallery"')
    console.log('3. Set it as public')
    console.log('4. Add RLS policies for user access')
    return
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🪣 Setting up playground-gallery storage bucket...')
    
    // Create the bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('playground-gallery', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
    })

    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError
    }

    console.log('✅ Storage bucket created successfully')
    console.log('🎉 Playground storage setup complete!')
    
  } catch (error) {
    console.error('❌ Storage setup failed:', error.message)
    console.log('')
    console.log('Manual setup instructions:')
    console.log('1. Go to Storage in your Supabase dashboard')
    console.log('2. Create a new bucket named "playground-gallery"')
    console.log('3. Set it as public')
    console.log('4. Add RLS policies for user access')
  }
}

setupPlaygroundStorage()
