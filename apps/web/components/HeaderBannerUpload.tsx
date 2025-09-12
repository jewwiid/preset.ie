'use client'

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { Camera, Upload, X, AlertCircle, CheckCircle } from 'lucide-react'

interface HeaderBannerUploadProps {
  currentBannerUrl?: string
  onBannerUpdate: (newBannerUrl: string) => void
  userId: string
}

export function HeaderBannerUpload({ currentBannerUrl, onBannerUpdate, userId }: HeaderBannerUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

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
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(fileName)

      if (urlData?.publicUrl) {
        // Update the user's profile with the new banner URL
        const { error: updateError } = await supabase
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

    setUploading(true)
    setError(null)

    try {
      // Extract filename from URL for deletion
      const urlParts = currentBannerUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const fullPath = `${userId}/${fileName}`

      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('profile-photos')
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
          <div className="w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={currentBannerUrl}
              alt="Header banner"
              className="w-full h-full object-cover"
            />
          </div>
          <button
            onClick={handleRemoveBanner}
            disabled={uploading}
            className="absolute top-2 right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
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
          
          <div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
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
            Recommended: 1200x300px, max 5MB
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
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Banner updated successfully!</span>
        </div>
      )}
    </div>
  )
}
