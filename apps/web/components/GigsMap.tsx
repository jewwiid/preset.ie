'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import maplibregl from 'maplibre-gl'
import { MapPin, Users, Calendar, DollarSign, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTheme } from 'next-themes'

// Types
import { MapGig } from '@/app/gigs/types'

type Gig = MapGig

interface GigsMapProps {
  onGigSelect?: (gig: Gig) => void
  className?: string
}

export default function GigsMap({ onGigSelect, className = '' }: GigsMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  const { resolvedTheme } = useTheme()

  // Debounced fetch function
  const fetchGigsForBounds = useCallback(
    debounce(async (bounds: maplibregl.LngLatBounds) => {
      if (!mapRef.current) return

      setLoading(true)
      try {
        const bbox = [
          bounds.getWest(),
          bounds.getSouth(),
          bounds.getEast(),
          bounds.getNorth()
        ].join(',')

        const response = await fetch(`/api/gigs/map?bbox=${bbox}&limit=500`)
        if (!response.ok) throw new Error('Failed to fetch gigs')
        
        const data = await response.json()
        setGigs(data || [])
      } catch (error) {
        console.error('Error fetching gigs:', error)
      } finally {
        setLoading(false)
      }
    }, 300),
    []
  )

  // Initialize map
  useEffect(() => {
    if (mapRef.current || !mapContainer.current) return

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'raster-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors'
          }
        },
        layers: [
          {
            id: 'simple-tiles',
            type: 'raster',
            source: 'raster-tiles'
          }
        ]
      },
      center: [-6.2603, 53.3498], // Dublin, Ireland
      zoom: 12
    })

    mapRef.current = map

    map.on('load', () => {
      setMapLoaded(true)

      // Add gigs source with clustering
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

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'gigs',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step',
            ['get', 'point_count'],
            '#51bbd6', // 1-10 gigs
            10, '#f1f075', // 10-50 gigs
            50, '#f28cb1' // 50+ gigs
          ],
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            15, // 1-10 gigs
            10, 20, // 10-50 gigs
            50, 25 // 50+ gigs
          ]
        }
      })

      // Note: Removed cluster count labels to avoid font/glyph configuration issues
      // Clusters will be distinguished by size and color instead

      // Individual gig markers
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'gigs',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#00D1B2',
          'circle-radius': 8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff'
        }
      })

      // Click handlers
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] })
        const clusterId = features[0].properties.cluster_id
        const source = map.getSource('gigs') as maplibregl.GeoJSONSource
        source.getClusterExpansionZoom(clusterId).then((zoom) => {
          const geometry = features[0].geometry as GeoJSON.Point
          map.easeTo({
            center: geometry.coordinates as [number, number],
            zoom: zoom
          })
        })
      })

      map.on('click', 'unclustered-point', (e) => {
        const feature = e.features[0]
        const gig = feature.properties as Gig
        setSelectedGig(gig)
        onGigSelect?.(gig)
      })

      // Change cursor on hover
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

      // Fetch initial gigs
      fetchGigsForBounds(map.getBounds())
    })

    // Fetch gigs when map moves
    map.on('moveend', () => {
      fetchGigsForBounds(map.getBounds())
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [fetchGigsForBounds])

  // Update gigs data when fetched
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return

    const features = gigs.map(gig => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [gig.lng, gig.lat]
      },
      properties: gig
    }))

    const geojson = {
      type: 'FeatureCollection' as const,
      features
    }

    const source = mapRef.current.getSource('gigs') as maplibregl.GeoJSONSource
    if (source) {
      source.setData(geojson)
    }
  }, [gigs, mapLoaded])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getCompTypeColor = (compType: string) => {
    switch (compType) {
      case 'PAID': return 'bg-green-100 text-green-800'
      case 'TFP': return 'bg-blue-100 text-blue-800'
      case 'EXPENSES': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className={`relative ${className}`}>
      {/* Map Container */}
      <div ref={mapContainer} className="w-full h-full rounded-lg overflow-hidden" />
      
      {/* Loading Overlay */}
      {loading && (
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
            Loading gigs...
          </div>
        </div>
      )}

      {/* Selected Gig Popup */}
      {selectedGig && (
        <div className="absolute bottom-4 left-4 right-4 z-10">
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg text-gray-900 truncate">
                    {selectedGig.title}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {selectedGig.description}
                  </p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{selectedGig.location_text}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(selectedGig.start_time)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getCompTypeColor(selectedGig.comp_type)}>
                      {selectedGig.comp_type}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    onClick={() => window.open(`/gigs/${selectedGig.id}`, '_blank')}
                    className="whitespace-nowrap"
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedGig(null)}
                  >
                    Close
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map Controls */}
      {mapLoaded && (
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white/90 backdrop-blur-sm"
            onClick={() => {
              if (mapRef.current) {
                mapRef.current.easeTo({
                  center: [-6.2603, 53.3498],
                  zoom: 12
                })
              }
            }}
          >
            <MapPin className="w-4 h-4 mr-1" />
            Reset View
          </Button>
        </div>
      )}
    </div>
  )
}

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}
