/**
 * Hook for image generation operations
 */

import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import type {
  GenerateImagesParams,
  AdvancedEditParams,
  SequentialImagesParams,
  SequentialEditsParams,
  StyleVariationsParams,
  BatchEditParams,
  PlaygroundProject,
  GenerateImagesResponse,
  AdvancedEditResponse,
  BatchJobResponse,
} from '../types'
import {
  validateSession,
  createAuthHeaders,
  handleAPIResponse,
  logSessionDebug,
  APIError,
} from '../lib/apiHelpers'
import { API_ENDPOINTS } from '../constants/playgroundConfig'
import { createImageEntry, replaceImagesInProject, addImageToProject } from '../lib/imageHelpers'
import { supabase } from '../../../lib/supabase'

interface UseImageGenerationReturn {
  generateImages: (params: GenerateImagesParams) => Promise<GenerateImagesResponse>
  performAdvancedEdit: (params: AdvancedEditParams) => Promise<string>
  generateSequentialImages: (params: SequentialImagesParams) => Promise<void>
  generateSequentialEdits: (params: SequentialEditsParams) => Promise<void>
  generateStyleVariations: (params: StyleVariationsParams) => Promise<BatchJobResponse>
  performBatchEdit: (params: BatchEditParams) => Promise<BatchJobResponse>
}

export function useImageGeneration(
  session: Session | null,
  currentProject: PlaygroundProject | null,
  setCurrentProject: (project: PlaygroundProject | null) => void,
  setCurrentPrompt: (prompt: string) => void,
  setSelectedImage: (url: string | null) => void,
  userId?: string,
  userEmail?: string
): UseImageGenerationReturn {
  const generateImages = async (params: GenerateImagesParams): Promise<GenerateImagesResponse> => {
    setCurrentPrompt(params.prompt)

    // Clear previous generated images when starting new generation
    if (currentProject) {
      setCurrentProject(
        replaceImagesInProject(currentProject, [], 'base')
      )
    }

    // Clear selected image if it was a generated image
    if (
      selectedImage &&
      currentProject?.generated_images.find(
        (img) => img.url === selectedImage && img.type !== 'base'
      )
    ) {
      setSelectedImage(null)
    }

    logSessionDebug(session, userId, userEmail)
    validateSession(session)

    const response = await fetch(API_ENDPOINTS.GENERATE, {
      method: 'POST',
      headers: createAuthHeaders(session!.access_token),
      body: JSON.stringify({
        ...params,
        maxImages: params.numImages,
        projectId: currentProject?.id,
        baseImage: params.baseImage,
        generationMode: params.generationMode,
        customStylePreset: params.customStylePreset,
        intensity: params.intensity,
        cinematicParameters: params.cinematicParameters,
        enhancedPrompt: params.enhancedPrompt,
        includeTechnicalDetails: params.includeTechnicalDetails,
        includeStyleReferences: params.includeStyleReferences,
        replaceLatestImages: params.replaceLatestImages ?? true,
        userSubject: params.userSubject,
      }),
    })

    if (!response.ok) {
      throw await parseGenerationError(response)
    }

    const data: GenerateImagesResponse = await response.json()
    console.log('🔍 Generated Images Debug:', {
      projectId: data.project.id,
      generatedImages: data.project.generated_images,
      imagesLength: data.project.generated_images?.length,
      images: data.images,
      responseImagesLength: data.images?.length,
    })
    console.log('🔍 Project Metadata Debug:', {
      hasMetadata: !!data.project.metadata,
      hasCustomStylePreset: !!data.project.metadata?.custom_style_preset,
      customStylePreset: data.project.metadata?.custom_style_preset,
      style: data.project.style,
    })

    setCurrentProject(data.project)
    return data
  }

  const performAdvancedEdit = async (params: AdvancedEditParams): Promise<string> => {
    console.log('🔍 Advanced Edit Debug:', {
      session: !!session,
      access_token: session?.access_token ? 'Present' : 'Missing',
      userId,
      sessionExpiresAt: session?.expires_at
        ? new Date(session.expires_at * 1000).toLocaleString()
        : 'Unknown',
    })

    validateSession(session)

    // Check if session is expired and try to refresh
    if (session!.expires_at && new Date(session!.expires_at * 1000) < new Date()) {
      console.log('🔄 Session expired, attempting refresh...')
      try {
        if (!supabase) {
          throw new Error('Supabase client not available')
        }
        const {
          data: { session: refreshedSession },
          error,
        } = await supabase.auth.refreshSession()
        if (error || !refreshedSession) {
          throw new Error('Session expired and refresh failed. Please sign in again.')
        }
        console.log('✅ Session refreshed successfully')
        session = refreshedSession
      } catch (refreshError) {
        throw new Error('Session expired and refresh failed. Please sign in again.')
      }
    }

    const response = await fetch(API_ENDPOINTS.ADVANCED_EDIT, {
      method: 'POST',
      headers: createAuthHeaders(session!.access_token),
      body: JSON.stringify({
        ...params,
        projectId: currentProject?.id,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to edit image')
    }

    const { editedImage, creditsUsed }: AdvancedEditResponse = await response.json()
    console.log('Advanced edit completed:', { editedImage, creditsUsed })

    // Add edited image to project
    if (currentProject) {
      const newImageEntry = createImageEntry(editedImage, 'edit')

      const updatedProject = addImageToProject(currentProject, newImageEntry)

      console.log('🔍 Advanced Edit Debug - Before Update:', {
        currentProjectImages: currentProject.generated_images.length,
        editedImageUrl: editedImage,
        newImageEntry,
        updatedProjectImages: updatedProject.generated_images.length,
      })

      setCurrentProject(updatedProject)
      setSelectedImage(editedImage)
    }

    return editedImage
  }

  const generateSequentialImages = async (params: SequentialImagesParams): Promise<void> => {
    setCurrentPrompt(params.prompt)
    validateSession(session)

    const response = await fetch(API_ENDPOINTS.GENERATE, {
      method: 'POST',
      headers: createAuthHeaders(session!.access_token),
      body: JSON.stringify({
        prompt: params.prompt,
        style: params.style,
        aspectRatio: '1:1',
        resolution: params.resolution,
        maxImages: params.numImages,
        enableSyncMode: true,
        enableBase64Output: false,
        projectId: currentProject?.id,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate sequential images')
    }

    const { project }: GenerateImagesResponse = await response.json()
    setCurrentProject(project)
  }

  const generateSequentialEdits = async (params: SequentialEditsParams): Promise<void> => {
    validateSession(session)

    const response = await fetch(API_ENDPOINTS.SEQUENTIAL, {
      method: 'POST',
      headers: createAuthHeaders(session!.access_token),
      body: JSON.stringify({
        ...params,
        projectId: currentProject?.id,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate sequential edits')
    }

    const { project }: GenerateImagesResponse = await response.json()
    setCurrentProject(project)
  }

  const generateStyleVariations = async (
    params: StyleVariationsParams
  ): Promise<BatchJobResponse> => {
    validateSession(session)

    const response = await fetch(API_ENDPOINTS.STYLE_VARIATIONS, {
      method: 'POST',
      headers: createAuthHeaders(session!.access_token),
      body: JSON.stringify({
        ...params,
        projectId: currentProject?.id,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to generate style variations')
    }

    return response.json()
  }

  const performBatchEdit = async (params: BatchEditParams): Promise<BatchJobResponse> => {
    validateSession(session)

    const response = await fetch(API_ENDPOINTS.BATCH_EDIT, {
      method: 'POST',
      headers: createAuthHeaders(session!.access_token),
      body: JSON.stringify({
        ...params,
        projectId: currentProject?.id,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to perform batch editing')
    }

    return response.json()
  }

  return {
    generateImages,
    performAdvancedEdit,
    generateSequentialImages,
    generateSequentialEdits,
    generateStyleVariations,
    performBatchEdit,
  }
}

async function parseGenerationError(response: Response): Promise<APIError> {
  let errorData: any
  try {
    errorData = await response.json()
  } catch (parseError) {
    console.error('Failed to parse error response:', parseError)
    throw new APIError(
      `Server error (${response.status}): ${response.statusText}`,
      'Server Error'
    )
  }

  console.log('API Error Response:', {
    status: response.status,
    errorData,
  })

  const errorMessage = errorData.error || 'Failed to generate images'
  return new APIError(errorMessage, 'Generation Failed', response.status)
}

let selectedImage: string | null = null
