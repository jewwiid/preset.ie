'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { MapPin } from 'lucide-react';

interface LocationFormProps {
  locationCity: string;
  locationCountry: string;
  isGeocoding: boolean;
  coordinatesFound: boolean;
  onCityChange: (value: string) => void;
  onCountryChange: (value: string) => void;
}

export function LocationForm({
  locationCity,
  locationCountry,
  isGeocoding,
  coordinatesFound,
  onCityChange,
  onCountryChange}: LocationFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Location
          {isGeocoding && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
              <span>Getting coordinates...</span>
            </div>
          )}
          {coordinatesFound && !isGeocoding && (
            <div className="flex items-center gap-1 text-sm text-primary">
              <div className="h-3 w-3 rounded-full bg-primary"></div>
              <span>Coordinates found</span>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="location_city">City</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location_city"
                value={locationCity}
                onChange={(e) => onCityChange(e.target.value)}
                placeholder="Enter city"
                className="pl-10"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="location_country">Country</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="location_country"
                value={locationCountry}
                onChange={(e) => onCountryChange(e.target.value)}
                placeholder="Enter country"
                className="pl-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
