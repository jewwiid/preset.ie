'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Search, Package, MapPin, Star, CheckCircle } from 'lucide-react';

interface GearRequest {
  id: string;
  category: string;
  equipment_spec?: string;
  quantity: number;
  borrow_preferred: boolean;
  retainer_acceptable: boolean;
  max_daily_rate_cents?: number;
}

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  condition: string;
  rent_day_cents?: number;
  sale_price_cents?: number;
  location_city?: string;
  location_country?: string;
  owner: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    verified: boolean;
    rating?: number;
  };
}

interface LinkGearRequestModalProps {
  gearRequest: GearRequest;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function LinkGearRequestModal({
  gearRequest,
  projectId,
  isOpen,
  onClose,
  onSuccess
}: LinkGearRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Pre-populate search with gear request category
      setSearchQuery(gearRequest.category);
      searchListings(gearRequest.category);
    }
  }, [isOpen, gearRequest.category]);

  const searchListings = async (query: string) => {
    if (!query.trim()) return;

    setSearching(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/listings?search=${encodeURIComponent(query)}&limit=20`);

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to search listings');
      }
    } catch (err) {
      console.error('Error searching listings:', err);
      setError('Failed to search listings');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchListings(searchQuery);
  };

  const handleLinkListing = async () => {
    if (!selectedListing) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/collab/projects/${projectId}/marketplace/link`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          gearRequestId: gearRequest.id,
          listingId: selectedListing.id
        })
      });

      if (response.ok) {
        onSuccess?.();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to link listing');
      }
    } catch (err) {
      console.error('Error linking listing:', err);
      setError('Failed to link listing');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const isCompatible = (listing: Listing) => {
    // Check category compatibility
    const categoryMatch = listing.category.toLowerCase().includes(gearRequest.category.toLowerCase()) ||
                         gearRequest.category.toLowerCase().includes(listing.category.toLowerCase());

    // Check price compatibility for rentals
    const priceCompatible = !gearRequest.borrow_preferred || 
                           !gearRequest.max_daily_rate_cents || 
                           !listing.rent_day_cents ||
                           listing.rent_day_cents <= gearRequest.max_daily_rate_cents * 1.2;

    return categoryMatch && priceCompatible;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Link to Existing Listing</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Gear Request Info */}
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <Package className="h-4 w-4 mr-2 text-blue-600" />
              <h3 className="font-medium text-blue-900">Linking to Gear Request</h3>
            </div>
            <div className="space-y-1 text-sm text-blue-800">
              <div><strong>Category:</strong> {gearRequest.category}</div>
              {gearRequest.equipment_spec && (
                <div><strong>Specification:</strong> {gearRequest.equipment_spec}</div>
              )}
              <div><strong>Quantity:</strong> {gearRequest.quantity}</div>
              <div><strong>Preference:</strong> {gearRequest.borrow_preferred ? 'Borrow preferred' : 'Rent preferred'}</div>
              {gearRequest.max_daily_rate_cents && (
                <div><strong>Max Rate:</strong> {formatPrice(gearRequest.max_daily_rate_cents)}/day</div>
              )}
            </div>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search for equipment listings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button type="submit" disabled={searching || !searchQuery.trim()}>
                {searching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Searching...
                  </>
                ) : (
                  'Search'
                )}
              </Button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Listings */}
          {listings.length > 0 && (
            <div className="space-y-4">
              <h3 className="font-medium">Available Listings ({listings.length})</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {listings.map((listing) => {
                  const compatible = isCompatible(listing);
                  return (
                    <div
                      key={listing.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedListing?.id === listing.id
                          ? 'border-blue-500 bg-blue-50'
                          : compatible
                          ? 'border-green-200 bg-green-50 hover:bg-green-100'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                      onClick={() => setSelectedListing(listing)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium">{listing.title}</h4>
                            <Badge variant="outline" className="text-xs">
                              {listing.condition}
                            </Badge>
                            {compatible && (
                              <Badge className="text-xs bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Compatible
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{listing.description}</p>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="font-medium">{listing.category}</span>
                            {listing.rent_day_cents && (
                              <span className="text-green-600 font-medium">
                                {formatPrice(listing.rent_day_cents)}/day
                              </span>
                            )}
                            {listing.sale_price_cents && (
                              <span className="text-blue-600 font-medium">
                                {formatPrice(listing.sale_price_cents)} total
                              </span>
                            )}
                            {(listing.location_city || listing.location_country) && (
                              <div className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {[listing.location_city, listing.location_country].filter(Boolean).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3 ml-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={listing.owner.avatar_url} />
                            <AvatarFallback>
                              {listing.owner.display_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="text-sm">
                            <div className="flex items-center space-x-1">
                              <span className="font-medium">{listing.owner.display_name}</span>
                              {listing.owner.verified && (
                                <Badge variant="secondary" className="text-xs">Verified</Badge>
                              )}
                            </div>
                            {listing.owner.rating && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Star className="h-3 w-3 mr-1 fill-current" />
                                {listing.owner.rating.toFixed(1)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {listings.length === 0 && !searching && searchQuery && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Listings Found</h3>
              <p className="text-gray-500">Try adjusting your search terms or create a new listing instead.</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleLinkListing}
              disabled={loading || !selectedListing}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Linking...
                </>
              ) : (
                'Link Listing'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
