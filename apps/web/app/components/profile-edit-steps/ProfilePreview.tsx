'use client'

import React, { useRef, useState } from 'react'
import Image from 'next/image'
import { MapPin, Camera, Upload, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProfileFormData } from '@/lib/profile-validation'
import { uploadAvatar, uploadHeaderBanner, updateProfileImages } from '@/lib/image-upload'
import { ImageCropper } from '../ui/ImageCropper'

interface ProfilePreviewProps {
  formData: ProfileFormData
  avatarUrl?: string
  headerBannerUrl?: string
  onAvatarChange?: (newUrl: string) => void
  onHeaderChange?: (newUrl: string) => void
  userId?: string
}

export function ProfilePreview({ 
  formData, 
  avatarUrl, 
  headerBannerUrl,
  onAvatarChange,
  onHeaderChange,
  userId
}: ProfilePreviewProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const headerInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingHeader, setIsUploadingHeader] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [selectedHeaderFile, setSelectedHeaderFile] = useState<File | null>(null)
  
  const displayName = formData.display_name || 'Your Name'
  const handle = formData.handle || 'your_handle'
  const bio = formData.bio || 'Tell us about yourself...'
  const location = [formData.city, formData.country].filter(Boolean).join(', ') || 'Your location'
  
  const handleAvatarUpload = async (file: File) => {
    if (!userId) {
      console.error('User ID is required for avatar upload')
      return
    }

    setIsUploadingAvatar(true)
    try {
      const result = await uploadAvatar(userId, file)
      await updateProfileImages(userId, { avatar_url: result.publicUrl })
      onAvatarChange?.(result.publicUrl)
    } catch (error) {
      console.error('Avatar upload failed:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleHeaderUpload = async (file: File) => {
    if (!userId) {
      console.error('User ID is required for header upload')
      return
    }

    // Open cropper first
    setSelectedHeaderFile(file)
    setCropperOpen(true)
  }

  const handleHeaderCrop = async (croppedImageUrl: string, position: { x: number; y: number; scale: number }) => {
    if (!userId || !selectedHeaderFile) return

    setIsUploadingHeader(true)
    try {
      // Convert the cropped image URL to a File
      const response = await fetch(croppedImageUrl)
      const blob = await response.blob()
      const file = new File([blob], selectedHeaderFile.name, { type: 'image/jpeg' })

      const result = await uploadHeaderBanner(userId, file)
      const positionData = JSON.stringify(position)
      
      await updateProfileImages(userId, { 
        header_banner_url: result.publicUrl,
        header_banner_position: positionData
      })
      
      onHeaderChange?.(result.publicUrl)
      setCropperOpen(false)
      setSelectedHeaderFile(null)
    } catch (error) {
      console.error('Header upload failed:', error)
      alert('Failed to upload header image. Please try again.')
    } finally {
      setIsUploadingHeader(false)
    }
  }

  const handleAvatarClick = () => {
    avatarInputRef.current?.click()
  }

  const handleHeaderClick = () => {
    headerInputRef.current?.click()
  }

  // Get banner style from stored position data
  const getBannerStyle = () => {
    if (!formData.header_banner_position) return {}
    
    try {
      const position = JSON.parse(formData.header_banner_position)
      return {
        objectPosition: `${position.x}% ${position.y}%`,
        transform: `scale(${position.scale || 1})`
      }
    } catch {
      return {}
    }
  }

  const bannerStyle = getBannerStyle()

  return (
    <div className="bg-card rounded-lg border mb-6 overflow-hidden">
      {/* Header Banner */}
      <div className="relative h-48 overflow-hidden">
        {headerBannerUrl ? (
          <>
            <div className="absolute inset-0">
              <Image
                src={headerBannerUrl}
                alt="Profile banner"
                fill
                className="object-cover"
                style={bannerStyle}
                priority
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
        )}

        {/* Header Upload Button */}
        <div className="absolute top-4 right-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleHeaderClick}
            disabled={isUploadingHeader}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            {isUploadingHeader ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Camera className="h-4 w-4 mr-2" />
            )}
            {isUploadingHeader ? 'Uploading...' : 'Change Header'}
          </Button>
        </div>

        {/* Profile Info */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex items-end gap-4">
            {/* Avatar Container */}
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-full border-4 border-white shadow-xl overflow-hidden">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={displayName}
                    width={80}
                    height={80}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xl font-bold bg-background text-foreground">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Avatar Upload Button - Outside the avatar container */}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleAvatarClick}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 w-6 h-6 p-0 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground border-2 border-white shadow-lg z-20"
              >
                {isUploadingAvatar ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Upload className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Profile Details */}
            <div className="flex-1 text-white">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold leading-tight">{displayName}</h1>
              </div>
              <p className="text-base text-gray-200">@{handle}</p>
              {bio && (
                <p className="text-sm text-gray-300 mt-1 line-clamp-2">
                  {bio}
                </p>
              )}
              {location !== 'Your location' && (
                <div className="text-xs text-gray-300 flex items-center gap-1 mt-1">
                  <MapPin className="h-3 w-3" />
                  <span>{location}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleAvatarUpload(file)
        }}
        className="hidden"
      />
      <input
        ref={headerInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleHeaderUpload(file)
        }}
        className="hidden"
      />

      {/* Image Cropper Modal */}
      {selectedHeaderFile && (
        <ImageCropper
          isOpen={cropperOpen}
          onClose={() => {
            setCropperOpen(false)
            setSelectedHeaderFile(null)
          }}
          onCrop={handleHeaderCrop}
          imageUrl={URL.createObjectURL(selectedHeaderFile)}
          aspectRatio={16/9}
        />
      )}
    </div>
  )
}
