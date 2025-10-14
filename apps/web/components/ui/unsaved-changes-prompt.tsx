import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UnsavedChangesPromptProps {
  isVisible: boolean
  onRestore: () => void
  onDiscard: () => void
  onDismiss?: () => void
  title?: string
  description?: string
  restoreText?: string
  discardText?: string
}

export function UnsavedChangesPrompt({
  isVisible,
  onRestore,
  onDiscard,
  onDismiss,
  title = "Unsaved Changes Found",
  description = "You have unsaved changes from a previous session. Would you like to restore them?",
  restoreText = "Restore Changes",
  discardText = "Discard & Start Fresh"
}: UnsavedChangesPromptProps) {
  if (!isVisible) return null

  return (
    <div className="mb-6 bg-muted/50 border border-border rounded-lg p-4">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-primary mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {description}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={onRestore}
              size="sm"
            >
              {restoreText}
            </Button>
            <Button
              onClick={onDiscard}
              variant="outline"
              size="sm"
            >
              {discardText}
            </Button>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}

// Alternative version with different styling
export function UnsavedChangesPromptCard({
  isVisible,
  onRestore,
  onDiscard,
  onDismiss,
  title = "Unsaved Changes Found",
  description = "You have unsaved changes from a previous session. Would you like to restore them?",
  restoreText = "Restore Changes",
  discardText = "Discard & Start Fresh"
}: UnsavedChangesPromptProps) {
  if (!isVisible) return null

  return (
    <div className="mb-6 bg-card border border-border rounded-lg p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground mb-1">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {description}
          </p>
          <div className="flex gap-2">
            <Button
              onClick={onRestore}
              size="sm"
            >
              {restoreText}
            </Button>
            <Button
              onClick={onDiscard}
              variant="outline"
              size="sm"
            >
              {discardText}
            </Button>
          </div>
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
