'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ListingEnhancementModal from '@/components/marketplace/ListingEnhancementModal';
import EnhancedListingCard from '@/components/marketplace/EnhancedListingCard';
import { Plus, Star, Zap, Crown, TrendingUp } from 'lucide-react';

// Mock data for demonstration
const mockListings = [
  {
    id: '1',
    title: 'Professional Camera Equipment Rental',
    description: 'High-end camera gear for professional photography sessions. Includes lenses, lighting, and accessories.',
    price_cents: 5000, // €50/day
    images: [{ url: '/placeholder-camera.jpg', alt_text: 'Camera equipment' }],
    current_enhancement_type: 'premium_bump',
    enhancement_expires_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days from now
    premium_badge: true,
    verified_badge: true,
    boost_level: 3,
    owner: {
      display_name: 'John Photographer',
      verified_id: true
    },
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Studio Lighting Setup',
    description: 'Complete studio lighting package with softboxes, stands, and modifiers.',
    price_cents: 3000, // €30/day
    images: [{ url: '/placeholder-lighting.jpg', alt_text: 'Studio lighting' }],
    current_enhancement_type: 'priority_bump',
    enhancement_expires_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    premium_badge: false,
    verified_badge: true,
    boost_level: 2,
    owner: {
      display_name: 'Sarah Studios',
      verified_id: true
    },
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Basic Photography Props',
    description: 'Collection of photography props and backgrounds for creative shoots.',
    price_cents: 1500, // €15/day
    images: [{ url: '/placeholder-props.jpg', alt_text: 'Photography props' }],
    current_enhancement_type: 'basic_bump',
    enhancement_expires_at: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours from now
    premium_badge: false,
    verified_badge: false,
    boost_level: 1,
    owner: {
      display_name: 'Mike Props',
      verified_id: false
    },
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    title: 'Drone Photography Package',
    description: 'Professional drone with camera for aerial photography and videography.',
    price_cents: 8000, // €80/day
    images: [{ url: '/placeholder-drone.jpg', alt_text: 'Drone equipment' }],
    current_enhancement_type: undefined,
    enhancement_expires_at: undefined,
    premium_badge: false,
    verified_badge: false,
    boost_level: 0,
    owner: {
      display_name: 'Alex Aerial',
      verified_id: false
    },
    created_at: new Date().toISOString()
  }
];

export default function EnhancementsDemoPage() {
  const [listings, setListings] = useState(mockListings);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<'FREE' | 'PLUS' | 'PRO'>('FREE');

  const handleEnhanceListing = (listingId: string) => {
    setSelectedListingId(listingId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedListingId(null);
  };

  const getEnhancementStats = () => {
    const total = listings.length;
    const enhanced = listings.filter(l => l.current_enhancement_type).length;
    const premium = listings.filter(l => l.current_enhancement_type === 'premium_bump').length;
    const priority = listings.filter(l => l.current_enhancement_type === 'priority_bump').length;
    const basic = listings.filter(l => l.current_enhancement_type === 'basic_bump').length;

    return { total, enhanced, premium, priority, basic };
  };

  const stats = getEnhancementStats();

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Marketplace Enhancement System Demo
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            See how listing enhancements work with subscription benefits
          </p>
          
          {/* Subscription Tier Selector */}
          <div className="flex justify-center space-x-4 mb-6">
            <Button
              variant={userSubscriptionTier === 'FREE' ? 'default' : 'outline'}
              onClick={() => setUserSubscriptionTier('FREE')}
            >
              Free Tier
            </Button>
            <Button
              variant={userSubscriptionTier === 'PLUS' ? 'default' : 'outline'}
              onClick={() => setUserSubscriptionTier('PLUS')}
            >
              Plus Tier (1 Priority Bump)
            </Button>
            <Button
              variant={userSubscriptionTier === 'PRO' ? 'default' : 'outline'}
              onClick={() => setUserSubscriptionTier('PRO')}
            >
              Pro Tier (3 Premium Bumps)
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Listings</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.enhanced}</div>
              <div className="text-sm text-muted-foreground">Enhanced</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary-600">{stats.premium}</div>
              <div className="text-sm text-muted-foreground">Premium</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">{stats.priority}</div>
              <div className="text-sm text-muted-foreground">Priority</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-muted-foreground">{stats.basic}</div>
              <div className="text-sm text-muted-foreground">Basic</div>
            </CardContent>
          </Card>
        </div>

        {/* Enhancement Options */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Star className="w-5 h-5 mr-2 text-primary-600" />
              Enhancement Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded-lg p-3 mb-3">
                  <TrendingUp className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="font-semibold">Basic Bump</h3>
                <p className="text-sm text-muted-foreground mb-2">€1 for 1 day</p>
                <p className="text-xs text-muted-foreground">Bumps to top of basic ads</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="bg-gradient-to-r from-purple-500 to-purple-700 text-white rounded-lg p-3 mb-3">
                  <Zap className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="font-semibold">Priority Bump</h3>
                <p className="text-sm text-muted-foreground mb-2">€5 for 3 days</p>
                <p className="text-xs text-muted-foreground">Above basic listings</p>
                {userSubscriptionTier === 'PLUS' && (
                  <Badge className="bg-primary-100 text-primary-800 mt-2">Included in Plus</Badge>
                )}
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-lg p-3 mb-3">
                  <Crown className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="font-semibold">Premium Bump</h3>
                <p className="text-sm text-muted-foreground mb-2">€7 for 7 days</p>
                <p className="text-xs text-muted-foreground">Top placement with badge</p>
                {userSubscriptionTier === 'PRO' && (
                  <Badge className="bg-primary-100 text-primary-800 mt-2">Included in Pro</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <EnhancedListingCard
              key={listing.id}
              listing={listing}
              onEnhance={handleEnhanceListing}
              showEnhanceButton={true}
            />
          ))}
        </div>

        {/* Enhancement Modal */}
        {selectedListingId && (
          <ListingEnhancementModal
            listingId={selectedListingId}
            isOpen={isModalOpen}
            onClose={handleModalClose}
            userSubscriptionTier={userSubscriptionTier}
          />
        )}
      </div>
    </div>
  );
}
