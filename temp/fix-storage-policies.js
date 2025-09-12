const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixStoragePolicies() {
  try {
    console.log('Fixing storage policies for user-media bucket...');
    
    // First, check if bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const userMediaBucket = buckets.find(b => b.name === 'user-media');
    
    if (!userMediaBucket) {
      console.log('Creating user-media bucket...');
      const { data, error } = await supabase.storage.createBucket('user-media', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*', 'video/*']
      });
      
      if (error) {
        console.error('Error creating bucket:', error);
        return;
      }
      console.log('Bucket created successfully');
    } else {
      console.log('Bucket already exists');
      
      // Update bucket to be public
      const { data, error } = await supabase.storage.updateBucket('user-media', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*', 'video/*']
      });
      
      if (error) {
        console.error('Error updating bucket:', error);
      } else {
        console.log('Bucket updated to be public');
      }
    }
    
    // Now fix RLS policies using raw SQL
    console.log('\nSetting up RLS policies...');
    
    // Drop existing policies
    const dropPolicies = `
      DROP POLICY IF EXISTS "Users can upload their own media" ON storage.objects;
      DROP POLICY IF EXISTS "Users can view their own media" ON storage.objects;
      DROP POLICY IF EXISTS "Public can view media" ON storage.objects;
      DROP POLICY IF EXISTS "Users can update their own media" ON storage.objects;
      DROP POLICY IF EXISTS "Users can delete their own media" ON storage.objects;
      DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON storage.objects;
      DROP POLICY IF EXISTS "Enable read access for all users" ON storage.objects;
      DROP POLICY IF EXISTS "Enable update for users based on user_id" ON storage.objects;
      DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON storage.objects;
    `;
    
    const { error: dropError } = await supabase.rpc('exec_sql', { 
      sql: dropPolicies 
    }).catch(err => {
      // If exec_sql doesn't exist, try direct approach
      console.log('exec_sql not available, policies might need manual update');
      return { error: err };
    });
    
    if (dropError) {
      console.log('Could not drop old policies (might not exist):', dropError.message);
    }
    
    // Create new policies
    const createPolicies = `
      -- Enable RLS
      ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
      
      -- Policy for authenticated users to upload to user-media bucket
      CREATE POLICY "Authenticated users can upload media"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'user-media');
      
      -- Policy for anyone to view files in user-media bucket (since it's public)
      CREATE POLICY "Anyone can view user-media"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'user-media');
      
      -- Policy for users to update their own files
      CREATE POLICY "Users can update own media"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (bucket_id = 'user-media' AND auth.uid()::text = owner::text);
      
      -- Policy for users to delete their own files
      CREATE POLICY "Users can delete own media"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'user-media' AND auth.uid()::text = owner::text);
    `;
    
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: createPolicies 
    }).catch(err => {
      console.log('exec_sql not available, trying alternative approach...');
      return { error: err };
    });
    
    if (createError) {
      console.log('Could not create policies via exec_sql');
      console.log('\nPlease run the following SQL in your Supabase SQL editor:');
      console.log('----------------------------------------');
      console.log(dropPolicies);
      console.log(createPolicies);
      console.log('----------------------------------------');
    } else {
      console.log('✅ Storage policies created successfully!');
    }
    
    // Test the policies
    console.log('\nTesting storage access...');
    
    // Try to list files (should work)
    const { data: files, error: listError } = await supabase.storage
      .from('user-media')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error('❌ Error listing files:', listError);
    } else {
      console.log('✅ Can list files in bucket');
    }
    
    console.log('\nStorage setup complete!');
    console.log('Note: Users must be authenticated to upload files.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the fix
fixStoragePolicies();