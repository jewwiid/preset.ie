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

    // Fetch user's purchases
    const { data: purchases, error: purchasesError } = await supabase
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
          category,
          is_public
        ),
        users_profile!seller_user_id (
          id,
          display_name,
          handle,
          avatar_url
        )
      `)
      .eq('buyer_user_id', user.id)
      .order('created_at', { ascending: false })

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError)
      return NextResponse.json(
        { error: 'Failed to fetch purchases' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedPurchases = purchases?.map(purchase => ({
      id: purchase.id,
      preset_id: purchase.preset_id,
      buyer_user_id: purchase.buyer_user_id,
      seller_user_id: purchase.seller_user_id,
      purchase_price: purchase.purchase_price,
      created_at: purchase.created_at,
      preset: Array.isArray(purchase.presets) ? purchase.presets[0] : purchase.presets,
      seller_profile: Array.isArray(purchase.users_profile)
        ? purchase.users_profile[0]
        : purchase.users_profile
    })) || []

    return NextResponse.json({
      purchases: formattedPurchases,
      total: formattedPurchases.length
    })

  } catch (error) {
    console.error('Error in purchases API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
