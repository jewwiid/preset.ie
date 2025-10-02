import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing required Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// ========== VALIDATION FUNCTIONS ==========
// These functions validate application quality before using the database matchmaking functions

/**
 * Validate application message quality
 * Returns validation result with character count
 */
function validateApplicationMessage(message: string | null | undefined): {
  valid: boolean;
  error?: string;
  characterCount: number;
} {
  if (!message || message.trim() === '') {
    return {
      valid: false,
      error: 'Application message is required',
      characterCount: 0
    };
  }

  const trimmedMessage = message.trim();
  const characterCount = trimmedMessage.length;

  if (characterCount < 50) {
    return {
      valid: false,
      error: `Application message is too short (${characterCount} characters). Minimum 50 characters required.`,
      characterCount
    };
  }

  if (characterCount > 2000) {
    return {
      valid: false,
      error: `Application message is too long (${characterCount} characters). Maximum 2000 characters allowed.`,
      characterCount
    };
  }

  return {
    valid: true,
    characterCount
  };
}

// GET /api/collab/projects/[id]/applications - Get project applications
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const userOnly = searchParams.get('user_only') === 'true';

    // Get current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // If user_only=true, return only the user's applications for this project
    if (userOnly) {
      const { data: userApplications, error: userAppError } = await supabase
        .from('collab_applications')
        .select('*')
        .eq('project_id', id)
        .eq('applicant_id', profile.id);

      if (userAppError) {
        console.error('Error fetching user applications:', userAppError);
        return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
      }

      return NextResponse.json({ applications: userApplications || [] });
    }

    // Check if user owns the project (for getting all applications)
    const { data: project, error: projectError } = await supabase
      .from('collab_projects')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    if (project.creator_id !== profile.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { data: applications, error } = await supabase
      .from('collab_applications')
      .select(`
        *,
        applicant:users_profile!collab_applications_applicant_id_fkey(
          id,
          handle,
          display_name,
          avatar_url,
          verified_id,
          city,
          country,
          bio,
          specializations
        ),
        role:collab_roles(
          id,
          role_name,
          skills_required,
          is_paid,
          compensation_details,
          headcount,
          status
        )
      `)
      .eq('project_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    return NextResponse.json({ applications: applications || [] });

  } catch (error) {
    console.error('Get applications API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collab/projects/[id]/applications - Apply for project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      role_id,
      application_type,
      message,
      portfolio_url
    } = body;

    // Get current user
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 });
    }

    // Get user profile (validation will be done by matchmaking service)
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Check if project exists and is public
    const { data: project, error: projectError } = await supabase
      .from('collab_projects')
      .select('creator_id, visibility, status')
      .eq('id', id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Don't allow applications to own projects
    if (project.creator_id === profile.id) {
      return NextResponse.json({ 
        error: 'Cannot apply to your own project' 
      }, { status: 400 });
    }

    // Don't allow applications to completed or cancelled projects
    if (project.status === 'completed' || project.status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Cannot apply to completed or cancelled projects' 
      }, { status: 400 });
    }

    // Validate application type and role_id
    if (application_type === 'role' && !role_id) {
      return NextResponse.json({ 
        error: 'role_id is required for role applications' 
      }, { status: 400 });
    }

    if (application_type === 'general' && role_id) {
      return NextResponse.json({ 
        error: 'role_id should not be provided for general applications' 
      }, { status: 400 });
    }

    // ========== PHASE 1 VALIDATIONS ==========

    // 1. MESSAGE QUALITY VALIDATION
    const messageValidation = validateApplicationMessage(message);
    if (!messageValidation.valid) {
      return NextResponse.json({
        error: messageValidation.error,
        validation_type: 'message_quality',
        details: {
          character_count: messageValidation.characterCount,
          minimum_required: 50,
          maximum_allowed: 2000
        },
        required_action: 'Please provide a detailed application message between 50-2000 characters explaining why you are a good fit for this role.'
      }, { status: 400 });
    }

    // Check if role exists and is open (for role applications)
    if (application_type === 'role' && role_id) {
      const { data: role, error: roleError } = await supabase
        .from('collab_roles')
        .select('id, status, project_id')
        .eq('id', role_id)
        .single();

      if (roleError || !role) {
        return NextResponse.json({ error: 'Role not found' }, { status: 404 });
      }

      if (role.project_id !== id) {
        return NextResponse.json({
          error: 'Role does not belong to this project'
        }, { status: 400 });
      }

      if (role.status !== 'open') {
        return NextResponse.json({
          error: 'Role is not open for applications'
        }, { status: 400 });
      }

      // 2. USE MATCHMAKING SERVICE FOR COMPREHENSIVE VALIDATION
      // This includes skill match, profile completeness, and overall compatibility
      const { data: compatibilityResult, error: compatError } = await supabase.rpc(
        'calculate_collaboration_compatibility',
        {
          p_profile_id: profile.id,
          p_role_id: role_id
        }
      );

      if (compatError) {
        console.error('Error calculating compatibility:', compatError);
        return NextResponse.json({
          error: 'Failed to validate application eligibility'
        }, { status: 500 });
      }

      if (!compatibilityResult || compatibilityResult.length === 0) {
        return NextResponse.json({
          error: 'Unable to calculate compatibility'
        }, { status: 500 });
      }

      const compatibility = compatibilityResult[0];

      // PROFILE COMPLETENESS VALIDATION (must be 100%)
      if (compatibility.profile_completeness_score < 100) {
        return NextResponse.json({
          error: 'Your profile is incomplete. Please complete your profile before applying.',
          validation_type: 'profile_completeness',
          details: {
            missing_fields: compatibility.missing_profile_fields || [],
            completeness_score: compatibility.profile_completeness_score
          },
          required_action: `Please add the following to your profile: ${(compatibility.missing_profile_fields || []).join(', ')}`
        }, { status: 400 });
      }

      // SKILL MATCH VALIDATION (minimum 30% threshold)
      if (compatibility.skill_match_score < 30) {
        return NextResponse.json({
          error: 'Your skills do not meet the minimum requirements for this role.',
          validation_type: 'skill_match',
          details: {
            skill_match_percentage: compatibility.skill_match_score,
            minimum_required: 30,
            matched_skills: compatibility.matched_skills || [],
            missing_skills: compatibility.missing_skills || [],
            overall_score: compatibility.overall_score
          },
          required_action: (compatibility.missing_skills || []).length > 0
            ? `This role requires: ${(compatibility.missing_skills || []).join(', ')}. Please add relevant skills to your profile or apply for a different role.`
            : 'Please add more relevant skills to your profile before applying.'
        }, { status: 400 });
      }

      // Log successful validation with compatibility scores
      console.log('Application validation passed:', {
        profile_id: profile.id,
        role_id: role_id,
        overall_score: compatibility.overall_score,
        skill_match_score: compatibility.skill_match_score,
        profile_completeness_score: compatibility.profile_completeness_score
      });
    }

    // Check if user already has an application for this project
    const { data: existingApplication, error: existingError } = await supabase
      .from('collab_applications')
      .select('id')
      .eq('project_id', id)
      .eq('applicant_id', profile.id)
      .eq('status', 'pending');

    if (existingError) {
      console.error('Error checking existing application:', existingError);
      return NextResponse.json({ error: 'Failed to check existing application' }, { status: 500 });
    }

    if (existingApplication && existingApplication.length > 0) {
      return NextResponse.json({ 
        error: 'You already have a pending application for this project' 
      }, { status: 400 });
    }

    // Create application
    const { data: application, error: insertError } = await supabase
      .from('collab_applications')
      .insert({
        project_id: id,
        role_id: application_type === 'role' ? role_id : null,
        applicant_id: profile.id,
        application_type,
        message,
        portfolio_url
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating application:', insertError);
      return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
    }

    return NextResponse.json({ application }, { status: 201 });

  } catch (error) {
    console.error('Create application API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
