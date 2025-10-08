import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Cron job to send gig application deadline reminders
 * Runs every 6 hours to find gigs with deadlines in ~24 hours
 * Notifies users who have saved/viewed the gig but haven't applied
 *
 * Schedule: "0 *\/6 * * *" (every 6 hours)
 * Vercel cron: configured in vercel.json
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      console.error('Unauthorized cron attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🕐 Starting gig deadline reminders cron job...')

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate time windows (24 hours from now ± 3 hours for cron flexibility)
    const in27Hours = new Date(Date.now() + 27 * 60 * 60 * 1000)
    const in21Hours = new Date(Date.now() + 21 * 60 * 60 * 1000)

    // Find gigs with application deadlines in ~24 hours that are still published
    const { data: expiringGigs, error: gigsError } = await supabase
      .from('gigs')
      .select(`
        id,
        title,
        purpose,
        application_deadline,
        location_text,
        owner_user_id,
        start_time,
        users_profile!owner_user_id (
          display_name,
          avatar_url
        )
      `)
      .gte('application_deadline', in21Hours.toISOString())
      .lte('application_deadline', in27Hours.toISOString())
      .eq('status', 'PUBLISHED')

    if (gigsError) {
      console.error('Error fetching expiring gigs:', gigsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch gigs' },
        { status: 500 }
      )
    }

    if (!expiringGigs || expiringGigs.length === 0) {
      console.log('No gigs with deadlines in ~24 hours found')
      return NextResponse.json({
        success: true,
        message: 'No deadline reminders needed',
        remindersSent: 0
      })
    }

    console.log(`Found ${expiringGigs.length} gigs with approaching deadlines`)

    // Collect all notifications to send
    const notifications: any[] = []
    let totalUsersNotified = 0

    // Process each expiring gig
    for (const gig of expiringGigs) {
      // Check if saved_gigs table exists
      const { error: tableCheckError } = await supabase
        .from('saved_gigs')
        .select('id')
        .limit(1)

      let interestedUsers: any[] = []

      if (!tableCheckError) {
        // Get users who have saved this gig
        const { data: savedData, error: savedError } = await supabase
          .from('saved_gigs')
          .select(`
            user_id,
            users_profile!saved_gigs_user_id_fkey (
              user_id,
              display_name
            )
          `)
          .eq('gig_id', gig.id)

        if (!savedError && savedData) {
          interestedUsers = savedData
        }
      }

      // If no saved_gigs table or no saved users, skip to next gig
      if (interestedUsers.length === 0) {
        console.log(`No interested users found for gig: ${gig.title}`)
        continue
      }

      // Get users who have already applied to this gig
      const { data: existingApplications } = await supabase
        .from('applications')
        .select('applicant_user_id')
        .eq('gig_id', gig.id)

      const appliedUserIds = new Set(
        existingApplications?.map(app => app.applicant_user_id) || []
      )

      // Filter out users who have already applied
      const usersToNotify = interestedUsers.filter(
        user => !appliedUserIds.has(user.user_id)
      )

      if (usersToNotify.length === 0) {
        console.log(`All interested users have already applied for: ${gig.title}`)
        continue
      }

      console.log(`Notifying ${usersToNotify.length} users about deadline for: ${gig.title}`)

      // Check notification preferences for each user and create notifications
      for (const user of usersToNotify) {
        // Check if user wants gig notifications
        const { data: prefs } = await supabase
          .from('notification_preferences')
          .select('gig_notifications, in_app_enabled')
          .eq('user_id', user.user_id)
          .single()

        // Default to true if no preferences set
        const gigsEnabled = prefs?.gig_notifications !== false
        const inAppEnabled = prefs?.in_app_enabled !== false

        if (gigsEnabled && inAppEnabled) {
          // Calculate hours until deadline
          const deadline = new Date(gig.application_deadline)
          const now = new Date()
          const hoursUntil = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))

          notifications.push({
            recipient_id: user.user_id,
            user_id: gig.owner_user_id, // Gig owner is the "sender"
            type: 'gig_deadline',
            category: 'gig',
            title: `⏰ Deadline in ${hoursUntil} hours!`,
            message: `Last chance to apply for "${gig.title}" in ${gig.location_text}`,
            action_url: `/gigs/${gig.id}`,
            thumbnail_url: (gig.users_profile as any)?.[0]?.avatar_url || (gig.users_profile as any)?.avatar_url || null,
            data: {
              gig_id: gig.id,
              gig_title: gig.title,
              deadline: gig.application_deadline,
              hours_until_deadline: hoursUntil,
              location: gig.location_text,
              purpose: gig.purpose,
              start_time: gig.start_time
            }
          })

          totalUsersNotified++
        }
      }
    }

    // Batch insert all notifications
    if (notifications.length > 0) {
      const { error: insertError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (insertError) {
        console.error('Error inserting deadline notifications:', insertError)
        return NextResponse.json(
          { success: false, error: 'Failed to send notifications' },
          { status: 500 }
        )
      }

      console.log(`✅ Successfully sent ${notifications.length} deadline reminders to ${totalUsersNotified} users`)
    } else {
      console.log('No users to notify (all either applied or have notifications disabled)')
    }

    return NextResponse.json({
      success: true,
      message: `Deadline reminders processed successfully`,
      gigsProcessed: expiringGigs.length,
      remindersSent: notifications.length,
      usersNotified: totalUsersNotified
    })

  } catch (error: any) {
    console.error('Error in gig deadline reminders cron:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error'
      },
      { status: 500 }
    )
  }
}
