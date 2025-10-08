'use client'

import React, { useState, useEffect } from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { TextField, NumberField, SelectField } from '../common/FormField'
import { ToggleSwitch } from '../common/ToggleSwitch'
import { User, Globe, MapPin, Clock, Calendar } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

// These options are now fetched from the database via the predefined-data API

// Note: Physical attribute options (body_type, hair_length, skin_tone)
// have been moved to TalentSpecificSection for better organization

export function DemographicsSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()

  // Helper function to get contextual experience level label
  const getExperienceLevelLabel = (primarySkill: string | null | undefined) => {
    if (!primarySkill) return 'Experience Level'
    return `${primarySkill} Experience Level`
  }

  // Helper function to get contextual help text
  const getExperienceLevelHelpText = (primarySkill: string | null | undefined) => {
    if (!primarySkill) return 'Select your primary skill first'
    return `Your experience level in ${primarySkill}`
  }

  // Database-driven options state
  const [genderOptions, setGenderOptions] = useState<Array<{value: string, label: string}>>([])
  const [ethnicityOptions, setEthnicityOptions] = useState<Array<{value: string, label: string}>>([])
  const [experienceLevelOptions, setExperienceLevelOptions] = useState<Array<{value: string, label: string}>>([])
  const [availabilityOptions, setAvailabilityOptions] = useState<Array<{value: string, label: string}>>([])
  const [nationalityOptions, setNationalityOptions] = useState<Array<{value: string, label: string}>>([])
  const [countryOptions, setCountryOptions] = useState<Array<{value: string, label: string}>>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Fetch all predefined options from database
  useEffect(() => {
    const fetchPredefinedOptions = async () => {
      setLoadingOptions(true)
      try {
        const response = await fetch('/api/predefined-data')
        if (response.ok) {
          const data = await response.json()
          
          // Set gender options
          setGenderOptions(
            data.gender_identities?.map((g: any) => ({
              value: g.identity_name.toLowerCase().replace(/\s+/g, '_'),
              label: g.identity_name
            })) || []
          )
          
          // Set ethnicity options
          setEthnicityOptions(
            data.ethnicities?.map((e: any) => ({
              value: e.ethnicity_name.toLowerCase().replace(/\s+/g, '_'),
              label: e.ethnicity_name
            })) || []
          )
          
          // Set experience level options
          setExperienceLevelOptions(
            data.experience_levels?.map((el: any) => ({
              value: el.level_name.toLowerCase().replace(/\s+/g, '_'),
              label: el.level_name
            })) || []
          )
          
          // Set availability options
          setAvailabilityOptions(
            data.availability_statuses?.map((as: any) => ({
              value: as.status_name, // Use the original capitalized value from database
              label: as.status_name
            })) || []
          )
          
          // Set nationality options
          setNationalityOptions(
            data.nationalities?.map((n: any) => ({
              value: n.nationality_name,
              label: n.nationality_name
            })) || []
          )
          
          // Set country options - map nationality to country name
          const nationalityToCountryMap: { [key: string]: string } = {
            'Irish': 'Ireland',
            'American': 'United States',
            'British': 'United Kingdom',
            'Canadian': 'Canada',
            'Australian': 'Australia',
            'German': 'Germany',
            'French': 'France',
            'Spanish': 'Spain',
            'Italian': 'Italy',
            'Dutch': 'Netherlands',
            'Swedish': 'Sweden',
            'Norwegian': 'Norway',
            'Danish': 'Denmark',
            'Finnish': 'Finland',
            'Polish': 'Poland',
            'Russian': 'Russia',
            'Chinese': 'China',
            'Japanese': 'Japan',
            'Korean': 'South Korea',
            'Indian': 'India',
            'Brazilian': 'Brazil',
            'Mexican': 'Mexico',
            'Argentine': 'Argentina',
            'Chilean': 'Chile',
            'Peruvian': 'Peru',
            'Colombian': 'Colombia',
            'Venezuelan': 'Venezuela',
            'South African': 'South Africa',
            'Egyptian': 'Egypt',
            'Nigerian': 'Nigeria',
            'Kenyan': 'Kenya',
            'Moroccan': 'Morocco',
            'Turkish': 'Turkey',
            'Israeli': 'Israel',
            'Saudi': 'Saudi Arabia',
            'Emirati': 'United Arab Emirates',
            'Qatari': 'Qatar',
            'Kuwaiti': 'Kuwait',
            'Lebanese': 'Lebanon',
            'Jordanian': 'Jordan',
            'Pakistani': 'Pakistan',
            'Bangladeshi': 'Bangladesh',
            'Sri Lankan': 'Sri Lanka',
            'Thai': 'Thailand',
            'Vietnamese': 'Vietnam',
            'Indonesian': 'Indonesia',
            'Malaysian': 'Malaysia',
            'Singaporean': 'Singapore',
            'Filipino': 'Philippines',
            'New Zealander': 'New Zealand'
          }
          
          setCountryOptions(
            data.nationalities?.map((n: any) => ({
              value: nationalityToCountryMap[n.nationality_name] || n.nationality_name,
              label: nationalityToCountryMap[n.nationality_name] || n.nationality_name
            })).filter((option: any, index: number, self: any[]) => 
              // Remove duplicates
              index === self.findIndex((t) => t.value === option.value)
            ).sort((a: any, b: any) => a.label.localeCompare(b.label)) || []
          )
        }
      } catch (error) {
        console.error('Error fetching predefined options:', error)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchPredefinedOptions()
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
          options={genderOptions}
          placeholder="Select gender identity"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <SelectField
          label="Ethnicity"
          value={isEditing ? formData.ethnicity : profile?.ethnicity}
          onChange={(value) => handleFieldChange('ethnicity', value)}
          options={ethnicityOptions}
          placeholder="Select ethnicity"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <SelectField
          label="Nationality"
          value={isEditing ? formData.nationality : profile?.nationality}
          onChange={(value) => handleFieldChange('nationality', value)}
          options={nationalityOptions}
          placeholder={loadingOptions ? "Loading nationalities..." : "Select nationality"}
          className={isEditing ? '' : 'pointer-events-none'}
        />
      </div>

      {/* Note: Physical attributes (height, weight, body type, hair, skin tone)
          are now in the Talent-Specific section for better organization */}

      {/* Professional Information */}
      <div className="space-y-4 border-t border-border pt-6">
        <h3 className="text-lg font-medium text-foreground">Professional</h3>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {getExperienceLevelLabel(isEditing ? formData.primary_skill : profile?.primary_skill)}
          </label>
          <p className="text-xs text-muted-foreground">
            {getExperienceLevelHelpText(isEditing ? formData.primary_skill : profile?.primary_skill)}
          </p>
          <SelectField
            label=""
            value={isEditing ? formData.experience_level : profile?.experience_level}
            onChange={(value) => handleFieldChange('experience_level', value)}
            options={experienceLevelOptions}
            placeholder="Select experience level"
            className={isEditing ? '' : 'pointer-events-none'}
            disabled={!isEditing || !(isEditing ? formData.primary_skill : profile?.primary_skill)}
          />
        </div>

        <SelectField
          label="Availability Status"
          value={isEditing ? formData.availability_status : profile?.availability_status}
          onChange={(value) => handleFieldChange('availability_status', value)}
          options={availabilityOptions}
          placeholder="Select availability status"
          className={isEditing ? '' : 'pointer-events-none'}
        />

        {/* Working Hours moved to separate WorkingHoursSection component */}
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

          <SelectField
            label="Country"
            value={isEditing ? formData.country : profile?.country}
            onChange={(value) => handleFieldChange('country', value)}
            options={countryOptions}
            placeholder={loadingOptions ? "Loading countries..." : "Select country..."}
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

          {/* Timezone moved to WorkingHoursSection component */}
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
