import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all predefined data in parallel
    const [
      eyeColorsResult,
      hairColorsResult,
      clothingSizeSystemsResult,
      clothingSizesResult,
      shoeSizeSystemsResult,
      shoeSizesResult,
      talentCategoriesResult,
      predefinedRolesResult,
      professionalSkillsResult,
      languagesResult,
      specializationsResult,
      equipmentTypesResult,
      equipmentBrandsResult,
      genderIdentitiesResult,
      ethnicitiesResult,
      experienceLevelsResult,
      availabilityStatusesResult,
      nationalitiesResult
    ] = await Promise.all([
      supabase
        .from('predefined_eye_colors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_hair_colors')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_clothing_size_systems')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_clothing_sizes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_shoe_size_systems')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_shoe_sizes')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_talent_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_roles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_professional_skills')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('languages_master')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('specializations')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('equipment_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('equipment_brands')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_gender_identities')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_ethnicities')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_experience_levels')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_availability_statuses')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true }),
      
      supabase
        .from('predefined_nationalities')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
    ])

    // Check for errors
    const errors = [
      eyeColorsResult.error,
      hairColorsResult.error,
      clothingSizeSystemsResult.error,
      clothingSizesResult.error,
      shoeSizeSystemsResult.error,
      shoeSizesResult.error,
      talentCategoriesResult.error,
      predefinedRolesResult.error,
      professionalSkillsResult.error,
      languagesResult.error,
      specializationsResult.error,
      equipmentTypesResult.error,
      equipmentBrandsResult.error,
      genderIdentitiesResult.error,
      ethnicitiesResult.error,
      experienceLevelsResult.error,
      availabilityStatusesResult.error,
      nationalitiesResult.error
    ].filter(Boolean)

    if (errors.length > 0) {
      console.error('Errors fetching predefined data:', errors)
      return NextResponse.json(
        { error: 'Failed to fetch some predefined data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      eye_colors: eyeColorsResult.data || [],
      hair_colors: hairColorsResult.data || [],
      clothing_size_systems: clothingSizeSystemsResult.data || [],
      clothing_sizes: clothingSizesResult.data || [],
      shoe_size_systems: shoeSizeSystemsResult.data || [],
      shoe_sizes: shoeSizesResult.data || [],
      talent_categories: talentCategoriesResult.data || [],
      predefined_roles: predefinedRolesResult.data || [],
      professional_skills: professionalSkillsResult.data || [],
      languages: languagesResult.data || [],
      specializations: specializationsResult.data || [],
      equipment_types: equipmentTypesResult.data || [],
      equipment_brands: equipmentBrandsResult.data || [],
      gender_identities: genderIdentitiesResult.data || [],
      ethnicities: ethnicitiesResult.data || [],
      experience_levels: experienceLevelsResult.data || [],
      availability_statuses: availabilityStatusesResult.data || [],
      nationalities: nationalitiesResult.data || []
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
