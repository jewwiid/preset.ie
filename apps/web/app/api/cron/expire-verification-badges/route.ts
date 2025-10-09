import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Cron Job: Expire Verification Badges
 *
 * This endpoint should be called daily (e.g., via Vercel Cron or GitHub Actions)
 * to automatically expire verification badges and remove verification flags
 * from user profiles.
 *
 * Schedule: Daily at 2:00 AM UTC
 * Vercel cron: "0 2 * * *"
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret for security
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('[CRON] Starting verification badge expiration check...')

    // 1. Find all expired badges that haven't been revoked
    const { data: expiredBadges, error: fetchError } = await supabase
      .from('verification_badges')
      .select('id, user_id, badge_type, expires_at')
      .is('revoked_at', null)
      .not('expires_at', 'is', null)
      .lte('expires_at', new Date().toISOString())

    if (fetchError) {
      console.error('[CRON] Error fetching expired badges:', fetchError)
      throw fetchError
    }

    if (!expiredBadges || expiredBadges.length === 0) {
      console.log('[CRON] No expired badges found')
      return NextResponse.json({
        success: true,
        message: 'No expired badges to process',
        expired: 0
      })
    }

    console.log(`[CRON] Found ${expiredBadges.length} expired badges`)

    // 2. Revoke each expired badge
    const revokedBadgeIds: string[] = []
    const errors: any[] = []

    for (const badge of expiredBadges) {
      try {
        const { error: revokeError } = await supabase
          .from('verification_badges')
          .update({
            revoked_at: new Date().toISOString(),
            revoke_reason: 'Badge expired'
          })
          .eq('id', badge.id)

        if (revokeError) {
          console.error(`[CRON] Error revoking badge ${badge.id}:`, revokeError)
          errors.push({ badge_id: badge.id, error: revokeError })
        } else {
          revokedBadgeIds.push(badge.id)
          console.log(`[CRON] Revoked badge ${badge.id} (${badge.badge_type}) for user ${badge.user_id}`)
        }
      } catch (err) {
        console.error(`[CRON] Exception revoking badge ${badge.id}:`, err)
        errors.push({ badge_id: badge.id, error: err })
      }
    }

    // 3. Update user profiles - remove verified_id if they have no active badges
    const affectedUserIds = [...new Set(expiredBadges.map(b => b.user_id))]
    const profileUpdates: string[] = []

    for (const userId of affectedUserIds) {
      try {
        // Check if user has any remaining active badges
        const { data: activeBadges, error: checkError } = await supabase
          .from('verification_badges')
          .select('id')
          .eq('user_id', userId)
          .is('revoked_at', null)
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)

        if (checkError) {
          console.error(`[CRON] Error checking active badges for user ${userId}:`, checkError)
          continue
        }

        // If no active badges remain, set verified_id to false
        if (!activeBadges || activeBadges.length === 0) {
          const { error: updateError } = await supabase
            .from('users_profile')
            .update({ verified_id: false })
            .eq('user_id', userId)

          if (updateError) {
            console.error(`[CRON] Error updating profile for user ${userId}:`, updateError)
            errors.push({ user_id: userId, error: updateError })
          } else {
            profileUpdates.push(userId)
            console.log(`[CRON] Removed verified_id flag from user ${userId}`)
          }
        }
      } catch (err) {
        console.error(`[CRON] Exception processing user ${userId}:`, err)
        errors.push({ user_id: userId, error: err })
      }
    }

    // 4. Return summary
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        expired_badges_found: expiredBadges.length,
        badges_revoked: revokedBadgeIds.length,
        profiles_updated: profileUpdates.length,
        errors: errors.length
      },
      details: {
        revoked_badge_ids: revokedBadgeIds,
        updated_user_ids: profileUpdates,
        errors: errors.length > 0 ? errors : undefined
      }
    }

    console.log('[CRON] Badge expiration completed:', result.summary)

    return NextResponse.json(result)
  } catch (error) {
    console.error('[CRON] Fatal error in badge expiration:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Support POST for manual triggers
export async function POST(request: NextRequest) {
  return GET(request)
}
