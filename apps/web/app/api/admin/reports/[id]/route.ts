import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// GET /api/admin/reports/[id] - Get report details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', user.id)
      .single()

    if (!profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get report details
    const { data: report, error } = await supabase
      .from('admin_reports_dashboard')
      .select('*')
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Report not found' }, { status: 404 })
      }
      console.error('Error fetching report:', error)
      return NextResponse.json({ error: 'Failed to fetch report' }, { status: 500 })
    }

    // Get related reports for the same user
    let relatedReports = []
    if (report.reported_user_id) {
      const { data } = await supabase
        .from('reports')
        .select('id, reason, status, created_at')
        .eq('reported_user_id', report.reported_user_id)
        .neq('id', params.id)
        .order('created_at', { ascending: false })
        .limit(5)
      
      relatedReports = data || []
    }

    return NextResponse.json({ 
      report,
      relatedReports
    })
  } catch (error) {
    console.error('Report details error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH /api/admin/reports/[id] - Update report status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', user.id)
      .single()

    if (!profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { status, priority, resolution_notes } = body

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) {
      updateData.status = status
      if (status === 'reviewing') {
        updateData.reviewed_by = user.id
      }
    }

    if (priority) {
      updateData.priority = priority
    }

    if (resolution_notes !== undefined) {
      updateData.resolution_notes = resolution_notes
    }

    // Update report
    const { data: report, error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating report:', error)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}