'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MarketplaceLayout from '@/components/marketplace/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, Euro, MessageCircle, Clock, CheckCircle, XCircle, AlertCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface RentalRequest {
  id: string;
  listing_id: string;
  requester_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  quantity: number;
  message?: string;
  total_amount_cents: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  listing: {
    id: string;
    title: string;
    category: string;
    listing_images?: Array<{
      id: string;
      url: string;
      alt_text?: string;
    }>;
  };
  owner: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

interface Offer {
  id: string;
  listing_id: string;
  offerer_id: string;
  owner_id: string;
  offer_amount_cents: number;
  message?: string;
  contact_preference: 'message' | 'phone' | 'email';
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  created_at: string;
  updated_at: string;
  listing: {
    id: string;
    title: string;
    category: string;
    listing_images?: Array<{
      id: string;
      url: string;
      alt_text?: string;
    }>;
  };
  owner: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

interface ReceivedRentalRequest {
  id: string;
  listing_id: string;
  requester_id: string;
  owner_id: string;
  start_date: string;
  end_date: string;
  quantity: number;
  message?: string;
  total_amount_cents: number;
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
  listing: {
    id: string;
    title: string;
    category: string;
    listing_images?: Array<{
      id: string;
      url: string;
      alt_text?: string;
    }>;
  };
  requester: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

interface ReceivedOffer {
  id: string;
  listing_id: string;
  offerer_id: string;
  owner_id: string;
  offer_amount_cents: number;
  message?: string;
  contact_preference: 'message' | 'phone' | 'email';
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn' | 'expired';
  created_at: string;
  updated_at: string;
  listing: {
    id: string;
    title: string;
    category: string;
    listing_images?: Array<{
      id: string;
      url: string;
      alt_text?: string;
    }>;
  };
  offerer: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

export default function MyRequestsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [rentalRequests, setRentalRequests] = useState<RentalRequest[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [receivedRentalRequests, setReceivedRentalRequests] = useState<ReceivedRentalRequest[]>([]);
  const [receivedOffers, setReceivedOffers] = useState<ReceivedOffer[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchMyRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current session
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        setError('Failed to initialize authentication');
        setLoading(false);
        return;
      }
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.access_token) {
        setError('Please sign in to view your requests');
        setLoading(false);
        return;
      }

      // Fetch rental requests
      const rentalResponse = await fetch('/api/marketplace/my-rental-requests', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (rentalResponse.ok) {
        const rentalData = await rentalResponse.json();
        setRentalRequests(rentalData.rental_requests || []);
      }

      // Fetch offers
      const offersResponse = await fetch('/api/marketplace/my-offers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (offersResponse.ok) {
        const offersData = await offersResponse.json();
        setOffers(offersData.offers || []);
      }

      // Fetch received rental requests
      const receivedRentalResponse = await fetch('/api/marketplace/received-rental-requests', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (receivedRentalResponse.ok) {
        const receivedRentalData = await receivedRentalResponse.json();
        console.log('Received rental requests data:', receivedRentalData);
        setReceivedRentalRequests(receivedRentalData.rental_requests || []);
      } else {
        console.error('Failed to fetch received rental requests:', receivedRentalResponse.status, receivedRentalResponse.statusText);
      }

      // Fetch received offers
      const receivedOffersResponse = await fetch('/api/marketplace/received-offers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (receivedOffersResponse.ok) {
        const receivedOffersData = await receivedOffersResponse.json();
        console.log('Received offers data:', receivedOffersData);
        setReceivedOffers(receivedOffersData.offers || []);
      } else {
        console.error('Failed to fetch received offers:', receivedOffersResponse.status, receivedOffersResponse.statusText);
      }

    } catch (err) {
      console.error('Error fetching requests:', err);
      setError('Failed to load your requests');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'accepted':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'withdrawn':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      case 'expired':
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'accepted':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'withdrawn':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const handleRentalRequestAction = async (requestId: string, action: 'accept' | 'reject') => {
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        toast.error('Failed to initialize database connection');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please sign in to manage requests');
        return;
      }

      const response = await fetch(`/api/marketplace/rental-requests/${requestId}/action`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ requestId, action })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Refresh the requests
        fetchMyRequests();
      } else {
        toast.error(data.error || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`Error ${action}ing rental request:`, error);
      toast.error(`Failed to ${action} request`);
    }
  };

  const handleOfferAction = async (offerId: string, action: 'accept' | 'reject') => {
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        toast.error('Failed to initialize database connection');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please sign in to manage offers');
        return;
      }

      const response = await fetch(`/api/marketplace/offers/${offerId}/action`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ offerId, action })
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Refresh the requests
        fetchMyRequests();
      } else {
        toast.error(data.error || `Failed to ${action} offer`);
      }
    } catch (error) {
      console.error(`Error ${action}ing offer:`, error);
      toast.error(`Failed to ${action} offer`);
    }
  };

  const handleDeleteOffer = async (offerId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        toast.error('Failed to initialize database connection');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please sign in to delete offers');
        return;
      }

      const response = await fetch(`/api/marketplace/offers/${offerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Refresh the requests
        fetchMyRequests();
      } else {
        toast.error(data.error || 'Failed to delete offer');
      }
    } catch (error) {
      console.error('Error deleting offer:', error);
      toast.error('Failed to delete offer');
    }
  };

  const handleDeleteRentalRequest = async (requestId: string) => {
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        toast.error('Failed to initialize database connection');
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please sign in to delete rental requests');
        return;
      }

      const response = await fetch(`/api/marketplace/rental-requests/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message);
        // Refresh the requests
        fetchMyRequests();
      } else {
        toast.error(data.error || 'Failed to delete rental request');
      }
    } catch (error) {
      console.error('Error deleting rental request:', error);
      toast.error('Failed to delete rental request');
    }
  };

  if (loading) {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading your requests...</p>
            </div>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  if (error) {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Error Loading Requests</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/gear')}>
              Browse Equipment
            </Button>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Requests</h1>
          <p className="text-muted-foreground">
            View and manage your rental requests and purchase offers
          </p>
        </div>

        <Tabs defaultValue="sent" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Sent ({rentalRequests.length + offers.length})
            </TabsTrigger>
            <TabsTrigger value="received" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Received ({receivedRentalRequests.length + receivedOffers.length})
            </TabsTrigger>
            <TabsTrigger value="rentals" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Rental Requests ({rentalRequests.length})
            </TabsTrigger>
            <TabsTrigger value="offers" className="flex items-center gap-2">
              <Euro className="h-4 w-4" />
              Purchase Offers ({offers.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sent" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Sent Rental Requests */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rental Requests ({rentalRequests.length})
                </h3>
                {rentalRequests.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No rental requests sent</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {rentalRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            {/* Listing Image */}
                            <div className="flex-shrink-0">
                              {request.listing.listing_images && request.listing.listing_images.length > 0 ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={request.listing.listing_images[0].url}
                                    alt={request.listing.listing_images[0].alt_text || request.listing.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                  <Calendar className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base mb-1 truncate">
                                    {request.listing.title}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="capitalize">{request.listing.category}</span>
                                    <span>•</span>
                                    <span>{request.quantity} item{request.quantity !== 1 ? 's' : ''}</span>
                                    <span>•</span>
                                    <span>{format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}</span>
                                  </div>
                                </div>
                                <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
                                  {getStatusIcon(request.status)}
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {/* User Info Row */}
                            <div className="flex items-center gap-4">
                              {/* Owner Avatar */}
                              <div className="flex items-center gap-2">
                                {request.owner.avatar_url ? (
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                                    <img
                                      src={request.owner.avatar_url}
                                      alt={request.owner.display_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {request.owner.display_name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Owner:</span>
                                  <span className="ml-1 font-medium">{request.owner.display_name}</span>
                                </div>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Total Cost:</span>
                                <span className="font-semibold ml-1">{formatPrice(request.total_amount_cents)}</span>
                              </div>
                            </div>
                            
                            {/* Action Buttons Row */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/gear/listings/${request.listing_id}`)}
                              >
                                View Listing
                              </Button>
                              {request.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Implement cancel functionality
                                    toast.info('Cancel functionality coming soon');
                                  }}
                                >
                                  Cancel
                                </Button>
                              )}
                              {!['accepted', 'completed'].includes(request.status) && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteRentalRequest(request.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                          {request.message && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <p className="text-sm text-muted-foreground mb-1">Your message:</p>
                              <p className="text-sm">{request.message}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Sent Offers */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Purchase Offers ({offers.length})
                </h3>
                {offers.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Euro className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No purchase offers sent</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {offers.map((offer) => (
                      <Card key={offer.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            {/* Listing Image */}
                            <div className="flex-shrink-0">
                              {offer.listing.listing_images && offer.listing.listing_images.length > 0 ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={offer.listing.listing_images[0].url}
                                    alt={offer.listing.listing_images[0].alt_text || offer.listing.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                  <Euro className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base mb-1 truncate">
                                    {offer.listing.title}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="capitalize">{offer.listing.category}</span>
                                    <span>•</span>
                                    <span>Offer: {formatPrice(offer.offer_amount_cents)}</span>
                                  </div>
                                </div>
                                <Badge className={`${getStatusColor(offer.status)} flex items-center gap-1`}>
                                  {getStatusIcon(offer.status)}
                                  {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {/* User Info Row */}
                            <div className="flex items-center gap-4">
                              {/* Owner Avatar */}
                              <div className="flex items-center gap-2">
                                {offer.owner.avatar_url ? (
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                                    <img
                                      src={offer.owner.avatar_url}
                                      alt={offer.owner.display_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {offer.owner.display_name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Owner:</span>
                                  <span className="ml-1 font-medium">{offer.owner.display_name}</span>
                                </div>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Contact:</span>
                                <span className="ml-1 capitalize">{offer.contact_preference}</span>
                              </div>
                            </div>
                            
                            {/* Action Buttons Row */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/gear/listings/${offer.listing_id}`)}
                              >
                                View Listing
                              </Button>
                              {offer.status === 'accepted' && (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    // Navigate to the listing page with messaging enabled
                                    window.open(`/gear/listings/${offer.listing_id}`, '_blank');
                                  }}
                                  className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  Message Owner
                                </Button>
                              )}
                              {offer.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    // TODO: Implement withdraw functionality
                                    toast.info('Withdraw functionality coming soon');
                                  }}
                                >
                                  Withdraw
                                </Button>
                              )}
                              {!['accepted', 'completed'].includes(offer.status) && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteOffer(offer.id)}
                                >
                                  <Trash2 className="h-4 w-4 mr-1" />
                                  Delete
                                </Button>
                              )}
                            </div>
                          </div>
                          {offer.message && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <p className="text-sm text-muted-foreground mb-1">Your message:</p>
                              <p className="text-sm">{offer.message}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="received" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Received Rental Requests */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Rental Requests ({receivedRentalRequests.length})
                </h3>
                {receivedRentalRequests.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No rental requests received</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {receivedRentalRequests.map((request) => (
                      <Card key={request.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            {/* Listing Image */}
                            <div className="flex-shrink-0">
                              {request.listing.listing_images && request.listing.listing_images.length > 0 ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={request.listing.listing_images[0].url}
                                    alt={request.listing.listing_images[0].alt_text || request.listing.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                  <Calendar className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base mb-1 truncate">
                                    {request.listing.title}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="capitalize">{request.listing.category}</span>
                                    <span>•</span>
                                    <span>{request.quantity} item{request.quantity !== 1 ? 's' : ''}</span>
                                    <span>•</span>
                                    <span>{format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}</span>
                                  </div>
                                </div>
                                <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
                                  {getStatusIcon(request.status)}
                                  {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {/* User Info Row */}
                            <div className="flex items-center gap-4">
                              {/* Requester Avatar */}
                              <div className="flex items-center gap-2">
                                {request.requester.avatar_url ? (
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                                    <img
                                      src={request.requester.avatar_url}
                                      alt={request.requester.display_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {request.requester.display_name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Requester:</span>
                                  <span className="ml-1 font-medium">{request.requester.display_name}</span>
                                </div>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Total Cost:</span>
                                <span className="font-semibold ml-1">{formatPrice(request.total_amount_cents)}</span>
                              </div>
                            </div>
                            
                            {/* Action Buttons Row */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/gear/listings/${request.listing_id}`)}
                              >
                                View Listing
                              </Button>
                              {request.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleRentalRequestAction(request.id, 'accept')}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleRentalRequestAction(request.id, 'reject')}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {request.message && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <p className="text-sm text-muted-foreground mb-1">Requester's message:</p>
                              <p className="text-sm">{request.message}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* Received Offers */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Euro className="h-5 w-5" />
                  Purchase Offers ({receivedOffers.length})
                </h3>
                {receivedOffers.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Euro className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">No purchase offers received</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {receivedOffers.map((offer) => (
                      <Card key={offer.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start gap-3">
                            {/* Listing Image */}
                            <div className="flex-shrink-0">
                              {offer.listing.listing_images && offer.listing.listing_images.length > 0 ? (
                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted">
                                  <img
                                    src={offer.listing.listing_images[0].url}
                                    alt={offer.listing.listing_images[0].alt_text || offer.listing.title}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              ) : (
                                <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center">
                                  <Euro className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                            
                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base mb-1 truncate">
                                    {offer.listing.title}
                                  </CardTitle>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span className="capitalize">{offer.listing.category}</span>
                                    <span>•</span>
                                    <span>Offer: {formatPrice(offer.offer_amount_cents)}</span>
                                  </div>
                                </div>
                                <Badge className={`${getStatusColor(offer.status)} flex items-center gap-1`}>
                                  {getStatusIcon(offer.status)}
                                  {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {/* User Info Row */}
                            <div className="flex items-center gap-4">
                              {/* Offerer Avatar */}
                              <div className="flex items-center gap-2">
                                {offer.offerer.avatar_url ? (
                                  <div className="w-8 h-8 rounded-full overflow-hidden bg-muted">
                                    <img
                                      src={offer.offerer.avatar_url}
                                      alt={offer.offerer.display_name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                    <span className="text-sm font-medium text-muted-foreground">
                                      {offer.offerer.display_name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                                <div className="text-sm">
                                  <span className="text-muted-foreground">Offerer:</span>
                                  <span className="ml-1 font-medium">{offer.offerer.display_name}</span>
                                </div>
                              </div>
                              <div className="text-sm">
                                <span className="text-muted-foreground">Contact:</span>
                                <span className="ml-1 capitalize">{offer.contact_preference}</span>
                              </div>
                            </div>
                            
                            {/* Action Buttons Row */}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/gear/listings/${offer.listing_id}`)}
                              >
                                View Listing
                              </Button>
                              {offer.status === 'pending' && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => handleOfferAction(offer.id, 'accept')}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleOfferAction(offer.id, 'reject')}
                                  >
                                    Reject
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {offer.message && (
                            <div className="mt-3 p-3 bg-muted rounded-md">
                              <p className="text-sm text-muted-foreground mb-1">Offerer's message:</p>
                              <p className="text-sm">{offer.message}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rentals" className="space-y-4">
            {rentalRequests.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Rental Requests</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't made any rental requests yet.
                  </p>
                  <Button onClick={() => router.push('/gear')}>
                    Browse Equipment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {rentalRequests.map((request) => (
                  <Card key={request.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg mb-1 truncate">
                            {request.listing.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="capitalize">{request.listing.category}</span>
                            <span>•</span>
                            <span>{request.quantity} item{request.quantity !== 1 ? 's' : ''}</span>
                            <span>•</span>
                            <span>{format(new Date(request.start_date), 'MMM d')} - {format(new Date(request.end_date), 'MMM d, yyyy')}</span>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(request.status)} flex items-center gap-1`}>
                          {getStatusIcon(request.status)}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Total Cost:</span>
                            <span className="font-semibold ml-1">{formatPrice(request.total_amount_cents)}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Owner:</span>
                            <span className="ml-1">{request.owner.display_name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/gear/listings/${request.listing_id}`)}
                          >
                            View Listing
                          </Button>
                          {request.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement cancel functionality
                                toast.info('Cancel functionality coming soon');
                              }}
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>
                      {request.message && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground mb-1">Your message:</p>
                          <p className="text-sm">{request.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="offers" className="space-y-4">
            {offers.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Euro className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Purchase Offers</h3>
                  <p className="text-muted-foreground mb-4">
                    You haven't made any purchase offers yet.
                  </p>
                  <Button onClick={() => router.push('/gear')}>
                    Browse Equipment
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg mb-1 truncate">
                            {offer.listing.title}
                          </CardTitle>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="capitalize">{offer.listing.category}</span>
                            <span>•</span>
                            <span>Offer: {formatPrice(offer.offer_amount_cents)}</span>
                          </div>
                        </div>
                        <Badge className={`${getStatusColor(offer.status)} flex items-center gap-1`}>
                          {getStatusIcon(offer.status)}
                          {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="text-sm">
                            <span className="text-muted-foreground">Contact:</span>
                            <span className="ml-1 capitalize">{offer.contact_preference}</span>
                          </div>
                          <div className="text-sm">
                            <span className="text-muted-foreground">Owner:</span>
                            <span className="ml-1">{offer.owner.display_name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/gear/listings/${offer.listing_id}`)}
                          >
                            View Listing
                          </Button>
                          {offer.status === 'pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                // TODO: Implement withdraw functionality
                                toast.info('Withdraw functionality coming soon');
                              }}
                            >
                              Withdraw
                            </Button>
                          )}
                        </div>
                      </div>
                      {offer.message && (
                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm text-muted-foreground mb-1">Your message:</p>
                          <p className="text-sm">{offer.message}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MarketplaceLayout>
  );
}
