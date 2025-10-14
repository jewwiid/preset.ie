'use client'

import { useState, useEffect } from 'react'
import { Palette, Search, Star, Users, PlayCircle, Plus, Loader2, Settings, Film, Camera, Lightbulb, Palette as PaletteIcon, Trash2, ImageIcon, Grid3X3, List, Heart, Wand2, Package } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Input } from '../../../components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog'
import { useAuth } from '../../../lib/auth-context'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { usePresetSearch } from '../../../hooks/usePresetSearch'
import PresetCard from './PresetCard'
import PresetFilters from './PresetFilters'
import PresetCategoryNav from './PresetCategoryNav'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface Preset {
  id: string
  name: string
  description?: string
  category: string
  prompt_template: string
  negative_prompt?: string
  style_settings: any
  technical_settings: any
  cinematic_settings?: {
    enableCinematicMode?: boolean
    cinematicParameters?: any
    enhancedPrompt?: string
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
    generationMode?: 'text-to-image' | 'image-to-image'
    selectedProvider?: 'nanobanana' | 'seedream'
    video?: {
      cameraMovement?: string
      videoStyle?: string
      duration?: number
      provider?: 'seedream' | 'wan'
      resolution?: string
    }
  }
  sample_images?: {
    before_images: string[]
    after_images: string[]
    descriptions: string[]
  }
  ai_metadata: any
  seedream_config: any
  usage_count: number
  likes_count: number
  is_public: boolean
  is_featured: boolean
  created_at: string
  creator: {
    id: string
    display_name: string
    handle: string
    avatar_url?: string
  }
}

interface PresetSelectorProps {
  onPresetSelect: (preset: Preset | null) => void
  selectedPreset?: Preset | null
  onSaveAsPreset?: (presetData: any) => void
  currentSettings?: {
    prompt: string
    style: string
    resolution: string
    aspectRatio: string
    consistencyLevel: string
    intensity: number
    numImages: number
    // Cinematic parameters
    enableCinematicMode?: boolean
    cinematicParameters?: any
    enhancedPrompt?: string
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
    generationMode?: 'text-to-image' | 'image-to-image'
    selectedProvider?: 'nanobanana' | 'seedream'
    // Video-specific settings
    motionType?: string
    videoStyle?: string
    duration?: number
    videoResolution?: string
  }
}

export default function PresetSelector({ 
  onPresetSelect, 
  selectedPreset,
  onSaveAsPreset,
  currentSettings
}: PresetSelectorProps) {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('popular')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Use preset search hook
  const { presets, loading, fetchPresets } = usePresetSearch({
    category: selectedCategory,
    searchQuery,
    sortBy,
    limit: 20,
  })

  const [trendingPresets, setTrendingPresets] = useState<Preset[]>([])
  const [trendingLoading, setTrendingLoading] = useState(false)
  const [showTrending, setShowTrending] = useState(false)
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [presetToDelete, setPresetToDelete] = useState<Preset | null>(null)
  const [saveFormData, setSaveFormData] = useState({
    name: '',
    description: '',
    category: 'photography',
    is_public: false
  })
  
  // Sample images state
  const [savedImages, setSavedImages] = useState<Array<{
    id: string
    image_url: string
    title: string
    generation_metadata: any
    created_at: string
  }>>([])
  const [selectedSampleImages, setSelectedSampleImages] = useState<{
    before_images: string[]
    after_images: string[]
    descriptions: string[]
  }>({
    before_images: [],
    after_images: [],
    descriptions: []
  })
  const [savedImagesLoading, setSavedImagesLoading] = useState(false)

  const categories = [
    { value: 'all', label: 'All Categories' },
    
    // Original Categories
    { value: 'style', label: 'Style' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'technical', label: 'Technical' },
    { value: 'custom', label: 'Custom' },
    
    // NEW: Specialized Photography Categories
    { value: 'headshot', label: '📷 Headshot' },
    { value: 'product_photography', label: '📦 Product Photography' },
    { value: 'ecommerce', label: '🛒 E-commerce' },
    { value: 'corporate_portrait', label: '👔 Corporate Portrait' },
    { value: 'linkedin_photo', label: '💼 LinkedIn Photo' },
    
    // Photography Categories
    { value: 'photography', label: 'Photography' },
    { value: 'portrait', label: 'Portrait' },
    { value: 'fashion', label: 'Fashion' },
    { value: 'editorial', label: 'Editorial' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'street', label: 'Street' },
    { value: 'architecture', label: 'Architecture' },
    { value: 'nature', label: 'Nature' },
    
    // Artistic Categories
    { value: 'artistic', label: 'Artistic' },
    { value: 'painting', label: 'Painting' },
    { value: 'illustration', label: 'Illustration' },
    { value: 'digital_art', label: 'Digital Art' },
    { value: 'abstract', label: 'Abstract' },
    { value: 'surreal', label: 'Surreal' },
    { value: 'minimalist', label: 'Minimalist' },
    { value: 'maximalist', label: 'Maximalist' },
    
    // Creative Categories
    { value: 'creative', label: 'Creative' },
    { value: 'experimental', label: 'Experimental' },
    { value: 'conceptual', label: 'Conceptual' },
    { value: 'fantasy', label: 'Fantasy' },
    { value: 'sci_fi', label: 'Sci-Fi' },
    { value: 'steampunk', label: 'Steampunk' },
    { value: 'gothic', label: 'Gothic' },
    { value: 'vintage', label: 'Vintage' },
    { value: 'retro', label: 'Retro' },
    { value: 'futuristic', label: 'Futuristic' },
    
    // Professional Categories
    { value: 'professional', label: 'Professional' },
    { value: 'corporate', label: 'Corporate' },
    { value: 'branding', label: 'Branding' },
    { value: 'marketing', label: 'Marketing' },
    
    // Specialized Categories
    { value: 'film_look', label: 'Film Look' },
    { value: 'dramatic', label: 'Dramatic' },
    { value: 'moody', label: 'Moody' },
    { value: 'bright', label: 'Bright' },
    { value: 'monochrome', label: 'Monochrome' },
    { value: 'colorful', label: 'Colorful' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'warm', label: 'Warm' },
    { value: 'cool', label: 'Cool' },
    
    // Technical Categories
    { value: 'hdr', label: 'HDR' },
    { value: 'macro', label: 'Macro' },
    { value: 'panoramic', label: 'Panoramic' },
    { value: 'composite', label: 'Composite' },
    { value: 'retouching', label: 'Retouching' },
    { value: 'color_grading', label: 'Color Grading' },
    { value: 'post_processing', label: 'Post Processing' }
  ]

  // Fetch trending presets when dialog opens
  useEffect(() => {
    if (showPresetDialog && user && session && trendingPresets.length === 0) {
      fetchTrendingPresets()
    }
  }, [showPresetDialog, user, session])

  const fetchSavedImages = async () => {
    if (!user || !session?.access_token) return

    setSavedImagesLoading(true)
    try {
      const response = await fetch('/api/playground/gallery', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) throw new Error('Failed to fetch saved images')
      
      const data = await response.json()
      setSavedImages(data.images || [])
    } catch (error) {
      console.error('Error fetching saved images:', error)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to load saved images'
      })
    } finally {
      setSavedImagesLoading(false)
    }
  }

  useEffect(() => {
    if (showSaveDialog) {
      fetchSavedImages()
    }
  }, [showSaveDialog, user, session])

  // fetchPresets is now provided by usePresetSearch hook

  const fetchTrendingPresets = async () => {
    if (!session?.access_token) return

    setTrendingLoading(true)
    try {
      const response = await fetch('/api/presets/trending?limit=6', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error('Failed to fetch trending presets')

      const data = await response.json()
      setTrendingPresets(data.presets || [])
    } catch (error) {
      console.error('Error fetching trending presets:', error)
      showFeedback({
        type: 'error',
        title: 'Failed to Load Trending Presets',
        message: 'Could not load trending presets. Please try again.'
      })
    } finally {
      setTrendingLoading(false)
    }
  }

  const handlePresetSelect = async (preset: Preset) => {
    onPresetSelect(preset)
    setShowPresetDialog(false)
    
    showFeedback({
      type: 'success',
      title: 'Preset Applied',
      message: `Applied "${preset.name}" preset to your settings.`
    })
  }

  const handleSaveAsPreset = async () => {
    if (!currentSettings || !session?.access_token) return

    if (!saveFormData.name) {
      showFeedback({
        type: 'warning',
        title: 'Missing Name',
        message: 'Please enter a name for your preset.'
      })
      return
    }

    try {
      const presetData = {
        name: saveFormData.name,
        description: saveFormData.description,
        category: saveFormData.category,
        prompt_template: currentSettings.prompt,
        style_settings: {
          style: currentSettings.style,
          intensity: currentSettings.intensity,
          consistency_level: currentSettings.consistencyLevel
        },
        technical_settings: {
          aspect_ratio: currentSettings.aspectRatio,
          resolution: currentSettings.resolution,
          num_images: currentSettings.numImages
        },
        cinematic_settings: {
          enableCinematicMode: currentSettings.enableCinematicMode || false,
          cinematicParameters: currentSettings.cinematicParameters || {},
          enhancedPrompt: currentSettings.enhancedPrompt,
          includeTechnicalDetails: currentSettings.includeTechnicalDetails,
          includeStyleReferences: currentSettings.includeStyleReferences,
          generationMode: currentSettings.generationMode,
          selectedProvider: currentSettings.selectedProvider,
          // Video-specific settings
          video: {
            cameraMovement: currentSettings.motionType || 'smooth',
            videoStyle: currentSettings.videoStyle || '',
            duration: currentSettings.duration || 5,
            provider: currentSettings.selectedProvider || 'seedream',
            resolution: currentSettings.videoResolution || '480p'
          }
        },
        sample_images: selectedSampleImages.before_images.length > 0 || selectedSampleImages.after_images.length > 0 ? selectedSampleImages : undefined,
        is_public: saveFormData.is_public
      }

      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(presetData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save preset')
      }

      setShowSaveDialog(false)
      setSaveFormData({ name: '', description: '', category: 'custom', is_public: false })
      
      showFeedback({
        type: 'success',
        title: 'Preset Saved!',
        message: 'Your preset has been saved successfully.'
      })

      // Refresh presets list
      fetchPresets()
    } catch (error) {
      console.error('Failed to save preset:', error)
      showFeedback({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save preset'
      })
    }
  }

  const handleDeletePreset = async () => {
    if (!presetToDelete || !session) return

    try {
      const response = await fetch(`/api/presets?id=${presetToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete preset')
      }

      // Refetch presets to update the list
      fetchPresets()

      // Clear selection if this was the selected preset
      if (selectedPreset?.id === presetToDelete.id) {
        onPresetSelect(null)
      }

      setShowDeleteDialog(false)
      setPresetToDelete(null)

      showFeedback({
        type: 'success',
        title: 'Success',
        message: 'Preset deleted successfully'
      })
    } catch (error) {
      console.error('Error deleting preset:', error)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete preset. Please try again.'
      })
    }
  }

  const confirmDelete = (preset: Preset) => {
    setPresetToDelete(preset)
    setShowDeleteDialog(true)
  }

  // Helper function for generation mode badge
  const getGenerationModeBadge = (preset: Preset) => {
    const mode = preset.technical_settings?.generation_mode
    if (!mode || mode === 'flexible') return null

    if (mode === 'text-to-image') {
      return (
        <Badge variant="outline" className="border-primary text-primary bg-primary/10">
          📝 Text → Image
        </Badge>
      )
    }

    if (mode === 'image-to-image') {
      return (
        <Badge variant="outline" className="border-primary text-primary bg-primary/10">
          🖼️ Image → Image
        </Badge>
      )
    }

    return null
  }

  return (
    <div className="space-y-4">
      {/* Preset Selector Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Palette className="h-5 w-5 text-primary" />
          <span className="font-medium">Presets</span>
          {selectedPreset && (
            <Badge variant="secondary" className="text-xs">
              {selectedPreset.name}
            </Badge>
          )}
        </div>
        
        <div className="flex space-x-2">
          <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Search className="h-4 w-4 mr-1" />
                Browse
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Select Preset</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {/* Search and Filter */}
                <PresetFilters
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  onSearch={fetchPresets}
                  onClearSearch={() => {
                    setSearchQuery('')
                    fetchPresets()
                  }}
                  categories={categories}
                />

                {/* Quick Access Buttons */}
                <PresetCategoryNav
                  selectedCategory={selectedCategory}
                  onCategoryChange={setSelectedCategory}
                  showTrending={showTrending}
                  onToggleTrending={() => setShowTrending(!showTrending)}
                  presetsCount={showTrending ? trendingPresets.length : presets.length}
                />

                {/* Trending Presets Section */}
                {showTrending && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-medium">Trending Presets (Last 7 Days)</h3>
                    </div>
                    {trendingLoading ? (
                      <div className="flex items-center justify-center py-4">
                        <LoadingSpinner size="sm" />
                        <span className="ml-2 text-sm text-muted-foreground">Loading trending presets...</span>
                      </div>
                    ) : trendingPresets.length === 0 ? (
                      <div className="text-center py-4">
                        <Star className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No trending presets yet</p>
                        <p className="text-xs text-muted-foreground">Like some presets to see them here!</p>
                      </div>
                    ) : (
                      <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
                        {trendingPresets.map(preset => (
                          <PresetCard
                            key={preset.id}
                            preset={preset}
                            viewMode={viewMode}
                            onClick={handlePresetSelect}
                            highlighted={true}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Presets Grid */}
                {!showTrending && (
                  <div className="max-h-96 overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <LoadingSpinner size="md" />
                        <span className="ml-2">Loading presets...</span>
                      </div>
                    ) : presets.length === 0 ? (
                      <div className="text-center py-8">
                        <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                        <p className="text-muted-foreground">No presets found</p>
                      </div>
                    ) : (
                    <div key={`${selectedCategory}-${searchQuery}-${sortBy}`} className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
                      {presets.map(preset => (
                        <PresetCard
                          key={preset.id}
                          preset={preset}
                          viewMode={viewMode}
                          onClick={handlePresetSelect}
                          onDelete={confirmDelete}
                          showDeleteButton={true}
                        />
                      ))}
                    </div>
                  )}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {currentSettings && (
            <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-1" />
                  Save
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Save as Preset</DialogTitle>
                </DialogHeader>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left Column - Form */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Name *</label>
                    <Input
                      value={saveFormData.name}
                      onChange={(e) => setSaveFormData({ ...saveFormData, name: e.target.value })}
                      placeholder="My Awesome Preset"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Description</label>
                    <textarea
                      value={saveFormData.description}
                      onChange={(e) => setSaveFormData({ ...saveFormData, description: e.target.value })}
                      placeholder="Describe this preset..."
                      className="w-full p-2 border rounded-md text-sm"
                      rows={2}
                    />
                  </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-1">Prompt</label>
                      <div className="w-full p-2 border rounded-md text-sm bg-muted/50 text-muted-foreground">
                        {currentSettings.prompt?.substring(0, 200)}{currentSettings.prompt?.length > 200 ? '...' : ''}
                      </div>
                    </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Category</label>
                    <Select value={saveFormData.category} onValueChange={(value) => setSaveFormData({ ...saveFormData, category: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.slice(1).map(category => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="is_public"
                      checked={saveFormData.is_public}
                      onChange={(e) => setSaveFormData({ ...saveFormData, is_public: e.target.checked })}
                    />
                    <label htmlFor="is_public" className="text-sm">Make public</label>
                  </div>
                  
                    {/* Sample Images Section */}
                    <div>
                      <label className="block text-sm font-medium mb-2">Sample Images (Optional)</label>
                      <div className="space-y-3">
                        {/* Before Images */}
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Before Images (Input)</label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                            {savedImagesLoading ? (
                              <div className="col-span-2 text-xs text-muted-foreground">Loading images...</div>
                            ) : savedImages.length === 0 ? (
                              <div className="col-span-2 text-xs text-muted-foreground">No saved images available</div>
                            ) : (
                              savedImages.map((image) => (
                                <div key={image.id} className="relative">
                                  <img
                                    src={image.image_url}
                                    alt={image.title}
                                    className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      const newBeforeImages = selectedSampleImages.before_images.includes(image.image_url)
                                        ? selectedSampleImages.before_images.filter(url => url !== image.image_url)
                                        : [...selectedSampleImages.before_images, image.image_url]
                                      setSelectedSampleImages({
                                        ...selectedSampleImages,
                                        before_images: newBeforeImages
                                      })
                                    }}
                                  />
                                  {selectedSampleImages.before_images.includes(image.image_url) && (
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                                      <span className="text-primary-foreground text-xs">✓</span>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                          {selectedSampleImages.before_images.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {selectedSampleImages.before_images.length} before image(s) selected
                            </div>
                          )}
                        </div>

                        {/* After Images */}
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">After Images (Generated)</label>
                          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded-md p-2">
                            {savedImagesLoading ? (
                              <div className="col-span-2 text-xs text-muted-foreground">Loading images...</div>
                            ) : savedImages.length === 0 ? (
                              <div className="col-span-2 text-xs text-muted-foreground">No saved images available</div>
                            ) : (
                              savedImages.map((image) => (
                                <div key={image.id} className="relative">
                                  <img
                                    src={image.image_url}
                                    alt={image.title}
                                    className="w-full h-16 object-cover rounded border cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => {
                                      const newAfterImages = selectedSampleImages.after_images.includes(image.image_url)
                                        ? selectedSampleImages.after_images.filter(url => url !== image.image_url)
                                        : [...selectedSampleImages.after_images, image.image_url]
                                      setSelectedSampleImages({
                                        ...selectedSampleImages,
                                        after_images: newAfterImages
                                      })
                                    }}
                                  />
                                  {selectedSampleImages.after_images.includes(image.image_url) && (
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                                      <span className="text-primary-foreground text-xs">✓</span>
                                    </div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                          {selectedSampleImages.after_images.length > 0 && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {selectedSampleImages.after_images.length} after image(s) selected
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column - Preview */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Preview of Settings to Save</h3>
                    
                    <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
                      {/* Basic Settings */}
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Settings className="h-3 w-3" />
                          Basic Settings
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div><strong>Style:</strong> {currentSettings.style}</div>
                          <div><strong>Resolution:</strong> {currentSettings.resolution}px</div>
                          <div><strong>Aspect Ratio:</strong> {currentSettings.aspectRatio}</div>
                          <div><strong>Images:</strong> {currentSettings.numImages}</div>
                          <div><strong>Intensity:</strong> {currentSettings.intensity}</div>
                          <div><strong>Consistency:</strong> {currentSettings.consistencyLevel}</div>
                        </div>
                      </div>

                      {/* Cinematic Settings */}
                      {currentSettings.enableCinematicMode && currentSettings.cinematicParameters ? (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Film className="h-3 w-3" />
                            Cinematic Settings
                          </h4>
                          <div className="space-y-1 text-xs">
                            {currentSettings.cinematicParameters.directorStyle && (
                              <div><strong>Director:</strong> {currentSettings.cinematicParameters.directorStyle}</div>
                            )}
                            {currentSettings.cinematicParameters.cameraAngle && (
                              <div><strong>Camera Angle:</strong> {currentSettings.cinematicParameters.cameraAngle}</div>
                            )}
                            {currentSettings.cinematicParameters.lensType && (
                              <div><strong>Lens Type:</strong> {currentSettings.cinematicParameters.lensType}</div>
                            )}
                            {currentSettings.cinematicParameters.lightingStyle && (
                              <div><strong>Lighting:</strong> {currentSettings.cinematicParameters.lightingStyle}</div>
                            )}
                            {currentSettings.cinematicParameters.sceneMood && (
                              <div><strong>Mood:</strong> {currentSettings.cinematicParameters.sceneMood}</div>
                            )}
                            {currentSettings.cinematicParameters.shotSize && (
                              <div><strong>Shot Size:</strong> {currentSettings.cinematicParameters.shotSize}</div>
                            )}
                            {currentSettings.cinematicParameters.depthOfField && (
                              <div><strong>Depth of Field:</strong> {currentSettings.cinematicParameters.depthOfField}</div>
                            )}
                            <div className="text-muted-foreground">
                              <strong>Parameters:</strong> {Object.values(currentSettings.cinematicParameters).filter(v => v !== undefined).length} active
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Film className="h-3 w-3" />
                            Cinematic Settings
                          </h4>
                          <div className="text-xs text-muted-foreground">
                            Cinematic Mode is disabled
                          </div>
                        </div>
                      )}

                      {/* Generation Settings */}
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                          <Camera className="h-3 w-3" />
                          Generation Settings
                        </h4>
                        <div className="space-y-1 text-xs">
                          <div><strong>Mode:</strong> {currentSettings.generationMode || 'text-to-image'}</div>
                          <div><strong>Provider:</strong> {currentSettings.selectedProvider || 'nanobanana'}</div>
                          {currentSettings.enableCinematicMode && (
                            <div><strong>Enhanced Prompt:</strong> {currentSettings.includeTechnicalDetails ? 'Yes' : 'No'}</div>
                          )}
                        </div>
                      </div>

                      {/* Video Settings */}
                      {(currentSettings.motionType || currentSettings.videoStyle || currentSettings.duration || currentSettings.videoResolution) && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <PlayCircle className="h-3 w-3" />
                            Video Settings
                          </h4>
                          <div className="space-y-1 text-xs">
                            {currentSettings.motionType && (
                              <div><strong>Camera Movement:</strong> {currentSettings.motionType}</div>
                            )}
                            {currentSettings.videoStyle && (
                              <div><strong>Video Style:</strong> {currentSettings.videoStyle}</div>
                            )}
                            {currentSettings.duration && (
                              <div><strong>Duration:</strong> {currentSettings.duration}s</div>
                            )}
                            {currentSettings.videoResolution && (
                              <div><strong>Video Resolution:</strong> {currentSettings.videoResolution}</div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Sample Images Preview */}
                      {(selectedSampleImages.before_images.length > 0 || selectedSampleImages.after_images.length > 0) && (
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            Sample Images
                          </h4>
                          <div className="space-y-2 text-xs">
                            {selectedSampleImages.before_images.length > 0 && (
                              <div>
                                <div className="text-muted-foreground mb-1">Before ({selectedSampleImages.before_images.length}):</div>
                                <div className="grid grid-cols-2 gap-1">
                                  {selectedSampleImages.before_images.slice(0, 4).map((url, index) => (
                                    <img
                                      key={index}
                                      src={url}
                                      alt={`Before ${index + 1}`}
                                      className="w-full h-8 object-cover rounded border"
                                    />
                                  ))}
                                  {selectedSampleImages.before_images.length > 4 && (
                                    <div className="w-full h-8 bg-muted rounded border flex items-center justify-center text-muted-foreground">
                                      +{selectedSampleImages.before_images.length - 4}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                            {selectedSampleImages.after_images.length > 0 && (
                              <div>
                                <div className="text-muted-foreground mb-1">After ({selectedSampleImages.after_images.length}):</div>
                                <div className="grid grid-cols-2 gap-1">
                                  {selectedSampleImages.after_images.slice(0, 4).map((url, index) => (
                                    <img
                                      key={index}
                                      src={url}
                                      alt={`After ${index + 1}`}
                                      className="w-full h-8 object-cover rounded border"
                                    />
                                  ))}
                                  {selectedSampleImages.after_images.length > 4 && (
                                    <div className="w-full h-8 bg-muted rounded border flex items-center justify-center text-muted-foreground">
                                      +{selectedSampleImages.after_images.length - 4}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
                    <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveAsPreset}>
                      Save Preset
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}

          {/* Delete Confirmation Dialog */}
          {showDeleteDialog && presetToDelete && (
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete Preset</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Are you sure you want to delete "{presetToDelete.name}"? This action cannot be undone.
                  </p>
                  
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleDeletePreset}>
                      Delete Preset
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Selected Preset Info */}
      {selectedPreset && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-sm text-foreground">{selectedPreset.name}</p>
                  {getGenerationModeBadge(selectedPreset)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedPreset.description || 'No description'}
                </p>
                {/* Contextual Hint based on generation mode */}
                {selectedPreset.technical_settings?.generation_mode === 'text-to-image' && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-primary bg-primary/10 p-2 rounded">
                    <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>This preset works best with text prompts only</span>
                  </div>
                )}
                {selectedPreset.technical_settings?.generation_mode === 'image-to-image' && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-primary bg-primary/10 p-2 rounded">
                    <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <span>This preset works best with a base image. Upload or select one for optimal results.</span>
                  </div>
                )}
                {/* Video Settings Info */}
                {selectedPreset.cinematic_settings?.video && (
                  <div className="mt-2 flex items-start gap-2 text-xs text-primary bg-primary/10 p-2 rounded">
                    <PlayCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="font-medium mb-1">Video Settings Configured</div>
                      <div className="space-y-0.5 text-muted-foreground">
                        {selectedPreset.cinematic_settings.video.cameraMovement && (
                          <div>Camera: {selectedPreset.cinematic_settings.video.cameraMovement}</div>
                        )}
                        {selectedPreset.cinematic_settings.video.videoStyle && (
                          <div>Style: {selectedPreset.cinematic_settings.video.videoStyle}</div>
                        )}
                        {selectedPreset.cinematic_settings.video.duration && (
                          <div>Duration: {selectedPreset.cinematic_settings.video.duration}s</div>
                        )}
                        {selectedPreset.cinematic_settings.video.provider && (
                          <div>Provider: {selectedPreset.cinematic_settings.video.provider}</div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPresetSelect(null)}
                className="ml-2"
              >
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
