const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectDatabase() {
  console.log('🔍 Inspecting Database State...\n');

  try {
    // 1. Check if gigs table exists and get its structure
    console.log('📋 Checking gigs table structure...');
    const { data: gigColumns, error: gigError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'gigs')
      .eq('table_schema', 'public');

    if (gigError) {
      console.error('Error fetching gigs table structure:', gigError);
    } else {
      console.log('Gigs table columns:');
      gigColumns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    }

    // 2. Check sample gigs data
    console.log('\n📊 Sample gigs data...');
    const { data: gigs, error: gigsError } = await supabase
      .from('gigs')
      .select('id, title, status, applicant_preferences')
      .limit(3);

    if (gigsError) {
      console.error('Error fetching gigs:', gigsError);
    } else {
      console.log(`Found ${gigs?.length || 0} gigs:`);
      gigs?.forEach(gig => {
        console.log(`  - ${gig.title} (${gig.status})`);
        console.log(`    Preferences: ${JSON.stringify(gig.applicant_preferences)}`);
      });
    }

    // 3. Check if compatibility functions exist
    console.log('\n🔧 Checking compatibility functions...');
    const { data: functions, error: funcError } = await supabase
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_schema', 'public')
      .in('routine_name', [
        'calculate_gig_compatibility',
        'get_gig_talent_recommendations', 
        'get_user_gig_recommendations'
      ]);

    if (funcError) {
      console.error('Error fetching functions:', funcError);
    } else {
      console.log(`Found ${functions?.length || 0} compatibility functions:`);
      functions?.forEach(func => {
        console.log(`  - ${func.routine_name}`);
      });
    }

    // 4. Test the calculate_gig_compatibility function if it exists
    if (functions?.some(f => f.routine_name === 'calculate_gig_compatibility')) {
      console.log('\n🧪 Testing calculate_gig_compatibility function...');
      
      // Get a sample gig and user
      const { data: sampleGig } = await supabase
        .from('gigs')
        .select('id')
        .eq('status', 'PUBLISHED')
        .limit(1)
        .single();

      const { data: sampleUser } = await supabase
        .from('users_profile')
        .select('id')
        .limit(1)
        .single();

      if (sampleGig && sampleUser) {
        const { data: compatResult, error: compatError } = await supabase
          .rpc('calculate_gig_compatibility', {
            p_profile_id: sampleUser.id,
            p_gig_id: sampleGig.id
          });

        if (compatError) {
          console.error('Error testing calculate_gig_compatibility:', compatError);
        } else {
          console.log('Compatibility result:', compatResult);
        }
      } else {
        console.log('No sample gig or user found for testing');
      }
    }

    // 5. Check users_profile table structure
    console.log('\n👥 Checking users_profile table structure...');
    const { data: userColumns, error: userError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'users_profile')
      .eq('table_schema', 'public');

    if (userError) {
      console.error('Error fetching users_profile table structure:', userError);
    } else {
      console.log('Users_profile table columns:');
      userColumns?.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    // 6. Check for any recent errors in the logs
    console.log('\n📝 Recent database activity...');
    const { data: recentGigs } = await supabase
      .from('gigs')
      .select('id, title, created_at, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);

    console.log('Recent gigs:');
    recentGigs?.forEach(gig => {
      console.log(`  - ${gig.title} (updated: ${gig.updated_at})`);
    });

  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the inspection
inspectDatabase().then(() => {
  console.log('\n✅ Database inspection complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Inspection failed:', error);
  process.exit(1);
});
