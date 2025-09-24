'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Crown, Zap, TrendingUp, Star, Clock, Shield } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedListingCardProps {
  listing: {
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
  };
  onEnhance?: (listingId: string) => void;
  showEnhanceButton?: boolean;
}

export default function EnhancedListingCard({ 
  listing, 
  onEnhance,
  showEnhanceButton = true 
}: EnhancedListingCardProps) {
  const getEnhancementBadge = () => {
    if (listing.current_enhancement_type === 'premium_bump') {
      return (
        <Badge variant="secondary">
          <Crown className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      );
    }
    if (listing.current_enhancement_type === 'priority_bump') {
      return (
        <Badge variant="default">
          <Zap className="w-3 h-3 mr-1" />
          Priority
        </Badge>
      );
    }
    if (listing.current_enhancement_type === 'basic_bump') {
      return (
        <Badge variant="outline">
          <TrendingUp className="w-3 h-3 mr-1" />
          Boosted
        </Badge>
      );
    }
    return null;
  };

  const getBoostIndicator = () => {
    if (listing.boost_level > 0) {
      return (
        <Badge variant="outline">
          <Star className="w-3 h-3 mr-1" />
          Boosted
        </Badge>
      );
    }
    return null;
  };

  const getTimeRemaining = () => {
    if (listing.enhancement_expires_at) {
      const expiresAt = new Date(listing.enhancement_expires_at);
      const now = new Date();
      
      if (expiresAt > now) {
        return (
          <Badge variant="outline" className="text-xs">
            <Clock className="w-3 h-3 mr-1" />
            {formatDistanceToNow(expiresAt, { addSuffix: true })}
          </Badge>
        );
      }
    }
    return null;
  };

  const getUserBadges = () => {
    const badges = [];
    
    if (listing.verified_badge || listing.owner?.verified_id) {
      badges.push(
        <Badge key="verified" variant="secondary" className="text-xs">
          <Shield className="w-3 h-3 mr-1" />
          Verified
        </Badge>
      );
    }
    
    if (listing.premium_badge) {
      badges.push(
        <Badge key="premium" variant="secondary" className="text-xs">
          Premium
        </Badge>
      );
    }
    
    return badges;
  };

  return (
    <Card className="relative overflow-hidden hover:shadow-lg transition-shadow duration-200">
      {/* Enhancement Badge - Top Left */}
      {getEnhancementBadge() && (
        <div className="absolute top-3 left-3 z-10">
          {getEnhancementBadge()}
        </div>
      )}

      {/* Boost Indicator - Top Right */}
      {getBoostIndicator() && (
        <div className="absolute top-3 right-3 z-10">
          {getBoostIndicator()}
        </div>
      )}

      {/* Time Remaining - Below Boost Indicator */}
      {getTimeRemaining() && (
        <div className="absolute top-12 right-3 z-10">
          {getTimeRemaining()}
        </div>
      )}

      <CardContent className="p-0">
        {/* Listing Image */}
        <div className="aspect-square relative bg-gray-100">
          <img
            src={listing.images[0]?.url || '/placeholder-image.jpg'}
            alt={listing.images[0]?.alt_text || listing.title}
            className="w-full h-full object-cover"
          />
          
          {/* Gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        </div>

        {/* Listing Info */}
        <div className="p-4 space-y-3">
          {/* Title and Description */}
          <div>
            <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900">
              {listing.title}
            </h3>
            <p className="text-gray-600 text-sm line-clamp-2">
              {listing.description}
            </p>
          </div>
          
          {/* Price and User Badges */}
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-foreground">
              €{(listing.price_cents / 100).toFixed(2)}/day
            </div>
            
            <div className="flex space-x-1">
              {getUserBadges()}
            </div>
          </div>

          {/* Owner Info */}
          {listing.owner && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <span>by {listing.owner.display_name}</span>
            </div>
          )}

          {/* Enhancement Button */}
          {showEnhanceButton && onEnhance && (
            <Button
              onClick={() => onEnhance(listing.id)}
              variant="outline"
              size="sm"
              className="w-full mt-3"
            >
              {listing.current_enhancement_type ? 'Extend Boost' : 'Boost Listing'}
            </Button>
          )}

          {/* Enhancement Status */}
          {listing.current_enhancement_type && (
            <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-100">
              {listing.current_enhancement_type === 'premium_bump' && 'Premium boost active'}
              {listing.current_enhancement_type === 'priority_bump' && 'Priority boost active'}
              {listing.current_enhancement_type === 'basic_bump' && 'Basic boost active'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
