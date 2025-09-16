'use client'

import { useState, useEffect } from 'react'
import { Sparkles, X, Download } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useFeedback } from '../../components/feedback/FeedbackContext'
import { supabase } from '../../lib/supabase'
import BatchProgressTracker from '../components/playground/BatchProgressTracker'
import { ToastContainer, useToast } from '../../components/ui/toast'
import { Button } from '../../components/ui/button'

// Import the new components
import ImageGenerationPanel from '../components/playground/ImageGenerationPanel'
import AdvancedEditingPanel from '../components/playground/AdvancedEditingPanel'
import SequentialGenerationPanel from '../components/playground/SequentialGenerationPanel'
import StyleVariationsPanel from '../components/playground/StyleVariationsPanel'
import BatchProcessingPanel from '../components/playground/BatchProcessingPanel'
import VideoGenerationPanel from '../components/playground/VideoGenerationPanel'
import ImageGalleryPanel from '../components/playground/ImageGalleryPanel'
import PastGenerationsPanel from '../components/playground/PastGenerationsPanel'
import TabbedPlaygroundLayout from '../components/playground/TabbedPlaygroundLayout'

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
    custom_style_preset?: any
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
  status: string
  credits_used: number
  last_generated_at?: string
}

export default function PlaygroundPage() {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  const { toasts, removeToast } = useToast()
  
  // Core state
  const [currentProject, setCurrentProject] = useState<PlaygroundProject | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState(0)
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<string>('FREE')
  const [savingImage, setSavingImage] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState('')
  
  // Video generation states
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<'idle' | 'generating' | 'completed'>('idle')
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [fullScreenImage, setFullScreenImage] = useState<{
    url: string
    title?: string
    index: number
    type?: 'image' | 'video'
  } | null>(null)
  
  // Batch job tracking states
  const [activeBatchJobId, setActiveBatchJobId] = useState<string | null>(null)
  const [batchResults, setBatchResults] = useState<any[]>([])

  useEffect(() => {
    if (user && session?.access_token) {
      fetchUserCredits()
    }
  }, [user, session])

  const fetchUserCredits = async () => {
    if (!session?.access_token) {
      console.log('No session token available for fetching credits')
      return
    }

    try {
      const response = await fetch('/api/user/credits', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch credits: ${response.status}`)
      }
      
      const data = await response.json()
      setUserCredits(data.current_balance)
      setUserSubscriptionTier(data.subscription_tier || 'FREE')
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  // Handle batch job completion
  const handleBatchJobComplete = (results: any[]) => {
    setBatchResults(results)
    setActiveBatchJobId(null)
    
    // Update current project with new images if available
    if (results.length > 0 && currentProject) {
      const newImages = results.map(result => ({
        url: result.editedImage || result.styledImage,
        width: 2048,
        height: 2048,
        generated_at: new Date().toISOString()
      }))
      
      setCurrentProject(prev => prev ? {
        ...prev,
        generated_images: [...(prev.generated_images || []), ...newImages]
      } : null)
    }
  }

  // API call functions
  const generateImages = async (params: {
    prompt: string
    style: string
    resolution: string
    consistencyLevel: string
    numImages: number
    customStylePreset?: any
    baseImage?: string
    generationMode?: 'text-to-image' | 'image-to-image'
  }) => {
    setCurrentPrompt(params.prompt)
    setLoading(true)
    try {
      const response = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...params,
          maxImages: params.numImages,
          projectId: currentProject?.id,
          baseImage: params.baseImage,
          generationMode: params.generationMode,
          customStylePreset: params.customStylePreset
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const { project, images, creditsUsed, warning } = await response.json()
      setCurrentProject(project)
      setUserCredits(prev => prev - creditsUsed)
      
      showFeedback({
        type: 'success',
        title: 'Images Generated!',
        message: `Successfully generated ${images.length} image(s) using ${creditsUsed} credits.`
      })
      
      // Show warning if fewer images were generated than requested
      if (warning) {
        showFeedback({
          type: 'warning',
          title: 'Service Limitation',
          message: warning
        })
      }
    } catch (error) {
      console.error('Generation failed:', error)
      showFeedback({
        type: 'error',
        title: 'Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const performAdvancedEdit = async (params: {
    imageUrl: string
    editType: string
    editPrompt: string
    strength: number
    referenceImage?: string
  }) => {
    setLoading(true)
    try {
      console.log('🔍 Advanced Edit Debug:', {
        session: !!session,
        access_token: session?.access_token ? 'Present' : 'Missing',
        user: !!user,
        userId: user?.id,
        sessionExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'Unknown'
      })
      
      // Check if session is valid
      if (!session || !session.access_token) {
        throw new Error('No active session. Please sign in again.')
      }
      
      // Check if session is expired and try to refresh
      if (session.expires_at && new Date(session.expires_at * 1000) < new Date()) {
        console.log('🔄 Session expired, attempting refresh...')
        try {
          if (!supabase) {
            throw new Error('Supabase client not available')
          }
          const { data: { session: refreshedSession }, error } = await supabase.auth.refreshSession()
          if (error || !refreshedSession) {
            throw new Error('Session expired and refresh failed. Please sign in again.')
          }
          console.log('✅ Session refreshed successfully')
          // Use the refreshed session
          session.access_token = refreshedSession.access_token
          session.expires_at = refreshedSession.expires_at
        } catch (refreshError) {
          throw new Error('Session expired and refresh failed. Please sign in again.')
        }
      }
      
      const response = await fetch('/api/playground/advanced-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...params,
          projectId: currentProject?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to edit image')
      }

      const { editedImage, creditsUsed } = await response.json()
      
      console.log('Advanced edit completed:', { editedImage, creditsUsed })
      
      // Add edited image to project
      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          generated_images: [
            ...currentProject.generated_images,
            {
              url: editedImage,
              width: 1024,
              height: 1024,
              generated_at: new Date().toISOString()
            }
          ]
        }
        console.log('Updated project with edited image:', updatedProject)
        setCurrentProject(updatedProject)
        setUserCredits(prev => prev - creditsUsed)
        
        // Update selected image to the newly edited image
        console.log('Setting selected image to:', editedImage)
        setSelectedImage(editedImage)
      }
      
      showFeedback({
        type: 'success',
        title: 'Edit Completed!',
        message: `Successfully applied ${params.editType} edit using ${creditsUsed} credits. The edited image is now displayed in the preview area.`
      })
    } catch (error) {
      console.error('Advanced edit failed:', error)
      showFeedback({
        type: 'error',
        title: 'Edit Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateSequentialImages = async (params: {
    prompt: string
    numImages: number
    style: string
    resolution: string
    consistencyLevel: string
  }) => {
    setCurrentPrompt(params.prompt)
    setLoading(true)
    try {
      const response = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          prompt: params.prompt,
          style: params.style,
          aspectRatio: '1:1',
          resolution: params.resolution,
          maxImages: params.numImages,
          enableSyncMode: true,
          enableBase64Output: false,
          projectId: currentProject?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate sequential images')
      }

      const { project, images, creditsUsed } = await response.json()
      setCurrentProject(project)
      setUserCredits(prev => prev - creditsUsed)
      
      showFeedback({
        type: 'success',
        title: 'Sequential Images Generated!',
        message: `Successfully generated ${images.length} sequential images using ${creditsUsed} credits.`
      })
    } catch (error) {
      console.error('Sequential generation failed:', error)
      showFeedback({
        type: 'error',
        title: 'Sequential Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateSequentialEdits = async (params: {
    prompt: string
    images: string[]
    numImages: number
    resolution: string
  }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/playground/edit-sequential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...params,
          projectId: currentProject?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate sequential edits')
      }

      const { project, images, creditsUsed } = await response.json()
      setCurrentProject(project)
      setUserCredits(prev => prev - creditsUsed)
      
      showFeedback({
        type: 'success',
        title: 'Sequential Edits Generated!',
        message: `Successfully generated ${images.length} sequential edited images using ${creditsUsed} credits.`
      })
    } catch (error) {
      console.error('Sequential editing failed:', error)
      showFeedback({
        type: 'error',
        title: 'Sequential Editing Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateStyleVariations = async (params: {
    imageUrl: string
    styles: string[]
  }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/playground/style-variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...params,
          projectId: currentProject?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate style variations')
      }

      const { batchJobId, results, creditsUsed, errors } = await response.json()
      setUserCredits(prev => prev - creditsUsed)
      
      // Set up batch job tracking
      setActiveBatchJobId(batchJobId)
      setBatchResults(results)
      
      if (errors && errors.length > 0) {
        showFeedback({
          type: 'warning',
          title: 'Style Variations Completed with Errors',
          message: `Generated ${results.length} variations with ${errors.length} errors. Used ${creditsUsed} credits.`
        })
      } else {
        showFeedback({
          type: 'success',
          title: 'Style Variations Generated!',
          message: `Successfully generated ${results.length} style variations using ${creditsUsed} credits.`
        })
      }
    } catch (error) {
      console.error('Style variation generation failed:', error)
      showFeedback({
        type: 'error',
        title: 'Style Variation Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const performBatchEdit = async (params: {
    prompt: string
    images: string[]
    editType: string
  }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/playground/batch-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...params,
          projectId: currentProject?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to perform batch editing')
      }

      const { batchJobId, results, creditsUsed, errors } = await response.json()
      setUserCredits(prev => prev - creditsUsed)
      
      // Set up batch job tracking
      setActiveBatchJobId(batchJobId)
      setBatchResults(results)
      
      if (errors && errors.length > 0) {
        showFeedback({
          type: 'warning',
          title: 'Batch Editing Completed with Errors',
          message: `Processed ${results.length} images with ${errors.length} errors. Used ${creditsUsed} credits.`
        })
      } else {
        showFeedback({
          type: 'success',
          title: 'Batch Editing Completed!',
          message: `Successfully processed ${results.length} images using ${creditsUsed} credits.`
        })
      }
    } catch (error) {
      console.error('Batch editing failed:', error)
      showFeedback({
        type: 'error',
        title: 'Batch Editing Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const generateVideo = async (params: {
    imageUrl: string
    duration: number
    resolution: string
    motionType: string
    aspectRatio: string
    prompt: string
    yPosition?: number
  }) => {
    setLoading(true)
    setVideoGenerationStatus('generating')
    setGeneratedVideoUrl(null)
    try {
      console.log('Starting video generation with params:', params)
      
      const response = await fetch('/api/playground/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          ...params,
          projectId: currentProject?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate video')
      }

      const responseData = await response.json()
      console.log('Video generation API response:', responseData)
      const { taskId, creditsUsed } = responseData
      
      // Deduct credits immediately
      setUserCredits(prev => prev - creditsUsed)
      
      showFeedback({
        type: 'info',
        title: 'Video Generation Started!',
        message: `Video generation is in progress. This may take a few minutes. Used ${creditsUsed} credits.`
      })

      // Poll for video completion
      const finalVideoUrl = await pollForVideoCompletion(taskId)
      console.log('Video generation completed:', { finalVideoUrl, currentProject: !!currentProject })
      
      // Set the generated video URL for display
      if (finalVideoUrl) {
        setGeneratedVideoUrl(finalVideoUrl)
        setVideoGenerationStatus('completed')
      }
      
      // Add video to project when completed
      if (currentProject && finalVideoUrl) {
        const videoItem = {
          url: finalVideoUrl,
          width: params.resolution === '720p' ? 1280 : 854,
          height: params.resolution === '720p' ? 720 : 480,
          generated_at: new Date().toISOString(),
          type: 'video'
        }
        
        const updatedProject = {
          ...currentProject,
          generated_images: [
            ...currentProject.generated_images,
            videoItem
          ]
        }
        
        console.log('Adding video to project:', { 
          videoItem, 
          totalImages: updatedProject.generated_images.length,
          projectId: currentProject.id 
        })
        
        setCurrentProject(updatedProject)
      } else {
        console.log('Cannot add video to project:', { 
          hasProject: !!currentProject, 
          hasVideoUrl: !!finalVideoUrl 
        })
      }
      
      showFeedback({
        type: 'success',
        title: 'Video Generated!',
        message: `Successfully generated video!`
      })
    } catch (error) {
      console.error('Video generation failed:', error)
      setVideoGenerationStatus('idle')
      setGeneratedVideoUrl(null)
      showFeedback({
        type: 'error',
        title: 'Video Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const pollForVideoCompletion = async (taskId: string): Promise<string | null> => {
    const maxAttempts = 60 // Poll for up to 5 minutes (60 * 5 seconds)
    let attempts = 0

    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`/api/playground/video/${taskId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to check video status')
        }

        const result = await response.json()
        console.log('Video status check:', { status: result.status, videoUrl: result.videoUrl, attempt: attempts + 1 })

        if (result.status === 'completed' && result.videoUrl) {
          console.log('Video generation completed successfully:', result.videoUrl)
          return result.videoUrl
        } else if (result.status === 'failed') {
          console.error('Video generation failed:', result.error)
          throw new Error(result.error || 'Video generation failed')
        }

        // Still processing, wait 5 seconds before next check
        await new Promise(resolve => setTimeout(resolve, 5000))
        attempts++

      } catch (error) {
        console.error('Error polling for video completion:', error)
        throw error
      }
    }

    throw new Error('Video generation timed out')
  }

  const saveToGallery = async (imageUrl: string) => {
    console.log('🎯 saveToGallery function called with URL:', imageUrl)
    
    // Prevent multiple simultaneous calls
    if (savingImage === imageUrl) {
      console.log('⚠️ Save already in progress for this URL, skipping...')
      return
    }
    
    setSavingImage(imageUrl)
    try {
      console.log('🔄 Starting save process...')
      
      // Use current session token (no refresh to avoid interrupting function execution)
      console.log('🔄 Using current session token for save process...')
      
      // Check if this is a video URL (contains .mp4, .webm, .mov or cloudfront.net)
      console.log('🔍 Starting media type detection...')
      const isVideo = imageUrl.includes('.mp4') || imageUrl.includes('.webm') || 
                     imageUrl.includes('.mov') || imageUrl.includes('cloudfront.net')
      
      console.log('🔍 Media type detection:', { 
        imageUrl, 
        isVideo, 
        hasMp4: imageUrl.includes('.mp4'),
        hasWebm: imageUrl.includes('.webm'),
        hasMov: imageUrl.includes('.mov'),
        hasCloudfront: imageUrl.includes('cloudfront.net')
      })
      
      console.log('🔍 Media type detection completed, proceeding to save logic...')
      
      if (isVideo) {
        console.log('🎬 Detected video - using video save endpoint')
        // Save video to gallery with actual metadata
        // Try to get metadata from current project or use defaults
        const projectMetadata = currentProject?.metadata || {}
        const videoMetadata = currentProject?.generated_images?.find(img => img.url === imageUrl) || {}
        
        const videoData = {
          videoUrl: imageUrl,
          title: 'Generated Video',
          description: `AI-generated video: ${currentProject?.prompt || 'AI-generated video'}`,
          tags: ['ai-generated', 'video'],
          duration: (videoMetadata as any)?.duration || 5,
          resolution: (videoMetadata as any)?.resolution || '480p',
          aspectRatio: (videoMetadata as any)?.aspect_ratio || '1:1',
          motionType: (videoMetadata as any)?.motion_type || 'subtle',
          prompt: currentProject?.prompt || 'AI-generated video',
          generationMetadata: {
            generated_at: new Date().toISOString(),
            credits_used: 8,
            duration: (videoMetadata as any)?.duration || 5,
            resolution: (videoMetadata as any)?.resolution || '480p',
            aspect_ratio: (videoMetadata as any)?.aspect_ratio || '1:1',
            motion_type: (videoMetadata as any)?.motion_type || 'subtle',
            image_url: null,
            task_id: null,
            prompt: currentProject?.prompt || 'AI-generated video',
            style: currentProject?.style || 'realistic',
            consistency_level: projectMetadata?.consistency_level || 'high'
          }
        }
        
        console.log('Saving video to gallery:', videoData)
        console.log('Session token present:', !!session?.access_token)
        console.log('Session token length:', session?.access_token?.length)
        
        // Use current session token
        const tokenToUse = session?.access_token
        
        console.log('Using token for API call:', !!tokenToUse)
        
        const response = await fetch('/api/playground/save-video-to-gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenToUse}`
          },
          body: JSON.stringify(videoData)
        })

        if (response.ok) {
          showFeedback({
            type: 'success',
            title: 'Video Saved!',
            message: 'Video has been saved to your gallery.'
          })
        } else {
          const errorData = await response.json()
          console.error('Video save API error:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            videoUrl: imageUrl
          })
          throw new Error(errorData.error || 'Failed to save video')
        }
      } else {
        // Save image to gallery (existing logic)
        const generationMetadata = currentProject ? {
          prompt: currentProject.prompt,
          style: currentProject.style || 'realistic',
          aspect_ratio: currentProject.aspect_ratio || '1:1',
          resolution: currentProject.resolution || '1024x1024',
          consistency_level: currentProject.metadata?.consistency_level || 'high',
          enhanced_prompt: currentProject.metadata?.enhanced_prompt || currentProject.prompt,
          style_applied: currentProject.metadata?.style_applied || currentProject.style,
          style_prompt: currentProject.metadata?.style_prompt || '',
          custom_style_preset: currentProject.metadata?.custom_style_preset || null,
          generation_mode: currentProject.metadata?.generation_mode || 'text-to-image',
          base_image: currentProject.metadata?.base_image || null,
          api_endpoint: currentProject.metadata?.api_endpoint || 'seedream-v4',
          credits_used: currentProject.credits_used || 0,
          generated_at: currentProject.last_generated_at || new Date().toISOString()
        } : {}

        const response = await fetch('/api/playground/save-to-gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            imageUrl,
            title: currentProject?.title || 'Generated Image',
            description: `Generated from: ${currentProject?.prompt || 'Unknown prompt'}`,
            tags: ['ai-generated'],
            projectId: currentProject?.id,
            generationMetadata
          })
        })

        if (response.ok) {
          showFeedback({
            type: 'success',
            title: 'Image Saved!',
            message: 'Image has been saved to your gallery.'
          })
        } else {
          const errorData = await response.json()
          throw new Error(errorData.error || 'Failed to save image')
        }
      }
    } catch (error) {
      console.error('Save failed:', error)
      showFeedback({
        type: 'error',
        title: 'Save Failed',
        message: error instanceof Error ? error.message : 'Failed to save image to gallery'
      })
    } finally {
      setSavingImage(null)
    }
  }

  const handleImportProject = (project: any) => {
    setCurrentProject(project)
    if (project.generated_images && project.generated_images.length > 0) {
      setSelectedImage(project.generated_images[0].url)
    }
    showFeedback({
      type: 'success',
      title: 'Project Imported!',
      message: 'Past generation has been imported and is ready for editing.'
    })
  }

  const handleExpandMedia = (media: any) => {
    console.log('Expanding media:', media)
    // Set the media as fullscreen
    if (media.media_type === 'video') {
      setFullScreenImage({
        url: media.video_url || '',
        title: media.title,
        index: -1,
        type: 'video'
      })
    } else {
      setFullScreenImage({
        url: media.image_url || '',
        title: media.title,
        index: -1,
        type: 'image'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Preset Playground</h1>
          <p className="text-gray-600">Create and edit AI-generated images with Seedream</p>
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <Sparkles className="h-4 w-4 text-purple-500" />
              <span>Credits: {userCredits}</span>
            </div>
            <div className="text-sm text-gray-500">
              Generation: 2 credits | Basic Edit: 2 credits | Advanced Edit: 1-4 credits | Sequential: 3/image | Style Variations: 2/style | Batch: 3/image | Video: 8-10 credits
            </div>
          </div>
        </div>

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
          onGenerate={generateImages}
          onEdit={performAdvancedEdit}
          onPerformBatchEdit={performBatchEdit}
          onGenerateVideo={generateVideo}
          onImportProject={handleImportProject}
          loading={loading}
          userCredits={userCredits}
          userSubscriptionTier={userSubscriptionTier}
          selectedImage={selectedImage}
          currentPrompt={currentPrompt}
          currentProject={currentProject}
          onSelectImage={setSelectedImage}
          onSaveToGallery={saveToGallery}
          onSetPrompt={setCurrentPrompt}
          onUpdateProject={setCurrentProject}
          savingImage={savingImage}
          sessionToken={session?.access_token}
          videoGenerationStatus={videoGenerationStatus}
          generatedVideoUrl={generatedVideoUrl}
          onExpandMedia={handleExpandMedia}
        />
      </div>
      
      {/* Toast Container */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Full Screen Media Modal */}
      {fullScreenImage && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-7xl max-h-full w-full h-full flex items-center justify-center">
            {/* Close button */}
            <button
              onClick={() => setFullScreenImage(null)}
              className="absolute top-4 right-4 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
            >
              <X className="h-6 w-6 text-white" />
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
            <div className="absolute bottom-4 left-4 right-4 bg-black/50 text-white p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{fullScreenImage.title}</h3>
                  <p className="text-sm text-gray-300">
                    {fullScreenImage.type === 'video' ? 'Video' : 'Image'} from Saved Gallery
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      if (fullScreenImage.type === 'video') {
                        // Download video
                        const a = document.createElement('a')
                        a.href = fullScreenImage.url
                        a.download = `${fullScreenImage.title || 'video'}.mp4`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      } else {
                        // Download image
                        const a = document.createElement('a')
                        a.href = fullScreenImage.url
                        a.download = `${fullScreenImage.title || 'image'}.png`
                        document.body.appendChild(a)
                        a.click()
                        document.body.removeChild(a)
                      }
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                    title={fullScreenImage.type === 'video' ? "Download Video" : "Download Image"}
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
