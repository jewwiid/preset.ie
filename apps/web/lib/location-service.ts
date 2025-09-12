// Location service using Nominatim OpenStreetMap API (free, no API key needed)

export interface LocationResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    county?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
  place_id: string;
  osm_type: string;
  type: string;
}

export interface ParsedLocation {
  formatted_address: string;
  city: string | null;
  country: string | null;
  lat: number | null;
  lng: number | null;
  place_id: string | null;
}

// Search for locations using Nominatim
export const searchLocations = async (query: string): Promise<LocationResult[]> => {
  if (!query || query.length < 3) return [];

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `format=json&` +
      `q=${encodeURIComponent(query)}&` +
      `limit=5&` +
      `addressdetails=1&` +
      `countrycodes=ie,gb,us,ca,au,fr,de,es,it,nl&` + // Limit to common countries
      `accept-language=en`
    );

    if (!response.ok) {
      throw new Error('Location search failed');
    }

    const data = await response.json();
    return data || [];
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

// Reverse geocode coordinates to get location details
export const reverseGeocode = async (lat: number, lng: number): Promise<LocationResult | null> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
      `format=json&` +
      `lat=${lat}&` +
      `lon=${lng}&` +
      `addressdetails=1&` +
      `accept-language=en`
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding failed');
    }

    const data = await response.json();
    return data || null;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
};

// Parse location result into standardized format
export const parseLocationResult = (result: LocationResult): ParsedLocation => {
  const { display_name, lat, lon, address, place_id } = result;

  // Extract city name (prefer city > town > village)
  const city = address.city || address.town || address.village || null;

  // Extract country name
  const country = address.country || null;

  return {
    formatted_address: display_name,
    city,
    country,
    lat: lat ? parseFloat(lat) : null,
    lng: lon ? parseFloat(lon) : null,
    place_id: place_id || null,
  };
};

// Get user's current location using browser geolocation
export const getCurrentLocation = (): Promise<{ lat: number; lng: number }> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error('Unable to retrieve location: ' + error.message));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
};

// Popular city suggestions for quick selection
export const getPopularCities = (): ParsedLocation[] => [
  {
    formatted_address: 'Dublin, Ireland',
    city: 'Dublin',
    country: 'Ireland',
    lat: 53.3498,
    lng: -6.2603,
    place_id: 'dublin-ireland',
  },
  {
    formatted_address: 'Cork, Ireland',
    city: 'Cork',
    country: 'Ireland',
    lat: 51.8985,
    lng: -8.4756,
    place_id: 'cork-ireland',
  },
  {
    formatted_address: 'Galway, Ireland',
    city: 'Galway',
    country: 'Ireland',
    lat: 53.2707,
    lng: -9.0568,
    place_id: 'galway-ireland',
  },
  {
    formatted_address: 'London, United Kingdom',
    city: 'London',
    country: 'United Kingdom',
    lat: 51.5074,
    lng: -0.1278,
    place_id: 'london-uk',
  },
  {
    formatted_address: 'Manchester, United Kingdom',
    city: 'Manchester',
    country: 'United Kingdom',
    lat: 53.4808,
    lng: -2.2426,
    place_id: 'manchester-uk',
  },
  {
    formatted_address: 'Birmingham, United Kingdom',
    city: 'Birmingham',
    country: 'United Kingdom',
    lat: 52.4862,
    lng: -1.8904,
    place_id: 'birmingham-uk',
  },
  {
    formatted_address: 'New York, United States',
    city: 'New York',
    country: 'United States',
    lat: 40.7128,
    lng: -74.0060,
    place_id: 'new-york-us',
  },
  {
    formatted_address: 'Los Angeles, United States',
    city: 'Los Angeles',
    country: 'United States',
    lat: 34.0522,
    lng: -118.2437,
    place_id: 'los-angeles-us',
  },
];

// Validate and normalize location text to extract accurate city/country
export const normalizeLocationText = async (locationText: string): Promise<ParsedLocation | null> => {
  if (!locationText.trim()) return null;

  // First check if it matches a popular city
  const popularCities = getPopularCities();
  const popularMatch = popularCities.find(city => 
    locationText.toLowerCase().includes(city.city?.toLowerCase() || '') ||
    city.formatted_address.toLowerCase().includes(locationText.toLowerCase())
  );

  if (popularMatch) {
    return popularMatch;
  }

  // Search using geocoding service
  try {
    const results = await searchLocations(locationText);
    if (results.length > 0) {
      return parseLocationResult(results[0]);
    }
  } catch (error) {
    console.error('Error normalizing location text:', error);
  }

  return null;
};