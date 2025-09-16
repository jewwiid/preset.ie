'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'

interface BatchProcessingPanelProps {
  onPerformBatchEdit: (params: {
    prompt: string
    images: string[]
    editType: string
  }) => Promise<void>
  loading: boolean
}

export default function BatchProcessingPanel({ 
  onPerformBatchEdit,
  loading 
}: BatchProcessingPanelProps) {
  const [batchImages, setBatchImages] = useState<string[]>([])
  const [editType, setEditType] = useState('enhance')

  const handleBatchEdit = async () => {
    if (batchImages.length === 0) {
      return
    }
    
    await onPerformBatchEdit({
      prompt: '', // Will be passed from parent
      images: batchImages,
      editType
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Wand2 className="h-5 w-5 mr-2 text-purple-500" />
        Batch Processing
      </h2>
      
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
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Images to Process: {batchImages.length}/10
          </label>
          <div className="space-y-2">
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
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button
                  onClick={() => setBatchImages(batchImages.filter((_, i) => i !== index))}
                  className="text-red-600 hover:bg-red-50 px-2 py-1 rounded text-sm"
                >
                  ×
                </button>
              </div>
            ))}
            {batchImages.length < 10 && (
              <button
                onClick={() => setBatchImages([...batchImages, ''])}
                className="text-blue-600 hover:bg-blue-50 px-3 py-2 rounded text-sm border border-dashed border-blue-300 w-full"
              >
                + Add Image URL
              </button>
            )}
          </div>
        </div>

        <button
          onClick={handleBatchEdit}
          disabled={loading || batchImages.length === 0}
          className="w-full bg-orange-600 text-white py-2 px-4 rounded-md hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
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
  )
}
