/**
 * Helper functions for video generation and handling
 */

import type { Session } from '@supabase/supabase-js'
import type { VideoMetadata, VideoStatusResponse, PlaygroundProject } from '../types'
import { VIDEO_POLLING_CONFIG, API_ENDPOINTS } from '../constants/playgroundConfig'
import { createAuthHeaders } from './apiHelpers'

/**
 * Poll for video completion status
 */
export async function pollForVideoCompletion(
  taskId: string,
  session: Session | null
): Promise<string | null> {
  if (!session?.access_token) {
    throw new Error('No session token available for video polling')
  }

  const maxAttempts = VIDEO_POLLING_CONFIG.MAX_ATTEMPTS
  let attempts = 0

  while (attempts < maxAttempts) {
    try {
      const response = await fetch(`${API_ENDPOINTS.VIDEO_STATUS}/${taskId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Video status check failed:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
          taskId,
          url: `${API_ENDPOINTS.VIDEO_STATUS}/${taskId}`,
        })
        throw new Error(`Failed to check video status: ${response.status} ${response.statusText}`)
      }

      const result: VideoStatusResponse = await response.json()
      console.log('Video status check:', {
        status: result.status,
        videoUrl: result.videoUrl,
        attempt: attempts + 1,
      })

      if (result.status === 'completed' && result.videoUrl) {
        console.log('Video generation completed successfully:', result.videoUrl)
        return result.videoUrl
      } else if (result.status === 'failed') {
        console.error('Video generation failed:', result.error)
        throw new Error(result.error || 'Video generation failed')
      }

      // Still processing, wait before next check
      await new Promise((resolve) => setTimeout(resolve, VIDEO_POLLING_CONFIG.POLL_INTERVAL_MS))
      attempts++
    } catch (error) {
      console.error('Error polling for video completion:', error)
      throw error
    }
  }

  throw new Error(VIDEO_POLLING_CONFIG.TIMEOUT_MESSAGE)
}

/**
 * Generate video metadata for saving
 */
export function buildVideoMetadata(
  videoMetadata: VideoMetadata | null,
  project: PlaygroundProject | null
): any {
  const promptTitle = project?.prompt
    ? project.prompt.length > 50
      ? project.prompt.substring(0, 50) + '...'
      : project.prompt
    : 'AI-generated video'

  return {
    title: promptTitle,
    description: `AI-generated video: ${project?.prompt || 'AI-generated video'}`,
    tags: ['ai-generated', 'video'],
    duration: videoMetadata?.duration || 5,
    resolution: videoMetadata?.resolution || '480p',
    aspectRatio: project?.aspect_ratio || videoMetadata?.aspectRatio || '1:1',
    cameraMovement: videoMetadata?.cameraMovement || 'smooth',
    prompt: project?.prompt || videoMetadata?.prompt || 'AI-generated video',
    generationMetadata: {
      generated_at: new Date().toISOString(),
      credits_used: 8,
      duration: videoMetadata?.duration || 5,
      resolution: videoMetadata?.resolution || '480p',
      aspect_ratio: project?.aspect_ratio || videoMetadata?.aspectRatio || '1:1',
      camera_movement: videoMetadata?.cameraMovement || 'smooth',
      image_url: null,
      task_id: null,
      prompt: project?.prompt || videoMetadata?.prompt || 'AI-generated video',
      style: project?.style || 'realistic',
      consistency_level: project?.metadata?.consistency_level || 'high',
      preset_id: videoMetadata?.presetId || null,
    },
  }
}

/**
 * Create video save payload
 */
export function createVideoSavePayload(
  videoUrl: string,
  videoMetadata: VideoMetadata | null,
  project: PlaygroundProject | null
): any {
  return {
    videoUrl,
    ...buildVideoMetadata(videoMetadata, project),
  }
}
