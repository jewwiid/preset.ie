'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '../../../lib/auth-context'
import {
  Palette,
  Download,
  Share2,
  PlayCircle,
  Heart,
  MessageCircle,
  User,
  Calendar,
  Settings,
  Wand2,
  Copy,
  ExternalLink,
  ArrowLeft,
  CheckCircle,
  Sparkles,
  Video
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { ApprovalStatusBadge } from '../../components/presets/ApprovalStatusBadge'

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
  generation_mode?: 'image' | 'video' | 'both'
  created_at: string
  updated_at: string
  last_used_at?: string
  creator: {
    id: string
    display_name: string
    handle: string
    avatar_url?: string
  }
}

interface PresetSample {
  id: string
  source_image_url: string
  result_image_url: string
  prompt_used: string
  negative_prompt_used?: string
  generation_settings: any
  generation_timestamp: string
  generation_provider: string
  generation_model?: string
  is_verified: boolean
  verification_timestamp?: string
  created_at: string
}

interface ShowcaseUsingPreset {
  id: string
  title: string
  caption?: string
  tags: string[]
  palette?: string
  visibility: string
  likes_count: number
  views_count: number
  media: Array<{
    id: string
    title?: string
    type: string
    width?: number
    height?: number
    url: string
    image_url?: string
    created_at: string
  }>
  media_count: number
  creator: {
    id: string
    display_name: string
    handle: string
    avatar_url?: string
  }
  created_at: string
  updated_at: string
}

// Helper function to format relative time
const getRelativeTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'just now'

  const minutes = Math.floor(diffInSeconds / 60)
  if (diffInSeconds < 3600) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`

  const hours = Math.floor(diffInSeconds / 3600)
  if (diffInSeconds < 86400) return `${hours} hour${hours === 1 ? '' : 's'} ago`

  const days = Math.floor(diffInSeconds / 86400)
  if (diffInSeconds < 604800) return `${days} day${days === 1 ? '' : 's'} ago`

  const weeks = Math.floor(diffInSeconds / 604800)
  if (diffInSeconds < 2592000) return `${weeks} week${weeks === 1 ? '' : 's'} ago`

  const months = Math.floor(diffInSeconds / 2592000)
  if (diffInSeconds < 31536000) return `${months} month${months === 1 ? '' : 's'} ago`

  const years = Math.floor(diffInSeconds / 31536000)
  return `${years} year${years === 1 ? '' : 's'} ago`
}

// Helper function for last used display (shows both relative time and date if > 1 day)
const getLastUsedDisplay = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Less than 24 hours - show only relative time
  if (diffInSeconds < 86400) {
    return getRelativeTime(dateString)
  }

  // More than 24 hours - show relative time + date
  const relativeTime = getRelativeTime(dateString)
  const dateDisplay = date.toLocaleDateString()
  return `${relativeTime} (${dateDisplay})`
}

const CATEGORIES = {
  photography: { label: 'Photography', icon: '📸', color: 'bg-primary/10 text-primary' },
  cinematic: { label: 'Cinematic', icon: '🎬', color: 'bg-primary/10 text-primary' },
  artistic: { label: 'Artistic', icon: '🎨', color: 'bg-primary/10 text-primary' },
  portrait: { label: 'Portrait', icon: '👤', color: 'bg-primary/10 text-primary' },
  landscape: { label: 'Landscape', icon: '🏞️', color: 'bg-primary/10 text-primary' },
  commercial: { label: 'Commercial', icon: '💼', color: 'bg-muted text-muted-foreground' },
  headshot: { label: 'Headshot', icon: '📷', color: 'bg-primary-100 text-primary-800' },
  product_photography: { label: 'Product Photography', icon: '📦', color: 'bg-primary-100 text-primary-800' },
  ecommerce: { label: 'E-commerce', icon: '🛒', color: 'bg-primary-100 text-primary-800' },
  corporate_portrait: { label: 'Corporate Portrait', icon: '👔', color: 'bg-muted-100 text-muted-foreground-800' },
  linkedin_photo: { label: 'LinkedIn Photo', icon: '💼', color: 'bg-primary-100 text-primary-800' },
  professional_portrait: { label: 'Professional Portrait', icon: '👤', color: 'bg-primary-100 text-primary-800' },
  business_headshot: { label: 'Business Headshot', icon: '📸', color: 'bg-slate-100 text-slate-800' },
  product_catalog: { label: 'Product Catalog', icon: '📋', color: 'bg-primary-100 text-primary-800' },
  product_lifestyle: { label: 'Product Lifestyle', icon: '🏠', color: 'bg-primary-primary/20 text-primary-primary' },
  product_studio: { label: 'Product Studio', icon: '🎬', color: 'bg-primary-100 text-primary-800' },
  abstract: { label: 'Abstract', icon: '🌀', color: 'bg-primary/10 text-primary' },
  custom: { label: 'Custom', icon: '⚙️', color: 'bg-muted text-muted-foreground' }
}

export default function PresetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, session, userRole } = useAuth()
  
  const [preset, setPreset] = useState<Preset | null>(null)
  const [showcases, setShowcases] = useState<ShowcaseUsingPreset[]>([])
  const [examples, setExamples] = useState<any[]>([])
  const [examplesLoading, setExamplesLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (params?.id) {
      fetchPreset()
      fetchShowcases()
      fetchExamples()
    }
  }, [params?.id])

  const fetchPreset = async () => {
    try {
      const response = await fetch(`/api/presets/${params?.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Preset not found')
        } else {
          setError('Failed to load preset')
        }
        return
      }

      const data = await response.json()
      setPreset(data)
      setLikeCount(data.like_count || 0)
      setIsLiked(data.is_liked || false)
    } catch (err) {
      console.error('Error fetching preset:', err)
      setError('Failed to load preset')
    } finally {
      setLoading(false)
    }
  }

  const fetchShowcases = async () => {
    if (!params?.id) return
    try {
      const response = await fetch(`/api/presets/${params.id}/showcases`)
      
      if (response.ok) {
        const data = await response.json()
        setShowcases(data.showcases || [])
      }
    } catch (err) {
      console.error('Error fetching showcases:', err)
      // Don't set error state for showcases, just log it
    }
  }

  const fetchExamples = async () => {
    if (!params?.id) return

    setExamplesLoading(true)
    try {
      const response = await fetch(`/api/presets/${params.id}/examples`)
      if (!response.ok) throw new Error('Failed to fetch examples')
      
      const data = await response.json()
      setExamples(data.examples || [])
    } catch (error) {
      console.error('Error fetching examples:', error)
    } finally {
      setExamplesLoading(false)
    }
  }

  const useInPlayground = () => {
    if (!preset) return

    // Store preset data in localStorage for playground to pick up
    localStorage.setItem('selectedPreset', JSON.stringify({
      id: preset.id,
      name: preset.name,
      prompt_template: preset.prompt_template,
      negative_prompt: preset.negative_prompt,
      style_settings: preset.style_settings,
      technical_settings: preset.technical_settings,
      ai_metadata: preset.ai_metadata
    }))

    // Redirect to playground with preset indicator
    router.push(`/playground?preset=${preset.id}&name=${encodeURIComponent(preset.name)}`)
  }

  const copyPrompt = () => {
    if (!preset) return
    navigator.clipboard.writeText(preset.prompt_template)
    // You could add a toast notification here
    alert('Prompt copied to clipboard!')
  }

  const sharePreset = async () => {
    if (!preset) return
    
    try {
      await navigator.clipboard.writeText(window.location.href)
      alert('Link copied to clipboard!')
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Failed to copy link')
    }
  }

  const toggleLike = async () => {
    if (!user || !preset) return

    try {
      const response = await fetch(`/api/presets/${preset.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ liked: !isLiked })
      })

      if (response.ok) {
        setIsLiked(!isLiked)
        setLikeCount(prev => isLiked ? prev - 1 : prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const promoteExample = async (example: any) => {
    if (!user || !preset || !session) return

    try {
      const response = await fetch(`/api/presets/${preset.id}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'promote',
          exampleId: example.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Promote failed:', response.status, errorData)
        throw new Error(errorData.error || 'Failed to promote example')
      }

      const result = await response.json()
      console.log('Promote successful:', result)

      // Refresh examples to show the updated promoted status
      fetchExamples()
    } catch (error) {
      console.error('Error promoting example:', error)
      alert('Failed to promote example')
    }
  }


  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading preset...</p>
        </div>
      </div>
    )
  }

  if (error || !preset) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Preset Not Found</h2>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => router.push('/presets')}>
              Browse Presets
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const categoryInfo = CATEGORIES[preset.category as keyof typeof CATEGORIES] || CATEGORIES.custom

  // Get promoted examples for background
  const promotedExamples = examples.filter(ex => ex.is_verified).slice(0, 6)

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Header with Masonry Background */}
      <div className="relative bg-card border-b border-border overflow-hidden">
        {/* Masonry Grid Background */}
        {promotedExamples.length > 0 && (
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="grid grid-cols-3 gap-2 h-full p-4">
              {promotedExamples.map((example, idx) => (
                <div
                  key={example.id}
                  className={`relative overflow-hidden rounded-lg ${
                    idx % 3 === 0 ? 'row-span-2' :
                    idx % 3 === 1 ? 'row-span-1' :
                    'row-span-2'
                  }`}
                >
                  {example.images?.[0]?.url && (
                    <Image
                      src={example.images[0].url}
                      alt=""
                      fill
                      className="object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Overlay */}
        <div className="relative z-10 bg-background/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              {/* Back Button */}
              <div className="mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push('/presets')}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Presets
                </Button>
              </div>

              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge className={categoryInfo.color}>
                      {categoryInfo.icon} {categoryInfo.label}
                    </Badge>
                    {preset.is_featured && (
                      <Badge variant="secondary" className="bg-primary/10 text-primary">
                        ⭐ Featured
                      </Badge>
                    )}
                    {/* Recommended Mode Badge */}
                    {preset.technical_settings?.generation_mode && preset.technical_settings.generation_mode !== 'flexible' && (
                      <Badge variant="outline" className="border-blue-500 text-blue-600">
                        {preset.technical_settings.generation_mode === 'text-to-image' && '📝 Best for: Text → Image'}
                        {preset.technical_settings.generation_mode === 'image-to-image' && '🖼️ Best for: Image → Image'}
                      </Badge>
                    )}
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">{preset.name}</h1>
                  {/* Show approval status for preset creators */}
                  {user && preset.creator.id === user.id && (
                    <div className="mb-4">
                      <ApprovalStatusBadge presetId={preset.id} isCreator={true} />
                    </div>
                  )}
                  {preset.description && (
                    <p className="text-muted-foreground text-lg">{preset.description}</p>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Button variant="outline" onClick={sharePreset}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    onClick={toggleLike}
                    disabled={!user}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {likeCount}
                  </Button>
                  <Button onClick={useInPlayground}>
                    <Wand2 className="h-4 w-4 mr-2" />
                    Use in Playground
                  </Button>
                </div>
              </div>

              {/* Creator Info */}
              <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-border">
                <div className="flex items-center space-x-2">
                  {preset.creator.avatar_url ? (
                    <img
                      src={preset.creator.avatar_url}
                      alt={preset.creator.display_name}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-foreground">
                        {preset.creator.display_name.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {preset.creator.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground">@{preset.creator.handle}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <PlayCircle className="h-4 w-4 mr-1" />
                    {preset.usage_count} uses
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(preset.created_at).toLocaleDateString()}
                  </div>
                  {preset.last_used_at && (
                    <div className="flex items-center" title={new Date(preset.last_used_at).toLocaleString()}>
                      <Sparkles className="h-4 w-4 mr-1" />
                      {getLastUsedDisplay(preset.last_used_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="examples">Gallery ({examples.length})</TabsTrigger>
            <TabsTrigger value="showcases">Showcases ({showcases.length})</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Preset Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Style:</span>
                    <span className="text-sm font-medium text-foreground">
                      {preset.style_settings?.style || 
                       preset.ai_metadata?.style || 
                       'Not specified'}
                    </span>
                  </div>
                  
                  {/* Only show Mood for cinematic presets since they have sceneMood */}
                  {preset.style_settings?.mood && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Mood:</span>
                      <span className="text-sm font-medium text-foreground">
                        {preset.style_settings?.mood || 
                         preset.ai_metadata?.mood || 
                         'Not specified'}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Resolution:</span>
                    <span className="text-sm font-medium text-foreground">
                      {preset.technical_settings?.resolution || 
                       (preset.technical_settings?.width && preset.technical_settings?.height ? 
                        `${preset.technical_settings.width}x${preset.technical_settings.height}` : 
                        'Not specified')}
                    </span>
                  </div>
                  
                  {/* Only show Intensity if it's set */}
                  {preset.style_settings?.intensity && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Intensity:</span>
                      <span className="text-sm font-medium text-foreground">
                        {preset.style_settings.intensity}
                      </span>
                    </div>
                  )}
                  
                  {/* Only show Consistency Level if it's set */}
                  {preset.style_settings?.consistency_level && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Consistency:</span>
                      <span className="text-sm font-medium text-foreground">
                        {preset.style_settings.consistency_level}
                      </span>
                    </div>
                  )}
                  
                  {/* Only show Aspect Ratio if it's set */}
                  {preset.technical_settings?.aspect_ratio && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Aspect Ratio:</span>
                      <span className="text-sm font-medium text-foreground">
                        {preset.technical_settings.aspect_ratio}
                      </span>
                    </div>
                  )}
                  
                  {/* Only show Number of Images if it's set and not 1 */}
                  {preset.technical_settings?.num_images && preset.technical_settings.num_images > 1 && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Images:</span>
                      <span className="text-sm font-medium text-foreground">
                        {preset.technical_settings.num_images}
                      </span>
                    </div>
                  )}
                  
                  
                  {preset.style_settings?.artistic_level && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Artistic Level:</span>
                      <span className="text-sm font-medium text-foreground capitalize">{preset.style_settings.artistic_level}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {/* Regular tags */}
                    {(preset.ai_metadata?.tags || preset.style_settings?.tags || []).map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    ))}
                    
                    {(!preset.ai_metadata?.tags && !preset.style_settings?.tags) && (
                      <p className="text-sm text-muted-foreground">No tags specified</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Video Generation Support Section */}
            {(preset.generation_mode === 'both' || preset.generation_mode === 'video') && (
              <Card className="border-green-200 bg-green-50/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Video className="h-5 w-5" />
                    Video Generation Support
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Main Badge */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="border-green-500 text-green-600 bg-green-100">
                      🎬 Supports Video Generation
                    </Badge>

                    {/* Mode-specific badges */}
                    {preset.technical_settings?.generation_mode === 'flexible' && (
                      <>
                        <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">
                          📝 Text-to-Video
                        </Badge>
                        <Badge variant="outline" className="border-purple-500 text-purple-600 bg-purple-50">
                          🖼️ Image-to-Video
                        </Badge>
                      </>
                    )}

                    {preset.technical_settings?.generation_mode === 'text-to-image' && (
                      <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">
                        📝 Best for Text-to-Video
                      </Badge>
                    )}

                    {preset.technical_settings?.generation_mode === 'image-to-image' && (
                      <Badge variant="outline" className="border-purple-500 text-purple-600 bg-purple-50">
                        🖼️ Best for Image-to-Video
                      </Badge>
                    )}
                  </div>

                  {/* Provider Compatibility */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-foreground">Compatible Providers:</p>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {preset.technical_settings?.generation_mode === 'flexible' ? (
                        <>
                          <p>• <strong>Seedream:</strong> Image-to-video mode</p>
                          <p>• <strong>Wan:</strong> Both text-to-video and image-to-video modes</p>
                        </>
                      ) : preset.technical_settings?.generation_mode === 'text-to-image' ? (
                        <>
                          <p>• <strong>Wan:</strong> Text-to-video mode (recommended)</p>
                          <p>• <strong>Seedream:</strong> Requires an image for image-to-video</p>
                        </>
                      ) : preset.technical_settings?.generation_mode === 'image-to-image' ? (
                        <>
                          <p>• <strong>Seedream:</strong> Image-to-video mode (optimal)</p>
                          <p>• <strong>Wan:</strong> Image-to-video mode</p>
                        </>
                      ) : (
                        <>
                          <p>• <strong>Seedream:</strong> Image-to-video mode</p>
                          <p>• <strong>Wan:</strong> Both text-to-video and image-to-video modes</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Use in Video Generator Button */}
                  <Button
                    onClick={() => router.push(`/playground?tab=video&preset=${preset.id}`)}
                    className="w-full"
                    variant="outline"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Use in Video Generator
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Showcases Tab */}
          <TabsContent value="showcases" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  Showcases Using This Preset
                  <Badge variant="secondary" className="ml-2">
                    {showcases.length} showcases
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {showcases.length === 0 ? (
                  <div className="text-center py-8">
                    <Palette className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No showcases yet</h3>
                    <p className="text-muted-foreground mb-4">
                      This preset hasn't been used in any showcases yet.
                    </p>
                    <Button onClick={() => router.push(`/playground?preset=${preset?.id}`)}>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Be the first to use this preset
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {showcases.map((showcase) => (
                      <Card key={showcase.id} className="overflow-hidden">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              {showcase.creator.avatar_url ? (
                                <img
                                  src={showcase.creator.avatar_url}
                                  alt={showcase.creator.display_name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                                  <User className="h-5 w-5 text-muted-foreground" />
                                </div>
                              )}
                              <div>
                                <h3 className="font-medium text-foreground">
                                  @{showcase.creator.handle}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(showcase.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Heart className="h-4 w-4 mr-1" />
                                {showcase.likes_count}
                              </div>
                              <div className="flex items-center">
                                <PlayCircle className="h-4 w-4 mr-1" />
                                {showcase.views_count}
                              </div>
                            </div>
                          </div>
                          {showcase.caption && (
                            <p className="text-foreground mt-2">{showcase.caption}</p>
                          )}
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          {/* Media Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {showcase.media.slice(0, 6).map((media, index) => (
                              <div key={`${media.id}-${index}`} className="relative group">
                                {media.type === 'video' || media.url?.endsWith('.mp4') || media.url?.endsWith('.webm') || media.url?.endsWith('.mov') ? (
                                  <video
                                    src={media.url}
                                    className="w-full aspect-square object-cover rounded-lg"
                                    style={{ aspectRatio: `${media.width || 16}:${media.height || 9}`, maxHeight: '12rem', minHeight: '6rem' }}
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    preload="metadata"
                                    poster={media.image_url || undefined}
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                ) : (
                                  <Image
                                    src={(() => {
                                      // Clean up malformed URLs
                                      let cleanUrl = media.url;
                                      if (cleanUrl.includes('supabase.co/storage/v1/object/public/playground-gallery/https://')) {
                                        // Extract the actual CloudFront URL from the malformed path
                                        const cloudfrontMatch = cleanUrl.match(/https:\/\/[^\/]+\.cloudfront\.net\/[^\s]+/);
                                        if (cloudfrontMatch) {
                                          cleanUrl = cloudfrontMatch[0];
                                        }
                                      }
                                      return cleanUrl;
                                    })()}
                                    alt={media.title || 'Media'}
                                    width={media.width || 1024}
                                    height={media.height || 1024}
                                    className="w-full aspect-square object-cover rounded-lg"
                                    style={{ aspectRatio: `${media.width || 16}:${media.height || 9}`, maxHeight: '12rem', minHeight: '6rem' }}
                                  />
                                )}
                                
                                {/* Info overlay */}
                                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                    onClick={() => router.push(`/showcases/${showcase.id}`)}
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    View
                                  </Button>
                                </div>
                              </div>
                            ))}
                            
                            {/* Show more indicator */}
                            {showcase.media.length > 6 && (
                              <div className="relative bg-muted rounded-lg flex items-center justify-center aspect-square">
                                <div className="text-center">
                                  <div className="text-2xl font-bold text-muted-foreground">
                                    +{showcase.media.length - 6}
                                  </div>
                                  <div className="text-xs text-muted-foreground">more</div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Tags */}
                          {showcase.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-3">
                              {showcase.tags.slice(0, 5).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  #{tag}
                                </Badge>
                              ))}
                              {showcase.tags.length > 5 && (
                                <Badge variant="outline" className="text-xs">
                                  +{showcase.tags.length - 5} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Prompts Tab */}
          <TabsContent value="prompts" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Prompt Template</CardTitle>
                  <Button size="sm" variant="outline" onClick={copyPrompt}>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-foreground">
                    {preset.prompt_template}
                  </pre>
                </div>
                
                {/* Placeholder Information */}
                {preset.prompt_template.includes('{subject}') && (
                  <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                          Subject Placeholder
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          This preset uses <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">{'{subject}'}</code> as a placeholder. 
                          When you use this preset in the playground, type your subject (e.g., "a cat", "portrait of a woman") 
                          and it will automatically replace the placeholder.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {preset.prompt_template.includes('{style}') && (
                  <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-1">
                          Style Placeholder
                        </h4>
                        <p className="text-sm text-purple-700 dark:text-purple-300">
                          This preset uses <code className="bg-purple-100 dark:bg-purple-900 px-1 rounded">{'{style}'}</code> as a placeholder. 
                          The style will be automatically filled based on the preset's style settings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {preset.prompt_template.includes('{mood}') && (
                  <div className="bg-primary-50 dark:bg-primary-950/20 border border-primary/20 dark:border-primary-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-primary-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium text-primary-900 dark:text-primary-100 mb-1">
                          Mood Placeholder
                        </h4>
                        <p className="text-sm text-primary-700 dark:text-primary-300">
                          This preset uses <code className="bg-primary-100 dark:bg-primary-900 px-1 rounded">{'{mood}'}</code> as a placeholder. 
                          The mood will be automatically filled based on the preset's mood settings.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Show if no placeholders */}
                {!preset.prompt_template.includes('{subject}') && 
                 !preset.prompt_template.includes('{style}') && 
                 !preset.prompt_template.includes('{mood}') && (
                  <div className="bg-gray-50 dark:bg-gray-950/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-2 h-2 rounded-full bg-gray-500 mt-2 flex-shrink-0"></div>
                      <div>
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
                          Static Prompt
                        </h4>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          This preset uses a static prompt without placeholders. The prompt will be used exactly as written.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {preset.negative_prompt && (
              <Card>
                <CardHeader>
                  <CardTitle>Negative Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-destructive/10 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-destructive">
                      {preset.negative_prompt}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Style Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(preset.style_settings || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm font-medium text-foreground">{String(value)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Technical Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(preset.technical_settings || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm font-medium text-foreground">{String(value)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Gallery ({examples.length})</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {examples.filter(ex => ex.is_verified).length} Promoted
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {examplesLoading ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p>Loading examples...</p>
                  </div>
                ) : examples.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {examples.map((example) => (
                      <div key={example.id} className="border rounded-lg overflow-hidden">
                        {example.images && example.images.length > 0 && (
                          <div className="w-full">
                            {example.images.slice(0, 1).map((image: any, index: number) => (
                              <div key={index} className="w-full aspect-square relative rounded-t-lg overflow-hidden">
                                <Image
                                  src={image.url}
                                  alt={`Example ${index + 1}`}
                                  fill
                                  className="object-cover"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="p-4 space-y-3">
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex flex-col gap-1 text-sm text-muted-foreground flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                  {example.creator.avatar_url ? (
                                    <img
                                      src={example.creator.avatar_url}
                                      alt={example.creator.display_name}
                                      className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <User className="h-8 w-8 flex-shrink-0" />
                                  )}
                                  <span className="truncate">@{example.creator.handle}</span>
                                </div>
                                <div className="flex items-center space-x-2 text-xs">
                                  <Calendar className="h-3 w-3 flex-shrink-0" />
                                  <span className="whitespace-nowrap" title={new Date(example.created_at).toLocaleString()}>
                                    {getRelativeTime(example.created_at)}
                                  </span>
                                  {example.is_verified && (
                                    <>
                                      <span>•</span>
                                      <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                                      <span className="text-green-600 font-medium">Promoted</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              {userRole?.isAdmin && !example.is_verified && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => promoteExample(example)}
                                  className="text-xs flex-shrink-0"
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Promote
                                </Button>
                              )}
                            </div>
                          </div>
                          <h4 className="font-medium text-sm line-clamp-2">{example.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                    <p>No example generations yet.</p>
                    <p className="text-sm mt-1">Use this preset in the playground to create examples!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Usage Instructions */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>How to Use This Preset</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Click "Use in Playground"</p>
                  <p className="text-sm text-muted-foreground">This will load the preset settings into the playground</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Customize your prompt</p>
                  <p className="text-sm text-muted-foreground">Replace placeholders like {'{subject}'} with your specific content</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Generate your images</p>
                  <p className="text-sm text-muted-foreground">Use your credits to create amazing images with this preset</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

