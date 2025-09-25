'use client'

import React, { useState, useEffect } from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { TextField, NumberField, RangeField, TagInput } from '../common/FormField'
import { TravelToggle, StudioToggle } from '../common/ToggleSwitch'
import { Briefcase, DollarSign, MapPin, Building, Clock } from 'lucide-react'
import { EquipmentSection } from './EquipmentSection'

export function ProfessionalSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()
  
  const [predefinedSpecializations, setPredefinedSpecializations] = useState<string[]>([])
  const [predefinedLanguages, setPredefinedLanguages] = useState<string[]>([])
  const [loadingPredefined, setLoadingPredefined] = useState(false)

  // Fetch predefined options
  useEffect(() => {
    const fetchPredefinedOptions = async () => {
      setLoadingPredefined(true)
      try {
        // This would fetch from Supabase in a real implementation
        setPredefinedSpecializations([
          'Portrait Photography', 'Fashion Photography', 'Wedding Photography',
          'Event Photography', 'Commercial Photography', 'Editorial Photography',
          'Product Photography', 'Architecture Photography', 'Street Photography',
          'Documentary Photography', 'Fine Art Photography', 'Sports Photography'
        ])
        setPredefinedLanguages([
          'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
          'Chinese', 'Japanese', 'Korean', 'Arabic', 'Russian', 'Dutch'
        ])
      } catch (error) {
        console.error('Error fetching predefined options:', error)
      } finally {
        setLoadingPredefined(false)
      }
    }

    fetchPredefinedOptions()
  }, [])

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value)
  }

  const addSpecialization = (specialization: string) => {
    const currentSpecializations = formData.specializations || []
    if (!currentSpecializations.includes(specialization)) {
      handleFieldChange('specializations', [...currentSpecializations, specialization])
    }
  }

  const removeSpecialization = (specialization: string) => {
    const currentSpecializations = formData.specializations || []
    handleFieldChange('specializations', currentSpecializations.filter(s => s !== specialization))
  }

  const addLanguage = (language: string) => {
    const currentLanguages = formData.languages || []
    if (!currentLanguages.includes(language)) {
      handleFieldChange('languages', [...currentLanguages, language])
    }
  }

  const removeLanguage = (language: string) => {
    const currentLanguages = formData.languages || []
    handleFieldChange('languages', currentLanguages.filter(l => l !== language))
  }

  const addEditingSoftware = (software: string) => {
    const currentSoftware = formData.editing_software || []
    if (!currentSoftware.includes(software)) {
      handleFieldChange('editing_software', [...currentSoftware, software])
    }
  }

  const removeEditingSoftware = (software: string) => {
    const currentSoftware = formData.editing_software || []
    handleFieldChange('editing_software', currentSoftware.filter(s => s !== software))
  }

  const toggleTravelUnit = () => {
    const currentUnit = formData.travel_unit_preference || 'km'
    const newUnit = currentUnit === 'km' ? 'miles' : 'km'
    handleFieldChange('travel_unit_preference', newUnit)
  }

  const toggleTurnaroundUnit = () => {
    const currentUnit = formData.turnaround_unit_preference || 'days'
    const newUnit = currentUnit === 'days' ? 'weeks' : 'days'
    handleFieldChange('turnaround_unit_preference', newUnit)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <Briefcase className="w-5 h-5" />
        Professional Information
      </h2>

      {/* Experience */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Experience</h3>
        
        <RangeField
          label="Years of Experience"
          value={isEditing ? (formData.years_experience || 0) : (profile?.years_experience || 0)}
          onChange={(value) => handleFieldChange('years_experience', parseInt(value))}
          min={0}
          max={50}
          step={1}
          className={isEditing ? '' : 'pointer-events-none'}
        />

        <TagInput
          label="Specializations"
          tags={isEditing ? (formData.specializations || []) : (profile?.specializations || [])}
          onAddTag={addSpecialization}
          onRemoveTag={removeSpecialization}
          placeholder="Add a specialization..."
          predefinedOptions={predefinedSpecializations}
          className={isEditing ? '' : 'pointer-events-none'}
        />
      </div>

      {/* Rates */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Rates
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField
            label="Minimum Hourly Rate ($)"
            value={isEditing ? (formData.hourly_rate_min || '') : (profile?.hourly_rate_min || '')}
            onChange={(value) => handleFieldChange('hourly_rate_min', value ? parseInt(value) : null)}
            placeholder="No minimum"
            min={0}
            className={isEditing ? '' : 'pointer-events-none'}
          />
          
          <NumberField
            label="Maximum Hourly Rate ($)"
            value={isEditing ? (formData.hourly_rate_max || '') : (profile?.hourly_rate_max || '')}
            onChange={(value) => handleFieldChange('hourly_rate_max', value ? parseInt(value) : null)}
            placeholder="No maximum"
            min={0}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Travel Preferences */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Travel Preferences
        </h3>
        
        <TravelToggle
          checked={isEditing ? (formData.available_for_travel || false) : (profile?.available_for_travel || false)}
          onChange={(checked) => handleFieldChange('available_for_travel', checked)}
          className={isEditing ? '' : 'pointer-events-none'}
        />

        {(isEditing ? formData.available_for_travel : profile?.available_for_travel) && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-4">
              <RangeField
                label={`Travel Radius (${isEditing ? (formData.travel_unit_preference || 'km') : (profile?.travel_unit_preference || 'km')})`}
                value={isEditing ? (formData.travel_radius_km || 0) : (profile?.travel_radius_km || 0)}
                onChange={(value) => handleFieldChange('travel_radius_km', parseInt(value))}
                min={10}
                max={500}
                step={10}
                className={isEditing ? '' : 'pointer-events-none'}
              />
              
              <button
                type="button"
                onClick={toggleTravelUnit}
                className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors duration-200"
                disabled={!isEditing}
              >
                {isEditing ? (formData.travel_unit_preference || 'km') : (profile?.travel_unit_preference || 'km')}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Studio Information */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Building className="w-4 h-4" />
          Studio Information
        </h3>
        
        <StudioToggle
          checked={isEditing ? (formData.has_studio || false) : (profile?.has_studio || false)}
          onChange={(checked) => handleFieldChange('has_studio', checked)}
          className={isEditing ? '' : 'pointer-events-none'}
        />

        {(isEditing ? formData.has_studio : profile?.has_studio) && (
          <div className="mt-4 space-y-4">
            <TextField
              label="Studio Name"
              value={isEditing ? (formData.studio_name || '') : (profile?.studio_name || '')}
              onChange={(value) => handleFieldChange('studio_name', value)}
              placeholder="Enter studio name"
              className={isEditing ? '' : 'pointer-events-none'}
            />
            
            <TextField
              label="Studio Address"
              value={isEditing ? (formData.studio_address || '') : (profile?.studio_address || '')}
              onChange={(value) => handleFieldChange('studio_address', value)}
              placeholder="Enter studio address"
              className={isEditing ? '' : 'pointer-events-none'}
            />
          </div>
        )}
      </div>

      {/* Turnaround Time */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Turnaround Time
        </h3>
        
        <div className="flex items-center gap-4">
          <RangeField
            label={`Typical Turnaround (${isEditing ? (formData.turnaround_unit_preference || 'days') : (profile?.turnaround_unit_preference || 'days')})`}
            value={isEditing ? (formData.typical_turnaround_days || 0) : (profile?.typical_turnaround_days || 0)}
            onChange={(value) => handleFieldChange('typical_turnaround_days', parseInt(value))}
            min={0}
            max={365}
            step={1}
            className={isEditing ? '' : 'pointer-events-none'}
          />
          
          <button
            type="button"
            onClick={toggleTurnaroundUnit}
                className="px-3 py-2 text-sm bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors duration-200"
            disabled={!isEditing}
          >
            {isEditing ? (formData.turnaround_unit_preference || 'days') : (profile?.turnaround_unit_preference || 'days')}
          </button>
        </div>
      </div>

      {/* Languages */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Languages</h3>
        
        <TagInput
          label="Languages Spoken"
          tags={isEditing ? (formData.languages || []) : (profile?.languages || [])}
          onAddTag={addLanguage}
          onRemoveTag={removeLanguage}
          placeholder="Add a language..."
          predefinedOptions={predefinedLanguages}
          className={isEditing ? '' : 'pointer-events-none'}
        />
      </div>

      {/* Editing Software */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Editing Software</h3>
        
        <TagInput
          label="Editing Software"
          tags={isEditing ? (formData.editing_software || []) : (profile?.editing_software || [])}
          onAddTag={addEditingSoftware}
          onRemoveTag={removeEditingSoftware}
          placeholder="Add editing software..."
          predefinedOptions={[
            'Adobe Photoshop', 'Adobe Lightroom', 'Adobe Premiere Pro', 'Adobe After Effects',
            'Final Cut Pro', 'DaVinci Resolve', 'Capture One', 'Skylum Luminar',
            'ON1 Photo RAW', 'Corel PaintShop Pro', 'GIMP', 'Darktable',
            'Affinity Photo', 'Pixelmator Pro', 'Canva', 'Figma'
          ]}
          className={isEditing ? '' : 'pointer-events-none'}
        />
      </div>

      {/* Loading State */}
      {loadingPredefined && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin"></div>
            Loading predefined options...
          </div>
        </div>
      )}

      {/* Equipment Section */}
      <EquipmentSection />
    </div>
  )
}
