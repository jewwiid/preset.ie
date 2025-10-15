'use client'

import { useState, useEffect, useRef } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, ExternalLink, Plus, Minus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
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
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    latitude && longitude ? { lat: latitude, lng: longitude } : null
  )
  const [locationData, setLocationData] = useState<ParsedLocation | null>(null)
  const [loading, setLoading] = useState(false)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(14)
  const { resolvedTheme } = useTheme()

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

  // Initialize map
  useEffect(() => {
    if (!showFullMap || !coords || mapRef.current || !mapContainer.current) return

    const initMap = async () => {
      try {
        const maplibregl = (await import('maplibre-gl')).default

        const isDark = resolvedTheme === 'dark'
        
        // Create map style without custom fonts to avoid 404 errors
        const mapStyle = {
          version: 8 as const,
          sources: {
            'osm': {
              type: 'raster' as const,
              tiles: isDark ? [
                'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
                'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
              ] : [
                'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
              ],
              tileSize: 256
            }
          },
          layers: [
            {
              id: 'osm',
              type: 'raster' as const,
              source: 'osm'
            }
          ]
        }

        // Create map instance
        const map = new maplibregl.Map({
          container: mapContainer.current,
          style: mapStyle,
          center: [coords.lng, coords.lat],
          zoom: zoomLevel,
          maxZoom: 18,
          minZoom: 8,
          attributionControl: false,
          interactive: true // Allow panning and zooming
        })

        mapRef.current = map

        map.on('load', () => {
          setMapLoaded(true)

          // Add custom marker
          const el = document.createElement('div')
          el.className = 'custom-marker'
          el.style.width = '32px'
          el.style.height = '32px'
          el.style.backgroundImage = 'url(data:image/svg+xml;base64,' + btoa(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isDark ? '#2dd4bf' : '#00876f'}" stroke="${isDark ? '#1e293b' : '#ffffff'}" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3" fill="${isDark ? '#1e293b' : '#ffffff'}"></circle>
            </svg>
          `) + ')'
          el.style.backgroundSize = 'contain'
          el.style.backgroundRepeat = 'no-repeat'
          el.style.cursor = 'pointer'

          const marker = new maplibregl.Marker({ element: el })
            .setLngLat([coords.lng, coords.lat])
            .addTo(map)

          markerRef.current = marker
        })

        map.on('error', (e) => {
          console.error('Map error:', e)
          setMapError(true)
        })

        // Update zoom level when user zooms
        map.on('zoomend', () => {
          setZoomLevel(Math.round(map.getZoom()))
        })

      } catch (error) {
        console.error('Failed to initialize map:', error)
        setMapError(true)
      }
    }

    initMap()

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [coords, showFullMap, resolvedTheme])

  // Update map style when theme changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const isDark = resolvedTheme === 'dark'
    const style = mapRef.current.getStyle()
    
    if (style) {
      const newTiles = isDark ? [
        'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
      ] : [
        'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ]

      const osmSource = style.sources['osm'] as any
      if (osmSource && osmSource.tiles) {
        osmSource.tiles = newTiles
        mapRef.current.setStyle(style)
      }

      // Update marker color
      if (markerRef.current && coords) {
        const el = document.createElement('div')
        el.className = 'custom-marker'
        el.style.width = '32px'
        el.style.height = '32px'
        el.style.backgroundImage = 'url(data:image/svg+xml;base64,' + btoa(`
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${isDark ? '#2dd4bf' : '#00876f'}" stroke="${isDark ? '#1e293b' : '#ffffff'}" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="${isDark ? '#1e293b' : '#ffffff'}"></circle>
          </svg>
        `) + ')'
        el.style.backgroundSize = 'contain'
        el.style.backgroundRepeat = 'no-repeat'
        el.style.cursor = 'pointer'

        markerRef.current.setLngLat([coords.lng, coords.lat])
        markerRef.current.getElement().replaceWith(el)
      }
    }
  }, [resolvedTheme, mapLoaded, coords])

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

  const handleZoomIn = () => {
    if (mapRef.current && zoomLevel < 18) {
      mapRef.current.zoomIn()
    }
  }

  const handleZoomOut = () => {
    if (mapRef.current && zoomLevel > 8) {
      mapRef.current.zoomOut()
    }
  }

  if (loading) {
    return (
      <Card className={`${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
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

  // Full map mode with interactive MapLibre
  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {/* Interactive Map */}
        <div className="relative w-full h-64 bg-muted">
          {!mapError ? (
            <>
              {!mapLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-t-lg z-10">
                  <Skeleton className="h-full w-full rounded-t-lg" />
                </div>
              )}
              
              <div ref={mapContainer} className="w-full h-full rounded-t-lg" />
              
              {/* Zoom Controls with Tooltips */}
              <div className="absolute top-3 right-3 flex flex-col gap-1 z-30">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="icon"
                        className="w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                        onClick={handleZoomIn}
                        disabled={zoomLevel >= 18}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom in</p>
                    </TooltipContent>
                  </Tooltip>
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="default"
                        size="icon"
                        className="w-8 h-8 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                        onClick={handleZoomOut}
                        disabled={zoomLevel <= 8}
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Zoom out</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </>
          ) : (
            // Enhanced fallback with theme-aware design
            <div className={`w-full h-full ${resolvedTheme === 'dark' 
              ? 'bg-gradient-to-br from-primary/30 via-primary/20 to-primary/10' 
              : 'bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5'
            } flex items-center justify-center relative overflow-hidden rounded-t-lg`}>
              {/* Background pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="w-full h-full" style={{
                  backgroundImage: `radial-gradient(circle at 25% 25%, currentColor 1px, transparent 1px), radial-gradient(circle at 75% 75%, currentColor 1px, transparent 1px)`,
                  backgroundSize: '20px 20px'
                }} />
              </div>
              
              {/* Location pin */}
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
              
            </div>
          )}
        </div>
        
        {/* Location Info */}
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="text-base font-semibold text-foreground mb-1">
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
