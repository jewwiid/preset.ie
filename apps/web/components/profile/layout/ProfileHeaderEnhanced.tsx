'use client'

import React, { useState, useRef } from 'react'
import { useProfile, useProfileUI, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { 
  Edit3, 
  Globe, 
  Lock, 
  User, 
  Camera, 
  X, 
  Instagram, 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Award, 
  ChevronDown, 
  ChevronUp,
  Mail,
  Phone,
  Briefcase,
  Star,
  Users,
  Eye,
  Heart,
  CheckCircle,
  Clock,
  Settings,
  Palette
} from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'
import { UserRatingDisplay } from '../sections/UserRatingDisplay'

// Profile completion calculation
const calculateProfileCompletion = (profile: any): number => {
  const fields = [
    { key: 'bio', weight: 5 },
    { key: 'city', weight: 5 },
    { key: 'country', weight: 3 },
    { key: 'phone_number', weight: 3 },
    { key: 'instagram_handle', weight: 2 },
    { key: 'tiktok_handle', weight: 2 },
    { key: 'website_url', weight: 3 },
    { key: 'portfolio_url', weight: 5 },
    { key: 'years_experience', weight: 8 },
    { key: 'specializations', weight: 10 },
    { key: 'equipment_list', weight: 5 },
    { key: 'editing_software', weight: 5 },
    { key: 'languages', weight: 3 },
    { key: 'hourly_rate_min', weight: 8 },
    { key: 'available_for_travel', weight: 3 },
    { key: 'has_studio', weight: 3 },
    { key: 'typical_turnaround_days', weight: 3 }
  ];

  let completedWeight = 0;
  let totalWeight = 0;

  fields.forEach(field => {
    totalWeight += field.weight;
    const value = profile[field.key];
    
    if (value !== undefined && value !== null && value !== '' && 
        (!Array.isArray(value) || value.length > 0)) {
      completedWeight += field.weight;
    }
  });

  return Math.round((completedWeight / totalWeight) * 100);
};

export function ProfileHeaderEnhanced() {
  const { profile } = useProfile()
  const { showLocation } = useProfileUI()
  const { isEditing, setEditing } = useProfileEditing()
  const { handleSave, handleCancel, saving, updateField } = useProfileForm()
  const { user } = useAuth()
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('professional')
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const profileCompletion = profile ? calculateProfileCompletion(profile) : 0
  const isProfileComplete = profileCompletion === 100

  // Tab configuration
  const tabs = [
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'equipment', label: 'Equipment & Software', icon: Camera },
    { id: 'physical', label: 'Physical Attributes', icon: Users }
  ]

  // Professional Information
  const professionalInfo = [
    {
      label: 'Years of Experience',
      value: profile?.years_experience ? `${profile.years_experience} years` : 'Not specified',
      icon: Calendar
    },
    {
      label: 'Specializations',
      value: profile?.specializations && profile.specializations.length > 0 ? profile.specializations.join(', ') : 'Not specified',
      icon: Award
    },
    {
      label: 'Hourly Rate',
      value: profile?.hourly_rate_min ? `€${profile.hourly_rate_min} - €${profile.hourly_rate_max || 'N/A'}` : 'Not specified',
      icon: Star
    },
    {
      label: 'Turnaround Time',
      value: profile?.typical_turnaround_days ? `${profile.typical_turnaround_days} days` : 'Not specified',
      icon: Clock
    }
  ]

  // Contact Information
  const contactInfo = [
    {
      label: 'Phone',
      value: profile?.phone_number || 'Not provided',
      icon: Phone
    },
    {
      label: 'Email',
      value: 'Contact via profile', // Email is handled by auth system
      icon: Mail
    },
    {
      label: 'Location',
      value: profile?.city && profile?.country ? `${profile.city}, ${profile.country}` : 'Not specified',
      icon: MapPin
    },
    {
      label: 'Languages',
      value: profile?.languages && profile.languages.length > 0 ? profile.languages.join(', ') : 'Not specified',
      icon: Globe
    }
  ]

  // Equipment & Software
  const equipmentInfo = [
    {
      label: 'Equipment',
      value: profile?.equipment_list && profile.equipment_list.length > 0 ? profile.equipment_list.slice(0, 3).join(', ') + (profile.equipment_list.length > 3 ? ` +${profile.equipment_list.length - 3} more` : '') : 'Not specified',
      icon: Camera
    },
    {
      label: 'Editing Software',
      value: profile?.editing_software && profile.editing_software.length > 0 ? profile.editing_software.slice(0, 3).join(', ') + (profile.editing_software.length > 3 ? ` +${profile.editing_software.length - 3} more` : '') : 'Not specified',
      icon: Settings
    },
    {
      label: 'Travel Availability',
      value: profile?.available_for_travel ? `Yes (${profile.travel_radius_km}km radius)` : 'No',
      icon: Globe
    },
    {
      label: 'Studio',
      value: (profile?.studio_name || profile?.studio_address) ? (profile.studio_name || 'Has Studio') : 'No Studio',
      icon: Briefcase
    }
  ]

  // Physical Attributes (for talent)
  const physicalInfo = profile?.talent_categories && profile.talent_categories.length > 0 ? [
    {
      label: 'Height',
      value: profile?.height_cm ? `${profile.height_cm}cm` : 'Not specified',
      icon: Users
    },
    {
      label: 'Measurements',
      value: profile?.measurements || 'Not specified',
      icon: Users
    },
    {
      label: 'Eye Color',
      value: profile?.eye_color || 'Not specified',
      icon: Eye
    },
    {
      label: 'Hair Color',
      value: profile?.hair_color || 'Not specified',
      icon: Palette
    }
  ] : []

  const renderTabContent = () => {
    switch (activeTab) {
      case 'professional':
        return (
          <div className="space-y-4">
            {professionalInfo.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">{item.label}</label>
                  <div className="mt-1">
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      case 'contact':
        return (
          <div className="space-y-4">
            {contactInfo.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">{item.label}</label>
                  <div className="mt-1">
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      case 'equipment':
        return (
          <div className="space-y-4">
            {equipmentInfo.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <item.icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-foreground">{item.label}</label>
                  <div className="mt-1">
                    <span className="text-sm text-muted-foreground">{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      case 'physical':
        return (
          <div className="space-y-4">
            {physicalInfo.length > 0 ? (
              physicalInfo.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-foreground">{item.label}</label>
                    <div className="mt-1">
                      <span className="text-sm text-muted-foreground">{item.value}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">Physical attributes are only shown for talent profiles</p>
              </div>
            )}
          </div>
        )
      default:
        return null
    }
  }

  const handleEditToggle = () => {
    if (isEditing) {
      return
    } else {
      setEditing(true)
    }
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user || !supabase) {
      console.error('Upload failed: Missing user or supabase client', { user: !!user, supabase: !!supabase })
      alert('Unable to upload: Please ensure you are logged in.')
      return
    }

    try {
      setIsUploadingAvatar(true)
      console.log('Starting avatar upload for user:', user.id)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      console.log('Uploading to path:', filePath)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', uploadData)

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      console.log('Public URL:', data.publicUrl)

      // Update the profile in the database
      const { error: updateError } = await supabase
        .from('users_profile')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }

      console.log('Database updated successfully')
      updateField('avatar_url', data.publicUrl)
    } catch (error: any) {
      console.error('Avatar upload error:', error)
      alert(`Failed to upload avatar: ${error.message || 'Please try again.'}`)
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  const handleBannerUpload = async (file: File) => {
    if (!user || !supabase) {
      console.error('Upload failed: Missing user or supabase client', { user: !!user, supabase: !!supabase })
      alert('Unable to upload: Please ensure you are logged in.')
      return
    }

    try {
      setIsUploadingBanner(true)
      console.log('Starting banner upload for user:', user.id)

      const fileExt = file.name.split('.').pop()
      const fileName = `banner_${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      console.log('Uploading to path:', filePath)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        throw uploadError
      }

      console.log('Upload successful:', uploadData)

      const { data } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath)

      console.log('Public URL:', data.publicUrl)

      // Update the profile in the database
      const { error: updateError } = await supabase
        .from('users_profile')
        .update({ header_banner_url: data.publicUrl })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }

      console.log('Database updated successfully')
      updateField('header_banner_url', data.publicUrl)
    } catch (error: any) {
      console.error('Banner upload error:', error)
      alert(`Failed to upload banner: ${error.message || 'Please try again.'}`)
    } finally {
      setIsUploadingBanner(false)
    }
  }

  // Social links data
  const socialLinks = [
    {
      name: 'Instagram',
      handle: profile?.instagram_handle,
      icon: Instagram,
      color: 'bg-primary',
      url: profile?.instagram_handle ? `https://instagram.com/${profile.instagram_handle}` : null
    },
    {
      name: 'TikTok',
      handle: profile?.tiktok_handle,
      icon: ExternalLink,
      color: 'bg-primary',
      url: profile?.tiktok_handle ? `https://tiktok.com/@${profile.tiktok_handle}` : null
    },
    {
      name: 'Website',
      handle: profile?.website_url,
      icon: ExternalLink,
      color: 'bg-primary',
      url: profile?.website_url || null
    },
    {
      name: 'Portfolio',
      handle: profile?.portfolio_url,
      icon: Briefcase,
      color: 'bg-primary',
      url: profile?.portfolio_url || null
    }
  ].filter(link => link.handle && link.url)

  return (
    <div className="relative bg-card rounded-xl shadow-lg overflow-hidden mb-6">
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
        
        {/* Banner action buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => bannerInputRef.current?.click()}
                disabled={isUploadingBanner}
                className="p-2 bg-background/90 hover:bg-background text-foreground border border-border rounded-lg transition-all duration-200 disabled:opacity-50 shadow-sm"
              >
                {isUploadingBanner ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleCancel}
                className="px-3 py-2 bg-background/90 hover:bg-background text-foreground border border-border rounded-lg text-sm font-medium transition-all shadow-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <button 
              onClick={handleEditToggle}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Edit Profile
            </button>
          )}
        </div>
        
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
            <div className="w-32 h-32 rounded-full border-4 border-border overflow-hidden">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile picture"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-muted flex items-center justify-center">
                  <User className="w-16 h-16 text-muted-foreground" />
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
          <div className="flex-1 pt-16 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    {profile?.display_name || 'Display Name'}
                  </h1>
                  {profile?.verification_status === 'fully_verified' && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-xs font-medium">
                      <Award className="w-3 h-3" />
                      Verified
                    </div>
                  )}
                  {isProfileComplete && (
                    <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs font-medium">
                      <CheckCircle className="w-3 h-3" />
                      Complete Profile
                    </div>
                  )}
                </div>

                {/* Primary Skill Badge */}
                {profile?.primary_skill && (
                  <div className="mb-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-primary/90 to-primary text-primary-foreground rounded-full text-sm font-semibold shadow-sm">
                      <Briefcase className="w-3.5 h-3.5" />
                      {profile.primary_skill}
                    </div>
                  </div>
                )}

                <div className="text-sm text-muted-foreground mb-1">
                  @{profile?.handle || 'handle'}
                </div>
                
                <p className="text-sm text-foreground leading-relaxed mb-4 max-w-md">
                  {profile?.bio || 'No bio provided'}
                </p>

                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    {socialLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg hover:shadow-md transition-all duration-200 group flex-shrink-0"
                      >
                        <div className={`w-6 h-6 ${link.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                          <link.icon className="w-3 h-3 text-primary-foreground" />
                        </div>
                        <span className="text-sm font-medium text-foreground whitespace-nowrap">
                          {link.name}
                        </span>
                      </a>
                    ))}
                  </div>
                )}

                {/* Professional Info */}
                {professionalInfo.length > 0 && (
                  <div className="flex flex-col gap-2 mb-4">
                    {professionalInfo.map((info, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                        <info.icon className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{info.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* User Rating */}
                {profile && (
                  <div className="mb-4">
                    <UserRatingDisplay userId={profile.id} compact={true} />
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* Expandable Additional Information */}
        <div className="mt-6 pt-6 border-t border-border">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between p-4 bg-muted rounded-xl hover:bg-accent transition-colors duration-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-semibold text-foreground">
                  Additional Information
                </h3>
                <p className="text-xs text-muted-foreground">
                  View detailed profile information
                </p>
              </div>
            </div>
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            )}
          </button>

          {/* Expanded Content */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? 'max-h-screen opacity-100 mt-4' : 'max-h-0 opacity-0'
          }`}>
            <div className="bg-card rounded-xl border border-border">
              {/* Tabs */}
              <div className="border-b border-border">
                <div className="flex overflow-x-auto">
                  {tabs.map((tab) => {
                    const Icon = tab.icon
                    const isActive = activeTab === tab.id
                    
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                          isActive
                            ? 'text-primary border-b-2 border-primary bg-primary/10'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {renderTabContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
