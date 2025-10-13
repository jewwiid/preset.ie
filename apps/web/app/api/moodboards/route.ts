import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * GET /api/moodboards
 *
 * Fetch user's moodboards with filtering and pagination
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 20, max: 100)
 * - type: 'all' | 'templates' | 'gigs' | 'public' (default: 'all')
 * - search: string (searches title and template_name)
 * - sort: 'recent' | 'oldest' | 'title' (default: 'recent')
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Pagination
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)
    const offset = (page - 1) * limit

    // Filters
    const type = searchParams.get('type') || 'all'
    const search = searchParams.get('search') || ''
    const sort = searchParams.get('sort') || 'recent'

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

    // Get user profile
    const { data: profile } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Build query
    let query = supabase
      .from('moodboards')
      .select('*', { count: 'exact' })

    // Filter by type
    if (type === 'templates') {
      query = query.eq('is_template', true).eq('owner_user_id', profile.id)
    } else if (type === 'gigs') {
      query = query.not('gig_id', 'is', null).eq('owner_user_id', profile.id)
    } else if (type === 'public') {
      query = query.eq('is_public', true)
    } else {
      // 'all' - only user's own moodboards
      query = query.eq('owner_user_id', profile.id)
    }

    // Search
    if (search) {
      query = query.or(`title.ilike.%${search}%,template_name.ilike.%${search}%,summary.ilike.%${search}%`)
    }

    // Sort
    if (sort === 'oldest') {
      query = query.order('created_at', { ascending: true })
    } else if (sort === 'title') {
      query = query.order('title', { ascending: true })
    } else {
      query = query.order('updated_at', { ascending: false })
    }

    // Paginate
    query = query.range(offset, offset + limit - 1)

    const { data: moodboards, error, count } = await query

    if (error) {
      console.error('Error fetching moodboards:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch moodboards' },
        { status: 500 }
      )
    }

    // Format response
    const formattedMoodboards = (moodboards || []).map(moodboard => ({
      id: moodboard.id,
      title: moodboard.title || moodboard.template_name || 'Untitled',
      description: moodboard.summary,
      items_count: Array.isArray(moodboard.items) ? moodboard.items.length : 0,
      thumbnail_url: Array.isArray(moodboard.items) && moodboard.items.length > 0
        ? moodboard.items[0]?.url || moodboard.items[0]?.thumbnail_url
        : null,
      is_template: moodboard.is_template || false,
      is_public: moodboard.is_public || false,
      gig_id: moodboard.gig_id,
      created_at: moodboard.created_at,
      updated_at: moodboard.updated_at,
      tags: moodboard.tags || []
    }))

    return NextResponse.json({
      success: true,
      data: formattedMoodboards,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error: any) {
    console.error('Error in moodboards API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/moodboards?id=uuid
 *
 * Delete a moodboard (only if user owns it and it's not linked to a completed gig)
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moodboardId = searchParams.get('id')

    if (!moodboardId) {
      return NextResponse.json(
        { success: false, error: 'Moodboard ID is required' },
        { status: 400 }
      )
    }

    // Get auth token
    const authHeader = request.headers.get('Authorization')
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check if user owns this moodboard
    const { data: moodboard } = await supabase
      .from('moodboards')
      .select('owner_user_id, gig_id')
      .eq('id', moodboardId)
      .single()

    if (!moodboard || moodboard.owner_user_id !== profile.id) {
      return NextResponse.json(
        { success: false, error: 'Moodboard not found or unauthorized' },
        { status: 403 }
      )
    }

    // Check if linked to a completed gig
    if (moodboard.gig_id) {
      const { data: gig } = await supabase
        .from('gigs')
        .select('status')
        .eq('id', moodboard.gig_id)
        .single()

      if (gig && gig.status === 'COMPLETED') {
        return NextResponse.json(
          { success: false, error: 'Cannot delete moodboard linked to completed gig' },
          { status: 400 }
        )
      }
    }

    // Delete moodboard
    const { error: deleteError } = await supabase
      .from('moodboards')
      .delete()
      .eq('id', moodboardId)

    if (deleteError) {
      console.error('Error deleting moodboard:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete moodboard' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Moodboard deleted successfully'
    })
  } catch (error: any) {
    console.error('Error in delete moodboard API:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
