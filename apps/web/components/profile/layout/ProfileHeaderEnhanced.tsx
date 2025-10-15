'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useProfile, useProfileUI, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
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
    { key: 'professional_skills', weight: 10 },
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
  const { showLocation, isDraggingHeader, headerPosition, setDraggingHeader, setHeaderPosition } = useProfileUI()
  const { isEditing, setEditing } = useProfileEditing()
  const { formData, handleSave, handleCancel, saving, updateField } = useProfileForm()
  const { user } = useAuth()
  
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isUploadingBanner, setIsUploadingBanner] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState('professional')
  const [dragStart, setDragStart] = useState({ y: 0, initialY: 0 })
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const profileCompletion = profile ? calculateProfileCompletion(profile) : 0
  const isProfileComplete = profileCompletion === 100

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleHeaderDragMove)
      document.removeEventListener('mouseup', handleHeaderDragEnd)
      document.removeEventListener('touchmove', handleHeaderDragMove)
      document.removeEventListener('touchend', handleHeaderDragEnd)
    }
  }, [])

  // Tab configuration - role-aware
  const hasContributor = profile?.account_type?.includes('CONTRIBUTOR') || false
  const hasTalent = profile?.account_type?.includes('TALENT') || false
  
  const allTabs = [
    { id: 'professional', label: 'Professional', icon: Briefcase },
    { id: 'contact', label: 'Contact', icon: Mail },
    { id: 'equipment', label: 'Equipment & Software', icon: Camera },
    { id: 'physical', label: 'Physical Attributes', icon: Users }
  ]
  
  // Filter tabs based on user role
  const tabs = allTabs.filter(tab => {
    if (tab.id === 'equipment') {
      // Equipment & Software only for contributors
      return hasContributor
    }
    if (tab.id === 'physical') {
      // Physical Attributes only for talents
      return hasTalent
    }
    // Professional and Contact tabs for everyone
    return true
  })

  // Professional Information
  const professionalInfo = [
    {
      label: 'Years of Experience',
      value: profile?.years_experience ? `${profile.years_experience} years` : 'Not specified',
      icon: Calendar
    },
    {
      label: 'Professional Skills',
      value: profile?.professional_skills && profile.professional_skills.length > 0 ? profile.professional_skills.join(', ') : 'Not specified',
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
            {professionalInfo
              .filter(item => item.value !== 'Not specified')
              .map((item, index) => (
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
            {contactInfo
              .filter(item => item.value !== 'Not specified' && item.value !== 'Not provided')
              .map((item, index) => (
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
            {equipmentInfo
              .filter(item => item.value !== 'Not specified')
              .map((item, index) => (
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
              physicalInfo
                .filter(item => item.value !== 'Not specified')
                .map((item, index) => (
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
    // Redirect to the comprehensive profile edit page instead of inline editing
    window.location.href = '/dashboard/profile/edit'
  }

  // Header banner drag functionality
  const handleHeaderDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isEditing) return
    
    e.preventDefault()
    setDraggingHeader(true)
    
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    setDragStart({ y: clientY, initialY: headerPosition.y })
    
    // Add event listeners for drag
    document.addEventListener('mousemove', handleHeaderDragMove)
    document.addEventListener('mouseup', handleHeaderDragEnd)
    document.addEventListener('touchmove', handleHeaderDragMove)
    document.addEventListener('touchend', handleHeaderDragEnd)
  }

  const handleHeaderDragMove = (e: MouseEvent | TouchEvent) => {
    if (!isDraggingHeader) return
    
    e.preventDefault()
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    const deltaY = clientY - dragStart.y
    const newY = Math.max(-100, Math.min(100, dragStart.initialY + deltaY)) // Limit drag range
    
    setHeaderPosition({ ...headerPosition, y: newY })
  }

  const handleHeaderDragEnd = () => {
    setDraggingHeader(false)
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleHeaderDragMove)
    document.removeEventListener('mouseup', handleHeaderDragEnd)
    document.removeEventListener('touchmove', handleHeaderDragMove)
    document.removeEventListener('touchend', handleHeaderDragEnd)
    
    // Save position to form data
    const positionString = `${headerPosition.y > 0 ? 'top' : 'bottom'} ${Math.abs(headerPosition.y)}px`
    updateField('header_banner_position', positionString)
  }

  const handleAvatarUpload = async (file: File) => {
    if (!user || !supabase) {
      console.error('Upload failed: Missing user or supabase client', { user: !!user, supabase: !!supabase })
      alert('Unable to upload: Please ensure you are logged in.')
      return
    }

    // Prevent users from uploading to profiles that aren't theirs
    if (profile?.user_id !== user.id) {
      console.error('Upload blocked: User trying to upload to another user\'s profile')
      alert('You can only upload avatars to your own profile.')
      return
    }

    try {
      setIsUploadingAvatar(true)

      // Get the actual authenticated user ID from Supabase
      const { data: { user: authUser } } = await supabase.auth.getUser()
      const actualUserId = authUser?.id

      console.log('=== AVATAR UPLOAD DEBUG ===')
      console.log('Auth context user.id:', user.id)
      console.log('Actual auth.getUser() ID:', actualUserId)
      console.log('Profile user_id:', profile?.user_id)
      console.log('User object:', { id: user.id, email: user.email })
      console.log('===========================')

      // Use the actual authenticated user ID
      const uploadUserId = actualUserId || user.id

      // 🎯 IMMEDIATE PREVIEW: Create object URL for instant preview
      const previewUrl = URL.createObjectURL(file)
      updateField('avatar_url', previewUrl)
      console.log('Avatar preview URL set:', previewUrl)

      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${uploadUserId}/${fileName}`

      console.log('Uploading to path:', filePath)
      console.log('File path breakdown:', { userId: uploadUserId, fileName, fullPath: filePath })
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
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
        .from('avatars')
        .getPublicUrl(filePath)

      console.log('Public URL:', data.publicUrl)

      // Update the profile in the database
      const { error: updateError } = await supabase
        .from('users_profile')
        .update({ avatar_url: data.publicUrl })
        .eq('user_id', uploadUserId)
        .select()
        .single()

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }

      console.log('Database updated successfully')
      
      // 🎯 Replace preview URL with actual uploaded URL
      URL.revokeObjectURL(previewUrl) // Clean up the preview URL
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

    // Prevent users from uploading to profiles that aren't theirs
    if (profile?.user_id !== user.id) {
      console.error('Upload blocked: User trying to upload to another user\'s profile')
      alert('You can only upload banners to your own profile.')
      return
    }

    try {
      setIsUploadingBanner(true)
      console.log('Starting banner upload for user:', user.id)

      // 🎯 IMMEDIATE PREVIEW: Create object URL for instant preview
      const previewUrl = URL.createObjectURL(file)
      updateField('header_banner_url', previewUrl)
      console.log('Preview URL set:', previewUrl)

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
        .select()
        .single()

      if (updateError) {
        console.error('Database update error:', updateError)
        throw updateError
      }

      console.log('Database updated successfully')
      
      // 🎯 Replace preview URL with actual uploaded URL
      URL.revokeObjectURL(previewUrl) // Clean up the preview URL
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
      {/* Hero Banner - Unified Design */}
      <div className="relative h-80 bg-primary overflow-hidden">
        {(isEditing ? formData?.header_banner_url : profile?.header_banner_url) ? (
          <>
            <img
              src={isEditing ? formData?.header_banner_url : profile?.header_banner_url}
              alt="Header banner"
              className={`w-full h-full object-cover select-none ${isEditing ? 'cursor-move' : ''}`}
              style={{
                objectPosition: (isEditing ? formData?.header_banner_position : profile?.header_banner_position) || 'center',
                transform: isEditing ? `translateY(${headerPosition.y}px) scale(${headerPosition.scale})` : undefined,
                transition: isDraggingHeader ? 'none' : 'transform 0.3s ease'
              }}
              onMouseDown={isEditing ? handleHeaderDragStart : undefined}
              onTouchStart={isEditing ? handleHeaderDragStart : undefined}
              draggable={false}
            />
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          </>
        )}
        
        {/* Drag indicator when editing */}
        {isEditing && (formData?.header_banner_url || profile?.header_banner_url) && (
          <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
            Drag to reposition
          </div>
        )}
        
        {/* Profile Content - Inside Banner */}
        <div className="absolute inset-0 h-full flex flex-col justify-between py-6 px-4 sm:px-6 lg:px-8">
          {/* Top: Back/Edit Buttons */}
          <div className="flex justify-between items-start">
            <div className="opacity-0"></div> {/* Spacer */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={isUploadingBanner}
                    className="p-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg transition-all duration-200 disabled:opacity-50 backdrop-blur-sm"
                  >
                    {isUploadingBanner ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 rounded-lg text-sm font-medium transition-all backdrop-blur-sm"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="px-3 py-2 bg-white text-primary hover:bg-white/90 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </>
              ) : (
                <button 
                  onClick={handleEditToggle}
                  className="px-4 py-2 bg-white text-primary hover:bg-white/90 rounded-lg text-sm font-medium transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <Edit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Bottom: Profile Info */}
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-4 border-white shadow-xl overflow-hidden flex-shrink-0">
                {(isEditing ? formData?.avatar_url : profile?.avatar_url) ? (
                  <img
                    src={isEditing ? formData?.avatar_url : profile?.avatar_url}
                    alt="Profile picture"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-background flex items-center justify-center">
                    <User className="w-12 h-12 sm:w-16 sm:h-16 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Avatar upload button */}
              {isEditing && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar}
                  className="absolute -bottom-2 -right-2 bg-white text-primary hover:bg-white/90 p-2 rounded-full transition-colors shadow-lg disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>

            {/* Name and Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-3xl sm:text-4xl font-bold text-white">
                  {profile?.display_name || 'Display Name'}
                </h1>
                {profile?.verification_status === 'fully_verified' && (
                  <div className="flex items-center gap-1 px-2 py-1 bg-white/20 text-white rounded-full text-xs font-medium backdrop-blur-sm">
                    <Award className="w-3 h-3" />
                    Verified
                  </div>
                )}
              </div>

              <p className="text-base text-white/90 mb-3">
                @{profile?.handle || 'handle'}
              </p>

              {/* Info Pills */}
              <div className="flex flex-wrap gap-2 items-center">
                {profile?.city && profile?.country && (
                  <div className="flex items-center gap-1.5 text-sm text-white bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <MapPin className="h-4 w-4" />
                    <span className="hidden sm:inline">{profile.city}, {profile.country}</span>
                    <span className="sm:hidden">{profile.city}</span>
                  </div>
                )}

                {profile?.created_at && (
                  <div className="flex items-center gap-1.5 text-sm text-white bg-white/10 backdrop-blur-sm px-3 py-1 rounded-lg">
                    <Calendar className="h-4 w-4" />
                    <span>Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                )}

                {profile?.primary_skill && (
                  <span className="px-3 py-1 text-sm font-medium rounded-lg bg-primary text-primary-foreground">
                    {profile.primary_skill}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Hidden file inputs */}
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

      {/* Bio and Additional Info - Below Banner */}
      <div className="relative px-6 pb-6 pt-4">
        {profile?.bio && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">About</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}

        {/* User Rating */}
        {profile && (
          <div className="mb-4">
            <UserRatingDisplay userId={profile.id} compact={true} />
          </div>
        )}

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
