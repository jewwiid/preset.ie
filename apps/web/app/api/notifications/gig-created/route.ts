import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    
    // Create Supabase client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)
    const supabaseAnon = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // Verify the user's session
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Parse request body
    const { gigId, publishNow = false } = await request.json()

    if (!gigId) {
      return NextResponse.json(
        { success: false, error: 'Gig ID is required' },
        { status: 400 }
      )
    }

    console.log('🔔 Gig creation notification triggered:', { gigId, publishNow, userId: user.id })

    // Get gig details
    const { data: gig, error: gigError } = await supabaseAdmin
      .from('gigs')
      .select(`
        id,
        title,
        description,
        purpose,
        location_text,
        start_time,
        end_time,
        owner_user_id,
        status,
        created_at
      `)
      .eq('id', gigId)
      .single()

    if (gigError || !gig) {
      console.error('Error fetching gig:', gigError)
      return NextResponse.json(
        { success: false, error: 'Gig not found' },
        { status: 404 }
      )
    }

    // Only send notifications if gig is being published (not just saved as draft)
    if (publishNow && gig.status === 'PUBLISHED') {
      console.log('📢 Gig is being published, sending notifications...')
      
      // Find matching talent users
      const matchingTalent = await findMatchingTalent(gig, supabaseAdmin)
      
      if (matchingTalent.length === 0) {
        console.log('No matching talent found for gig:', gigId)
        return NextResponse.json({ 
          success: true, 
          message: 'Gig created successfully, no notifications sent (no matching talent)' 
        })
      }

      console.log(`Found ${matchingTalent.length} matching talent users`)

      // Create notifications for each matching talent user
      const notifications = matchingTalent.map(talent => {
        const compatibilityScore = Math.round(talent.compatibility_score)
        const compatibilityMessage = compatibilityScore >= 90 ? 'Perfect match!' : 
                                   compatibilityScore >= 80 ? 'Great match!' : 
                                   'Good match!'
        
        return {
          recipient_id: talent.user_id,
          type: 'new_gig_match',
          category: 'gig',
          title: `${compatibilityMessage} New ${gig.purpose} gig in ${gig.location_text}`,
          message: `"${gig.title}" - ${compatibilityScore}% compatibility - ${gig.description?.substring(0, 80) || ''}${gig.description?.length > 80 ? '...' : ''}`,
          action_url: `/gigs/${gig.id}`,
          action_data: {
            gig_id: gig.id,
            gig_title: gig.title,
            location: gig.location_text,
            purpose: gig.purpose,
            compatibility_score: compatibilityScore,
            match_factors: talent.match_factors
          },
          sender_id: gig.owner_user_id,
          related_gig_id: gig.id,
          delivered_in_app: true,
          delivered_email: false,
          delivered_push: false,
          scheduled_for: new Date().toISOString()
        }
      })

      // Insert notifications in batch
      const { error: notificationError } = await supabaseAdmin
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error creating notifications:', notificationError)
        return NextResponse.json(
          { success: false, error: 'Failed to send notifications' },
          { status: 500 }
        )
      }

      console.log(`✅ Successfully sent ${notifications.length} notifications for gig ${gigId}`)
      
      return NextResponse.json({ 
        success: true, 
        message: `Gig created successfully and ${notifications.length} notifications sent`,
        notificationsSent: notifications.length
      })
    } else {
      console.log('Gig saved as draft, no notifications sent')
      return NextResponse.json({ 
        success: true, 
        message: 'Gig saved successfully (draft mode, no notifications sent)' 
      })
    }

  } catch (error: any) {
    console.error('Error in gig creation notification:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to find matching talent users using compatibility scoring
async function findMatchingTalent(gig: any, supabase: any): Promise<any[]> {
  try {
    console.log(`🔍 Finding talent for gig: ${gig.title} in ${gig.location_text}`)
    
    // First, get all talent users with notification preferences enabled
    const { data: allTalent, error: talentError } = await supabase
      .from('users_profile')
      .select(`
        id,
        user_id,
        display_name,
        avatar_url,
        city,
        style_tags,
        notification_preferences!inner(
          gig_notifications,
          in_app_enabled
        )
      `)
      .contains('account_type', ['TALENT'])
      .eq('notification_preferences.gig_notifications', true)
      .eq('notification_preferences.in_app_enabled', true)
    
    if (talentError) {
      console.error('Error finding talent users:', talentError)
      return []
    }

    if (!allTalent || allTalent.length === 0) {
      console.log('No talent users found with notifications enabled')
      return []
    }

    console.log(`Found ${allTalent.length} talent users with notifications enabled`)

    // Calculate compatibility for each talent user
    const compatibleTalent = []
    const MIN_COMPATIBILITY_THRESHOLD = 70 // Only notify users with 70%+ compatibility

    for (const talent of allTalent) {
      try {
        // Calculate compatibility score using our matchmaking function
        const { data: compatibilityResult, error: compatibilityError } = await supabase
          .rpc('calculate_gig_compatibility', {
            p_profile_id: talent.id,
            p_gig_id: gig.id
          })

        if (compatibilityError) {
          console.error(`Error calculating compatibility for user ${talent.id}:`, compatibilityError)
          continue
        }

        if (compatibilityResult && compatibilityResult.length > 0) {
          const compatibilityScore = compatibilityResult[0].compatibility_score
          
          if (compatibilityScore >= MIN_COMPATIBILITY_THRESHOLD) {
            compatibleTalent.push({
              ...talent,
              compatibility_score: compatibilityScore,
              match_factors: compatibilityResult[0].match_factors
            })
          }
        }
      } catch (error) {
        console.error(`Error processing talent user ${talent.id}:`, error)
        continue
      }
    }

    // Sort by compatibility score (highest first) and limit to top 20
    const sortedTalent = compatibleTalent
      .sort((a, b) => b.compatibility_score - a.compatibility_score)
      .slice(0, 20)

    console.log(`Found ${sortedTalent.length} highly compatible talent users (${MIN_COMPATIBILITY_THRESHOLD}%+ compatibility)`)
    
    return sortedTalent
  } catch (error) {
    console.error('Error in findMatchingTalent:', error)
    return []
  }
}
