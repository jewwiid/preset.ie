'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '../../../lib/auth-context'
import { 
  Palette, 
  Download, 
  Share2, 
  Eye, 
  Heart, 
  MessageCircle,
  User,
  Calendar,
  Settings,
  Wand2,
  Copy,
  ExternalLink
} from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'

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

const CATEGORIES = {
  photography: { label: 'Photography', icon: '📸', color: 'bg-blue-100 text-blue-800' },
  cinematic: { label: 'Cinematic', icon: '🎬', color: 'bg-purple-100 text-purple-800' },
  artistic: { label: 'Artistic', icon: '🎨', color: 'bg-primary-100 text-primary-800' },
  portrait: { label: 'Portrait', icon: '👤', color: 'bg-primary-100 text-primary-800' },
  landscape: { label: 'Landscape', icon: '🏞️', color: 'bg-primary-100 text-primary-800' },
  commercial: { label: 'Commercial', icon: '💼', color: 'bg-gray-100 text-gray-800' },
  abstract: { label: 'Abstract', icon: '🌀', color: 'bg-indigo-100 text-indigo-800' },
  custom: { label: 'Custom', icon: '⚙️', color: 'bg-yellow-100 text-yellow-800' }
}

export default function PresetDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, session } = useAuth()
  
  const [preset, setPreset] = useState<Preset | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (params.id) {
      fetchPreset()
    }
  }, [params.id])

  const fetchPreset = async () => {
    try {
      const response = await fetch(`/api/presets/${params.id}`)
      
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

  const useInPlayground = () => {
    if (!preset) return

    // Store preset data in localStorage for playground to pick up
    localStorage.setItem('selectedPreset', JSON.stringify({
      name: preset.name,
      prompt_template: preset.prompt_template,
      negative_prompt: preset.negative_prompt,
      style_settings: preset.style_settings,
      technical_settings: preset.technical_settings,
      ai_metadata: preset.ai_metadata
    }))

    // Redirect to playground
    router.push('/playground')
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

  const incrementUsage = async () => {
    if (!preset) return

    try {
      await fetch(`/api/presets/${preset.id}/usage`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      })
    } catch (error) {
      console.error('Error incrementing usage:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading preset...</p>
        </div>
      </div>
    )
  }

  if (error || !preset) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <Palette className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Preset Not Found</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/presets')}>
              Browse Presets
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const categoryInfo = CATEGORIES[preset.category as keyof typeof CATEGORIES] || CATEGORIES.custom

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <Badge className={categoryInfo.color}>
                    {categoryInfo.icon} {categoryInfo.label}
                  </Badge>
                  {preset.is_featured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      ⭐ Featured
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{preset.name}</h1>
                {preset.description && (
                  <p className="text-gray-600 text-lg">{preset.description}</p>
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
            <div className="flex items-center space-x-4 mt-4 pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                {preset.creator.avatar_url ? (
                  <img
                    src={preset.creator.avatar_url}
                    alt={preset.creator.display_name}
                    className="w-8 h-8 rounded-full"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium">
                      {preset.creator.display_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {preset.creator.display_name}
                  </p>
                  <p className="text-xs text-gray-500">@{preset.creator.handle}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  {preset.usage_count} uses
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(preset.created_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
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
                    <span className="text-sm text-gray-600">Style:</span>
                    <span className="text-sm font-medium">{preset.ai_metadata?.style || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Mood:</span>
                    <span className="text-sm font-medium">{preset.ai_metadata?.mood || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Resolution:</span>
                    <span className="text-sm font-medium">
                      {preset.technical_settings?.width}x{preset.technical_settings?.height}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Steps:</span>
                    <span className="text-sm font-medium">{preset.style_settings?.steps || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Guidance Scale:</span>
                    <span className="text-sm font-medium">{preset.style_settings?.guidance_scale || 'Not specified'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tags</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {preset.ai_metadata?.tags?.map((tag: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {tag}
                      </Badge>
                    )) || (
                      <p className="text-sm text-gray-500">No tags specified</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
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
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm text-gray-800">
                    {preset.prompt_template}
                  </pre>
                </div>
              </CardContent>
            </Card>

            {preset.negative_prompt && (
              <Card>
                <CardHeader>
                  <CardTitle>Negative Prompt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <pre className="whitespace-pre-wrap text-sm text-red-800">
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
                      <span className="text-sm text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm font-medium">{String(value)}</span>
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
                      <span className="text-sm text-gray-600 capitalize">
                        {key.replace(/_/g, ' ')}:
                      </span>
                      <span className="text-sm font-medium">{String(value)}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Example Generations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <Wand2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No example generations yet.</p>
                  <p className="text-sm mt-1">Use this preset in the playground to create examples!</p>
                </div>
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
                <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Click "Use in Playground"</p>
                  <p className="text-sm text-gray-600">This will load the preset settings into the playground</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Customize your prompt</p>
                  <p className="text-sm text-gray-600">Replace placeholders like {'{subject}'} with your specific content</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Generate your images</p>
                  <p className="text-sm text-gray-600">Use your credits to create amazing images with this preset</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
