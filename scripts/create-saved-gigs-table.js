#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createSavedGigsTable() {
  console.log('📚 Creating saved_gigs table...\n');

  try {
    // Test if table exists by trying to query it
    const { error: testError } = await supabase
      .from('saved_gigs')
      .select('id')
      .limit(1);

    if (!testError) {
      console.log('✅ saved_gigs table already exists!');
      
      // Get count of saved gigs
      const { count } = await supabase
        .from('saved_gigs')
        .select('*', { count: 'exact', head: true });
      
      console.log(`📊 Current saved gigs count: ${count || 0}`);
      return;
    }

    console.log('❌ Table does not exist. Error:', testError.message);
    console.log('\n📝 To create the table, please run the following SQL in your Supabase Dashboard SQL Editor:\n');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the migration from: supabase/migrations/025_saved_gigs.sql');
    console.log('4. Execute the query\n');
    
    // Show a snippet of the migration
    console.log('Migration preview:');
    console.log('------------------');
    console.log(`
CREATE TABLE IF NOT EXISTS saved_gigs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  gig_id UUID NOT NULL REFERENCES gigs(id) ON DELETE CASCADE,
  saved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, gig_id)
);

-- Plus indexes and RLS policies...
    `);

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Test saving a gig (if table exists)
async function testSaveGig() {
  try {
    // Get a user and a gig to test with
    const { data: users } = await supabase
      .from('users_profile')
      .select('user_id')
      .limit(1);

    const { data: gigs } = await supabase
      .from('gigs')
      .select('id')
      .eq('status', 'PUBLISHED')
      .limit(1);

    if (users?.[0] && gigs?.[0]) {
      // Try to save the gig
      const { data, error } = await supabase
        .from('saved_gigs')
        .upsert({
          user_id: users[0].user_id,
          gig_id: gigs[0].id
        }, {
          onConflict: 'user_id,gig_id'
        })
        .select();

      if (error) {
        console.log('\n❌ Test save failed:', error.message);
      } else {
        console.log('\n✅ Test save successful!');
        console.log('Saved gig:', data);
      }
    }
  } catch (error) {
    // Table might not exist yet
  }
}

createSavedGigsTable().then(() => testSaveGig());