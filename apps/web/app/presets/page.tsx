'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import { Palette, Plus, Search, Filter, Grid, List, Star, Users, PlayCircle, Camera, Wand2, Bell, CheckCircle, Eye } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import NotificationsPanel from '../components/NotificationsPanel'

interface Preset {
  id: string
  name: string
  description?: string
  category: string
  prompt_template: string
  negative_prompt?: string
  style_settings: any
  technical_settings: any
  ai_metadata: any
  seedream_config: any
  usage_count: number
  is_public: boolean
  is_featured: boolean
  created_at: string
  updated_at: string
  creator: {
    id: string
    display_name: string
    handle: string
    avatar_url?: string
  }
}

interface GeneratedImage {
  id: string
  url: string
  prompt: string
  preset_id: string
  preset_name: string
  created_at: string
  creator: {
    id: string
    display_name: string
    handle: string
    avatar_url?: string
  }
}

// Component to show generated content from user's presets
function MyPresetsGeneratedContent() {
  const { user, session } = useAuth()
  const router = useRouter()
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchGeneratedImages = async () => {
    if (!user || !session?.access_token) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    try {
      // Fetch images generated using user's presets
      const response = await fetch('/api/presets/my-generated-content', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch generated content')
      }

      const data = await response.json()
      setGeneratedImages(data.images || [])
    } catch (err: any) {
      console.error('Error fetching generated images:', err)
      setError(err.message || 'Failed to load generated images')
    } finally {
      setLoading(false)
    }
  }

  const verifyAsSample = async (image: GeneratedImage) => {
    if (!user || !session) return

    try {
      const response = await fetch(`/api/presets/${image.preset_id}/samples`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          sourceImageUrl: image.url,
          sourceImageHash: 'placeholder_hash',
          resultImageUrl: image.url,
          resultImageHash: 'placeholder_hash',
          generationId: image.id,
          generationProvider: 'nanobanana',
          generationModel: 'baroque-style',
          generationCredits: 1,
          prompt: image.prompt,
          negativePrompt: '',
          generationSettings: {}
        })
      })

      if (response.ok) {
        alert('Image verified as sample successfully!')
        fetchGeneratedImages() // Refresh the list
      } else {
        const error = await response.json()
        alert(`Failed to verify sample: ${error.error}`)
      }
    } catch (error) {
      console.error('Error verifying sample:', error)
      alert('Failed to verify sample')
    }
  }

  useEffect(() => {
    fetchGeneratedImages()
  }, [user, session])

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Loading generated images...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchGeneratedImages}>Try Again</Button>
      </div>
    )
  }

  if (generatedImages.length === 0) {
    return (
      <div className="text-center py-8">
        <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">No generated images yet</h3>
        <p className="text-muted-foreground mb-4">
          Images generated using your presets will appear here.
        </p>
        <Button asChild>
          <a href="/playground">Try the Playground</a>
        </Button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {generatedImages.map((image) => (
        <div key={image.id} className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          <div className="aspect-square relative">
            <img
              src={image.url}
              alt={image.prompt}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-2 right-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => verifyAsSample(image)}
                className="h-8 px-2 text-xs bg-background/80 hover:bg-background"
              >
                <CheckCircle className="h-3 w-3 mr-1" />
                Verify
              </Button>
            </div>
          </div>
          <div className="p-3 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{image.preset_name}</span>
              <span>{new Date(image.created_at).toLocaleDateString()}</span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {image.prompt}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                {image.creator.avatar_url ? (
                  <img 
                    src={image.creator.avatar_url} 
                    alt={image.creator.display_name}
                    className="h-4 w-4 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-4 w-4 bg-muted rounded-full flex items-center justify-center">
                    <span className="text-xs">{image.creator.display_name.charAt(0)}</span>
                  </div>
                )}
                <span>@{image.creator.handle}</span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/presets/${image.preset_id}`)}
                className="h-6 px-2 text-xs"
              >
                <Eye className="h-3 w-3 mr-1" />
                View
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function PresetsPage() {
  const router = useRouter()
  const { user, session } = useAuth()
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedPresetType, setSelectedPresetType] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('popular')
  const [activeTab, setActiveTab] = useState('browse')
  const [myPresets, setMyPresets] = useState<Preset[]>([])
  const [myPresetsLoading, setMyPresetsLoading] = useState(false)
  const [myPresetsError, setMyPresetsError] = useState<string | null>(null)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'photography', label: 'Photography' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'custom', label: 'Custom' }
  ]

  const presetTypes = [
    { value: 'all', label: 'All Types' },
    { value: 'cinematic', label: 'Cinematic Presets' },
    { value: 'regular', label: 'Style Presets' }
  ]

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'featured', label: 'Featured' },
    { value: 'usage', label: 'Most Used' }
  ]

  useEffect(() => {
    // Always fetch presets, even without authentication (for public presets)
    fetchPresets()
  }, [selectedCategory, selectedPresetType, sortBy])

  useEffect(() => {
    // Fetch user presets when switching to my-presets tab or when user changes
    if (activeTab === 'my-presets') {
      fetchMyPresets()
    }
  }, [activeTab, user, session])

  useEffect(() => {
    // Fetch unread notifications when user is authenticated
    if (user && session) {
      fetchUnreadNotifications()
    }
  }, [user, session])

  const fetchPresets = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)
      params.append('sort', sortBy)

      const url = `/api/presets?${params.toString()}`
      
      const headers: HeadersInit = {}
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`
      }
      
      const response = await fetch(url, { headers })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', response.status, response.statusText, errorData)
        throw new Error(`Failed to fetch presets: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      let filteredPresets = data.presets || []

      // Apply client-side preset type filtering
      if (selectedPresetType !== 'all') {
        filteredPresets = filteredPresets.filter((preset: Preset) => {
          const presetType = getPresetType(preset.id)
          return presetType === selectedPresetType
        })
      }


      setPresets(filteredPresets)
    } catch (err) {
      console.error('Error fetching presets:', err)
      setError('Failed to load presets')
    } finally {
      setLoading(false)
    }
  }

  const fetchMyPresets = async () => {
    if (!user || !session?.access_token) {
      setMyPresets([])
      return
    }

    setMyPresetsLoading(true)
    setMyPresetsError(null)

    try {
      const params = new URLSearchParams()
      params.append('user_id', 'me')
      params.append('sort', 'created_at')

      const url = `/api/presets?${params.toString()}`
      
      const headers: HeadersInit = {
        'Authorization': `Bearer ${session.access_token}`
      }
      
      const response = await fetch(url, { headers })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', response.status, response.statusText, errorData)
        throw new Error(`Failed to fetch my presets: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setMyPresets(data.presets || [])
    } catch (err) {
      console.error('Error fetching my presets:', err)
      setMyPresetsError('Failed to load your presets')
    } finally {
      setMyPresetsLoading(false)
    }
  }

  const fetchUnreadNotifications = async () => {
    if (!user || !session?.access_token) return

    try {
      const response = await fetch('/api/notifications?limit=1', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUnreadNotifications(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchPresets()
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString()
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      photography: 'bg-blue-100 text-blue-800',
      cinematic: 'bg-purple-100 text-purple-800',
      artistic: 'bg-primary-100 text-primary-800',
      custom: 'bg-primary/10 text-primary'
    }
    return colors[category as keyof typeof colors] || 'bg-muted text-muted-foreground'
  }

  const getPresetType = (presetId: string) => {
    return presetId.startsWith('cinematic_') ? 'cinematic' : 'regular'
  }

  const getPresetTypeBadge = (presetId: string) => {
    const type = getPresetType(presetId)
    if (type === 'cinematic') {
      return (
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Camera className="h-3 w-3 mr-1" />
          Cinematic
        </Badge>
      )
    }
    return (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        <Wand2 className="h-3 w-3 mr-1" />
        Style
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-preset-500 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading presets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center">
                <Palette className="h-8 w-8 mr-3 text-preset-500" />
                Presets
              </h1>
              <p className="text-muted-foreground">Discover and create AI generation presets</p>
            </div>
            
            <div className="flex items-center gap-3">
              {user && (
                <Button
                  variant="outline"
                  onClick={() => setNotificationsOpen(true)}
                  className="relative"
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                  {unreadNotifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs"
                    >
                      {unreadNotifications}
                    </Badge>
                  )}
                </Button>
              )}
              <Button asChild>
                <a href="/presets/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Preset
                </a>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="browse">Browse Presets</TabsTrigger>
            <TabsTrigger value="my-presets">My Presets</TabsTrigger>
            <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="mt-6">
            {/* Filters and Search */}
            <div className="bg-card rounded-lg shadow-sm p-6 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search presets..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </form>

                {/* Category Filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Preset Type Filter */}
                <Select value={selectedPresetType} onValueChange={setSelectedPresetType}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {presetTypes.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* View Mode */}
                <div className="flex items-center bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' ? 'bg-background shadow-sm' : 'hover:bg-accent'
                    }`}
                  >
                    <Grid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' ? 'bg-background shadow-sm' : 'hover:bg-accent'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Presets Grid/List */}
            {error ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={fetchPresets}>Try Again</Button>
              </div>
            ) : presets.length === 0 ? (
              <div className="text-center py-12">
                <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No presets found</h3>
                <p className="text-muted-foreground mb-4">Try adjusting your search or create a new preset</p>
                <Button asChild>
                  <a href="/presets/create">Create Your First Preset</a>
                </Button>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                : 'space-y-4'
              }>
                {presets.map(preset => (
                  <Card key={preset.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">{preset.name}</CardTitle>
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getCategoryColor(preset.category)}>
                              {preset.category}
                            </Badge>
                            {getPresetTypeBadge(preset.id)}
                            {preset.is_featured && (
                              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                                <Star className="h-3 w-3 mr-1" />
                                Featured
                              </Badge>
                            )}
                            {preset.is_public && (
                              <Badge variant="outline" className="text-blue-600">
                                <Users className="h-3 w-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <PlayCircle className="h-4 w-4" />
                          <span>{preset.usage_count}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {preset.description && (
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                          {preset.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center space-x-2">
                          {preset.creator.avatar_url ? (
                            <img
                              src={preset.creator.avatar_url}
                              alt={preset.creator.display_name}
                              className="w-6 h-6 rounded-full"
                            />
                          ) : (
                            <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center">
                              <span className="text-xs font-medium">
                                {preset.creator.display_name.charAt(0)}
                              </span>
                            </div>
                          )}
                          <span>@{preset.creator.handle}</span>
                        </div>
                        <span>{formatDate(preset.created_at)}</span>
                      </div>

                      <div className="mt-4 flex space-x-2">
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => router.push(`/playground?preset=${preset.id}`)}
                        >
                          Use Preset
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/presets/${preset.id}`)}
                        >
                          Preview
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-presets" className="mt-6">
            {!user ? (
              <div className="text-center py-12">
                <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Sign in to view your presets</h3>
                <p className="text-muted-foreground mb-4">You need to be signed in to view and manage your created presets</p>
                <Button asChild>
                  <a href="/auth/signin">Sign In</a>
                </Button>
              </div>
            ) : myPresetsLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-preset-500 mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading your presets...</p>
              </div>
            ) : myPresetsError ? (
              <div className="text-center py-12">
                <p className="text-red-500 mb-4">{myPresetsError}</p>
                <Button onClick={fetchMyPresets}>Try Again</Button>
              </div>
            ) : myPresets.length === 0 ? (
              <div className="text-center py-12">
                <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No presets yet</h3>
                <p className="text-muted-foreground mb-4">You haven't created any presets yet. Start by creating your first preset!</p>
                <Button asChild>
                  <a href="/presets/create">Create Your First Preset</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium text-foreground mb-2">My Presets</h3>
                    <p className="text-muted-foreground">Manage your created presets ({myPresets.length} total)</p>
                  </div>
                  <Button asChild>
                    <a href="/presets/create">
                      <Plus className="h-4 w-4 mr-2" />
                      Create New Preset
                    </a>
                  </Button>
                </div>

                {/* Generated Content Section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Camera className="h-5 w-5 mr-2" />
                      Images Generated Using Your Presets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <MyPresetsGeneratedContent />
                  </CardContent>
                </Card>

                {/* Presets Grid */}
                <div className={viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
                  : 'space-y-4'
                }>
                  {myPresets.map(preset => (
                    <Card key={preset.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-2">{preset.name}</CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge className={getCategoryColor(preset.category)}>
                                {preset.category}
                              </Badge>
                              {getPresetTypeBadge(preset.id)}
                              {preset.is_public ? (
                                <Badge variant="outline" className="text-green-600">
                                  <Users className="h-3 w-3 mr-1" />
                                  Public
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-gray-600">
                                  <Users className="h-3 w-3 mr-1" />
                                  Private
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                            <PlayCircle className="h-4 w-4" />
                            <span>{preset.usage_count}</span>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {preset.description && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {preset.description}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                          <span>Created {formatDate(preset.created_at)}</span>
                          <span>Updated {formatDate(preset.updated_at)}</span>
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => router.push(`/playground?preset=${preset.id}`)}
                          >
                            Use Preset
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => router.push(`/presets/${preset.id}`)}
                          >
                            Preview
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="marketplace" className="mt-6">
            <div className="text-center py-12">
              <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Preset Marketplace</h3>
              <p className="text-muted-foreground mb-4">Discover featured presets from the community</p>
              <Button asChild>
                <a href="/presets/marketplace">Browse Marketplace</a>
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Notifications Panel */}
      <NotificationsPanel 
        isOpen={notificationsOpen} 
        onClose={() => setNotificationsOpen(false)} 
      />
    </div>
  )
}
