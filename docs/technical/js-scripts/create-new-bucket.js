const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createNewBucket() {
  try {
    console.log('Creating new moodboard-media bucket...');
    
    // Create a new bucket with simpler settings
    const { data, error } = await supabase.storage.createBucket('moodboard-media', {
      public: true,
      fileSizeLimit: 52428800, // 50MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
    });
    
    if (error) {
      if (error.message.includes('already exists')) {
        console.log('Bucket already exists, updating settings...');
        
        // Update existing bucket
        const { data: updateData, error: updateError } = await supabase.storage.updateBucket('moodboard-media', {
          public: true,
          fileSizeLimit: 52428800,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm']
        });
        
        if (updateError) {
          console.error('Error updating bucket:', updateError);
        } else {
          console.log('✅ Bucket settings updated successfully!');
        }
      } else {
        console.error('Error creating bucket:', error);
      }
    } else {
      console.log('✅ New bucket created successfully!');
    }
    
    // Test the bucket
    console.log('\nTesting bucket access...');
    
    const { data: files, error: listError } = await supabase.storage
      .from('moodboard-media')
      .list('', { limit: 1 });
    
    if (listError) {
      console.error('❌ Error accessing bucket:', listError);
    } else {
      console.log('✅ Bucket is accessible!');
    }
    
    console.log('\n📝 Next steps:');
    console.log('1. Update MoodboardBuilder.tsx to use "moodboard-media" instead of "user-media"');
    console.log('2. Go to Supabase Dashboard → Storage → Policies');
    console.log('3. Add policies for the moodboard-media bucket as described in the README');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the creation
createNewBucket();