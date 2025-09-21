'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  CreditCard,
  MapPin,
  Calendar,
  Star,
  MessageSquare,
  Flag
} from 'lucide-react';
import VerificationBadge from './VerificationBadge';
import SafetyDisclaimer from './SafetyDisclaimer';

interface UserProfile {
  id: string;
  display_name: string;
  handle: string;
  avatar_url?: string;
  verified_id: boolean;
  verified_email: boolean;
  verified_phone: boolean;
  account_age_days: number;
  total_reviews: number;
  average_rating: number;
  location?: string;
  joined_date: string;
}

interface SafetyFeaturesProps {
  user: UserProfile;
  showFullDetails?: boolean;
  onReport?: () => void;
  onMessage?: () => void;
}

export default function SafetyFeatures({ 
  user, 
  showFullDetails = false,
  onReport,
  onMessage 
}: SafetyFeaturesProps) {
  const [showSafetyTips, setShowSafetyTips] = useState(false);

  const getAccountAgeText = (days: number) => {
    if (days < 30) return 'New member';
    if (days < 365) return `${Math.floor(days / 30)} months`;
    return `${Math.floor(days / 365)} years`;
  };

  const getTrustScore = () => {
    let score = 0;
    let maxScore = 0;

    // Verification checks
    maxScore += 3;
    if (user.verified_id) score += 1;
    if (user.verified_email) score += 1;
    if (user.verified_phone) score += 1;

    // Account age
    maxScore += 2;
    if (user.account_age_days > 365) score += 2;
    else if (user.account_age_days > 90) score += 1;

    // Reviews
    maxScore += 2;
    if (user.total_reviews > 10) score += 2;
    else if (user.total_reviews > 0) score += 1;

    // Rating
    maxScore += 1;
    if (user.average_rating >= 4.5) score += 1;

    return Math.round((score / maxScore) * 100);
  };

  const trustScore = getTrustScore();
  const trustLevel = trustScore >= 80 ? 'high' : trustScore >= 60 ? 'medium' : 'low';

  const getTrustColor = () => {
    switch (trustLevel) {
      case 'high':
        return 'bg-primary-100 text-primary-800 border-primary/20';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* Trust Score */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center space-x-2">
            <Shield className="h-5 w-5 text-primary-600" />
            <span>Trust & Safety</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Trust Score Badge */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Trust Score</span>
            <Badge className={`${getTrustColor()} flex items-center space-x-1`}>
              <Shield className="h-3 w-3" />
              <span>{trustScore}%</span>
            </Badge>
          </div>

          {/* Verification Status */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Verification Status</h4>
            <div className="flex flex-wrap gap-2">
              <VerificationBadge 
                verified={user.verified_id} 
                verificationType="id" 
                size="sm" 
              />
              <VerificationBadge 
                verified={user.verified_email} 
                verificationType="email" 
                size="sm" 
              />
              <VerificationBadge 
                verified={user.verified_phone} 
                verificationType="phone" 
                size="sm" 
              />
            </div>
          </div>

          {/* Account Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                {getAccountAgeText(user.account_age_days)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600">
                {user.total_reviews} reviews
                {user.average_rating > 0 && (
                  <span className="ml-1">({user.average_rating.toFixed(1)}★)</span>
                )}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            {onMessage && (
              <Button variant="outline" size="sm" onClick={onMessage}>
                <MessageSquare className="h-4 w-4 mr-1" />
                Message
              </Button>
            )}
            {onReport && (
              <Button variant="outline" size="sm" onClick={onReport}>
                <Flag className="h-4 w-4 mr-1" />
                Report
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Safety Tips */}
      {showFullDetails && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span>Safety Tips</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SafetyDisclaimer type="general" compact />
            
            {showSafetyTips && (
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">Before Meeting</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Verify user identity</li>
                      <li>• Check item photos carefully</li>
                      <li>• Agree on meeting location</li>
                      <li>• Confirm payment method</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900">During Transaction</h4>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Meet in public, well-lit areas</li>
                      <li>• Bring a friend if possible</li>
                      <li>• Inspect items thoroughly</li>
                      <li>• Complete payment securely</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSafetyTips(!showSafetyTips)}
              className="mt-3 text-yellow-700 hover:text-yellow-800"
            >
              {showSafetyTips ? 'Hide Safety Tips' : 'Show Safety Tips'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Red Flags Warning */}
      {trustLevel === 'low' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 mb-1">
                  Exercise Caution
                </h4>
                <p className="text-sm text-red-700">
                  This user has a low trust score. Please verify all details carefully 
                  and consider meeting in a public location with additional safety measures.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
