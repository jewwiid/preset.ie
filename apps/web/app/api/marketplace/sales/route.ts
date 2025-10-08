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

    // Get user's profile ID first (preset_purchases.seller_user_id references users_profile.id)
    const { data: profile } = await supabase
      .from('users_profile')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ sales: [], total: 0 })
    }

    // Fetch user's sales
    const { data: sales, error: salesError } = await supabase
      .from('preset_purchases')
      .select(`
        id,
        preset_id,
        buyer_user_id,
        seller_user_id,
        purchase_price,
        created_at,
        presets!preset_id (
          id,
          name,
          display_name,
          description,
          category
        ),
        users_profile!buyer_user_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq('seller_user_id', profile.id)
      .order('created_at', { ascending: false })

    if (salesError) {
      console.error('Error fetching sales:', salesError)
      return NextResponse.json(
        { error: 'Failed to fetch sales' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedSales = sales?.map(sale => ({
      id: sale.id,
      preset_id: sale.preset_id,
      buyer_user_id: sale.buyer_user_id,
      seller_user_id: sale.seller_user_id,
      purchase_price: sale.purchase_price,
      created_at: sale.created_at,
      preset: Array.isArray(sale.presets) ? sale.presets[0] : sale.presets,
      buyer_profile: Array.isArray(sale.users_profile)
        ? sale.users_profile[0]
        : sale.users_profile
    })) || []

    return NextResponse.json({
      sales: formattedSales,
      total: formattedSales.length
    })

  } catch (error) {
    console.error('Error in sales API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
