/**
 * Hook for managing playground core state
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type {
  PlaygroundProject,
  ActivePreset,
  FullScreenMedia,
  VideoGenerationStatus,
  VideoMetadata,
} from '../types'

interface UsePlaygroundStateReturn {
  // Project state
  currentProject: PlaygroundProject | null
  setCurrentProject: (project: PlaygroundProject | null) => void

  // Image state
  selectedImage: string | null
  setSelectedImage: (url: string | null) => void
  savingImage: string | null
  setSavingImage: (url: string | null) => void

  // UI state
  loading: boolean
  setLoading: (loading: boolean) => void
  activeTab: string
  setActiveTab: (tab: string) => void
  fullScreenImage: FullScreenMedia | null
  setFullScreenImage: (media: FullScreenMedia | null) => void

  // Preset state
  activePreset: ActivePreset | null
  setActivePreset: (preset: ActivePreset | null) => void
  clearPreset: () => void

  // Batch state
  activeBatchJobId: string | null
  setActiveBatchJobId: (id: string | null) => void
  batchResults: any[]
  setBatchResults: (results: any[]) => void

  // Video state
  videoGenerationStatus: VideoGenerationStatus
  setVideoGenerationStatus: (status: VideoGenerationStatus) => void
  generatedVideoUrl: string | null
  setGeneratedVideoUrl: (url: string | null) => void
  generatedVideoMetadata: VideoMetadata | null
  setGeneratedVideoMetadata: (metadata: VideoMetadata | null) => void

  // Prompt state
  currentPrompt: string
  setCurrentPrompt: (prompt: string) => void
}

export function usePlaygroundState(): UsePlaygroundStateReturn {
  const searchParams = useSearchParams()

  // Project state
  const [currentProject, setCurrentProject] = useState<PlaygroundProject | null>(null)

  // Image state
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [savingImage, setSavingImage] = useState<string | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('generate')
  const [fullScreenImage, setFullScreenImage] = useState<FullScreenMedia | null>(null)

  // Preset state
  const [activePreset, setActivePreset] = useState<ActivePreset | null>(null)

  // Batch state
  const [activeBatchJobId, setActiveBatchJobId] = useState<string | null>(null)
  const [batchResults, setBatchResults] = useState<any[]>([])

  // Video state
  const [videoGenerationStatus, setVideoGenerationStatus] = useState<VideoGenerationStatus>('idle')
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null)
  const [generatedVideoMetadata, setGeneratedVideoMetadata] = useState<VideoMetadata | null>(null)

  // Prompt state
  const [currentPrompt, setCurrentPrompt] = useState('')

  // Read URL parameters for preset
  useEffect(() => {
    const presetId = searchParams?.get('preset')
    const presetName = searchParams?.get('name')

    if (presetId && presetName) {
      setActivePreset({
        id: presetId,
        name: decodeURIComponent(presetName),
      })
    }
  }, [searchParams])

  const clearPreset = () => {
    setActivePreset(null)
    window.history.replaceState({}, '', '/playground')
  }

  return {
    // Project state
    currentProject,
    setCurrentProject,

    // Image state
    selectedImage,
    setSelectedImage,
    savingImage,
    setSavingImage,

    // UI state
    loading,
    setLoading,
    activeTab,
    setActiveTab,
    fullScreenImage,
    setFullScreenImage,

    // Preset state
    activePreset,
    setActivePreset,
    clearPreset,

    // Batch state
    activeBatchJobId,
    setActiveBatchJobId,
    batchResults,
    setBatchResults,

    // Video state
    videoGenerationStatus,
    setVideoGenerationStatus,
    generatedVideoUrl,
    setGeneratedVideoUrl,
    generatedVideoMetadata,
    setGeneratedVideoMetadata,

    // Prompt state
    currentPrompt,
    setCurrentPrompt,
  }
}
