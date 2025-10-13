/**
 * Custom hook for managing moodboard items
 * Handles adding, removing, reordering, and featured image selection
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth-context'
import { MoodboardItem } from '../lib/moodboardTypes'
import { reindexItemPositions } from '../lib/moodboardHelpers'

interface UseMoodboardItemsProps {
  initialItems?: MoodboardItem[]
  moodboardId?: string
  onFeaturedImageChange?: (imageUrl: string | null) => void
}

interface UseMoodboardItemsReturn {
  // State
  items: MoodboardItem[]
  featuredImageId: string | null
  draggedItem: number | null
  isSavingPositions: boolean

  // Operations
  addItem: (item: Omit<MoodboardItem, 'position'>) => void
  removeItem: (itemId: string) => void
  updateItem: (itemId: string, updates: Partial<MoodboardItem>) => void
  setFeaturedImage: (itemId: string) => void
  reorderItems: (newItems: MoodboardItem[]) => void

  // Drag and drop
  handleDragStart: (e: React.DragEvent, index: number) => void
  handleDragOver: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent, dropIndex: number) => void

  // Batch operations
  setItems: React.Dispatch<React.SetStateAction<MoodboardItem[]>>
  clearFeaturedImage: () => void
}

export const useMoodboardItems = ({
  initialItems = [],
  moodboardId,
  onFeaturedImageChange
}: UseMoodboardItemsProps): UseMoodboardItemsReturn => {
  const { user } = useAuth()

  const [items, setItems] = useState<MoodboardItem[]>(initialItems)
  const [featuredImageId, setFeaturedImageId] = useState<string | null>(null)
  const [draggedItem, setDraggedItem] = useState<number | null>(null)
  const [isSavingPositions, setIsSavingPositions] = useState(false)

  // Update items when initialItems change
  useEffect(() => {
    if (initialItems.length > 0) {
      setItems(initialItems)
    }
  }, [initialItems])

  // Notify parent component when featured image changes
  useEffect(() => {
    if (onFeaturedImageChange && featuredImageId) {
      const featuredItem = items.find(item => item.id === featuredImageId)
      if (featuredItem) {
        onFeaturedImageChange(featuredItem.url || featuredItem.thumbnail_url || null)
      }
    } else if (onFeaturedImageChange && !featuredImageId) {
      onFeaturedImageChange(null)
    }
  }, [featuredImageId, items, onFeaturedImageChange])

  /**
   * Add a new item to the moodboard
   */
  const addItem = useCallback((item: Omit<MoodboardItem, 'position'>) => {
    setItems(prev => {
      const newItem: MoodboardItem = {
        ...item,
        position: prev.length
      } as MoodboardItem
      return [...prev, newItem]
    })
  }, [])

  /**
   * Remove an item from the moodboard
   */
  const removeItem = useCallback((itemId: string) => {
    setItems(prev => {
      const filtered = prev.filter(item => item.id !== itemId)
      return reindexItemPositions(filtered)
    })

    // Clear featured image if removing the featured item
    if (featuredImageId === itemId) {
      setFeaturedImageId(null)
      onFeaturedImageChange?.(null)
    }
  }, [featuredImageId, onFeaturedImageChange])

  /**
   * Update an existing item
   */
  const updateItem = useCallback((itemId: string, updates: Partial<MoodboardItem>) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, ...updates } : item
    ))
  }, [])

  /**
   * Set an item as the featured image
   */
  const setFeaturedImage = useCallback((itemId: string) => {
    setFeaturedImageId(itemId)
  }, [])

  /**
   * Clear featured image
   */
  const clearFeaturedImage = useCallback(() => {
    setFeaturedImageId(null)
    onFeaturedImageChange?.(null)
  }, [onFeaturedImageChange])

  /**
   * Reorder items after drag and drop
   */
  const reorderItems = useCallback((newItems: MoodboardItem[]) => {
    const reindexed = reindexItemPositions(newItems)
    setItems(reindexed)

    // Optionally save positions to database immediately
    if (moodboardId && user) {
      saveMoodboardPositions(reindexed)
    }
  }, [moodboardId, user])

  /**
   * Save item positions to database
   */
  const saveMoodboardPositions = async (reorderedItems: MoodboardItem[]) => {
    if (!user || !moodboardId) return

    setIsSavingPositions(true)

    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const { error } = await supabase
        .from('moodboards')
        .update({
          items: reorderedItems,
          updated_at: new Date().toISOString()
        })
        .eq('id', moodboardId)

      if (error) throw error
      console.log('Item positions saved successfully')
    } catch (err) {
      console.error('Error saving positions:', err)
    } finally {
      setIsSavingPositions(false)
    }
  }

  /**
   * Handle drag start event
   */
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedItem(index)
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  /**
   * Handle drag over event
   */
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }, [])

  /**
   * Handle drop event
   */
  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (draggedItem === null) return

    setItems(prev => {
      const newItems = [...prev]
      const [removed] = newItems.splice(draggedItem, 1)
      newItems.splice(dropIndex, 0, removed)
      return reindexItemPositions(newItems)
    })

    setDraggedItem(null)

    // Save positions if moodboard exists
    if (moodboardId && user) {
      const newItems = [...items]
      const [removed] = newItems.splice(draggedItem, 1)
      newItems.splice(dropIndex, 0, removed)
      saveMoodboardPositions(reindexItemPositions(newItems))
    }
  }, [draggedItem, items, moodboardId, user])

  return {
    // State
    items,
    featuredImageId,
    draggedItem,
    isSavingPositions,

    // Operations
    addItem,
    removeItem,
    updateItem,
    setFeaturedImage,
    reorderItems,
    clearFeaturedImage,

    // Drag and drop
    handleDragStart,
    handleDragOver,
    handleDrop,

    // Direct setters for special cases
    setItems
  }
}
