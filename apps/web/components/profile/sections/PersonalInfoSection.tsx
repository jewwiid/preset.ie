'use client'

import React from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { TextField, TextareaField, DateField } from '../common/FormField'
import { LocationToggle } from '../common/ToggleSwitch'

export function PersonalInfoSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6">Personal Information</h2>

      {/* Display Name */}
      <TextField
        label="Display Name"
        value={isEditing ? formData.display_name : profile?.display_name}
        onChange={(value) => handleFieldChange('display_name', value)}
        placeholder="Enter your display name"
        required
        className={isEditing ? '' : 'pointer-events-none'}
      />

      {/* Handle */}
      <TextField
        label="Handle"
        value={isEditing ? formData.handle : profile?.handle}
        onChange={(value) => handleFieldChange('handle', value)}
        placeholder="Enter your handle"
        required
        className={isEditing ? '' : 'pointer-events-none'}
      />

      {/* Bio */}
      <TextareaField
        label="Bio"
        value={isEditing ? formData.bio : profile?.bio}
        onChange={(value) => handleFieldChange('bio', value)}
        placeholder="Tell us about yourself..."
        className={isEditing ? '' : 'pointer-events-none'}
      />

      {/* Date of Birth - Always disabled for security */}
      <div className="space-y-2">
        <DateField
          label="Date of Birth (Cannot be changed)"
          value={isEditing ? formData.date_of_birth : profile?.date_of_birth}
          onChange={(value) => handleFieldChange('date_of_birth', value)}
          className="pointer-events-none opacity-60"
          disabled
        />
        <p className="text-xs text-muted-foreground">
          Date of birth cannot be changed after signup for security and verification purposes.
        </p>
      </div>

      {/* Location Toggle */}
      <LocationToggle
        checked={isEditing ? (formData.show_location || false) : (profile?.show_location || false)}
        onChange={(checked) => handleFieldChange('show_location', checked)}
        className={isEditing ? '' : 'pointer-events-none'}
      />

      {/* Location moved to DemographicsSection */}

      {/* Contact Information */}
      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Contact Information</h3>
        
        <TextField
          label="Phone Number"
          value={isEditing ? formData.phone_number : profile?.phone_number}
          onChange={(value) => handleFieldChange('phone_number', value)}
          placeholder="Enter your phone number"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <TextField
          label="Instagram Handle"
          value={isEditing ? formData.instagram_handle : profile?.instagram_handle}
          onChange={(value) => handleFieldChange('instagram_handle', value)}
          placeholder="@your_instagram"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <TextField
          label="TikTok Handle"
          value={isEditing ? formData.tiktok_handle : profile?.tiktok_handle}
          onChange={(value) => handleFieldChange('tiktok_handle', value)}
          placeholder="@your_tiktok"
          className={isEditing ? '' : 'pointer-events-none'}
        />

      </div>
    </div>
  )
}
