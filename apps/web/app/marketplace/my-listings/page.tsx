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
  mode: 'rent' | 'sell';
  price_cents: number;
  status: 'active' | 'inactive' | 'archived';
  location?: string;
  created_at: string;
  updated_at: string;
  images?: Array<{
    id: string;
    url: string;
    alt_text?: string;
  }>;
}

export default function MyListingsPage() {
  const { user } = useAuth();
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

      const response = await fetch('/api/marketplace/listings?my_listings=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      const data = await response.json();

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
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
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
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!user) {
    return (
      <MarketplaceLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view your listings</h2>
            <p className="text-gray-600">You need to be signed in to access your marketplace listings.</p>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Listings</h1>
                <p className="text-gray-600 mt-2">Manage your marketplace listings</p>
              </div>
              <Button asChild>
                <Link href="/marketplace/create">
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
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading your listings...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading listings</h2>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={fetchMyListings}>
                  Try Again
                </Button>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No listings yet</h2>
                <p className="text-gray-600 mb-4">Create your first marketplace listing to get started.</p>
                <Button asChild>
                  <Link href="/marketplace/create">
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
                  <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                    {listing.images && listing.images.length > 0 ? (
                      <img
                        src={listing.images[0].url}
                        alt={listing.images[0].alt_text || listing.title}
                        className="w-full h-48 object-cover"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                        <Package className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    {/* Title and Status */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                        {listing.title}
                      </h3>
                      <Badge className={`ml-2 ${getStatusColor(listing.status)}`}>
                        {listing.status}
                      </Badge>
                    </div>

                    {/* Description */}
                    {listing.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {listing.description}
                      </p>
                    )}

                    {/* Details */}
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Euro className="h-4 w-4 mr-2" />
                        <span className="font-medium">{formatPrice(listing.price_cents)}</span>
                        <span className="ml-1 text-gray-500">
                          {listing.mode === 'rent' ? '/day' : 'one-time'}
                        </span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-600">
                        <Package className="h-4 w-4 mr-2" />
                        <span className="capitalize">{listing.category}</span>
                      </div>

                      {listing.location && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2" />
                          <span>{listing.location}</span>
                        </div>
                      )}

                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created {formatDate(listing.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/marketplace/listings/${listing.id}`}>
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="flex-1">
                        <Link href={`/marketplace/listings/${listing.id}/edit`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Link>
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteListing(listing.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
