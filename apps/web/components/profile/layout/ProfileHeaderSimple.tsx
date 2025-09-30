'use client'

import React, { useState, useRef } from 'react'
import { useProfile, useProfileUI, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { Edit3, Globe, Lock, User, Camera, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'

export function ProfileHeaderSimple() {
  const { profile } = useProfile()
  const { showLocation } = useProfileUI()
  const { isEditing, setEditing } = useProfileEditing()
  const { handleSave, handleCancel, saving, updateField } = useProfileForm()
  const { user } = useAuth()
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const handleEditToggle = () => {
    if (isEditing) {
      // If already editing, we could show a cancel option
      return
    } else {
      setEditing(true)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user || !supabase) return

    try {
      setIsUploadingAvatar(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) throw uploadError
      
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)
      
      updateField('avatar_url', data.publicUrl)
    } catch (error) {
      console.error('Avatar upload error:', error)
      alert('Failed to upload avatar. Please try again.')
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleBannerUpload = async (file: File) => {
    if (!user || !supabase) return

    try {
      setIsUploadingBanner(true)
      
      const fileExt = file.name.split('.').pop()
      const fileName = `banner_${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`
      
      const { error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (uploadError) throw uploadError
      
      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)
      
      updateField('header_banner_url', data.publicUrl)
    } catch (error) {
      console.error('Banner upload error:', error)
      alert('Failed to upload banner. Please try again.')
    } finally {
      setIsUploadingBanner(false)
    }
  }

  return (
    <div className="relative bg-background dark:bg-muted-800 rounded-xl shadow-lg overflow-hidden mb-6">
      {/* Header Banner */}
      <div className="relative h-48 bg-primary">
        {profile?.header_banner_url ? (
          <img
            src={profile.header_banner_url}
            alt="Header banner"
            className="w-full h-full object-cover"
            style={{
              objectPosition: profile.header_banner_position || 'center'
            }}
          />
        ) : (
          <div className="w-full h-full bg-primary" />
        )}
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        
        {/* Banner edit button */}
        {isEditing ? (
          <button 
            onClick={() => bannerInputRef.current?.click()}
            disabled={isUploadingBanner}
            className="absolute top-4 right-4 p-2 bg-background bg-opacity-20 hover:bg-opacity-30 text-primary-foreground rounded-lg transition-all duration-200 disabled:opacity-50"
          >
            {isUploadingBanner ? (
              <div className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-4 h-4" />
            )}
          </button>
        ) : (
          <button className="absolute top-4 right-4 p-2 bg-background bg-opacity-20 hover:bg-opacity-30 text-primary-foreground rounded-lg transition-all duration-200">
            <Edit3 className="w-4 h-4" />
          </button>
        )}
        
        {/* Hidden file input for banner */}
        <input
          ref={bannerInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) {
              handleBannerUpload(file)
            }
          }}
        />
      </div>

      {/* Profile Info */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="flex items-start gap-4 -mt-16 relative z-10">
          <div className="relative group">
            <div className="w-32 h-32 rounded-full border-4 border-border dark:border-border-800 overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile picture"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="w-16 h-16 text-muted-foreground-500 dark:text-muted-foreground-400" />
                </div>
              )}
            </div>
            
            {/* Avatar upload button */}
            {isEditing && (
              <button
                onClick={() => avatarInputRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-2 -right-2 bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-full transition-colors shadow-lg disabled:opacity-50"
              >
                {isUploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-border border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
            )}
            
            {/* Hidden file input for avatar */}
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  handleAvatarUpload(file)
                }
              }}
            />
          </div>

          {/* Profile Details */}
          <div className="flex-1 pt-16">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-muted-foreground-900 dark:text-primary-foreground mb-1">
                  {profile?.display_name || 'Display Name'}
                </h1>
                
                <div className="text-sm text-muted-foreground mb-1">
                  @{profile?.handle || 'handle'}
                </div>
                
                <p className="text-sm text-foreground leading-relaxed mb-3">
                  {profile?.bio || 'No bio provided'}
                </p>

                {/* Location */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {showLocation ? (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>
                          {profile?.city || 'City'}, {profile?.country || 'Country'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>Location hidden</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                {!isEditing ? (
                  <button 
                    onClick={handleEditToggle}
                    className="bg-primary-600 hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCancel}
                      className="bg-muted-500 hover:bg-muted-600 text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-primary-600 hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
