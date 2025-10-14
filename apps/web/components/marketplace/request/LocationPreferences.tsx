'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MapPin, Truck, Home } from 'lucide-react';

interface LocationPreferencesProps {
  city: string;
  country: string;
  pickupPreferred: boolean;
  deliveryAcceptable: boolean;
  maxDistanceKm: string;
  onCityChange: (city: string) => void;
  onCountryChange: (country: string) => void;
  onPickupChange: (pickup: boolean) => void;
  onDeliveryChange: (delivery: boolean) => void;
  onMaxDistanceChange: (distance: string) => void;
  errors?: {
    location_city?: string;
    location_country?: string;
  };
}

export function LocationPreferences({
  city,
  country,
  pickupPreferred,
  deliveryAcceptable,
  maxDistanceKm,
  onCityChange,
  onCountryChange,
  onPickupChange,
  onDeliveryChange,
  onMaxDistanceChange,
  errors = {} }: LocationPreferencesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location & Delivery
        </CardTitle>
        <CardDescription>
          Where you need the equipment and how you'll collect it
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Location */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Location</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location_city">
                City <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location_city"
                value={city}
                onChange={(e) => onCityChange(e.target.value)}
                placeholder="e.g., Dublin"
                className={errors.location_city ? 'border-destructive' : ''}
              />
              {errors.location_city && (
                <p className="text-sm text-destructive mt-1">{errors.location_city}</p>
              )}
            </div>

            <div>
              <Label htmlFor="location_country">
                Country <span className="text-destructive">*</span>
              </Label>
              <Input
                id="location_country"
                value={country}
                onChange={(e) => onCountryChange(e.target.value)}
                placeholder="e.g., Ireland"
                className={errors.location_country ? 'border-destructive' : ''}
              />
              {errors.location_country && (
                <p className="text-sm text-destructive mt-1">{errors.location_country}</p>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            This helps us show you equipment available in your area
          </p>
        </div>

        {/* Pickup & Delivery Preferences */}
        <div className="space-y-4 p-4 bg-muted/50 rounded-md border">
          <div className="flex items-center gap-2 mb-2">
            <Truck className="h-4 w-4 text-primary" />
            <h4 className="font-medium">Collection Preferences</h4>
          </div>

          <div className="space-y-4">
            {/* Pickup Preferred */}
            <div className="flex items-center justify-between p-3 bg-background rounded-md border">
              <div className="flex items-start gap-3">
                <Home className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="pickup_preferred" className="text-base font-medium cursor-pointer">
                    Pickup Preferred
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    I can collect the equipment from the owner's location
                  </p>
                </div>
              </div>
              <Switch
                id="pickup_preferred"
                checked={pickupPreferred}
                onCheckedChange={onPickupChange}
              />
            </div>

            {/* Delivery Acceptable */}
            <div className="flex items-center justify-between p-3 bg-background rounded-md border">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="delivery_acceptable" className="text-base font-medium cursor-pointer">
                    Delivery Acceptable
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    I'm open to the owner delivering the equipment (may incur extra fees)
                  </p>
                </div>
              </div>
              <Switch
                id="delivery_acceptable"
                checked={deliveryAcceptable}
                onCheckedChange={onDeliveryChange}
              />
            </div>
          </div>

          {/* Maximum Distance */}
          {(pickupPreferred || deliveryAcceptable) && (
            <div className="mt-4">
              <Label htmlFor="max_distance_km">
                Maximum Distance (km)
              </Label>
              <Input
                id="max_distance_km"
                type="number"
                value={maxDistanceKm}
                onChange={(e) => onMaxDistanceChange(e.target.value)}
                placeholder="50"
                min="1"
                max="1000"
              />
              <p className="text-xs text-muted-foreground mt-1">
                How far are you willing to travel {pickupPreferred && deliveryAcceptable ? '(for pickup) or accept delivery' : pickupPreferred ? 'for pickup' : 'for delivery'}?
              </p>
            </div>
          )}
        </div>

        {/* Warning if neither option selected */}
        {!pickupPreferred && !deliveryAcceptable && (
          <div className="p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md border border-yellow-200 dark:border-yellow-900">
            <p className="text-sm text-yellow-900 dark:text-yellow-100">
              ⚠️ <strong>Note:</strong> Please select at least one collection method to ensure equipment owners know how you plan to receive the equipment.
            </p>
          </div>
        )}

        {/* Helper Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>Tip:</strong> Being flexible with collection methods increases your chances of finding available equipment. Owners appreciate renters who can adapt.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
