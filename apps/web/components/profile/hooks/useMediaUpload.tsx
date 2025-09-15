'use client'

import { useState, useCallback } from 'react'
import { supabase } from '../../../lib/supabase'
import { UseMediaUploadReturn } from '../types/profile'

export function useMediaUpload(): UseMediaUploadReturn {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  const uploadFile = useCallback(async (file: File, type: 'avatar' | 'banner'): Promise<string | null> => {
    if (!file) return null

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file')
      return null
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB')
      return null
    }

    setUploading(true)
    setUploadError(null)
    setUploadProgress(0)

    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Create unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${type}_${Date.now()}.${fileExt}`
      const filePath = `profile-media/${fileName}`

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-media')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        throw uploadError
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-media')
        .getPublicUrl(filePath)

      if (!urlData.publicUrl) {
        throw new Error('Failed to get public URL')
      }

      setUploadProgress(100)
      return urlData.publicUrl

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError(error instanceof Error ? error.message : 'Upload failed')
      return null
    } finally {
      setUploading(false)
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }, [])

  return {
    uploading,
    uploadError,
    uploadFile,
    uploadProgress
  }
}
