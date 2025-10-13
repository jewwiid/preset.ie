/**
 * Custom hook for image and video upload functionality
 * Handles file validation, compression, and upload to storage
 */

import { useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { compressImageClientSide } from '@/lib/image-optimizer'
import { MoodboardItem } from '../lib/moodboardTypes'
import {
  MAX_FILE_SIZE,
  SUPPORTED_FORMATS,
  SUPPORTED_IMAGE_FORMATS,
  SUPPORTED_VIDEO_FORMATS
} from '../constants/moodboardConfig'
import {
  isValidFileFormat,
  generateUploadFileName,
  getImageDimensions
} from '../lib/moodboardHelpers'

interface UseImageUploadReturn {
  // State
  uploading: boolean
  uploadProgress: number
  error: string | null
  fileInputRef: React.RefObject<HTMLInputElement | null>

  // Operations
  uploadFiles: (files: FileList) => Promise<MoodboardItem[]>
  uploadFile: (file: File) => Promise<MoodboardItem | null>
  importFromUrl: (url: string) => Promise<MoodboardItem | null>
  validateFile: (file: File) => { valid: boolean; error?: string }
  clearError: () => void
}

export const useImageUpload = (): UseImageUploadReturn => {
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  /**
   * Validate a file before upload
   */
  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!isValidFileFormat(file.type)) {
      return {
        valid: false,
        error: 'Unsupported file format. Please upload images (JPEG, PNG, WebP, GIF) or videos (MP4, WebM, MOV)'
      }
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: 'File size must be less than 10MB'
      }
    }

    return { valid: true }
  }

  /**
   * Upload a single file
   */
  const uploadFile = async (file: File): Promise<MoodboardItem | null> => {
    if (!user) {
      setError('You must be logged in to upload files')
      return null
    }

    // Validate file
    const validation = validateFile(file)
    if (!validation.valid) {
      setError(validation.error || 'Invalid file')
      return null
    }

    try {
      if (!supabase) {
        setError('Database connection not available. Please try again.')
        return null
      }

      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        setError('You must be logged in to upload files')
        return null
      }

      // Compress image before upload for faster processing
      let fileToUpload: File | Blob = file
      if (SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
        try {
          console.log(`Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
          const compressed = await compressImageClientSide(file, {
            maxWidth: 2048,
            maxHeight: 2048,
            quality: 0.9,
            format: 'jpeg'
          })
          console.log(`Compressed to: ${(compressed.size / 1024 / 1024).toFixed(2)}MB`)
          fileToUpload = compressed
        } catch (err) {
          console.warn('Could not compress image, using original:', err)
        }
      }

      // Generate file name
      const fileName = generateUploadFileName(user.id, file.name)
      const bucketName = 'user-media'
      console.log('Uploading file:', fileName, 'to bucket:', bucketName)

      // Upload to Supabase storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(fileName, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          contentType: fileToUpload.type || 'image/jpeg'
        })

      if (uploadError) {
        console.error('Upload error details:', uploadError)
        throw uploadError
      }

      console.log('File uploaded successfully:', fileName)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName)

      // Get dimensions if image
      let width: number | undefined
      let height: number | undefined
      if (SUPPORTED_IMAGE_FORMATS.includes(file.type)) {
        try {
          const dimensions = await getImageDimensions(publicUrl)
          width = dimensions.width
          height = dimensions.height
        } catch (err) {
          console.warn('Could not get image dimensions:', err)
        }
      }

      // Create moodboard item
      const newItem: MoodboardItem = {
        id: crypto.randomUUID(),
        type: SUPPORTED_IMAGE_FORMATS.includes(file.type) ? 'image' : 'video',
        source: 'upload',
        url: publicUrl,
        thumbnail_url: publicUrl,
        caption: file.name,
        width,
        height,
        position: 0 // Will be set by the parent
      }

      return newItem
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload file')
      return null
    }
  }

  /**
   * Upload multiple files
   */
  const uploadFiles = async (files: FileList): Promise<MoodboardItem[]> => {
    if (!user) {
      setError('You must be logged in to upload files')
      return []
    }

    setUploading(true)
    setError(null)
    setUploadProgress(0)

    const uploadedItems: MoodboardItem[] = []

    try {
      const fileArray = Array.from(files)
      const totalFiles = fileArray.length

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        const item = await uploadFile(file)

        if (item) {
          uploadedItems.push(item)
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / totalFiles) * 100))
      }
    } catch (err: any) {
      console.error('Upload error:', err)
      setError(err.message || 'Failed to upload files')
    } finally {
      setUploading(false)
      setUploadProgress(0)

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    return uploadedItems
  }

  /**
   * Import image from URL
   */
  const importFromUrl = async (url: string): Promise<MoodboardItem | null> => {
    if (!url.trim()) {
      setError('Please enter a valid URL')
      return null
    }

    try {
      // Validate URL format
      const urlObj = new URL(url)
      if (urlObj.protocol !== 'http:' && urlObj.protocol !== 'https:') {
        setError('URL must start with http:// or https://')
        return null
      }

      // Get image dimensions
      let width: number | undefined
      let height: number | undefined
      try {
        const dimensions = await getImageDimensions(url)
        width = dimensions.width
        height = dimensions.height
      } catch (err) {
        console.warn('Could not get image dimensions:', err)
      }

      // Create moodboard item
      const newItem: MoodboardItem = {
        id: crypto.randomUUID(),
        type: 'image',
        source: 'url',
        url: url,
        thumbnail_url: url,
        width,
        height,
        position: 0 // Will be set by the parent
      }

      return newItem
    } catch (err: any) {
      console.error('URL import error:', err)
      setError('Invalid URL format')
      return null
    }
  }

  /**
   * Clear error state
   */
  const clearError = () => setError(null)

  return {
    // State
    uploading,
    uploadProgress,
    error,
    fileInputRef,

    // Operations
    uploadFiles,
    uploadFile,
    importFromUrl,
    validateFile,
    clearError
  }
}
