'use client'

import { useState } from 'react'
import { Search, Filter, Camera, Lightbulb, Palette, Film, X } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'

interface CinematicFilters {
  cinematic_query?: string
  director_style?: string
  camera_angle?: string
  lighting_style?: string
  color_palette?: string
}

interface CinematicShowcaseFiltersProps {
  onFiltersChange: (filters: CinematicFilters) => void
  onClearFilters: () => void
  activeFilters: CinematicFilters
}

export default function CinematicShowcaseFilters({ 
  onFiltersChange, 
  onClearFilters, 
  activeFilters 
}: CinematicShowcaseFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [localFilters, setLocalFilters] = useState<CinematicFilters>(activeFilters)

  const handleFilterChange = (key: keyof CinematicFilters, value: string) => {
    const newFilters = { ...localFilters, [key]: value || undefined }
    setLocalFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleClearFilters = () => {
    setLocalFilters({})
    onClearFilters()
  }

  const hasActiveFilters = Object.values(activeFilters).some(value => value)

  const directorStyles = [
    'wes-anderson', 'roger-deakins', 'christopher-doyle', 'david-fincher',
    'sofia-coppola', 'terrence-malick', 'christopher-nolan', 'denis-villeneuve',
    'greta-gerwig', 'jordan-peele'
  ]

  const cameraAngles = [
    'high-angle', 'low-angle', 'eye-level', 'worms-eye-view', 
    'birds-eye-view', 'dutch-angle', 'over-the-shoulder'
  ]

  const lightingStyles = [
    'natural-light', 'high-key', 'low-key', 'chiaroscuro',
    'backlit-silhouette', 'colored-gels', 'soft-light', 'hard-light'
  ]

  const colorPalettes = [
    'warm-golden', 'cool-blue', 'monochrome', 'sepia', 'desaturated',
    'high-saturation', 'pastel', 'earth-tones', 'neon', 'vibrant'
  ]

  const formatLabel = (value: string) => {
    return value.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Film className="h-5 w-5 text-purple-600" />
            <CardTitle className="text-lg">Cinematic Filters</CardTitle>
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {Object.values(activeFilters).filter(v => v).length} active
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearFilters}
                className="text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-1" />
              {isExpanded ? 'Hide' : 'Show'} Filters
            </Button>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0">
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="search" className="text-xs">
                <Search className="h-3 w-3 mr-1" />
                Search
              </TabsTrigger>
              <TabsTrigger value="camera" className="text-xs">
                <Camera className="h-3 w-3 mr-1" />
                Camera
              </TabsTrigger>
              <TabsTrigger value="lighting" className="text-xs">
                <Lightbulb className="h-3 w-3 mr-1" />
                Lighting
              </TabsTrigger>
              <TabsTrigger value="style" className="text-xs">
                <Palette className="h-3 w-3 mr-1" />
                Style
              </TabsTrigger>
            </TabsList>

            <TabsContent value="search" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Cinematic Parameters</label>
                <Input
                  placeholder="Search for director styles, camera angles, lighting..."
                  value={localFilters.cinematic_query || ''}
                  onChange={(e) => handleFilterChange('cinematic_query', e.target.value)}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Search across all cinematic parameters (e.g., "wes anderson", "low angle", "chiaroscuro")
                </p>
              </div>
            </TabsContent>

            <TabsContent value="camera" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Camera Angle</label>
                <Select
                  value={localFilters.camera_angle || ''}
                  onValueChange={(value) => handleFilterChange('camera_angle', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select camera angle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All angles</SelectItem>
                    {cameraAngles.map(angle => (
                      <SelectItem key={angle} value={angle}>
                        {formatLabel(angle)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="lighting" className="space-y-4 mt-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Lighting Style</label>
                <Select
                  value={localFilters.lighting_style || ''}
                  onValueChange={(value) => handleFilterChange('lighting_style', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lighting style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All lighting styles</SelectItem>
                    {lightingStyles.map(lighting => (
                      <SelectItem key={lighting} value={lighting}>
                        {formatLabel(lighting)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Director Style</label>
                  <Select
                    value={localFilters.director_style || ''}
                    onValueChange={(value) => handleFilterChange('director_style', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select director style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All directors</SelectItem>
                      {directorStyles.map(director => (
                        <SelectItem key={director} value={director}>
                          {formatLabel(director)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Color Palette</label>
                  <Select
                    value={localFilters.color_palette || ''}
                    onValueChange={(value) => handleFilterChange('color_palette', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select color palette" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All palettes</SelectItem>
                      {colorPalettes.map(palette => (
                        <SelectItem key={palette} value={palette}>
                          {formatLabel(palette)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Active Filters Display */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFilters).map(([key, value]) => {
                  if (!value) return null
                  return (
                    <Badge key={key} variant="secondary" className="text-xs">
                      {key.replace('_', ' ')}: {formatLabel(value)}
                      <button
                        onClick={() => handleFilterChange(key as keyof CinematicFilters, '')}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )
                })}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  )
}
