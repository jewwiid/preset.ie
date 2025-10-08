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
  skills: PredefinedOption[]
  talentCategories: PredefinedOption[]
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
    equipmentOptions: [],
    skills: [],
    talentCategories: []
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
          equipmentOptionsResult,
          skillsResult,
          talentCategoriesResult
        ] = await Promise.all([
          supabase
            .from('predefined_gender_identities')
            .select('id, identity_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_ethnicities')
            .select('id, ethnicity_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_body_types')
            .select('id, body_type_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_experience_levels')
            .select('id, level_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_availability_statuses')
            .select('id, status_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_hair_lengths')
            .select('id, length_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_skin_tones')
            .select('id, tone_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_hair_colors')
            .select('id, color_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_eye_colors')
            .select('id, color_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_style_tags')
            .select('id, tag_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_vibe_tags')
            .select('id, tag_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_equipment_options')
            .select('id, equipment_name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),
          
          supabase
            .from('predefined_skills')
            .select('id, name, is_active, sort_order')
            .eq('is_active', true)
            .order('sort_order'),

          supabase
            .from('predefined_talent_categories')
            .select('id, category_name, is_active, sort_order')
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
          equipmentOptionsResult,
          skillsResult,
          talentCategoriesResult
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

        // Helper function to transform data to standard format
        const transformToStandardFormat = (result: any, nameField: string): PredefinedOption[] => {
          if (result.error || !result.data || !Array.isArray(result.data)) {
            return []
          }
          return result.data
            .filter((item: any) => 
              item && typeof item === 'object' && 
              'id' in item && nameField in item && 'is_active' in item && 'sort_order' in item
            )
            .map((item: any) => ({
              id: item.id,
              name: item[nameField],
              is_active: item.is_active,
              sort_order: item.sort_order
            }))
        }

        // Set the options
        const finalOptions = {
          genderIdentities: transformToStandardFormat(genderIdentitiesResult, 'identity_name'),
          ethnicities: transformToStandardFormat(ethnicitiesResult, 'ethnicity_name'),
          bodyTypes: transformToStandardFormat(bodyTypesResult, 'body_type_name'),
          experienceLevels: transformToStandardFormat(experienceLevelsResult, 'level_name'),
          availabilityStatuses: transformToStandardFormat(availabilityStatusesResult, 'status_name'),
          hairLengths: transformToStandardFormat(hairLengthsResult, 'length_name'),
          skinTones: transformToStandardFormat(skinTonesResult, 'tone_name'),
          hairColors: transformToStandardFormat(hairColorsResult, 'color_name'),
          eyeColors: transformToStandardFormat(eyeColorsResult, 'color_name'),
          styleTags: transformToStandardFormat(styleTagsResult, 'tag_name'),
          vibeTags: transformToStandardFormat(vibeTagsResult, 'tag_name'),
          equipmentOptions: transformToStandardFormat(equipmentOptionsResult, 'equipment_name'),
          skills: transformToStandardFormat(skillsResult, 'name'),
          talentCategories: transformToStandardFormat(talentCategoriesResult, 'category_name')
        }
        
        setOptions(finalOptions)

      } catch (err) {
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.error('Error fetching predefined options:', err)
        }
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

