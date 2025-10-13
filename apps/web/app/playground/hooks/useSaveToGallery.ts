/**
 * Hook for saving images and videos to gallery
 */

import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { PlaygroundProject, VideoMetadata } from '../types'
import { createAuthHeaders } from '../lib/apiHelpers'
import {
  getImageUrl,
  isVideoUrl,
  buildImageGenerationMetadata,
} from '../lib/imageHelpers'
import { createVideoSavePayload } from '../lib/videoHelpers'
import { API_ENDPOINTS } from '../constants/playgroundConfig'

interface UseSaveToGalleryReturn {
  saveToGallery: (imageUrl: any) => Promise<void>
  savingImage: string | null
}

export function useSaveToGallery(
  session: Session | null,
  currentProject: PlaygroundProject | null
): UseSaveToGalleryReturn {
  const [savingImage, setSavingImage] = useState<string | null>(null)

  const saveToGallery = async (imageUrl: any) => {
    console.log('🎯 saveToGallery function called with URL:', imageUrl)

    // Extract the actual URL string
    const actualImageUrl = getImageUrl(imageUrl)
    console.log('🎯 Extracted URL:', actualImageUrl)

    // Prevent multiple simultaneous calls
    if (savingImage === actualImageUrl) {
      console.log('⚠️ Save already in progress for this URL, skipping...')
      return
    }

    setSavingImage(actualImageUrl)
    try {
      console.log('🔄 Starting save process...')

      // Check if this is a video URL
      console.log('🔍 Starting media type detection...')
      const isVideo = isVideoUrl(actualImageUrl)

      console.log('🔍 Media type detection:', {
        imageUrl,
        actualImageUrl,
        isVideo,
        hasMp4: actualImageUrl.includes('.mp4'),
        hasWebm: actualImageUrl.includes('.webm'),
        hasMov: actualImageUrl.includes('.mov'),
      })

      console.log('🔍 Media type detection completed, proceeding to save logic...')

      if (isVideo) {
        await saveVideoToGallery(actualImageUrl, session, currentProject)
      } else {
        await saveImageToGallery(actualImageUrl, session, currentProject)
      }
    } catch (error) {
      console.error('Save failed:', error)
      throw error
    } finally {
      setSavingImage(null)
    }
  }

  return {
    saveToGallery,
    savingImage,
  }
}

async function saveVideoToGallery(
  videoUrl: string,
  session: Session | null,
  currentProject: PlaygroundProject | null
): Promise<void> {
  console.log('🎬 Detected video - using video save endpoint')

  // Get video metadata from current project if available
  const videoMetadataFromImage = currentProject?.generated_images?.find(
    (img) => getImageUrl(img.url) === videoUrl
  )

  const videoMetadata: VideoMetadata | null = videoMetadataFromImage
    ? {
        aspectRatio: videoMetadataFromImage.resolution || '1:1',
        resolution: videoMetadataFromImage.resolution || '480p',
        duration: videoMetadataFromImage.duration || 5,
        prompt: currentProject?.prompt || 'AI-generated video',
        cameraMovement: videoMetadataFromImage.cameraMovement || 'smooth',
        presetId: videoMetadataFromImage.presetId || null,
      }
    : null

  const videoData = createVideoSavePayload(videoUrl, videoMetadata, currentProject)

  console.log('Saving video to gallery:', videoData)
  console.log('Session token present:', !!session?.access_token)
  console.log('Session token length:', session?.access_token?.length)

  const tokenToUse = session?.access_token
  console.log('Using token for API call:', !!tokenToUse)

  const response = await fetch(API_ENDPOINTS.SAVE_VIDEO_TO_GALLERY, {
    method: 'POST',
    headers: createAuthHeaders(tokenToUse!),
    body: JSON.stringify(videoData),
  })

  if (!response.ok) {
    const errorData = await response.json()

    // Handle duplicate videos gracefully
    if (response.status === 409 && errorData.error === 'duplicate') {
      console.log('Video already saved, skipping...')
      return
    }

    console.error('Video save API error:', {
      status: response.status,
      statusText: response.statusText,
      errorData,
      videoUrl,
    })
    throw new Error(errorData.error || 'Failed to save video')
  }
}

async function saveImageToGallery(
  imageUrl: string,
  session: Session | null,
  currentProject: PlaygroundProject | null
): Promise<void> {
  const generationMetadata = buildImageGenerationMetadata(currentProject)

  console.log('📤 Sending to save-to-gallery API:', {
    imageUrl: imageUrl.substring(0, 50) + '...',
    hasCustomStylePreset: !!generationMetadata?.custom_style_preset,
    presetId: generationMetadata?.custom_style_preset?.id,
    presetName: generationMetadata?.custom_style_preset?.name,
    style: generationMetadata?.style,
  })

  const response = await fetch(API_ENDPOINTS.SAVE_TO_GALLERY, {
    method: 'POST',
    headers: createAuthHeaders(session?.access_token!),
    body: JSON.stringify({
      imageUrl,
      title: currentProject?.title || 'Generated Image',
      description: `Generated from: ${currentProject?.prompt || 'Unknown prompt'}`,
      tags: ['ai-generated'],
      projectId: currentProject?.id,
      generationMetadata,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json()

    // Handle duplicate images gracefully
    if (response.status === 409 && errorData.error === 'duplicate') {
      console.log('Image already saved, skipping...')
      return
    }

    throw new Error(errorData.error || 'Failed to save image')
  }
}
