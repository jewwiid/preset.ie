import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// Initialize Supabase client
const getSupabaseClient = (authToken?: string, useServiceRole = false) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (useServiceRole) {
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase service role environment variables');
    }
    return createClient(supabaseUrl, supabaseServiceKey);
  }

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables');
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: authToken ? {
        Authorization: `Bearer ${authToken}`
      } : {}
    }
  });

  return client;
};

// PATCH /api/collab/projects/[id]/roles/[roleId] - Update role
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roleId: string }> }
) {
  try {
    const { id: projectId, roleId } = await params;
    const body = await request.json();

    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Use service role client for reliable access
    const supabase = getSupabaseClient(token, true);

    // Get current user info for access control
    let currentUserId: string | null = null;
    
    if (token) {
      // Create a separate authenticated client to get user info
      const authClient = getSupabaseClient(token, false);
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        const { data: profile } = await authClient
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          currentUserId = profile.id;
        }
      }
    }

    // First, check if role exists and get project info
    const { data: role, error: roleError } = await supabase
      .from('collab_roles')
      .select(`
        *,
        project:collab_projects!collab_roles_project_id_fkey(
          id,
          creator_id
        )
      `)
      .eq('id', roleId)
      .eq('project_id', projectId)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if user is the project creator
    const isCreator = currentUserId === role.project.creator_id;
    
    if (!isCreator) {
      return NextResponse.json({ error: 'Access denied - only project creator can update roles' }, { status: 403 });
    }

    // Update role
    const { data: updatedRole, error: updateError } = await supabase
      .from('collab_roles')
      .update(body)
      .eq('id', roleId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating role:', updateError);
      return NextResponse.json({ error: 'Failed to update role' }, { status: 500 });
    }

    return NextResponse.json({ role: updatedRole });

  } catch (error) {
    console.error('Update role API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/collab/projects/[id]/roles/[roleId] - Delete role
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; roleId: string }> }
) {
  try {
    const { id: projectId, roleId } = await params;

    // Get auth token from request
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Use service role client for reliable access
    const supabase = getSupabaseClient(token, true);

    // Get current user info for access control
    let currentUserId: string | null = null;
    
    if (token) {
      // Create a separate authenticated client to get user info
      const authClient = getSupabaseClient(token, false);
      const { data: { user } } = await authClient.auth.getUser();
      if (user) {
        const { data: profile } = await authClient
          .from('users_profile')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          currentUserId = profile.id;
        }
      }
    }

    // First, check if role exists and get project info
    const { data: role, error: roleError } = await supabase
      .from('collab_roles')
      .select(`
        *,
        project:collab_projects!collab_roles_project_id_fkey(
          id,
          creator_id
        )
      `)
      .eq('id', roleId)
      .eq('project_id', projectId)
      .single();

    if (roleError || !role) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 });
    }

    // Check if user is the project creator
    const isCreator = currentUserId === role.project.creator_id;
    
    if (!isCreator) {
      return NextResponse.json({ error: 'Access denied - only project creator can delete roles' }, { status: 403 });
    }

    // Delete role
    const { error: deleteError } = await supabase
      .from('collab_roles')
      .delete()
      .eq('id', roleId);

    if (deleteError) {
      console.error('Error deleting role:', deleteError);
      return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Role deleted successfully' });

  } catch (error) {
    console.error('Delete role API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
