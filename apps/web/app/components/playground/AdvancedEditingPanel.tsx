'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'
import { useFeedback } from '../../../components/feedback/FeedbackContext'

interface AdvancedEditingPanelProps {
  onEdit: (params: {
    imageUrl: string
    editType: string
    editPrompt: string
    strength: number
  }) => Promise<void>
  loading: boolean
  selectedImage: string | null
}

export default function AdvancedEditingPanel({ 
  onEdit, 
  loading, 
  selectedImage 
}: AdvancedEditingPanelProps) {
  const [editType, setEditType] = useState('enhance')
  const [editPrompt, setEditPrompt] = useState('')
  const [editStrength, setEditStrength] = useState(0.8)

  const handleEdit = async () => {
    if (!selectedImage || !editPrompt.trim()) {
      return
    }
    
    await onEdit({
      imageUrl: selectedImage,
      editType,
      editPrompt,
      strength: editStrength
    })
  }

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
      'color_adjustment': 'Modify colors, saturation, or color schemes'
    }
    return descriptions[type] || 'Modify the selected image'
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
          disabled={loading || !selectedImage || !editPrompt.trim()}
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
