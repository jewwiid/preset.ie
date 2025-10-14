'use client'

import { useState, useEffect } from 'react'
import { MapPin, ExternalLink, Loader2, Plus, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useTheme } from 'next-themes'
import { normalizeLocationText, type ParsedLocation } from '../lib/location-service'

interface LocationMapProps {
  location: string
  latitude?: number
  longitude?: number
  className?: string
  showFullMap?: boolean
}

export default function LocationMap({ 
  location, 
  latitude, 
  longitude, 
  className = "", 
  showFullMap = true 
}: LocationMapProps) {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  )
  const [locationData, setLocationData] = useState<ParsedLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(14)
  const [mapAttempt, setMapAttempt] = useState(0) // Track which map service to try
  const [mapLoading, setMapLoading] = useState(true)
  const { theme, resolvedTheme } = useTheme()

  // Fetch coordinates if not provided
  useEffect(() => {
    if (!coords && location && location.trim()) {
      setLoading(true)
      normalizeLocationText(location)
        .then((data) => {
          if (data && data.lat && data.lng) {
            setCoords({ lat: data.lat, lng: data.lng })
            setLocationData(data)
          }
        })
        .catch((error) => {
          console.error('Error fetching location coordinates:', error)
        })
        .finally(() => {
          setLoading(false)
        })
    }
  }, [location, coords])

  // Reset map when theme changes
  useEffect(() => {
    if (coords) {
      setMapAttempt(0)
      setMapError(false)
      setMapLoading(true)
    }
  }, [resolvedTheme, coords])

  const handleOpenInMaps = () => {
    if (coords) {
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lng}`
      window.open(mapsUrl, '_blank')
    } else {
      const encodedLocation = encodeURIComponent(location)
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedLocation}`
      window.open(mapsUrl, '_blank')
    }
  }

  // Generate static map using theme-aware tile services
  const getStaticMapUrl = (lat: number, lng: number, zoom: number = 14) => {
    const tileX = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom))
    const tileY = Math.floor((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
    
    const isDark = resolvedTheme === 'dark'
    
    if (isDark) {
      // Dark mode: Use CartoDB Dark Matter tiles
      return `https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/${zoom}/${tileX}/${tileY}.png`
    } else {
      // Light mode: Use standard OpenStreetMap tiles
      return `https://tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`
    }
  }

  // Alternative: Theme-aware Geoapify
  const getAlternativeMapUrl = (lat: number, lng: number, zoom: number = 14) => {
    const isDark = resolvedTheme === 'dark'
    const style = isDark ? 'dark-matter' : 'osm-bright'
    const markerColor = isDark ? '%2300ff88' : '%2300aa55' // Green marker matching theme
    
    return `https://maps.geoapify.com/v1/staticmap?style=${style}&width=600&height=300&center=lonlat:${lng},${lat}&zoom=${zoom}&marker=lonlat:${lng},${lat};color:${markerColor};size:medium&apiKey=demo`
  }

  // Final fallback: Different themed tile server
  const getTileMapUrl = (lat: number, lng: number, zoom: number = 14) => {
    const tileX = Math.floor(((lng + 180) / 360) * Math.pow(2, zoom))
    const tileY = Math.floor((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2 * Math.pow(2, zoom))
    
    const isDark = resolvedTheme === 'dark'
    
    if (isDark) {
      // Dark mode: Use Stamen Toner (dark style)
      return `https://stamen-tiles.a.ssl.fastly.net/toner/${zoom}/${tileX}/${tileY}.png`
    } else {
      // Light mode: Use alternative OSM server
      return `https://a.tile.openstreetmap.org/${zoom}/${tileX}/${tileY}.png`
    }
  }

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <LoadingSpinner size="md" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{location}</p>
              <p className="text-xs text-muted-foreground">Loading map preview...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!showFullMap || !coords) {
    // Compact mode or no coordinates - show simple card
    return (
      <Card className={`cursor-pointer hover:shadow-md transition-shadow ${className}`} onClick={handleOpenInMaps}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {locationData?.city && locationData?.country 
                  ? `${locationData.city}, ${locationData.country}`
                  : location
                }
              </p>
              <p className="text-xs text-muted-foreground">Click to open in maps</p>
            </div>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Full map mode with coordinates
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {/* Map Preview */}
        <div className="relative w-full h-64 bg-muted">
          {!mapError ? (
            <>
              <img
                key={`map-${zoomLevel}-${mapAttempt}-${resolvedTheme}`} // Force re-render when zoom, service, or theme changes
                src={
                  mapAttempt === 0 ? getStaticMapUrl(coords.lat, coords.lng, zoomLevel) :
                  mapAttempt === 1 ? getAlternativeMapUrl(coords.lat, coords.lng, zoomLevel) :
                  getTileMapUrl(coords.lat, coords.lng, zoomLevel)
                }
                alt={`Map of ${location}`}
                className="w-full h-full object-cover rounded-t-lg"
                onLoad={() => setMapLoading(false)}
                onError={() => {
                  console.log(`Map service ${mapAttempt} failed, trying next...`)
                  if (mapAttempt < 2) {
                    setMapAttempt(prev => prev + 1)
                  } else {
                    setMapError(true)
                    setMapLoading(false)
                  }
                }}
                loading="lazy"
              />
              
              {/* Map Pin Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <div className="relative">
                  {/* Pin shadow */}
                  <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-4 h-2 bg-black/20 rounded-full blur-sm"></div>
                  {/* Main pin */}
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg border-2 border-primary-foreground animate-bounce">
                    <MapPin className="w-5 h-5 text-primary-foreground" />
                  </div>
                </div>
              </div>
              
              {/* Loading Overlay */}
              {mapLoading && (
                <div className="absolute inset-0 bg-muted/50 backdrop-blur-sm flex items-center justify-center rounded-t-lg">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <LoadingSpinner size="sm" />
                    <span className="text-sm">Loading map...</span>
                  </div>
                </div>
              )}
              
              {/* Green Zoom Controls */}
              <div className="absolute top-3 right-3 flex flex-col gap-1 z-30">
                <Button
                  variant="default"
                  size="icon"
                  className="w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg border-0"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setZoomLevel(prev => Math.min(prev + 1, 18))
                    setMapAttempt(0) // Reset to first map service when zooming
                    setMapError(false) // Reset error state
                    setMapLoading(true) // Show loading while new map loads
                  }}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <Button
                  variant="default"
                  size="icon"
                  className="w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg border-0"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setZoomLevel(prev => Math.max(prev - 1, 8))
                    setMapAttempt(0) // Reset to first map service when zooming
                    setMapError(false) // Reset error state
                    setMapLoading(true) // Show loading while new map loads
                  }}
                >
                  <Minus className="w-4 h-4" />
                </Button>
              </div>
            </>
          ) : (
            // Enhanced fallback with theme-aware design
            <div className={`w-full h-full ${resolvedTheme === 'dark' 
              ? 'bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10' 
              : 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5'
            } flex items-center justify-center relative overflow-hidden`}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full" style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px), radial-gradient(circle at 75% 75%, currentColor 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }} />
              </div>
              
              {/* Location pin with better styling */}
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mb-3 shadow-lg animate-pulse">
                  <MapPin className="w-7 h-7 text-primary-foreground" />
                </div>
                <div className="text-sm font-semibold text-foreground text-center px-4 mb-2">
                  {locationData?.city && locationData?.country 
                    ? `${locationData.city}, ${locationData.country}`
                    : location
                  }
                </div>
                <div className="text-xs text-muted-foreground text-center px-4">
                  Click "View" to open in maps
                </div>
              </div>
              
              {/* Coordinate display with better styling */}
              <div className="absolute bottom-3 right-3 text-xs text-muted-foreground bg-background/90 backdrop-blur-sm rounded-md px-3 py-2 border border-border/50 shadow-sm">
                <div className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  <span>{coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Overlay button - only covers the map area, not the controls */}
          <div 
            className="absolute inset-0 bg-transparent hover:bg-black/10 transition-colors cursor-pointer flex items-center justify-center group z-0"
            onClick={handleOpenInMaps}
          >
            <Button 
              variant="secondary" 
              size="sm" 
              className="opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open in Maps
            </Button>
          </div>
        </div>
        
        {/* Location Info */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-sm font-medium text-foreground mb-1">
                {locationData?.city && locationData?.country 
                  ? `${locationData.city}, ${locationData.country}`
                  : location
                }
              </h4>
              {locationData?.formatted_address && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {locationData.formatted_address}
                </p>
              )}
              {coords && (
                <p className="text-xs text-muted-foreground mt-1">
                  {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                </p>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={handleOpenInMaps}>
              <MapPin className="w-4 h-4 mr-2" />
              View
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
