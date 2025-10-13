/**
 * MoodboardHeader Component
 * Displays title, description inputs and action buttons
 */

'use client'

import { Save, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MoodboardHeaderProps {
  title: string
  description: string
  moodboardId?: string
  loading: boolean
  hasUnsavedChanges: boolean
  compactMode?: boolean
  onTitleChange: (title: string) => void
  onDescriptionChange: (description: string) => void
  onSave: () => void
  onCancel?: () => void
}

export const MoodboardHeader = ({
  title,
  description,
  moodboardId,
  loading,
  hasUnsavedChanges,
  compactMode = false,
  onTitleChange,
  onDescriptionChange,
  onSave,
  onCancel
}: MoodboardHeaderProps) => {
  if (compactMode) {
    return (
      <div className="bg-card rounded-lg border border-border shadow-sm p-5">
        <h3 className="text-lg font-semibold text-foreground mb-4">Moodboard Details</h3>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Moodboard Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
              placeholder="Enter a title for your moodboard"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => onDescriptionChange(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors resize-none"
              placeholder="Describe the vibe or concept..."
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-foreground">
          {moodboardId ? 'Edit Moodboard' : 'Create Moodboard'}
        </h2>

        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground mr-2">
              Unsaved changes
            </span>
          )}

          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          )}

          <Button
            type="button"
            onClick={onSave}
            disabled={loading || !title.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Moodboard
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors"
            placeholder="Enter a title for your moodboard"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring transition-colors resize-none"
            placeholder="Describe the vibe, concept, or inspiration for this moodboard..."
          />
        </div>
      </div>
    </div>
  )
}
