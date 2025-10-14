'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Wand2, Edit3, Layers, Video, History, Sparkles, BookOpen, Scissors } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UnifiedImageGenerationPanel from './UnifiedImageGenerationPanel'
import AdvancedEditingPanel from './AdvancedEditingPanel'
import BatchProcessingPanel from './BatchProcessingPanel'
import VideoGenerationPanel from './VideoGenerationPanel'
import PastGenerationsPanel from './PastGenerationsPanel'
import DynamicPreviewArea from './DynamicPreviewArea'
import SavedMediaGallery, { SavedMediaGalleryRef } from './SavedImagesGallery'
import EditImageSelector from './EditImageSelector'
import ImagePreviewArea from './ImagePreviewArea'
import VideoViewer from './VideoViewer'
import VideoPreviewArea from './VideoPreviewArea'
import PromptManagementPanel from './PromptManagementPanel'
import { SaveMediaDialog } from './SaveMediaDialog'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { generateImageTitle, generateVideoTitle, generateDefaultTags, generateDefaultDescription } from '../../../lib/media-title-utils'
import GenerateTab from './tabs/GenerateTab'
import EditTab from './tabs/EditTab'
import BatchTab from './tabs/BatchTab'
import VideoTab from './tabs/VideoTab'
import StitchTab from './tabs/StitchTab'
import HistoryTab from './tabs/HistoryTab'

// Import PlaygroundProject type from the main playground page
interface PlaygroundProject {
  id: string
  title: string
  prompt: string
  style?: string
  aspect_ratio?: string
  resolution?: string
  metadata?: {
    enhanced_prompt?: string
    style_applied?: string
    style_prompt?: string
    consistency_level?: string
    custom_preset?: any
    generation_mode?: string
    base_image?: string
    api_endpoint?: string
  }
  generated_images: Array<{
    url: string
    width: number
    height: number
    generated_at: string
    type?: string
  }>
  selected_image_url?: string
  credits_used: number
  created_at: string
  last_generated_at: string
  status: string
}

interface TabbedPlaygroundLayoutProps {
  // Generation props
  onGenerate: (params: {
    prompt: string
    style: string
    resolution: string
    consistencyLevel: string
    numImages: number
    customPreset?: any
    // Additional parameters for full context
    generationMode?: 'text-to-image' | 'image-to-image'
    baseImage?: string
    aspectRatio?: string
    selectedProvider?: string
    enhancedPrompt?: string
  }) => Promise<void>

  // Tab change callback
  onTabChange?: (tab: string) => void

  // Initial preset from URL
  initialPresetId?: string | null
  
  // Editing props
  onEdit: (params: {
    imageUrl: string
    editType: string
    editPrompt: string
    strength: number
  }) => Promise<void>
  
  // Batch props
  onPerformBatchEdit: (params: {
    prompt: string
    images: string[]
    editType: string
  }) => Promise<void>
  
  // Video props
  onGenerateVideo: (params: {
    imageUrl: string
    duration: number
    resolution: string
    cameraMovement: string
    aspectRatio: string
    prompt: string
    videoStyle?: string
    yPosition?: number
    cinematicParameters?: any
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
    presetId?: string
  }) => Promise<void>
  
  // History props
  onImportProject: (project: any) => void
  
  // Settings callback
  onSettingsUpdate?: (settings: { aspectRatio?: string; baseImageAspectRatio?: string }) => void
  
  // State
  loading: boolean
  userCredits: number
  userSubscriptionTier: string
  selectedImage: string | null
  currentPrompt: string
  currentProject: PlaygroundProject | null
  onSelectImage: (url: string | null) => void
  onSaveToGallery: (url: string) => Promise<void>
  onSetPrompt: (prompt: string) => void
  onUpdateProject: (project: PlaygroundProject) => void
  savingImage: string | null
  sessionToken?: string
  videoGenerationStatus: 'idle' | 'generating' | 'completed'
  generatedVideoUrl: string | null
  generatedVideoMetadata?: {
    aspectRatio: string
    resolution: string
    duration: number
    prompt: string
    cameraMovement: string
    styledImageUrl?: string | null
    presetId?: string | null
  } | null
  onExpandMedia?: (media: any) => void
  onVideoGenerated?: () => void // Callback when video generation completes
}

export default function TabbedPlaygroundLayout({
  onGenerate,
  onEdit,
  onPerformBatchEdit,
  onGenerateVideo,
  onImportProject,
  onSettingsUpdate,
  onTabChange,
  loading,
  userCredits,
  userSubscriptionTier,
  selectedImage,
  currentPrompt,
  currentProject,
  onSelectImage,
  onSaveToGallery,
  onSetPrompt,
  onUpdateProject,
  savingImage,
  sessionToken,
  videoGenerationStatus,
  generatedVideoUrl,
  generatedVideoMetadata,
  onExpandMedia,
  onVideoGenerated,
  initialPresetId
}: TabbedPlaygroundLayoutProps) {
  const { showFeedback } = useFeedback()
  const [activeTab, setActiveTab] = useState('generate')
  const [selectedPreset, setSelectedPreset] = useState<any>(null)

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [pendingSaveUrl, setPendingSaveUrl] = useState<string | null>(null)
  const [pendingSaveMetadata, setPendingSaveMetadata] = useState<any>(null)

  // Load preset from URL on mount
  useEffect(() => {
    if (initialPresetId && !selectedPreset) {
      fetch(`/api/presets/${initialPresetId}`)
        .then(res => res.json())
        .then(presetData => {
          if (presetData && presetData.id) {
            setSelectedPreset(presetData)
          }
        })
        .catch(err => console.error('Error loading preset:', err))
    }
  }, [initialPresetId])

  // Refs for scrolling to preview areas
  const imagePreviewRef = useRef<HTMLDivElement | null>(null)
  const videoPreviewRef = useRef<HTMLDivElement | null>(null)

  // Scroll helper function
  const scrollToPreview = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Wrapped generate functions with scroll
  const handleImageGenerate = useCallback(async (...args: any[]) => {
    if (imagePreviewRef.current) {
      scrollToPreview(imagePreviewRef)
    }
    // @ts-ignore
    return onGenerate(...args)
  }, [onGenerate, scrollToPreview])

  const handleVideoGenerate = useCallback(async (...args: any[]) => {
    // Clear selected video to show loading state
    setSelectedVideo(null)
    if (videoPreviewRef.current) {
      scrollToPreview(videoPreviewRef)
    }
    // @ts-ignore
    return onGenerateVideo(...args)
  }, [onGenerateVideo, scrollToPreview])

  // Debug: Log when selectedPreset changes
  useEffect(() => {
    console.log('🎯 Parent selectedPreset changed:', selectedPreset)
  }, [selectedPreset])

  const [currentSettings, setCurrentSettings] = useState({
    aspectRatio: '1:1',
    resolution: '1024',
    baseImageAspectRatio: undefined as string | undefined,
    baseImageUrl: undefined as string | undefined,
    style: '' as string,
    generationMode: 'text-to-image' as 'text-to-image' | 'image-to-image',
    selectedProvider: 'nanobanana' as string,
    consistencyLevel: 'high' as string,
    prompt: '' as string,
    enhancedPrompt: '' as string
  })

  // Handle prompt updates from UnifiedImageGenerationPanel
  const handleSetPrompt = useCallback((prompt: string) => {
    // Update the parent's prompt
    onSetPrompt(prompt)
    // Also update currentSettings for DynamicPreviewArea
    setCurrentSettings(prev => ({
      ...prev,
      prompt: prompt
    }))
  }, [onSetPrompt])

  // Handle enhanced prompt updates from UnifiedImageGenerationPanel
  const handleSetEnhancedPrompt = useCallback((enhancedPrompt: string) => {
    setCurrentSettings(prev => ({
      ...prev,
      enhancedPrompt: enhancedPrompt
    }))
  }, [])

  // Handle regenerate action
  const handleRegenerate = useCallback(() => {
    // Trigger the same generation as the main generate button with full context
    if (onGenerate && currentSettings.prompt) {
      onGenerate({
        prompt: currentSettings.prompt,
        style: currentSettings.style || '',
        resolution: currentSettings.resolution || '1024',
        consistencyLevel: currentSettings.consistencyLevel || 'high',
        numImages: 1,
        // Preserve generation mode context
        generationMode: currentSettings.generationMode || 'text-to-image',
        // Preserve base image for image-to-image mode
        baseImage: currentSettings.generationMode === 'image-to-image' ? currentSettings.baseImageUrl : undefined,
        // Preserve aspect ratio
        aspectRatio: currentSettings.aspectRatio || '1:1',
        // Preserve provider selection
        selectedProvider: currentSettings.selectedProvider || 'nanobanana',
        // Preserve enhanced prompt if available
        enhancedPrompt: currentSettings.enhancedPrompt || undefined
      })
    }
  }, [onGenerate, currentSettings])

  // Handle clear images action
  const handleClearImages = useCallback(() => {
    // Clear the selected image
    onSelectImage(null)
    // Clear additional preview images
    setAdditionalPreviewImages([])
    // Clear generated images from current project
    if (currentProject) {
      onUpdateProject({
        ...currentProject,
        generated_images: []
      })
    }
  }, [onSelectImage, currentProject, onUpdateProject])

  // Style change callback
  const handleStyleChange = useCallback((style: string) => {
    setCurrentSettings(prev => ({
      ...prev,
      style: style
    }))
  }, [])

  // Generation mode change callback
  const handleGenerationModeChange = useCallback((mode: string) => {
    setCurrentSettings(prev => ({
      ...prev,
      generationMode: mode as 'text-to-image' | 'image-to-image'
    }))
  }, [])

  // Resolution change callback
  const handleResolutionChange = useCallback((resolution: string) => {
    setCurrentSettings(prev => ({
      ...prev,
      resolution: resolution
    }))
  }, [])

  // Provider change callback
  const handleProviderChange = useCallback((provider: string) => {
    setCurrentSettings(prev => ({
      ...prev,
      selectedProvider: provider
    }))
  }, [])

  // Consistency change callback
  const handleConsistencyChange = useCallback((consistency: string) => {
    setCurrentSettings(prev => ({
      ...prev,
      consistencyLevel: consistency
    }))
  }, [])
  const [savedImages, setSavedImages] = useState<Array<{
    id: string
    image_url: string
    title: string
    width: number
    height: number
  }>>([])
  const [additionalPreviewImages, setAdditionalPreviewImages] = useState<Array<{
    url: string
    width: number
    height: number
    generated_at: string
    type: string
  }>>([])
  const [savedVideos, setSavedVideos] = useState<Array<{
    id: string
    url: string
    title: string
    duration?: number
    resolution?: string
    aspectRatio?: string
    generated_at: string
    is_saved: boolean
    source: string
  }>>([])
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [deletingVideo, setDeletingVideo] = useState<string | null>(null)
  const [videoPrompt, setVideoPrompt] = useState('')
  const [videoProvider, setVideoProvider] = useState<'seedream' | 'wan'>('seedream')
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9')
  const [videoResolution, setVideoResolution] = useState('480p')
  const [videoSourceImage, setVideoSourceImage] = useState<string | null>(null)
  const [videoStyledImage, setVideoStyledImage] = useState<string | null>(null)
  // Track temporary unsaved videos
  const [tempVideos, setTempVideos] = useState<Array<{
    id: string
    url: string
    title: string
    duration?: number
    resolution?: string
    aspectRatio?: string
    generated_at: string
    is_saved: boolean
    source: string
    prompt?: string
  }>>([])
  const savedGalleryRef = useRef<SavedMediaGalleryRef>(null)

  const [removeBaseImageCallback, setRemoveBaseImageCallback] = useState<(() => void) | undefined>(undefined)

  const handleSettingsChange = useCallback((settings: { 
    resolution: string; 
    aspectRatio?: string; 
    baseImageAspectRatio?: string; 
    baseImageUrl?: string; 
    onRemoveBaseImage?: () => void;
    // Additional context for regeneration
    generationMode?: 'text-to-image' | 'image-to-image';
    style?: string;
    selectedProvider?: string;
    consistencyLevel?: string;
    prompt?: string;
    enhancedPrompt?: string;
  }) => {
    console.log('🎯 Parent received settings change:', settings)
    setCurrentSettings(prev => {
      const newSettings = {
        ...prev,
        resolution: settings.resolution,
        aspectRatio: settings.aspectRatio || prev.aspectRatio,
        baseImageAspectRatio: settings.baseImageAspectRatio,
        baseImageUrl: settings.baseImageUrl,
        // Update additional context
        generationMode: settings.generationMode || prev.generationMode,
        style: settings.style !== undefined ? settings.style : prev.style,
        selectedProvider: settings.selectedProvider || prev.selectedProvider,
        consistencyLevel: settings.consistencyLevel || prev.consistencyLevel,
        prompt: settings.prompt !== undefined ? settings.prompt : prev.prompt,
        enhancedPrompt: settings.enhancedPrompt !== undefined ? settings.enhancedPrompt : prev.enhancedPrompt
      }
      console.log('🎯 Parent updating settings to:', newSettings)
      return newSettings
    })
    setRemoveBaseImageCallback(() => settings.onRemoveBaseImage)
  }, [])

  const updateSettings = useCallback((settings: { aspectRatio?: string; baseImageAspectRatio?: string }) => {
    setCurrentSettings(prev => ({
      ...prev,
      ...settings
    }))
    onSettingsUpdate?.(settings)
  }, [onSettingsUpdate])

  const handleAddImageToPreview = useCallback((imageUrl: string) => {
    // Context-aware behavior based on current tab
    if (activeTab === 'video') {
      // In video tab: set as selected image for video generation
      onSelectImage(imageUrl)
      // Scroll to preview area
      setTimeout(() => {
        const previewElement = document.querySelector('[data-preview-area]')
        if (previewElement) {
          previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
      return
    }
    
    if (activeTab === 'generate') {
      // In generate tab: add to additional preview images
      // Check if image is already in additional preview images
      if (additionalPreviewImages.some(img => img.url === imageUrl)) {
        // Still scroll to preview area even if already added
        setTimeout(() => {
          const previewElement = document.querySelector('[data-preview-area]')
          if (previewElement) {
            previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }
        }, 100)
        return // Already added
      }

      // Add the image to additional preview images as a base image
      const newImage = {
        url: imageUrl,
        width: 1024, // Default dimensions for saved images
        height: 1024,
        generated_at: new Date().toISOString(),
        type: 'base'
      }
      setAdditionalPreviewImages(prev => [...prev, newImage])
      
      // Scroll to preview area after adding the image
      setTimeout(() => {
        const previewElement = document.querySelector('[data-preview-area]')
        if (previewElement) {
          previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
    
    // For other tabs (edit, batch, history), just set as selected image
    if (activeTab === 'edit' || activeTab === 'batch' || activeTab === 'history') {
      onSelectImage(imageUrl)
      // Scroll to preview area
      setTimeout(() => {
        const previewElement = document.querySelector('[data-preview-area]')
        if (previewElement) {
          previewElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
      }, 100)
    }
  }, [activeTab, additionalPreviewImages, onSelectImage])

  const fetchVideos = useCallback(async () => {
    if (!sessionToken) {
      console.log('⚠️ Skipping video fetch - no session token')
      return []
    }

    try {
      console.log('🎬 Fetching videos with token:', sessionToken?.substring(0, 20) + '...')
      const response = await fetch('/api/playground/videos', {
        headers: {
          'Authorization': `Bearer ${sessionToken}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Videos fetched:', data.videos.length)
        setSavedVideos(data.videos)
        return data.videos
      } else {
        const errorText = await response.text()
        console.error('❌ Failed to fetch videos:', response.status, response.statusText, errorText)
        return []
      }
    } catch (error) {
      console.error('❌ Error fetching videos:', error)
      return []
    }
  }, [sessionToken])

  // Fetch videos when component mounts or sessionToken changes
  useEffect(() => {
    if (sessionToken) {
      fetchVideos()
    }
  }, [fetchVideos, sessionToken])

  // Add newly generated video to temp videos when it becomes available
  useEffect(() => {
    if (generatedVideoUrl && generatedVideoMetadata) {
      // Check if this video is already in tempVideos or savedVideos
      const alreadyInTemp = tempVideos.some(v => v.url === generatedVideoUrl)
      const alreadySaved = savedVideos.some(v => v.url === generatedVideoUrl)

      if (!alreadyInTemp && !alreadySaved) {
        console.log('🎬 Adding new video to temp list:', generatedVideoUrl)
        const newTempVideo = {
          id: 'temp-' + Date.now(),
          url: generatedVideoUrl,
          title: 'Just Generated',
          duration: generatedVideoMetadata?.duration,
          resolution: generatedVideoMetadata?.resolution,
          aspectRatio: generatedVideoMetadata?.aspectRatio,
          generated_at: new Date().toISOString(),
          is_saved: false,
          source: 'new',
          prompt: generatedVideoMetadata?.prompt
        }
        setTempVideos(prev => [newTempVideo, ...prev])
        // Auto-select the newly generated video
        setSelectedVideo(generatedVideoUrl)
      }
    }
  }, [generatedVideoUrl, generatedVideoMetadata, savedVideos])

  // Combine saved videos with temporary unsaved videos
  const displayVideos = useMemo(() => {
    const videos = [...savedVideos]

    // Add all temporary videos that aren't already saved
    tempVideos.forEach(tempVideo => {
      if (!savedVideos.some(v => v.url === tempVideo.url)) {
        videos.unshift(tempVideo)
      }
    })

    return videos
  }, [savedVideos, tempVideos])

  // Expose refresh function to parent component
  const refreshVideos = useCallback(() => {
    if (sessionToken) {
      return fetchVideos()
    }
    return Promise.resolve([])
  }, [fetchVideos, sessionToken])

  // Set default aspect ratio to 16:9 when switching to Video tab
  useEffect(() => {
    if (activeTab === 'video') {
      setCurrentSettings(prev => ({
        ...prev,
        aspectRatio: '16:9'
      }))
    }
  }, [activeTab])

  // Auto-adjust aspect ratio when a preset is selected
  useEffect(() => {
    if (selectedPreset) {
      let presetAspectRatio = null
      
      // Check if it's a cinematic preset (has cinematic_settings with parameters)
      if (selectedPreset.cinematic_settings?.cinematicParameters?.aspectRatio) {
        presetAspectRatio = selectedPreset.cinematic_settings.cinematicParameters.aspectRatio
      }
      // Check if it's a regular preset with technical_settings
      else if (selectedPreset.technical_settings?.aspect_ratio) {
        presetAspectRatio = selectedPreset.technical_settings.aspect_ratio
      }
      
      // Update aspect ratio if found
      if (presetAspectRatio) {
        console.log('🎯 Auto-adjusting aspect ratio to:', presetAspectRatio, 'from preset:', selectedPreset.name)
        setCurrentSettings(prev => ({
          ...prev,
          aspectRatio: presetAspectRatio
        }))
      }
    }
  }, [selectedPreset])

  // Refresh videos when video generation completes and auto-select the new video
  useEffect(() => {
    if (videoGenerationStatus === 'completed' && generatedVideoUrl) {
      console.log('🎬 Video generation completed, refreshing video list and auto-selecting')

      // Immediately select the video (will show in preview even before refresh completes)
      setSelectedVideo(generatedVideoUrl)

      // Refresh videos in the background to get the full video data
      refreshVideos().then(() => {
        console.log('🎯 Videos refreshed, newly generated video should be in list:', generatedVideoUrl)
      })

      onVideoGenerated?.()
    }
  }, [videoGenerationStatus, generatedVideoUrl, refreshVideos, onVideoGenerated])

  const handleSaveToGallery = useCallback(async (url: string) => {
    // Check if this is the newly generated video
    const isNewlyGeneratedVideo = url === generatedVideoUrl && generatedVideoMetadata

    // Check if this is a video URL by looking in savedVideos
    const videoData = savedVideos.find(video => video.url === url)

    console.log('🎬 Save check:', {
      url,
      isNewlyGenerated: isNewlyGeneratedVideo,
      hasMetadata: !!generatedVideoMetadata,
      videoData: !!videoData
    })

    // Open save dialog with appropriate defaults
    if (isNewlyGeneratedVideo && generatedVideoMetadata) {
      // Video metadata available
      setPendingSaveUrl(url)
      setPendingSaveMetadata({
        type: 'video',
        ...generatedVideoMetadata,
        prompt: generatedVideoMetadata.prompt
      })
      setSaveDialogOpen(true)
      return
    } else if (videoData) {
      // Existing video
      setPendingSaveUrl(url)
      setPendingSaveMetadata({
        type: 'video',
        aspectRatio: videoData.aspectRatio,
        resolution: videoData.resolution
      })
      setSaveDialogOpen(true)
      return
    } else {
      // Image - try to find metadata from current project
      const imageData = currentProject?.generated_images.find(img => img.url === url)
      setPendingSaveUrl(url)
      setPendingSaveMetadata({
        type: 'image',
        prompt: currentProject?.prompt,
        style: currentProject?.style,
        aspectRatio: currentProject?.aspect_ratio,
        resolution: currentProject?.resolution
      })
      setSaveDialogOpen(true)
      return
    }
  }, [generatedVideoUrl, generatedVideoMetadata, savedVideos, currentProject])

  // Actually perform the save after user confirms in dialog
  const performSaveToGallery = useCallback(async (data: { title: string; description: string; tags: string[] }) => {
    if (!pendingSaveUrl) return

    const url = pendingSaveUrl
    const metadata = pendingSaveMetadata

    // Check if this is a video
    const isVideo = metadata?.type === 'video'

    if (isVideo) {
      // This is the newly generated video, use the metadata we stored
      console.log('🎬 Saving newly generated video with metadata:', generatedVideoMetadata)

      try {
        const requestBody = {
          videoUrl: url,
          title: data.title,
          description: data.description,
          tags: data.tags,
          projectId: null,
          duration: metadata.duration,
          resolution: metadata.resolution,
          aspectRatio: metadata.aspectRatio,
          motionType: metadata.cameraMovement,
          prompt: metadata.prompt,
          generationMetadata: {
            generated_at: new Date().toISOString(),
            credits_used: 8,
            duration: metadata.duration,
            resolution: metadata.resolution,
            aspect_ratio: metadata.aspectRatio,
            motion_type: metadata.cameraMovement,
            prompt: metadata.prompt
          }
        }

        console.log('🎬 Sending video save request:', requestBody)

        const response = await fetch('/api/playground/save-video-to-gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify(requestBody)
        })

        if (response.ok) {
          console.log('✅ Newly generated video saved with metadata')
          // Remove from temp videos since it's now saved
          setTempVideos(prev => prev.filter(v => v.url !== url))
          refreshVideos() // Refresh the video list
          setSaveDialogOpen(false)
          setPendingSaveUrl(null)
          setPendingSaveMetadata(null)
          showFeedback({
            type: 'success',
            title: 'Video Saved!',
            message: `"${data.title}" has been saved to your gallery`
          })
        } else {
          let errorData: any
          try {
            errorData = await response.json()
          } catch (e) {
            const text = await response.text()
            console.error('❌ Video save failed - Response not JSON:', {
              status: response.status,
              statusText: response.statusText,
              text
            })
            return
          }
          console.error('❌ Video save failed:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            requestBody
          })
          showFeedback({
            type: 'error',
            title: 'Failed to Save Video',
            message: errorData.error || errorData.message || 'Could not save video to gallery'
          })
        }
      } catch (error) {
        console.error('❌ Video save error:', error)
      }
    } else {
      // Regular image - save with title, description, and tags
      console.log('💾 Saving image with custom title and description')

      try {
        const requestBody = {
          imageUrl: url,
          title: data.title,
          description: data.description,
          tags: data.tags,
          projectId: currentProject?.id || null,
          generationMetadata: {
            prompt: metadata.prompt,
            style: metadata.style,
            aspect_ratio: metadata.aspectRatio,
            resolution: metadata.resolution,
            generated_at: new Date().toISOString()
          }
        }

        const response = await fetch('/api/playground/save-to-gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify(requestBody)
        })

        if (response.ok) {
          console.log('✅ Image saved with custom title')
          setSaveDialogOpen(false)
          setPendingSaveUrl(null)
          setPendingSaveMetadata(null)
          showFeedback({
            type: 'success',
            title: 'Image Saved!',
            message: `"${data.title}" has been saved to your gallery`
          })
        } else {
          const errorData = await response.json()
          console.error('❌ Image save failed:', errorData)
          showFeedback({
            type: 'error',
            title: 'Failed to Save Image',
            message: errorData.error || errorData.message || 'Could not save image to gallery'
          })
        }
      } catch (error) {
        console.error('❌ Image save error:', error)
        showFeedback({
          type: 'error',
          title: 'Save Error',
          message: error instanceof Error ? error.message : 'Failed to save image'
        })
      }
    }

    // Refresh the saved gallery after saving
    if (savedGalleryRef.current) {
      savedGalleryRef.current.refresh()
    }
  }, [sessionToken, generatedVideoMetadata, savedVideos, currentProject, refreshVideos, showFeedback])

  const handleDeleteVideo = useCallback(async (videoUrl: string) => {
    if (!sessionToken) return

    setDeletingVideo(videoUrl)

    try {
      console.log('🗑️ Deleting video:', videoUrl)

      // Check if this is a temp video (unsaved)
      const isTempVideo = tempVideos.some(v => v.url === videoUrl)

      if (isTempVideo) {
        // Just remove from temp list, no API call needed
        console.log('🗑️ Removing temp video from list')
        setTempVideos(prev => prev.filter(v => v.url !== videoUrl))

        // Clear selection if the deleted video was selected
        if (selectedVideo === videoUrl) {
          setSelectedVideo(null)
        }
        return
      }

      const response = await fetch('/api/playground/delete-video', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${sessionToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ videoUrl })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Video deleted successfully:', result)

        // Refresh videos list
        await fetchVideos()

        // Clear selection if the deleted video was selected
        if (selectedVideo === videoUrl) {
          setSelectedVideo(null)
        }
      } else {
        const error = await response.json()
        console.error('❌ Failed to delete video:', error)
        throw new Error(error.error || 'Failed to delete video')
      }
    } catch (error) {
      console.error('❌ Error deleting video:', error)
      throw error
    } finally {
      setDeletingVideo(null)
    }
  }, [sessionToken, selectedVideo, fetchVideos, tempVideos])

  return (
    <div className="space-y-6">

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        onTabChange?.(value)
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-7 gap-1">
          <TabsTrigger value="generate" className="flex items-center justify-center gap-1 px-2 py-3 sm:gap-2.5 sm:px-6">
            <Wand2 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Generate</span>
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center justify-center gap-1 px-2 py-3 sm:gap-2.5 sm:px-6">
            <Edit3 className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Edit</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center justify-center gap-1 px-2 py-3 sm:gap-2.5 sm:px-6">
            <Layers className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Batch</span>
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center justify-center gap-1 px-2 py-3 sm:gap-2.5 sm:px-6">
            <Video className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Video</span>
          </TabsTrigger>
          <TabsTrigger value="stitch" className="flex items-center justify-center gap-1 px-2 py-3 sm:gap-2.5 sm:px-6">
            <Scissors className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Stitch</span>
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center justify-center gap-1 px-2 py-3 sm:gap-2.5 sm:px-6">
            <BookOpen className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">Prompts</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center justify-center gap-1 px-2 py-3 sm:gap-2.5 sm:px-6">
            <History className="h-4 w-4 flex-shrink-0" />
            <span className="hidden sm:inline">History</span>
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="mt-6">
          <GenerateTab
            currentProject={currentProject}
            additionalPreviewImages={additionalPreviewImages}
            selectedImage={selectedImage}
            currentSettings={currentSettings}
            selectedProvider={currentSettings.selectedProvider || 'nanobanana'}
            onSelectImage={onSelectImage}
            onSaveToGallery={handleSaveToGallery}
            onUpdateProject={onUpdateProject}
            savingImage={savingImage}
            loading={loading}
            userSubscriptionTier={userSubscriptionTier}
            onRegenerate={handleRegenerate}
            onClearImages={handleClearImages}
            onGenerate={handleImageGenerate}
            onSettingsChange={handleSettingsChange}
            userCredits={userCredits}
            savedImages={savedImages}
            selectedPreset={selectedPreset}
            onStyleChange={handleStyleChange}
            onGenerationModeChange={handleGenerationModeChange}
            onProviderChange={handleProviderChange}
            onConsistencyChange={handleConsistencyChange}
            onPromptChange={handleSetPrompt}
            onEnhancedPromptChange={handleSetEnhancedPrompt}
            imagePreviewRef={imagePreviewRef}
          />
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="mt-6">
          <EditTab
            onEdit={onEdit}
            loading={loading}
            selectedImage={selectedImage}
            savedImages={savedImages}
            onSelectImage={onSelectImage}
            currentSettings={currentSettings}
            currentProject={currentProject}
            additionalPreviewImages={additionalPreviewImages}
            onUpdateProject={onUpdateProject}
            onSaveToGallery={handleSaveToGallery}
            savingImage={savingImage}
            userSubscriptionTier={userSubscriptionTier}
          />
        </TabsContent>

        {/* Batch Tab */}
        <TabsContent value="batch" className="mt-6">
          <BatchTab
            onPerformBatchEdit={onPerformBatchEdit}
            loading={loading}
            savedImages={savedImages}
            onSelectImage={onSelectImage}
            selectedImage={selectedImage}
            currentSettings={currentSettings}
            currentProject={currentProject}
            additionalPreviewImages={additionalPreviewImages}
            onSaveToGallery={handleSaveToGallery}
            onUpdateProject={onUpdateProject}
            savingImage={savingImage}
            userSubscriptionTier={userSubscriptionTier}
          />
        </TabsContent>

        {/* Video Tab */}
        <TabsContent value="video" className="mt-6">
          <VideoTab
            videoSourceImage={videoSourceImage}
            selectedImage={selectedImage}
            videoStyledImage={videoStyledImage}
            generatedVideoMetadata={generatedVideoMetadata}
            videoAspectRatio={videoAspectRatio}
            videoResolution={videoResolution}
            videoPrompt={videoPrompt}
            displayVideos={displayVideos}
            selectedVideo={selectedVideo}
            setSelectedVideo={setSelectedVideo}
            onSaveToGallery={handleSaveToGallery}
            onDeleteVideo={handleDeleteVideo}
            savingImage={savingImage}
            deletingVideo={deletingVideo}
            loading={loading}
            onGenerateVideo={handleVideoGenerate}
            savedImages={savedImages}
            onSelectImage={onSelectImage}
            setVideoPrompt={setVideoPrompt}
            setVideoAspectRatio={setVideoAspectRatio}
            setVideoResolution={setVideoResolution}
            setVideoSourceImage={setVideoSourceImage}
            setVideoStyledImage={setVideoStyledImage}
            userCredits={userCredits}
            userSubscriptionTier={userSubscriptionTier}
            videoProvider={videoProvider}
            setVideoProvider={setVideoProvider}
            selectedPreset={selectedPreset}
            setSelectedPreset={setSelectedPreset}
            videoPreviewRef={videoPreviewRef}
          />
        </TabsContent>

        {/* Stitch Tab */}
        <TabsContent value="stitch" className="mt-6">
          <StitchTab
            loading={loading}
            userCredits={userCredits}
            userSubscriptionTier={userSubscriptionTier}
            onSaveToGallery={handleSaveToGallery}
          />
        </TabsContent>

        {/* Prompts Tab */}
        <TabsContent value="prompts" className="mt-6">
          <PromptManagementPanel
            onSelectPreset={(preset) => {
              // Extract aspect ratio from prompt text
              const extractAspectRatioFromPrompt = (prompt: string): string => {
                const aspectRatioPatterns = [
                  { pattern: /(\d+):(\d+)\s*(?:widescreen|aspect|ratio)/gi, name: 'explicit' },
                  { pattern: /16:9|16\s*:\s*9/gi, name: '16:9' },
                  { pattern: /9:16|9\s*:\s*16/gi, name: '9:16' },
                  { pattern: /4:3|4\s*:\s*3/gi, name: '4:3' },
                  { pattern: /3:4|3\s*:\s*4/gi, name: '3:4' },
                  { pattern: /1:1|1\s*:\s*1|square/gi, name: '1:1' },
                  { pattern: /21:9|21\s*:\s*9/gi, name: '21:9' },
                  { pattern: /3:2|3\s*:\s*2/gi, name: '3:2' },
                  { pattern: /2:3|2\s*:\s*3/gi, name: '2:3' }
                ]
                
                for (const { pattern, name } of aspectRatioPatterns) {
                  const match = prompt.match(pattern)
                  if (match) {
                    if (name === 'explicit') {
                      const [, width, height] = match[0].match(/(\d+):(\d+)/) || []
                      if (width && height) return `${width}:${height}`
                    } else {
                      return name
                    }
                  }
                }
                
                return '1:1' // Default fallback
              }
              
              const extractedAspectRatio = extractAspectRatioFromPrompt(preset.prompt_template)
              
              // Convert StylePreset to Preset format for UnifiedImageGenerationPanel
              const convertedPreset = {
                id: preset.id,
                name: preset.name,
                description: preset.description,
                category: preset.category,
                prompt_template: preset.prompt_template,
                negative_prompt: '',
                style_settings: {
                  style: 'realistic', // Default style
                  intensity: 1.0,
                  consistency_level: 'high',
                  generation_mode: preset.generation_mode || 'text-to-image'
                },
                technical_settings: {
                  resolution: '1024',
                  aspect_ratio: extractedAspectRatio,
                  num_images: 1,
                  quality: 'high'
                },
                cinematic_settings: undefined,
                usage_count: preset.usage_count,
                is_public: preset.is_public,
                created_at: preset.created_at,
                updated_at: preset.created_at
              }
              
              console.log('🎯 Extracted aspect ratio from prompt:', extractedAspectRatio, 'for preset:', preset.name)
              
              // When a preset is selected, switch to generate tab and pre-fill the form
              setSelectedPreset(convertedPreset)
              setActiveTab('generate')
            }}
          />
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="mt-6">
          <HistoryTab
            onImportProject={onImportProject}
            updateSettings={updateSettings}
            setActiveTab={setActiveTab}
          />
        </TabsContent>
      </Tabs>

      {/* Persistent Saved Images Gallery - Hidden on History tab */}
      {activeTab !== 'history' && (
        <div className="mt-8">
          <SavedMediaGallery
            ref={savedGalleryRef}
            selectedMediaUrl={selectedImage}
            currentTab={activeTab}
            onMediaSelect={(media) => {
              // Set the selected media for use in any tab
              onSelectImage(media.image_url || media.video_url || null)
              // Don't auto-switch tabs - let user choose which tab to use
            }}
            onReusePrompt={(prompt) => {
              // Set the prompt in the playground
              onSetPrompt(prompt)
              // Switch to the generate tab for prompt reuse
              setActiveTab('generate')
            }}
            onReuseGenerationSettings={(metadata) => {
              if (metadata) {
                // Set the prompt
                onSetPrompt(metadata.prompt)
                
                // Update the current project with all generation parameters
                if (currentProject) {
                  // Create metadata object with all properties
                  const updatedMetadata: any = {
                    ...currentProject.metadata,
                    enhanced_prompt: metadata.enhanced_prompt || metadata.prompt,
                    style_applied: metadata.style_applied || metadata.style || 'realistic',
                    style_prompt: metadata.style_prompt || '',
                    consistency_level: metadata.consistency_level || 'high',
                    custom_preset: (metadata as any).custom_preset || null,
                    generation_mode: (metadata as any).generation_mode || 'text-to-image',
                    base_image: (metadata as any).base_image || null,
                    api_endpoint: (metadata as any).api_endpoint || 'seedream-v4'
                  }
                  
                  const updatedProject = {
                    ...currentProject,
                    prompt: metadata.prompt,
                    style: metadata.style || metadata.style_applied || 'realistic',
                    aspect_ratio: metadata.aspect_ratio || '1:1',
                    resolution: metadata.resolution || '1024',
                    metadata: updatedMetadata
                  } as PlaygroundProject
                  
                  onUpdateProject(updatedProject)
                  console.log('Updated project with reused settings:', updatedProject)
                }
                
                console.log('Reusing generation settings:', metadata)
              }
              // Switch to the generate tab
              setActiveTab('generate')
            }}
            onSaveAsPreset={(metadata, imageUrl) => {
              if (metadata) {
                // Format style name to match preset creation format
                const formatStyleName = (style: string) => {
                  return style
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                    .join(' ')
                }

                const style = metadata.style || metadata.style_applied || 'photorealistic'
                const formattedStyle = formatStyleName(style)

                // Build query params to prefill preset creation form
                const params = new URLSearchParams({
                  name: `Preset from ${new Date().toLocaleDateString()}`,
                  description: `Generated from saved image with prompt: ${metadata.prompt?.substring(0, 100)}...`,
                  prompt_template: metadata.enhanced_prompt || metadata.prompt || '',
                  style: style,
                  resolution: (metadata.resolution?.split('x')[0]) || '1024',
                  aspect_ratio: metadata.aspect_ratio || '1:1',
                  consistency_level: metadata.consistency_level || 'high',
                  intensity: ((metadata as any).intensity || 1.0).toString(),
                  num_images: ((metadata as any).num_images || 1).toString(),
                  ...(metadata.cinematic_parameters && {
                    cinematic_parameters: JSON.stringify(metadata.cinematic_parameters),
                    enable_cinematic_mode: 'true'
                  })
                }).toString()

                // Navigate to preset creation page with all metadata
                window.location.href = `/presets/create?${params}`
              }
            }}
            onMediaUpdated={(media) => {
              // Update saved media state for BatchProcessingPanel - filter out videos
              console.log('📊 Raw media from gallery:', media.length, 'total items')
              console.log('📊 First item example:', media[0])

              const mediaTypes = media.map(m => ({
                type: m.media_type,
                hasImageUrl: !!m.image_url,
                title: m.title
              }))
              console.log('📊 Media types:', mediaTypes)

              const images = media
                .filter(item => {
                  const isImage = item.media_type === 'image'
                  const hasUrl = !!item.image_url
                  console.log(`  Filter check: "${item.title}" - media_type="${item.media_type}" isImage=${isImage}, hasUrl=${hasUrl}`)
                  return isImage && hasUrl
                })
                .map(img => ({
                  id: img.id,
                  image_url: img.image_url || '',
                  title: img.title,
                  width: img.width,
                  height: img.height
                }))
              console.log('📸 Saved images updated:', images.length, 'images out of', media.length, 'total')
              console.log('📸 Filtered images:', images)
              setSavedImages(images)
            }}
            onAddMediaToPreview={handleAddImageToPreview}
            onExpandMedia={onExpandMedia}
          />
        </div>
      )}

      {/* Save Media Dialog */}
      <SaveMediaDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={performSaveToGallery}
        defaultTitle={
          pendingSaveMetadata?.type === 'video'
            ? generateVideoTitle(pendingSaveMetadata?.prompt, pendingSaveMetadata?.cameraMovement || pendingSaveMetadata?.motionType, pendingSaveMetadata?.aspectRatio)
            : generateImageTitle(pendingSaveMetadata?.prompt, pendingSaveMetadata?.style)
        }
        defaultDescription={generateDefaultDescription(pendingSaveMetadata)}
        defaultTags={generateDefaultTags({
          ...pendingSaveMetadata,
          mediaType: pendingSaveMetadata?.type
        })}
        mediaType={pendingSaveMetadata?.type || 'image'}
        saving={!!savingImage}
      />
    </div>
  )
}
