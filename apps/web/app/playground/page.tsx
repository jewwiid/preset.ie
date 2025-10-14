'use client'

import { Suspense } from 'react'
import { Sparkles, X, Download, Wand2 } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useFeedback } from '../../components/feedback/FeedbackContext'
import BatchProgressTracker from '../components/playground/BatchProgressTracker'
import { ToastContainer, useToast } from '../../components/ui/toast'
import { Button } from '../../components/ui/button'
import { PageHeader } from '../../components/PageHeader'
import { usePageHeaderImage } from '../../hooks/usePageHeaderImage'

// Import the new components
import TabbedPlaygroundLayout from '../components/playground/TabbedPlaygroundLayout'
import EnhancedPlaygroundHeader from '../components/playground/EnhancedPlaygroundHeader'

// Import custom hooks
import { useCredits } from './hooks/useCredits'
import { usePlaygroundState } from './hooks/usePlaygroundState'
import { useImageGeneration } from './hooks/useImageGeneration'
import { useVideoGeneration } from './hooks/useVideoGeneration'
import { useSaveToGallery } from './hooks/useSaveToGallery'

// Import types
import type {
  GenerateImagesParams,
  AdvancedEditParams,
  StyleVariationsParams,
  BatchEditParams,
  VideoGenerationParams,
  FullScreenMedia} from './types'
import { replaceImagesInProject, createImageEntry } from './lib/imageHelpers'

function PlaygroundContent() {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  const { toasts, removeToast } = useToast()
  const { headerImage } = usePageHeaderImage('playground-header')

  // Custom hooks
  const { userCredits, userSubscriptionTier, deductCredits } = useCredits(session)
  const {
    currentProject,
    setCurrentProject,
    selectedImage,
    setSelectedImage,
    loading,
    setLoading,
    activeTab,
    setActiveTab,
    fullScreenImage,
    setFullScreenImage,
    activePreset,
    clearPreset,
    activeBatchJobId,
    setActiveBatchJobId,
    batchResults,
    setBatchResults,
    videoGenerationStatus,
    setVideoGenerationStatus,
    generatedVideoUrl,
    setGeneratedVideoUrl,
    generatedVideoMetadata,
    setGeneratedVideoMetadata,
    currentPrompt,
    setCurrentPrompt} = usePlaygroundState()

  const { saveToGallery, savingImage } = useSaveToGallery(session, currentProject)

  const imageGeneration = useImageGeneration(
    session,
    currentProject,
    setCurrentProject,
    setCurrentPrompt,
    setSelectedImage,
    user?.id,
    user?.email
  )

  const videoGeneration = useVideoGeneration(
    session,
    currentProject?.id || null,
    setVideoGenerationStatus,
    setGeneratedVideoUrl,
    setGeneratedVideoMetadata
  )

  // ============================================================================
  // Handler Functions
  // ============================================================================

  const handleGenerateImages = async (params: GenerateImagesParams) => {
    setLoading(true)
    try {
      const { images, creditsUsed, warning } = await imageGeneration.generateImages(params)

      deductCredits(creditsUsed)

      showFeedback({
        type: 'success',
        title: 'Images Generated!',
        message: `Successfully generated ${images.length} image(s) using ${creditsUsed} credits.`})

      // Show warning if fewer images were generated than requested
      if (warning) {
        showFeedback({
          type: 'warning',
          title: 'Service Limitation',
          message: warning})
      }
    } catch (error) {
      console.error('Generation failed:', error)

      const errorTitle =
        error instanceof Error && error.name !== 'Error' ? error.name : 'Generation Failed'

      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'

      showFeedback({
        type: 'error',
        title: errorTitle,
        message: errorMessage})
    } finally {
      setLoading(false)
    }
  }

  const handleAdvancedEdit = async (params: AdvancedEditParams) => {
    setLoading(true)
    try {
      const editedImage = await imageGeneration.performAdvancedEdit(params)

      // Credits are deducted in the API response
      deductCredits(3) // Standard edit cost

      showFeedback({
        type: 'success',
        title: 'Edit Completed!',
        message: `Successfully applied ${params.editType} edit. The edited image is now displayed in the preview area.`})
    } catch (error) {
      console.error('Advanced edit failed:', error)
      showFeedback({
        type: 'error',
        title: 'Edit Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'})
    } finally {
      setLoading(false)
    }
  }

  const handleStyleVariations = async (params: StyleVariationsParams) => {
    setLoading(true)
    try {
      const { batchJobId, results, creditsUsed, errors } =
        await imageGeneration.generateStyleVariations(params)

      deductCredits(creditsUsed)

      // Set up batch job tracking
      setActiveBatchJobId(batchJobId)
      setBatchResults(results)

      if (errors && errors.length > 0) {
        showFeedback({
          type: 'warning',
          title: 'Style Variations Completed with Errors',
          message: `Generated ${results.length} variations with ${errors.length} errors. Used ${creditsUsed} credits.`})
      } else {
        showFeedback({
          type: 'success',
          title: 'Style Variations Generated!',
          message: `Successfully generated ${results.length} style variations using ${creditsUsed} credits.`})
      }
    } catch (error) {
      console.error('Style variation generation failed:', error)
      showFeedback({
        type: 'error',
        title: 'Style Variation Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'})
    } finally {
      setLoading(false)
    }
  }

  const handleBatchEdit = async (params: BatchEditParams) => {
    setLoading(true)
    try {
      const { batchJobId, results, creditsUsed, errors } =
        await imageGeneration.performBatchEdit(params)

      deductCredits(creditsUsed)

      // Set up batch job tracking
      setActiveBatchJobId(batchJobId)
      setBatchResults(results)

      if (errors && errors.length > 0) {
        showFeedback({
          type: 'warning',
          title: 'Batch Editing Completed with Errors',
          message: `Processed ${results.length} images with ${errors.length} errors. Used ${creditsUsed} credits.`})
      } else {
        showFeedback({
          type: 'success',
          title: 'Batch Editing Completed!',
          message: `Successfully processed ${results.length} images using ${creditsUsed} credits.`})
      }
    } catch (error) {
      console.error('Batch editing failed:', error)
      showFeedback({
        type: 'error',
        title: 'Batch Editing Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'})
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateVideo = async (params: VideoGenerationParams) => {
    setLoading(true)
    try {
      await videoGeneration.generateVideo(params)

      // Credits are deducted immediately in the video generation hook
      deductCredits(8) // Standard video generation cost

      showFeedback({
        type: 'info',
        title: 'Video Generation Started!',
        message: `Video generation is in progress. This may take a few minutes.`})

      showFeedback({
        type: 'success',
        title: 'Video Generated!',
        message: `Successfully generated video!`})
    } catch (error) {
      console.error('Video generation failed:', error)
      setVideoGenerationStatus('idle')
      setGeneratedVideoUrl(null)
      showFeedback({
        type: 'error',
        title: 'Video Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'})
    } finally {
      setLoading(false)
    }
  }

  const handleBatchJobComplete = (results: any[]) => {
    setBatchResults(results)
    setActiveBatchJobId(null)

    // Update current project with new images if available
    if (results.length > 0 && currentProject) {
      const newImages = results.map((result) =>
        createImageEntry(result.editedImage || result.styledImage, 'edit', 2048, 2048)
      )

      setCurrentProject(replaceImagesInProject(currentProject, newImages, 'base'))
    }
  }

  const handleImportProject = (project: any) => {
    console.log('📥 Importing project:', project)
    setCurrentProject(project)

    // For videos, set the generated video URL instead of selectedImage
    if (project.is_video && project.generated_images && project.generated_images.length > 0) {
      const videoUrl = project.generated_images[0].url
      setGeneratedVideoUrl(videoUrl)
      setVideoGenerationStatus('completed')

      // Set video metadata if available
      if (project.generated_images[0]) {
        setGeneratedVideoMetadata({
          aspectRatio: project.aspect_ratio || '16:9',
          resolution: `${project.generated_images[0].width}x${project.generated_images[0].height}`,
          duration: 5,
          prompt: project.prompt || '',
          cameraMovement: 'smooth'})
      }

      showFeedback({
        type: 'success',
        title: 'Video Imported!',
        message: 'Past video generation has been imported and is ready for viewing.'})
    } else if (project.generated_images && project.generated_images.length > 0) {
      // For images, set selected image normally
      setSelectedImage(project.generated_images[0].url)

      showFeedback({
        type: 'success',
        title: 'Project Imported!',
        message: 'Past generation has been imported and is ready for editing.'})
    }
  }

  const handleExpandMedia = (media: any) => {
    console.log('Expanding media:', media)
    const fullScreenMedia: FullScreenMedia = {
      url: media.media_type === 'video' ? media.video_url || '' : media.image_url || '',
      title: media.title,
      index: -1,
      type: media.media_type === 'video' ? 'video' : 'image'}
    setFullScreenImage(fullScreenMedia)
  }

  // ============================================================================
  // Render
  // ============================================================================

  // Check authentication
  if (!user || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access the playground.</p>
          <Button onClick={() => (window.location.href = '/auth/signin')}>Sign In</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <PageHeader
          title="AI Playground"
          subtitle="Create stunning visuals with AI-powered tools"
          icon={Wand2}
          backgroundImage={headerImage}
        />

        {/* Enhanced Header */}
        <EnhancedPlaygroundHeader
          userCredits={userCredits}
          userSubscriptionTier={userSubscriptionTier}
          activeTab={activeTab}
          loading={loading}
        />

        {/* Active Preset Indicator */}
        {activePreset && (
          <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Using Preset</p>
                  <p className="text-sm text-muted-foreground">{activePreset.name}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={clearPreset}>
                <X className="w-4 h-4 mr-2" />
                Clear Preset
              </Button>
            </div>
          </div>
        )}

        {/* Batch Progress Tracker */}
        {activeBatchJobId && (
          <div className="mb-6">
            <BatchProgressTracker
              batchJobId={activeBatchJobId}
              onComplete={handleBatchJobComplete}
              onCancel={() => {
                setActiveBatchJobId(null)
                setBatchResults([])
              }}
            />
          </div>
        )}

        {/* New Tabbed Interface */}
        <TabbedPlaygroundLayout
          onGenerate={handleGenerateImages}
          onEdit={handleAdvancedEdit}
          onPerformBatchEdit={handleBatchEdit}
          onGenerateVideo={handleGenerateVideo}
          onImportProject={handleImportProject}
          onSettingsUpdate={(settings) => {
            console.log('📐 Settings updated from import:', settings)
          }}
          onTabChange={setActiveTab}
          loading={loading}
          userCredits={userCredits}
          userSubscriptionTier={userSubscriptionTier}
          selectedImage={selectedImage}
          currentPrompt={currentPrompt}
          currentProject={currentProject}
          onSelectImage={setSelectedImage}
          onSaveToGallery={saveToGallery}
          onSetPrompt={setCurrentPrompt}
          initialPresetId={activePreset?.id}
          onUpdateProject={setCurrentProject}
          savingImage={savingImage}
          sessionToken={session?.access_token}
          videoGenerationStatus={videoGenerationStatus}
          generatedVideoUrl={generatedVideoUrl}
          generatedVideoMetadata={generatedVideoMetadata}
          onExpandMedia={handleExpandMedia}
          onVideoGenerated={() => {
            console.log('🎬 Video generation callback triggered')
          }}
        />
      </div>

      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Full Screen Media Modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 modal-backdrop z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-backdrop/50 hover:bg-backdrop/70 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-foreground" />
            </button>

            {/* Media */}
            {fullScreenImage.type === 'video' ? (
              <video
                src={fullScreenImage.url}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
                preload="metadata"
                poster={fullScreenImage.url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={fullScreenImage.url}
                alt={fullScreenImage.title}
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Media info */}
            <div className="absolute bottom-4 left-4 right-4 bg-backdrop/50 text-foreground p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{fullScreenImage.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {fullScreenImage.type === 'video' ? 'Video' : 'Image'} from Saved Gallery
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      const a = document.createElement('a')
                      a.href = fullScreenImage.url
                      a.download = `${fullScreenImage.title || fullScreenImage.type}.${
                        fullScreenImage.type === 'video' ? 'mp4' : 'png'
                      }`
                      document.body.appendChild(a)
                      a.click()
                      document.body.removeChild(a)
                    }}
                    className="bg-background/20 hover:bg-background/30 text-foreground border-border/30"
                    title={
                      fullScreenImage.type === 'video' ? 'Download Video' : 'Download Image'
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlaygroundContent />
    </Suspense>
  )
}
