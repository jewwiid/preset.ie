'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import MarketplaceLayout from '@/components/marketplace/MarketplaceLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Calendar, Euro, Star, Shield, User, MessageCircle, Heart, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import MarketplaceMessaging from '@/components/marketplace/MarketplaceMessaging';
import SafetyFeatures from '@/components/marketplace/SafetyFeatures';
import VerificationBadge from '@/components/marketplace/VerificationBadge';
import SafetyDisclaimer from '@/components/marketplace/SafetyDisclaimer';

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
  latitude?: number;
  longitude?: number;
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
    bio?: string;
    city?: string;
    verified_id?: boolean;
    created_at: string;
  };
  images?: Array<{
    id: string;
    path: string;
    sort_order: number;
    alt_text?: string;
  }>;
  availability?: Array<{
    id: string;
    start_date: string;
    end_date: string;
    kind: 'blackout' | 'reserved';
    notes?: string;
  }>;
  owner_other_listings?: Array<{
    id: string;
    title: string;
    category: string;
    mode: 'rent' | 'sale' | 'both';
    rent_day_cents?: number;
    sale_price_cents?: number;
    created_at: string;
  }>;
}

export default function ListingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showRentalForm, setShowRentalForm] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [showMessaging, setShowMessaging] = useState(false);

  const fetchListing = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/marketplace/listings/${params.id}`);
      const data = await response.json();

      if (response.ok) {
        setListing(data.listing);
      } else {
        setError(data.error || 'Failed to fetch listing');
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchListing();
    }
  }, [params.id]);

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-green-100 text-green-800';
      case 'like_new': return 'bg-blue-100 text-blue-800';
      case 'good': return 'bg-yellow-100 text-yellow-800';
      case 'fair': return 'bg-orange-100 text-orange-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getModeBadges = () => {
    const badges = [];
    if (listing?.mode === 'rent' || listing?.mode === 'both') {
      badges.push(
        <Badge key="rent" variant="secondary">
          Rent
        </Badge>
      );
    }
    if (listing?.mode === 'sale' || listing?.mode === 'both') {
      badges.push(
        <Badge key="sale" variant="outline">
          Sale
        </Badge>
      );
    }
    return badges;
  };

  const getPrimaryImage = () => {
    if (listing?.images && listing.images.length > 0) {
      const sortedImages = listing.images.sort((a, b) => a.sort_order - b.sort_order);
      return sortedImages[selectedImageIndex] || sortedImages[0];
    }
    return null;
  };

  const getPriceDisplay = () => {
    if (!listing) return null;

    if (listing.mode === 'rent' || listing.mode === 'both') {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Euro className="h-5 w-5 text-gray-500" />
            <span className="text-2xl font-bold">
              {listing.rent_day_cents ? formatPrice(listing.rent_day_cents) : 'N/A'}/day
            </span>
          </div>
          {listing.rent_week_cents && (
            <div className="text-sm text-gray-500">
              Weekly rate: {formatPrice(listing.rent_week_cents)}
            </div>
          )}
        </div>
      );
    } else if (listing.mode === 'sale') {
      return (
        <div className="flex items-center space-x-2">
          <Euro className="h-5 w-5 text-gray-500" />
          <span className="text-2xl font-bold">
            {listing.sale_price_cents ? formatPrice(listing.sale_price_cents) : 'N/A'}
          </span>
        </div>
      );
    }
    return null;
  };

  const getRetainerInfo = () => {
    if (!listing) return null;

    if (listing.retainer_mode === 'none' && listing.borrow_ok) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <Shield className="h-4 w-4" />
          <span>Free to borrow</span>
        </div>
      );
    } else if (listing.retainer_mode !== 'none') {
      return (
        <div className="flex items-center space-x-2 text-blue-600">
          <Shield className="h-4 w-4" />
          <span>€{formatPrice(listing.retainer_cents)} retainer</span>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <MarketplaceLayout>
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  if (error || !listing) {
    return (
      <MarketplaceLayout>
        <div className="text-center py-12">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Listing not found</h3>
          <p className="text-gray-500 mb-4">{error || 'The listing you are looking for does not exist.'}</p>
          <Button onClick={() => router.push('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="space-y-8">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link href="/marketplace" className="hover:text-gray-700">
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-gray-900">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Badges */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className={getConditionColor(listing.condition)}>
                  {listing.condition.replace('_', ' ')}
                </Badge>
                <Badge variant="outline">{listing.category}</Badge>
                {getModeBadges()}
                {listing.verified_only && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Only
                  </Badge>
                )}
              </div>
            </div>

            {/* Images */}
            {listing.images && listing.images.length > 0 && (
              <div className="space-y-4">
                <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden">
                  <Image
                    src={getPrimaryImage()!.path}
                    alt={getPrimaryImage()!.alt_text || listing.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                  />
                </div>
                
                {listing.images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {listing.images.slice(0, 4).map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`aspect-w-16 aspect-h-9 bg-gray-200 rounded-lg overflow-hidden ${
                          selectedImageIndex === index ? 'ring-2 ring-blue-500' : ''
                        }`}
                      >
                        <Image
                          src={image.path}
                          alt={image.alt_text || listing.title}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 25vw, (max-width: 1200px) 16vw, 12vw"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Description</h2>
                <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Details */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="owner">Owner</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Equipment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Category</span>
                        <p className="text-gray-900">{listing.category}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Condition</span>
                        <p className="text-gray-900">{listing.condition.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Quantity</span>
                        <p className="text-gray-900">{listing.quantity}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Location</span>
                        <p className="text-gray-900">
                          {listing.location_city}
                          {listing.location_country && `, ${listing.location_country}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="availability" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Availability</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {listing.availability && listing.availability.length > 0 ? (
                      <div className="space-y-2">
                        {listing.availability.map((block) => (
                          <div key={block.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-gray-500" />
                              <span className="text-sm">
                                {new Date(block.start_date).toLocaleDateString()} - {new Date(block.end_date).toLocaleDateString()}
                              </span>
                            </div>
                            <Badge variant={block.kind === 'blackout' ? 'destructive' : 'secondary'}>
                              {block.kind}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500">No availability blocks set</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="owner" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Owner Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {listing.users_profile ? (
                      <div className="space-y-4">
                        <div className="flex items-center space-x-3">
                          {listing.users_profile.avatar_url ? (
                            <Image
                              src={listing.users_profile.avatar_url}
                              alt={listing.users_profile.display_name}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-lg font-medium text-gray-600">
                                {listing.users_profile.display_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {listing.users_profile.display_name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">@{listing.users_profile.handle}</span>
                              {listing.users_profile.verified_id && (
                                <Shield className="h-4 w-4 text-blue-500" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {listing.users_profile.bio && (
                          <p className="text-gray-700">{listing.users_profile.bio}</p>
                        )}
                        
                        {listing.users_profile.city && (
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <MapPin className="h-4 w-4" />
                            <span>{listing.users_profile.city}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <User className="h-4 w-4" />
                          <span>Member since {new Date(listing.users_profile.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Safety Features */}
                        <div className="pt-4 border-t border-gray-200">
                          <SafetyFeatures 
                            user={{
                              id: listing.users_profile.id,
                              display_name: listing.users_profile.display_name,
                              handle: listing.users_profile.handle,
                              avatar_url: listing.users_profile.avatar_url,
                              verified_id: !!listing.users_profile.verified_id,
                              verified_email: true, // Assuming email is verified if they have an account
                              verified_phone: false, // Would need to add this to the API
                              account_age_days: Math.floor((Date.now() - new Date(listing.users_profile.created_at).getTime()) / (1000 * 60 * 60 * 24)),
                              total_reviews: 0, // Would need to add this to the API
                              average_rating: 0, // Would need to add this to the API
                              location: listing.users_profile.city,
                              joined_date: listing.users_profile.created_at
                            }}
                            onMessage={() => setShowMessaging(true)}
                            onReport={() => {
                              // TODO: Implement report functionality
                              toast.info('Report functionality coming soon');
                            }}
                          />
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Owner information not available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getPriceDisplay()}
                {getRetainerInfo()}
                {listing.deposit_cents > 0 && (
                  <div className="text-sm text-gray-500">
                    Deposit: {formatPrice(listing.deposit_cents)}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-6 space-y-3">
                {(listing.mode === 'rent' || listing.mode === 'both') && (
                  <Button 
                    className="w-full" 
                    onClick={() => setShowRentalForm(true)}
                  >
                    Request Rental
                  </Button>
                )}
                
                {(listing.mode === 'sale' || listing.mode === 'both') && (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => setShowOfferForm(true)}
                  >
                    Make Offer
                  </Button>
                )}
                
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setShowMessaging(true)}
                  >
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Message
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Other Listings */}
            {listing.owner_other_listings && listing.owner_other_listings.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Other Listings by Owner</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {listing.owner_other_listings.map((otherListing) => (
                    <Link
                      key={otherListing.id}
                      href={`/marketplace/listings/${otherListing.id}`}
                      className="block p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h4 className="font-medium text-gray-900 line-clamp-1">
                        {otherListing.title}
                      </h4>
                      <p className="text-sm text-gray-500">
                        {otherListing.category} • {otherListing.mode}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        {otherListing.rent_day_cents && formatPrice(otherListing.rent_day_cents)}/day
                        {otherListing.sale_price_cents && ` • ${formatPrice(otherListing.sale_price_cents)}`}
                      </p>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Messaging Modal */}
      {showMessaging && listing.users_profile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Message Owner</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowMessaging(false)}>
                  ×
                </Button>
              </div>
            </div>
            <div className="p-4">
              <MarketplaceMessaging
                listingId={listing.id}
                recipientId={listing.users_profile.id}
                recipientName={listing.users_profile.display_name}
                recipientHandle={listing.users_profile.handle}
                recipientAvatar={listing.users_profile.avatar_url}
                context={{
                  type: 'listing',
                  id: listing.id,
                  title: listing.title
                }}
                onClose={() => setShowMessaging(false)}
              />
            </div>
          </div>
        </div>
      )}
    </MarketplaceLayout>
  );
}
