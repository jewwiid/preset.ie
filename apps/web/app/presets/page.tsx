'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { Palette, Plus, Search, Filter, Grid, List, Star, Users, Eye } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'

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

export default function PresetsPage() {
  const { user, session } = useAuth()
  const [presets, setPresets] = useState<Preset[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('popular')
  const [activeTab, setActiveTab] = useState('browse')

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'photography', label: 'Photography' },
    { value: 'cinematic', label: 'Cinematic' },
    { value: 'artistic', label: 'Artistic' },
    { value: 'custom', label: 'Custom' }
  ]

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'featured', label: 'Featured' },
    { value: 'usage', label: 'Most Used' }
  ]

  useEffect(() => {
    if (user && session) {
      fetchPresets()
    }
  }, [user, session, selectedCategory, sortBy])

  const fetchPresets = async () => {
    if (!session?.access_token) {
      console.log('❌ No session or access token')
      return
    }

    console.log('🔍 Fetching presets with token length:', session.access_token.length)
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') params.append('category', selectedCategory)
      if (searchQuery) params.append('search', searchQuery)
      params.append('sort', sortBy)

      const url = `/api/presets?${params.toString()}`
      console.log('🔍 Fetching URL:', url)
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('API Error:', response.status, response.statusText, errorData)
        throw new Error(`Failed to fetch presets: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      setPresets(data.presets || [])
    } catch (err) {
      console.error('Error fetching presets:', err)
      setError('Failed to load presets')
    } finally {
      setLoading(false)
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
            
            <Button asChild>
              <a href="/presets/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Preset
              </a>
            </Button>
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
                          <Eye className="h-4 w-4" />
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
                        <Button size="sm" className="flex-1">
                          Use Preset
                        </Button>
                        <Button size="sm" variant="outline">
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
            <div className="text-center py-12">
              <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">My Presets</h3>
              <p className="text-muted-foreground mb-4">Manage your created presets</p>
              <Button asChild>
                <a href="/presets/create">Create New Preset</a>
              </Button>
            </div>
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
    </div>
  )
}
