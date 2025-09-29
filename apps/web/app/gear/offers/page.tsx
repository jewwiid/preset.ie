'use client';

import React, { useState, useEffect } from 'react';
import MarketplaceLayout from '@/components/marketplace/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Handshake, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Calendar,
  DollarSign,
  User,
  Package,
  Filter,
  X,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { supabase } from '../../../lib/supabase';
import { toast } from 'sonner';

interface Offer {
  id: string;
  listing_id: string;
  offerer_id: string;
  owner_id: string;
  offer_amount_cents: number;
  message?: string;
  contact_preference?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  created_at: string;
  updated_at: string;
  listings?: {
    id: string;
    title: string;
    category: string;
    mode: string;
    status: string;
    owner_id: string;
  };
  offerer?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
    verified_id?: boolean;
  };
  owner?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
    verified_id?: boolean;
  };
}

interface OffersResponse {
  offers: Offer[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const OFFER_STATUSES = {
  open: { label: 'Open', color: 'bg-primary/10 text-primary', icon: Clock },
  accepted: { label: 'Accepted', color: 'bg-primary/10 text-primary', icon: CheckCircle },
  declined: { label: 'Declined', color: 'bg-destructive/10 text-destructive', icon: XCircle },
  expired: { label: 'Expired', color: 'bg-muted text-muted-foreground', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', icon: XCircle }
};

export default function OffersPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sent' | 'received' | 'all'>('all');
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchOffers = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      // Check if supabase is available
      if (!supabase) {
        setError('Database connection not available');
        return;
      }

      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Please sign in to view your offers');
        return;
      }

      const params = new URLSearchParams({
        type: activeTab,
        page: page.toString(),
        limit: pagination.limit.toString(),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await fetch(`/api/marketplace/offers?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API Error:', response.status, response.statusText, errorData);
        throw new Error(`Failed to fetch offers: ${response.status} ${response.statusText}`);
      }

      const data: OffersResponse = await response.json();
      setOffers(data.offers);
      setPagination(data.pagination);
    } catch (err) {
      console.error('Error fetching offers:', err);
      setError('Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const withdrawOffer = async (offerId: string) => {
    try {
      // Check if supabase is available
      if (!supabase) {
        toast.error('Database connection not available');
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        toast.error('Please sign in to withdraw offers');
        return;
      }

      const response = await fetch(`/api/marketplace/offers/${offerId}/withdraw`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          offerId: offerId
        })
      });

      if (response.ok) {
        toast.success('Offer withdrawn successfully!');
        fetchOffers(); // Refresh offers
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to withdraw offer');
      }
    } catch (err) {
      console.error('Error withdrawing offer:', err);
      toast.error('Failed to withdraw offer');
    }
  };

  useEffect(() => {
    if (user) {
      fetchOffers();
    }
  }, [user, activeTab, statusFilter]);

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    const StatusIcon = OFFER_STATUSES[status as keyof typeof OFFER_STATUSES]?.icon || Clock;
    return <StatusIcon className="h-4 w-4" />;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md bg-card border-border">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to view your offers.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MarketplaceLayout>
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <Handshake className="h-6 w-6 text-primary mr-3" />
          <h1 className="text-2xl font-bold text-foreground">Offers</h1>
        </div>
        <p className="text-muted-foreground">Manage your marketplace offers</p>
      </div>
        <div className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Filter className="h-5 w-5 mr-2" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Status
                  </label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {Object.entries(OFFER_STATUSES).map(([key, status]) => (
                        <SelectItem key={key} value={key}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Offers Tabs */}
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'sent' | 'received' | 'all')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All Offers</TabsTrigger>
              <TabsTrigger value="sent">Sent</TabsTrigger>
              <TabsTrigger value="received">Received</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {/* Results Header */}
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-foreground">
                  {loading ? 'Loading...' : `${pagination.total} offers found`}
                </h2>
                {!loading && pagination.total > 0 && (
                  <span className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                )}
              </div>

              {/* Offers List */}
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i} className="animate-pulse bg-card border-border">
                      <CardHeader>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="h-3 bg-muted rounded"></div>
                          <div className="h-3 bg-muted rounded w-5/6"></div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-destructive">{error}</p>
                  <Button onClick={() => fetchOffers()} className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-12">
                  <Handshake className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No offers found</h3>
                  <p className="text-muted-foreground">
                    {activeTab === 'sent' && "You haven't sent any offers yet."}
                    {activeTab === 'received' && "You haven't received any offers yet."}
                    {activeTab === 'all' && "You don't have any offers yet."}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <Card key={offer.id} className="hover:shadow-lg transition-shadow bg-card border-border">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Badge className={OFFER_STATUSES[offer.status as keyof typeof OFFER_STATUSES]?.color}>
                                {getStatusIcon(offer.status)}
                                <span className="ml-1">{OFFER_STATUSES[offer.status as keyof typeof OFFER_STATUSES]?.label}</span>
                              </Badge>
                              <Badge variant="secondary">
                                {offer.listings?.mode === 'rent' ? 'Rental' : 'Purchase'}
                              </Badge>
                            </div>
                            <CardTitle className="text-lg mb-2">
                              {offer.listings?.title || 'Unknown Listing'}
                            </CardTitle>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">
                              {formatPrice(offer.offer_amount_cents)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {offer.listings?.mode === 'rent' ? 'per day' : 'total'}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent>
                        <div className="space-y-3">
                          {/* Listing Details */}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Package className="h-4 w-4 mr-2" />
                            <span>{offer.listings?.category} • {offer.listings?.mode}</span>
                          </div>
                          
                          {/* User Details */}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              {/* Avatar */}
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                                {activeTab === 'sent' ? (
                                  offer.owner?.avatar_url ? (
                                    <img 
                                      src={offer.owner.avatar_url} 
                                      alt={offer.owner.handle || 'User'} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <User className="h-3 w-3 text-muted-foreground" />
                                  )
                                ) : (
                                  offer.offerer?.avatar_url ? (
                                    <img 
                                      src={offer.offerer.avatar_url} 
                                      alt={offer.offerer.handle || 'User'} 
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <User className="h-3 w-3 text-muted-foreground" />
                                  )
                                )}
                              </div>
                              {/* Username with verification badge */}
                              <div className="flex items-center space-x-1">
                                <span>
                                  {activeTab === 'sent' ? 'To' : 'From'}: @{activeTab === 'sent' ? offer.owner?.handle : offer.offerer?.handle || 'unknown'}
                                </span>
                                {(activeTab === 'sent' ? offer.owner?.verified_id : offer.offerer?.verified_id) && (
                                  <Badge variant="secondary" className="text-xs px-1 py-0 h-4">
                                    ✓
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          {/* Dates */}
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4 mr-2" />
                            <span>Created {formatDateTime(offer.created_at)}</span>
                          </div>
                          
                          {/* Status-specific info */}
                          {offer.status === 'pending' && (
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Clock className="h-4 w-4 mr-2" />
                              <span>Offer is pending response</span>
                            </div>
                          )}
                          
                          {/* Message */}
                          {offer.message && (
                            <div className="mt-3 p-3 bg-muted rounded-lg">
                              <p className="text-sm text-foreground">{offer.message}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {activeTab === 'sent' && offer.status === 'pending' && (
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => withdrawOffer(offer.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Withdraw Offer
                              </Button>
                            </div>
                          )}
                          
                          {/* Message Owner Button for Accepted Offers */}
                          {activeTab === 'sent' && offer.status === 'accepted' && (
                            <div className="mt-4 flex justify-end">
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => {
                                  // Navigate to the listing page with messaging enabled
                                  window.open(`/gear/listings/${offer.listing_id}`, '_blank');
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Message Owner
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {!loading && pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchOffers(pagination.page - 1)}
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
                          onClick={() => fetchOffers(pageNum)}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchOffers(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
    </MarketplaceLayout>
  );
}
