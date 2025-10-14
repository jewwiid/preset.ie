/**
 * Custom hook for managing moodboard data operations (CRUD)
 * Handles fetching, creating, and updating moodboards
 */

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { Moodboard, MoodboardItem } from '../lib/moodboardTypes'
import { sortItemsByPosition } from '../lib/moodboardHelpers'
import { toast } from 'sonner'

interface UseMoodboardDataProps {
  moodboardId?: string
  gigId?: string
}

interface UseMoodboardDataReturn {
  // State
  moodboard: Partial<Moodboard> | null
  loading: boolean
  error: string | null
  success: string | null
  hasUnsavedChanges: boolean

  // Data setters
  setTitle: (title: string) => void
  setDescription: (description: string) => void
  setTags: (tags: string[]) => void
  setPalette: (palette: string[]) => void
  setIsPublic: (isPublic: boolean) => void
  setSaveAsTemplate: (save: boolean) => void
  setTemplateName: (name: string) => void
  setFeaturedImageId: (id: string | null) => void

  // Operations
  saveMoodboard: (items: MoodboardItem[], featuredImageId?: string | null) => Promise<string | undefined>
  fetchMoodboard: () => Promise<void>
  setHasUnsavedChanges: (hasChanges: boolean) => void
  clearError: () => void
  clearSuccess: () => void
}

export const useMoodboardData = ({
  moodboardId,
  gigId
}: UseMoodboardDataProps): UseMoodboardDataReturn => {
  const { user } = useAuth()

  // Moodboard data state
  const [moodboard, setMoodboard] = useState<Partial<Moodboard> | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [palette, setPalette] = useState<string[]>([])
  const [isPublic, setIsPublic] = useState(false)
  const [saveAsTemplate, setSaveAsTemplate] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null)
  const [existingTemplate, setExistingTemplate] = useState<any>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Sync template name with moodboard title
  useEffect(() => {
    if (title && !templateName) {
      setTemplateName(title)
    }
  }, [title, templateName])

  /**
   * Fetch existing moodboard data
   */
  const fetchMoodboard = async () => {
    if (!moodboardId || !user) return

    console.log('Loading existing moodboard:', moodboardId)
    setLoading(true)
    setError(null)

    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('moodboards')
        .select('*')
        .eq('id', moodboardId)
        .single()

      if (fetchError) throw fetchError

      if (data) {
        console.log('Loaded moodboard data:', data)

        // Update state
        setTitle(data.title || '')
        setDescription(data.summary || data.description || '')
        setPalette(data.palette || [])
        setTags(data.tags || [])
        setIsPublic(data.is_public || false)
        setSaveAsTemplate(data.is_template || false)
        setTemplateName(data.template_name || '')
        setFeaturedImageId(data.featured_image_id || null)

        // Sort items by position
        const sortedItems = data.items ? sortItemsByPosition(data.items) : []

        setMoodboard({
          ...data,
          items: sortedItems
        })

        console.log('Loading items from database:', sortedItems.length, 'items')
        const itemsWithEnhanced = sortedItems.filter((item: MoodboardItem) => item.enhanced_url)
        console.log('Items with enhanced URLs:', itemsWithEnhanced)
      }
    } catch (err: any) {
      console.error('Error loading moodboard:', err)
      setError('Failed to load moodboard')
    } finally {
      setLoading(false)
    }
  }

  /**
   * Check for similar templates to avoid duplication
   */
  const checkForSimilarTemplates = async (name: string) => {
    if (!supabase || !user || !name.trim()) return null

    try {
      const { data, error } = await supabase
        .from('moodboards')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_template', true)
        .ilike('template_name', `%${name}%`)

      if (error) throw error
      return data
    } catch (err) {
      console.error('Error checking templates:', err)
      return null
    }
  }

  /**
   * Save moodboard (create or update)
   */
  const saveMoodboard = async (items: MoodboardItem[], featuredImageId?: string | null): Promise<string | undefined> => {
    if (!user) {
      setError('Please sign in to save your moodboard')
      return
    }

    console.log('Saving moodboard with items:', items)
    const enhancedItems = items.filter(i => i.enhanced_url)
    console.log('Enhanced items being saved:', enhancedItems)
    console.log('Item IDs being saved:', items.map(item => ({ id: item.id, type: typeof item.id })))

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (!supabase) {
        setError('Database connection not available. Please try again.')
        return
      }

      // Get user profile ID
      const { data: profile } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (!profile) throw new Error('Profile not found')

      if (moodboardId) {
        // Debug: Log the featuredImageId being saved
        console.log('Saving featured_image_id:', featuredImageId, 'Type:', typeof featuredImageId)
        
        // Update existing moodboard
        const { error: updateError } = await supabase
          .from('moodboards')
          .update({
            title: title || 'Untitled Moodboard',
            summary: description,
            items,
            palette,
            tags,
            featured_image_id: featuredImageId,
            is_public: isPublic,
            updated_at: new Date().toISOString()
          })
          .eq('id', moodboardId)

        if (updateError) throw updateError
        console.log('Moodboard updated successfully with enhanced items')
        setSuccess('Moodboard updated successfully!')
        setHasUnsavedChanges(false)
        toast.success('Moodboard updated!', {
          description: 'Your changes have been saved'
        })
        return moodboardId
      } else {
        // Handle template saving with deduplication
        if (saveAsTemplate && existingTemplate?.shouldUpdate) {
          // Update existing similar template
          const { error: updateError } = await supabase
            .from('moodboards')
            .update({
              title: title || 'Untitled Moodboard',
              summary: description,
              items,
              palette,
              tags,
              featured_image_id: featuredImageId,
              template_name: templateName || title || 'Untitled Template',
              template_description: description,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingTemplate.id)

          if (updateError) throw updateError
          console.log('Existing template updated successfully')
          setSuccess('Template updated successfully!')
          setHasUnsavedChanges(false)
          toast.success('Template updated!', {
            description: 'Your template has been saved'
          })
          return existingTemplate.id
        } else {
          // Create new moodboard/template
          const moodboardData: any = {
            owner_user_id: profile.id,
            title: title || 'Untitled Moodboard',
            summary: description,
            items,
            palette,
            tags,
            featured_image_id: featuredImageId,
            is_template: saveAsTemplate,
            template_name: saveAsTemplate ? (templateName || title || 'Untitled Template') : null,
            template_description: saveAsTemplate ? description : null,
            is_public: isPublic
          }

          // Only include gig_id if it's a valid UUID (not a temporary ID) and not saving as template
          if (!saveAsTemplate && gigId && !gigId.startsWith('temp-') && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gigId)) {
            moodboardData.gig_id = gigId
          }

          const { data: newMoodboard, error: createError } = await supabase
            .from('moodboards')
            .insert(moodboardData)
            .select()
            .single()

          if (createError) throw createError
          console.log(saveAsTemplate ? 'New template created successfully' : 'New moodboard created successfully')
          setSuccess(saveAsTemplate ? 'Template saved successfully!' : 'Moodboard saved successfully!')
          setHasUnsavedChanges(false)
          toast.success(saveAsTemplate ? 'Template saved!' : 'Moodboard saved!', {
            description: saveAsTemplate ? 'Your template is ready to use' : 'Your moodboard has been created'
          })
          return newMoodboard.id
        }
      }
    } catch (err: any) {
      console.error('Save error:', err)
      console.error('Error details:', {
        message: err.message,
        code: err.code,
        details: err.details,
        hint: err.hint,
        stack: err.stack
      })

      // Provide more specific error messages
      let errorMessage = 'Failed to save moodboard'

      if (err.code === '23502') {
        errorMessage = 'Database constraint error. Please run the latest migrations.'
      } else if (err.code === '23503') {
        errorMessage = 'Invalid reference. Please ensure your profile is complete.'
      } else if (err.message) {
        errorMessage = err.message
      }

      setError(errorMessage)
      toast.error('Save failed', {
        description: errorMessage
      })
      return undefined
    } finally {
      setLoading(false)
    }
  }

  // Load moodboard on mount if editing
  useEffect(() => {
    if (moodboardId) {
      fetchMoodboard()
    }
  }, [moodboardId, user])

  return {
    // State
    moodboard,
    loading,
    error,
    success,
    hasUnsavedChanges,

    // Data setters with change tracking
    setTitle: (newTitle: string) => {
      setTitle(newTitle)
      setHasUnsavedChanges(true)
    },
    setDescription: (newDescription: string) => {
      setDescription(newDescription)
      setHasUnsavedChanges(true)
    },
    setTags: (newTags: string[]) => {
      setTags(newTags)
      setHasUnsavedChanges(true)
    },
    setPalette: (newPalette: string[]) => {
      setPalette(newPalette)
      setHasUnsavedChanges(true)
    },
    setIsPublic,
    setSaveAsTemplate,
    setTemplateName,
    setFeaturedImageId,

    // Operations
    saveMoodboard,
    fetchMoodboard,
    setHasUnsavedChanges,
    clearError: () => setError(null),
    clearSuccess: () => setSuccess(null)
  }
}
