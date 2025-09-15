'use client'

import React from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { TextField, NumberField, SelectField } from '../common/FormField'
import { ToggleSwitch } from '../common/ToggleSwitch'
import { User, Globe, MapPin, Clock, Calendar } from 'lucide-react'

// Gender identity options
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'genderfluid', label: 'Genderfluid' },
  { value: 'agender', label: 'Agender' },
  { value: 'transgender_male', label: 'Transgender Male' },
  { value: 'transgender_female', label: 'Transgender Female' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'other', label: 'Other' }
]

// Ethnicity options
const ETHNICITY_OPTIONS = [
  { value: 'african_american', label: 'African American' },
  { value: 'asian', label: 'Asian' },
  { value: 'caucasian', label: 'Caucasian' },
  { value: 'hispanic_latino', label: 'Hispanic/Latino' },
  { value: 'middle_eastern', label: 'Middle Eastern' },
  { value: 'native_american', label: 'Native American' },
  { value: 'pacific_islander', label: 'Pacific Islander' },
  { value: 'mixed_race', label: 'Mixed Race' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' }
]

// Body type options
const BODY_TYPE_OPTIONS = [
  { value: 'petite', label: 'Petite' },
  { value: 'slim', label: 'Slim' },
  { value: 'athletic', label: 'Athletic' },
  { value: 'average', label: 'Average' },
  { value: 'curvy', label: 'Curvy' },
  { value: 'plus_size', label: 'Plus Size' },
  { value: 'muscular', label: 'Muscular' },
  { value: 'tall', label: 'Tall' },
  { value: 'short', label: 'Short' },
  { value: 'other', label: 'Other' }
]

// Experience level options
const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'professional', label: 'Professional' },
  { value: 'expert', label: 'Expert' }
]

// Availability status options
const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Available' },
  { value: 'busy', label: 'Busy' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'limited', label: 'Limited Availability' },
  { value: 'weekends_only', label: 'Weekends Only' },
  { value: 'weekdays_only', label: 'Weekdays Only' }
]

export function DemographicsSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-emerald-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Demographics</h2>
      </div>

      {/* Identity Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Identity</h3>
        
        <SelectField
          label="Gender Identity"
          value={isEditing ? formData.gender_identity : profile?.gender_identity}
          onChange={(value) => handleFieldChange('gender_identity', value)}
          options={GENDER_OPTIONS}
          placeholder="Select gender identity"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <SelectField
          label="Ethnicity"
          value={isEditing ? formData.ethnicity : profile?.ethnicity}
          onChange={(value) => handleFieldChange('ethnicity', value)}
          options={ETHNICITY_OPTIONS}
          placeholder="Select ethnicity"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <TextField
          label="Nationality"
          value={isEditing ? formData.nationality : profile?.nationality}
          onChange={(value) => handleFieldChange('nationality', value)}
          placeholder="e.g., American, Canadian, British"
          className={isEditing ? '' : 'pointer-events-none'}
        />
      </div>

      {/* Physical Attributes */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Physical Attributes</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField
            label="Height (cm)"
            value={isEditing ? formData.height_cm : profile?.height_cm}
            onChange={(value) => handleFieldChange('height_cm', value)}
            placeholder="e.g., 175"
            min={100}
            max={250}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <NumberField
            label="Weight (kg)"
            value={isEditing ? formData.weight_kg : profile?.weight_kg}
            onChange={(value) => handleFieldChange('weight_kg', value)}
            placeholder="e.g., 70"
            min={30}
            max={200}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>

        <SelectField
          label="Body Type"
          value={isEditing ? formData.body_type : profile?.body_type}
          onChange={(value) => handleFieldChange('body_type', value)}
          options={BODY_TYPE_OPTIONS}
          placeholder="Select body type"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Hair Length"
            value={isEditing ? formData.hair_length : profile?.hair_length}
            onChange={(value) => handleFieldChange('hair_length', value)}
            placeholder="e.g., Short, Medium, Long"
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <TextField
            label="Skin Tone"
            value={isEditing ? formData.skin_tone : profile?.skin_tone}
            onChange={(value) => handleFieldChange('skin_tone', value)}
            placeholder="e.g., Light, Medium, Dark"
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Professional Information */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Professional</h3>
        
        <SelectField
          label="Experience Level"
          value={isEditing ? formData.experience_level : profile?.experience_level}
          onChange={(value) => handleFieldChange('experience_level', value)}
          options={EXPERIENCE_LEVEL_OPTIONS}
          placeholder="Select experience level"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <SelectField
          label="Availability Status"
          value={isEditing ? formData.availability_status : profile?.availability_status}
          onChange={(value) => handleFieldChange('availability_status', value)}
          options={AVAILABILITY_OPTIONS}
          placeholder="Select availability status"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <TextField
          label="Preferred Working Hours"
          value={isEditing ? formData.preferred_working_hours : profile?.preferred_working_hours}
          onChange={(value) => handleFieldChange('preferred_working_hours', value)}
          placeholder="e.g., 9am-5pm, evenings only, flexible"
          className={isEditing ? '' : 'pointer-events-none'}
        />
      </div>

      {/* Location Information */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Location</h3>
        </div>
        
        <TextField
          label="State/Province"
          value={isEditing ? formData.state_province : profile?.state_province}
          onChange={(value) => handleFieldChange('state_province', value)}
          placeholder="e.g., California, Ontario, Bavaria"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <TextField
          label="Timezone"
          value={isEditing ? formData.timezone : profile?.timezone}
          onChange={(value) => handleFieldChange('timezone', value)}
          placeholder="e.g., PST, EST, GMT"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <ToggleSwitch
          label="Valid Passport"
          checked={isEditing ? (formData.passport_valid || false) : (profile?.passport_valid || false)}
          onChange={(checked) => handleFieldChange('passport_valid', checked)}
          className={isEditing ? '' : 'pointer-events-none'}
        />
      </div>

      {/* Privacy Controls */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Privacy Settings</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Control what information is visible to other users
        </p>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Show Age"
            checked={isEditing ? (formData.show_age || false) : (profile?.show_age || false)}
            onChange={(checked) => handleFieldChange('show_age', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Show Location"
            checked={isEditing ? (formData.show_location || false) : (profile?.show_location || false)}
            onChange={(checked) => handleFieldChange('show_location', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Show Physical Attributes"
            checked={isEditing ? (formData.show_physical_attributes || false) : (profile?.show_physical_attributes || false)}
            onChange={(checked) => handleFieldChange('show_physical_attributes', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>
    </div>
  )
}
