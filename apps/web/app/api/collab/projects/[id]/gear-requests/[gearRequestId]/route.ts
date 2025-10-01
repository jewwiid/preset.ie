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

// PATCH /api/collab/projects/[id]/gear-requests/[gearRequestId] - Update gear request
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gearRequestId: string }> }
) {
  try {
    const { id: projectId, gearRequestId } = await params;
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

    // First, check if gear request exists and get project info
    const { data: gearRequest, error: gearRequestError } = await supabase
      .from('collab_gear_requests')
      .select(`
        *,
        project:collab_projects!collab_gear_requests_project_id_fkey(
          id,
          creator_id
        )
      `)
      .eq('id', gearRequestId)
      .eq('project_id', projectId)
      .single();

    if (gearRequestError || !gearRequest) {
      return NextResponse.json({ error: 'Equipment request not found' }, { status: 404 });
    }

    // Check if user is the project creator
    const isCreator = currentUserId === gearRequest.project.creator_id;
    
    if (!isCreator) {
      return NextResponse.json({ error: 'Access denied - only project creator can update equipment requests' }, { status: 403 });
    }

    // Update gear request
    const { data: updatedGearRequest, error: updateError } = await supabase
      .from('collab_gear_requests')
      .update(body)
      .eq('id', gearRequestId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating equipment request:', updateError);
      return NextResponse.json({ error: 'Failed to update equipment request' }, { status: 500 });
    }

    return NextResponse.json({ gearRequest: updatedGearRequest });

  } catch (error) {
    console.error('Update equipment request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/collab/projects/[id]/gear-requests/[gearRequestId] - Delete gear request
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gearRequestId: string }> }
) {
  try {
    const { id: projectId, gearRequestId } = await params;

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

    // First, check if gear request exists and get project info
    const { data: gearRequest, error: gearRequestError } = await supabase
      .from('collab_gear_requests')
      .select(`
        *,
        project:collab_projects!collab_gear_requests_project_id_fkey(
          id,
          creator_id
        )
      `)
      .eq('id', gearRequestId)
      .eq('project_id', projectId)
      .single();

    if (gearRequestError || !gearRequest) {
      return NextResponse.json({ error: 'Equipment request not found' }, { status: 404 });
    }

    // Check if user is the project creator
    const isCreator = currentUserId === gearRequest.project.creator_id;
    
    if (!isCreator) {
      return NextResponse.json({ error: 'Access denied - only project creator can delete equipment requests' }, { status: 403 });
    }

    // Delete gear request
    const { error: deleteError } = await supabase
      .from('collab_gear_requests')
      .delete()
      .eq('id', gearRequestId);

    if (deleteError) {
      console.error('Error deleting equipment request:', deleteError);
      return NextResponse.json({ error: 'Failed to delete equipment request' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Equipment request deleted successfully' });

  } catch (error) {
    console.error('Delete equipment request API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
