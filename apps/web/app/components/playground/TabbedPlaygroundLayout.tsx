'use client'

import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { Wand2, Edit3, Layers, Video, History, Sparkles, BookOpen } from 'lucide-react'
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
    motionType: string
    aspectRatio: string
    prompt: string
    yPosition?: number
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
  onExpandMedia,
  onVideoGenerated
}: TabbedPlaygroundLayoutProps) {
  const [activeTab, setActiveTab] = useState('generate')
  const [selectedPreset, setSelectedPreset] = useState<any>(null)
  
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
  }, [onSelectImage])

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
    if (!sessionToken) return

    try {
      console.log('🎬 Fetching videos...')
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
        console.error('❌ Failed to fetch videos:', response.statusText)
        return []
      }
    } catch (error) {
      console.error('❌ Error fetching videos:', error)
      return []
    }
  }, [sessionToken])

  // Fetch videos when component mounts or sessionToken changes
  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // Expose refresh function to parent component
  const refreshVideos = useCallback(() => {
    return fetchVideos()
  }, [fetchVideos])

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
    // Check if this is a video URL by looking in savedVideos
    const videoData = savedVideos.find(video => video.url === url)
    
    console.log('🎬 Video data found:', videoData)
    console.log('🎬 Aspect ratio:', videoData?.aspectRatio)
    
    if (videoData && videoData.aspectRatio) {
      // This is a video with aspect ratio metadata, use the video save API directly
      console.log('🎬 Saving video with aspect ratio:', videoData.aspectRatio)
      
      try {
        const response = await fetch('/api/playground/save-video-to-gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionToken}`
          },
          body: JSON.stringify({
            videoUrl: url,
            title: videoData.title || 'Generated Video',
            description: `AI-generated video: ${videoData.title || 'Generated Video'}`,
            tags: ['ai-generated', 'video'],
            duration: videoData.duration || 5,
            resolution: videoData.resolution || '480p',
            aspectRatio: videoData.aspectRatio, // Use the actual aspect ratio from video data
            motionType: 'subtle',
            prompt: videoData.title || 'AI-generated video',
            generationMetadata: {
              generated_at: videoData.generated_at || new Date().toISOString(),
              credits_used: 8,
              duration: videoData.duration || 5,
              resolution: videoData.resolution || '480p',
              aspect_ratio: videoData.aspectRatio, // Use the actual aspect ratio
              motion_type: 'subtle',
              image_url: null,
              task_id: null,
              prompt: videoData.title || 'AI-generated video',
              style: 'realistic',
              consistency_level: 'high'
            }
          })
        })
        
        if (response.ok) {
          console.log('✅ Video saved with correct aspect ratio:', videoData.aspectRatio)
        } else {
          const errorData = await response.json()
          console.error('❌ Video save failed:', errorData)
          // Fallback to regular save
          await onSaveToGallery(url)
        }
      } catch (error) {
        console.error('❌ Video save error:', error)
        // Fallback to regular save
        await onSaveToGallery(url)
      }
    } else {
      // Regular image or video without aspect ratio metadata
      await onSaveToGallery(url)
    }
    
    // Refresh the saved gallery after saving
    if (savedGalleryRef.current) {
      savedGalleryRef.current.refresh()
    }
  }, [onSaveToGallery, savedVideos, sessionToken])

  const handleDeleteVideo = useCallback(async (videoUrl: string) => {
    if (!sessionToken) return

    setDeletingVideo(videoUrl)
    
    try {
      console.log('🗑️ Deleting video:', videoUrl)
      
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
  }, [sessionToken, selectedVideo, fetchVideos])

  return (
    <div className="space-y-6">

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={(value) => {
        setActiveTab(value)
        onTabChange?.(value)
      }} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" />
            Generate
          </TabsTrigger>
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit3 className="h-4 w-4" />
            Edit
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center gap-2">
            <Layers className="h-4 w-4" />
            Batch
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Video
          </TabsTrigger>
          <TabsTrigger value="prompts" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Prompts
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="mt-6">
          <div className="space-y-6">
            {/* Full Width Generated Content Preview */}
            <div className="w-full" data-preview-area>
              <DynamicPreviewArea
                aspectRatio={currentSettings.aspectRatio || currentSettings.baseImageAspectRatio || '1:1'}
                resolution={currentSettings.resolution}
                prompt={currentSettings.enhancedPrompt || currentSettings.prompt}
                images={useMemo(() => {
                  const currentImages = currentProject?.generated_images || []
                  const imagesToShow = [...currentImages, ...additionalPreviewImages]
                  
                  // Add base image if it exists and is not already in the images
                  if (currentSettings.baseImageUrl && !imagesToShow.some(img => img.url === currentSettings.baseImageUrl)) {
                    imagesToShow.unshift({
                      url: currentSettings.baseImageUrl,
                      width: 1024, // Default dimensions for base images
                      height: 1024,
                      generated_at: new Date().toISOString(),
                      type: 'base'
                    })
                  }
                  
                  // If selectedImage is not in current images, add it as a single-item array
                  if (selectedImage && !imagesToShow.some(img => img.url === selectedImage)) {
                    imagesToShow.push({
                      url: selectedImage,
                      width: 1024, // Default dimensions for saved images
                      height: 1024,
                      generated_at: new Date().toISOString(),
                      type: 'saved'
                    })
                  }
                  
                  return imagesToShow
                }, [currentProject?.generated_images, additionalPreviewImages, currentSettings.baseImageUrl, selectedImage])}
                selectedImage={selectedImage}
                onSelectImage={onSelectImage}
                onSaveToGallery={handleSaveToGallery}
                savingImage={savingImage}
                loading={loading}
                subscriptionTier={userSubscriptionTier as 'free' | 'plus' | 'pro'}
                onRemoveBaseImage={removeBaseImageCallback}
                fullWidth={true}
                currentStyle={currentSettings.style || ''}
                onStyleChange={handleStyleChange}
                generationMode={currentSettings.generationMode}
                onGenerationModeChange={handleGenerationModeChange}
                userSubscriptionTier={userSubscriptionTier}
                onResolutionChange={handleResolutionChange}
                selectedProvider={currentSettings.selectedProvider || 'nanobanana'}
                onProviderChange={handleProviderChange}
                consistencyLevel={currentSettings.consistencyLevel || 'high'}
                onConsistencyChange={handleConsistencyChange}
                onRegenerate={handleRegenerate}
                onClearImages={handleClearImages}
              />
            </div>

            {/* Generation Controls - Full Width Below Preview */}
            <div className="w-full">
              <UnifiedImageGenerationPanel
                onGenerate={onGenerate}
                onSettingsChange={handleSettingsChange}
                loading={loading}
                userCredits={userCredits}
                userSubscriptionTier={userSubscriptionTier}
                savedImages={savedImages}
                onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
                selectedPreset={selectedPreset}
                onPresetApplied={() => setSelectedPreset(null)}
                currentStyle={currentSettings.style}
                aspectRatio={currentSettings.aspectRatio}
                onStyleChange={handleStyleChange}
                generationMode={currentSettings.generationMode}
                onGenerationModeChange={handleGenerationModeChange}
                selectedProvider={currentSettings.selectedProvider}
                onProviderChange={handleProviderChange}
                consistencyLevel={currentSettings.consistencyLevel}
                onConsistencyChange={handleConsistencyChange}
                onPromptChange={handleSetPrompt}
                onEnhancedPromptChange={handleSetEnhancedPrompt}
              />
            </div>
          </div>
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AdvancedEditingPanel
              onEdit={onEdit}
              loading={loading}
              selectedImage={selectedImage}
              savedImages={savedImages}
              onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
              onImageUpload={async (file: File) => {
                // Upload image to temporary storage or convert to data URL
                // For now, we'll use a simple approach with data URLs
                return new Promise((resolve) => {
                  const reader = new FileReader()
                  reader.onload = () => resolve(reader.result as string)
                  reader.readAsDataURL(file)
                })
              }}
            />

            {/* Image Preview for Editing */}
            <ImagePreviewArea
              title="Select Image to Edit"
              description="Choose an image from your current generation to edit"
              aspectRatio={currentSettings.baseImageAspectRatio || currentSettings.aspectRatio}
              resolution={currentSettings.resolution}
              images={(() => {
                const currentImages = currentProject?.generated_images || []
                const allImages = [...currentImages, ...additionalPreviewImages]
                
                // If selectedImage is not in all images, add it as a single-item array
                if (selectedImage && !allImages.some(img => img.url === selectedImage)) {
                  // Try to find the image in savedImages to get actual dimensions
                  const savedImageData = savedImages.find(img => img.image_url === selectedImage)
                  const result = [...allImages, {
                    url: selectedImage,
                    width: savedImageData?.width || 1024, // Use actual dimensions if available
                    height: savedImageData?.height || 1024,
                    generated_at: new Date().toISOString(),
                    type: 'saved'
                  }]
                  console.log('🔍 Added selectedImage to images:', result.length)
                  return result
                }
                return allImages
              })()}
              selectedImage={selectedImage}
              onSelectImage={onSelectImage}
              onSaveToGallery={handleSaveToGallery}
              onRemoveImage={(imageUrl) => {
                // Remove image from current project
                if (currentProject) {
                  const updatedImages = currentProject.generated_images.filter(img => img.url !== imageUrl)
                  const updatedProject = {
                    ...currentProject,
                    generated_images: updatedImages
                  }
                  onUpdateProject(updatedProject)
                  
                  // If the removed image was selected, clear selection
                  if (selectedImage === imageUrl) {
                    onSelectImage('')
                  }
                }
              }}
              savingImage={savingImage}
              loading={loading}
              showSaveButton={true}
              showDownloadButton={true}
              showRemoveButton={true}
              showDimensions={true}
              emptyStateMessage="No images available for editing. Generate some images first!"
              subscriptionTier={userSubscriptionTier as 'free' | 'plus' | 'pro'}
            />
          </div>
        </TabsContent>

        {/* Batch Tab */}
        <TabsContent value="batch" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BatchProcessingPanel
              onPerformBatchEdit={onPerformBatchEdit}
              loading={loading}
              savedImages={savedImages}
              onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
            />

            {/* Images to Process */}
            <ImagePreviewArea
              title="Images to Process"
              description="Select images from your generated content for batch processing"
              aspectRatio={currentSettings.baseImageAspectRatio || currentSettings.aspectRatio}
              resolution={currentSettings.resolution}
              images={[...(currentProject?.generated_images || []), ...additionalPreviewImages]}
              selectedImage={selectedImage}
              onSelectImage={onSelectImage}
              onSaveToGallery={handleSaveToGallery}
              onRemoveImage={(imageUrl) => {
                // Remove image from current project
                if (currentProject) {
                  const updatedImages = currentProject.generated_images.filter(img => img.url !== imageUrl)
                  const updatedProject = {
                    ...currentProject,
                    generated_images: updatedImages
                  }
                  onUpdateProject(updatedProject)
                  
                  // If the removed image was selected, clear selection
                  if (selectedImage === imageUrl) {
                    onSelectImage('')
                  }
                }
              }}
              savingImage={savingImage}
              loading={loading}
              showSaveButton={true}
              showDownloadButton={true}
              showRemoveButton={true}
              showDimensions={true}
              emptyStateMessage="No images available for batch processing. Generate some images first!"
              subscriptionTier={userSubscriptionTier as 'free' | 'plus' | 'pro'}
            />
          </div>
        </TabsContent>

        {/* Video Tab */}
        <TabsContent value="video" className="mt-6">
          <div className="space-y-6">
            {/* Full Width Video Preview Area */}
            <div className="w-full" data-preview-area>
              <VideoPreviewArea
                sourceImage={selectedImage}
                aspectRatio={videoAspectRatio}
                resolution={videoResolution}
                prompt={videoPrompt}
                videos={savedVideos}
                selectedVideo={selectedVideo}
                onSelectVideo={setSelectedVideo}
                onSaveToGallery={handleSaveToGallery}
                onDeleteVideo={handleDeleteVideo}
                savingVideo={savingImage}
                deletingVideo={deletingVideo}
                loading={loading}
                fullWidth={true}
              />
            </div>

            {/* Video Generation Controls - Full Width Below Preview */}
            <div className="w-full">
              <VideoGenerationPanel
                onGenerateVideo={onGenerateVideo}
                loading={loading}
                selectedImage={selectedImage}
                aspectRatio={videoAspectRatio}
                savedImages={savedImages}
                onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
                onPromptChange={setVideoPrompt}
                onAspectRatioChange={setVideoAspectRatio}
                onResolutionChange={setVideoResolution}
                userCredits={userCredits}
                userSubscriptionTier={userSubscriptionTier}
                selectedProvider={videoProvider}
                onProviderChange={setVideoProvider}
              />
            </div>
          </div>
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
        <PastGenerationsPanel
          onImportProject={(project) => {
            onImportProject(project)
            
            // Extract aspect ratio from the imported project
            let aspectRatio: string | undefined
            if (project.generated_images && project.generated_images.length > 0) {
              const image = project.generated_images[0]
              if (image.width && image.height) {
                // Calculate aspect ratio from dimensions
                const ratio = image.width / image.height
                if (Math.abs(ratio - 1) < 0.05) aspectRatio = '1:1'
                else if (Math.abs(ratio - 16/9) < 0.05) aspectRatio = '16:9'
                else if (Math.abs(ratio - 9/16) < 0.05) aspectRatio = '9:16'
                else if (Math.abs(ratio - 21/9) < 0.05) aspectRatio = '21:9'
                else if (Math.abs(ratio - 4/3) < 0.05) aspectRatio = '4:3'
                else if (Math.abs(ratio - 3/4) < 0.05) aspectRatio = '3:4'
                else aspectRatio = '16:9' // Default fallback
              }
            }
            
            // Update settings with the imported project's aspect ratio
            if (aspectRatio) {
              updateSettings({ baseImageAspectRatio: aspectRatio })
              console.log('📐 Updated aspect ratio from imported project:', aspectRatio)
            }
            
            // Route to appropriate tab based on media type
            if (project.is_video) {
              console.log('🎬 Importing video project, switching to video tab')
              setActiveTab('video')
            } else {
              console.log('🖼️ Importing image project, switching to edit tab')
              setActiveTab('edit')
            }
          }}
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
                  const isImage = item.media_type?.toLowerCase() === 'image'
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
    </div>
  )
}
