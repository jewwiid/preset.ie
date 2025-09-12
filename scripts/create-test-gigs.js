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

async function createTestGigs() {
  console.log('🎬 Creating test gigs...\n');

  try {
    // First, get or create a contributor user
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const adminUser = users.find(u => u.email === 'admin@preset.ie');
    
    if (!adminUser) {
      console.error('Admin user not found. Please create admin user first.');
      return;
    }

    const userId = adminUser.id;
    console.log('Using admin user:', userId);

    // Check if profile exists
    const { data: profile } = await supabase
      .from('users_profile')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      console.error('Admin profile not found');
      return;
    }

    console.log('Found profile:', profile.display_name);

    // Test gigs data
    const testGigs = [
      {
        owner_user_id: profile.id,
        title: 'Fashion Editorial Shoot in Dublin',
        description: 'Looking for models for a high-fashion editorial shoot in Dublin city center. We need both male and female models with editorial experience.',
        comp_type: 'PAID',
        comp_details: '€250 per day + travel expenses',
        location_text: 'Dublin, Ireland',
        radius_meters: 5000,
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(), // 4 hours later
        application_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
        max_applicants: 10,
        usage_rights: 'Editorial use only, no commercial use',
        safety_notes: 'Professional studio environment with full crew',
        status: 'PUBLISHED',
        boost_level: 1
      },
      {
        owner_user_id: profile.id,
        title: 'Street Photography Project - Cork',
        description: 'Creative street photography project exploring urban life in Cork. Looking for authentic individuals comfortable with candid photography.',
        comp_type: 'TFP',
        comp_details: 'Trade for portfolio - all participants receive edited images',
        location_text: 'Cork, Ireland',
        // location_lat: 51.8985,
        // location_lng: -8.4756,
        radius_meters: 3000,
        start_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
        end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(), // 3 hours later
        application_deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days from now
        max_applicants: 5,
        usage_rights: 'Portfolio and social media use with credit',
        safety_notes: 'Public locations, assistant will be present',
        status: 'PUBLISHED',
        boost_level: 0
      },
      {
        owner_user_id: profile.id,
        title: 'Music Video Production - Galway',
        description: 'Shooting a music video for an up-and-coming indie band. Need dancers and extras for various scenes.',
        comp_type: 'PAID',
        comp_details: '€150 per day',
        location_text: 'Galway, Ireland',
        // location_lat: 53.2707,
        // location_lng: -9.0568,
        radius_meters: 10000,
        start_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days from now
        end_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000).toISOString(), // 8 hours later
        application_deadline: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days from now
        max_applicants: 20,
        usage_rights: 'Full usage rights for music video and promotional materials',
        safety_notes: 'Professional film set with safety coordinator',
        status: 'PUBLISHED',
        boost_level: 2
      },
      {
        owner_user_id: profile.id,
        title: 'Portrait Session - Natural Light',
        description: 'Looking for individuals interested in natural light portrait photography. Perfect for updating your professional headshots or social media profiles.',
        comp_type: 'EXPENSES',
        comp_details: 'Travel expenses covered within Dublin area',
        location_text: 'Phoenix Park, Dublin',
        // location_lat: 53.3559,
        // location_lng: -6.3298,
        radius_meters: 2000,
        start_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
        end_time: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(), // 2 hours later
        application_deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        max_applicants: 3,
        usage_rights: 'Portfolio use only',
        safety_notes: 'Outdoor public location, daytime shoot',
        status: 'PUBLISHED',
        boost_level: 0
      }
    ];

    // Insert test gigs
    console.log('\nCreating gigs...');
    for (const gig of testGigs) {
      const { data, error } = await supabase
        .from('gigs')
        .insert(gig)
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating gig "${gig.title}":`, error.message);
      } else {
        console.log(`✅ Created gig: "${data.title}"`);
        
        // Create a moodboard for each gig
        const { error: moodboardError } = await supabase
          .from('moodboards')
          .insert({
            gig_id: data.id,
            owner_user_id: profile.id,
            title: `Moodboard for ${data.title}`,
            summary: `Visual inspiration for ${data.title}`,
            palette: JSON.stringify(['#10B981', '#3B82F6', '#8B5CF6']),
            items: JSON.stringify([
              { type: 'image', url: 'https://source.unsplash.com/random/400x300?fashion', caption: 'Style reference' },
              { type: 'image', url: 'https://source.unsplash.com/random/400x300?portrait', caption: 'Mood reference' }
            ])
          });

        if (moodboardError) {
          console.error(`  ⚠️ Could not create moodboard:`, moodboardError.message);
        } else {
          console.log(`  📸 Created moodboard`);
        }
      }
    }

    // Check how many gigs were created
    const { count } = await supabase
      .from('gigs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PUBLISHED');

    console.log('\n' + '='.repeat(50));
    console.log(`✅ Test gigs creation complete!`);
    console.log(`📊 Total published gigs in database: ${count}`);
    console.log('='.repeat(50));
    console.log('\n🎯 You can now browse gigs at: http://localhost:3000/gigs');

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

createTestGigs();