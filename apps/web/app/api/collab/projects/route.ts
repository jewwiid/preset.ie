import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase client inside functions to avoid build-time issues
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey)
}

// GET /api/collab/projects - Browse projects with filters
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const { searchParams } = new URL(request.url);
    
    // Extract filter parameters
    const status = searchParams.get('status');
    const visibility = searchParams.get('visibility');
    const city = searchParams.get('city');
    const country = searchParams.get('country');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const roleType = searchParams.get('role_type'); // specific role needed
    const gearCategory = searchParams.get('gear_category'); // specific gear needed
    const view = searchParams.get('view'); // 'all', 'my_projects', 'invited'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Get current user if authenticated
    const authHeader = request.headers.get('authorization');
    let currentUserId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        const { data: profile } = await supabase
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          currentUserId = profile.id;
        }
      }
    }

    // Build base query without pagination for counting
    let baseQuery = supabase
      .from('collab_projects')
      .select(`
        *,
        creator:users_profile!collab_projects_creator_id_fkey(
          id,
          handle,
          display_name,
          avatar_url,
          verified_id,
          city,
          country
        ),
        collab_roles(
          id,
          role_name,
          skills_required,
          is_paid,
          compensation_details,
          headcount,
          status
        ),
        collab_gear_requests(
          id,
          category,
          equipment_spec,
          quantity,
          borrow_preferred,
          max_daily_rate_cents,
          status
        ),
        collab_participants(
          id,
          role_type,
          status,
          user:users_profile!collab_participants_user_id_fkey(
            id,
            handle,
            display_name,
            avatar_url
          )
        )
      `)
      .order('created_at', { ascending: false });

    // Apply view filter to base query
    if (view === 'my_projects' && currentUserId) {
      baseQuery = baseQuery.eq('creator_id', currentUserId);
    } else if (view === 'invited' && currentUserId) {
      // Fetch projects user has been invited to
      const { data: invitations } = await supabase
        .from('collab_invitations')
        .select('project_id')
        .eq('invitee_id', currentUserId)
        .eq('status', 'pending');
      
      if (invitations && invitations.length > 0) {
        const projectIds = invitations.map(inv => inv.project_id);
        baseQuery = baseQuery.in('id', projectIds);
      } else {
        // No invitations, return empty result
        return NextResponse.json({
          projects: [],
          pagination: { page, limit, total: 0, pages: 0 }
        });
      }
    } else {
      // Default: show public projects only
      baseQuery = baseQuery.eq('visibility', 'public');
    }

    // Apply filters to base query
    if (status) {
      baseQuery = baseQuery.eq('status', status);
    }
    
    if (city) {
      baseQuery = baseQuery.ilike('city', `%${city}%`);
    }
    
    if (country) {
      baseQuery = baseQuery.eq('country', country);
    }
    
    if (startDate) {
      baseQuery = baseQuery.gte('start_date', startDate);
    }
    
    if (endDate) {
      baseQuery = baseQuery.lte('end_date', endDate);
    }

    // Get all projects first (for filtering and counting)
    const { data: allProjects, error } = await baseQuery;

    if (error) {
      console.error('Error fetching projects:', error);
      return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }

    // Filter by role type or gear category if specified
    let filteredProjects = allProjects || [];
    
    if (roleType) {
      filteredProjects = filteredProjects.filter(project => 
        project.collab_roles.some((role: any) => 
          role.role_name.toLowerCase().includes(roleType.toLowerCase()) ||
          role.skills_required?.some((skill: string) => 
            skill.toLowerCase().includes(roleType.toLowerCase())
          )
        )
      );
    }
    
    if (gearCategory) {
      filteredProjects = filteredProjects.filter(project => 
        project.collab_gear_requests.some((request: any) => 
          request.category.toLowerCase().includes(gearCategory.toLowerCase())
        )
      );
    }

    // Calculate the actual total after filtering
    const actualTotal = filteredProjects.length;
    
    // Apply pagination to filtered results
    const paginatedProjects = filteredProjects.slice(offset, offset + limit);

    return NextResponse.json({
      projects: paginatedProjects,
      pagination: {
        page,
        limit,
        total: actualTotal,
        pages: Math.ceil(actualTotal / limit)
      }
    });

  } catch (error) {
    console.error('Projects API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/collab/projects - Create new project
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()
    const body = await request.json();
    const {
      title,
      description,
      synopsis,
      city,
      country,
      start_date,
      end_date,
      visibility,
      moodboard_id
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

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 404 });
    }

    // Validate required fields
    if (!title) {
      return NextResponse.json({ 
        error: 'Missing required field: title' 
      }, { status: 400 });
    }

    // Validate dates
    if (start_date && end_date) {
      const start = new Date(start_date);
      const end = new Date(end_date);
      
      if (start >= end) {
        return NextResponse.json({ 
          error: 'Start date must be before end date' 
        }, { status: 400 });
      }
    }

    // Create project
    const { data: project, error: insertError } = await supabase
      .from('collab_projects')
      .insert({
        creator_id: profile.id,
        title,
        description,
        synopsis,
        city,
        country,
        start_date,
        end_date,
        visibility: visibility || 'public',
        moodboard_id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating project:', insertError);
      return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }

    return NextResponse.json({ project }, { status: 201 });

  } catch (error) {
    console.error('Create project API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
