import * as React from "react"
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

import { LoadingSpinner } from '@/components/ui/loading-spinner';
export interface ImageUploadProps {
  value?: File[]
  onChange?: (files: File[]) => void
  maxFiles?: number
  maxSize?: number // in MB
  accept?: string
  disabled?: boolean
  className?: string
}

const ImageUpload = React.forwardRef<HTMLInputElement, ImageUploadProps>(
  ({ 
    value = [], 
    onChange, 
    maxFiles = 10, 
    maxSize = 5, 
    accept = "image/*", 
    disabled,
    className 
  }, ref) => {
    const [dragActive, setDragActive] = React.useState(false)
    const [uploading, setUploading] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleFiles = (files: FileList | File[]) => {
      const fileArray = Array.from(files)
      const validFiles: File[] = []
      const errors: string[] = []

      fileArray.forEach(file => {
        // Check file type
        if (!file.type.startsWith('image/')) {
          errors.push(`${file.name} is not a valid image file`)
          return
        }

        // Check file size
        if (file.size > maxSize * 1024 * 1024) {
          errors.push(`${file.name} is larger than ${maxSize}MB`)
          return
        }

        // Check total file count
        if (value.length + validFiles.length >= maxFiles) {
          errors.push(`Maximum ${maxFiles} files allowed`)
          return
        }

        validFiles.push(file)
      })

      if (errors.length > 0) {
        errors.forEach(error => toast.error(error))
      }

      if (validFiles.length > 0) {
        const newFiles = [...value, ...validFiles].slice(0, maxFiles)
        onChange?.(newFiles)
      }
    }

    const handleDrag = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (e.type === "dragenter" || e.type === "dragover") {
        setDragActive(true)
      } else if (e.type === "dragleave") {
        setDragActive(false)
      }
    }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (disabled) return

      const files = e.dataTransfer.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
    }

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFiles(files)
      }
      // Reset input value to allow selecting the same file again
      if (e.target) {
        e.target.value = ''
      }
    }

    const removeImage = (index: number) => {
      const newFiles = value.filter((_, i) => i !== index)
      onChange?.(newFiles)
    }

    const openFileDialog = () => {
      fileInputRef.current?.click()
    }

    return (
      <div className={cn("space-y-4", className)}>
        {/* Upload Area */}
        <Card
          className={cn(
            "border-2 border-dashed transition-colors",
            dragActive && !disabled && "border-primary bg-primary/5",
            disabled && "opacity-50 cursor-not-allowed",
            !dragActive && !disabled && "border-muted-foreground/25 hover:border-primary/50"
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-4">
              <div className="rounded-full bg-muted p-3">
                <Upload className="h-6 w-6 text-muted-foreground" />
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-sm font-medium">
                  {dragActive ? "Drop images here" : "Upload images"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Drag and drop or click to browse
                </p>
                <p className="text-xs text-muted-foreground">
                  Max {maxFiles} files, {maxSize}MB each
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={openFileDialog}
                disabled={disabled || value.length >= maxFiles}
                className="mt-2"
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Choose Files
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={accept}
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        {/* Image Previews */}
        {value.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {value.map((file, index) => (
              <div key={`${file.name}-${index}`} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border bg-muted">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Remove button */}
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeImage(index)}
                  disabled={disabled}
                >
                  <X className="h-3 w-3" />
                </Button>

                {/* File info */}
                <div className="mt-2 text-center">
                  <p className="text-xs text-muted-foreground truncate" title={file.name}>
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Upload status */}
        {uploading && (
          <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
            <LoadingSpinner size="sm" />
            <span>Uploading images...</span>
          </div>
        )}
      </div>
    )
  }
)
ImageUpload.displayName = "ImageUpload"

export { ImageUpload }
