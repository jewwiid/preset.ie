'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../../../lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { Switch } from '../../../../components/ui/switch'
import { Input } from '../../../../components/ui/input'
import { Label } from '../../../../components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Store,
  ArrowLeft,
  Eye,
  EyeOff,
  DollarSign,
  TrendingUp,
  Package,
  Edit,
  Trash2,
  ShoppingBag
} from 'lucide-react'

interface MarketplaceListing {
  id: string
  name: string
  display_name: string
  description: string
  category: string
  is_for_sale: boolean
  sale_price: number
  marketplace_status: string
  total_sales: number
  revenue_earned: number
  created_at: string
  updated_at: string
  is_public: boolean
}

export default function MyListingsPage() {
  const router = useRouter()
  const { user, session } = useAuth()
  const [listings, setListings] = useState<MarketplaceListing[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total_listings: 0,
    active_listings: 0,
    total_sales: 0,
    total_revenue: 0
  })

  useEffect(() => {
    if (user && session) {
      fetchListings()
    }
  }, [user, session])

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/marketplace/my-listings', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setListings(data.listings || [])

        // Calculate stats
        const activeListings = data.listings?.filter((l: MarketplaceListing) => l.is_for_sale && l.is_public).length || 0
        const totalSales = data.listings?.reduce((sum: number, l: MarketplaceListing) => sum + (l.total_sales || 0), 0) || 0
        const totalRevenue = data.listings?.reduce((sum: number, l: MarketplaceListing) => sum + (l.revenue_earned || 0), 0) || 0

        setStats({
          total_listings: data.listings?.length || 0,
          active_listings: activeListings,
          total_sales: totalSales,
          total_revenue: totalRevenue
        })
      }
    } catch (error) {
      console.error('Error fetching listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleListingStatus = async (presetId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/presets/${presetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          is_for_sale: !currentStatus
        })
      })

      if (response.ok) {
        fetchListings() // Refresh listings
      }
    } catch (error) {
      console.error('Error toggling listing status:', error)
    }
  }

  const updatePrice = async (presetId: string, newPrice: number) => {
    try {
      const response = await fetch(`/api/presets/${presetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          sale_price: newPrice
        })
      })

      if (response.ok) {
        fetchListings() // Refresh listings
      }
    } catch (error) {
      console.error('Error updating price:', error)
    }
  }

  const deleteListing = async (presetId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This will remove the preset from the marketplace but not delete the preset itself.')) {
      return
    }

    try {
      const response = await fetch(`/api/presets/${presetId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          is_for_sale: false
        })
      })

      if (response.ok) {
        fetchListings()
      }
    } catch (error) {
      console.error('Error deleting listing:', error)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to view your listings</p>
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Marketplace Listings</h1>
              <p className="text-muted-foreground">
                Manage your presets for sale in the marketplace
              </p>
            </div>
            <Button onClick={() => router.push('/presets/create')}>
              <Package className="h-4 w-4 mr-2" />
              Create New Preset
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Listings</p>
                  <p className="text-2xl font-bold">{stats.total_listings}</p>
                </div>
                <Package className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Listings</p>
                  <p className="text-2xl font-bold">{stats.active_listings}</p>
                </div>
                <Eye className="h-8 w-8 text-primary-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Sales</p>
                  <p className="text-2xl font-bold">{stats.total_sales}</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Revenue</p>
                  <p className="text-2xl font-bold">{Math.floor(stats.total_revenue)} CR</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Listings */}
        {loading ? (
          <div className="text-center py-12">
            <LoadingSpinner size="xl" />
          </div>
        ) : listings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Listings Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create presets and list them for sale to start earning credits
              </p>
              <Button onClick={() => router.push('/presets/create')}>
                Create Your First Preset
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {listings.map((listing) => (
              <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Listing Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">
                          {listing.display_name || listing.name}
                        </h3>
                        <Badge variant="outline">{listing.category}</Badge>
                        {listing.is_for_sale && listing.is_public ? (
                          <Badge className="bg-primary-500">
                            <Eye className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Inactive
                          </Badge>
                        )}
                      </div>

                      {listing.description && (
                        <p className="text-muted-foreground text-sm mb-4">
                          {listing.description}
                        </p>
                      )}

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Sales</p>
                          <p className="font-semibold">{listing.total_sales || 0}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Revenue</p>
                          <p className="font-semibold">{Math.floor(listing.revenue_earned || 0)} CR</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-semibold">{listing.marketplace_status || 'unlisted'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Price & Actions */}
                    <div className="w-64 space-y-4">
                      <div>
                        <Label htmlFor={`price-${listing.id}`}>Price (Credits)</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            id={`price-${listing.id}`}
                            type="number"
                            min="1"
                            defaultValue={listing.sale_price || 0}
                            onBlur={(e) => {
                              const newPrice = parseInt(e.target.value)
                              if (newPrice !== listing.sale_price && newPrice > 0) {
                                updatePrice(listing.id, newPrice)
                              }
                            }}
                          />
                          <Button
                            size="icon"
                            variant="outline"
                            onClick={() => {
                              const input = document.getElementById(`price-${listing.id}`) as HTMLInputElement
                              if (input) {
                                updatePrice(listing.id, parseInt(input.value))
                              }
                            }}
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor={`active-${listing.id}`}>Listed for Sale</Label>
                        <Switch
                          id={`active-${listing.id}`}
                          checked={listing.is_for_sale}
                          onCheckedChange={() => toggleListingStatus(listing.id, listing.is_for_sale)}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/presets/${listing.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteListing(listing.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
