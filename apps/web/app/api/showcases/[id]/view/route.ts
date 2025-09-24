import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: showcaseId } = await params

    if (!showcaseId) {
      return NextResponse.json(
        { error: 'Showcase ID is required' },
        { status: 400 }
      )
    }

    // Get user authentication info
    const authHeader = request.headers.get('Authorization')
    let userId: string | null = null
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '')
      const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
      const { data: { user } } = await supabase.auth.getUser(token)
      userId = user?.id || null
    }

    // Get IP address and user agent for anonymous tracking
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    // Create Supabase client with service key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Use the database function to track unique view
    const { data, error } = await supabase.rpc('track_showcase_view', {
      showcase_uuid: showcaseId,
      viewer_user_id: userId,
      viewer_ip: ipAddress,
      viewer_user_agent: userAgent
    })

    if (error) {
      console.error('Error tracking view:', error)
      return NextResponse.json(
        { error: 'Failed to track view' },
        { status: 500 }
      )
    }

    // Get updated view count
    const { data: showcaseData, error: fetchError } = await supabase
      .from('showcases')
      .select('views_count')
      .eq('id', showcaseId)
      .single()

    if (fetchError) {
      console.error('Error fetching updated view count:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch view count' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      views_count: showcaseData.views_count,
      is_new_view: data // Boolean indicating if this was a new unique view
    })

  } catch (error: any) {
    console.error('Error in view tracking API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
