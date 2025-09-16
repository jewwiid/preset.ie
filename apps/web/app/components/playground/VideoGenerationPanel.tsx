'use client'

import { useState } from 'react'
import { Wand2 } from 'lucide-react'

interface VideoGenerationPanelProps {
  onGenerateVideo: (params: {
    imageUrl: string
    duration: number
    resolution: string
    motionType: string
  }) => Promise<void>
  loading: boolean
  selectedImage: string | null
}

export default function VideoGenerationPanel({ 
  onGenerateVideo,
  loading, 
  selectedImage 
}: VideoGenerationPanelProps) {
  const [videoDuration, setVideoDuration] = useState(3)
  const [videoResolution, setVideoResolution] = useState('480p')
  const [motionType, setMotionType] = useState('subtle')

  const handleGenerateVideo = async () => {
    if (!selectedImage) {
      return
    }
    
    await onGenerateVideo({
      imageUrl: selectedImage,
      duration: videoDuration,
      resolution: videoResolution,
      motionType
    })
  }

  const getCreditsForVideo = () => {
    const baseCredits = 8
    const durationMultiplier = videoDuration > 3 ? 2 : 1
    const resolutionMultiplier = videoResolution === '720p' ? 2 : 1
    return baseCredits + (durationMultiplier * resolutionMultiplier)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Wand2 className="h-5 w-5 mr-2 text-purple-500" />
        Video Generation
      </h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Resolution
          </label>
          <select
            value={videoResolution}
            onChange={(e) => setVideoResolution(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="480p">480p (854x480)</option>
            <option value="720p">720p (1280x720)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motion Type
          </label>
          <select
            value={motionType}
            onChange={(e) => setMotionType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="subtle">Subtle</option>
            <option value="moderate">Moderate</option>
            <option value="dynamic">Dynamic</option>
          </select>
        </div>

        <button
          onClick={handleGenerateVideo}
          disabled={loading || !selectedImage}
          className="w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate Video ({getCreditsForVideo()} credits)
            </>
          )}
        </button>
      </div>
    </div>
  )
}
