'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Shield, Star, AlertCircle } from 'lucide-react';
import { StarDisplay } from '@/components/ui/star-rating';
import type { UserRating } from '@/types/marketplace';

interface RatingRequirementsProps {
  verifiedUsersOnly: boolean;
  minRating: number;
  userRating: UserRating | null;
  onVerifiedUsersChange: (verified: boolean) => void;
  onMinRatingChange: (rating: number) => void;
}

export function RatingRequirements({
  verifiedUsersOnly,
  minRating,
  userRating,
  onVerifiedUsersChange,
  onMinRatingChange}: RatingRequirementsProps) {
  // Check if user's rating meets their own requirement
  const userMeetsRequirement = !userRating || (userRating.average_rating >= minRating);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Owner Requirements
        </CardTitle>
        <CardDescription>
          Set preferences for equipment owners who can respond to your request
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verified Users Only */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-md border">
          <div className="flex items-start gap-3 flex-1">
            <Shield className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <Label htmlFor="verified_users_only" className="text-base font-medium cursor-pointer">
                Verified Users Only
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Only allow equipment owners with verified profiles to respond
              </p>
              {verifiedUsersOnly && (
                <Badge variant="outline" className="mt-2">
                  <Shield className="h-3 w-3 mr-1" />
                  Enhanced Security
                </Badge>
              )}
            </div>
          </div>
          <Switch
            id="verified_users_only"
            checked={verifiedUsersOnly}
            onCheckedChange={onVerifiedUsersChange}
          />
        </div>

        {/* Minimum Rating Requirement */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-md border">
          <div className="flex items-center gap-2">
            <Star className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Minimum Owner Rating</h4>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Minimum Rating Required</Label>
              <div className="flex items-center gap-2">
                <StarDisplay value={minRating} size="sm" showText={false} />
                <span className="text-sm font-medium">{minRating.toFixed(1)}</span>
              </div>
            </div>

            <Slider
              value={[minRating]}
              onValueChange={(values) => onMinRatingChange(values[0])}
              min={0}
              max={5}
              step={0.5}
              className="w-full"
            />

            <div className="flex justify-between text-xs text-muted-foreground">
              <span>0 stars (No requirement)</span>
              <span>5 stars</span>
            </div>
          </div>

          {minRating > 0 && (
            <div className="text-sm text-muted-foreground">
              Only equipment owners with a rating of <strong>{minRating}</strong> stars or higher can respond to your request.
            </div>
          )}
        </div>

        {/* User's Current Rating Display */}
        {userRating && (
          <div className="p-4 bg-background rounded-md border">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">Your Current Rating</h4>
              {!userMeetsRequirement && (
                <Badge variant="destructive" className="text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Below requirement
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <StarDisplay
                value={userRating.average_rating}
                size="md"
                showText={true}
              />
              <p className="text-xs text-muted-foreground">
                {userRating.total_reviews} {userRating.total_reviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>

            {!userMeetsRequirement && minRating > 0 && (
              <div className="mt-3 p-2 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-900">
                <p className="text-xs text-yellow-900 dark:text-yellow-100">
                  ⚠️ <strong>Note:</strong> Your current rating ({userRating.average_rating.toFixed(1)} ⭐) is below your minimum requirement ({minRating} ⭐). Equipment owners may have concerns about your experience level.
                </p>
              </div>
            )}
          </div>
        )}

        {/* No Rating Case */}
        {!userRating && (
          <div className="p-4 bg-muted rounded-md border">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <h4 className="font-medium text-sm">No Rating Yet</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              You haven't received any ratings yet. Complete some rentals to build your reputation!
            </p>
          </div>
        )}

        {/* Helper Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>Tip:</strong> Setting rating requirements helps ensure you work with experienced, trusted equipment owners. However, being too strict may limit your options. Consider the balance between security and availability.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
