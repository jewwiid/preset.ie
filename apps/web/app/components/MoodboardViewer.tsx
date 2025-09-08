'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface MoodboardItem {
  id: string
  type: 'image' | 'video' | 'pexels'
  source: 'upload' | 'pexels' | 'url'
  url: string
  thumbnail_url?: string
  caption?: string
  photographer?: string
  photographer_url?: string
  position: number
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
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-gray-200 h-32 rounded"></div>
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
        
        {moodboard.description && (
          <p className="text-gray-600 mb-4">{moodboard.description}</p>
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
        
        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {moodboard.items.map((item: MoodboardItem) => (
            <div
              key={item.id}
              className="relative group cursor-pointer"
              onClick={() => setSelectedImage(item)}
            >
              {item.type === 'image' ? (
                <img
                  src={item.thumbnail_url || item.url}
                  alt={item.caption || ''}
                  className="w-full h-32 object-cover rounded hover:opacity-90 transition-opacity"
                />
              ) : (
                <video
                  src={item.url}
                  className="w-full h-32 object-cover rounded"
                  muted
                />
              )}
              {item.photographer && (
                <div className="absolute bottom-1 left-1 text-xs text-white bg-black bg-opacity-60 px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  📷 {item.photographer}
                </div>
              )}
            </div>
          ))}
        </div>
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
                src={selectedImage.url}
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