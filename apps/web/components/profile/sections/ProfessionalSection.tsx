'use client'

import React, { useState, useEffect } from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { TextField, NumberField, RangeField, TagInput } from '../common/FormField'
import { TravelToggle, StudioToggle } from '../common/ToggleSwitch'
import { Briefcase, DollarSign, MapPin, Building, Clock } from 'lucide-react'
import { EquipmentSection } from './EquipmentSection'
import { UserSkillsSection } from './UserSkillsSection'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

export function ProfessionalSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()

  // Guard against SSR issues
  const [isMounted, setIsMounted] = useState(false)
  
  useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const [predefinedSpecializations, setPredefinedSpecializations] = useState<string[]>([])
  const [predefinedLanguages, setPredefinedLanguages] = useState<string[]>([])
  const [predefinedRoles, setPredefinedRoles] = useState<Array<{name: string, category: string}>>([])
  const [predefinedSkills, setPredefinedSkills] = useState<Array<{skill_name: string, category: string}>>([])
  const [predefinedStudioNames, setPredefinedStudioNames] = useState<Array<{name: string, category: string}>>([])
  const [predefinedStudioAddresses, setPredefinedStudioAddresses] = useState<Array<{address_type: string, description: string}>>([])
  const [loadingPredefined, setLoadingPredefined] = useState(false)

  // Fetch predefined options from database
  useEffect(() => {
    const fetchPredefinedOptions = async () => {
      // Only fetch on client side
      if (typeof window === 'undefined') return
      
      setLoadingPredefined(true)
      try {
        console.log('Fetching predefined data from API...')
        // Fetch predefined data from our API
        const response = await fetch('/api/predefined-data')
        console.log('API response status:', response.status, response.statusText)
        
        if (response.ok) {
          const data = await response.json()
          console.log('API data received:', {
            roles: data.predefined_roles?.length || 0,
            skills: data.professional_skills?.length || 0,
            specializations: data.specializations?.length || 0,
            languages: data.languages?.length || 0
          })
          
          setPredefinedRoles(data.predefined_roles || [])
          setPredefinedSkills(data.professional_skills || [])
          
          // Use specializations table for specializations
          setPredefinedSpecializations(
            data.specializations?.map((spec: any) => spec.name) || []
          )
          
          // Use languages_master table for languages
          setPredefinedLanguages(
            data.languages?.map((lang: any) => lang.name) || []
          )
        } else {
          console.error('Failed to fetch predefined data from API:', response.status, response.statusText)
          // No fallback - let the UI handle empty state
          setPredefinedRoles([])
          setPredefinedSpecializations([])
          setPredefinedLanguages([])
        }
      } catch (error) {
        console.error('Error fetching predefined options:', error)
        console.error('Error details:', {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          name: error instanceof Error ? error.name : 'Unknown'
        })
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

  // Don't render until mounted to prevent SSR issues
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="bg-muted rounded-lg p-4">
          <h3 className="text-lg font-medium text-foreground mb-4">Professional Information</h3>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <Briefcase className="w-5 h-5" />
        Professional Information
      </h2>

      {/* Primary Skill */}
      <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-primary" />
          Primary Skill
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          This is shown on your profile and in directory listings
        </p>

        <div>
          <Label htmlFor="primary-skill">Your main profession or category</Label>
          <Select
            value={isEditing ? (formData.primary_skill || '') : (profile?.primary_skill || '')}
            onValueChange={(value) => handleFieldChange('primary_skill', value)}
            disabled={!isEditing || loadingPredefined}
          >
            <SelectTrigger id="primary-skill">
              <SelectValue placeholder={loadingPredefined ? "Loading options..." : "Select your primary skill..."} />
            </SelectTrigger>
            <SelectContent>
              {predefinedRoles
                .filter(role => role.category !== 'admin') // Exclude admin roles
                .map((role) => (
                  <SelectItem key={role.name} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Skills & Experience */}
      <UserSkillsSection />

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
        
        <div className="space-y-4">
          <TextField
            label="Studio Name (Optional)"
            value={isEditing ? (formData.studio_name || '') : (profile?.studio_name || '')}
            onChange={(value) => handleFieldChange('studio_name', value)}
            placeholder="Enter studio name"
            className={isEditing ? '' : 'pointer-events-none'}
          />
          
          <TextField
            label="Studio Address (Optional)"
            value={isEditing ? (formData.studio_address || '') : (profile?.studio_address || '')}
            onChange={(value) => handleFieldChange('studio_address', value)}
            placeholder="Enter studio address"
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
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
          predefinedOptions={
            predefinedSkills
              .filter((skill: any) => skill.category === 'software')
              .map((skill: any) => skill.skill_name)
          }
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
