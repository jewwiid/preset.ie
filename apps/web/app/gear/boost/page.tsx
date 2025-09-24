'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import ListingEnhancementModal from '@/components/marketplace/ListingEnhancementModal';
import EnhancedListingCard from '@/components/marketplace/EnhancedListingCard';
import { Plus, Star, Zap, Crown, TrendingUp } from 'lucide-react';

// Interface for listing data
interface Listing {
  id: string;
  title: string;
  description: string;
  price_cents: number;
  images: Array<{ url: string; alt_text?: string }>;
  current_enhancement_type?: string;
  enhancement_expires_at?: string;
  premium_badge?: boolean;
  verified_badge?: boolean;
  boost_level: number;
  owner?: {
    display_name: string;
    verified_id?: boolean;
  };
  created_at: string;
}

export default function BoostPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedListingId, setSelectedListingId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<'FREE' | 'PLUS' | 'PRO'>('FREE');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's listings
  useEffect(() => {
    const fetchUserListings = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/equipment/listings?owner_only=true');
        if (response.ok) {
          const data = await response.json();
          setListings(data.listings || []);
        } else {
          setError('Failed to fetch listings');
        }
      } catch (err) {
        console.error('Error fetching listings:', err);
        setError('Failed to fetch listings');
      } finally {
        setLoading(false);
      }
    };

    fetchUserListings();
  }, []);

  const handleEnhanceListing = (listingId: string) => {
    setSelectedListingId(listingId);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedListingId(null);
  };

  const getEnhancementStats = () => {
    if (loading) {
      return { total: 0, enhanced: 0, premium: 0, priority: 0, basic: 0 };
    }
    
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
            Boost Your Listings
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Increase visibility and get more bookings with listing boosts
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
              Plus Tier (1 Priority Boost)
            </Button>
            <Button
              variant={userSubscriptionTier === 'PRO' ? 'default' : 'outline'}
              onClick={() => setUserSubscriptionTier('PRO')}
            >
              Pro Tier (3 Premium Boosts)
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
              <Star className="w-5 h-5 mr-2" />
              Boost Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg">
                <div className="bg-muted text-muted-foreground rounded-lg p-3 mb-3">
                  <TrendingUp className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="font-semibold">Basic Boost</h3>
                <p className="text-sm text-muted-foreground mb-2">€1 for 1 day</p>
                <p className="text-xs text-muted-foreground">Moves to top of regular listings</p>
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="bg-primary text-primary-foreground rounded-lg p-3 mb-3">
                  <Zap className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="font-semibold">Priority Boost</h3>
                <p className="text-sm text-muted-foreground mb-2">€5 for 3 days</p>
                <p className="text-xs text-muted-foreground">Appears above basic listings</p>
                {userSubscriptionTier === 'PLUS' && (
                  <Badge variant="secondary" className="mt-2">Included in Plus</Badge>
                )}
              </div>
              <div className="text-center p-4 border rounded-lg">
                <div className="bg-secondary text-secondary-foreground rounded-lg p-3 mb-3">
                  <Crown className="w-8 h-8 mx-auto" />
                </div>
                <h3 className="font-semibold">Premium Boost</h3>
                <p className="text-sm text-muted-foreground mb-2">€7 for 7 days</p>
                <p className="text-xs text-muted-foreground">Top placement with premium badge</p>
                {userSubscriptionTier === 'PRO' && (
                  <Badge variant="secondary" className="mt-2">Included in Pro</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-64 rounded-lg mb-4"></div>
                <div className="bg-gray-200 h-4 rounded mb-2"></div>
                <div className="bg-gray-200 h-4 rounded w-3/4"></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">You don't have any listings yet.</p>
            <Button asChild>
              <a href="/gear/create">Create Your First Listing</a>
            </Button>
          </div>
        ) : (
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
        )}

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
