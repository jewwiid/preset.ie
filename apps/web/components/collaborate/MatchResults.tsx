'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Star, MapPin, User, Package, TrendingUp, AlertCircle } from 'lucide-react';
import RoleApplicationModal from './RoleApplicationModal';
import GearOfferModal from './GearOfferModal';

interface UserMatch {
  user_id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  verified: boolean;
  rating?: number;
  city?: string;
  country?: string;
  specializations?: string[];
  compatibility_score: number;
  match_reasons: string[];
}

interface EquipmentMatch {
  listing_id: string;
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
  compatibility_score: number;
  match_reasons: string[];
}

interface MatchResultsProps {
  type: 'users_for_role' | 'equipment_for_request';
  targetId: string;
  projectId: string;
  projectTitle: string;
  onApplicationSubmit?: () => void;
  onOfferSubmit?: () => void;
}

export default function MatchResults({
  type,
  targetId,
  projectId,
  projectTitle,
  onApplicationSubmit,
  onOfferSubmit
}: MatchResultsProps) {
  const [matches, setMatches] = useState<UserMatch[] | EquipmentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadMatches();
  }, [type, targetId]);

  const loadMatches = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/collab/matches?type=${type}&target_id=${targetId}&limit=10`
      );

      if (response.ok) {
        const data = await response.json();
        setMatches(data.matches || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load matches');
      }
    } catch (err) {
      console.error('Error loading matches:', err);
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyToRole = (user: UserMatch) => {
    setSelectedMatch(user);
    setModalOpen(true);
  };

  const handleMakeOffer = (equipment: EquipmentMatch) => {
    setSelectedMatch(equipment);
    setModalOpen(true);
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const renderUserMatch = (user: UserMatch) => (
    <Card key={user.user_id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>
              {user.display_name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium truncate">{user.display_name}</h3>
              {user.verified && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
              {user.rating && (
                <div className="flex items-center text-sm text-gray-500">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  {user.rating.toFixed(1)}
                </div>
              )}
            </div>
            
            <p className="text-sm text-gray-500 mb-2">@{user.username}</p>
            
            {(user.city || user.country) && (
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin className="h-3 w-3 mr-1" />
                {[user.city, user.country].filter(Boolean).join(', ')}
              </div>
            )}
            
            {user.specializations && user.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {user.specializations.slice(0, 3).map((skill) => (
                  <Badge key={skill} variant="outline" className="text-xs">
                    {skill}
                  </Badge>
                ))}
                {user.specializations.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{user.specializations.length - 3} more
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {user.match_reasons.slice(0, 2).map((reason) => (
                  <Badge key={reason} variant="secondary" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getScoreColor(user.compatibility_score)}`}>
                  {user.compatibility_score}% match
                </Badge>
                <Button
                  size="sm"
                  onClick={() => handleApplyToRole(user)}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderEquipmentMatch = (equipment: EquipmentMatch) => (
    <Card key={equipment.listing_id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
            <Package className="h-8 w-8 text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-medium truncate">{equipment.title}</h3>
              <Badge variant="outline" className="text-xs">
                {equipment.condition}
              </Badge>
            </div>
            
            <p className="text-sm text-gray-500 mb-2">{equipment.category}</p>
            
            {(equipment.location_city || equipment.location_country) && (
              <div className="flex items-center text-sm text-gray-500 mb-2">
                <MapPin className="h-3 w-3 mr-1" />
                {[equipment.location_city, equipment.location_country].filter(Boolean).join(', ')}
              </div>
            )}
            
            <div className="flex items-center space-x-4 mb-3 text-sm">
              {equipment.rent_day_cents && (
                <span className="text-green-600 font-medium">
                  {formatPrice(equipment.rent_day_cents)}/day
                </span>
              )}
              {equipment.sale_price_cents && (
                <span className="text-blue-600 font-medium">
                  {formatPrice(equipment.sale_price_cents)} total
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-3 mb-3">
              <Avatar className="h-6 w-6">
                <AvatarImage src={equipment.owner.avatar_url} />
                <AvatarFallback>
                  {equipment.owner.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{equipment.owner.display_name}</span>
                {equipment.owner.verified && (
                  <Badge variant="secondary" className="text-xs">Verified</Badge>
                )}
                {equipment.owner.rating && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {equipment.owner.rating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-1">
                {equipment.match_reasons.slice(0, 2).map((reason) => (
                  <Badge key={reason} variant="secondary" className="text-xs">
                    {reason}
                  </Badge>
                ))}
              </div>
              
              <div className="flex items-center space-x-2">
                <Badge className={`text-xs ${getScoreColor(equipment.compatibility_score)}`}>
                  {equipment.compatibility_score}% match
                </Badge>
                <Button
                  size="sm"
                  onClick={() => handleMakeOffer(equipment)}
                >
                  Make Offer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <h2 className="text-lg font-medium">Finding Matches...</h2>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Matches</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={loadMatches}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-5 w-5" />
        <h2 className="text-lg font-medium">
          {type === 'users_for_role' ? 'Recommended Users' : 'Recommended Equipment'}
        </h2>
        <Badge variant="outline">{matches.length} matches</Badge>
      </div>

      {matches.length === 0 ? (
        <div className="text-center py-8">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Matches Found</h3>
          <p className="text-gray-500">
            {type === 'users_for_role' 
              ? 'No users match the requirements for this role.'
              : 'No equipment matches the requirements for this gear request.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match) => 
            type === 'users_for_role' 
              ? renderUserMatch(match as UserMatch)
              : renderEquipmentMatch(match as EquipmentMatch)
          )}
        </div>
      )}

      {/* Modals */}
      {type === 'users_for_role' && selectedMatch && (
        <RoleApplicationModal
          role={selectedMatch.role}
          project={selectedMatch.project}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedMatch(null);
          }}
          onSuccess={() => {
            onApplicationSubmit?.();
            setModalOpen(false);
            setSelectedMatch(null);
          }}
        />
      )}

      {type === 'equipment_for_request' && selectedMatch && (
        <GearOfferModal
          gearRequest={selectedMatch.gearRequest}
          project={selectedMatch.project}
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedMatch(null);
          }}
          onSuccess={() => {
            onOfferSubmit?.();
            setModalOpen(false);
            setSelectedMatch(null);
          }}
        />
      )}
    </div>
  );
}
