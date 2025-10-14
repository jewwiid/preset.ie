/**
 * ImageUploadPanel Component
 * Drag-and-drop file upload interface
 */

'use client'

import { Upload, Loader2, CheckCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { formatFileSize } from '../lib/moodboardHelpers'

interface ImageUploadPanelProps {
  uploading: boolean
  uploadProgress: number
  fileInputRef: React.RefObject<HTMLInputElement | null>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  onDrop?: (e: React.DragEvent) => void
  onDragOver?: (e: React.DragEvent) => void
  maxFileSize?: number
  acceptedFormats?: string[]
}

export const ImageUploadPanel = ({
  uploading,
  uploadProgress,
  fileInputRef,
  onFileSelect,
  onDrop,
  onDragOver,
  maxFileSize = 10,
  acceptedFormats = ['JPEG', 'PNG', 'WebP', 'GIF']
}: ImageUploadPanelProps) => {
  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${
            uploading
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary hover:bg-primary/5 cursor-pointer'
          }
        `}
        onClick={() => !uploading && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={onFileSelect}
          className="hidden"
          disabled={uploading}
        />

        {uploading ? (
          <div className="space-y-3">
            <LoadingSpinner size="xl" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Uploading files...
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {uploadProgress}% complete
              </p>
            </div>
            <div className="w-full bg-muted rounded-full h-2 max-w-xs mx-auto">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">
                Drop files here or click to browse
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Supports {acceptedFormats.join(', ')} • Max {maxFileSize}MB per file
              </p>
            </div>
            <Button type="button" variant="outline" size="sm">
              <Upload className="w-4 h-4 mr-2" />
              Choose Files
            </Button>
          </div>
        )}
      </div>

      {/* Upload Info */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-medium text-foreground">
              Upload Tips
            </p>
            <ul className="text-xs text-muted-foreground mt-1 space-y-1">
              <li>• Select multiple files at once for bulk upload</li>
              <li>• Images are automatically compressed for optimal performance</li>
              <li>• Supported formats: {acceptedFormats.join(', ')}</li>
              <li>• Maximum file size: {maxFileSize}MB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
