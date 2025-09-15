import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const showcaseId = resolvedParams.id
    const userId = user.id

    // Check if user already liked this showcase
    const { data: existingLike, error: likeCheckError } = await supabase
      .from('showcase_likes')
      .select('id')
      .eq('showcase_id', showcaseId)
      .eq('user_id', userId)
      .single()

    if (likeCheckError && likeCheckError.code !== 'PGRST116') {
      console.error('Error checking existing like:', likeCheckError)
      return NextResponse.json(
        { success: false, error: 'Failed to check like status' },
        { status: 500 }
      )
    }

    if (existingLike) {
      return NextResponse.json(
        { success: false, error: 'Already liked this showcase' },
        { status: 400 }
      )
    }

    // Add the like
    const { data: newLike, error: likeError } = await supabase
      .from('showcase_likes')
      .insert({
        showcase_id: showcaseId,
        user_id: userId
      })
      .select()
      .single()

    if (likeError) {
      console.error('Error adding like:', likeError)
      return NextResponse.json(
        { success: false, error: 'Failed to like showcase' },
        { status: 500 }
      )
    }

    // Get updated like count
    const { data: likeCount, error: countError } = await supabase
      .from('showcase_like_counts')
      .select('likes_count')
      .eq('showcase_id', showcaseId)
      .single()

    // Send notification to showcase creator (if not the same user)
    const { data: showcase } = await supabase
      .from('showcases')
      .select('creator_user_id')
      .eq('id', showcaseId)
      .single()

    if (showcase && showcase.creator_user_id !== userId) {
      await supabase
        .from('notifications')
        .insert({
          user_id: showcase.creator_user_id,
          type: 'showcase_liked',
          title: 'Your showcase was liked!',
          message: 'Someone liked your showcase',
          data: {
            showcase_id: showcaseId,
            liker_id: userId
          }
        })
    }

    return NextResponse.json({
      success: true,
      liked: true,
      likes_count: likeCount?.likes_count || 0
    })

  } catch (error) {
    console.error('Like API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
    
    // Verify user authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    const resolvedParams = await params
    const showcaseId = resolvedParams.id
    const userId = user.id

    // Remove the like
    const { error: unlikeError } = await supabase
      .from('showcase_likes')
      .delete()
      .eq('showcase_id', showcaseId)
      .eq('user_id', userId)

    if (unlikeError) {
      console.error('Error removing like:', unlikeError)
      return NextResponse.json(
        { success: false, error: 'Failed to unlike showcase' },
        { status: 500 }
      )
    }

    // Get updated like count
    const { data: likeCount, error: countError } = await supabase
      .from('showcase_like_counts')
      .select('likes_count')
      .eq('showcase_id', showcaseId)
      .single()

    return NextResponse.json({
      success: true,
      liked: false,
      likes_count: likeCount?.likes_count || 0
    })

  } catch (error) {
    console.error('Unlike API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}