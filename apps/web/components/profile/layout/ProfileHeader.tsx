'use client'

import React, { useState } from 'react'
import { useProfile, useProfileEditing, useProfileForm, useProfileUI } from '../context/ProfileContext'
import { AvatarUpload, BannerUpload } from '../common/MediaUpload'
import { Edit3, Save, X, MapPin, Globe, Lock, User } from 'lucide-react'

export function ProfileHeader() {
  const { profile } = useProfile()
  const { isEditing, isEditingHeader, setEditing, setEditingHeader } = useProfileEditing()
  const { formData, saving, handleSave, handleCancel } = useProfileForm()
  const { showLocation, setShowLocation } = useProfileUI()
  
  const [isDraggingHeader, setIsDraggingHeader] = useState(false)
  const [headerPosition, setHeaderPosition] = useState({ y: 0, scale: 1 })

  const handleEditToggle = () => {
    if (isEditing) {
      handleCancel()
    } else {
      setEditing(true)
    }
  }

  const handleHeaderEditToggle = () => {
    setEditingHeader(!isEditingHeader)
  }

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    // This would update the form data through the context
    // formData.avatar_url = newAvatarUrl
  }

  const handleBannerUpdate = (newBannerUrl: string) => {
    // This would update the form data through the context
    // formData.header_banner_url = newBannerUrl
  }

  const handleHeaderDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDraggingHeader(true)
    setEditingHeader(true)
    // Drag logic would be implemented here
  }

  const handleLocationToggle = () => {
    setShowLocation(!showLocation)
  }

  return (
    <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden mb-6">
      {/* Header Banner */}
      <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600">
        {profile?.header_banner_url && (
          <img
            src={profile.header_banner_url}
            alt="Header banner"
            className="w-full h-full object-cover"
            style={{
              transform: `translateY(${headerPosition.y}px) scale(${headerPosition.scale})`,
              transition: isDraggingHeader ? 'none' : 'transform 0.3s ease'
            }}
          />
        )}
        
        {/* Banner overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-20" />
        
        {/* Banner edit button */}
        <button
          onClick={handleHeaderEditToggle}
          className="absolute top-4 right-4 p-2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white rounded-lg transition-all duration-200"
        >
          <Edit3 className="w-4 h-4" />
        </button>
      </div>

      {/* Profile Info */}
      <div className="relative px-6 pb-6">
        {/* Avatar */}
        <div className="flex items-start gap-4 -mt-16 relative z-10">
          <div className="relative">
            {isEditing ? (
              <AvatarUpload
                currentUrl={formData.avatar_url || profile?.avatar_url}
                onUpload={handleAvatarUpdate}
                className="w-32 h-32"
              />
            ) : (
              <div className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile picture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-500 dark:text-gray-400" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Profile Details */}
          <div className="flex-1 pt-16">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {isEditing ? (formData.display_name || 'Display Name') : (profile?.display_name || 'Display Name')}
                </h1>
                
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  @{isEditing ? (formData.handle || 'handle') : (profile?.handle || 'handle')}
                </div>
                
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
                  {isEditing ? (formData.bio || 'Tell us about yourself...') : (profile?.bio || 'No bio provided')}
                </p>

                {/* Location */}
                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    {showLocation ? (
                      <>
                        <Globe className="w-4 h-4" />
                        <span>
                          {isEditing ? (formData.city || 'City') : (profile?.city || 'City')}, {isEditing ? (formData.country || 'Country') : (profile?.country || 'Country')}
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
                {!isEditing && !isEditingHeader && (
                  <button
                    onClick={handleEditToggle}
                    className="bg-primary-600 hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <Edit3 className="w-4 h-4" />
                    Edit Profile
                  </button>
                )}

                {(isEditing || isEditingHeader) && (
                  <>
                    <button
                      onClick={handleCancel}
                      className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                    
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-primary-600 hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview (when editing) */}
      {isEditing && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Live Preview</h3>
          
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-gray-500 dark:text-gray-400" />
                )}
              </div>
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formData.display_name || 'Display Name'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  @{formData.handle || 'handle'}
                </div>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {formData.bio || 'Tell us about yourself...'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
