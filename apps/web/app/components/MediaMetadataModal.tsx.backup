'use client'

import React, { useState } from 'react'
import { X, Copy, ExternalLink, Calendar, CreditCard, Image as ImageIcon, Film, Palette, Camera, Lightbulb, Save, Loader2, ToggleLeft, ToggleRight, Eye, Edit, Check } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/lib/auth-context'

interface MediaMetadataModalProps {
  isOpen: boolean
  onClose: () => void
  media: {
    id: string
    type: string
    url: string
    width?: number
    height?: number
    metadata?: any
    cinematic_metadata?: any
  }
  showcase?: {
    id: string
    title: string
    caption?: string
    creator: {
      display_name: string
      handle: string
      user_id?: string
    }
    creator_user_id?: string
  }
}

export default function MediaMetadataModal({ isOpen, onClose, media, showcase }: MediaMetadataModalProps) {
  const { showSuccess, showError } = useToast()
  const { user, session } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'prompt' | 'cinematic' | 'technical'>('prompt')
  const [showPresetDialog, setShowPresetDialog] = useState(false)
  const [presetForm, setPresetForm] = useState({
    name: '',
    description: '',
    category: 'style'
  })
  const [isCreatingPreset, setIsCreatingPreset] = useState(false)
  const [showOriginalImage, setShowOriginalImage] = useState(false)

  // Image metadata editing states
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedDescription, setEditedDescription] = useState('')
  const [isSavingMetadata, setIsSavingMetadata] = useState(false)

  // Initialize edited values when modal opens or media changes
  React.useEffect(() => {
    if (isOpen && media) {
      setEditedTitle((media as any).title || showcase?.caption || '')
      setEditedDescription((media as any).description || '')
      setIsEditingMetadata(false)
    }
  }, [isOpen, media, showcase])

  // Check if user can edit (owns the showcase)
  const canEdit = user && (showcase?.creator?.user_id === user.id || showcase?.creator_user_id === (user as any).profile_id)

  if (!isOpen) return null

  const generationMetadata = media.metadata?.generation_metadata
  const cinematicParams = generationMetadata?.cinematic_parameters
  const rawPrompt = generationMetadata?.prompt
  const rawEnhancedPrompt = generationMetadata?.enhanced_prompt
  const stylePrompt = generationMetadata?.style_prompt

  // Clean up duplicate prompts and replace {subject} with actual subject used
  // Returns both cleaned text and the subject for highlighting
  const cleanPromptWithSubject = (text: string): { cleanedText: string; subject: string | null } => {
    if (!text) return { cleanedText: text, subject: null }

    // Extract the actual subject from the prompt if it exists
    let actualSubject = generationMetadata?.user_subject || null

    // Check if text has duplicate pattern by looking for the preset template repeated
    const parts = text.split(',').map(p => p.trim())
    if (parts.length >= 6) {
      // Find the midpoint and check if the pattern repeats
      const midpoint = Math.floor(parts.length / 2)
      const firstHalf = parts.slice(0, midpoint)
      const secondHalf = parts.slice(midpoint)

      // Check if second half is very similar to first half (accounting for subject replacement)
      let duplicateCount = 0
      for (let i = 0; i < Math.min(firstHalf.length, secondHalf.length); i++) {
        if (firstHalf[i] === secondHalf[i] || secondHalf[i].includes('{subject}')) {
          duplicateCount++
        }

        // Extract actual subject by comparing first and second half
        if (!actualSubject && firstHalf[i] !== secondHalf[i] && secondHalf[i].includes('{subject}')) {
          // The difference in first half is likely the actual subject used
          const firstPart = firstHalf[i].toLowerCase()
          const secondPart = secondHalf[i].toLowerCase().replace('{subject}', '').trim()

          // Extract the subject by finding what's different
          const words = firstPart.split(' ')
          const templateWords = secondPart.split(' ')
          const subjectWords = words.filter(w => !templateWords.includes(w))
          if (subjectWords.length > 0 && subjectWords.length < 10) {
            actualSubject = subjectWords.join(' ')
          }
        }
      }

      // If more than 70% match, it's a duplicate - use first half only
      if (duplicateCount / Math.min(firstHalf.length, secondHalf.length) > 0.7) {
        text = firstHalf.join(', ')
      }
    }

    // Determine the subject to use for replacement
    const subjectReplacement = actualSubject ||
                               (generationMetadata?.generation_mode === 'image-to-image' ? 'this image' : '')

    // Replace {subject} placeholder with actual subject, or remove it if no subject found
    if (subjectReplacement) {
      const cleanedText = text.replace(/\{subject\}/g, subjectReplacement).replace(/,\s*,/g, ',').trim()
      return { cleanedText, subject: subjectReplacement }
    } else {
      // Remove {subject} and clean up resulting empty parts
      const cleanedText = text.replace(/\{subject\}/g, '').replace(/\s+of\s*,/g, ',').replace(/,\s*,/g, ',').trim()
      return { cleanedText, subject: null }
    }
  }

  const promptResult = cleanPromptWithSubject(rawPrompt)
  const enhancedPromptResult = cleanPromptWithSubject(rawEnhancedPrompt)

  const prompt = promptResult.cleanedText
  const enhancedPrompt = enhancedPromptResult.cleanedText
  const highlightedSubject = enhancedPromptResult.subject || promptResult.subject

  // Helper to highlight the subject in green and italic
  const highlightSubjectInText = (text: string) => {
    if (!highlightedSubject) return text

    // Escape special regex characters in the subject
    const escapedSubject = highlightedSubject.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`\\b${escapedSubject}\\b`, 'gi')

    return text.replace(regex, `<span class="text-green-500 italic font-medium">${highlightedSubject}</span>`)
  }

  // Extract preset information
  const customStylePreset = generationMetadata?.custom_style_preset
  const presetStyle = generationMetadata?.style_applied || generationMetadata?.style || 'photorealistic'
  
  // Get preset name - use style if no custom preset name
  const presetName = customStylePreset?.name || 
    (presetStyle === 'baroque' ? 'Baroque' :
     presetStyle === 'renaissance' ? 'Renaissance' :
     presetStyle === 'impressionist' ? 'Impressionist' :
     presetStyle === 'artistic' ? 'Artistic' :
     presetStyle === 'photorealistic' ? 'Photorealistic' :
     presetStyle === 'watercolor' ? 'Watercolor' :
     presetStyle === 'cyberpunk' ? 'Cyberpunk' :
     presetStyle === 'vintage' ? 'Vintage' :
     presetStyle === 'cartoon' ? 'Cartoon' :
     presetStyle.charAt(0).toUpperCase() + presetStyle.slice(1))
  
  // Get style badge emoji
  const getStyleBadge = (style: string) => {
    switch (style.toLowerCase()) {
      case 'photorealistic': return '📸 Photorealistic'
      case 'artistic': return '🎨 Artistic'
      case 'cartoon': return '🎭 Cartoon'
      case 'vintage': return '📻 Vintage'
      case 'cyberpunk': return '🤖 Cyberpunk'
      case 'watercolor': return '🎨 Watercolor'
      case 'impressionist': return '🎨 Impressionist'
      case 'renaissance': return '🏛️ Renaissance'
      case 'baroque': return '🎭 Baroque'
      case 'art_deco': return '✨ Art Deco'
      case 'pop_art': return '🎪 Pop Art'
      case 'digital_art': return '💻 Digital Art'
      case 'concept_art': return '🎮 Concept Art'
      case 'fantasy': return '🧙 Fantasy'
      case 'sci_fi': return '🚀 Sci-Fi'
      case 'maximalist': return '🌈 Maximalist'
      case 'surreal': return '🌌 Surreal'
      case 'minimalist': return '⚪ Minimalist'
      case 'abstract': return '🎭 Abstract'
      case 'sketch': return '✏️ Sketch'
      case 'oil_painting': return '🖼️ Oil Painting'
      default: return `🎨 ${style.charAt(0).toUpperCase() + style.slice(1)}`
    }
  }
  
  // Get subject from stored userSubject (what user typed in "What are you creating?" or "image" for image-to-image)
  // Fallback to extracting from prompt if userSubject is not available
  const getSubject = () => {
    // First try to get from stored userSubject
    if (generationMetadata?.user_subject) {
      // For image-to-image, show "image" as the subject
      if (generationMetadata.user_subject === 'image') {
        return 'image'
      }
      return generationMetadata.user_subject
    }
    
    // Fallback: extract from prompt (for older generations)
    const extractSubject = (promptText: string) => {
      // Look for patterns like "of [subject]" or "with [subject]"
      const patterns = [
        /of ([^,]+?)(?:\s+with|\s+in|\s+and|,|$)/i,
        /with ([^,]+?)(?:\s+and|\s+in|,|$)/i,
        /featuring ([^,]+?)(?:\s+and|\s+in|,|$)/i
      ]
      
      for (const pattern of patterns) {
        const match = promptText.match(pattern)
        if (match && match[1]) {
          return match[1].trim()
        }
      }
      return null
    }
    
    return extractSubject(prompt || '')
  }
  
  const subject = getSubject()
  
  // Function to highlight prompt with different colors
  const highlightPrompt = (promptText: string) => {
    if (!promptText) return promptText
    
    let highlightedText = promptText
    
    // Highlight subject if found
    if (subject) {
      const subjectRegex = new RegExp(`\\b${subject}\\b`, 'gi')
      highlightedText = highlightedText.replace(subjectRegex, `<span class="text-primary font-semibold bg-primary/10 px-1 rounded">${subject}</span>`)
    }
    
    // Highlight cinematic parameters if they exist
    if (cinematicParams) {
      const cinematicTerms = [
        'wide-angle', 'telephoto', 'medium-shot', 'close-up', 'over-the-shoulder',
        'handheld', 'tripod', 'gimbal', 'natural-light', 'golden-hour', 'blue-hour',
        'dramatic', 'soft', 'harsh', 'rim-light', 'backlight', 'side-light',
        'shallow-focus', 'deep-focus', 'bokeh', 'sharp', 'blurred',
        'cinematic', 'film', 'movie', 'cinema', 'motion-picture'
      ]
      
      cinematicTerms.forEach(term => {
        const regex = new RegExp(`\\b${term}\\b`, 'gi')
        highlightedText = highlightedText.replace(regex, `<span class="text-primary-400 font-medium bg-primary-400/10 px-1 rounded">${term}</span>`)
      })
    }
    
    return highlightedText
  }

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text)
      showSuccess(`${label} copied to clipboard!`)
    } catch (error) {
      showError('Failed to copy to clipboard')
    }
  }

  const handleViewPreset = async () => {
    try {
      // First try to get preset ID from custom_style_preset
      const presetId = customStylePreset?.id
      
      if (presetId) {
        // Direct navigation to preset page
        router.push(`/presets/${presetId}`)
        onClose()
        return
      }
      
      // If no preset ID, try to find preset by name/style
      const response = await fetch('/api/presets')
      if (response.ok) {
        const data = await response.json()
        const presets = data.presets || []
        
        // Find preset by name or style
        const foundPreset = presets.find((p: any) => 
          p.name?.toLowerCase() === presetName.toLowerCase() ||
          p.style_settings?.style === presetStyle
        )
        
        if (foundPreset) {
          router.push(`/presets/${foundPreset.id}`)
          onClose()
        } else {
          showError(`Preset "${presetName}" not found`)
        }
      } else {
        showError('Failed to fetch presets')
      }
    } catch (error) {
      console.error('Error navigating to preset:', error)
      showError('Failed to navigate to preset')
    }
  }

  // Function to detect base preset and extract components
  const detectPresetComponents = () => {
        const components = {
          basePreset: null as any,
          detectedSubject: subject === 'image' ? 'image' : subject,
          cinematicParams: cinematicParams,
          hasCinematic: !!cinematicParams,
          isFromPreset: !!customStylePreset
        }

    // Try to find the base preset
    if (customStylePreset?.id) {
      components.basePreset = customStylePreset
    } else {
      // Try to detect from style
      const stylePresets = {
        'baroque': { name: 'Baroque', id: '2e3f6bf7-2a59-442b-9b8e-40a876e6c453' },
        'renaissance': { name: 'Renaissance', id: '8a0bc668-7080-4123-8f24-a2a0bbd36772' },
        'impressionist': { name: 'Impressionist', id: 'bb274a54-7ba1-44d4-8a6f-1481e79ac553' },
        'artistic': { name: 'Artistic', id: null },
        'photorealistic': { name: 'Photorealistic', id: null },
        'watercolor': { name: 'Artistic Watercolor', id: '539932b7-3802-4b10-a542-848c8d31da59' }
      }
      
      const detectedPreset = stylePresets[presetStyle as keyof typeof stylePresets]
      if (detectedPreset) {
        components.basePreset = detectedPreset
      }
    }

    return components
  }

  const handleSaveAsPreset = () => {
    if (!user || !session?.access_token) {
      showError('Please sign in to save presets')
      return
    }
    
    const components = detectPresetComponents()
    
          // Generate intelligent preset name
          let presetName = showcase?.caption || (media as any).title || 'Untitled Treatment'
          if (components.detectedSubject && components.basePreset) {
            if (components.detectedSubject === 'image') {
              presetName = `${components.basePreset.name} - Image Style`
            } else {
              presetName = `${components.basePreset.name} - ${components.detectedSubject.charAt(0).toUpperCase() + components.detectedSubject.slice(1)}`
            }
          } else if (components.detectedSubject) {
            if (components.detectedSubject === 'image') {
              presetName = `Custom Image Style`
            } else {
              presetName = `Custom ${components.detectedSubject.charAt(0).toUpperCase() + components.detectedSubject.slice(1)} Style`
            }
          }
    
    // Generate intelligent description
    let description = `Preset created from ${showcase ? `"${showcase.caption}"` : 'media treatment'} by @${showcase?.creator.handle || 'unknown'}`
    if (components.basePreset) {
      description = `Based on ${components.basePreset.name} preset`
      if (components.detectedSubject) {
        if (components.detectedSubject === 'image') {
          description += ` for image-to-image generation`
        } else {
          description += ` with "${components.detectedSubject}" as subject`
        }
      }
      if (components.hasCinematic) {
        description += ` and cinematic parameters`
      }
    }
    
    setPresetForm(prev => ({
      ...prev,
      name: presetName,
      description: description
    }))
    setShowPresetDialog(true)
  }

  const handleCreatePreset = async () => {
    if (!presetForm.name.trim()) {
      showError('Please enter a preset name')
      return
    }

    if (!user || !session?.access_token) {
      showError('Please sign in to save presets')
      return
    }

    setIsCreatingPreset(true)

    try {
      // Extract data from media metadata using the same structure as PresetSelector
      const promptTemplate = enhancedPrompt || prompt || ''
      
      // Create comprehensive preset data matching PresetSelector format
      const presetData = {
        name: presetForm.name.trim(),
        description: presetForm.description.trim(),
        category: presetForm.category,
        prompt_template: promptTemplate,
        style_settings: {
          cinematic: !!cinematicParams,
          parameters: cinematicParams || {}
        },
        technical_settings: {
          resolution: generationMetadata?.resolution || '1024x1024',
          aspect_ratio: generationMetadata?.aspect_ratio || '1:1',
          provider: generationMetadata?.provider || 'nanobanana'
        },
        cinematic_settings: cinematicParams ? {
          enableCinematicMode: true,
          cinematicParameters: cinematicParams,
          enhancedPrompt: !!enhancedPrompt,
          includeTechnicalDetails: true,
          includeStyleReferences: true,
          generationMode: 'text-to-image',
          selectedProvider: generationMetadata?.provider || 'nanobanana'
        } : undefined,
        ai_metadata: {
          cinematic_settings: cinematicParams ? {
            enableCinematicMode: true,
            cinematicParameters: cinematicParams,
            enhancedPrompt: !!enhancedPrompt,
            includeTechnicalDetails: true,
            includeStyleReferences: true,
            generationMode: 'text-to-image',
            selectedProvider: generationMetadata?.provider || 'nanobanana'
          } : undefined,
          source: 'showcase',
          source_showcase_id: showcase?.id,
          source_media_id: media.id,
          original_prompts: {
            main: prompt,
            enhanced: enhancedPrompt,
            style: stylePrompt
          }
        },
        is_public: false // Keep private by default
      }

      const response = await fetch('/api/presets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(presetData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create preset')
      }

      const result = await response.json()
      showSuccess('Preset saved successfully!', `"${presetForm.name}" has been added to your presets.`)
      
      // Reset form and close dialog
      setPresetForm({ name: '', description: '', category: 'style' })
      setShowPresetDialog(false)

    } catch (error: any) {
      console.error('Error creating preset:', error)
      showError('Failed to save preset', error.message || 'Please try again.')
    } finally {
      setIsCreatingPreset(false)
    }
  }

  const handleSaveMetadata = async () => {
    if (!media.id) {
      showError('Cannot update: Media ID not found')
      return
    }

    setIsSavingMetadata(true)

    try {
      console.log('💾 Saving metadata:', { mediaId: media.id, title: editedTitle, description: editedDescription })

      const response = await fetch(`/api/showcase-media/${media.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          title: editedTitle.trim(),
          description: editedDescription.trim()
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update metadata')
      }

      const result = await response.json()
      console.log('✅ Metadata saved successfully:', result)

      showSuccess('Image metadata updated successfully!')
      setIsEditingMetadata(false)

      // Update the media object to reflect changes immediately
      if ((media as any).title !== undefined) {
        (media as any).title = editedTitle.trim()
      }
      if ((media as any).description !== undefined) {
        (media as any).description = editedDescription.trim()
      }

    } catch (error: any) {
      console.error('❌ Error saving metadata:', error)
      showError('Failed to save changes', error.message)
    } finally {
      setIsSavingMetadata(false)
    }
  }

  const handleCancelEdit = () => {
    // Reset to original values
    setEditedTitle((media as any).title || showcase?.caption || '')
    setEditedDescription((media as any).description || '')
    setIsEditingMetadata(false)
  }

  const formatLabel = (value: string) => {
    return value.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getIconForParameter = (param: string) => {
    switch (param) {
      case 'cameraAngle':
      case 'lensType':
      case 'shotSize':
      case 'cameraMovement':
        return <Camera className="h-4 w-4" />
      case 'lightingStyle':
        return <Lightbulb className="h-4 w-4" />
      case 'colorPalette':
        return <Palette className="h-4 w-4" />
      case 'directorStyle':
      case 'eraEmulation':
        return <Film className="h-4 w-4" />
      default:
        return <ImageIcon className="h-4 w-4" />
    }
  }

  const getColorForParameter = (param: string) => {
    switch (param) {
      case 'cameraAngle':
      case 'lensType':
      case 'shotSize':
      case 'cameraMovement':
        return 'bg-primary-100 text-primary-800 border-primary-200'
      case 'lightingStyle':
        return 'bg-primary-100 text-primary-800 border-primary-200'
      case 'colorPalette':
        return 'bg-primary-100 text-primary-800 border-primary-200'
      case 'directorStyle':
      case 'eraEmulation':
        return 'bg-primary-100 text-primary-800 border-primary/20'
      case 'sceneMood':
        return 'bg-primary-100 text-primary-800 border-primary/20'
      default:
        return 'bg-muted-100 text-muted-foreground-800 border-border-200'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden border border-border">
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold text-foreground">Media Treatment Details</h2>
              {/* Preset Style Badge */}
              <Badge variant="secondary" className="text-xs">
                {getStyleBadge(presetStyle)}
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Two Column Layout: Image + Info */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Media Preview */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Media Preview</h3>
              <div className="relative group">
                {media.type === 'video' || media.url?.endsWith('.mp4') || media.url?.endsWith('.webm') || media.url?.endsWith('.mov') ? (
                  <video
                    src={media.url}
                    className="w-full h-auto rounded-lg border border-border"
                    controls
                    preload="metadata"
                    style={{
                      aspectRatio: media.width && media.height ? `${media.width}:${media.height}` : '16:9',
                      objectFit: 'cover'
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={media.url}
                    alt={(media as any).title || 'Media preview'}
                    className="w-full h-auto rounded-lg border border-border"
                    style={{
                      aspectRatio: media.width && media.height ? `${media.width}:${media.height}` : '1:1',
                      objectFit: 'cover'
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Right Column - Information */}
            <div className="space-y-4">
              {/* Preset Information */}
              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium text-primary">Preset:</span>
                  <span className="text-sm font-semibold text-foreground">{presetName}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewPreset}
                    className="h-6 px-2 text-xs ml-auto"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Preset
                  </Button>
                </div>
              </div>
              
              {/* Image Metadata - Editable */}
              <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-foreground">Image Details</span>
                  {canEdit && !isEditingMetadata && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingMetadata(true)}
                      className="h-7 px-2 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                  )}
                </div>

                {isEditingMetadata ? (
                  // Edit mode
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="image-title" className="text-xs font-medium mb-1.5">Title</Label>
                      <Input
                        id="image-title"
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        placeholder="Enter image title..."
                        maxLength={200}
                        className="h-9"
                      />
                    </div>
                    <div>
                      <Label htmlFor="image-description" className="text-xs font-medium mb-1.5">Description</Label>
                      <Textarea
                        id="image-description"
                        value={editedDescription}
                        onChange={(e) => setEditedDescription(e.target.value)}
                        placeholder="Enter image description..."
                        rows={3}
                        maxLength={1000}
                        className="text-sm resize-none"
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button
                        onClick={handleSaveMetadata}
                        disabled={isSavingMetadata}
                        size="sm"
                        className="h-8 px-3"
                      >
                        {isSavingMetadata ? (
                          <>
                            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Check className="h-3 w-3 mr-1.5" />
                            Save
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleCancelEdit}
                        size="sm"
                        className="h-8 px-3"
                      >
                        <X className="h-3 w-3 mr-1.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-xs font-medium text-muted-foreground min-w-[70px]">Title:</span>
                      <span className="text-sm font-semibold text-foreground flex-1">
                        {editedTitle || 'Untitled'}
                      </span>
                    </div>
                    {editedDescription && (
                      <div className="flex items-start gap-2">
                        <span className="text-xs font-medium text-muted-foreground min-w-[70px]">Description:</span>
                        <span className="text-sm text-muted-foreground flex-1">{editedDescription}</span>
                      </div>
                    )}
                    {showcase && (
                      <div className="flex items-center gap-2 pt-1 border-t border-border/50 mt-2">
                        <span className="text-xs font-medium text-muted-foreground min-w-[70px]">Creator:</span>
                        <span className="text-sm text-foreground">@{showcase.creator.handle}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab('prompt')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'prompt'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Copy className="h-4 w-4 inline mr-2" />
                  Prompts
                </button>
                <button
                  onClick={() => setActiveTab('cinematic')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'cinematic'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Film className="h-4 w-4 inline mr-2" />
                  Cinematic Parameters
                </button>
                <button
                  onClick={() => setActiveTab('technical')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'technical'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <ImageIcon className="h-4 w-4 inline mr-2" />
                  Technical Details
                </button>
              </div>
              
              {/* Content */}
              <div className="overflow-y-auto max-h-[50vh]">
          {activeTab === 'prompt' && (
            <div className="space-y-4">
              {(enhancedPrompt || prompt) && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Prompt</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(enhancedPrompt || prompt, 'Prompt')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-sm text-muted-foreground whitespace-pre-wrap"
                      dangerouslySetInnerHTML={{ __html: highlightSubjectInText(highlightPrompt(enhancedPrompt || prompt)) }}
                    />
                  </CardContent>
                </Card>
              )}

              {stylePrompt && (
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium">Style Prompt</CardTitle>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(stylePrompt, 'Style prompt')}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{stylePrompt}</p>
                  </CardContent>
                </Card>
              )}

              {!prompt && !enhancedPrompt && !stylePrompt && (
                <div className="text-center py-8 text-muted-foreground">
                  <Copy className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No prompt information available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'cinematic' && (
            <div className="space-y-4">
              {cinematicParams ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(cinematicParams).map(([key, value]) => (
                    <Card key={key}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded ${getColorForParameter(key)}`}>
                            {getIconForParameter(key)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}:
                              </span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => copyToClipboard(value as string, `${key} parameter`)}
                                className="h-6 w-6 p-0"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                            <span className="text-sm font-medium">
                              {formatLabel(value as string)}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Film className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No cinematic parameters available</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'technical' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generationMetadata?.provider && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">AI Provider</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{generationMetadata.provider}</p>
                    </CardContent>
                  </Card>
                )}

                {generationMetadata?.credits_used && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <CreditCard className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Credits Used</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{generationMetadata.credits_used}</p>
                    </CardContent>
                  </Card>
                )}

                {generationMetadata?.resolution && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Resolution</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{generationMetadata.resolution}</p>
                    </CardContent>
                  </Card>
                )}

                {generationMetadata?.aspect_ratio && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <ImageIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Aspect Ratio</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{generationMetadata.aspect_ratio}</p>
                    </CardContent>
                  </Card>
                )}

                {generationMetadata?.generated_at && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Generated</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {new Date(generationMetadata.generated_at).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {generationMetadata?.base_image && (
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <ExternalLink className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Base Image</span>
                      </div>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => window.open(generationMetadata.base_image, '_blank')}
                        className="p-0 h-auto text-xs"
                      >
                        View Original
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>

              {!generationMetadata && (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No technical details available</p>
                </div>
              )}
            </div>
          )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-border bg-muted/50">
          <div className="text-xs text-muted-foreground">
            {media.type === 'video' ? 'Video' : 'Image'} • {media.width}×{media.height}
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {(prompt || enhancedPrompt || cinematicParams) && (
              <Button variant="outline" onClick={handleSaveAsPreset}>
                <Save className="h-4 w-4 mr-2" />
                Save as Preset
              </Button>
            )}
            <Button onClick={() => window.open(media.url, '_blank')}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Size
            </Button>
          </div>
        </div>
      </div>

      {/* Preset Creation Dialog */}
      <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Save className="h-5 w-5 mr-2" />
              Save as Preset
            </DialogTitle>
            <DialogDescription>
              Create a reusable preset from this media treatment. You can use this preset in future generations.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 overflow-y-auto">
            {/* Left Column - Media Preview */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Media Preview</Label>
                  {generationMetadata?.base_image && (
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="show-original" className="text-xs text-muted-foreground">
                        Show Original
                      </Label>
                      <Switch
                        id="show-original"
                        checked={showOriginalImage}
                        onCheckedChange={setShowOriginalImage}
                      />
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-center justify-center bg-muted rounded-lg p-4">
                  {showOriginalImage && generationMetadata?.base_image ? (
                    // Show only original/base image
                    <div className="w-full">
                      <div className="text-xs text-muted-foreground text-center mb-2">Original Image</div>
                      <img
                        src={generationMetadata.base_image}
                        alt="Original image"
                        className="w-full h-auto object-contain rounded-lg max-h-[300px]"
                      />
                    </div>
                  ) : (
                    // Show only generated result
                    <div className="w-full">
                      {media.type === 'video' || media.url?.endsWith('.mp4') || media.url?.endsWith('.webm') || media.url?.endsWith('.mov') ? (
                        <video
                          src={media.url}
                          className="w-full h-auto object-contain rounded-lg max-h-[300px]"
                          controls
                          preload="metadata"
                          poster={media.url || undefined}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img
                          src={media.url}
                          alt={'Media preview'}
                          className="w-full h-auto object-contain rounded-lg max-h-[300px]"
                        />
                      )}
                    </div>
                  )}
                  {/* Title removed due to type constraints */}
                  <a
                    href={media.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm mt-2 flex items-center"
                  >
                    View Full Size <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              </div>

              {/* Showcase Info */}
              {showcase && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Source Showcase</Label>
                  <div className="p-4 bg-muted/50 rounded-lg border border-border space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Title:</span>
                      <span className="text-sm font-semibold text-foreground">
                        "{showcase.caption || 'Untitled'}"
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Creator:</span>
                      <span className="text-sm text-foreground">@{showcase.creator.handle}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Media Count:</span>
                      <span className="text-sm text-foreground">Multiple items</span>
                    </div>
                    {showcase.caption && showcase.caption.length > 50 && (
                      <div className="flex items-start gap-3">
                        <span className="text-sm font-medium text-muted-foreground min-w-[80px]">Description:</span>
                        <span className="text-sm text-muted-foreground">
                          {showcase.caption.length > 100 ? `${showcase.caption.substring(0, 100)}...` : showcase.caption}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Enhanced Form */}
            <div className="space-y-4">
              {/* Detected Components Section */}
              {(() => {
                const components = detectPresetComponents()
                return (
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Detected Components</Label>
                    <div className="space-y-2">
                      {/* Base Preset */}
                      {components.basePreset && (
                        <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg border border-primary/20">
                          <Badge variant="secondary" className="text-xs">
                            {getStyleBadge(presetStyle)}
                          </Badge>
                          <span className="text-sm font-medium">Base Preset:</span>
                          <span className="text-sm text-primary">{components.basePreset.name}</span>
                          {components.basePreset.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => router.push(`/presets/${components.basePreset.id}`)}
                              className="h-6 px-2 text-xs"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              View
                            </Button>
                          )}
                        </div>
                      )}
                      
                  {/* Subject */}
                  {components.detectedSubject && (
                    <div className="flex items-center gap-2 p-2 bg-primary-500/5 rounded-lg border border-primary-500/20">
                      <Badge variant="outline" className="text-xs bg-primary-500/10 text-primary-600 border-primary-500/30">
                        {components.detectedSubject === 'image' ? 'Image-to-Image' : 'Subject'}
                      </Badge>
                      <span className="text-sm font-medium">
                        {components.detectedSubject === 'image' ? 'Generation Mode:' : 'Custom Subject:'}
                      </span>
                      <span className="text-sm text-primary-600 font-medium">
                        {components.detectedSubject === 'image' ? 'Image Modification' : components.detectedSubject}
                      </span>
                    </div>
                  )}
                      
                      {/* Cinematic Parameters */}
                      {components.hasCinematic && (
                        <div className="flex items-center gap-2 p-2 bg-primary-500/5 rounded-lg border border-primary-500/20">
                          <Badge variant="outline" className="text-xs bg-primary-500/10 text-primary-600 border-primary-500/30">
                            Cinematic
                          </Badge>
                          <span className="text-sm font-medium">Cinematic Parameters:</span>
                          <span className="text-sm text-primary-600">{Object.keys(components.cinematicParams).length} settings</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              <div className="space-y-2">
                <Label htmlFor="preset-name">Preset Name</Label>
                <Input
                  id="preset-name"
                  value={presetForm.name}
                  onChange={(e) => setPresetForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter preset name..."
                  maxLength={100}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset-description">Description (Optional)</Label>
                <Textarea
                  id="preset-description"
                  value={presetForm.description}
                  onChange={(e) => setPresetForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe this preset..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="preset-category">Category</Label>
                <Select value={presetForm.category} onValueChange={(value) => setPresetForm(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {/* Original Categories */}
                    <SelectItem value="style">Style</SelectItem>
                    <SelectItem value="cinematic">Cinematic</SelectItem>
                    <SelectItem value="technical">Technical</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                    
                    {/* Photography Categories */}
                    <SelectItem value="photography">Photography</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                    <SelectItem value="fashion">Fashion</SelectItem>
                    <SelectItem value="editorial">Editorial</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="lifestyle">Lifestyle</SelectItem>
                    <SelectItem value="street">Street</SelectItem>
                    <SelectItem value="architecture">Architecture</SelectItem>
                    <SelectItem value="nature">Nature</SelectItem>
                    
                    {/* Artistic Categories */}
                    <SelectItem value="artistic">Artistic</SelectItem>
                    <SelectItem value="painting">Painting</SelectItem>
                    <SelectItem value="illustration">Illustration</SelectItem>
                    <SelectItem value="digital_art">Digital Art</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                    <SelectItem value="surreal">Surreal</SelectItem>
                    <SelectItem value="minimalist">Minimalist</SelectItem>
                    <SelectItem value="maximalist">Maximalist</SelectItem>
                    
                    {/* Creative Categories */}
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="experimental">Experimental</SelectItem>
                    <SelectItem value="conceptual">Conceptual</SelectItem>
                    <SelectItem value="fantasy">Fantasy</SelectItem>
                    <SelectItem value="sci_fi">Sci-Fi</SelectItem>
                    <SelectItem value="steampunk">Steampunk</SelectItem>
                    <SelectItem value="gothic">Gothic</SelectItem>
                    <SelectItem value="vintage">Vintage</SelectItem>
                    <SelectItem value="retro">Retro</SelectItem>
                    <SelectItem value="futuristic">Futuristic</SelectItem>
                    
                    {/* Professional Categories */}
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="corporate">Corporate</SelectItem>
                    <SelectItem value="branding">Branding</SelectItem>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    
                    {/* Specialized Categories */}
                    <SelectItem value="film_look">Film Look</SelectItem>
                    <SelectItem value="dramatic">Dramatic</SelectItem>
                    <SelectItem value="moody">Moody</SelectItem>
                    <SelectItem value="bright">Bright</SelectItem>
                    <SelectItem value="monochrome">Monochrome</SelectItem>
                    <SelectItem value="colorful">Colorful</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                    <SelectItem value="warm">Warm</SelectItem>
                    <SelectItem value="cool">Cool</SelectItem>
                    
                    {/* Technical Categories */}
                    <SelectItem value="hdr">HDR</SelectItem>
                    <SelectItem value="macro">Macro</SelectItem>
                    <SelectItem value="panoramic">Panoramic</SelectItem>
                    <SelectItem value="composite">Composite</SelectItem>
                    <SelectItem value="retouching">Retouching</SelectItem>
                    <SelectItem value="color_grading">Color Grading</SelectItem>
                    <SelectItem value="post_processing">Post Processing</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Enhanced Preview */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Preset Preview</Label>
                <div className="p-3 bg-muted rounded-lg text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="font-medium min-w-[60px]">Prompt:</span>
                    <span className="text-muted-foreground">
                      {(enhancedPrompt || prompt || 'No prompt available').substring(0, 150)}
                      {(enhancedPrompt || prompt || '').length > 150 ? '...' : ''}
                    </span>
                  </div>
                  {cinematicParams && (
                    <div className="flex items-center gap-2">
                      <span className="font-medium min-w-[60px]">Cinematic:</span>
                      <Badge variant="outline" className="text-xs">
                        {Object.keys(cinematicParams).length} parameters
                      </Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="font-medium min-w-[60px]">Provider:</span>
                    <Badge variant="secondary" className="text-xs">
                      {generationMetadata?.provider || 'nanobanana'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium min-w-[60px]">Resolution:</span>
                    <Badge variant="secondary" className="text-xs">
                      {generationMetadata?.resolution || '1024x1024'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium min-w-[60px]">Aspect Ratio:</span>
                    <Badge variant="secondary" className="text-xs">
                      {generationMetadata?.aspect_ratio || '1:1'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Buttons */}
          <div className="flex justify-end space-x-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={() => setShowPresetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePreset} disabled={isCreatingPreset || !presetForm.name.trim()}>
              {isCreatingPreset ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Preset
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
