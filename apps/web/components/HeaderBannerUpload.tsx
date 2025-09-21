'use client'

import { useState, useRef, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { Camera, Upload, X, AlertCircle, CheckCircle, Move, Edit3, RotateCcw } from 'lucide-react'

interface HeaderBannerUploadProps {
  currentBannerUrl?: string
  onBannerUpdate: (newBannerUrl: string) => void
  userId: string
}

interface BannerPosition {
  y: number
  scale: number
}

export function HeaderBannerUpload({ currentBannerUrl, onBannerUpdate, userId }: HeaderBannerUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isAdjusting, setIsAdjusting] = useState(false)
  const [bannerPosition, setBannerPosition] = useState<BannerPosition>({ y: 0, scale: 1.2 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ y: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLImageElement>(null)

  // Drag functionality for vertical banner positioning only
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isAdjusting) return
    setIsDragging(true)
    setDragStart({
      y: e.clientY - bannerPosition.y
    })
  }, [isAdjusting, bannerPosition])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !isAdjusting) return
    e.preventDefault()
    
    const newY = e.clientY - dragStart.y
    
    setBannerPosition(prev => ({
      ...prev,
      y: Math.max(-50, Math.min(50, newY))
    }))
  }, [isDragging, isAdjusting, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (!isAdjusting) return
    e.preventDefault()
    
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setBannerPosition(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(2, prev.scale + delta))
    }))
  }, [isAdjusting])

  const resetPosition = () => {
    setBannerPosition({ y: 0, scale: 1.2 })
  }

  const saveBannerPosition = async () => {
    if (!currentBannerUrl) return
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }
    
    try {
      const { error } = await supabase!
        .from('users_profile')
        .update({ 
          header_banner_position: JSON.stringify(bannerPosition)
        })
        .eq('user_id', userId)

      if (error) {
        console.error('Error saving banner position:', error)
      }
    } catch (err) {
      console.error('Error saving banner position:', err)
    }
  }

  // Save position when adjusting is finished
  const handleFinishAdjusting = () => {
    setIsAdjusting(false)
    saveBannerPosition()
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setError(null)
    setSuccess(false)
    setUploading(true)

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${userId}/header-banner-${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase!.storage
        .from('profile-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data: urlData } = supabase!.storage
        .from('profile-images')
        .getPublicUrl(fileName)

      if (urlData?.publicUrl) {
        // Update the user's profile with the new banner URL
        const { error: updateError } = await supabase!
          .from('users_profile')
          .update({ header_banner_url: urlData.publicUrl })
          .eq('user_id', userId)

        if (updateError) {
          throw updateError
        }

        // Update the parent component
        onBannerUpdate(urlData.publicUrl)
        setSuccess(true)
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000)
      }
    } catch (err: any) {
      console.error('Error uploading banner:', err)
      setError(err.message || 'Failed to upload banner')
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveBanner = async () => {
    if (!currentBannerUrl) return
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Extract filename from URL for deletion
      const urlParts = currentBannerUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const fullPath = `${userId}/${fileName}`

      // Delete from storage
      const { error: deleteError } = await supabase!.storage
        .from('profile-images')
        .remove([fullPath])

      if (deleteError) {
        console.warn('Error deleting old banner:', deleteError)
      }

      // Update profile to remove banner URL
      const { error: updateError } = await supabase
        .from('users_profile')
        .update({ header_banner_url: null })
        .eq('user_id', userId)

      if (updateError) {
        throw updateError
      }

      onBannerUpdate('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err: any) {
      console.error('Error removing banner:', err)
      setError(err.message || 'Failed to remove banner')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current Banner Preview */}
      {currentBannerUrl && (
        <div className="relative">
          <div 
            className={`w-full aspect-[2/1] bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg overflow-hidden relative ${isAdjusting ? 'cursor-ns-resize' : ''}`}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                ref={bannerRef}
                src={currentBannerUrl}
                alt="Header banner"
                className="w-full h-auto object-contain transition-transform duration-200"
                style={{
                  transform: `translateY(${bannerPosition.y}px) scale(${bannerPosition.scale})`,
                  transformOrigin: 'center center',
                  minHeight: '100%'
                }}
              />
            </div>
            
            {/* Overlay Controls */}
            <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 group">
              <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={isAdjusting ? handleFinishAdjusting : () => setIsAdjusting(true)}
                  className={`p-2 rounded-lg transition-colors ${
                    isAdjusting 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100'
                  }`}
                  title={isAdjusting ? 'Finish adjusting' : 'Adjust position'}
                >
                  <Move className="w-4 h-4" />
                </button>
                
                {isAdjusting && (
                  <button
                    onClick={resetPosition}
                    className="p-2 bg-white bg-opacity-90 text-gray-700 hover:bg-opacity-100 rounded-lg transition-colors"
                    title="Reset position"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              <button
                onClick={handleRemoveBanner}
                disabled={uploading}
                className="absolute top-2 right-2 p-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 opacity-0 group-hover:opacity-100"
                title="Remove banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Adjustment Instructions */}
            {isAdjusting && (
              <div className="absolute bottom-2 left-2 right-2 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                <div className="flex items-center justify-between">
                  <span>Drag up/down to move • Scroll to zoom</span>
                  <span>Scale: {Math.round(bannerPosition.scale * 100)}%</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-3">
          <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-gray-400" />
          </div>
          
          <div className="flex justify-center">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary/90 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {currentBannerUrl ? 'Change Banner' : 'Upload Banner'}
                </>
              )}
            </button>
          </div>
          
          <p className="text-sm text-gray-500">
            Recommended: 1200x600px, max 5MB
            {isAdjusting && (
              <span className="block mt-1 text-primary-600">
                💡 Drag up/down to move • Scroll to zoom • Click finish when done
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-3 bg-primary-50 border border-primary/20 rounded-lg text-primary-700">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Banner updated successfully!</span>
        </div>
      )}
    </div>
  )
}
