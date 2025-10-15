'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Calendar,
  ArrowLeft,
  BarChart3,
  LineChart,
  Eye,
  Heart
} from 'lucide-react'

interface AnalyticsData {
  overview: {
    total_revenue: number
    total_sales: number
    total_listings: number
    active_listings: number
    average_sale_price: number
    total_views: number
    conversion_rate: number
  }
  revenue_trend: {
    period: string
    revenue: number
    sales: number
  }[]
  top_performing_presets: {
    preset_id: string
    preset_name: string
    category: string
    total_sales: number
    revenue: number
    views: number
    conversion_rate: number
  }[]
  sales_by_category: {
    category: string
    sales: number
    revenue: number
  }[]
  recent_activity: {
    date: string
    type: 'sale' | 'view' | 'listing'
    preset_name: string
    amount?: number
    buyer_handle?: string
  }[]
}

export default function MarketplaceAnalyticsPage() {
  const router = useRouter()
  const { user, session } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d')

  useEffect(() => {
    if (user && session) {
      fetchAnalytics()
    }
  }, [user, session, timeRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/marketplace/analytics?timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return `${Math.floor(amount)} CR`
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(1)}%`
  }

  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case '7d': return 'Last 7 Days'
      case '30d': return 'Last 30 Days'
      case '90d': return 'Last 90 Days'
      case 'all': return 'All Time'
      default: return 'Last 30 Days'
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to view your analytics</p>
            <Button onClick={() => router.push('/auth/signin')}>
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/presets/marketplace')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Marketplace Analytics</h1>
              <p className="text-muted-foreground">
                Track your sales performance and insights
              </p>
            </div>

            <div className="flex gap-2">
              {(['7d', '30d', '90d', 'all'] as const).map((range) => (
                <Button
                  key={range}
                  variant={timeRange === range ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeRange(range)}
                >
                  {getTimeRangeLabel(range)}
                </Button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <LoadingSpinner size="xl" />
          </div>
        ) : !analytics ? (
          <Card>
            <CardContent className="p-12 text-center">
              <BarChart3 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Analytics Data</h3>
              <p className="text-muted-foreground">
                Start selling presets to see your analytics
              </p>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold">{formatCurrency(analytics.overview.total_revenue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">After platform fee (10%)</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Total Sales</p>
                    <ShoppingCart className="h-5 w-5 text-primary-500" />
                  </div>
                  <p className="text-3xl font-bold">{analytics.overview.total_sales}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Avg: {formatCurrency(analytics.overview.average_sale_price)}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Active Listings</p>
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold">{analytics.overview.active_listings}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    of {analytics.overview.total_listings} total
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Conversion Rate</p>
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <p className="text-3xl font-bold">{formatPercentage(analytics.overview.conversion_rate)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {analytics.overview.total_views} views
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="performance" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="trends">Trends</TabsTrigger>
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
              </TabsList>

              {/* Performance Tab */}
              <TabsContent value="performance" className="space-y-6">
                {/* Top Performing Presets */}
                <Card>
                  <CardHeader>
                    <CardTitle>Top Performing Presets</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.top_performing_presets.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No sales data yet</p>
                    ) : (
                      <div className="space-y-4">
                        {analytics.top_performing_presets.map((preset, index) => (
                          <div key={preset.preset_id} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="font-semibold">{preset.preset_name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <Badge variant="outline" className="text-xs">{preset.category}</Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {preset.total_sales} sales
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-primary">{formatCurrency(preset.revenue)}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatPercentage(preset.conversion_rate)} conversion
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Sales by Category */}
                <Card>
                  <CardHeader>
                    <CardTitle>Sales by Category</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.sales_by_category.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No sales data yet</p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.sales_by_category.map((category) => (
                          <div key={category.category} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{category.category}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {category.sales} sales
                              </span>
                            </div>
                            <p className="font-semibold">{formatCurrency(category.revenue)}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Trends Tab */}
              <TabsContent value="trends">
                <Card>
                  <CardHeader>
                    <CardTitle>Revenue Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.revenue_trend.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No trend data yet</p>
                    ) : (
                      <div className="space-y-2">
                        {analytics.revenue_trend.map((period, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{period.period}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-sm text-muted-foreground">
                                {period.sales} sales
                              </span>
                              <span className="font-semibold">{formatCurrency(period.revenue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Recent Activity Tab */}
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {analytics.recent_activity.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">No recent activity</p>
                    ) : (
                      <div className="space-y-3">
                        {analytics.recent_activity.map((activity, index) => (
                          <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              {activity.type === 'sale' ? (
                                <ShoppingCart className="h-4 w-4 text-primary-500" />
                              ) : activity.type === 'view' ? (
                                <Eye className="h-4 w-4 text-blue-500" />
                              ) : (
                                <Package className="h-4 w-4 text-purple-500" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{activity.preset_name}</p>
                                {activity.buyer_handle && (
                                  <p className="text-xs text-muted-foreground">
                                    Sold to @{activity.buyer_handle}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              {activity.amount && (
                                <p className="text-sm font-semibold text-primary-600">
                                  +{formatCurrency(activity.amount)}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                {new Date(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </div>
  )
}
