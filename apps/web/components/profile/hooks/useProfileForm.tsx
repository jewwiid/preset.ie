'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '../../../lib/auth-context'
import { supabase } from '../../../lib/supabase'
import { UserProfile, UseProfileFormReturn } from '../types/profile'

export function useProfileForm(): UseProfileFormReturn {
  const { user } = useAuth()
  const [formData, setFormData] = useState<Partial<UserProfile>>()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFieldChange = useCallback((field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }, [])

  const handleSave = useCallback(async () => {
    if (!user || !formData) return

    setSaving(true)
    setError(null)

    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Sanitize form data
      const sanitizedFormData = {
        display_name: formData.display_name?.trim() || null,
        handle: formData.handle?.trim() || null,
        bio: formData.bio?.trim() || null,
        city: formData.city?.trim() || null,
        country: formData.country?.trim() || null,
        phone_number: formData.phone_number?.trim() || null,
        instagram_handle: formData.instagram_handle?.trim() || null,
        tiktok_handle: formData.tiktok_handle?.trim() || null,
        website_url: formData.website_url?.trim() || null,
        portfolio_url: formData.portfolio_url?.trim() || null,
        years_experience: formData.years_experience || 0,
        professional_skills: formData.professional_skills || [],
        equipment_list: formData.equipment_list || [],
        editing_software: formData.editing_software || [],
        languages: formData.languages || [],
        hourly_rate_min: formData.hourly_rate_min || null,
        hourly_rate_max: formData.hourly_rate_max || null,
        available_for_travel: formData.available_for_travel || false,
        travel_radius_km: formData.travel_radius_km || null,
        travel_unit_preference: formData.travel_unit_preference || 'km',
        studio_name: formData.studio_name?.trim() || null,
        has_studio: formData.has_studio || false,
        studio_address: formData.studio_address?.trim() || null,
        show_location: formData.show_location !== undefined ? formData.show_location : true,
        typical_turnaround_days: formData.typical_turnaround_days || null,
        turnaround_unit_preference: formData.turnaround_unit_preference || 'days',
        height_cm: formData.height_cm || null,
        // measurements: formData.measurements?.trim() || null, // DEPRECATED: Use user_measurements table instead
        eye_color: formData.eye_color?.trim() || null,
        hair_color: formData.hair_color?.trim() || null,
        shoe_size: formData.shoe_size?.trim() || null,
        clothing_sizes: formData.clothing_sizes || [],
        tattoos: formData.tattoos || false,
        piercings: formData.piercings || false,
        talent_categories: formData.talent_categories || [],
        style_tags: formData.style_tags || [],
        vibe_tags: formData.vibe_tags || [],
        date_of_birth: formData.date_of_birth || null,
        avatar_url: formData.avatar_url || null,
        header_banner_url: formData.header_banner_url || null,
        header_banner_position: formData.header_banner_position || null
      }

      // Update profile in database
      const { data, error } = await supabase
        .from('users_profile')
        .update(sanitizedFormData)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      // Update local form data with the saved data
      setFormData(data)
    } catch (err) {
      console.error('Error saving profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }, [user, formData])

  const handleCancel = useCallback(() => {
    setFormData({})
    setError(null)
  }, [])

  const setEditing = useCallback((editing: boolean) => {
    setIsEditing(editing)
    if (!editing) {
      handleCancel()
    }
  }, [handleCancel])

  return {
    formData,
    isEditing,
    saving,
    error,
    handleFieldChange,
    handleSave,
    handleCancel,
    setEditing
  }
}
