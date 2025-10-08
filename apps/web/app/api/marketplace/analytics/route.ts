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
      return NextResponse.json(getEmptyAnalytics())
    }

    // Get time range from query params
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '30d'
    const daysBack = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysBack)

    // Fetch user's listings
    const { data: listings } = await supabase
      .from('presets')
      .select('id, name, display_name, category, is_for_sale, is_public, total_sales, revenue_earned')
      .eq('user_id', profile.id)

    // Fetch sales data
    const { data: sales } = await supabase
      .from('preset_purchases')
      .select(`
        id,
        preset_id,
        buyer_user_id,
        purchase_price,
        created_at,
        presets!preset_id (
          id,
          name,
          display_name,
          category
        ),
        users_profile!buyer_user_id (
          id,
          handle
        )
      `)
      .eq('seller_user_id', profile.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    // Calculate overview stats
    const total_revenue = (sales || []).reduce((sum, sale) => {
      const afterFee = sale.purchase_price * 0.9 // 90% after platform fee
      return sum + afterFee
    }, 0)

    const total_sales = sales?.length || 0
    const total_listings = listings?.length || 0
    const active_listings = listings?.filter(l => l.is_for_sale && l.is_public).length || 0
    const average_sale_price = total_sales > 0 ? (sales || []).reduce((sum, s) => sum + s.purchase_price, 0) / total_sales : 0

    // Mock views data (would need to implement view tracking)
    const total_views = total_listings * 10 // Placeholder
    const conversion_rate = total_views > 0 ? total_sales / total_views : 0

    // Top performing presets
    const presetSales = new Map<string, any>()
    sales?.forEach(sale => {
      const preset = Array.isArray(sale.presets) ? sale.presets[0] : sale.presets
      if (!preset) return

      const key = preset.id
      if (!presetSales.has(key)) {
        presetSales.set(key, {
          preset_id: preset.id,
          preset_name: preset.display_name || preset.name,
          category: preset.category,
          total_sales: 0,
          revenue: 0,
          views: 50, // Placeholder
          conversion_rate: 0
        })
      }

      const data = presetSales.get(key)
      data.total_sales++
      data.revenue += sale.purchase_price * 0.9
      data.conversion_rate = data.total_sales / data.views
      presetSales.set(key, data)
    })

    const top_performing_presets = Array.from(presetSales.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5)

    // Sales by category
    const categorySales = new Map<string, any>()
    sales?.forEach(sale => {
      const preset = Array.isArray(sale.presets) ? sale.presets[0] : sale.presets
      if (!preset) return

      const category = preset.category || 'uncategorized'
      if (!categorySales.has(category)) {
        categorySales.set(category, { category, sales: 0, revenue: 0 })
      }

      const data = categorySales.get(category)
      data.sales++
      data.revenue += sale.purchase_price * 0.9
      categorySales.set(category, data)
    })

    const sales_by_category = Array.from(categorySales.values())
      .sort((a, b) => b.revenue - a.revenue)

    // Revenue trend (by week for last 30 days)
    const revenue_trend: any[] = []
    const weeks = Math.ceil(daysBack / 7)

    for (let i = 0; i < weeks; i++) {
      const weekStart = new Date(startDate)
      weekStart.setDate(weekStart.getDate() + (i * 7))
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 7)

      const weekSales = sales?.filter(s => {
        const saleDate = new Date(s.created_at)
        return saleDate >= weekStart && saleDate < weekEnd
      }) || []

      revenue_trend.push({
        period: `Week ${i + 1}`,
        revenue: weekSales.reduce((sum, s) => sum + (s.purchase_price * 0.9), 0),
        sales: weekSales.length
      })
    }

    // Recent activity
    const recent_activity = (sales || []).slice(0, 10).map(sale => {
      const preset = Array.isArray(sale.presets) ? sale.presets[0] : sale.presets
      const buyer = Array.isArray(sale.users_profile) ? sale.users_profile[0] : sale.users_profile

      return {
        date: sale.created_at,
        type: 'sale' as const,
        preset_name: preset?.display_name || preset?.name || 'Unknown',
        amount: sale.purchase_price * 0.9,
        buyer_handle: buyer?.handle
      }
    })

    return NextResponse.json({
      overview: {
        total_revenue,
        total_sales,
        total_listings,
        active_listings,
        average_sale_price,
        total_views,
        conversion_rate
      },
      revenue_trend,
      top_performing_presets,
      sales_by_category,
      recent_activity
    })

  } catch (error) {
    console.error('Error in analytics API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getEmptyAnalytics() {
  return {
    overview: {
      total_revenue: 0,
      total_sales: 0,
      total_listings: 0,
      active_listings: 0,
      average_sale_price: 0,
      total_views: 0,
      conversion_rate: 0
    },
    revenue_trend: [],
    top_performing_presets: [],
    sales_by_category: [],
    recent_activity: []
  }
}
