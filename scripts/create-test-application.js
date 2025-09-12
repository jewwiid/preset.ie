#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestApplication() {
  console.log('📋 Creating test application...\n');

  try {
    // Get admin user profile
    const { data: adminProfile } = await supabase
      .from('users_profile')
      .select('*')
      .eq('display_name', 'Admin User')
      .single();
    
    if (!adminProfile) {
      console.error('Admin profile not found');
      return;
    }

    console.log('Found admin profile:', adminProfile.display_name);

    // Get a gig to apply to
    const { data: gigs } = await supabase
      .from('gigs')
      .select('*')
      .eq('status', 'PUBLISHED')
      .limit(1);
    
    if (!gigs || gigs.length === 0) {
      console.error('No published gigs found');
      return;
    }

    const gig = gigs[0];
    console.log('Applying to gig:', gig.title);

    // Check if application already exists
    const { data: existingApp } = await supabase
      .from('applications')
      .select('*')
      .eq('gig_id', gig.id)
      .eq('applicant_user_id', adminProfile.id)
      .single();

    if (existingApp) {
      console.log('✅ Application already exists for this gig');
      return;
    }

    // Create test application
    const { data: application, error } = await supabase
      .from('applications')
      .insert({
        gig_id: gig.id,
        applicant_user_id: adminProfile.id,
        note: 'I am very interested in this opportunity! I have extensive experience in creative projects and would love to collaborate.',
        status: 'PENDING'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Error creating application:', error);
      return;
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ Test application created successfully!');
    console.log('='.repeat(50));
    console.log('\n📊 Application Details:');
    console.log('  - Gig:', gig.title);
    console.log('  - Applicant:', adminProfile.display_name);
    console.log('  - Status:', application.status);
    console.log('\n🔗 View at: http://localhost:3000/applications');
    
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestApplication();