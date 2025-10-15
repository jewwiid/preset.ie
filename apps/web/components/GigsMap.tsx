'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import 'maplibre-gl/dist/maplibre-gl.css'
import { MapPin, Users, Calendar, DollarSign, ExternalLink, Sun, Moon, MapPinIcon, Banknote } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { TooltipProvider, Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Skeleton } from '@/components/ui/skeleton'
import { useTheme } from 'next-themes'

// Custom CSS for enhanced popup styling
const popupStyles = `
  .custom-popup .maplibregl-popup-content {
    background: transparent !important;
    padding: 0 !important;
    border-radius: 12px !important;
    box-shadow: none !important;
  }
  
  .custom-popup .maplibregl-popup-tip {
    border-top-color: hsl(var(--card)) !important;
  }
`

interface Gig {
  id: string
  title: string
  description: string
  location_text: string
  lat: number
  lng: number
  start_time: string
  end_time: string
  comp_type: string
  budget_min?: number
  budget_max?: number
  moodboards?: {
    id: string
    palette?: string[]
    items?: any[]
    summary?: string
  }[]
}

interface GigsMapProps {
  className?: string
  onGigSelect?: (gig: Gig) => void
  onGigsUpdate?: (gigs: Gig[]) => void
}

export default function GigsMap({ className, onGigSelect, onGigsUpdate }: GigsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [mapError, setMapError] = useState<string | null>(null)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  const [loading, setLoading] = useState(false)
  const { resolvedTheme } = useTheme()

  // Fetch gigs for current map bounds
  const fetchGigsForBounds = useCallback(
    async (bounds: any) => {
      if (!bounds) return

      setLoading(true)
      try {
        const bbox = `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`
        const response = await fetch(`/api/gigs/map?bbox=${bbox}&limit=500`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data = await response.json()
        console.log('GigsMap: Fetched gigs:', data.length, data)
        setGigs(data)
        
        // Notify parent component of gigs update
        if (onGigsUpdate) {
          onGigsUpdate(data)
        }
        
        // Update map source
        if (mapRef.current && mapRef.current.getSource('gigs')) {
          const geojsonData = {
            type: 'FeatureCollection' as const,
            features: data.map((gig: Gig) => ({
              type: 'Feature' as const,
              properties: {
                id: gig.id,
                title: gig.title,
                description: gig.description,
                location_text: gig.location_text,
                start_time: gig.start_time,
                end_time: gig.end_time,
                comp_type: gig.comp_type,
                budget_min: gig.budget_min,
                budget_max: gig.budget_max
              },
              geometry: {
                type: 'Point' as const,
                coordinates: [gig.lng, gig.lat]
              }
            }))
          }
          
          const source = mapRef.current.getSource('gigs') as any
          source.setData(geojsonData)
        }
      } catch (error) {
        console.error('Error fetching gigs:', error)
      } finally {
        setLoading(false)
      }
    },
    [onGigsUpdate]
  )

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    // Inject custom popup styles
    const styleElement = document.createElement('style')
    styleElement.textContent = popupStyles
    styleElement.setAttribute('data-popup-styles', 'true')
    document.head.appendChild(styleElement)

    const initMap = async () => {
      try {
        // Ensure container is ready
        if (!mapContainer.current) {
          console.error('Map container not ready')
          return
        }

        // Wait a bit for the container to be properly sized
        await new Promise(resolve => setTimeout(resolve, 100))

        // Dynamic import to avoid SSR issues
        const maplibregl = (await import('maplibre-gl')).default
        
        // Create simple map style without custom fonts to avoid 404 errors
        const mapStyle = {
          version: 8 as const,
          sources: {
            'osm': {
              type: 'raster' as const,
              tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
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
          center: [-6.2603, 53.3498], // Dublin, Ireland
          zoom: 12,
          maxZoom: 18,
          minZoom: 3,
          attributionControl: false
        })

        mapRef.current = map

        // Wait for map to load
        map.on('load', () => {
          console.log('Map loaded successfully')
          // Add gigs source
          map.addSource('gigs', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: []
            },
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50
          })

          // Add cluster circles
          map.addLayer({
            id: 'clusters',
            type: 'circle',
            source: 'gigs',
            filter: ['has', 'point_count'],
            paint: {
              'circle-color': '#00876f', // Use brand primary color
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,
                100,
                30,
                750,
                40
              ],
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff'
            }
          })

          console.log('Cluster layer added successfully')

          // Skip cluster count labels since we removed custom fonts
          // The clusters will still work, just without text labels

          // Add individual markers
          map.addLayer({
            id: 'unclustered-point',
            type: 'circle',
            source: 'gigs',
            filter: ['!', ['has', 'point_count']],
            paint: {
              'circle-color': '#00876f', // Brand primary color
              'circle-radius': 10, // Smaller, more appropriate size
              'circle-stroke-width': 2,
              'circle-stroke-color': '#ffffff',
              'circle-opacity': 0.9
            }
          })

          // Add click handlers
          map.on('click', 'clusters', (e) => {
            const features = map.queryRenderedFeatures(e.point, {
              layers: ['clusters']
            })
            
            if (features.length > 0) {
              const clusterId = features[0].properties?.cluster_id
              const source = map.getSource('gigs') as any
              source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
                if (err) return
                
                map.easeTo({
                  center: (features[0].geometry as any).coordinates as [number, number],
                  zoom: zoom
                })
              })
            }
          })

          map.on('click', 'unclustered-point', (e) => {
            const feature = e.features?.[0]
            if (feature) {
              const gig = gigs.find(g => g.id === feature.properties?.id)
              if (gig) {
                setSelectedGig(gig)
                // Notify parent component of gig selection
                if (onGigSelect) {
                  onGigSelect(gig)
                }
              }
            }
          })

          console.log('Individual markers layer added successfully')

          // Add hover effects
          map.on('mouseenter', 'clusters', () => {
            map.getCanvas().style.cursor = 'pointer'
          })

          map.on('mouseleave', 'clusters', () => {
            map.getCanvas().style.cursor = ''
          })

          map.on('mouseenter', 'unclustered-point', () => {
            map.getCanvas().style.cursor = 'pointer'
          })

          map.on('mouseleave', 'unclustered-point', () => {
            map.getCanvas().style.cursor = ''
          })

          // Add popup on hover
          let popup: any = null
          let hoverTimeout: ReturnType<typeof setTimeout> | null = null
          
          map.on('mouseenter', 'unclustered-point', (e) => {
            const feature = e.features?.[0]
            if (feature && feature.properties) {
              const props = feature.properties
              const gig = gigs.find(g => g.id === props.id)
              
              // Get moodboard data
              const moodboard = gig?.moodboards?.[0]
              const palette = moodboard?.palette || []
              const summary = moodboard?.summary
              const items = moodboard?.items || []
              
              // Get first image from items as featured image
              const featuredImage = items.find((item: any) => item.type === 'image' || item.url)?.url
              
              // Create enhanced popup content using theme-aware colors
              const popupContent = `
                <div style="
                  padding: 0;
                  max-width: 320px;
                  background: hsl(var(--card));
                  border-radius: 8px;
                  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                  border: 1px solid hsl(var(--border));
                  overflow: hidden;
                  backdrop-filter: blur(8px);
                ">
                  <!-- Card Header -->
                  <div style="padding: 16px 16px 12px 16px;">
                    <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;">
                      <h3 style="
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                        color: hsl(var(--card-foreground));
                        line-height: 1.4;
                        display: -webkit-box;
                        -webkit-line-clamp: 2;
                        -webkit-box-orient: vertical;
                        overflow: hidden;
                      ">${props.title}</h3>
                      <div style="
                        background: ${props.comp_type === 'TFP' ? 'hsl(var(--secondary))' : 'hsl(var(--primary) / 0.1)'};
                        color: ${props.comp_type === 'TFP' ? 'hsl(var(--secondary-foreground))' : 'hsl(var(--primary))'};
                        padding: 4px 8px;
                        border-radius: 6px;
                        font-size: 12px;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 4px;
                        white-space: nowrap;
                      ">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                          <circle cx="9" cy="7" r="4"/>
                          <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                        ${props.comp_type}
                      </div>
                    </div>
                  </div>
                  
                  <!-- Card Content -->
                  <div style="padding: 0 16px 16px 16px;">
                    <p style="
                      margin: 0 0 12px 0;
                      font-size: 14px;
                      color: hsl(var(--muted-foreground));
                      line-height: 1.4;
                      display: -webkit-box;
                      -webkit-line-clamp: 2;
                      -webkit-box-orient: vertical;
                      overflow: hidden;
                    ">${props.description || 'Looking for professional fashion models for an editorial photoshoot. We will be creating stunning...'}</p>
                    
                    <!-- Location -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: hsl(var(--muted-foreground)); flex-shrink: 0;">
                        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      <span style="font-size: 14px; color: hsl(var(--muted-foreground)); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${props.location_text}</span>
                    </div>
                    
                    <!-- Date & Time -->
                    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 12px;">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: hsl(var(--muted-foreground)); flex-shrink: 0;">
                        <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                        <line x1="16" x2="16" y1="2" y2="6"/>
                        <line x1="8" x2="8" y1="2" y2="6"/>
                        <line x1="3" x2="21" y1="10" y2="10"/>
                      </svg>
                      <span style="font-size: 14px; color: hsl(var(--muted-foreground));">${new Date(props.start_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      <span style="font-size: 12px; color: hsl(var(--muted-foreground));">•</span>
                      <span style="font-size: 14px; color: hsl(var(--muted-foreground));">${new Date(props.start_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>
                    </div>
                    
                    <!-- Actions -->
                    <div style="display: flex; gap: 8px;">
                      <button style="
                        flex: 1;
                        background: hsl(var(--primary));
                        color: hsl(var(--primary-foreground));
                        border: 1px solid hsl(var(--primary));
                        padding: 8px 12px;
                        border-radius: 6px;
                        font-size: 14px;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 4px;
                        cursor: pointer;
                        transition: all 0.2s;
                      " onmouseover="this.style.background='hsl(var(--primary) / 0.9)'" onmouseout="this.style.background='hsl(var(--primary))'" onclick="window.open('/gigs/${props.id}', '_blank')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M1 12s4-8 9-8 9 8 9 8-4 8-9 8-9-8-9-8z"/>
                          <circle cx="12" cy="12" r="3"/>
                        </svg>
                        View Details
                      </button>
                      <button style="
                        background: hsl(var(--secondary));
                        color: hsl(var(--secondary-foreground));
                        border: 1px solid hsl(var(--border));
                        padding: 8px;
                        border-radius: 6px;
                        cursor: pointer;
                        transition: all 0.2s;
                      " onmouseover="this.style.background='hsl(var(--secondary) / 0.8)'" onmouseout="this.style.background='hsl(var(--secondary))'" onclick="window.open('/gigs/${props.id}', '_blank')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15,3 21,3 21,9"/>
                          <line x1="10" x2="21" y1="14" y2="3"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              `
              
              // Create popup with improved hover behavior
              if (popup) popup.remove()
              popup = new maplibregl.Popup({
                closeButton: false,
                closeOnClick: false,
                closeOnMove: false, // Don't close on map movement
                offset: [0, -10],
                className: 'custom-popup'
              })
              .setLngLat((feature.geometry as any).coordinates)
              .setHTML(popupContent)
              .addTo(map)
              
              // Add hover area to popup for better UX
              const popupElement = popup.getElement()
              if (popupElement) {
                popupElement.addEventListener('mouseenter', () => {
                  if (hoverTimeout) {
                    clearTimeout(hoverTimeout)
                    hoverTimeout = null
                  }
                })
                
                popupElement.addEventListener('mouseleave', () => {
                  hoverTimeout = setTimeout(() => {
                    if (popup) {
                      popup.remove()
                      popup = null
                    }
                  }, 300) // Small delay to prevent flickering
                })
              }
            }
          })

          map.on('mouseleave', 'unclustered-point', () => {
            // Add delay before closing to allow moving to popup
            hoverTimeout = setTimeout(() => {
              if (popup) {
                popup.remove()
                popup = null
              }
            }, 200)
          })

          setMapLoaded(true)
          
          // Load initial gigs
          const bounds = map.getBounds()
          fetchGigsForBounds(bounds)
        })

        // Handle map movement
        map.on('moveend', () => {
          if (mapLoaded) {
            const bounds = map.getBounds()
            fetchGigsForBounds(bounds)
          }
        })

        // Handle errors
        map.on('error', (e) => {
          console.error('Map error details:', {
            error: e.error,
            type: e.type,
            message: e.error?.message,
            stack: e.error?.stack
          })
          setMapError('Failed to load map. Please refresh the page.')
        })

        // Handle resize
        map.on('resize', () => {
          // Map resized
        })

        // Cleanup
        return () => {
          if (mapRef.current) {
            mapRef.current.remove()
            mapRef.current = null
          }
          // Clean up injected styles
          const existingStyle = document.querySelector('style[data-popup-styles]')
          if (existingStyle) {
            existingStyle.remove()
          }
        }

      } catch (error) {
        console.error('Failed to initialize map:', error)
        setMapError('Failed to load map. Please refresh the page.')
      }
    }

    initMap()
  }, [fetchGigsForBounds, mapLoaded])

  // Handle window resize for aspect ratio
  useEffect(() => {
    const handleResize = () => {
      if (mapRef.current) {
        mapRef.current.resize()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Reset view
  const resetView = () => {
    if (mapRef.current) {
      mapRef.current.easeTo({
        center: [-6.2603, 53.3498],
        zoom: 12
      })
    }
  }

  // Toggle theme
  const toggleTheme = () => {
    if (mapRef.current && mapLoaded) {
      const isDark = resolvedTheme === 'dark'
      const newStyle = {
        version: 8 as const,
        name: 'preset-map',
        sources: {
          'raster-tiles': {
            type: 'raster' as const,
            tiles: isDark ? [
              'https://cartodb-basemaps-a.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png'
            ] : [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: isDark ? '© CartoDB, © OpenStreetMap contributors' : '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'raster-tiles',
            type: 'raster' as const,
            source: 'raster-tiles',
            paint: {
              'raster-opacity': isDark ? 0.9 : 1.0
            }
          }
        ]
      }
      
      mapRef.current.setStyle(newStyle)
    }
  }

  return (
    <div className={`relative w-full ${className}`} style={{ aspectRatio: '5/4' }}>
      {/* Map Container */}
      <div
        ref={mapContainer}
        className="w-full h-full rounded-lg overflow-hidden bg-muted"
      />

      {/* Loading Overlay */}
      {!mapLoaded && !mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-lg">
          <div className="text-center space-y-4">
            <Skeleton className="h-8 w-8 rounded-full mx-auto" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-32 mx-auto" />
              <Skeleton className="h-3 w-24 mx-auto" />
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {mapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg">
          <div className="text-center p-6">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">Map Unavailable</h3>
            <p className="text-sm text-muted-foreground mb-4">{mapError}</p>
            <Button 
              onClick={() => {
                setMapError(null)
                if (mapRef.current) {
                  mapRef.current.remove()
                  mapRef.current = null
                  setMapLoaded(false)
                }
              }}
              variant="outline"
            >
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Map Controls */}
      {mapLoaded && (
        <Card className="absolute top-4 left-4 p-2 bg-card/95 backdrop-blur-sm border-border shadow-sm">
          <div className="flex flex-col space-y-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={resetView}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-accent"
                  >
                    <MapPin className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset View</p>
                </TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={toggleTheme}
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-accent"
                  >
                    {resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Theme</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </Card>
      )}

      {/* Selected Gig Dialog */}
      <Dialog open={!!selectedGig} onOpenChange={() => setSelectedGig(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedGig?.title}</DialogTitle>
          </DialogHeader>
          {selectedGig && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{selectedGig.description}</p>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedGig.location_text}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(selectedGig.start_time).toLocaleDateString()}</span>
                </div>
                
                <div className="flex items-center gap-2 text-sm">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedGig.comp_type}</span>
                </div>
              </div>
              
              <Button asChild className="w-full">
                <a href={`/gigs/${selectedGig.id}`}>
                  View Details
                  <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}