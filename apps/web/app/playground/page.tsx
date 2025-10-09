'use client'

import { useState, useEffect, Suspense } from 'react'
import { Sparkles, X, Download } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '../../lib/auth-context'
import { useFeedback } from '../../components/feedback/FeedbackContext'
import { supabase } from '../../lib/supabase'
import BatchProgressTracker from '../components/playground/BatchProgressTracker'
import { ToastContainer, useToast } from '../../components/ui/toast'
import { Button } from '../../components/ui/button'

// Import the new components
import AdvancedEditingPanel from '../components/playground/AdvancedEditingPanel'
import SequentialGenerationPanel from '../components/playground/SequentialGenerationPanel'
import StyleVariationsPanel from '../components/playground/StyleVariationsPanel'
import BatchProcessingPanel from '../components/playground/BatchProcessingPanel'
import VideoGenerationPanel from '../components/playground/VideoGenerationPanel'
import ImageGalleryPanel from '../components/playground/ImageGalleryPanel'
import PastGenerationsPanel from '../components/playground/PastGenerationsPanel'
import TabbedPlaygroundLayout from '../components/playground/TabbedPlaygroundLayout'
import EnhancedPlaygroundHeader from '../components/playground/EnhancedPlaygroundHeader'
// import { PlaygroundAuthGuard } from '../components/auth/AuthGuard'

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
  created_at: string
  last_generated_at: string
}

function PlaygroundContent() {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  const { toasts, removeToast } = useToast()
  const searchParams = useSearchParams()

  // Core state
  const [currentProject, setCurrentProject] = useState<PlaygroundProject | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState(0)
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<string>('FREE')

  // Preset state from URL parameters
  const [activePreset, setActivePreset] = useState<{id: string, name: string} | null>(null)
  const [savingImage, setSavingImage] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState('')

  // Read URL parameters for preset
  useEffect(() => {
    const presetId = searchParams?.get('preset')
    const presetName = searchParams?.get('name')

    if (presetId && presetName) {
      setActivePreset({
        id: presetId,
        name: decodeURIComponent(presetName)
      })
    }
  }, [searchParams])
  
  // Video generation states
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<'idle' | 'generating' | 'completed'>('idle')
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [generatedVideoMetadata, setGeneratedVideoMetadata] = useState<{
    aspectRatio: string
    resolution: string
    duration: number
    prompt: string
    motionType: string
    styledImageUrl?: string | null
  } | null>(null)
  const [fullScreenImage, setFullScreenImage] = useState<{
    url: string
    title?: string
    index: number
    type?: 'image' | 'video'
  } | null>(null)
  
  // Batch job tracking states
  const [activeBatchJobId, setActiveBatchJobId] = useState<string | null>(null)
  const [batchResults, setBatchResults] = useState<any[]>([])
  
  // Active tab state for header
  const [activeTab, setActiveTab] = useState('generate')

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
        generated_images: [
          // Keep base images
          ...(prev.generated_images || []).filter(img => img.type === 'base'),
          // Add new generated images (replacing any previous generated images)
          ...newImages
        ]
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
    intensity?: number
    cinematicParameters?: any
    enhancedPrompt?: string
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
    replaceLatestImages?: boolean
    userSubject?: string
  }) => {
    setCurrentPrompt(params.prompt)
    setLoading(true)
    
    // Clear previous generated images when starting new generation
    setCurrentProject(prev => prev ? {
      ...prev,
      generated_images: prev.generated_images.filter(img => img.type === 'base') // Keep base images, remove generated ones
    } : null)
    
    // Clear selected image if it was a generated image (not base image)
    if (selectedImage && currentProject?.generated_images.find(img => img.url === selectedImage && img.type !== 'base')) {
      setSelectedImage(null)
    }
    
    // Debug session and token
    console.log('🔍 Session Debug:', {
      hasSession: !!session,
      hasAccessToken: !!session?.access_token,
      tokenLength: session?.access_token?.length || 0,
      user: user?.id,
      userEmail: user?.email
    })
    
    if (!session?.access_token) {
      console.error('❌ No session or access token available')
      setLoading(false)
      throw new Error('Authentication required. Please sign in again.')
    }
    
    try {
      const response = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          ...params,
          maxImages: params.numImages,
          projectId: currentProject?.id,
          baseImage: params.baseImage,
          generationMode: params.generationMode,
          customStylePreset: params.customStylePreset,
          intensity: params.intensity,
          cinematicParameters: params.cinematicParameters,
          enhancedPrompt: params.enhancedPrompt,
          includeTechnicalDetails: params.includeTechnicalDetails,
          includeStyleReferences: params.includeStyleReferences,
          replaceLatestImages: params.replaceLatestImages ?? true, // Auto-replace latest images by default
          userSubject: params.userSubject
        })
      })

      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          throw new Error(`Server error (${response.status}): ${response.statusText}`)
        }

        console.log('API Error Response:', {
          status: response.status,
          errorData
        })

        // Parse specific error types for better user messaging
        let errorMessage = errorData.error || 'Failed to generate images'
        let errorTitle = 'Generation Failed'

        // Check for service unavailability (API platform issues)
        if (response.status === 503 || errorMessage.includes('temporarily unavailable')) {
          errorTitle = 'Service Unavailable'
          errorMessage = 'The image generation service is temporarily unavailable. Please try again in a few minutes.'
        }
        // Check for insufficient user credits (not API platform credits)
        else if (errorMessage.includes('Insufficient credits') && response.status === 403) {
          errorTitle = 'Insufficient Credits'

          // Extract needed credits from error message if available
          const needMatch = errorMessage.match(/Need (\d+) credits/)
          const imagesMatch = errorMessage.match(/for (\d+) image/)

          if (needMatch && imagesMatch) {
            const needed = needMatch[1]
            const images = imagesMatch[1]
            errorMessage = `You need ${needed} credits to generate ${images} image(s), but you currently have ${userCredits} credits. Each image costs 2 credits.`
          } else {
            errorMessage = `You don't have enough credits to generate images. Current balance: ${userCredits} credits. Each image costs 2 credits.`
          }
        }
        // Check for rate limiting
        else if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
          errorTitle = 'Rate Limited'
          errorMessage = 'Too many requests. Please wait a moment before trying again.'
        }
        // Check for authentication errors
        else if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
          errorTitle = 'Authentication Error'
          errorMessage = 'Your session has expired. Please sign in again.'
        }

        const error = new Error(errorMessage)
        error.name = errorTitle
        throw error
      }

      const { project, images, creditsUsed, warning } = await response.json()
      console.log('🔍 Generated Images Debug:', {
        projectId: project.id,
        generatedImages: project.generated_images,
        imagesLength: project.generated_images?.length,
        images: images,
        responseImagesLength: images?.length
      })
      console.log('🔍 Project Metadata Debug:', {
        hasMetadata: !!project.metadata,
        hasCustomStylePreset: !!project.metadata?.custom_style_preset,
        customStylePreset: project.metadata?.custom_style_preset,
        style: project.style
      })
      setCurrentProject(project)
      setUserCredits(prev => prev - creditsUsed)

      // Note: Preset usage tracking happens when image is saved to gallery
      // (see save-to-gallery/route.ts which updates last_used_at)

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

      const errorTitle = error instanceof Error && error.name !== 'Error'
        ? error.name
        : 'Generation Failed'

      const errorMessage = error instanceof Error
        ? error.message
        : 'Unknown error occurred'

      showFeedback({
        type: 'error',
        title: errorTitle,
        message: errorMessage
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
        const newImageEntry = {
          url: editedImage,
          width: 1024,
          height: 1024,
          generated_at: new Date().toISOString(),
          type: 'edit'
        }
        
        const updatedProject = {
          ...currentProject,
          generated_images: [
            ...currentProject.generated_images,
            newImageEntry
          ]
        }
        
        console.log('🔍 Advanced Edit Debug - Before Update:', {
          currentProjectImages: currentProject.generated_images.length,
          editedImageUrl: editedImage,
          newImageEntry,
          updatedProjectImages: updatedProject.generated_images.length
        })
        
        setCurrentProject(updatedProject)
        setUserCredits(prev => prev - creditsUsed)
        
        // Update selected image to the newly edited image
        console.log('🔍 Setting selected image to:', editedImage)
        setSelectedImage(editedImage)
        
        // Force a re-render by updating the project state again
        setTimeout(() => {
          console.log('🔍 Advanced Edit Debug - After Update:', {
            currentProjectImages: currentProject.generated_images.length,
            selectedImage: editedImage
          })
        }, 100)
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
    cinematicParameters?: any
    includeTechnicalDetails?: boolean
    includeStyleReferences?: boolean
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
      const { taskId, creditsUsed, styledImageUrl } = responseData
      
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
      
      // Set the generated video URL for display (not saved to DB yet - user must click Save)
      if (finalVideoUrl) {
        setGeneratedVideoUrl(finalVideoUrl)
        setVideoGenerationStatus('completed')
        // Store metadata for saving later
        setGeneratedVideoMetadata({
          aspectRatio: params.aspectRatio,
          resolution: params.resolution,
          duration: params.duration,
          prompt: params.prompt,
          motionType: params.motionType,
          styledImageUrl: styledImageUrl || null
        })
        console.log('✅ Video URL ready for preview (not saved):', finalVideoUrl)
      }
      
      // Track preset usage if cinematic parameters were used (indicating a preset)
      if (params.cinematicParameters) {
        try {
          // For video generation, we need to check if there's a preset ID in the cinematic parameters
          // This would need to be passed from the video generation panel
          // For now, we'll skip preset tracking for video generation
          // TODO: Add preset ID to video generation parameters
        } catch (error) {
          console.error('Failed to track preset usage for video:', error)
          // Don't show error to user as this is not critical
        }
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
          const errorText = await response.text()
          console.error('Video status check failed:', {
            status: response.status,
            statusText: response.statusText,
            errorText,
            taskId,
            url: `/api/playground/video/${taskId}`
          })
          throw new Error(`Failed to check video status: ${response.status} ${response.statusText}`)
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

  // Helper function to safely extract URL from image object
  const getImageUrl = (imageUrl: any): string => {
    if (typeof imageUrl === 'string') return imageUrl
    if (typeof imageUrl === 'object' && imageUrl !== null) {
      return imageUrl.url || imageUrl.image_url || ''
    }
    return ''
  }

  const saveToGallery = async (imageUrl: any) => {
    console.log('🎯 saveToGallery function called with URL:', imageUrl)
    
    // Extract the actual URL string
    const actualImageUrl = getImageUrl(imageUrl)
    console.log('🎯 Extracted URL:', actualImageUrl)
    
    // Prevent multiple simultaneous calls
    if (savingImage === actualImageUrl) {
      console.log('⚠️ Save already in progress for this URL, skipping...')
      return
    }
    
    setSavingImage(actualImageUrl)
    try {
      console.log('🔄 Starting save process...')
      
      // Use current session token (no refresh to avoid interrupting function execution)
      console.log('🔄 Using current session token for save process...')
      
      // Check if this is a video URL (contains .mp4, .webm, .mov)
      // Note: cloudfront.net URLs can be images or videos, so we check file extension instead
      console.log('🔍 Starting media type detection...')
      const isVideo = actualImageUrl.includes('.mp4') || actualImageUrl.includes('.webm') || 
                     actualImageUrl.includes('.mov')
      
      console.log('🔍 Media type detection:', { 
        imageUrl, 
        actualImageUrl,
        isVideo, 
        hasMp4: actualImageUrl.includes('.mp4'),
        hasWebm: actualImageUrl.includes('.webm'),
        hasMov: actualImageUrl.includes('.mov')
      })
      
      console.log('🔍 Media type detection completed, proceeding to save logic...')
      
      if (isVideo) {
        console.log('🎬 Detected video - using video save endpoint')
        // Save video to gallery with actual metadata
        // Try to get metadata from current project or use defaults
        const projectMetadata = currentProject?.metadata || {}
        const videoMetadata = currentProject?.generated_images?.find(img => getImageUrl(img.url) === actualImageUrl) || {}
        
        // Generate meaningful title from prompt
        const promptTitle = currentProject?.prompt
          ? currentProject.prompt.length > 50
            ? currentProject.prompt.substring(0, 50) + '...'
            : currentProject.prompt
          : 'AI-generated video'

        const videoData = {
          videoUrl: actualImageUrl,
          title: promptTitle,
          description: `AI-generated video: ${currentProject?.prompt || 'AI-generated video'}`,
          tags: ['ai-generated', 'video'],
          duration: (videoMetadata as any)?.duration || 5,
          resolution: (videoMetadata as any)?.resolution || '480p',
          aspectRatio: currentProject?.aspect_ratio || '1:1', // Use current project's aspect ratio
          motionType: (videoMetadata as any)?.motion_type || 'subtle',
          prompt: currentProject?.prompt || 'AI-generated video',
          generationMetadata: {
            generated_at: new Date().toISOString(),
            credits_used: 8,
            duration: (videoMetadata as any)?.duration || 5,
            resolution: (videoMetadata as any)?.resolution || '480p',
            aspect_ratio: currentProject?.aspect_ratio || '1:1', // Use current project's aspect ratio
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

          // Handle duplicate videos gracefully
          if (response.status === 409 && errorData.error === 'duplicate') {
            showFeedback({
              type: 'info',
              title: 'Already Saved',
              message: errorData.message || 'This video is already saved in your gallery.'
            })
            return // Don't throw error for duplicates
          }

          console.error('Video save API error:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            videoUrl: actualImageUrl
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
          generated_at: currentProject.last_generated_at || new Date().toISOString(),
          // Add cinematic parameters and other missing metadata
          cinematic_parameters: (currentProject.metadata as any)?.cinematic_parameters || null,
          include_technical_details: (currentProject.metadata as any)?.include_technical_details || false,
          include_style_references: (currentProject.metadata as any)?.include_style_references || false,
          intensity: (currentProject.metadata as any)?.intensity || 1.0,
          provider: (currentProject.metadata as any)?.provider || 'seedream',
          // Preserve actual image dimensions
          actual_width: currentProject.generated_images?.[0]?.width || 1024,
          actual_height: currentProject.generated_images?.[0]?.height || 1024
        } : {}

        console.log('📤 Sending to save-to-gallery API:', {
          imageUrl: actualImageUrl.substring(0, 50) + '...',
          hasCustomStylePreset: !!generationMetadata?.custom_style_preset,
          presetId: generationMetadata?.custom_style_preset?.id,
          presetName: generationMetadata?.custom_style_preset?.name,
          style: generationMetadata?.style
        })

        const response = await fetch('/api/playground/save-to-gallery', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`
          },
          body: JSON.stringify({
            imageUrl: actualImageUrl,
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
          
          // Handle duplicate images gracefully
          if (response.status === 409 && errorData.error === 'duplicate') {
            showFeedback({
              type: 'info',
              title: 'Already Saved',
              message: errorData.message || 'This image is already saved in your gallery.'
            })
            return // Don't throw error for duplicates
          }
          
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
          motionType: 'camera_movement'
        })
      }

      showFeedback({
        type: 'success',
        title: 'Video Imported!',
        message: 'Past video generation has been imported and is ready for viewing.'
      })
    } else if (project.generated_images && project.generated_images.length > 0) {
      // For images, set selected image normally
      setSelectedImage(project.generated_images[0].url)

      showFeedback({
        type: 'success',
        title: 'Project Imported!',
        message: 'Past generation has been imported and is ready for editing.'
      })
    }
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

  // Check authentication
  if (!user || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Authentication Required</h1>
          <p className="text-muted-foreground mb-6">Please sign in to access the playground.</p>
          <Button onClick={() => window.location.href = '/auth/signin'}>
            Sign In
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActivePreset(null)
                  // Clear URL parameters
                  window.history.replaceState({}, '', '/playground')
                }}
              >
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
          onGenerate={generateImages}
          onEdit={performAdvancedEdit}
          onPerformBatchEdit={performBatchEdit}
          onGenerateVideo={generateVideo}
          onImportProject={handleImportProject}
          onSettingsUpdate={(settings) => {
            console.log('📐 Settings updated from import:', settings)
            // Settings are managed internally by TabbedPlaygroundLayout
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
            // Additional actions can be added here if needed
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
                    className="bg-background/20 hover:bg-background/30 text-foreground border-border/30"
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

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlaygroundContent />
    </Suspense>
  )
}
