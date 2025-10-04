'use client'

import React, { useState, useEffect } from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { TextField, NumberField, SelectField } from '../common/FormField'
import { ToggleSwitch } from '../common/ToggleSwitch'
import { User, Globe, MapPin, Clock, Calendar } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

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

// Note: Physical attribute options (body_type, hair_length, skin_tone)
// have been moved to TalentSpecificSection for better organization

export function DemographicsSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()

  const [nationalityOptions, setNationalityOptions] = useState<Array<{value: string, label: string}>>([])
  const [loadingNationalities, setLoadingNationalities] = useState(false)

  // Fetch nationalities from database
  useEffect(() => {
    const fetchNationalities = async () => {
      setLoadingNationalities(true)
      try {
        if (!supabase) return

        const { data, error } = await (supabase as any)
          .from('predefined_nationalities')
          .select('nationality_name')
          .eq('is_active', true)
          .order('sort_order')

        if (!error && data) {
          const options = data.map((n: any) => ({
            value: n.nationality_name,
            label: n.nationality_name
          }))
          setNationalityOptions(options)
        }
      } catch (error) {
        console.error('Error fetching nationalities:', error)
      } finally {
        setLoadingNationalities(false)
      }
    }

    fetchNationalities()
  }, [])

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <User className="h-5 w-5 text-primary-600" />
        <h2 className="text-xl font-semibold text-foreground">Demographics</h2>
      </div>

      {/* Identity Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-foreground">Identity</h3>
        
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

        <SelectField
          label="Nationality"
          value={isEditing ? formData.nationality : profile?.nationality}
          onChange={(value) => handleFieldChange('nationality', value)}
          options={nationalityOptions}
          placeholder={loadingNationalities ? "Loading nationalities..." : "Select nationality"}
          className={isEditing ? '' : 'pointer-events-none'}
        />
      </div>

      {/* Note: Physical attributes (height, weight, body type, hair, skin tone)
          are now in the Talent-Specific section for better organization */}

      {/* Professional Information */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-lg font-medium text-foreground">Professional</h3>
        
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
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-primary-600" />
          <h3 className="text-lg font-medium text-foreground">Location</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="City"
            value={isEditing ? formData.city : profile?.city}
            onChange={(value) => handleFieldChange('city', value)}
            placeholder="e.g., Los Angeles, London, Paris"
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <TextField
            label="Country"
            value={isEditing ? formData.country : profile?.country}
            onChange={(value) => handleFieldChange('country', value)}
            placeholder="e.g., United States, United Kingdom"
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="State/Province (Optional)"
            value={isEditing ? formData.state_province : profile?.state_province}
            onChange={(value) => handleFieldChange('state_province', value)}
            placeholder="e.g., California, Ontario"
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <TextField
            label="Timezone (Optional)"
            value={isEditing ? formData.timezone : profile?.timezone}
            onChange={(value) => handleFieldChange('timezone', value)}
            placeholder="e.g., PST, EST, GMT"
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>

        <ToggleSwitch
          label="Valid Passport"
          checked={isEditing ? (formData.passport_valid || false) : (profile?.passport_valid || false)}
          onChange={(checked) => handleFieldChange('passport_valid', checked)}
          className={isEditing ? '' : 'pointer-events-none'}
        />
      </div>

      {/* Privacy Controls */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-lg font-medium text-foreground">Privacy Settings</h3>
        <p className="text-sm text-muted-foreground">
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
