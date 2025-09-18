'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Euro, Star, Shield } from 'lucide-react';

interface ListingCardProps {
  listing: {
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
      verified_id?: boolean;
    };
    images?: Array<{
      id: string;
      path: string;
      sort_order: number;
      alt_text?: string;
    }>;
  };
  showOwner?: boolean;
}

export default function ListingCard({ listing, showOwner = true }: ListingCardProps) {
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
    if (listing.mode === 'rent' || listing.mode === 'both') {
      badges.push(
        <Badge key="rent" variant="secondary" className="text-xs">
          Rent
        </Badge>
      );
    }
    if (listing.mode === 'sale' || listing.mode === 'both') {
      badges.push(
        <Badge key="sale" variant="outline" className="text-xs">
          Sale
        </Badge>
      );
    }
    return badges;
  };

  const getPrimaryImage = () => {
    if (listing.images && listing.images.length > 0) {
      const sortedImages = listing.images.sort((a, b) => a.sort_order - b.sort_order);
      return sortedImages[0];
    }
    return null;
  };

  const getPriceDisplay = () => {
    if (listing.mode === 'rent' || listing.mode === 'both') {
      return (
        <div className="flex items-center space-x-2">
          <Euro className="h-4 w-4 text-gray-500" />
          <span className="font-semibold">
            {listing.rent_day_cents ? formatPrice(listing.rent_day_cents) : 'N/A'}/day
          </span>
          {listing.rent_week_cents && (
            <span className="text-sm text-gray-500">
              ({formatPrice(listing.rent_week_cents)}/week)
            </span>
          )}
        </div>
      );
    } else if (listing.mode === 'sale') {
      return (
        <div className="flex items-center space-x-2">
          <Euro className="h-4 w-4 text-gray-500" />
          <span className="font-semibold">
            {listing.sale_price_cents ? formatPrice(listing.sale_price_cents) : 'N/A'}
          </span>
        </div>
      );
    }
    return null;
  };

  const getRetainerInfo = () => {
    if (listing.retainer_mode === 'none' && listing.borrow_ok) {
      return (
        <div className="flex items-center space-x-1 text-sm text-green-600">
          <span>Free to borrow</span>
        </div>
      );
    } else if (listing.retainer_mode !== 'none') {
      return (
        <div className="flex items-center space-x-1 text-sm text-blue-600">
          <Shield className="h-3 w-3" />
          <span>€{formatPrice(listing.retainer_cents)} retainer</span>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <div className="relative">
        {/* Image */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-t-lg overflow-hidden">
          {getPrimaryImage() ? (
            <Image
              src={getPrimaryImage()!.path}
              alt={getPrimaryImage()!.alt_text || listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">📷</div>
                <div className="text-sm">No image</div>
              </div>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <Badge className={getConditionColor(listing.condition)}>
            {listing.condition.replace('_', ' ')}
          </Badge>
        </div>

        {/* Verified Only Badge */}
        {listing.verified_only && (
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="bg-white/90 text-blue-600 border-blue-200">
              <Shield className="h-3 w-3 mr-1" />
              Verified Only
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="flex-1 p-4">
        {/* Title and Category */}
        <div className="mb-2">
          <h3 className="font-semibold text-lg text-gray-900 line-clamp-2 mb-1">
            {listing.title}
          </h3>
          <div className="flex items-center space-x-2 mb-2">
            <Badge variant="outline" className="text-xs">
              {listing.category}
            </Badge>
            {getModeBadges()}
          </div>
        </div>

        {/* Description */}
        {listing.description && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {listing.description}
          </p>
        )}

        {/* Price */}
        <div className="mb-3">
          {getPriceDisplay()}
          {getRetainerInfo()}
        </div>

        {/* Location */}
        {listing.location_city && (
          <div className="flex items-center space-x-1 text-sm text-gray-500 mb-3">
            <MapPin className="h-4 w-4" />
            <span>{listing.location_city}</span>
            {listing.location_country && (
              <span>, {listing.location_country}</span>
            )}
          </div>
        )}

        {/* Owner Info */}
        {showOwner && listing.users_profile && (
          <div className="flex items-center space-x-2 mb-3">
            <div className="flex items-center space-x-2">
              {listing.users_profile.avatar_url ? (
                <Image
                  src={listing.users_profile.avatar_url}
                  alt={listing.users_profile.display_name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-600">
                    {listing.users_profile.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <span className="text-sm font-medium text-gray-900">
                {listing.users_profile.display_name}
              </span>
              {listing.users_profile.verified_id && (
                <Shield className="h-4 w-4 text-blue-500" />
              )}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0">
        <Link href={`/marketplace/listings/${listing.id}`} className="w-full">
          <Button className="w-full" variant="outline">
            View Details
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
