'use client'

import React, { useState, useEffect } from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { TagInput } from '../common/TagInput'
import { FALLBACK_VIBES, FALLBACK_STYLES } from '../types/profile'
import { Palette, Sparkles } from 'lucide-react'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
export function StyleSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()
  
  const [predefinedVibes, setPredefinedVibes] = useState<string[]>(FALLBACK_VIBES)
  const [predefinedStyles, setPredefinedStyles] = useState<string[]>(FALLBACK_STYLES)
  const [loadingPredefined, setLoadingPredefined] = useState(false)

  // Fetch predefined options
  useEffect(() => {
    const fetchPredefinedOptions = async () => {
      setLoadingPredefined(true)
      try {
        // This would fetch from Supabase in a real implementation
        // For now, we'll use the fallback arrays
        setPredefinedVibes(FALLBACK_VIBES)
        setPredefinedStyles(FALLBACK_STYLES)
      } catch (error) {
        console.error('Error fetching predefined options:', error)
      } finally {
        setLoadingPredefined(false)
      }
    }

    fetchPredefinedOptions()
  }, [])

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value)
  }

  const addStyleTag = (tag: string) => {
    const currentTags = formData.style_tags || []
    if (!currentTags.includes(tag)) {
      handleFieldChange('style_tags', [...currentTags, tag])
    }
  }

  const removeStyleTag = (tag: string) => {
    const currentTags = formData.style_tags || []
    handleFieldChange('style_tags', currentTags.filter(t => t !== tag))
  }

  const addVibeTag = (tag: string) => {
    const currentTags = formData.vibe_tags || []
    if (!currentTags.includes(tag)) {
      handleFieldChange('vibe_tags', [...currentTags, tag])
    }
  }

  const removeVibeTag = (tag: string) => {
    const currentTags = formData.vibe_tags || []
    handleFieldChange('vibe_tags', currentTags.filter(t => t !== tag))
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <Palette className="w-5 h-5" />
        Style & Vibe
      </h2>

      {/* Style Tags */}
      <div className="bg-muted rounded-lg p-4">
        <TagInput
          label="Style Tags"
          tags={isEditing ? (formData.style_tags || []) : (profile?.style_tags || [])}
          onAddTag={addStyleTag}
          onRemoveTag={removeStyleTag}
          placeholder="Add a style tag..."
          predefinedOptions={predefinedStyles}
          validationType="talent_category"
          className={isEditing ? '' : 'pointer-events-none'}
        />
        
        <p className="text-sm text-muted-foreground mt-2">
          Add tags that describe your photography style (e.g., Portrait, Fashion, Editorial)
        </p>
      </div>

      {/* Vibe Tags */}
      <div className="bg-muted rounded-lg p-4">
        <TagInput
          label="Vibe Tags"
          tags={isEditing ? (formData.vibe_tags || []) : (profile?.vibe_tags || [])}
          onAddTag={addVibeTag}
          onRemoveTag={removeVibeTag}
          placeholder="Add a vibe tag..."
          predefinedOptions={predefinedVibes}
          validationType="talent_category"
          className={isEditing ? '' : 'pointer-events-none'}
        />
        
        <p className="text-sm text-muted-foreground mt-2">
          Add tags that describe the mood or feeling of your work (e.g., Professional, Creative, Dramatic)
        </p>
      </div>

      {/* Current Tags Display (when not editing) */}
      {!isEditing && (
        <div className="space-y-4">
          {/* Style Tags Display */}
          {(profile?.style_tags && profile.style_tags.length > 0) && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Style Tags</h3>
              <div className="flex flex-wrap gap-2">
                {profile.style_tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vibe Tags Display */}
          {(profile?.vibe_tags && profile.vibe_tags.length > 0) && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Vibe Tags</h3>
              <div className="flex flex-wrap gap-2">
                {profile.vibe_tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {(!profile?.style_tags || profile.style_tags.length === 0) && 
           (!profile?.vibe_tags || profile.vibe_tags.length === 0) && (
            <div className="text-center py-8 text-muted-foreground">
              <Palette className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No style or vibe tags added yet</p>
              <p className="text-sm">Add tags to help clients understand your style</p>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loadingPredefined && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin"></div>
            Loading predefined options...
          </div>
        </div>
      )}
    </div>
  )
}
