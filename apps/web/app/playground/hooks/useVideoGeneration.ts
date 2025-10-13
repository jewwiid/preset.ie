/**
 * Hook for video generation operations
 */

import type { Session } from '@supabase/supabase-js'
import type {
  VideoGenerationParams,
  VideoGenerationStatus,
  VideoMetadata,
  VideoGenerationResponse,
} from '../types'
import { validateSession, createAuthHeaders } from '../lib/apiHelpers'
import { API_ENDPOINTS } from '../constants/playgroundConfig'
import { pollForVideoCompletion } from '../lib/videoHelpers'

interface UseVideoGenerationReturn {
  generateVideo: (params: VideoGenerationParams) => Promise<string | null>
}

export function useVideoGeneration(
  session: Session | null,
  currentProjectId: string | null,
  setVideoGenerationStatus: (status: VideoGenerationStatus) => void,
  setGeneratedVideoUrl: (url: string | null) => void,
  setGeneratedVideoMetadata: (metadata: VideoMetadata | null) => void
): UseVideoGenerationReturn {
  const generateVideo = async (params: VideoGenerationParams): Promise<string | null> => {
    setVideoGenerationStatus('generating')
    setGeneratedVideoUrl(null)

    console.log('Starting video generation with params:', params)
    validateSession(session)

    const response = await fetch(API_ENDPOINTS.VIDEO, {
      method: 'POST',
      headers: createAuthHeaders(session!.access_token),
      body: JSON.stringify({
        ...params,
        projectId: currentProjectId,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate video')
    }

    const responseData: VideoGenerationResponse = await response.json()
    console.log('Video generation API response:', responseData)
    const { taskId, creditsUsed, styledImageUrl } = responseData

    // Poll for video completion
    const finalVideoUrl = await pollForVideoCompletion(taskId, session)
    console.log('Video generation completed:', { finalVideoUrl })

    // Set the generated video URL for display
    if (finalVideoUrl) {
      setGeneratedVideoUrl(finalVideoUrl)
      setVideoGenerationStatus('completed')

      // Store metadata for saving later
      setGeneratedVideoMetadata({
        aspectRatio: params.aspectRatio,
        resolution: params.resolution,
        duration: params.duration,
        prompt: params.prompt,
        cameraMovement: params.cameraMovement,
        styledImageUrl: styledImageUrl || null,
        presetId: params.presetId || null,
      })
      console.log('✅ Video URL ready for preview (not saved):', finalVideoUrl)
    }

    return finalVideoUrl
  }

  return {
    generateVideo,
  }
}
