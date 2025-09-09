const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false
  }
});

async function executeStoragePolicies() {
  console.log('Executing storage policy fixes...\n');

  try {
    // First, check and update bucket settings
    console.log('1. Checking bucket configuration...');
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
      console.log('✅ Bucket created successfully');
    } else {
      console.log('Bucket exists, updating to ensure it\'s public...');
      const { data, error } = await supabase.storage.updateBucket('user-media', {
        public: true,
        fileSizeLimit: 52428800, // 50MB
        allowedMimeTypes: ['image/*', 'video/*']
      });
      
      if (error && !error.message.includes('already exists')) {
        console.error('Error updating bucket:', error);
      } else {
        console.log('✅ Bucket settings updated');
      }
    }

    // Test by creating a simple test file
    console.log('\n2. Testing upload capability...');
    const testFileName = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file for storage policies';
    
    // Skip anon client test if key not available
    
    const { data: uploadTest, error: uploadError } = await supabase.storage
      .from('user-media')
      .upload(testFileName, testContent, {
        contentType: 'text/plain',
        upsert: true
      });

    if (uploadError) {
      console.log('❌ Upload test failed:', uploadError.message);
      console.log('\n⚠️  Storage policies need to be configured manually.');
    } else {
      console.log('✅ Upload test successful');
      
      // Clean up test file
      await supabase.storage
        .from('user-media')
        .remove([testFileName]);
    }

    // Check if we can list files
    const { data: files, error: listError } = await supabase.storage
      .from('user-media')
      .list('', { limit: 1 });
    
    if (listError) {
      console.log('❌ Cannot list files:', listError.message);
    } else {
      console.log('✅ Can list files in bucket');
    }

    console.log('\n📝 IMPORTANT: Storage RLS Policies Configuration');
    console.log('================================================');
    console.log('Since we cannot directly modify RLS policies via the SDK,');
    console.log('please follow these steps in your Supabase Dashboard:\n');
    
    console.log('1. Go to: https://supabase.com/dashboard/project/zbsmgymyfhnwjdnmlelr/storage/policies');
    console.log('2. Click on "New Policy" for the storage.objects table');
    console.log('3. Create these 4 policies:\n');
    
    console.log('POLICY 1 - Upload:');
    console.log('  Name: "Authenticated users can upload to user-media"');
    console.log('  Policy: INSERT');
    console.log('  Target roles: authenticated');
    console.log('  WITH CHECK: bucket_id = \'user-media\'');
    console.log('');
    
    console.log('POLICY 2 - View:');
    console.log('  Name: "Anyone can view user-media files"');
    console.log('  Policy: SELECT');
    console.log('  Target roles: public');
    console.log('  USING: bucket_id = \'user-media\'');
    console.log('');
    
    console.log('POLICY 3 - Update:');
    console.log('  Name: "Users can update own files"');
    console.log('  Policy: UPDATE');
    console.log('  Target roles: authenticated');
    console.log('  USING: bucket_id = \'user-media\' AND auth.uid()::text = owner::text');
    console.log('');
    
    console.log('POLICY 4 - Delete:');
    console.log('  Name: "Users can delete own files"');
    console.log('  Policy: DELETE');
    console.log('  Target roles: authenticated');
    console.log('  USING: bucket_id = \'user-media\' AND auth.uid()::text = owner::text');
    console.log('');
    
    console.log('After creating these policies, users should be able to upload files.');
    
    // Alternative: Create migration file
    console.log('\n📄 Alternative: SQL Migration File Created');
    console.log('==========================================');
    console.log('A migration file has been created at: supabase/migrations/010_fix_storage_policies.sql');
    console.log('You can apply it by running: supabase db push --include-all');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Create migration file
const fs = require('fs');
const migrationSQL = `-- Fix storage policies for user-media bucket
-- Generated on ${new Date().toISOString()}

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DO $$ 
BEGIN
    -- Drop policies if they exist
    DROP POLICY IF EXISTS "Auth users can upload to user-media" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view user-media files" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own files in user-media" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own files in user-media" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload to user-media" ON storage.objects;
    DROP POLICY IF EXISTS "Authenticated users can upload media" ON storage.objects;
    DROP POLICY IF EXISTS "Anyone can view user-media" ON storage.objects;
    DROP POLICY IF EXISTS "Users can update own media" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete own media" ON storage.objects;
EXCEPTION
    WHEN undefined_object THEN null;
END $$;

-- Create new comprehensive policies
CREATE POLICY "Auth users can upload to user-media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'user-media');

CREATE POLICY "Anyone can view user-media files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'user-media');

CREATE POLICY "Users can update own files in user-media"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'user-media' AND auth.uid()::text = owner::text)
WITH CHECK (bucket_id = 'user-media');

CREATE POLICY "Users can delete own files in user-media"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'user-media' AND auth.uid()::text = owner::text);

-- Ensure bucket is public
UPDATE storage.buckets 
SET public = true 
WHERE name = 'user-media';
`;

// Create migrations directory if it doesn't exist
const migrationsDir = 'supabase/migrations';
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Write migration file
const migrationFile = `${migrationsDir}/010_fix_storage_policies.sql`;
fs.writeFileSync(migrationFile, migrationSQL);
console.log(`\nMigration file created: ${migrationFile}`);

// Run the setup
executeStoragePolicies();