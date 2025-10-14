'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Store, Search, Star, Users, CheckCircle, XCircle, Clock, Eye, Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MarketplaceListing {
  id: string;
  preset_id: string;
  preset_name: string;
  marketplace_title: string;
  marketplace_description: string;
  category: string;
  sale_price: number;
  status: 'pending' | 'approved' | 'rejected';
  seller_display_name: string;
  seller_handle: string;
  created_at: string;
  updated_at: string;
}

export default function AdminMarketplaceListingsPage() {
  const { user, userRole } = useAuth();
  const router = useRouter();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Redirect if not admin
  useEffect(() => {
    if (!user || !userRole?.isAdmin) {
      router.push('/admin');
      return;
    }
  }, [user, userRole, router]);

  const fetchListings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/marketplace/listings');
      const data = await response.json();

      if (response.ok) {
        setListings(data.listings || []);
      } else {
        setError('Failed to fetch marketplace listings');
      }
    } catch (err) {
      console.error('Error fetching marketplace listings:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (listingId: string) => {
    try {
      const response = await fetch(`/api/admin/marketplace/listings/${listingId}/approve`, {
        method: 'POST'});

      if (response.ok) {
        fetchListings(); // Refresh listings
      } else {
        alert('Failed to approve listing');
      }
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('Failed to approve listing');
    }
  };

  const handleReject = async (listingId: string) => {
    try {
      const response = await fetch(`/api/admin/marketplace/listings/${listingId}/reject`, {
        method: 'POST'});

      if (response.ok) {
        fetchListings(); // Refresh listings
      } else {
        alert('Failed to reject listing');
      }
    } catch (error) {
      console.error('Error rejecting listing:', error);
      alert('Failed to reject listing');
    }
  };

  useEffect(() => {
    if (userRole?.isAdmin) {
      fetchListings();
    }
  }, [userRole]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-primary-100 text-primary-800';
      case 'rejected':
        return 'bg-destructive-100 text-destructive-800';
      case 'pending':
        return 'bg-primary-100 text-primary-800';
      default:
        return 'bg-muted-100 text-muted-foreground-800';
    }
  };

  const filteredListings = listings.filter(listing => 
    statusFilter === 'all' || listing.status === statusFilter
  );

  if (!userRole?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

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
                  <h1 className="text-2xl font-bold text-foreground">Admin Marketplace</h1>
                  <p className="text-muted-foreground">Manage marketplace listings and approvals</p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <Tabs defaultValue="listings" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="listings" className="flex items-center space-x-2">
                <Store className="w-4 h-4" />
                <span>All Listings</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Pending</span>
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4" />
                <span>Approved</span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center space-x-2">
                <XCircle className="w-4 h-4" />
                <span>Rejected</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="listings" className="mt-6">
              <div className="space-y-6">
                {/* Filters */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="flex-1">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Search listings..."
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-48">
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="approved">Approved</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Listings */}
                {error ? (
                  <div className="text-center py-12">
                    <p className="text-destructive-500 mb-4">{error}</p>
                    <Button onClick={fetchListings}>Try Again</Button>
                  </div>
                ) : loading ? (
                  <div className="text-center py-12">
                    <LoadingSpinner size="xl" />
                    <p className="text-muted-foreground">Loading listings...</p>
                  </div>
                ) : filteredListings.length === 0 ? (
                  <div className="text-center py-12">
                    <Store className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No listings found</h3>
                    <p className="text-muted-foreground">No marketplace listings match your current filters.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {filteredListings.map(listing => (
                      <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg mb-2">{listing.marketplace_title}</CardTitle>
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getStatusColor(listing.status)}>
                                  {listing.status}
                                </Badge>
                                <Badge variant="outline">
                                  {listing.category}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary">{listing.sale_price}</div>
                              <div className="text-xs text-muted-foreground">credits</div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          {listing.marketplace_description && (
                            <p className="text-muted-foreground text-sm mb-3">
                              {listing.marketplace_description}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                            <div className="flex items-center space-x-2">
                              <span>by @{listing.seller_handle}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span>Created: {new Date(listing.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex space-x-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="flex-1"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </Button>
                            {listing.status === 'pending' && (
                              <>
                                <Button 
                                  size="sm" 
                                  className="flex-1 bg-primary-600 hover:bg-primary-700"
                                  onClick={() => handleApprove(listing.id)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Approve
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="destructive"
                                  className="flex-1"
                                  onClick={() => handleReject(listing.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Reject
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
