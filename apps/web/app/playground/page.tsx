'use client'

import { useState, useEffect } from 'react'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useFeedback } from '../../components/feedback/FeedbackContext'
import BatchProgressTracker from '../components/playground/BatchProgressTracker'

// Import the new components
import ImageGenerationPanel from '../components/playground/ImageGenerationPanel'
import AdvancedEditingPanel from '../components/playground/AdvancedEditingPanel'
import SequentialGenerationPanel from '../components/playground/SequentialGenerationPanel'
import StyleVariationsPanel from '../components/playground/StyleVariationsPanel'
import BatchProcessingPanel from '../components/playground/BatchProcessingPanel'
import VideoGenerationPanel from '../components/playground/VideoGenerationPanel'
import ImageGalleryPanel from '../components/playground/ImageGalleryPanel'
import PastGenerationsPanel from '../components/playground/PastGenerationsPanel'

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

export default function PlaygroundPage() {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  
  // Core state
  const [currentProject, setCurrentProject] = useState<PlaygroundProject | null>(null)
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [userCredits, setUserCredits] = useState(0)
  const [savingImage, setSavingImage] = useState<string | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState('')
  
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
    aspectRatio: string
    resolution: string
    consistencyLevel: string
    customStylePreset?: any
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
          projectId: currentProject?.id,
          customStylePreset: params.customStylePreset
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const { project, images, creditsUsed } = await response.json()
      setCurrentProject(project)
      setUserCredits(prev => prev - creditsUsed)
      
      showFeedback({
        type: 'success',
        title: 'Images Generated!',
        message: `Successfully generated ${images.length} image(s) using ${creditsUsed} credits.`
      })
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
  }) => {
    setLoading(true)
    try {
      const response = await fetch('/api/playground/advanced-edit', {
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
        throw new Error(errorData.error || 'Failed to edit image')
      }

      const { editedImage, creditsUsed } = await response.json()
      
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
        setCurrentProject(updatedProject)
        setUserCredits(prev => prev - creditsUsed)
      }
      
      showFeedback({
        type: 'success',
        title: 'Edit Completed!',
        message: `Successfully completed edit using ${creditsUsed} credits.`
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
  }) => {
    setLoading(true)
    try {
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

      const { videoUrl, creditsUsed } = await response.json()
      
      // Add video to project
      if (currentProject) {
        const updatedProject = {
          ...currentProject,
          generated_images: [
            ...currentProject.generated_images,
            {
              url: videoUrl,
              width: params.resolution === '720p' ? 1280 : 854,
              height: params.resolution === '720p' ? 720 : 480,
              generated_at: new Date().toISOString(),
              type: 'video'
            }
          ]
        }
        setCurrentProject(updatedProject)
        setUserCredits(prev => prev - creditsUsed)
      }
      
      showFeedback({
        type: 'success',
        title: 'Video Generated!',
        message: `Successfully generated video using ${creditsUsed} credits.`
      })
    } catch (error) {
      console.error('Video generation failed:', error)
      showFeedback({
        type: 'error',
        title: 'Video Generation Failed',
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setLoading(false)
    }
  }

  const saveToGallery = async (imageUrl: string) => {
    setSavingImage(imageUrl)
    try {
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
          projectId: currentProject?.id
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Generation & Editing */}
          <div className="lg:col-span-1 space-y-6">
            <ImageGenerationPanel
              onGenerate={generateImages}
              loading={loading}
              userCredits={userCredits}
            />
            
            <AdvancedEditingPanel
              onEdit={performAdvancedEdit}
              loading={loading}
              selectedImage={selectedImage}
            />
          </div>

          {/* Middle Column - Advanced Features */}
          <div className="lg:col-span-1 space-y-6">
            <SequentialGenerationPanel
              onGenerateSequential={generateSequentialImages}
              onGenerateSequentialEdits={generateSequentialEdits}
              loading={loading}
              selectedImage={selectedImage}
              currentPrompt={currentPrompt}
            />
            
            <StyleVariationsPanel
              onGenerateStyleVariations={generateStyleVariations}
              loading={loading}
              selectedImage={selectedImage}
              sessionToken={session?.access_token}
            />
            
            <BatchProcessingPanel
              onPerformBatchEdit={performBatchEdit}
              loading={loading}
            />
            
            <VideoGenerationPanel
              onGenerateVideo={generateVideo}
              loading={loading}
              selectedImage={selectedImage}
            />
            
            <PastGenerationsPanel
              onImportProject={handleImportProject}
            />
          </div>

          {/* Right Column - Image Gallery */}
          <div className="lg:col-span-1">
            <ImageGalleryPanel
              images={currentProject?.generated_images || []}
              selectedImage={selectedImage}
              onSelectImage={setSelectedImage}
              onSaveToGallery={saveToGallery}
              savingImage={savingImage}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
