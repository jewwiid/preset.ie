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
}

export default function TabbedPlaygroundLayout({
  onGenerate,
  onEdit,
  onPerformBatchEdit,
  onGenerateVideo,
  onImportProject,
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
  onExpandMedia
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
  const savedGalleryRef = useRef<SavedMediaGalleryRef>(null)

  const handleSettingsChange = useCallback((settings: { resolution: string; baseImageAspectRatio?: string }) => {
    setCurrentSettings(prev => ({
      ...prev,
      resolution: settings.resolution,
      baseImageAspectRatio: settings.baseImageAspectRatio
    }))
  }, [])

  const handleAddImageToPreview = useCallback((imageUrl: string) => {
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
  }, [additionalPreviewImages])

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

  // Set default aspect ratio to 16:9 when switching to Video tab
  useEffect(() => {
    if (activeTab === 'video') {
      setCurrentSettings(prev => ({
        ...prev,
        aspectRatio: '16:9'
      }))
    }
  }, [activeTab])

  const handleSaveToGallery = useCallback(async (url: string) => {
    await onSaveToGallery(url)
    // Refresh the saved gallery after saving
    if (savedGalleryRef.current) {
      savedGalleryRef.current.refresh()
    }
  }, [onSaveToGallery])

  return (
    <div className="space-y-6">
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
                
                // If selectedImage is not in all images, add it as a single-item array
                if (selectedImage && !allImages.some(img => img.url === selectedImage)) {
                  return [...allImages, {
                    url: selectedImage,
                    width: 1024, // Default dimensions for saved images
                    height: 1024,
                    generated_at: new Date().toISOString(),
                    type: 'saved'
                  }]
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
              savingVideo={savingImage}
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
              setActiveTab('edit')
            }}
          />
        </TabsContent>
      </Tabs>

      {/* Persistent Saved Images Gallery */}
      <div className="mt-8">
        <SavedMediaGallery
          ref={savedGalleryRef}
          selectedMediaUrl={selectedImage}
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
    </div>
  )
}
