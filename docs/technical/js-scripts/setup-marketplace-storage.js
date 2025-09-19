#!/usr/bin/env node

/**
 * Marketplace Storage Setup Script
 * Creates the 'listings' storage bucket and sets up proper RLS policies
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupMarketplaceStorage() {
  console.log('🚀 Setting up Marketplace Storage...\n');

  try {
    // 1. Create the listings bucket
    console.log('📦 Creating listings storage bucket...');
    
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('listings', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      fileSizeLimit: 10 * 1024 * 1024, // 10MB limit
    });

    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('✅ Listings bucket already exists');
      } else {
        console.error('❌ Failed to create listings bucket:', bucketError.message);
        return false;
      }
    } else {
      console.log('✅ Listings bucket created successfully');
    }

    // 2. Set up storage policies
    console.log('\n🔒 Setting up storage RLS policies...');
    
    const policies = [
      {
        name: 'listings_public_read',
        sql: `
          CREATE POLICY "listings_public_read" ON storage.objects
          FOR SELECT USING (
            bucket_id = 'listings' AND
            EXISTS (
              SELECT 1 FROM listings l
              WHERE l.id::text = (storage.foldername(name))[1]
              AND l.status = 'active'
            )
          );
        `
      },
      {
        name: 'listings_owner_write',
        sql: `
          CREATE POLICY "listings_owner_write" ON storage.objects
          FOR INSERT WITH CHECK (
            bucket_id = 'listings' AND
            EXISTS (
              SELECT 1 FROM listings l
              WHERE l.id::text = (storage.foldername(name))[1]
              AND l.owner_id = auth.uid()
            )
          );
        `
      },
      {
        name: 'listings_owner_update',
        sql: `
          CREATE POLICY "listings_owner_update" ON storage.objects
          FOR UPDATE USING (
            bucket_id = 'listings' AND
            EXISTS (
              SELECT 1 FROM listings l
              WHERE l.id::text = (storage.foldername(name))[1]
              AND l.owner_id = auth.uid()
            )
          );
        `
      },
      {
        name: 'listings_owner_delete',
        sql: `
          CREATE POLICY "listings_owner_delete" ON storage.objects
          FOR DELETE USING (
            bucket_id = 'listings' AND
            EXISTS (
              SELECT 1 FROM listings l
              WHERE l.id::text = (storage.foldername(name))[1]
              AND l.owner_id = auth.uid()
            )
          );
        `
      }
    ];

    for (const policy of policies) {
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: policy.sql });
        if (error) {
          if (error.message.includes('already exists')) {
            console.log(`✅ Policy ${policy.name} already exists`);
          } else {
            console.error(`❌ Failed to create policy ${policy.name}:`, error.message);
          }
        } else {
          console.log(`✅ Policy ${policy.name} created successfully`);
        }
      } catch (err) {
        console.error(`❌ Error creating policy ${policy.name}:`, err.message);
      }
    }

    // 3. Test the setup
    console.log('\n🧪 Testing storage setup...');
    
    // Test bucket access
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) {
      console.error('❌ Failed to list buckets:', bucketsError.message);
      return false;
    }

    const listingsBucket = buckets.find(bucket => bucket.name === 'listings');
    if (listingsBucket) {
      console.log('✅ Listings bucket is accessible');
      console.log(`   - Public: ${listingsBucket.public}`);
      console.log(`   - Created: ${listingsBucket.created_at}`);
    } else {
      console.error('❌ Listings bucket not found');
      return false;
    }

    // 4. Create sample folder structure documentation
    console.log('\n📁 Storage structure:');
    console.log('   listings/');
    console.log('   ├── {listing_id}/');
    console.log('   │   ├── image1.jpg');
    console.log('   │   ├── image2.jpg');
    console.log('   │   └── ...');
    console.log('   └── ...');

    console.log('\n✅ Marketplace storage setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Apply the database migration: supabase/migrations/092_marketplace_schema.sql');
    console.log('   2. Test the storage policies with a sample listing');
    console.log('   3. Begin Phase 2: API endpoint development');

    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Run the setup
setupMarketplaceStorage()
  .then(success => {
    if (success) {
      console.log('\n🎉 Marketplace storage is ready!');
      process.exit(0);
    } else {
      console.log('\n💥 Setup failed. Please check the errors above.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
