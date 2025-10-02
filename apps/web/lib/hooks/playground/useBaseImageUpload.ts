'use client'

import { useState, useCallback } from 'react'
import { ImageDimensions } from '../../types/playground'
import { getImageDimensions } from '../../utils/playground'

export const useBaseImageUpload = (session?: any) => {
  const [baseImage, setBaseImage] = useState<string | null>(null)
  const [baseImageSource, setBaseImageSource] = useState<'upload' | 'saved' | 'pexels' | null>(null)
  const [baseImageDimensions, setBaseImageDimensions] = useState<ImageDimensions | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('image', file)

      const response = await fetch('/api/playground/upload-base-image', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to upload base image')
      }

      const { imageUrl } = await response.json()
      setBaseImage(imageUrl)
      setBaseImageSource('upload')

      // Get image dimensions
      try {
        const dimensions = await getImageDimensions(imageUrl)
        setBaseImageDimensions(dimensions)
        console.log('Base image dimensions:', dimensions)
      } catch (error) {
        console.error('Failed to get image dimensions:', error)
        setBaseImageDimensions(null)
      }
    } catch (error) {
      console.error('Failed to upload base image:', error)
      // Fallback to blob URL for preview
      const url = URL.createObjectURL(file)
      setBaseImage(url)
      setBaseImageSource('upload')

      try {
        const dimensions = await getImageDimensions(url)
        setBaseImageDimensions(dimensions)
        console.log('Base image dimensions:', dimensions)
      } catch (error) {
        console.error('Failed to get image dimensions:', error)
        setBaseImageDimensions(null)
      }
    } finally {
      setUploading(false)
    }
  }, [session?.access_token])

  const removeBaseImage = useCallback(async () => {
    if (baseImage) {
      setBaseImage(null)
      setBaseImageDimensions(null)
      setBaseImageSource(null)
    }
  }, [baseImage])

  const selectSavedBaseImage = useCallback(async (imageUrl: string) => {
    setBaseImage(imageUrl)
    setBaseImageSource('saved')

    // Get image dimensions for saved images too
    try {
      const dimensions = await getImageDimensions(imageUrl)
      setBaseImageDimensions(dimensions)
      console.log('Saved base image dimensions:', dimensions)
    } catch (error) {
      console.error('Failed to get saved image dimensions:', error)
      setBaseImageDimensions(null)
    }
  }, [])

  const selectPexelsImage = useCallback(async (photoUrl: string) => {
    setBaseImage(photoUrl)
    setBaseImageSource('pexels')

    // Get image dimensions
    try {
      const dimensions = await getImageDimensions(photoUrl)
      setBaseImageDimensions(dimensions)
      console.log('Pexels base image dimensions:', dimensions)
    } catch (error) {
      console.error('Failed to get Pexels image dimensions:', error)
      setBaseImageDimensions(null)
    }
  }, [])

  const setBaseImageSourceOnly = useCallback((source: 'upload' | 'saved' | 'pexels' | null) => {
    setBaseImageSource(source)
  }, [])

  return {
    baseImage,
    baseImageSource,
    baseImageDimensions,
    uploading,
    handleFileUpload,
    removeBaseImage,
    selectSavedBaseImage,
    selectPexelsImage,
    setBaseImageSource: setBaseImageSourceOnly
  }
}
