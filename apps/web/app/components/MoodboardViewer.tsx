'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import DraggableMasonryGrid from './DraggableMasonryGrid'

interface MoodboardItem {
  id: string
  type: 'image' | 'video' | 'pexels'
  source: 'upload' | 'pexels' | 'url' | 'ai-enhanced'
  url: string
  thumbnail_url?: string
  enhanced_url?: string  // URL of enhanced version if exists
  caption?: string
  width?: number
  height?: number
  photographer?: string
  photographer_url?: string
  position: number
  enhancement_prompt?: string
  original_image_id?: string
  original_url?: string
  enhancement_task_id?: string
  enhancement_status?: 'pending' | 'processing' | 'completed' | 'failed'
  cost?: number
  showing_original?: boolean
}

interface MoodboardViewerProps {
  gigId: string
}

export default function MoodboardViewer({ gigId }: MoodboardViewerProps) {
  const [moodboard, setMoodboard] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<MoodboardItem | null>(null)
  
  useEffect(() => {
    fetchMoodboard()
  }, [gigId])
  
  const fetchMoodboard = async () => {
    try {
      const { data, error } = await supabase
        .from('moodboards')
        .select('*')
        .eq('gig_id', gigId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
      
      if (!error && data) {
        // Sort items by position
        if (data.items && Array.isArray(data.items)) {
          data.items.sort((a: MoodboardItem, b: MoodboardItem) => a.position - b.position)
        }
        setMoodboard(data)
      }
    } catch (err) {
      console.error('Error fetching moodboard:', err)
    } finally {
      setLoading(false)
    }
  }
  
  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Visual Inspiration</h2>
        <div className="animate-pulse">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-48 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }
  
  if (!moodboard || !moodboard.items || moodboard.items.length === 0) {
    return null
  }
  
  return (
    <>
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          {moodboard.title || 'Visual Inspiration'}
        </h2>
        
        {moodboard.summary && (
          <p className="text-gray-600 mb-4">{moodboard.summary}</p>
        )}
        
        {moodboard.vibe_summary && (
          <div className="mb-4 p-3 bg-emerald-50 rounded-md">
            <p className="text-emerald-800 text-sm">
              <span className="font-medium">Vibe:</span> {moodboard.vibe_summary}
            </p>
          </div>
        )}
        
        {moodboard.palette && moodboard.palette.length > 0 && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Color Palette:</p>
            <div className="flex gap-2">
              {moodboard.palette.map((color: string, index: number) => (
                <div
                  key={index}
                  className="w-10 h-10 rounded shadow-sm border border-gray-200"
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
          </div>
        )}
        
        <DraggableMasonryGrid
          items={moodboard.items}
          onItemClick={(item) => setSelectedImage(item)} // Open lightbox on click
          enhancingItems={new Set()}
          enhancementTasks={new Map()}
          subscriptionTier="free"
          editable={false} // Viewer mode - no editing
        />
      </div>
      
      {/* Lightbox Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="max-w-4xl max-h-[90vh] relative">
            {selectedImage.type === 'image' ? (
              <img
                src={selectedImage.enhanced_url || selectedImage.url}
                alt={selectedImage.caption || ''}
                className="max-w-full max-h-[90vh] object-contain"
              />
            ) : (
              <video
                src={selectedImage.url}
                className="max-w-full max-h-[90vh] object-contain"
                controls
                autoPlay
              />
            )}
            {selectedImage.photographer && (
              <div className="absolute bottom-4 left-4 text-white bg-black bg-opacity-60 px-3 py-2 rounded">
                Photo by{' '}
                {selectedImage.photographer_url ? (
                  <a
                    href={selectedImage.photographer_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {selectedImage.photographer}
                  </a>
                ) : (
                  selectedImage.photographer
                )}
                {' on Pexels'}
              </div>
            )}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-60 rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-80"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </>
  )
}