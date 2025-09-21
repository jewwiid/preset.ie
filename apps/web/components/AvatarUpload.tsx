'use client'

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth-context'
import { Camera, Upload, X, Loader2 } from 'lucide-react'

interface AvatarUploadProps {
  currentAvatarUrl?: string
  onAvatarUpdate: (newAvatarUrl: string) => void
  size?: 'sm' | 'md' | 'lg'
}

export function AvatarUpload({ currentAvatarUrl, onAvatarUpdate, size = 'md' }: AvatarUploadProps) {
  const { user } = useAuth()
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  }

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Create preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)

    // Upload file
    uploadAvatar(file)
  }

  const uploadAvatar = async (file: File) => {
    if (!user) return
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    setIsUploading(true)
    try {
      // Delete old avatar if it exists
      if (currentAvatarUrl) {
        const oldPath = currentAvatarUrl.split('/').pop()
        if (oldPath) {
          await supabase!.storage
            .from('profile-images')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      // Upload new avatar
      const { error: uploadError } = await supabase!.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data } = supabase!.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      const newAvatarUrl = data.publicUrl

      // Update user profile
      const { error: updateError } = await supabase!
        .from('users_profile')
        .update({ avatar_url: newAvatarUrl })
        .eq('user_id', user.id)

      if (updateError) throw updateError

      // Notify parent component
      onAvatarUpdate(newAvatarUrl)

      // Clean up preview
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }

    } catch (error: any) {
      console.error('Avatar upload error:', error)
      alert('Failed to upload avatar. Please try again.')
      
      // Clean up preview on error
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
        setPreviewUrl(null)
      }
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user || !currentAvatarUrl) return
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    setIsUploading(true)
    try {
      // Delete from storage
      const oldPath = currentAvatarUrl.split('/').pop()
      if (oldPath) {
        await supabase!.storage
          .from('profile-images')
          .remove([`${user.id}/${oldPath}`])
      }

      // Update profile
      const { error } = await supabase!
        .from('users_profile')
        .update({ avatar_url: null })
        .eq('user_id', user.id)

      if (error) throw error

      onAvatarUpdate('')

    } catch (error: any) {
      console.error('Avatar removal error:', error)
      alert('Failed to remove avatar. Please try again.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="relative">
        <div className={`${sizeClasses[size]} rounded-full bg-primary-500 flex items-center justify-center overflow-hidden relative`}>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <Loader2 className={`${iconSizes[size]} text-white animate-spin`} />
            </div>
          )}
          
          {previewUrl || currentAvatarUrl ? (
            <img
              src={previewUrl || currentAvatarUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <Camera className={`${iconSizes[size]} text-white`} />
          )}
        </div>

        {/* Upload overlay button */}
        {user && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity rounded-full flex items-center justify-center"
          >
            <Upload className={`${iconSizes[size]} text-white`} />
          </button>
        )}
      </div>

      <div className="flex flex-col space-y-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || !user}
          className="px-3 py-1.5 bg-primary-600 hover:bg-primary/90 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
          title={!user ? 'Please sign in to upload avatar' : ''}
        >
          {isUploading ? 'Uploading...' : !user ? 'Sign in to Upload' : 'Upload Photo'}
        </button>

        {currentAvatarUrl && (
          <button
            onClick={handleRemoveAvatar}
            disabled={isUploading}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
}