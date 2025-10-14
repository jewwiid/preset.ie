'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs'
import { ShoppingBag, Package, TrendingUp, Calendar, ArrowLeft, ExternalLink } from 'lucide-react'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface PresetPurchase {
  id: string
  preset_id: string
  buyer_user_id: string
  seller_user_id: string
  purchase_price: number
  created_at: string
  preset: {
    id: string
    name: string
    display_name: string
    description: string
    category: string
    is_public: boolean
  }
  seller_profile: {
    id: string
    display_name: string
    handle: string
    avatar_url: string
  }
}

interface PresetSale {
  id: string
  preset_id: string
  buyer_user_id: string
  seller_user_id: string
  purchase_price: number
  created_at: string
  preset: {
    id: string
    name: string
    display_name: string
    description: string
    category: string
  }
  buyer_profile: {
    id: string
    display_name: string
    handle: string
    avatar_url: string
  }
}

export default function MarketplacePurchasesPage() {
  const router = useRouter()
  const { user, session } = useAuth()
  const [purchases, setPurchases] = useState<PresetPurchase[]>([])
  const [sales, setSales] = useState<PresetSale[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('purchases')
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: 0,
    totalSales: 0,
    totalEarned: 0
  })

  useEffect(() => {
    if (user && session) {
      fetchPurchases()
      fetchSales()
    }
  }, [user, session])

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/marketplace/purchases', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPurchases(data.purchases || [])

        const totalSpent = (data.purchases || []).reduce((sum: number, p: PresetPurchase) => sum + p.purchase_price, 0)
        setStats(prev => ({
          ...prev,
          totalPurchases: data.purchases?.length || 0,
          totalSpent
        }))
      }
    } catch (error) {
      console.error('Error fetching purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/marketplace/sales', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSales(data.sales || [])

        // Calculate earnings after platform fee (10%)
        const totalEarned = (data.sales || []).reduce((sum: number, s: PresetSale) => {
          const afterFee = s.purchase_price * 0.9 // 90% to seller
          return sum + afterFee
        }, 0)

        setStats(prev => ({
          ...prev,
          totalSales: data.sales?.length || 0,
          totalEarned
        }))
      }
    } catch (error) {
      console.error('Error fetching sales:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to view your purchases</p>
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

          <h1 className="text-3xl font-bold mb-2">Marketplace Activity</h1>
          <p className="text-muted-foreground">
            View your preset purchases and sales
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Purchases</p>
                  <p className="text-2xl font-bold">{stats.totalPurchases}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                  <p className="text-2xl font-bold">{stats.totalSpent} CR</p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Sales</p>
                  <p className="text-2xl font-bold">{stats.totalSales}</p>
                </div>
                <Package className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Earned</p>
                  <p className="text-2xl font-bold">{Math.floor(stats.totalEarned)} CR</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="purchases">My Purchases</TabsTrigger>
            <TabsTrigger value="sales">My Sales</TabsTrigger>
          </TabsList>

          {/* Purchases Tab */}
          <TabsContent value="purchases" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <LoadingSpinner size="xl" />
              </div>
            ) : purchases.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Purchases Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Browse the marketplace to find amazing presets
                  </p>
                  <Button onClick={() => router.push('/presets/marketplace')}>
                    Browse Marketplace
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {purchases.map((purchase) => (
                  <Card key={purchase.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {purchase.preset.display_name || purchase.preset.name}
                            </h3>
                            <Badge variant="outline">{purchase.preset.category}</Badge>
                          </div>

                          {purchase.preset.description && (
                            <p className="text-muted-foreground text-sm mb-3">
                              {purchase.preset.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(purchase.created_at)}
                            </div>
                            <div>
                              Seller: @{purchase.seller_profile.handle}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-2xl font-bold text-primary mb-4">
                            {purchase.purchase_price} CR
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/presets/${purchase.preset_id}`)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Preset
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sales Tab */}
          <TabsContent value="sales" className="mt-6">
            {loading ? (
              <div className="text-center py-12">
                <LoadingSpinner size="xl" />
              </div>
            ) : sales.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No Sales Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create and list presets to start earning credits
                  </p>
                  <Button onClick={() => router.push('/presets/create')}>
                    Create Preset
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sales.map((sale) => (
                  <Card key={sale.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold">
                              {sale.preset.display_name || sale.preset.name}
                            </h3>
                            <Badge variant="outline">{sale.preset.category}</Badge>
                          </div>

                          {sale.preset.description && (
                            <p className="text-muted-foreground text-sm mb-3">
                              {sale.preset.description}
                            </p>
                          )}

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {formatDate(sale.created_at)}
                            </div>
                            <div>
                              Buyer: @{sale.buyer_profile.handle}
                            </div>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-sm text-muted-foreground mb-1">Sale Price</p>
                          <p className="text-2xl font-bold mb-1">
                            {sale.purchase_price} CR
                          </p>
                          <p className="text-sm text-green-600 mb-4">
                            You earned: {Math.floor(sale.purchase_price * 0.9)} CR
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/presets/${sale.preset_id}`)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View Preset
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
