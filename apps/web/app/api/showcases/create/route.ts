import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Showcase creation API called')
    
    // Get auth token from header
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      console.error('❌ No authorization header provided')
      return NextResponse.json(
        { success: false, error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }
    
    const token = authHeader.replace('Bearer ', '')
    console.log('🔑 Token received:', token.substring(0, 20) + '...')
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      console.error('❌ Authentication failed:', authError)
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }
    
    console.log('✅ User authenticated:', user.id)

    const requestBody = await request.json()
    console.log('📝 Request body received:', requestBody)
    
    const { 
      title, 
      description, 
      moodboardId, 
      individualImageUrl,
      individualImageTitle,
      individualImageDescription,
      showcaseType = 'moodboard',
      visibility = 'public',
      tags = []
    } = requestBody

    // Validate required fields based on showcase type
    console.log('🔍 Validating fields:', { title, showcaseType, moodboardId, individualImageUrl })
    
    if (!title) {
      console.error('❌ Title is required')
      return NextResponse.json(
        { success: false, error: 'Title is required' },
        { status: 400 }
      )
    }

    if (showcaseType === 'moodboard' && !moodboardId) {
      console.error('❌ MoodboardId is required for moodboard showcases')
      return NextResponse.json(
        { success: false, error: 'MoodboardId is required for moodboard showcases' },
        { status: 400 }
      )
    }

    if (showcaseType === 'individual_image' && !individualImageUrl) {
      console.error('❌ IndividualImageUrl is required for individual image showcases')
      return NextResponse.json(
        { success: false, error: 'IndividualImageUrl is required for individual image showcases' },
        { status: 400 }
      )
    }
    
    console.log('✅ Validation passed')

    // Check if user has permission to create showcases (subscription tier check)
    const { data: userProfile } = await supabase
      .from('users_profile')
      .select('subscription_tier')
      .eq('user_id', user.id)
      .single()

    const subscriptionTier = userProfile?.subscription_tier || 'free'
    
    // Check monthly showcase limits based on subscription tier
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const { data: existingShowcases } = await supabase
      .from('showcases')
      .select('id')
      .eq('creator_user_id', user.id)
      .gte('created_at', startOfMonth.toISOString())

    const currentMonthCount = existingShowcases?.length || 0
    
    // Apply subscription tier limits
    let maxShowcases = 0
    switch (subscriptionTier) {
      case 'free':
        maxShowcases = 3
        break
      case 'plus':
        maxShowcases = 10
        break
      case 'pro':
        maxShowcases = -1 // unlimited
        break
      default:
        maxShowcases = 0
    }

    if (maxShowcases !== -1 && currentMonthCount >= maxShowcases) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Monthly showcase limit reached (${currentMonthCount}/${maxShowcases}). Upgrade to create more showcases.`,
          code: 'SHOWCASE_LIMIT_REACHED',
          currentCount: currentMonthCount,
          maxAllowed: maxShowcases,
          subscriptionTier
        },
        { status: 403 }
      )
    }

    let moodboard = null
    let mediaCount = 0

    // Handle moodboard showcases
    if (showcaseType === 'moodboard') {
      const { data: moodboardData, error: moodboardError } = await supabase
        .from('moodboards')
        .select(`
          id,
          title,
          description,
          items (
            id,
            image_url,
            title,
            description,
            tags
          )
        `)
        .eq('id', moodboardId)
        .eq('user_id', user.id)
        .single()

      if (moodboardError || !moodboardData) {
        return NextResponse.json(
          { success: false, error: 'Moodboard not found or access denied' },
          { status: 404 }
        )
      }

      moodboard = moodboardData
      mediaCount = moodboard.items?.length || 0
    } else {
      // Individual image showcase
      mediaCount = 1
    }

    // Create the showcase
    const showcaseData: any = {
      title,
      description,
      creator_user_id: user.id,
      showcase_type: showcaseType,
      visibility,
      tags,
      likes_count: 0,
      views_count: 0,
      media_count: mediaCount
    }

    // Add type-specific fields
    if (showcaseType === 'moodboard') {
      showcaseData.moodboard_id = moodboardId
    } else {
      showcaseData.individual_image_url = individualImageUrl
      showcaseData.individual_image_title = individualImageTitle
      showcaseData.individual_image_description = individualImageDescription
      
      // Fetch width/height from playground_gallery if available
      if (individualImageUrl) {
        try {
          const { data: galleryItem } = await supabase
            .from('playground_gallery')
            .select('width, height')
            .eq('image_url', individualImageUrl)
            .single()
          
          if (galleryItem) {
            showcaseData.individual_image_width = galleryItem.width
            showcaseData.individual_image_height = galleryItem.height
            console.log('📐 Found gallery dimensions:', { width: galleryItem.width, height: galleryItem.height })
          }
        } catch (error) {
          console.log('⚠️ Could not fetch gallery dimensions:', error)
        }
      }
    }

    console.log('💾 Creating showcase with data:', showcaseData)
    
    const { data: newShowcase, error: showcaseError } = await supabase
      .from('showcases')
      .insert(showcaseData)
      .select()
      .single()

    if (showcaseError) {
      console.error('❌ Error creating showcase:', showcaseError)
      console.error('Error details:', {
        message: showcaseError.message,
        details: showcaseError.details,
        hint: showcaseError.hint,
        code: showcaseError.code
      })
      return NextResponse.json(
        { success: false, error: 'Failed to create showcase' },
        { status: 500 }
      )
    }
    
    console.log('✅ Showcase created successfully:', newShowcase.id)

    // Create showcase media entries for moodboard showcases
    if (showcaseType === 'moodboard' && moodboard && moodboard.items && moodboard.items.length > 0) {
      const mediaEntries = moodboard.items.map((item: any) => ({
        showcase_id: newShowcase.id,
        moodboard_item_id: item.id,
        image_url: item.image_url,
        title: item.title,
        description: item.description,
        tags: item.tags,
        order_index: 0,
        showcase_type: 'moodboard'
      }))

      const { error: mediaError } = await supabase
        .from('showcase_media')
        .insert(mediaEntries)

      if (mediaError) {
        console.error('Error creating showcase media:', mediaError)
        // Don't fail the entire request, just log the error
      }
    }
    // For individual image showcases, the trigger will automatically create the media entry

    // Initialize like count
    await supabase
      .from('showcase_like_counts')
      .insert({
        showcase_id: newShowcase.id,
        likes_count: 0
      })

    return NextResponse.json({
      success: true,
      showcase: newShowcase
    })

  } catch (error) {
    console.error('❌ Create showcase API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}