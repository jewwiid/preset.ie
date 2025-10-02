import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * GET /api/collab/recommendations
 * Get personalized role recommendations for the current user
 *
 * Query params:
 * - min_compatibility: Minimum compatibility score (default: 30)
 * - limit: Number of recommendations (default: 10, max: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id, specializations')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const minCompatibility = parseFloat(searchParams.get('min_compatibility') || '30');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50);

    // Get all open roles
    const { data: openRoles, error: rolesError } = await supabase
      .from('collab_roles')
      .select(`
        id,
        role_name,
        skills_required,
        is_paid,
        compensation_details,
        headcount,
        project:collab_projects!collab_roles_project_id_fkey(
          id,
          title,
          description,
          city,
          country,
          start_date,
          end_date,
          visibility,
          creator:users_profile!collab_projects_creator_id_fkey(
            id,
            display_name,
            handle,
            avatar_url,
            verified_id
          )
        )
      `)
      .eq('status', 'open')
      .order('created_at', { ascending: false });

    if (rolesError) {
      console.error('Error fetching open roles:', rolesError);
      return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 });
    }

    if (!openRoles || openRoles.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    // Calculate compatibility for each role
    const recommendationsPromises = openRoles.map(async (role) => {
      try {
        const { data: compatibility, error: compatError } = await supabase.rpc(
          'calculate_collaboration_compatibility',
          {
            p_profile_id: profile.id,
            p_role_id: role.id
          }
        );

        if (compatError || !compatibility || compatibility.length === 0) {
          return null;
        }

        const compatData = compatibility[0];

        // Filter by minimum compatibility
        if (compatData.skill_match_score < minCompatibility) {
          return null;
        }

        // Check if user already applied
        const { data: existingApplication } = await supabase
          .from('collab_applications')
          .select('id, status')
          .eq('role_id', role.id)
          .eq('applicant_id', profile.id)
          .single();

        return {
          role: {
            id: role.id,
            role_name: role.role_name,
            skills_required: role.skills_required,
            is_paid: role.is_paid,
            compensation_details: role.compensation_details,
            headcount: role.headcount
          },
          project: role.project,
          compatibility: {
            overall_score: compatData.overall_score,
            skill_match_score: compatData.skill_match_score,
            profile_completeness_score: compatData.profile_completeness_score,
            matched_skills: compatData.matched_skills,
            missing_skills: compatData.missing_skills
          },
          already_applied: !!existingApplication,
          application_status: existingApplication?.status || null
        };
      } catch (err) {
        console.error(`Error calculating compatibility for role ${role.id}:`, err);
        return null;
      }
    });

    const allRecommendations = await Promise.all(recommendationsPromises);

    // Filter out nulls and sort by compatibility score
    const validRecommendations = allRecommendations
      .filter(rec => rec !== null)
      .sort((a, b) => b!.compatibility.overall_score - a!.compatibility.overall_score)
      .slice(0, limit);

    return NextResponse.json({
      recommendations: validRecommendations,
      total: validRecommendations.length,
      filters: {
        min_compatibility: minCompatibility,
        limit
      }
    });

  } catch (error) {
    console.error('Recommendations API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
