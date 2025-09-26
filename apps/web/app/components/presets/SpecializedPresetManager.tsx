'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { 
  Camera, 
  Package, 
  ShoppingCart, 
  Briefcase, 
  Wand2, 
  Star,
  Users,
  TrendingUp
} from 'lucide-react'

interface Preset {
  id: string
  name: string
  description: string
  category: string
  usage_count: number
  is_featured: boolean
  style_settings: any
  technical_settings: any
  ai_metadata: any
}

interface SpecializedPresetManagerProps {
  onPresetSelect?: (preset: Preset) => void
  showStats?: boolean
}

export default function SpecializedPresetManager({ 
  onPresetSelect, 
  showStats = true 
}: SpecializedPresetManagerProps) {
  const [headshotPresets, setHeadshotPresets] = useState<Preset[]>([])
  const [productPresets, setProductPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('headshot')

  useEffect(() => {
    fetchSpecializedPresets()
  }, [])

  const fetchSpecializedPresets = async () => {
    try {
      setLoading(true)
      
      // Fetch headshot presets
      const headshotResponse = await fetch('/api/presets?category=headshot&limit=10')
      const headshotData = await headshotResponse.json()
      setHeadshotPresets(headshotData.presets || [])

      // Fetch product photography presets
      const productResponse = await fetch('/api/presets?category=product_photography&limit=10')
      const productData = await productResponse.json()
      setProductPresets(productData.presets || [])

    } catch (error) {
      console.error('Error fetching specialized presets:', error)
    } finally {
      setLoading(false)
    }
  }

  const PresetCard = ({ preset, category }: { preset: Preset, category: string }) => (
    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onPresetSelect?.(preset)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{preset.name}</CardTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">{preset.description}</p>
          </div>
          {preset.is_featured && (
            <Star className="h-5 w-5 text-primary-500 fill-current" />
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Category Badge */}
          <Badge variant="secondary" className="text-xs">
            {category === 'headshot' ? '📷 Headshot' : '📦 Product'}
          </Badge>
          
          {/* Usage Stats */}
          {showStats && (
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Users className="h-4 w-4 mr-1" />
                {preset.usage_count} uses
              </div>
              {preset.ai_metadata?.specialization && (
                <Badge variant="outline" className="text-xs">
                  {preset.ai_metadata.specialization.replace('_', ' ')}
                </Badge>
              )}
            </div>
          )}

          {/* Technical Details */}
          <div className="space-y-1 text-xs text-muted-foreground">
            {preset.technical_settings?.resolution && (
              <div>Resolution: {preset.technical_settings.resolution}</div>
            )}
            {preset.style_settings?.lighting && (
              <div>Lighting: {preset.style_settings.lighting.replace('_', ' ')}</div>
            )}
            {preset.ai_metadata?.use_case && (
              <div>Use Case: {preset.ai_metadata.use_case.replace('_', ' ')}</div>
            )}
          </div>

          {/* Action Button */}
          <Button size="sm" className="w-full" variant="outline">
            <Wand2 className="h-4 w-4 mr-2" />
            Use Preset
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading specialized presets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Specialized Photography Presets</h2>
        <p className="text-muted-foreground">
          Professional presets optimized for headshots and product photography
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="headshot" className="flex items-center">
            <Camera className="h-4 w-4 mr-2" />
            Headshots ({headshotPresets.length})
          </TabsTrigger>
          <TabsTrigger value="product" className="flex items-center">
            <Package className="h-4 w-4 mr-2" />
            Product Photography ({productPresets.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="headshot" className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">Professional Headshot Presets</h3>
            <p className="text-muted-foreground">
              Optimized for LinkedIn profiles, business portraits, and professional networking
            </p>
          </div>

          {headshotPresets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Camera className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No headshot presets yet</h3>
                <p className="text-muted-foreground mb-4">
                  Specialized headshot presets will appear here once they're created.
                </p>
                <Button variant="outline">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Create Headshot Preset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {headshotPresets.map((preset) => (
                <PresetCard key={preset.id} preset={preset} category="headshot" />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="product" className="space-y-4">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold mb-2">Product Photography Presets</h3>
            <p className="text-muted-foreground">
              Perfect for e-commerce catalogs, marketing materials, and product showcases
            </p>
          </div>

          {productPresets.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No product presets yet</h3>
                <p className="text-muted-foreground mb-4">
                  Specialized product photography presets will appear here once they're created.
                </p>
                <Button variant="outline">
                  <Wand2 className="h-4 w-4 mr-2" />
                  Create Product Preset
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productPresets.map((preset) => (
                <PresetCard key={preset.id} preset={preset} category="product" />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Quick Stats */}
      {showStats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Preset Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{headshotPresets.length}</div>
                <div className="text-sm text-muted-foreground">Headshot Presets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{productPresets.length}</div>
                <div className="text-sm text-muted-foreground">Product Presets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {headshotPresets.filter(p => p.is_featured).length + productPresets.filter(p => p.is_featured).length}
                </div>
                <div className="text-sm text-muted-foreground">Featured Presets</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {headshotPresets.reduce((sum, p) => sum + p.usage_count, 0) + 
                   productPresets.reduce((sum, p) => sum + p.usage_count, 0)}
                </div>
                <div className="text-sm text-muted-foreground">Total Uses</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
