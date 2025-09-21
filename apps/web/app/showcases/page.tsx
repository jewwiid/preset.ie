'use client'

import { useState } from 'react'
import { Plus, Grid, List, Search, Filter, Star, TrendingUp, Sparkles, Palette, Image, Video, FileText, Users, Heart, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import ShowcaseFeed from '../components/ShowcaseFeed'
import CreateShowcaseModal from '../components/CreateShowcaseModal'

export default function ShowcasesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filterType, setFilterType] = useState<'all' | 'moodboard' | 'individual_image' | 'video' | 'treatment'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('popular')
  const [activeTab, setActiveTab] = useState<'trending' | 'featured' | 'latest' | 'community'>('trending')

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'trending' | 'featured' | 'latest' | 'community')
  }

  const filterOptions = [
    { value: 'all', label: 'All', icon: Filter },
    { value: 'moodboard', label: 'Moodboards', icon: Palette },
    { value: 'individual_image', label: 'Images', icon: Image },
    { value: 'video', label: 'Videos', icon: Video },
    { value: 'treatment', label: 'Treatments', icon: FileText },
  ]

  const sortOptions = [
    { value: 'popular', label: 'Most Popular' },
    { value: 'recent', label: 'Most Recent' },
    { value: 'trending', label: 'Trending' },
    { value: 'liked', label: 'Most Liked' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="showcase-hero mb-8 rounded-2xl p-8 border border-border">
          <div className="text-center">
            <h1 className="text-5xl font-bold text-primary mb-4">
              Showcases
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
              Where creativity meets innovation. Discover amazing work from our creative community.
            </p>

            {/* Create Button */}
            <Button
              onClick={() => setShowCreateModal(true)}
              size="lg"
              className="px-8 py-3 text-lg font-semibold"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Showcase
            </Button>
          </div>
        </div>

        {/* Main Tabs - Positioned like playground */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="trending" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Trending
            </TabsTrigger>
            <TabsTrigger value="featured" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="latest" className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Latest
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Community
            </TabsTrigger>
          </TabsList>

          {/* Tab Content */}
          <TabsContent value="trending" className="mt-6">
            {/* Smart Filters Bar */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  {/* Filter Badges */}
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <Button
                          key={option.value}
                          variant={filterType === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType(option.value as any)}
                          className="filter-badge"
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>

                  {/* Search and Controls */}
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search showcases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center bg-muted rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="p-2"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="p-2"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Showcase Feed */}
            <ShowcaseFeed 
              className={viewMode === 'grid' ? 'showcase-masonry' : 'space-y-6'} 
              showcaseType={filterType}
              showCinematicFilters={true}
              tabFilter={activeTab}
            />
          </TabsContent>

          <TabsContent value="featured" className="mt-6">
            {/* Smart Filters Bar */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  {/* Filter Badges */}
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <Button
                          key={option.value}
                          variant={filterType === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType(option.value as any)}
                          className="filter-badge"
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>

                  {/* Search and Controls */}
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search featured showcases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center bg-muted rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="p-2"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="p-2"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Showcase Feed */}
            <ShowcaseFeed 
              className={viewMode === 'grid' ? 'showcase-masonry' : 'space-y-6'} 
              showcaseType={filterType}
              showCinematicFilters={true}
              tabFilter={activeTab}
            />
          </TabsContent>

          <TabsContent value="latest" className="mt-6">
            {/* Smart Filters Bar */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  {/* Filter Badges */}
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <Button
                          key={option.value}
                          variant={filterType === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType(option.value as any)}
                          className="filter-badge"
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>

                  {/* Search and Controls */}
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search latest showcases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center bg-muted rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="p-2"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="p-2"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Showcase Feed */}
            <ShowcaseFeed 
              className={viewMode === 'grid' ? 'showcase-masonry' : 'space-y-6'} 
              showcaseType={filterType}
              showCinematicFilters={true}
              tabFilter={activeTab}
            />
          </TabsContent>

          <TabsContent value="community" className="mt-6">
            {/* Smart Filters Bar */}
            <Card className="mb-8">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                  {/* Filter Badges */}
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map((option) => {
                      const Icon = option.icon
                      return (
                        <Button
                          key={option.value}
                          variant={filterType === option.value ? "default" : "outline"}
                          size="sm"
                          onClick={() => setFilterType(option.value as any)}
                          className="filter-badge"
                        >
                          <Icon className="h-4 w-4 mr-2" />
                          {option.label}
                        </Button>
                      )
                    })}
                  </div>

                  {/* Search and Controls */}
                  <div className="flex gap-3 items-center">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search community showcases..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 w-64"
                      />
                    </div>
                    
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <div className="flex items-center bg-muted rounded-lg p-1">
                      <Button
                        variant={viewMode === 'grid' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode('grid')}
                        className="p-2"
                      >
                        <Grid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === 'list' ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setViewMode('list')}
                        className="p-2"
                      >
                        <List className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Showcase Feed */}
            <ShowcaseFeed 
              className={viewMode === 'grid' ? 'showcase-masonry' : 'space-y-6'} 
              showcaseType={filterType}
              showCinematicFilters={true}
              tabFilter={activeTab}
            />
          </TabsContent>
        </Tabs>

        {/* Create Showcase Modal */}
        {showCreateModal && (
          <CreateShowcaseModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={() => {
              setShowCreateModal(false)
              // Refresh the feed
              window.location.reload()
            }}
          />
        )}
      </div>
    </div>
  )
}