'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Wand2, Edit3, Layers, Video, History, Sparkles } from 'lucide-react'
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
import PerformanceMonitor from '../ui/PerformanceMonitor'

interface PlaygroundProject {
  id: string
  title: string
  prompt: string
  generated_images: Array<{
    url: string
    width: number
    height: number
    generated_at: string
    type?: string
  }>
  selected_image_url?: string
  status: string
  credits_used: number
}

interface TabbedPlaygroundLayoutProps {
  // Generation props
  onGenerate: (params: {
    prompt: string
    style: string
    resolution: string
    consistencyLevel: string
    numImages: number
    customStylePreset?: any
  }) => Promise<void>
  
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
  const [currentSettings, setCurrentSettings] = useState({
    aspectRatio: '1:1',
    resolution: '1024',
    baseImageAspectRatio: undefined as string | undefined
  })
  const [savedImages, setSavedImages] = useState<Array<{
    id: string
    image_url: string
    title: string
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
  const savedGalleryRef = useRef<SavedMediaGalleryRef>(null)

  const handleSettingsChange = useCallback((settings: { resolution: string; baseImageAspectRatio?: string }) => {
    setCurrentSettings(prev => ({
      ...prev,
      resolution: settings.resolution,
      baseImageAspectRatio: settings.baseImageAspectRatio
    }))
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
      return
    }
    
    if (activeTab === 'generate') {
      // In generate tab: add to additional preview images
      // Check if image is already in additional preview images
      if (additionalPreviewImages.some(img => img.url === imageUrl)) {
        return // Already added
      }

      // Add the image to additional preview images
      const newImage = {
        url: imageUrl,
        width: 1024, // Default dimensions for saved images
        height: 1024,
        generated_at: new Date().toISOString(),
        type: 'saved'
      }
      setAdditionalPreviewImages(prev => [...prev, newImage])
    }
    
    // For other tabs (edit, batch, history), just set as selected image
    if (activeTab === 'edit' || activeTab === 'batch' || activeTab === 'history') {
      onSelectImage(imageUrl)
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
      } else {
        console.error('❌ Failed to fetch videos:', response.statusText)
      }
    } catch (error) {
      console.error('❌ Error fetching videos:', error)
    }
  }, [sessionToken])

  // Fetch videos when component mounts or sessionToken changes
  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  // Expose refresh function to parent component
  const refreshVideos = useCallback(() => {
    fetchVideos()
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

  // Refresh videos when video generation completes and auto-select the new video
  useEffect(() => {
    if (videoGenerationStatus === 'completed' && generatedVideoUrl) {
      console.log('🎬 Video generation completed, refreshing video list')
      refreshVideos()
      
      // Auto-select the newly generated video
      setTimeout(() => {
        console.log('🎯 Auto-selecting newly generated video:', generatedVideoUrl)
        setSelectedVideo(generatedVideoUrl)
      }, 1000) // Small delay to ensure videos are fetched
      
      onVideoGenerated?.()
    }
  }, [videoGenerationStatus, generatedVideoUrl, refreshVideos, onVideoGenerated])

  const handleSaveToGallery = useCallback(async (url: string) => {
    await onSaveToGallery(url)
    // Refresh the saved gallery after saving
    if (savedGalleryRef.current) {
      savedGalleryRef.current.refresh()
    }
  }, [onSaveToGallery])

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
      {/* Performance Monitor */}
      <PerformanceMonitor 
        enabled={process.env.NODE_ENV === 'development'}
      />
      
      {/* Header with Credits */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Sparkles className="h-4 w-4 text-purple-500" />
          <span>Credits: {userCredits}</span>
        </div>
        <div className="text-sm text-gray-500">
          Generation: 2 credits | Edit: 2 credits | Batch: 3/image | Video: 8-10 credits
        </div>
      </div>

      {/* Main Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
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
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Generation Controls */}
            <UnifiedImageGenerationPanel
              onGenerate={onGenerate}
              onSettingsChange={handleSettingsChange}
              loading={loading}
              userCredits={userCredits}
              userSubscriptionTier={userSubscriptionTier}
              savedImages={savedImages}
              onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
            />

            {/* Dynamic Generated Content Preview */}
            <DynamicPreviewArea
              aspectRatio={currentSettings.baseImageAspectRatio || currentSettings.aspectRatio}
              resolution={currentSettings.resolution}
              images={(() => {
                const currentImages = currentProject?.generated_images || []
                // If selectedImage is not in current images, add it as a single-item array
                if (selectedImage && !currentImages.some(img => img.url === selectedImage)) {
                  return [{
                    url: selectedImage,
                    width: 1024, // Default dimensions for saved images
                    height: 1024,
                    generated_at: new Date().toISOString(),
                    type: 'saved'
                  }]
                }
                return currentImages
              })()}
              selectedImage={selectedImage}
              onSelectImage={onSelectImage}
              onSaveToGallery={handleSaveToGallery}
              savingImage={savingImage}
              loading={loading}
              subscriptionTier={userSubscriptionTier as 'free' | 'plus' | 'pro'}
            />
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
                
                console.log('🔍 Edit Tab Images Debug:', {
                  currentImagesCount: currentImages.length,
                  additionalPreviewImagesCount: additionalPreviewImages.length,
                  allImagesCount: allImages.length,
                  selectedImage,
                  currentImages: currentImages.map(img => ({ url: img.url, type: img.type })),
                  allImages: allImages.map(img => ({ url: img.url, type: img.type }))
                })
                
                // If selectedImage is not in all images, add it as a single-item array
                if (selectedImage && !allImages.some(img => img.url === selectedImage)) {
                  const result = [...allImages, {
                    url: selectedImage,
                    width: 1024, // Default dimensions for saved images
                    height: 1024,
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VideoGenerationPanel
              onGenerateVideo={onGenerateVideo}
              loading={loading}
              selectedImage={selectedImage}
              aspectRatio={currentSettings.baseImageAspectRatio || '16:9'}
              savedImages={savedImages}
              onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
            />

            {/* Generated Videos Viewer */}
            <VideoViewer
              title="Generated Videos"
              description="View and manage your generated videos"
              videos={savedVideos}
              selectedVideo={selectedVideo}
              onSelectVideo={setSelectedVideo}
              onSaveToGallery={handleSaveToGallery}
              onDownloadVideo={async (videoUrl: string, filename: string) => {
                try {
                  const response = await fetch(videoUrl)
                  const blob = await response.blob()
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = filename
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                } catch (error) {
                  console.error('Error downloading video:', error)
                }
              }}
              onDeleteVideo={handleDeleteVideo}
              savingVideo={savingImage}
              deletingVideo={deletingVideo}
              loading={loading}
              emptyStateMessage="No videos available. Generate some videos first!"
            />
          </div>
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
                // TODO: Set other generation parameters like style, resolution, etc.
                // This would require updating the playground state management
                console.log('Reusing generation settings:', metadata)
              }
              // Switch to the generate tab
              setActiveTab('generate')
            }}
            onMediaUpdated={(media) => {
              // Update saved media state for BatchProcessingPanel - filter out videos
              setSavedImages(media
                .filter(item => item.media_type === 'image' && item.image_url)
                .map(img => ({
                  id: img.id,
                  image_url: img.image_url || '',
                  title: img.title
                })))
            }}
            onAddMediaToPreview={handleAddImageToPreview}
            onExpandMedia={onExpandMedia}
          />
        </div>
      )}
    </div>
  )
}
