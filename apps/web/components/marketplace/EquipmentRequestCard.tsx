'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, User, MessageCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface EquipmentRequestCardProps {
  request: {
    id: string;
    title: string;
    description?: string;
    category?: string;
    equipment_type?: string;
    request_type: 'rent' | 'buy' | 'both';
    rental_start_date?: string;
    rental_end_date?: string;
    max_daily_rate_cents?: number;
    max_total_cents?: number;
    max_purchase_price_cents?: number;
    location_city?: string;
    location_country?: string;
    urgent: boolean;
    verified_users_only: boolean;
    min_rating: number;
    expires_at: string;
    created_at: string;
    response_count: number;
    requester: {
      id: string;
      display_name: string;
      handle: string;
      avatar_url?: string;
      verified_id?: string;
      rating?: number;
    };
  };
  showActions?: boolean;
}

export default function EquipmentRequestCard({ request, showActions = true }: EquipmentRequestCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const getRequestTypeBadge = () => {
    switch (request.request_type) {
      case 'rent':
        return <Badge variant="secondary">Rental Request</Badge>;
      case 'buy':
        return <Badge variant="outline">Purchase Request</Badge>;
      case 'both':
        return <Badge className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">Rent or Buy</Badge>;
      default:
        return null;
    }
  };

  const getCategoryBadge = () => {
    if (!request.category) return null;
    
    const categoryColors: { [key: string]: string } = {
      'camera': 'bg-red-100 text-red-800',
      'lens': 'bg-blue-100 text-blue-800',
      'lighting': 'bg-yellow-100 text-yellow-800',
      'audio': 'bg-green-100 text-green-800',
      'accessories': 'bg-purple-100 text-purple-800',
      'other': 'bg-gray-100 text-gray-800'
    };

    return (
      <Badge className={categoryColors[request.category] || 'bg-gray-100 text-gray-800'}>
        {request.category}
      </Badge>
    );
  };

  const getPriceRange = () => {
    if (request.request_type === 'rent' || request.request_type === 'both') {
      if (request.max_daily_rate_cents && request.max_total_cents) {
        return `${formatPrice(request.max_daily_rate_cents)}/day • Up to ${formatPrice(request.max_total_cents)}`;
      } else if (request.max_daily_rate_cents) {
        return `Up to ${formatPrice(request.max_daily_rate_cents)}/day`;
      } else if (request.max_total_cents) {
        return `Up to ${formatPrice(request.max_total_cents)} total`;
      }
    }
    
    if (request.request_type === 'buy' && request.max_purchase_price_cents) {
      return `Up to ${formatPrice(request.max_purchase_price_cents)}`;
    }
    
    return 'Price negotiable';
  };

  const getRentalPeriod = () => {
    if (request.request_type === 'rent' || request.request_type === 'both') {
      if (request.rental_start_date && request.rental_end_date) {
        return `${formatDate(request.rental_start_date)} - ${formatDate(request.rental_end_date)}`;
      }
    }
    return null;
  };

  const isExpiringSoon = () => {
    const expiresAt = new Date(request.expires_at);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 3;
  };

  return (
    <Card className={`relative overflow-hidden ${request.urgent ? 'ring-2 ring-orange-500' : ''}`}>
      {/* Urgent Badge */}
      {request.urgent && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-orange-500 text-white">
            <AlertCircle className="w-3 h-3 mr-1" />
            Urgent
          </Badge>
        </div>
      )}

      {/* Expiring Soon Badge */}
      {isExpiringSoon() && !request.urgent && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="destructive">
            <Clock className="w-3 h-3 mr-1" />
            Expiring Soon
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 mb-2">
              {request.title}
            </CardTitle>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {getRequestTypeBadge()}
              {getCategoryBadge()}
              {request.verified_users_only && (
                <Badge variant="secondary" className="text-xs">
                  Verified Only
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description */}
        {request.description && (
          <p className="text-gray-600 text-sm mb-4 line-clamp-3">
            {request.description}
          </p>
        )}

        {/* Equipment Type */}
        {request.equipment_type && (
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-700">Looking for: </span>
            <span className="text-sm text-gray-600">{request.equipment_type}</span>
          </div>
        )}

        {/* Price Range */}
        <div className="mb-3">
          <span className="text-sm font-medium text-gray-700">Budget: </span>
          <span className="text-sm text-emerald-600 font-medium">{getPriceRange()}</span>
        </div>

        {/* Rental Period */}
        {getRentalPeriod() && (
          <div className="mb-3">
            <span className="text-sm font-medium text-gray-700">Dates: </span>
            <span className="text-sm text-gray-600">{getRentalPeriod()}</span>
          </div>
        )}

        {/* Location */}
        {request.location_city && (
          <div className="flex items-center text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span>{request.location_city}{request.location_country && `, ${request.location_country}`}</span>
          </div>
        )}

        {/* Requester Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
              {request.requester.avatar_url ? (
                <img
                  src={request.requester.avatar_url}
                  alt={request.requester.display_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-gray-500" />
              )}
            </div>
            <div>
              <div className="flex items-center space-x-1">
                <span className="text-sm font-medium">{request.requester.display_name}</span>
                {request.requester.verified_id && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
              </div>
              {request.requester.rating && (
                <div className="text-xs text-gray-500">
                  ⭐ {request.requester.rating.toFixed(1)}
                </div>
              )}
            </div>
          </div>

          {/* Response Count */}
          <div className="flex items-center text-sm text-gray-500">
            <MessageCircle className="w-4 h-4 mr-1" />
            <span>{request.response_count} response{request.response_count !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex space-x-2">
            <Button asChild className="flex-1">
              <Link href={`/marketplace/requests/${request.id}`}>
                View Details
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/marketplace/requests/${request.id}#respond`}>
                Respond
              </Link>
            </Button>
          </div>
        )}

        {/* Expiry Info */}
        <div className="mt-3 pt-3 border-t text-xs text-gray-500">
          <div className="flex items-center justify-between">
            <span>Expires {formatDate(request.expires_at)}</span>
            <span>Posted {formatDate(request.created_at)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
