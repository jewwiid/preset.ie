'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import MarketplaceLayout from '@/components/marketplace/MarketplaceLayout';
import MarketplaceFilters from '@/components/marketplace/MarketplaceFilters';
import ListingsGrid from '@/components/marketplace/ListingsGrid';
import SafetyDisclaimer from '@/components/marketplace/SafetyDisclaimer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Grid, List, Plus, Store, Package } from 'lucide-react';

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  condition: string;
  mode: 'rent' | 'sale' | 'both';
  rent_day_cents?: number;
  rent_week_cents?: number;
  sale_price_cents?: number;
  retainer_mode: 'none' | 'credit_hold' | 'card_hold';
  retainer_cents: number;
  deposit_cents: number;
  borrow_ok: boolean;
  quantity: number;
  location_city?: string;
  location_country?: string;
  verified_only: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  users_profile?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
    verified_id?: boolean;
  };
  listing_images?: Array<{
    id: string;
    path: string;
    url: string;
    sort_order: number;
    alt_text?: string;
    file_size?: number;
    mime_type?: string;
  }>;
}

interface ListingsResponse {
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

function MarketplacePageContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: searchParams?.get('search') || '',
    category: searchParams?.get('category') || '',
    mode: searchParams?.get('mode') || '',
    condition: searchParams?.get('condition') || '',
    city: searchParams?.get('city') || '',
    country: searchParams?.get('country') || '',
    verified_only: searchParams?.get('verified_only') === 'true',
    min_price: searchParams?.get('min_price') ? parseInt(searchParams?.get('min_price')!) * 100 : undefined,
    max_price: searchParams?.get('max_price') ? parseInt(searchParams?.get('max_price')!) * 100 : undefined
  });
  const [sortBy, setSortBy] = useState(searchParams?.get('sort_by') || 'created_at');
  const [sortOrder, setSortOrder] = useState(searchParams?.get('sort_order') || 'desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fetchListings = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        sort_order: sortOrder,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value !== undefined && value !== '' && value !== false
          )
        )
      });

      console.log('Fetching listings from:', `/api/equipment/listings?${params}`);
      const response = await fetch(`/api/equipment/listings?${params}`);
      console.log('Response status:', response.status, response.statusText);
      
      if (response.ok) {
        const data: ListingsResponse = await response.json();
        console.log('Listings data:', data);
        setListings(data.listings);
        setPagination(data.pagination);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log('Error data:', errorData);
        setError(errorData.error || `Failed to fetch listings: ${response.status} ${response.statusText}`);
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, [filters, sortBy, sortOrder]);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      category: '',
      mode: '',
      condition: '',
      city: '',
      country: '',
      verified_only: false,
      min_price: undefined,
      max_price: undefined
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    fetchListings(page);
  };

  const handleRefresh = () => {
    fetchListings(pagination.page);
  };

  const sortOptions = [
    { value: 'created_at', label: 'Newest First' },
    { value: 'created_at_asc', label: 'Oldest First' },
    { value: 'title', label: 'Title A-Z' },
    { value: 'title_desc', label: 'Title Z-A' },
    { value: 'rent_day_cents', label: 'Price Low to High' },
    { value: 'rent_day_cents_desc', label: 'Price High to Low' }
  ];

  return (
    <MarketplaceLayout>
      {/* Beta Badge */}
      <div className="mb-4">
        <Badge variant="secondary" className="text-xs">
          Beta
        </Badge>
      </div>

      <div className="space-y-6">
                {/* Page Header */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Store className="h-5 w-5" />
                      <span>Marketplace</span>
                    </CardTitle>
                    <p className="text-muted-foreground">
                      Discover and rent equipment from the photography community
                    </p>
                  </CardHeader>
                </Card>

                {/* Safety Notice */}
                <SafetyDisclaimer type="listing" />

                {/* Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <MarketplaceFilters
                      filters={filters}
                      onFiltersChange={handleFiltersChange}
                      onClearFilters={handleClearFilters}
                    />
                  </CardContent>
                </Card>

                {/* Results Header */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center space-x-4">
                        <h2 className="text-lg font-medium text-foreground">
                          {loading ? 'Loading...' : `${pagination.total} listings found`}
                        </h2>
                        {!loading && pagination.total > 0 && (
                          <Badge variant="outline">
                            Page {pagination.page} of {pagination.pages}
                          </Badge>
                        )}
                      </div>

                      <div className="mt-4 sm:mt-0 flex items-center space-x-4">
                        {/* Refresh Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefresh}
                          disabled={loading}
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>

                        {/* Sort */}
                        <Select value={sortBy} onValueChange={setSortBy}>
                          <SelectTrigger className="w-48">
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

                {/* Listings */}
                <ListingsGrid
                  listings={listings}
                  loading={loading}
                  error={error || undefined}
                  emptyMessage="No listings match your criteria. Try adjusting your filters."
                />

                {/* Pagination */}
                {!loading && pagination.pages > 1 && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex justify-center items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(pagination.page - 1)}
                          disabled={pagination.page === 1}
                        >
                          Previous
                        </Button>
                        
                        <div className="flex items-center space-x-1">
                          {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                            const pageNum = i + 1;
                            return (
                              <Button
                                key={pageNum}
                                variant={pagination.page === pageNum ? 'default' : 'outline'}
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
                          onClick={() => handlePageChange(pagination.page + 1)}
                          disabled={pagination.page === pagination.pages}
                        >
                          Next
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
    </MarketplaceLayout>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MarketplacePageContent />
    </Suspense>
  );
}
