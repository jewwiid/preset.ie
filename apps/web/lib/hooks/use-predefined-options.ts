import { useState, useEffect } from 'react'
import { supabase } from '../supabase'

export interface PredefinedOption {
  id: number
  name: string
  is_active: boolean
  sort_order: number
}

export interface PredefinedOptions {
  genderIdentities: PredefinedOption[]
  ethnicities: PredefinedOption[]
  bodyTypes: PredefinedOption[]
  experienceLevels: PredefinedOption[]
  availabilityStatuses: PredefinedOption[]
  hairLengths: PredefinedOption[]
  skinTones: PredefinedOption[]
  hairColors: PredefinedOption[]
  eyeColors: PredefinedOption[]
  styleTags: PredefinedOption[]
  vibeTags: PredefinedOption[]
  equipmentOptions: PredefinedOption[]
}

export function usePredefinedOptions() {
  const [options, setOptions] = useState<PredefinedOptions>({
    genderIdentities: [],
    ethnicities: [],
    bodyTypes: [],
    experienceLevels: [],
    availabilityStatuses: [],
    hairLengths: [],
    skinTones: [],
    hairColors: [],
    eyeColors: [],
    styleTags: [],
    vibeTags: [],
    equipmentOptions: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAllOptions = async () => {
      if (!supabase) {
        setError('Supabase client not available')
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Fetch all predefined options in parallel
        const [
          genderIdentitiesResult,
          ethnicitiesResult,
          bodyTypesResult,
          experienceLevelsResult,
          availabilityStatusesResult,
          hairLengthsResult,
          skinTonesResult,
          hairColorsResult,
          eyeColorsResult,
          styleTagsResult,
          vibeTagsResult,
          equipmentOptionsResult
        ] = await Promise.all([
          supabase
            .from('predefined_gender_identities')
            .select('id, identity_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_ethnicities')
            .select('id, ethnicity_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_body_types')
            .select('id, body_type_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_experience_levels')
            .select('id, level_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_availability_statuses')
            .select('id, status_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_hair_lengths')
            .select('id, length_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_skin_tones')
            .select('id, tone_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_hair_colors')
            .select('id, color_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_eye_colors')
            .select('id, color_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_style_tags')
            .select('id, tag_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_vibe_tags')
            .select('id, tag_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_equipment_options')
            .select('id, equipment_name as name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order')
        ])

        // Check for errors
        const results = [
          genderIdentitiesResult,
          ethnicitiesResult,
          bodyTypesResult,
          experienceLevelsResult,
          availabilityStatusesResult,
          hairLengthsResult,
          skinTonesResult,
          hairColorsResult,
          eyeColorsResult,
          styleTagsResult,
          vibeTagsResult,
          equipmentOptionsResult
        ]

        for (const result of results) {
          if (result.error) {
            throw result.error
          }
        }

        // Helper function to safely extract data
        const safeExtract = (result: any): PredefinedOption[] => {
          if (result.error || !result.data || !Array.isArray(result.data)) {
            return []
          }
          return result.data.filter((item: any) => 
            item && typeof item === 'object' && 
            'id' in item && 'name' in item && 'is_active' in item && 'sort_order' in item
          )
        }

        // Set the options
        setOptions({
          genderIdentities: safeExtract(genderIdentitiesResult),
          ethnicities: safeExtract(ethnicitiesResult),
          bodyTypes: safeExtract(bodyTypesResult),
          experienceLevels: safeExtract(experienceLevelsResult),
          availabilityStatuses: safeExtract(availabilityStatusesResult),
          hairLengths: safeExtract(hairLengthsResult),
          skinTones: safeExtract(skinTonesResult),
          hairColors: safeExtract(hairColorsResult),
          eyeColors: safeExtract(eyeColorsResult),
          styleTags: safeExtract(styleTagsResult),
          vibeTags: safeExtract(vibeTagsResult),
          equipmentOptions: safeExtract(equipmentOptionsResult)
        })

      } catch (err) {
        console.error('Error fetching predefined options:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch options')
      } finally {
        setLoading(false)
      }
    }

    fetchAllOptions()
  }, [])

  return { options, loading, error }
}

// Helper function to get option names as strings
export function getOptionNames(options: PredefinedOption[]): string[] {
  return options.map(option => option.name)
}

// Helper function to find option by name
export function findOptionByName(options: PredefinedOption[], name: string): PredefinedOption | undefined {
  return options.find(option => option.name === name)
}
