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
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Personal Information</h2>

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

      {/* Date of Birth */}
      <DateField
        label="Date of Birth"
        value={isEditing ? formData.date_of_birth : profile?.date_of_birth}
        onChange={(value) => handleFieldChange('date_of_birth', value)}
        className={isEditing ? '' : 'pointer-events-none'}
      />

      {/* Location Toggle */}
      <LocationToggle
        checked={isEditing ? (formData.show_location || false) : (profile?.show_location || false)}
        onChange={(checked) => handleFieldChange('show_location', checked)}
        className={isEditing ? '' : 'pointer-events-none'}
      />

      {/* City */}
      <TextField
        label="City"
        value={isEditing ? formData.city : profile?.city}
        onChange={(value) => handleFieldChange('city', value)}
        placeholder="Enter your city"
        className={isEditing ? '' : 'pointer-events-none'}
      />

      {/* Country */}
      <TextField
        label="Country"
        value={isEditing ? formData.country : profile?.country}
        onChange={(value) => handleFieldChange('country', value)}
        placeholder="Enter your country"
        className={isEditing ? '' : 'pointer-events-none'}
      />

      {/* Contact Information */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Contact Information</h3>
        
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

        <TextField
          label="Website URL"
          value={isEditing ? formData.website_url : profile?.website_url}
          onChange={(value) => handleFieldChange('website_url', value)}
          placeholder="https://yourwebsite.com"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <TextField
          label="Portfolio URL"
          value={isEditing ? formData.portfolio_url : profile?.portfolio_url}
          onChange={(value) => handleFieldChange('portfolio_url', value)}
          placeholder="https://yourportfolio.com"
          className={isEditing ? '' : 'pointer-events-none'}
        />
      </div>
    </div>
  )
}
