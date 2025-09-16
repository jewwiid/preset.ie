'use client'

import { useState, useRef } from 'react'
import { Wand2, Upload, X, Image as ImageIcon } from 'lucide-react'
import { useFeedback } from '../../../components/feedback/FeedbackContext'
import { Button } from '@/components/ui/button'

interface AdvancedEditingPanelProps {
  onEdit: (params: {
    imageUrl: string
    editType: string
    editPrompt: string
    strength: number
    referenceImage?: string
  }) => Promise<void>
  loading: boolean
  selectedImage: string | null
  savedImages?: Array<{
    id: string
    image_url: string
    title: string
  }>
  onSelectSavedImage?: (imageUrl: string) => void
}

export default function AdvancedEditingPanel({ 
  onEdit, 
  loading, 
  selectedImage,
  savedImages = [],
  onSelectSavedImage
}: AdvancedEditingPanelProps) {
  const [editType, setEditType] = useState('enhance')
  const [editPrompt, setEditPrompt] = useState('')
  const [editStrength, setEditStrength] = useState(0.8)
  const [referenceImage, setReferenceImage] = useState<string | null>(null)
  const [referenceImageSource, setReferenceImageSource] = useState<'upload' | 'saved'>('upload')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleEdit = async () => {
    if (!selectedImage || !editPrompt.trim()) {
      return
    }
    
    await onEdit({
      imageUrl: selectedImage,
      editType,
      editPrompt,
      strength: editStrength,
      referenceImage: referenceImage || undefined
    })
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setReferenceImage(url)
    }
  }

  const removeReferenceImage = () => {
    if (referenceImage) {
      if (referenceImageSource === 'upload') {
        URL.revokeObjectURL(referenceImage)
      }
      setReferenceImage(null)
    }
  }

  const selectSavedReferenceImage = (imageUrl: string) => {
    setReferenceImage(imageUrl)
    setReferenceImageSource('saved')
  }

  const requiresReferenceImage = (type: string) => {
    return ['face_swap', 'style_transfer', 'gender_swap', 'age_progression'].includes(type)
  }

  const getCreditsForEditType = (type: string) => {
    const creditMap: { [key: string]: number } = {
      'enhance': 2,
      'inpaint': 3,
      'outpaint': 3,
      'style_transfer': 2,
      'face_swap': 4,
      'object_removal': 3,
      'background_removal': 2,
      'upscale': 1,
      'color_adjustment': 2,
      'texture_change': 2,
      'lighting_adjustment': 2,
      'perspective_change': 3,
      'composition_change': 3,
      'artistic_filter': 2,
      'age_progression': 3,
      'gender_swap': 4,
      'expression_change': 2
    }
    return creditMap[type] || 2
  }

  const getEditPromptPlaceholder = (type: string) => {
    const placeholders: { [key: string]: string } = {
      'enhance': 'Describe how to enhance the image (sharpness, contrast, quality)...',
      'inpaint': 'Describe what you want to add or remove in specific areas...',
      'outpaint': 'Describe how to extend the image beyond current boundaries...',
      'style_transfer': 'Choose a style (Baroque, Cyberpunk, Anime, Oil Painting, etc.)...',
      'face_swap': 'Describe the target face characteristics...',
      'object_removal': 'Select specific objects to remove...',
      'background_removal': 'Remove background automatically',
      'upscale': 'Enhance image resolution and quality',
      'color_adjustment': 'Describe color changes (warmer, cooler, vintage, etc.)...',
      'texture_change': 'Describe texture modifications (smooth, rough, metallic, etc.)...',
      'lighting_adjustment': 'Describe lighting changes (brighter, darker, golden hour, etc.)...',
      'perspective_change': 'Describe perspective modifications (bird\'s eye, worm\'s eye, etc.)...',
      'composition_change': 'Describe compositional changes (rule of thirds, centered, etc.)...',
      'artistic_filter': 'Choose artistic style (watercolor, sketch, cartoon, etc.)...',
      'age_progression': 'Describe age changes (younger, older, specific age)...',
      'gender_swap': 'Describe gender transformation...',
      'expression_change': 'Describe facial expression changes (happy, sad, surprised, etc.)...'
    }
    return placeholders[type] || 'Describe how you want to modify the image...'
  }

  const getEditTypeDescription = (type: string) => {
    const descriptions: { [key: string]: string } = {
      'enhance': 'Improve overall image quality, sharpness, and contrast',
      'inpaint': 'Add or remove specific elements within the image',
      'outpaint': 'Extend the image beyond its current boundaries',
      'style_transfer': 'Apply artistic styles like paintings or illustrations',
      'face_swap': 'Replace faces while maintaining natural proportions',
      'object_removal': 'Remove unwanted objects and fill the area naturally',
      'background_removal': 'Remove or replace the background',
      'upscale': 'Increase image resolution while maintaining quality',
      'color_adjustment': 'Modify colors, saturation, or color schemes',
      'texture_change': 'Modify surface textures and materials',
      'lighting_adjustment': 'Adjust lighting conditions and atmosphere',
      'perspective_change': 'Change viewing angle and perspective',
      'composition_change': 'Modify image composition and framing',
      'artistic_filter': 'Apply artistic filters and effects',
      'age_progression': 'Change age appearance realistically',
      'gender_swap': 'Transform gender while maintaining identity',
      'expression_change': 'Modify facial expressions and emotions'
    }
    return descriptions[type] || 'Modify the selected image'
  }

  const getEditButtonText = (type: string) => {
    const texts: { [key: string]: string } = {
      'enhance': 'Enhance',
      'inpaint': 'Inpaint',
      'outpaint': 'Outpaint',
      'style_transfer': 'Style Transfer',
      'face_swap': 'Face Swap',
      'object_removal': 'Remove Objects',
      'background_removal': 'Remove Background',
      'upscale': 'Upscale',
      'color_adjustment': 'Adjust Colors',
      'texture_change': 'Change Texture',
      'lighting_adjustment': 'Adjust Lighting',
      'perspective_change': 'Change Perspective',
      'composition_change': 'Change Composition',
      'artistic_filter': 'Apply Filter',
      'age_progression': 'Change Age',
      'gender_swap': 'Gender Swap',
      'expression_change': 'Change Expression'
    }
    return texts[type] || 'Edit'
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Wand2 className="h-5 w-5 mr-2 text-purple-500" />
        Advanced Editing
      </h2>
      
      {selectedImage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center text-sm text-green-800">
            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
            Image selected for editing
          </div>
        </div>
      )}
      
      {!selectedImage && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <div className="flex items-center text-sm text-yellow-800">
            <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
            Select an image from the gallery to edit
          </div>
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Edit Type
          </label>
          <select
            value={editType}
            onChange={(e) => setEditType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="enhance">✨ Enhance (2 credits)</option>
            <option value="inpaint">🎨 Inpaint (3 credits)</option>
            <option value="outpaint">🖼️ Outpaint (3 credits)</option>
            <option value="style_transfer">🎭 Style Transfer (2 credits)</option>
            <option value="face_swap">👤 Face Swap (4 credits)</option>
            <option value="object_removal">🗑️ Remove Objects (3 credits)</option>
            <option value="background_removal">🌅 Remove Background (2 credits)</option>
            <option value="upscale">📈 Upscale (1 credit)</option>
            <option value="color_adjustment">🌈 Adjust Colors (2 credits)</option>
            <option value="texture_change">🧱 Change Texture (2 credits)</option>
            <option value="lighting_adjustment">💡 Adjust Lighting (2 credits)</option>
            <option value="perspective_change">📐 Change Perspective (3 credits)</option>
            <option value="composition_change">🎯 Change Composition (3 credits)</option>
            <option value="artistic_filter">🎨 Apply Filter (2 credits)</option>
            <option value="age_progression">👴 Change Age (3 credits)</option>
            <option value="gender_swap">⚧ Gender Swap (4 credits)</option>
            <option value="expression_change">😊 Change Expression (2 credits)</option>
          </select>
          <p className="mt-1 text-xs text-gray-600">
            {getEditTypeDescription(editType)}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Edit Prompt
          </label>
          <textarea
            value={editPrompt}
            onChange={(e) => setEditPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder={getEditPromptPlaceholder(editType)}
            rows={3}
          />
        </div>

        {/* Reference Image Upload Section */}
        {requiresReferenceImage(editType) && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference Image {requiresReferenceImage(editType) && <span className="text-red-500">*</span>}
            </label>
            
            {/* Reference Image Source Selection */}
            <div className="mb-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant={referenceImageSource === 'upload' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReferenceImageSource('upload')}
                >
                  Upload
                </Button>
                <Button
                  variant={referenceImageSource === 'saved' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setReferenceImageSource('saved')}
                  disabled={savedImages.length === 0}
                >
                  Saved Images
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {!referenceImage ? (
                <>
                  {/* Upload Section */}
                  {referenceImageSource === 'upload' && (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                      <p className="text-sm text-gray-600 mb-2">
                        {editType === 'face_swap' && 'Upload a face image to swap with'}
                        {editType === 'style_transfer' && 'Upload an image with the desired style'}
                        {editType === 'gender_swap' && 'Upload an image of the target gender'}
                        {editType === 'age_progression' && 'Upload an image showing the target age'}
                      </p>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-purple-600 border-purple-200 hover:bg-purple-50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Reference Image
                      </Button>
                    </div>
                  )}

                  {/* Saved Images Section */}
                  {referenceImageSource === 'saved' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select from Saved Images
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {savedImages.length === 0 ? (
                          <p className="text-sm text-gray-500 text-center py-4">
                            No saved images available
                          </p>
                        ) : (
                          savedImages.map((image) => (
                            <div
                              key={image.id}
                              className="flex items-center space-x-3 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer"
                              onClick={() => selectSavedReferenceImage(image.image_url)}
                            >
                              <img
                                src={image.image_url}
                                alt={image.title}
                                className="w-12 h-12 object-cover rounded"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{image.title}</p>
                              </div>
                              <Button size="sm" variant="outline">
                                Select
                              </Button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="relative">
                  <img
                    src={referenceImage}
                    alt="Reference"
                    className="w-full h-48 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-8 w-8 p-0"
                    onClick={removeReferenceImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="absolute top-2 left-2">
                    <span className="bg-green-500 text-white text-xs px-2 py-1 rounded">
                      {referenceImageSource === 'upload' && 'Uploaded Image'}
                      {referenceImageSource === 'saved' && 'Saved Image'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Reference image {referenceImageSource === 'upload' ? 'uploaded' : 'selected'} successfully
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Strength: {editStrength}
          </label>
          <input
            type="range"
            min="0.1"
            max="1.0"
            step="0.1"
            value={editStrength}
            onChange={(e) => setEditStrength(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>

        <button
          onClick={handleEdit}
          disabled={loading || !selectedImage || !editPrompt.trim() || (requiresReferenceImage(editType) && !referenceImage)}
          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
  )
}
