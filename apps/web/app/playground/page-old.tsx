'use client'

import { useState, useEffect } from 'react'
import { Wand2, Download, Save, Sparkles, Settings, Palette } from 'lucide-react'
import { useAuth } from '../../lib/auth-context'
import { useFeedback } from '../../components/feedback/FeedbackContext'
import BatchProgressTracker from '../components/playground/BatchProgressTracker'
import StylePresetManager from '../components/playground/StylePresetManager'

interface PlaygroundProject {
  id: string
  title: string
  prompt: string
  generated_images: Array<{
    url: string
    width: number
    height: number
    generated_at: string
  }>
  selected_image_url?: string
  status: string
  credits_used: number
}

export default function PlaygroundPage() {
  const { user, session } = useAuth()
  const { showFeedback } = useFeedback()
  const [currentProject, setCurrentProject] = useState<PlaygroundProject | null>(null)
  const [prompt, setPrompt] = useState('')
  const [style, setStyle] = useState('realistic')
  const [aspectRatio, setAspectRatio] = useState('1:1')
  const [resolution, setResolution] = useState('1024*1024')
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [editPrompt, setEditPrompt] = useState('')
  const [editStrength, setEditStrength] = useState(0.8)
  const [userCredits, setUserCredits] = useState(0)
  const [savingImage, setSavingImage] = useState<string | null>(null)
  
  // Advanced editing states
  const [editType, setEditType] = useState('enhance')
  const [numSequentialImages, setNumSequentialImages] = useState(4)
  const [consistencyLevel, setConsistencyLevel] = useState('high')
  const [videoDuration, setVideoDuration] = useState(3)
  const [videoResolution, setVideoResolution] = useState('480p')
  const [motionType, setMotionType] = useState('subtle')
  
  // Advanced features states
  const [selectedStyles, setSelectedStyles] = useState(['photorealistic', 'artistic'])
  const [batchImages, setBatchImages] = useState<string[]>([])
  
  // Batch job tracking states
  const [activeBatchJobId, setActiveBatchJobId] = useState<string | null>(null)
  const [batchResults, setBatchResults] = useState<any[]>([])
  
  // Style preset states
  const [selectedStylePreset, setSelectedStylePreset] = useState<any>(null)

  useEffect(() => {
    fetchUserCredits()
  }, [user])

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

  const fetchUserCredits = async () => {
    try {
      const response = await fetch('/api/user/credits')
      const data = await response.json()
      setUserCredits(data.current_balance)
    } catch (error) {
      console.error('Failed to fetch credits:', error)
    }
  }

  const generateImages = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/playground/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          prompt,
          style,
          aspectRatio,
          resolution,
          projectId: currentProject?.id
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate images')
      }

      const { project, images } = await response.json()
      setCurrentProject(project)
      setUserCredits(prev => prev - 2)
      
      // Show success message
      showFeedback({
        type: 'success',
        title: 'Images Generated!',
        message: `Successfully generated ${images.length} image(s) using 2 credits.`
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
          title: prompt.substring(0, 50),
          description: `Generated from: ${prompt}`,
          tags: ['ai-generated', style],
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
        message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
    } finally {
      setSavingImage(null)
    }
  }

  // Advanced editing functions
  const performAdvancedEdit = async () => {
    if (!selectedImage || !editPrompt.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/playground/advanced-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          projectId: currentProject?.id,
          imageUrl: selectedImage,
          editType,
          editPrompt,
          strength: editStrength
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
        title: `${getEditButtonText(editType)} Completed!`,
        message: `Successfully completed ${editType} using ${creditsUsed} credits.`
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

  const generateSequentialImages = async () => {
    if (!prompt.trim()) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/playground/sequential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          prompt,
          numImages: numSequentialImages,
          style,
          resolution,
          projectId: currentProject?.id,
          consistencyLevel
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

  const generateVideo = async () => {
    if (!selectedImage) return
    
    setLoading(true)
    try {
      const response = await fetch('/api/playground/video', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          imageUrl: selectedImage,
          duration: videoDuration,
          resolution: videoResolution,
          motionType,
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
              width: videoResolution === '720p' ? 1280 : 854,
              height: videoResolution === '720p' ? 720 : 480,
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

  const generateSequentialEdits = async () => {
    if (!selectedImage) {
      showFeedback({
        type: 'warning',
        title: 'No Image Selected',
        message: 'Please select an image to edit first.'
      })
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/playground/edit-sequential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          prompt,
          images: [selectedImage],
          numImages: numSequentialImages,
          resolution,
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

  const generateStyleVariations = async () => {
    if (!selectedImage) {
      showFeedback({
        type: 'warning',
        title: 'No Image Selected',
        message: 'Please select an image to generate style variations first.'
      })
      return
    }
    
    // Use selected style preset if available, otherwise use selected styles
    const stylesToUse = selectedStylePreset ? [selectedStylePreset.style_type] : selectedStyles
    
    if (stylesToUse.length === 0) {
      showFeedback({
        type: 'warning',
        title: 'No Styles Selected',
        message: 'Please select at least one style or style preset.'
      })
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/playground/style-variations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          imageUrl: selectedImage,
          styles: stylesToUse,
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

  const performBatchEdit = async () => {
    if (batchImages.length === 0) {
      showFeedback({
        type: 'warning',
        title: 'No Images Added',
        message: 'Please add images for batch editing first.'
      })
      return
    }
    
    setLoading(true)
    try {
      const response = await fetch('/api/playground/batch-edit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          prompt,
          images: batchImages,
          editType,
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

  // Helper functions
  const getCreditsForEditType = (type: string) => {
    const creditMap: { [key: string]: number } = {
      'inpaint': 3,
      'outpaint': 3,
      'style_transfer': 2,
      'face_swap': 4,
      'object_removal': 3,
      'background_removal': 2,
      'upscale': 1,
      'color_adjustment': 2,
      'enhance': 2
    }
    return creditMap[type] || 2
  }

  const getEditPromptPlaceholder = (type: string) => {
    const placeholders: { [key: string]: string } = {
      'inpaint': 'Describe what you want to add or remove...',
      'outpaint': 'Describe how to extend the image...',
      'style_transfer': 'Choose a style (Baroque, Cyberpunk, etc.)...',
      'face_swap': 'Upload target face image...',
      'object_removal': 'Select objects to remove...',
      'background_removal': 'Remove background automatically',
      'upscale': 'Enhance image resolution',
      'color_adjustment': 'Describe color changes...',
      'enhance': 'Describe how to enhance the image...'
    }
    return placeholders[type] || 'Describe how you want to modify the image...'
  }

  const getEditButtonText = (type: string) => {
    const texts: { [key: string]: string } = {
      'inpaint': 'Inpaint',
      'outpaint': 'Outpaint',
      'style_transfer': 'Style Transfer',
      'face_swap': 'Face Swap',
      'object_removal': 'Remove Objects',
      'background_removal': 'Remove Background',
      'upscale': 'Upscale',
      'color_adjustment': 'Adjust Colors',
      'enhance': 'Enhance'
    }
    return texts[type] || 'Edit'
  }

  return (
    <div className="min-h-screen bg-muted-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-muted-foreground-900 mb-2">Preset Playground</h1>
          <p className="text-muted-foreground-600">Create and edit AI-generated images with Seedream</p>
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground-600">
              <Sparkles className="h-4 w-4 text-primary-500" />
              <span>Credits: {userCredits}</span>
            </div>
            <div className="text-sm text-muted-foreground-500">
              Generation: 2 credits | Basic Edit: 2 credits | Advanced Edit: 1-4 credits | Sequential: 3/image | Style Variations: 2/style | Batch: 3/image | Video: 8-10 credits
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Generation Panel */}
          <div className="lg:col-span-1">
            <div className="bg-background rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Wand2 className="h-5 w-5 mr-2 text-primary-500" />
                Generate Images
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground-700 mb-1">
                    Prompt
                  </label>
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-primary"
                    placeholder="Describe the image you want to create..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-1">
                      Style
                    </label>
                    <select
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-primary"
                    >
                      <option value="realistic">Realistic</option>
                      <option value="artistic">Artistic</option>
                      <option value="cartoon">Cartoon</option>
                      <option value="anime">Anime</option>
                      <option value="fantasy">Fantasy</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-muted-foreground-700 mb-1">
                      Resolution
                    </label>
                    <select
                      value={resolution}
                      onChange={(e) => setResolution(e.target.value)}
                      className="w-full px-3 py-2 border border-border-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-primary"
                    >
                      <option value="1024*1024">1024*1024</option>
                      <option value="2048*2048">2048*2048</option>
                      <option value="1024*2048">1024*2048</option>
                      <option value="2048*1024">2048*1024</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={generateImages}
                  disabled={loading || !prompt.trim() || userCredits < 2}
                  className="w-full bg-primary-600 text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="h-4 w-4 mr-2" />
                      Generate (2 credits)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Features */}
          <div className="lg:col-span-1">
            <div className="bg-background rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Sparkles className="h-5 w-5 mr-2 text-primary-500" />
                Advanced Features
              </h2>
              
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
              
              <div className="space-y-4">
                {/* Sequential Generation */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Sequential Generation</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-muted-foreground-600 mb-1">
                        Number of Images: {numSequentialImages}
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="8"
                        value={numSequentialImages}
                        onChange={(e) => setNumSequentialImages(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <button
                      onClick={generateSequentialImages}
                      disabled={loading || !prompt.trim()}
                      className="w-full bg-primary-600 text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate Sequential ({numSequentialImages * 3} credits)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sequential Editing */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Sequential Editing</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-muted-foreground-600 mb-1">
                        Number of Variations: {numSequentialImages}
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="6"
                        value={numSequentialImages}
                        onChange={(e) => setNumSequentialImages(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <button
                      onClick={generateSequentialEdits}
                      disabled={loading || !selectedImage}
                      className="w-full bg-primary-600 text-primary-foreground py-2 px-4 rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                          Editing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Edit Sequential ({numSequentialImages * 4} credits)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Advanced Editing */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Advanced Editing</h3>
                  <div className="space-y-2">
                    <select
                      value={editType}
                      onChange={(e) => setEditType(e.target.value)}
                      className="w-full px-3 py-2 border border-border-300 rounded-md text-sm"
                    >
                      <option value="enhance">Enhance (2 credits)</option>
                      <option value="inpaint">Inpaint (3 credits)</option>
                      <option value="outpaint">Outpaint (3 credits)</option>
                      <option value="style_transfer">Style Transfer (2 credits)</option>
                      <option value="face_swap">Face Swap (4 credits)</option>
                      <option value="object_removal">Remove Objects (3 credits)</option>
                      <option value="background_removal">Remove Background (2 credits)</option>
                      <option value="upscale">Upscale (1 credit)</option>
                      <option value="color_adjustment">Adjust Colors (2 credits)</option>
                    </select>
                    <button
                      onClick={performAdvancedEdit}
                      disabled={loading || !selectedImage}
                      className="w-full bg-primary-600 text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                          Editing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          {getEditButtonText(editType)} ({getCreditsForEditType(editType)} credits)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Video Generation */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Video Generation</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-muted-foreground-600 mb-1">
                        Duration: {videoDuration}s
                      </label>
                      <input
                        type="range"
                        min="2"
                        max="5"
                        value={videoDuration}
                        onChange={(e) => setVideoDuration(parseInt(e.target.value))}
                        className="w-full"
                      />
                    </div>
                    <button
                      onClick={generateVideo}
                      disabled={loading || !selectedImage}
                      className="w-full bg-destructive-600 text-primary-foreground py-2 px-4 rounded-md hover:bg-destructive-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate Video (8-10 credits)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Style Preset Manager */}
                <div>
                  <StylePresetManager
                    onSelectPreset={setSelectedStylePreset}
                    selectedPreset={selectedStylePreset}
                  />
                </div>

                {/* Style Variations */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Style Variations</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-muted-foreground-600 mb-1">
                        Select Styles:
                      </label>
                      <div className="grid grid-cols-2 gap-1 text-xs">
                        {['photorealistic', 'artistic', 'cartoon', 'vintage', 'cyberpunk', 'watercolor'].map(style => (
                          <label key={style} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedStyles.includes(style)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStyles([...selectedStyles, style])
                                } else {
                                  setSelectedStyles(selectedStyles.filter(s => s !== style))
                                }
                              }}
                              className="mr-1"
                            />
                            {style}
                          </label>
                        ))}
                      </div>
                    </div>
                    <button
                      onClick={generateStyleVariations}
                      disabled={loading || !selectedImage || (selectedStyles.length === 0 && !selectedStylePreset)}
                      className="w-full bg-primary-600 text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Generate Styles ({(selectedStylePreset ? 1 : selectedStyles.length) * 2} credits)
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Batch Processing */}
                <div>
                  <h3 className="text-lg font-medium mb-2">Batch Processing</h3>
                  <div className="space-y-2">
                    <div>
                      <label className="block text-sm text-muted-foreground-600 mb-1">
                        Images to Process: {batchImages.length}/10
                      </label>
                      <div className="space-y-1">
                        {batchImages.map((url, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={url}
                              onChange={(e) => {
                                const newUrls = [...batchImages]
                                newUrls[index] = e.target.value
                                setBatchImages(newUrls)
                              }}
                              placeholder={`Image URL ${index + 1}`}
                              className="flex-1 px-2 py-1 text-xs border border-border-300 rounded"
                            />
                            <button
                              onClick={() => setBatchImages(batchImages.filter((_, i) => i !== index))}
                              className="text-destructive-600 hover:bg-destructive-50 px-1 py-1 rounded text-xs"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        {batchImages.length < 10 && (
                          <button
                            onClick={() => setBatchImages([...batchImages, ''])}
                            className="text-primary-600 hover:bg-primary-50 px-2 py-1 rounded text-xs"
                          >
                            + Add Image
                          </button>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={performBatchEdit}
                      disabled={loading || batchImages.length === 0}
                      className="w-full bg-primary-600 text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-4 w-4 mr-2" />
                          Batch Edit ({batchImages.length * 3} credits)
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Generated Images */}
          <div className="lg:col-span-2">
            <div className="bg-background rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Generated Images</h2>
              
              {currentProject?.generated_images && currentProject.generated_images.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {currentProject.generated_images.map((image, index) => (
                    <div 
                      key={index}
                      className={`relative group cursor-pointer rounded-lg overflow-hidden ${
                        selectedImage === image.url ? 'ring-2 ring-primary-primary' : ''
                      }`}
                      onClick={() => setSelectedImage(image.url)}
                    >
                      <img
                        src={image.url}
                        alt={`Generated image ${index + 1}`}
                        className="w-full h-64 object-cover"
                      />
                      
                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              saveToGallery(image.url)
                            }}
                            disabled={savingImage === image.url}
                            className="bg-background text-muted-foreground-800 px-3 py-1 rounded-md text-sm hover:bg-muted-100 flex items-center disabled:opacity-50"
                          >
                            {savingImage === image.url ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border-800 mr-1"></div>
                                Saving...
                              </>
                            ) : (
                              <>
                                <Save className="h-4 w-4 mr-1" />
                                Save
                              </>
                            )}
                          </button>
                          <a
                            href={image.url}
                            download
                            onClick={(e) => e.stopPropagation()}
                            className="bg-background text-muted-foreground-800 px-3 py-1 rounded-md text-sm hover:bg-muted-100 flex items-center"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground-500">
                  <Wand2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground-300" />
                  <p>No images generated yet. Create your first image!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

