'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import MarketplaceLayout from '@/components/marketplace/MarketplaceLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Euro, 
  Calendar, 
  MapPin,
  Package,
  ShoppingBag,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  mode: 'rent' | 'sale' | 'both';
  rent_day_cents?: number;
  rent_week_cents?: number;
  sale_price_cents?: number;
  status: 'active' | 'inactive' | 'archived';
  location_city?: string;
  location_country?: string;
  created_at: string;
  updated_at: string;
  listing_images?: Array<{
    id: string;
    url: string;
    alt_text?: string;
  }>;
}

export default function MyListingsPage() {
  const { user, session } = useAuth();
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('Fetching my listings with session:', !!session, 'token:', !!session?.access_token);

      const response = await fetch('/api/equipment/listings?my_listings=true', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      console.log('My listings response status:', response.status);

      const data = await response.json();
      console.log('My listings response data:', data);

      if (response.ok) {
        setListings(data.listings || []);
      } else {
        setError(data.error || 'Failed to fetch listings');
      }
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        toast.success('Listing deleted successfully');
        setListings(listings.filter(listing => listing.id !== listingId));
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to delete listing');
      }
    } catch (err) {
      console.error('Error deleting listing:', err);
      toast.error('An unexpected error occurred');
    }
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-primary/10 text-primary';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'archived':
        return 'bg-muted text-muted-foreground';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!user) {
    return (
      <MarketplaceLayout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view your listings</h2>
            <p className="text-muted-foreground">You need to be signed in to access your marketplace listings.</p>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Listings</h1>
                <p className="text-muted-foreground mt-2">Manage your marketplace listings</p>
              </div>
              <Button asChild>
                  <Link href="/gear/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Listing
                </Link>
              </Button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Loading your listings...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">Error loading listings</h2>
                <p className="text-muted-foreground mb-4">{error}</p>
                <Button onClick={fetchMyListings}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-foreground mb-2">No listings yet</h2>
                <p className="text-muted-foreground mb-4">Create your first marketplace listing to get started.</p>
                <Button asChild>
                  <Link href="/gear/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Listing
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <Card key={listing.id} className="overflow-hidden">
                  {/* Image */}
                  <div className="aspect-w-16 aspect-h-9 bg-muted">
                    {listing.listing_images && listing.listing_images.length > 0 ? (
                      <img
                        src={listing.listing_images[0].url}
                        alt={listing.listing_images[0].alt_text || listing.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-foreground line-clamp-2">
                        {listing.title}
                      </h3>
                      <Badge className={`ml-2 ${getStatusColor(listing.status)}`}>
                        {listing.status}
                      </Badge>
                    </div>

                    {/* Description */}
                    {listing.description && (
                      <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Euro className="h-4 w-4 mr-2" />
                        <span className="font-medium">
                          {listing.mode === 'rent' || listing.mode === 'both' 
                            ? formatPrice(listing.rent_day_cents || 0)
                            : formatPrice(listing.sale_price_cents || 0)
                          }
                        </span>
                        <span className="ml-1 text-muted-foreground/70">
                          {listing.mode === 'rent' ? '/day' : 
                           listing.mode === 'sale' ? 'one-time' : 
                           listing.mode === 'both' ? '/day' : 'one-time'}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Package className="h-4 w-4 mr-2" />
                        <span className="capitalize">{listing.category}</span>
                      </div>

                      {(listing.location_city || listing.location_country) && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>
                            {[listing.location_city, listing.location_country]
                              .filter(Boolean)
                              .join(', ')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created {formatDate(listing.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/gear/listings/${listing.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/gear/listings/${listing.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteListing(listing.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </MarketplaceLayout>
  );
}
