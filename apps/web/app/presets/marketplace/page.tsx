'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, Grid, List, Plus, Store, Search, Star, Users, PlayCircle, ShoppingCart, DollarSign, TrendingUp, Eye, Heart, Settings } from 'lucide-react';

interface MarketplacePreset {
  preset_id: string;
  preset_name: string;
  preset_description: string;
  category: string;
  sale_price: number;
  total_sales: number;
  marketplace_title: string;
  marketplace_description: string;
  tags: string[];
  seller_display_name: string;
  seller_handle: string;
  average_rating: number;
  review_count: number;
  created_at: string;
}

interface MarketplaceResponse {
  presets: MarketplacePreset[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
}

interface UserStats {
  stats: {
    total_listings: number;
    approved_listings: number;
    pending_listings: number;
    total_sales: number;
    total_revenue: number;
    total_purchases: number;
    total_spent: number;
  };
  credits: {
    current_balance: number;
    monthly_allowance: number;
    consumed_this_month: number;
  };
}

function PresetMarketplaceContent() {
  const { user, session, userRole } = useAuth();
  const searchParams = useSearchParams();
  const [presets, setPresets] = useState<MarketplacePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    itemsPerPage: 20,
    hasNextPage: false,
    hasPreviousPage: false
  });
  const [filters, setFilters] = useState({
    q: searchParams?.get('q') || '',
    category: searchParams?.get('category') || 'all',
    minPrice: searchParams?.get('minPrice') || '',
    maxPrice: searchParams?.get('maxPrice') || '',
    sortBy: searchParams?.get('sortBy') || 'recent'
  });
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [purchaseLoading, setPurchaseLoading] = useState<string | null>(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'headshot', label: '📷 Headshot' },
    { value: 'product_photography', label: '📦 Product Photography' },
    { value: 'ecommerce', label: '🛒 E-commerce' },
    { value: 'corporate_portrait', label: '👔 Corporate Portrait' },
    { value: 'linkedin_photo', label: '💼 LinkedIn Photo' },
    { value: 'professional_portrait', label: '👤 Professional Portrait' },
    { value: 'business_headshot', label: '📸 Business Headshot' },
    { value: 'product_catalog', label: '📋 Product Catalog' },
    { value: 'product_lifestyle', label: '🏠 Product Lifestyle' },
    { value: 'product_studio', label: '🎬 Product Studio' },
    { value: 'cinematic', label: '🎬 Cinematic' },
    { value: 'artistic', label: '🎨 Artistic' },
    { value: 'portrait', label: '👤 Portrait' },
    { value: 'photography', label: '📸 Photography' },
    { value: 'custom', label: '⚙️ Custom' }
  ];

  const sortOptions = [
    { value: 'recent', label: 'Most Recent' },
    { value: 'popular', label: 'Most Popular' },
    { value: 'price_low', label: 'Price: Low to High' },
    { value: 'price_high', label: 'Price: High to Low' },
    { value: 'rating', label: 'Highest Rated' }
  ];

  const fetchMarketplacePresets = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([key, value]) => {
            if (key === 'category' && value === 'all') return false;
            return value !== '';
          })
        )
      });

      const response = await fetch(`/api/marketplace/presets?${params}`);
      const data: MarketplaceResponse = await response.json();

      if (response.ok) {
        setPresets(data.presets);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch marketplace presets');
      }
    } catch (err) {
      console.error('Error fetching marketplace presets:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    if (!user || !session?.access_token) return;

    try {
      const response = await fetch('/api/marketplace/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserStats(data);
      }
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handlePurchase = async (presetId: string) => {
    if (!user || !session?.access_token) {
      alert('Please sign in to purchase presets');
      return;
    }

    setPurchaseLoading(presetId);

    try {
      const response = await fetch(`/api/marketplace/presets/${presetId}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        alert('Preset purchased successfully!');
        fetchUserStats(); // Refresh user stats
      } else {
        alert(`Purchase failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error purchasing preset:', error);
      alert('Failed to process purchase');
    } finally {
      setPurchaseLoading(null);
    }
  };

  useEffect(() => {
    fetchMarketplacePresets();
  }, [filters]);

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user, session]);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      q: '',
      category: 'all',
      minPrice: '',
      maxPrice: '',
      sortBy: 'recent'
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  const handlePageChange = (page: number) => {
    fetchMarketplacePresets(page);
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      headshot: 'bg-primary-100 text-primary-800',
      product_photography: 'bg-primary-100 text-primary-800',
      ecommerce: 'bg-primary-100 text-primary-800',
      cinematic: 'bg-primary-100 text-primary-800',
      artistic: 'bg-primary-100 text-primary-800',
      portrait: 'bg-primary-100 text-primary-800'
    };
    return colors[category as keyof typeof colors] || 'bg-muted-100 text-muted-foreground-800';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Store className="h-8 w-8 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Preset Marketplace</h1>
                  <p className="text-muted-foreground">Buy and sell AI generation presets</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-4 w-4 text-primary-600" />
                    <span className="font-medium">{userStats?.credits.current_balance || 0} credits</span>
                  </div>
                </div>
              )}
              <Button asChild variant="outline">
                <Link href="/presets/marketplace/my-listings">
                  My Listings
                </Link>
              </Button>
              <Button asChild>
                <Link href="/presets/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Sell Preset
                </Link>
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="browse" className="w-full">
            <TabsList className={`grid w-full ${userRole?.isAdmin ? 'grid-cols-5' : 'grid-cols-4'}`}>
              <TabsTrigger value="browse" className="flex items-center space-x-2">
                <Search className="w-4 h-4" />
                <span>Browse</span>
              </TabsTrigger>
              <TabsTrigger value="my-purchases" asChild>
                <Link href="/presets/marketplace/purchases" className="flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>My Purchases</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="my-listings" asChild>
                <Link href="/presets/marketplace/my-listings" className="flex items-center space-x-2">
                  <Store className="w-4 h-4" />
                  <span>My Listings</span>
                </Link>
              </TabsTrigger>
              <TabsTrigger value="analytics" asChild>
                <Link href="/presets/marketplace/analytics" className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>Analytics</span>
                </Link>
              </TabsTrigger>
              {userRole?.isAdmin && (
                <TabsTrigger value="admin" className="flex items-center space-x-2">
                  <Users className="w-4 h-4" />
                  <span>Admin</span>
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="browse" className="mt-6">
              <div className="space-y-6">
                {/* User Stats (if signed in) */}
                {user && userStats && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">{userStats.credits.current_balance}</div>
                          <div className="text-sm text-muted-foreground">Credits Available</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary-600">{userStats.stats.total_purchases}</div>
                          <div className="text-sm text-muted-foreground">Purchases Made</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary-600">{userStats.stats.total_listings}</div>
                          <div className="text-sm text-muted-foreground">My Listings</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary-600">{userStats.stats.total_revenue}</div>
                          <div className="text-sm text-muted-foreground">Credits Earned</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Search */}
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search presets..."
                            value={filters.q}
                            onChange={(e) => handleFiltersChange({ ...filters, q: e.target.value })}
                            className="pl-10"
                          />
                        </div>
                      </div>

                      {/* Category */}
                      <Select value={filters.category} onValueChange={(value) => handleFiltersChange({ ...filters, category: value })}>
                        <SelectTrigger className="w-full md:w-48">
                          <SelectValue placeholder="Category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map(category => (
                            <SelectItem key={category.value} value={category.value}>
                              {category.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Price Range */}
                      <div className="flex space-x-2">
                        <Input
                          placeholder="Min price"
                          type="number"
                          value={filters.minPrice}
                          onChange={(e) => handleFiltersChange({ ...filters, minPrice: e.target.value })}
                          className="w-24"
                        />
                        <Input
                          placeholder="Max price"
                          type="number"
                          value={filters.maxPrice}
                          onChange={(e) => handleFiltersChange({ ...filters, maxPrice: e.target.value })}
                          className="w-24"
                        />
                      </div>

                      {/* Sort */}
                      <Select value={filters.sortBy} onValueChange={(value) => handleFiltersChange({ ...filters, sortBy: value })}>
                        <SelectTrigger className="w-full md:w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {sortOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* Clear Filters */}
                      <Button variant="outline" onClick={handleClearFilters}>
                        Clear
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Header */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-medium text-foreground">
                          {loading ? 'Loading...' : `${pagination.totalItems} presets found`}
                        </h2>
                        {!loading && pagination.totalItems > 0 && (
                          <Badge variant="outline">
                            Page {pagination.currentPage} of {pagination.totalPages}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                        {/* View Mode */}
                        <div className="flex items-center border border-border rounded-md">
                          <Button
                            variant={viewMode === 'grid' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className="rounded-r-none border-r-0"
                          >
                            <Grid className="h-4 w-4" />
                          </Button>
                          <Button
                            variant={viewMode === 'list' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className="rounded-l-none"
                          >
                            <List className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Presets Grid */}
                {error ? (
                  <div className="text-center py-12">
                    <p className="text-destructive-500 mb-4">{error}</p>
                    <Button onClick={() => fetchMarketplacePresets()}>Try Again</Button>
                  </div>
                ) : loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading presets...</p>
                  </div>
                ) : presets.length === 0 ? (
                  <div className="text-center py-12">
                    <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No presets found</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your filters or be the first to sell a preset!</p>
                    <Button asChild>
                      <Link href="/presets/create">Create & Sell Preset</Link>
                    </Button>
                  </div>
                ) : (
                  <div className={viewMode === 'grid' 
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                    : 'space-y-4'
                  }>
                    {presets.map(preset => (
                      <Card key={preset.preset_id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{preset.marketplace_title}</CardTitle>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getCategoryColor(preset.category)}>
                                  {preset.category}
                                </Badge>
                                {preset.total_sales > 0 && (
                                  <Badge variant="secondary" className="bg-primary-100 text-primary-800">
                                    <Star className="h-3 w-3 mr-1" />
                                    {preset.total_sales} sales
                                  </Badge>
                                )}
                                {preset.average_rating > 0 && (
                                  <Badge variant="outline" className="text-primary-600">
                                    ⭐ {preset.average_rating.toFixed(1)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{preset.sale_price}</div>
                              <div className="text-xs text-muted-foreground">credits</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {preset.marketplace_description && (
                            <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                              {preset.marketplace_description}
                            </p>
                          )}
                          
                          {preset.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                              {preset.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {preset.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{preset.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                            <div className="flex items-center space-x-2">
                              <span>by @{preset.seller_handle}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <PlayCircle className="h-4 w-4" />
                              <span>{preset.total_sales} sales</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              asChild
                              className="flex-1"
                            >
                              <Link href={`/presets/${preset.preset_id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Preview
                              </Link>
                            </Button>
                            <Button 
                              size="sm" 
                              className="flex-1"
                              onClick={() => handlePurchase(preset.preset_id)}
                              disabled={purchaseLoading === preset.preset_id}
                            >
                              {purchaseLoading === preset.preset_id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border"></div>
                              ) : (
                                <>
                                  <ShoppingCart className="h-4 w-4 mr-2" />
                                  Buy Now
                                </>
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {!loading && pagination.totalPages > 1 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-center items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage - 1)}
                          disabled={!pagination.hasPreviousPage}
                        >
                          Previous
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <Button
                                key={pageNum}
                                variant={pagination.currentPage === pageNum ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => handlePageChange(pageNum)}
                              >
                                {pageNum}
                              </Button>
                            );
                          })}
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.currentPage + 1)}
                          disabled={!pagination.hasNextPage}
                        >
                          Next
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            {/* Admin Tab Content */}
            {userRole?.isAdmin && (
              <TabsContent value="admin" className="mt-6">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Users className="h-5 w-5" />
                        <span>Admin Marketplace Management</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                          <Link href="/admin/marketplace/listings">
                            <Store className="h-6 w-6 mb-2" />
                            <span>Manage Listings</span>
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                          <Link href="/admin/marketplace/approvals">
                            <Star className="h-6 w-6 mb-2" />
                            <span>Pending Approvals</span>
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                          <Link href="/admin/marketplace/analytics">
                            <TrendingUp className="h-6 w-6 mb-2" />
                            <span>Marketplace Analytics</span>
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                          <Link href="/admin/marketplace/reports">
                            <DollarSign className="h-6 w-6 mb-2" />
                            <span>Revenue Reports</span>
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                          <Link href="/admin/marketplace/settings">
                            <Settings className="h-6 w-6 mb-2" />
                            <span>Marketplace Settings</span>
                          </Link>
                        </Button>
                        <Button asChild variant="outline" className="h-20 flex flex-col items-center justify-center">
                          <Link href="/admin/marketplace/users">
                            <Users className="h-6 w-6 mb-2" />
                            <span>User Management</span>
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Admin Actions</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Marketplace Status</h3>
                            <p className="text-sm text-muted-foreground">Current marketplace status and settings</p>
                          </div>
                          <Badge variant="outline" className="bg-primary-100 text-primary-800">
                            Active
                          </Badge>
                        </div>
                        
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Pending Approvals</h3>
                            <p className="text-sm text-muted-foreground">Listings waiting for admin approval</p>
                          </div>
                          <Badge variant="outline" className="bg-primary-100 text-primary-800">
                            0 pending
                          </Badge>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-medium">Total Revenue</h3>
                            <p className="text-sm text-muted-foreground">Credits earned through marketplace</p>
                          </div>
                          <Badge variant="outline" className="bg-primary-100 text-primary-800">
                            0 credits
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

export default function PresetMarketplacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PresetMarketplaceContent />
    </Suspense>
  );
}
