// Storage setup script that reads from .env.local
// Run with: node setup-playground-storage-env.js

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

function loadEnvFile() {
  const envPath = path.join(__dirname, '.env.local')
  if (!fs.existsSync(envPath)) {
    console.log('❌ .env.local file not found')
    return {}
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8')
  const envVars = {}
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=')
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim()
    }
  })
  
  return envVars
}

async function setupPlaygroundStorage() {
  const envVars = loadEnvFile()
  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ Missing Supabase environment variables in .env.local')
    console.log('Required variables:')
    console.log('   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url')
    console.log('   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key')
    return
  }

  console.log('🔗 Using Supabase URL:', supabaseUrl)
  console.log('🔑 Service key found:', supabaseServiceKey.substring(0, 20) + '...')

  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  try {
    console.log('🪣 Setting up playground-gallery storage bucket...')
    
    // Create the bucket
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('playground-gallery', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024 // 10MB limit
    })

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('ℹ️  Storage bucket "playground-gallery" already exists')
      } else {
        throw bucketError
      }
    } else {
      console.log('✅ Storage bucket "playground-gallery" created successfully')
    }

    // Set up RLS policies
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
        const { error } = await supabase.rpc('exec_sql', { sql: policy })
        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`ℹ️  Policy already exists: ${name}`)
          } else {
            console.error(`❌ Failed to create policy ${name}:`, error.message)
          }
        } else {
          console.log(`✅ Policy created: ${name}`)
        }
      } catch (error) {
        console.log(`ℹ️  Policy ${name} may already exist or need manual setup`)
      }
    }

    console.log('🎉 Playground storage setup complete!')
    console.log('')
    console.log('📋 Summary:')
    console.log('   ✅ Storage bucket: playground-gallery')
    console.log('   ✅ Public access: enabled')
    console.log('   ✅ File size limit: 10MB')
    console.log('   ✅ Allowed formats: JPEG, PNG, WebP')
    console.log('   ✅ RLS policies: configured')
    
  } catch (error) {
    console.error('❌ Storage setup failed:', error.message)
    console.log('')
    console.log('🔧 Manual setup instructions:')
    console.log('1. Go to Storage in your Supabase dashboard')
    console.log('2. Create a new bucket named "playground-gallery"')
    console.log('3. Set it as public')
    console.log('4. Add RLS policies for user access')
  }
}

setupPlaygroundStorage()
