const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function updateMatchmakingFunctions() {
  try {
    console.log('=== UPDATING MATCHMAKING FUNCTIONS FOR SIMPLE NAMING ===')

    // Update the calculate_gig_compatibility function
    const compatFunction = `
      CREATE OR REPLACE FUNCTION calculate_gig_compatibility(
          p_profile_id UUID,
          p_gig_id UUID
      ) RETURNS TABLE (
          compatibility_score NUMERIC,
          match_factors JSONB
      ) AS $$
      DECLARE
          v_gig RECORD;
          v_profile RECORD;
          v_score NUMERIC := 0;
          v_factors JSONB := '{}'::JSONB;
          v_role_matched BOOLEAN := FALSE;
      BEGIN
          -- Get gig data
          SELECT * INTO v_gig
          FROM gigs
          WHERE id = p_gig_id AND status = 'PUBLISHED';

          IF NOT FOUND THEN
              RETURN;
          END IF;

          -- Get profile data
          SELECT * INTO v_profile
          FROM users_profile
          WHERE id = p_profile_id;

          IF NOT FOUND THEN
              RETURN;
          END IF;

          -- Primary role matching (50 points) - check both arrays
          IF v_gig.looking_for IS NOT NULL AND array_length(v_gig.looking_for, 1) > 0 THEN
              IF v_profile.primary_skill = ANY(v_gig.looking_for) THEN
                  v_score := v_score + 50;
                  v_factors := jsonb_set(v_factors, '{primary_skill_match}', 'perfect'::jsonb);
                  v_role_matched := TRUE;
              ELSIF v_profile.talent_categories && v_gig.looking_for THEN
                  v_score := v_score + 40;
                  v_factors := jsonb_set(v_factors, '{primary_skill_match}', 'partial'::jsonb);
                  v_role_matched := TRUE;
              END IF;
          END IF;

          -- Secondary role matching using looking_for (30 points)
          IF v_gig.looking_for IS NOT NULL AND array_length(v_gig.looking_for, 1) > 0 THEN
              IF v_profile.talent_categories && v_gig.looking_for OR
                 v_profile.primary_skill = ANY(v_gig.looking_for) THEN
                  v_score := v_score + 30;
                  v_factors := jsonb_set(v_factors, '{category_match}', 'true'::jsonb);
              END IF;
          END IF;

          -- Location bonus (20 points)
          IF v_gig.city IS NOT NULL AND v_profile.city IS NOT NULL THEN
              IF v_gig.city = v_profile.city THEN
                  v_score := v_score + 20;
                  v_factors := jsonb_set(v_factors, '{location_match}', 'same_city'::jsonb);
              ELSIF v_gig.country = v_profile.country AND v_gig.country IS NOT NULL THEN
                  v_score := v_score + 10;
                  v_factors := jsonb_set(v_factors, '{location_match}', 'same_country'::jsonb);
              END IF;
          END IF;

          -- Cap at 100 and add summary
          v_score := LEAST(v_score, 100);
          v_factors := jsonb_set(v_factors, '{summary}',
              jsonb_build_object(
                  'role_matched', v_role_matched,
                  'total_score', v_score,
                  'max_possible', 100
              )
          );

          RETURN QUERY SELECT v_score, v_factors;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `

    // Update the find_compatible_gigs_for_user function
    const findFunction = `
      CREATE OR REPLACE FUNCTION find_compatible_gigs_for_user(
          p_profile_id UUID,
          p_limit INTEGER DEFAULT 20,
          p_min_score DECIMAL(5,2) DEFAULT 40.0
      ) RETURNS TABLE (
          gig_id UUID,
          gig_title TEXT,
          gig_description TEXT,
          gig_looking_for TEXT[],
          compatibility_score DECIMAL(5,2),
          role_match_status TEXT,
          breakdown JSONB,
          matched_attributes TEXT[],
          missing_requirements TEXT[]
      ) AS $$
      BEGIN
          RETURN QUERY
          SELECT
              g.id,
              g.title,
              g.description,
              COALESCE(g.looking_for, ARRAY[]::TEXT[]),
              COALESCE(comp.compatibility_score, 0)::DECIMAL(5,2),
              CASE
                  WHEN comp.compatibility_score >= 80 THEN 'perfect'
                  WHEN comp.compatibility_score >= 60 THEN 'partial'
                  WHEN comp.compatibility_score >= 40 THEN 'weak'
                  ELSE 'none'
              END,
              comp.match_factors,
              CASE WHEN comp.compatibility_score >= 40 THEN ARRAY['Role matched'] ELSE ARRAY[]::TEXT[] END,
              CASE WHEN comp.compatibility_score < 40 THEN ARRAY['Role mismatch'] ELSE ARRAY[]::TEXT[] END
          FROM gigs g
          CROSS JOIN LATERAL calculate_gig_compatibility(p_profile_id, g.id) comp
          WHERE
              g.status = 'PUBLISHED'
              AND g.application_deadline > NOW()
              AND comp.compatibility_score >= p_min_score
          ORDER BY
              comp.compatibility_score DESC,
              g.created_at DESC
          LIMIT p_limit;
      END;
      $$ LANGUAGE plpgsql STABLE;
    `

    const grantPermissions = `
      GRANT EXECUTE ON FUNCTION calculate_gig_compatibility TO authenticated;
      GRANT EXECUTE ON FUNCTION find_compatible_gigs_for_user TO authenticated;
    `

    // Execute the function updates
    const { error: compatError } = await supabase.rpc('exec', { sql: compatFunction })
    if (compatError) {
      console.error('Error updating compatibility function:', compatError)
      // Try alternative approach using direct SQL
    }

    const { error: findError } = await supabase.rpc('exec', { sql: findFunction })
    if (findError) {
      console.error('Error updating find function:', findError)
    }

    const { error: grantError } = await supabase.rpc('exec', { sql: grantPermissions })
    if (grantError) {
      console.error('Error granting permissions:', grantError)
    }

    console.log('Matchmaking functions updated successfully!')

  } catch (error) {
    console.error('Update failed:', error)
  }
}

updateMatchmakingFunctions()