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
import RentalRequestForm from '@/components/marketplace/RentalRequestForm';
import MakeOfferForm from '@/components/marketplace/MakeOfferForm';

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
  listing_images?: Array<{
    id: string;
    path: string;
    url: string;
    sort_order: number;
    alt_text?: string;
    file_size?: number;
    mime_type?: string;
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [acceptedOffers, setAcceptedOffers] = useState<any[]>([]);
  const [recentMessages, setRecentMessages] = useState<any[]>([]);

  const fetchCurrentUser = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: userProfile } = await supabase
          .from('users_profile')
          .select('id, display_name, handle')
          .eq('user_id', session.user.id)
          .single();
        
        setCurrentUser(userProfile);
      }
    } catch (error) {
      console.error('Error fetching current user:', error);
    } finally {
      setUserLoading(false);
    }
  };

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

  const fetchAcceptedOffers = async () => {
    if (!params.id) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) return;
      
      const response = await fetch(`/api/marketplace/offers?listing_id=${params.id}&status=accepted`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        setAcceptedOffers(data.offers || []);
      }
    } catch (err) {
      console.error('Error fetching accepted offers:', err);
    }
  };

  const fetchRecentMessages = async () => {
    if (!params.id) return;
    
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      
      if (!token) return;
      
      const response = await fetch(`/api/marketplace/messages/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (response.ok) {
        // Get the 5 most recent messages
        const messages = data.messages || [];
        setRecentMessages(messages.slice(-5).reverse());
      }
    } catch (err) {
      console.error('Error fetching recent messages:', err);
    }
  };

  useEffect(() => {
    if (params.id) {
      fetchListing();
      fetchAcceptedOffers();
      fetchRecentMessages();
    }
    fetchCurrentUser();
  }, [params.id]);

  const isOwner = () => {
    return currentUser && listing && currentUser.id === listing.owner_id;
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'new': return 'bg-primary/10 text-primary';
      case 'like_new': return 'bg-primary/10 text-primary';
      case 'good': return 'bg-primary/10 text-primary';
      case 'fair': return 'bg-destructive/10 text-destructive';
      case 'poor': return 'bg-destructive/10 text-destructive';
      default: return 'bg-muted text-muted-foreground';
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
    if (listing?.listing_images && listing.listing_images.length > 0) {
      const sortedImages = listing.listing_images.sort((a, b) => a.sort_order - b.sort_order);
      return sortedImages[selectedImageIndex] || sortedImages[0];
    }
    return null;
  };

  const getPriceDisplay = () => {
    if (!listing) return null;

    if (listing.mode === 'rent') {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Euro className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">
              {listing.rent_day_cents ? formatPrice(listing.rent_day_cents) : 'N/A'}/day
            </span>
          </div>
          {listing.rent_week_cents && (
            <div className="text-sm text-muted-foreground">
              Weekly rate: {formatPrice(listing.rent_week_cents)}
            </div>
          )}
          {/* Rental Additional Costs */}
          <div className="space-y-1 pt-2 border-t border-border">
            {listing.retainer_mode !== 'none' && (
              <div className="text-sm text-muted-foreground">
                Retainer: {formatPrice(listing.retainer_cents)}
              </div>
            )}
            {listing.deposit_cents > 0 && (
              <div className="text-sm text-muted-foreground">
                Deposit: {formatPrice(listing.deposit_cents)}
              </div>
            )}
            {listing.retainer_mode === 'none' && listing.borrow_ok && (
              <div className="text-sm text-primary">
                Free to borrow
              </div>
            )}
          </div>
        </div>
      );
    } else if (listing.mode === 'sale') {
      return (
        <div className="flex items-center space-x-2">
          <Euro className="h-5 w-5 text-muted-foreground" />
          <span className="text-2xl font-bold">
            {listing.sale_price_cents ? formatPrice(listing.sale_price_cents) : 'N/A'}
          </span>
        </div>
      );
    } else if (listing.mode === 'both') {
      return (
        <div className="space-y-4">
          {/* Rent Section */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Rent</div>
            <div className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {listing.rent_day_cents ? formatPrice(listing.rent_day_cents) : 'N/A'}/day
              </span>
            </div>
            {listing.rent_week_cents && (
              <div className="text-sm text-muted-foreground">
                Weekly rate: {formatPrice(listing.rent_week_cents)}
              </div>
            )}
            {/* Rental Additional Costs */}
            <div className="space-y-1 pt-2 border-t border-border">
              {listing.retainer_mode !== 'none' && (
                <div className="text-sm text-muted-foreground">
                  Retainer: {formatPrice(listing.retainer_cents)}
                </div>
              )}
              {listing.deposit_cents > 0 && (
                <div className="text-sm text-muted-foreground">
                  Deposit: {formatPrice(listing.deposit_cents)}
                </div>
              )}
              {listing.retainer_mode === 'none' && listing.borrow_ok && (
                <div className="text-sm text-primary">
                  Free to borrow
                </div>
              )}
            </div>
          </div>
          
          {/* Sale Section */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-muted-foreground">Buy</div>
            <div className="flex items-center space-x-2">
              <Euro className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-bold">
                {listing.sale_price_cents ? formatPrice(listing.sale_price_cents) : 'N/A'}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const getRetainerInfo = () => {
    if (!listing) return null;

    if (listing.retainer_mode === 'none' && listing.borrow_ok) {
      return (
        <div className="flex items-center space-x-2 text-primary">
          <Shield className="h-4 w-4" />
          <span>Free to borrow</span>
        </div>
      );
    } else if (listing.retainer_mode !== 'none') {
      return (
        <div className="flex items-center space-x-2 text-primary">
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
              <div className="h-8 bg-muted rounded w-3/4"></div>
              <div className="h-64 bg-muted rounded"></div>
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
            <div className="space-y-4">
              <div className="h-32 bg-muted rounded"></div>
              <div className="h-20 bg-muted rounded"></div>
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
          <div className="text-destructive mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">Listing not found</h3>
          <p className="text-muted-foreground mb-4">{error || 'The listing you are looking for does not exist.'}</p>
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
        <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Link href="/gear" className="hover:text-foreground">
            Marketplace
          </Link>
          <span>/</span>
          <span className="text-foreground">{listing.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Badges */}
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-4">{listing.title}</h1>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <Badge className={`${getConditionColor(listing.condition)} capitalize`}>
                  {listing.condition.replace('_', ' ')}
                </Badge>
                <Badge variant="outline" className="capitalize">{listing.category}</Badge>
                {getModeBadges()}
                {listing.verified_only && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <Shield className="h-3 w-3 mr-1" />
                    Verified Only
                  </Badge>
                )}
              </div>
            </div>

            {/* Images */}
            {listing.listing_images && listing.listing_images.length > 0 ? (
              <div className="space-y-4">
                <div className="relative w-full h-64 sm:h-80 md:h-96 bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={getPrimaryImage()!.url}
                    alt={getPrimaryImage()!.alt_text || listing.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 50vw"
                  />
                </div>
                
                {listing.listing_images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {listing.listing_images.slice(0, 4).map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImageIndex(index)}
                        className={`relative w-full h-20 bg-muted rounded-lg overflow-hidden border-2 transition-all ${
                          selectedImageIndex === index 
                            ? 'border-primary ring-2 ring-primary ring-offset-2' 
                            : 'border-transparent hover:border-muted-foreground/50'
                        }`}
                      >
                        <Image
                          src={image.url}
                          alt={image.alt_text || listing.title}
                          fill
                          className="object-cover rounded-md"
                          sizes="(max-width: 768px) 25vw, (max-width: 1200px) 16vw, 12vw"
                          onError={(e) => {
                            console.error('Thumbnail image failed to load:', image.url, e);
                          }}
                          onLoad={() => {
                            console.log('Thumbnail image loaded successfully:', image.url);
                          }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="relative w-full h-64 sm:h-80 md:h-96 bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-6xl mb-4">📷</div>
                  <div className="text-lg font-medium">No images available</div>
                  <div className="text-sm">Images will appear here when uploaded</div>
                </div>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div>
                <h2 className="text-xl font-semibold text-foreground mb-3">Description</h2>
                <p className="text-foreground whitespace-pre-wrap">{listing.description}</p>
              </div>
            )}

            {/* Details */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="availability">Availability</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
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
                        <span className="text-sm font-medium text-muted-foreground">Category</span>
                        <p className="text-foreground capitalize">{listing.category}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Condition</span>
                        <p className="text-foreground capitalize">{listing.condition.replace('_', ' ')}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Quantity</span>
                        <p className="text-foreground">{listing.quantity}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Location</span>
                        <p className="text-foreground">
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
                          <div key={block.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
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
                      <p className="text-muted-foreground">No availability blocks set</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Accepted Offers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {acceptedOffers.length > 0 ? (
                      <div className="space-y-3">
                        {acceptedOffers.map((offer) => (
                          <div key={offer.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <Euro className="h-4 w-4 text-green-600" />
                              </div>
                              <div>
                                <p className="font-medium">€{(offer.offer_amount_cents / 100).toFixed(2)}</p>
                                <p className="text-sm text-muted-foreground">
                                  by {offer.offerer?.display_name || 'Unknown User'}
                                </p>
                              </div>
                            </div>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Accepted
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No accepted offers yet</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Messages</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {recentMessages.length > 0 ? (
                      <div className="space-y-3">
                        {recentMessages.map((message) => (
                          <div key={message.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <MessageCircle className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <p className="font-medium text-sm">
                                  {message.from_user?.display_name || 'Unknown User'}
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(message.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {message.body}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-4">No recent messages</p>
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
                            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                              <span className="text-lg font-medium text-muted-foreground">
                                {listing.users_profile.display_name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-foreground">
                              {listing.users_profile.display_name}
                            </h3>
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-muted-foreground">@{listing.users_profile.handle}</span>
                              {listing.users_profile.verified_id && (
                                <Shield className="h-4 w-4 text-primary" />
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {listing.users_profile.bio && (
                          <p className="text-foreground">{listing.users_profile.bio}</p>
                        )}
                        
                        {listing.users_profile.city && (
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{listing.users_profile.city}</span>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>Member since {new Date(listing.users_profile.created_at).toLocaleDateString()}</span>
                        </div>

                        {/* Safety Features */}
                        <div className="pt-4 border-t border-border">
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
                      <p className="text-muted-foreground">Owner information not available</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 overflow-hidden">
            {/* Pricing Card */}
            <Card>
              <CardHeader>
                <CardTitle>Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {getPriceDisplay()}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-6 space-y-3 overflow-hidden">
                {isOwner() ? (
                  // Owner-specific actions
                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      onClick={() => router.push(`/gear/listings/${listing.id}/edit`)}
                    >
                      Edit Listing
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => router.push(`/gear/my-listings`)}
                    >
                      Manage Listings
                    </Button>
                  </div>
                ) : (
                  // Non-owner actions
                  <div className="space-y-3">
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
                  </div>
                )}
                
                <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2 sm:space-y-0">
                  {!isOwner() && (
                    <Button 
                      variant="outline" 
                      className="flex-1 min-w-0"
                      onClick={() => setShowMessaging(true)}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Message
                    </Button>
                  )}
                  <Button 
                    variant="outline" 
                    className="flex-1 min-w-0"
                    onClick={() => {
                      // TODO: Implement save functionality
                      toast.info('Save functionality coming soon');
                    }}
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    Save
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 min-w-0"
                    onClick={async () => {
                      if (navigator.share) {
                        try {
                          await navigator.share({
                            title: listing.title,
                            text: `Check out this equipment listing: ${listing.title}`,
                            url: window.location.href
                          });
                        } catch (error) {
                          // Fallback to clipboard
                          try {
                            await navigator.clipboard.writeText(window.location.href);
                            toast.success('Link copied to clipboard');
                          } catch (clipboardError) {
                            toast.error('Failed to copy link');
                          }
                        }
                      } else {
                        // Fallback to clipboard
                        try {
                          await navigator.clipboard.writeText(window.location.href);
                          toast.success('Link copied to clipboard');
                        } catch (error) {
                          toast.error('Failed to copy link');
                        }
                      }
                    }}
                  >
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
                      href={`/gear/listings/${otherListing.id}`}
                      className="block p-3 border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      <h4 className="font-medium text-foreground line-clamp-1">
                        {otherListing.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {otherListing.category} • {otherListing.mode}
                      </p>
                      <p className="text-sm font-medium text-foreground">
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border">
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

      {/* Rental Request Modal */}
      {showRentalForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Request Rental</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowRentalForm(false)}>
                  ×
                </Button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <RentalRequestForm 
                listing={listing}
                onClose={() => setShowRentalForm(false)}
                onSuccess={() => {
                  setShowRentalForm(false);
                  // Optionally refresh data or show success message
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Make Offer Modal */}
      {showOfferForm && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Make Offer</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowOfferForm(false)}>
                  ×
                </Button>
              </div>
            </div>
            <div className="p-4 sm:p-6">
              <MakeOfferForm 
                listing={listing}
                onClose={() => setShowOfferForm(false)}
                onSuccess={() => {
                  setShowOfferForm(false);
                  // Optionally refresh data or show success message
                }}
              />
            </div>
          </div>
        </div>
      )}
    </MarketplaceLayout>
  );
}
