'use client'

import React, { useState, useRef } from 'react'
import { MediaUploadProps, BannerPosition } from '../types/profile'
import { Camera, Upload, X } from 'lucide-react'

export function MediaUpload({
  type,
  currentUrl,
  onUpload,
  onPositionChange,
  className = ''
}: MediaUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (file: File) => {
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    try {
      setUploadProgress(0)
      
      // Create form data
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 100)

      // Upload file (this would be replaced with actual upload logic)
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const result = await response.json()
      setUploadProgress(100)
      
      // Call the upload callback
      onUpload(result.url)
      
      // Reset progress after a delay
      setTimeout(() => setUploadProgress(0), 1000)
      
    } catch (error) {
      console.error('Upload error:', error)
      alert('Upload failed. Please try again.')
      setUploadProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleRemove = () => {
    onUpload('')
  }

  const getUploadAreaClasses = () => {
    const baseClasses = "relative border-2 border-dashed rounded-lg p-6 text-center transition-colors duration-200"
    
    if (isDragging) {
      return `${baseClasses} border-primary bg-primary/10`
    }
    
    if (currentUrl) {
      return `${baseClasses} border-gray-300 dark:border-gray-600`
    }
    
    return `${baseClasses} border-border hover:border-primary hover:bg-primary/10`
  }

  return (
    <div className={`${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {currentUrl ? (
        <div className="relative group">
          <img
            src={currentUrl}
            alt={type === 'avatar' ? 'Profile picture' : 'Header banner'}
            className={`w-full rounded-lg ${
              type === 'avatar' ? 'h-32 w-32 object-cover' : 'h-48 object-cover'
            }`}
          />
          
          {/* Overlay with actions */}
          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={handleClick}
              className="p-2 bg-white text-gray-800 rounded-full hover:bg-gray-100 transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          className={getUploadAreaClasses()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
        >
          {uploadProgress > 0 ? (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uploading... {uploadProgress}%
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {isDragging ? 'Drop image here' : 'Click to upload or drag and drop'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Specialized media upload components
export function AvatarUpload(props: Omit<MediaUploadProps, 'type'>) {
  return <MediaUpload {...props} type="avatar" />
}

export function BannerUpload(props: Omit<MediaUploadProps, 'type'>) {
  return <MediaUpload {...props} type="banner" />
}
