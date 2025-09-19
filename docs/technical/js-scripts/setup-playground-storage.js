// Setup script for playground storage bucket
// Run with: node setup-playground-storage.js

const { createClient } = require('@supabase/supabase-js')

async function setupPlaygroundStorage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables')
    console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
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

    // Set up RLS policies for the bucket
    console.log('🔒 Setting up storage policies...')
    
    const policies = [
      {
        name: 'Users can upload to their own folder',
        policy: `
          CREATE POLICY "Users can upload to own folder" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'playground-gallery' AND
            auth.uid()::text = (storage.foldername(name))[1]
          )
        `
      },
      {
        name: 'Users can view their own images',
        policy: `
          CREATE POLICY "Users can view own images" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'playground-gallery' AND
            auth.uid()::text = (storage.foldername(name))[1]
          )
        `
      },
      {
        name: 'Users can delete their own images',
        policy: `
          CREATE POLICY "Users can delete own images" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'playground-gallery' AND
            auth.uid()::text = (storage.foldername(name))[1]
          )
        `
      }
    ]

    for (const { name, policy } of policies) {
      try {
        await supabase.rpc('exec_sql', { sql: policy })
        console.log(`✅ Policy created: ${name}`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️  Policy already exists: ${name}`)
        } else {
          console.error(`❌ Failed to create policy ${name}:`, error.message)
        }
      }
    }

    console.log('🎉 Playground storage setup complete!')
    
  } catch (error) {
    console.error('❌ Storage setup failed:', error.message)
  }
}

setupPlaygroundStorage()
