import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET /api/admin/users/[id] - Get user details + violations
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Check admin role
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('users_profile')
      .select('role_flags')
      .eq('user_id', user.id)
      .single()

    if (!profile?.role_flags?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Fetch user details
    const { data: userDetails, error: userError } = await supabase
      .from('users_profile')
      .select(`
        user_id,
        display_name,
        handle,
        bio,
        city,
        role_flags,
        subscription_tier,
        created_at,
        last_seen_at
      `)
      .eq('user_id', id)
      .single()

    if (userError || !userDetails) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Fetch additional data
    const [
      { data: violations },
      { data: badges },
      { data: subscription },
      { data: credits },
      { data: recentActivity },
      { data: suspensions }
    ] = await Promise.all([
      // Violations
      supabase
        .from('user_violations')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(10),

      // Verification badges
      supabase
        .from('verification_badges')
        .select('*')
        .eq('user_id', id)
        .eq('is_active', true),

      // Subscription
      supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single(),

      // Credits
      supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', id)
        .single(),

      // Recent activity (from domain events)
      supabase
        .from('domain_events')
        .select('*')
        .eq('aggregate_id', id)
        .order('occurred_at', { ascending: false })
        .limit(20),

      // Suspensions
      supabase
        .from('user_suspensions')
        .select('*')
        .eq('user_id', id)
        .eq('is_active', true)
        .single()
    ])

    // Calculate risk score
    const violationCount = violations?.length || 0
    const riskScore = Math.min(100, violationCount * 15)

    // Format response
    const userResponse = {
      ...userDetails,
      violation_count: violationCount,
      risk_score: riskScore,
      is_suspended: !!suspensions,
      is_banned: userDetails.role_flags?.includes('BANNED'),
      suspension_expires_at: suspensions?.expires_at,
      credits_balance: credits?.balance || 0,
      subscription_status: subscription?.status,
      subscription_expires_at: subscription?.expires_at,
      verification_badges: badges?.map((b: any) => ({
        type: b.verification_type,
        verified_at: b.issued_at,
        expires_at: b.expires_at
      })) || [],
      recent_violations: violations?.map((v: any) => ({
        id: v.id,
        type: v.violation_type,
        severity: v.severity,
        created_at: v.created_at,
        description: v.description
      })) || [],
      recent_activity: recentActivity?.map((e: any) => ({
        type: e.event_type,
        description: getActivityDescription(e),
        created_at: e.occurred_at
      })) || []
    }

    return NextResponse.json({ user: userResponse })

  } catch (error) {
    console.error('Error fetching user details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user details' },
      { status: 500 }
    )
  }
}

function getActivityDescription(event: any): string {
  const eventData = event.event_data || {}
  
  switch (event.event_type) {
    case 'UserRegistered':
      return 'Registered on the platform'
    case 'ProfileUpdated':
      return 'Updated profile information'
    case 'GigCreated':
      return `Created a new gig: ${eventData.title || 'Untitled'}`
    case 'ApplicationSubmitted':
      return 'Applied to a gig'
    case 'ShowcasePublished':
      return 'Published a showcase'
    case 'SubscriptionUpgraded':
      return `Upgraded to ${eventData.tier} subscription`
    case 'MessageSent':
      return 'Sent a message'
    case 'ReviewSubmitted':
      return 'Submitted a review'
    default:
      return event.event_type.replace(/([A-Z])/g, ' $1').trim()
  }
}

// PATCH /api/admin/users/[id] - Update user flags/status
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
    const { role_flags, subscription_tier, notes } = body

    // Build update object
    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (role_flags !== undefined) {
      updateData.role_flags = role_flags
    }

    if (subscription_tier !== undefined) {
      updateData.subscription_tier = subscription_tier
    }

    // Update user profile
    const { data: updatedUser, error } = await supabase
      .from('users_profile')
      .update(updateData)
      .eq('user_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating user:', error)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Log admin action if notes provided
    if (notes) {
      await supabase
        .from('moderation_actions')
        .insert({
          admin_user_id: user.id,
          target_user_id: id,
          action_type: 'verify', // Generic action for profile updates
          reason: notes,
          metadata: { updates: updateData }
        })
    }

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}