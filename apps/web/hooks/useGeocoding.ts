'use client';

import { useState, useEffect } from 'react';

interface GeocodingResult {
  lat: number;
  lng: number;
}

export function useGeocoding(city: string, country: string) {
  const [coordinates, setCoordinates] = useState<GeocodingResult | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [coordinatesFound, setCoordinatesFound] = useState(false);

  useEffect(() => {
    const geocodeLocation = async () => {
      if (!city || !country) {
        setCoordinatesFound(false);
        return;
      }

      setIsGeocoding(true);
      setCoordinatesFound(false);

      try {
        const query = encodeURIComponent(`${city}, ${country}`);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`
        );

        if (!response.ok) {
          throw new Error('Geocoding request failed');
        }

        const data = await response.json();

        if (data && data.length > 0) {
          const result = {
            lat: parseFloat(data[0].lat),
            lng: parseFloat(data[0].lon),
          };
          setCoordinates(result);
          setCoordinatesFound(true);
        } else {
          setCoordinates(null);
          setCoordinatesFound(false);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
        setCoordinates(null);
        setCoordinatesFound(false);
      } finally {
        setIsGeocoding(false);
      }
    };

    const timeoutId = setTimeout(geocodeLocation, 1000);
    return () => clearTimeout(timeoutId);
  }, [city, country]);

  return { coordinates, isGeocoding, coordinatesFound };
}
