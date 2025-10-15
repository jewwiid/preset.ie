import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// POST /api/admin/reports/[id]/resolve - Resolve report with action
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('users_profile')
      .select('account_type')
      .eq('user_id', user.id)
      .single()

    if (!profile?.account_type?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { 
      resolution_action, 
      resolution_notes,
      duration_hours // For suspensions
    } = body

    // Validate required fields
    if (!resolution_action) {
      return NextResponse.json({ error: 'Resolution action is required' }, { status: 400 })
    }

    // Get report details
    const { data: report } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()

    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Start transaction by updating report
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: 'resolved',
        resolution_action,
        resolution_notes,
        resolved_by: user.id,
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (updateError) {
      console.error('Error resolving report:', updateError)
      return NextResponse.json({ error: 'Failed to resolve report' }, { status: 500 })
    }

    // Apply moderation action if needed
    if (resolution_action !== 'dismissed' && resolution_action !== 'no_action' && report.reported_user_id) {
      // Map resolution action to moderation action
      let actionType = resolution_action
      if (resolution_action === 'user_suspended') {
        actionType = 'suspend'
      } else if (resolution_action === 'user_banned') {
        actionType = 'ban'
      } else if (resolution_action === 'content_removed') {
        actionType = 'content_remove'
      }

      // Create moderation action
      const { error: actionError } = await supabase
        .from('moderation_actions')
        .insert({
          admin_user_id: user.id,
          target_user_id: report.reported_user_id,
          action_type: actionType,
          reason: `Report #${id}: ${report.reason} - ${report.description}`,
          duration_hours: actionType === 'suspend' ? (duration_hours || 24) : null,
          expires_at: actionType === 'suspend' && duration_hours 
            ? new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString()
            : null,
          report_id: id
        })

      if (actionError) {
        console.error('Error creating moderation action:', actionError)
      }

      // Create violation record
      if (resolution_action !== 'warning') {
        const severity = resolution_action === 'user_banned' ? 'severe' 
                      : resolution_action === 'user_suspended' ? 'moderate'
                      : 'minor'

        const { error: violationError } = await supabase
          .from('user_violations')
          .insert({
            user_id: report.reported_user_id,
            violation_type: report.reason,
            severity,
            report_id: id,
            description: report.description,
            evidence_urls: report.evidence_urls
          })

        if (violationError) {
          console.error('Error creating violation:', violationError)
        }
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Report resolved successfully'
    })
  } catch (error) {
    console.error('Resolve report error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}