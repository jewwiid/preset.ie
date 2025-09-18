const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createMatchmakingFunctions() {
  console.log('🔧 Creating matchmaking functions...\n');

  try {
    // Create the find_compatible_gigs_for_user function
    const createGigsFunction = `
      CREATE OR REPLACE FUNCTION public.find_compatible_gigs_for_user(
          p_profile_id UUID,
          p_limit INTEGER DEFAULT 10
      )
      RETURNS TABLE(
          gig_id UUID,
          title TEXT,
          description TEXT,
          location_text TEXT,
          start_time TIMESTAMPTZ,
          end_time TIMESTAMPTZ,
          comp_type TEXT,
          compatibility_score INTEGER,
          match_factors JSONB
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
          -- For now, return a simple query that gets recent gigs
          -- This is a placeholder implementation that can be enhanced later
          RETURN QUERY
          SELECT 
              g.id as gig_id,
              g.title,
              g.description,
              g.location_text,
              g.start_time,
              g.end_time,
              g.comp_type::TEXT,
              -- Simple compatibility score based on basic criteria
              CASE 
                  WHEN g.status = 'PUBLISHED' THEN 75
                  ELSE 50
              END as compatibility_score,
              -- Basic match factors
              jsonb_build_object(
                  'gender_match', true,
                  'age_match', true,
                  'height_match', true,
                  'experience_match', true,
                  'specialization_match', true,
                  'total_required', 1
              ) as match_factors
          FROM public.gigs g
          WHERE g.status = 'PUBLISHED'
          ORDER BY g.created_at DESC
          LIMIT p_limit;
      END;
      $$;
    `;

    // Create the find_compatible_users_for_contributor function
    const createUsersFunction = `
      CREATE OR REPLACE FUNCTION public.find_compatible_users_for_contributor(
          p_profile_id UUID,
          p_limit INTEGER DEFAULT 10
      )
      RETURNS TABLE(
          user_id UUID,
          display_name TEXT,
          handle TEXT,
          bio TEXT,
          city TEXT,
          compatibility_score INTEGER,
          match_factors JSONB
      )
      LANGUAGE plpgsql
      AS $$
      BEGIN
          -- For now, return a simple query that gets recent users
          -- This is a placeholder implementation that can be enhanced later
          RETURN QUERY
          SELECT 
              up.id as user_id,
              up.display_name,
              up.handle,
              up.bio,
              up.city,
              -- Simple compatibility score
              CASE 
                  WHEN up.bio IS NOT NULL AND up.city IS NOT NULL THEN 80
                  WHEN up.bio IS NOT NULL OR up.city IS NOT NULL THEN 60
                  ELSE 40
              END as compatibility_score,
              -- Basic match factors
              jsonb_build_object(
                  'profile_complete', up.bio IS NOT NULL,
                  'location_match', up.city IS NOT NULL,
                  'experience_match', up.years_experience IS NOT NULL
              ) as match_factors
          FROM public.users_profile up
          WHERE up.id != p_profile_id
          ORDER BY up.created_at DESC
          LIMIT p_limit;
      END;
      $$;
    `;

    // Grant permissions
    const grantPermissions = `
      GRANT EXECUTE ON FUNCTION public.find_compatible_gigs_for_user(UUID, INTEGER) TO authenticated;
      GRANT EXECUTE ON FUNCTION public.find_compatible_users_for_contributor(UUID, INTEGER) TO authenticated;
    `;

    console.log('📝 Note: SQL functions need to be created manually in Supabase SQL Editor');
    console.log('📋 Copy and paste the following SQL into Supabase SQL Editor:\n');
    console.log('-- Function 1: find_compatible_gigs_for_user');
    console.log(createGigsFunction);
    console.log('\n-- Function 2: find_compatible_users_for_contributor');
    console.log(createUsersFunction);
    console.log('\n-- Grant permissions');
    console.log(grantPermissions);

    console.log('\n🧪 Testing if functions exist...');
    
    // Test the function
    const { data, error } = await supabase.rpc('find_compatible_gigs_for_user', {
      p_profile_id: '550e8400-e29b-41d4-a716-446655440000',
      p_limit: 3
    });
    
    if (error) {
      console.log('❌ Function does not exist yet:', error.message);
      console.log('📝 Please run the SQL above in Supabase SQL Editor');
    } else {
      console.log('✅ Function works! Results:', data);
    }

  } catch (err) {
    console.log('💥 Exception:', err.message);
  }
}

createMatchmakingFunctions();
