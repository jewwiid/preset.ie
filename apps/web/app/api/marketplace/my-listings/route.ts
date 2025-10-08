import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Get user's profile ID
    const { data: profile } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ listings: [], total: 0 })
    }

    // Fetch user's presets (both for sale and not for sale)
    const { data: listings, error: listingsError } = await supabase
      .from('presets')
      .select(`
        id,
        name,
        display_name,
        description,
        category,
        is_for_sale,
        sale_price,
        marketplace_status,
        total_sales,
        revenue_earned,
        created_at,
        updated_at,
        is_public
      `)
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })

    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
      return NextResponse.json(
        { error: 'Failed to fetch listings' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      listings: listings || [],
      total: listings?.length || 0
    })

  } catch (error) {
    console.error('Error in my-listings API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
