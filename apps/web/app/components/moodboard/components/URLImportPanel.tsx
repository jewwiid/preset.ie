/**
 * URLImportPanel Component
 * Import images from external URLs
 */

'use client'

import { Link as LinkIcon, Loader2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useState } from 'react'

interface URLImportPanelProps {
  onImport: (url: string) => void
  loading?: boolean
}

export const URLImportPanel = ({ onImport, loading = false }: URLImportPanelProps) => {
  const [urlInput, setUrlInput] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleImport = () => {
    setError(null)

    // Validate URL
    if (!urlInput.trim()) {
      setError('Please enter a URL')
      return
    }

    try {
      const url = new URL(urlInput)
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        setError('URL must start with http:// or https://')
        return
      }

      onImport(urlInput.trim())
      setUrlInput('')
    } catch (err) {
      setError('Invalid URL format')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleImport()
    }
  }

  return (
    <div className="space-y-4">
      {/* URL Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="url"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value)
              setError(null)
            }}
            onKeyPress={handleKeyPress}
            className={`w-full pl-10 pr-3 py-2 border rounded-md bg-background text-foreground focus:outline-none focus:ring-2 transition-colors ${
              error
                ? 'border-destructive focus:ring-destructive'
                : 'border-input focus:ring-ring focus:border-ring'
            }`}
            placeholder="https://example.com/image.jpg"
            disabled={loading}
          />
        </div>
        <Button
          type="button"
          onClick={handleImport}
          disabled={loading || !urlInput.trim()}
        >
          {loading ? (
            <>
              <LoadingSpinner size="sm" />
              Importing...
            </>
          ) : (
            <>
              <LinkIcon className="w-4 h-4 mr-2" />
              Import
            </>
          )}
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Info */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground">Import Tips</p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
              <li>• Enter the direct URL to an image file</li>
              <li>• Make sure the image is publicly accessible</li>
              <li>• Supported formats: JPEG, PNG, WebP, GIF</li>
              <li>• The image will be displayed at its original size</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
