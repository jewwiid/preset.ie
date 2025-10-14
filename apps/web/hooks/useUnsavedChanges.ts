import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'

interface UseUnsavedChangesOptions {
  hasUnsavedChanges: boolean
  onSave?: () => void
  onDiscard?: () => void
  storageKey?: string
}

export function useUnsavedChanges({
  hasUnsavedChanges,
  onSave,
  onDiscard,
  storageKey
}: UseUnsavedChangesOptions) {
  const [showWarning, setShowWarning] = useState(false)
  const router = useRouter()

  // Show warning when user tries to navigate away with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault()
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?'
        return e.returnValue
      }
    }

    const handleRouteChange = () => {
      if (hasUnsavedChanges) {
        setShowWarning(true)
        return false
      }
      return true
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    
    // Note: Next.js 13+ App Router doesn't have a direct equivalent to router.events
    // We'll handle this through the component's navigation logic instead

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [hasUnsavedChanges])

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave()
    }
    setShowWarning(false)
  }, [onSave])

  const handleDiscard = useCallback(() => {
    if (onDiscard) {
      onDiscard()
    }
    setShowWarning(false)
  }, [onDiscard])

  const handleContinue = useCallback(() => {
    setShowWarning(false)
  }, [])

  return {
    showWarning,
    handleSave,
    handleDiscard,
    handleContinue
  }
}

// Hook for detecting unsaved changes in forms
export function useFormUnsavedChanges<T extends Record<string, any>>(
  initialData: T,
  currentData: T,
  storageKey?: string
) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Check if data has changed
  useEffect(() => {
    const hasChanges = JSON.stringify(initialData) !== JSON.stringify(currentData)
    setHasUnsavedChanges(hasChanges)
  }, [initialData, currentData])

  // Save to localStorage if storageKey provided
  useEffect(() => {
    if (storageKey && hasUnsavedChanges) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          ...currentData,
          lastSaved: Date.now()
        }))
      } catch (error) {
        console.warn('Failed to save form data:', error)
      }
    }
  }, [currentData, hasUnsavedChanges, storageKey])

  return hasUnsavedChanges
}

// Hook for restoring unsaved changes from localStorage
export function useRestoreUnsavedChanges<T extends Record<string, any>>(
  storageKey: string,
  onRestore: (data: T) => void
) {
  const [showRestorePrompt, setShowRestorePrompt] = useState(false)

  useEffect(() => {
    if (storageKey) {
      try {
        const savedData = localStorage.getItem(storageKey)
        if (savedData) {
          const parsed = JSON.parse(savedData)
          if (Object.keys(parsed).length > 1) { // More than just timestamp
            setShowRestorePrompt(true)
          }
        }
      } catch (error) {
        console.warn('Failed to check for unsaved data:', error)
      }
    }
  }, [storageKey])

  const restoreData = useCallback(() => {
    try {
      const savedData = localStorage.getItem(storageKey)
      if (savedData) {
        const parsed = JSON.parse(savedData)
        onRestore(parsed)
        setShowRestorePrompt(false)
      }
    } catch (error) {
      console.warn('Failed to restore data:', error)
    }
  }, [storageKey, onRestore])

  const clearData = useCallback(() => {
    try {
      localStorage.removeItem(storageKey)
      setShowRestorePrompt(false)
    } catch (error) {
      console.warn('Failed to clear data:', error)
    }
  }, [storageKey])

  return {
    showRestorePrompt,
    restoreData,
    clearData
  }
}
