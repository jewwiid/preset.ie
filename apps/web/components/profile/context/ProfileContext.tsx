'use client'

import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'
import {
  ProfileState,
  ProfileAction,
  UserProfile,
  UserSettings,
  NotificationPreferences,
  BannerPosition
} from '../types/profile'

// Initial state
const initialState: ProfileState = {
  profile: null,
  settings: null,
  notificationPrefs: null,
  isEditing: false,
  isEditingHeader: false,
  editingStudioName: false,
  editingStudioAddress: false,
  formData: {},
  loading: true,
  saving: false,
  error: null,
  activeTab: 'profile',
  activeSubTab: 'personal',
  showLocation: true,
  isDraggingHeader: false,
  headerPosition: { y: 0, scale: 1 }
}

// Reducer function
function profileReducer(state: ProfileState, action: ProfileAction): ProfileState {
  switch (action.type) {
    case 'SET_PROFILE':
      return {
        ...state,
        profile: action.payload,
        formData: action.payload || {}
      }
    
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: action.payload
      }
    
    case 'SET_NOTIFICATION_PREFS':
      return {
        ...state,
        notificationPrefs: action.payload
      }
    
    case 'SET_EDITING':
      return {
        ...state,
        isEditing: action.payload,
        error: action.payload ? state.error : null, // Clear error when entering edit mode
        formData: action.payload && state.profile ? {
          ...state.profile,
          // Ensure array fields are properly initialized when entering edit mode
          clothing_sizes: state.profile.clothing_sizes || null, // TEXT field, not array
          performance_roles: state.profile.performance_roles || [],
          professional_skills: state.profile.professional_skills || [],
          style_tags: state.profile.style_tags || [],
          vibe_tags: state.profile.vibe_tags || []
        } : state.formData // Initialize form data when entering edit mode
      }
    
    case 'SET_EDITING_HEADER':
      return {
        ...state,
        isEditingHeader: action.payload
      }
    
    case 'SET_EDITING_STUDIO_NAME':
      return {
        ...state,
        editingStudioName: action.payload
      }
    
    case 'SET_EDITING_STUDIO_ADDRESS':
      return {
        ...state,
        editingStudioAddress: action.payload
      }
    
    case 'SET_FORM_DATA':
      return {
        ...state,
        formData: action.payload
      }
    
    case 'UPDATE_FORM_FIELD':
      return {
        ...state,
        formData: {
          ...state.formData,
          [action.payload.field]: action.payload.value
        }
      }
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    
    case 'SET_SAVING':
      return {
        ...state,
        saving: action.payload
      }
    
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      }
    
    case 'SET_ACTIVE_TAB':
      return {
        ...state,
        activeTab: action.payload
      }
    
    case 'SET_ACTIVE_SUB_TAB':
      return {
        ...state,
        activeSubTab: action.payload
      }
    
    case 'SET_SHOW_LOCATION':
      return {
        ...state,
        showLocation: action.payload
      }
    
    case 'SET_DRAGGING_HEADER':
      return {
        ...state,
        isDraggingHeader: action.payload
      }
    
    case 'SET_HEADER_POSITION':
      return {
        ...state,
        headerPosition: action.payload
      }
    
    case 'RESET_FORM_DATA':
      return {
        ...state,
        formData: state.profile ? {
          ...state.profile,
          // Ensure array fields are properly initialized
          clothing_sizes: state.profile.clothing_sizes || null, // TEXT field, not array
          performance_roles: state.profile.performance_roles || [],
          professional_skills: state.profile.professional_skills || [],
          style_tags: state.profile.style_tags || [],
          vibe_tags: state.profile.vibe_tags || []
        } : {},
        error: null
      }
    
    default:
      return state
  }
}

// Context type
interface ProfileContextType {
  state: ProfileState
  dispatch: React.Dispatch<ProfileAction>
}

// Create context
const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

// Provider component
interface ProfileProviderProps {
  children: ReactNode
}

// Function to sync detailed clothing data with profile
async function syncClothingDataWithProfile(userId: string, profileId: string) {
  if (!supabase) return

  try {
        // Fetch user's profile data (clothing sizes and measurements are stored directly in users_profile)
        const { data: profileData, error: profileError } = await (supabase as any)
          .from('users_profile')
          .select('clothing_sizes, measurements, height_cm, shoe_size')
          .eq('id', profileId)
          .single()

    if (profileError) {
      console.error('Error fetching profile data:', {
        message: profileError?.message || 'No message',
        code: profileError?.code || 'No code',
        details: profileError?.details || 'No details',
        hint: profileError?.hint || 'No hint',
        fullError: profileError,
        errorType: typeof profileError,
        errorKeys: profileError ? Object.keys(profileError) : 'No keys',
        errorStringified: JSON.stringify(profileError)
      })
      return
    }

    // Extract clothing sizes from the profile data (TEXT field)
    const clothingSizes = (profileData as any)?.clothing_sizes || null
    
    // Extract measurements from the profile data (TEXT field)
    const measurements = (profileData as any)?.measurements || null
    const heightCm = (profileData as any)?.height_cm
    const shoeSize = (profileData as any)?.shoe_size

    // Format measurements for display
    const measurementStrings = []
    if (heightCm) {
      measurementStrings.push(`Height: ${heightCm}cm`)
    }
    if (shoeSize) {
      measurementStrings.push(`Shoe Size: ${shoeSize}`)
    }
    if (measurements && typeof measurements === 'string') {
      measurementStrings.push(measurements)
    }

    // Combine measurements into a single string
    const measurementsString = measurementStrings.length > 0 ? measurementStrings.join(', ') : null

    // Update the profile with synced data
    const { error: updateError } = await (supabase as any)
      .from('users_profile')
      .update({
        clothing_sizes: clothingSizes,
        measurements: measurementsString
      })
      .eq('id', profileId)

    if (updateError) {
      console.error('Error updating profile with clothing data:', updateError)
    } else {
      console.log('✅ Synced clothing data with profile')
    }

  } catch (error) {
    console.error('Error syncing clothing data:', error)
  }
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const [state, dispatch] = useReducer(profileReducer, initialState)
  const { user, loading: authLoading } = useAuth()

  // Fetch profile data when user changes
  useEffect(() => {
    console.log('ProfileContext useEffect triggered, user:', user ? user.id : 'null', 'authLoading:', authLoading)
    
    // Wait for auth to finish loading
    if (authLoading) {
      console.log('Auth still loading, keeping profile loading state')
      return
    }
    
    if (!user) {
      console.log('No user found after auth loaded, setting profile to null')
      // No user authenticated, clear profile and stop loading
      dispatch({ type: 'SET_PROFILE', payload: null })
      dispatch({ type: 'SET_LOADING', payload: false })
      return
    }

    const fetchProfileData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true })
        console.log('Fetching profile for user:', user.id)

        if (!supabase) {
          console.error('Supabase client not available')
          dispatch({ type: 'SET_ERROR', payload: 'Database connection not available' })
          dispatch({ type: 'SET_LOADING', payload: false })
          return
        }
        
        // Fetch from users_profile table (correct table name from schema)
        const { data: profile, error: profileError } = await (supabase as any)
          .from('users_profile')
          .select('*')
          .eq('user_id', user.id)
          .single()

        console.log('Supabase response:', { profile, profileError })

        if (profileError) {
          console.error('Error fetching profile:', profileError)
          console.error('Profile error details:', {
            code: profileError.code,
            message: profileError.message,
            details: profileError.details,
            hint: profileError.hint
          })
          
          // Handle empty error objects
          if (!profileError.code && !profileError.message) {
            console.error('Empty error object detected from Supabase')
            dispatch({ type: 'SET_ERROR', payload: 'Database connection error' })
            dispatch({ type: 'SET_LOADING', payload: false })
            return
          }
          
          // Handle specific error codes
          if (profileError.code === 'PGRST116') {
            console.log('Profile not found, creating default profile...')
            const defaultProfile = {
              user_id: user.id,
              display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'New User',
              handle: user.email?.split('@')[0] || 'new_user',
              bio: '',
              city: '',
              country: '',
              role_flags: ['TALENT'],
              style_tags: [],
              subscription_tier: 'FREE',
              subscription_status: 'ACTIVE',
              verified_id: false,
              // Initialize clothing/measurement fields
              height_cm: null,
              measurements: null,
              eye_color: null,
              hair_color: null,
              shoe_size: null,
              clothing_sizes: null, // TEXT field, not array
              tattoos: false,
              piercings: false,
              performance_roles: [],
              vibe_tags: []
            }
            const { data: newProfile, error: createError } = await (supabase as any)
              .from('users_profile')
              .insert(defaultProfile as any)
              .select()
              .single()
            
            if (createError) {
              console.error('Error creating profile:', createError)
              dispatch({ type: 'SET_ERROR', payload: 'Failed to create profile' })
              return
            }
            dispatch({ type: 'SET_PROFILE', payload: newProfile as any })
          } else {
            console.error('Unexpected profile error:', profileError)
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load profile' })
            dispatch({ type: 'SET_LOADING', payload: false })
            return
          }
        } else {
          // Ensure clothing/measurement fields are properly initialized
          const initializedProfile = {
            ...(profile as any),
            height_cm: (profile as any).height_cm || null,
            measurements: (profile as any).measurements || null,
            eye_color: (profile as any).eye_color || null,
            hair_color: (profile as any).hair_color || null,
            shoe_size: (profile as any).shoe_size || null,
            clothing_sizes: (profile as any).clothing_sizes || null, // TEXT field, not array
            tattoos: (profile as any).tattoos || false,
            piercings: (profile as any).piercings || false,
            performance_roles: (profile as any).performance_roles || [],
            style_tags: (profile as any).style_tags || [],
            vibe_tags: (profile as any).vibe_tags || []
          }
          dispatch({ type: 'SET_PROFILE', payload: initializedProfile })
          
          // Sync detailed clothing data from separate tables
          await syncClothingDataWithProfile(user.id, (profile as any).id)
        }

        // Fetch user settings with proper error handling
        if (profile) {
          try {
            if (!supabase) {
              console.error('Supabase client not available')
              dispatch({ type: 'SET_SETTINGS', payload: null })
              return
            }

            // Try to get existing settings
            const { data: settings, error: settingsError } = await (supabase as any)
              .from('user_settings')
              .select('*')
              .eq('user_id', (profile as any).user_id)
              .maybeSingle()

            if (settingsError) {
              console.error('Error fetching settings:', settingsError)
              
              // If no settings found, create default settings
              if (settingsError.code === 'PGRST116') {
                console.log('No settings found, creating default settings...')
                const { data: newSettings, error: createError } = await (supabase as any)
                  .from('user_settings')
                  .insert({
                    user_id: (profile as any).user_id,
                    email_notifications: true,
                    push_notifications: true,
                    marketing_emails: false,
                    profile_visibility: 'public',
                    show_contact_info: true,
                    two_factor_enabled: false
                  } as any)
                  .select()
                  .single()
                
                if (createError) {
                  console.error('Error creating default settings:', createError)
                  dispatch({ type: 'SET_SETTINGS', payload: null })
                } else {
                  dispatch({ type: 'SET_SETTINGS', payload: newSettings as any })
                }
              } else {
                dispatch({ type: 'SET_SETTINGS', payload: null })
              }
            } else {
              dispatch({ type: 'SET_SETTINGS', payload: settings as any })
            }
          } catch (error) {
            console.error('Unexpected error fetching user settings:', error)
            dispatch({ type: 'SET_SETTINGS', payload: null })
          }
        } else {
          // No profile exists, set settings to null
          dispatch({ type: 'SET_SETTINGS', payload: null })
        }

        dispatch({ type: 'SET_LOADING', payload: false })
      } catch (error) {
        console.error('Unexpected error:', error)
        dispatch({ type: 'SET_ERROR', payload: 'An unexpected error occurred' })
        dispatch({ type: 'SET_LOADING', payload: false })
      }
    }

    fetchProfileData()
  }, [user, authLoading])

  return (
    <ProfileContext.Provider value={{ state, dispatch }}>
      {children}
    </ProfileContext.Provider>
  )
}

// Custom hook to use the context
export function useProfileContext() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfileContext must be used within a ProfileProvider')
  }
  return context
}

// Convenience hooks for specific state slices
export function useProfile() {
  const { state, dispatch } = useProfileContext()
  return {
    profile: state.profile,
    setProfile: (profile: UserProfile) => dispatch({ type: 'SET_PROFILE', payload: profile })
  }
}

export function useProfileSettings() {
  const { state, dispatch } = useProfileContext()
  return {
    settings: state.settings,
    notificationPrefs: state.notificationPrefs,
    setSettings: (settings: UserSettings | null) => dispatch({ type: 'SET_SETTINGS', payload: settings }),
    setNotificationPrefs: (prefs: NotificationPreferences) => dispatch({ type: 'SET_NOTIFICATION_PREFS', payload: prefs })
  }
}

export function useProfileEditing() {
  const { state, dispatch } = useProfileContext()
  return {
    isEditing: state.isEditing,
    isEditingHeader: state.isEditingHeader,
    editingStudioName: state.editingStudioName,
    editingStudioAddress: state.editingStudioAddress,
    setEditing: (editing: boolean) => dispatch({ type: 'SET_EDITING', payload: editing }),
    setEditingHeader: (editing: boolean) => dispatch({ type: 'SET_EDITING_HEADER', payload: editing }),
    setEditingStudioName: (editing: boolean) => dispatch({ type: 'SET_EDITING_STUDIO_NAME', payload: editing }),
    setEditingStudioAddress: (editing: boolean) => dispatch({ type: 'SET_EDITING_STUDIO_ADDRESS', payload: editing })
  }
}

export function useProfileForm() {
  const { state, dispatch } = useProfileContext()
  const { user } = useAuth()

  const handleSave = async () => {
    if (!state.profile) return

    dispatch({ type: 'SET_SAVING', payload: true })
    try {
      // Debug: Check if supabase client is available
      if (!supabase) {
        console.error('Supabase client is not available')
        dispatch({ type: 'SET_ERROR', payload: 'Database connection not available' })
        return
      }

      // Check if user is authenticated
      if (!user) {
        console.error('User not authenticated')
        dispatch({ type: 'SET_ERROR', payload: 'You must be logged in to save your profile' })
        return
      }

      // Check if user is trying to update their own profile
      if (state.profile.user_id !== user.id) {
        console.error('User trying to update someone else\'s profile')
        console.error('Profile user_id:', state.profile.user_id)
        console.error('Current user ID:', user.id)
        dispatch({ type: 'SET_ERROR', payload: 'You can only update your own profile' })
        return
      }
      
      // Debug logging (remove in production)
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting profile save for profile ID:', state.profile.id)
        console.log('User ID:', user.id)
        console.log('Profile user_id:', state.profile.user_id)
      }
      // Sanitize form data
      const sanitizedFormData = {
        display_name: state.formData.display_name?.trim() || null,
        handle: state.formData.handle?.trim() || null,
        bio: state.formData.bio?.trim() || null,
        city: state.formData.city?.trim() || null,
        country: state.formData.country?.trim() || null,
        date_of_birth: state.formData.date_of_birth || null,
        phone_number: state.formData.phone_number?.trim() || null,
        instagram_handle: state.formData.instagram_handle?.trim() || null,
        tiktok_handle: state.formData.tiktok_handle?.trim() || null,
        website_url: state.formData.website_url?.trim() || null,
        portfolio_url: state.formData.portfolio_url?.trim() || null,
        years_experience: state.formData.years_experience || null,
        professional_skills: state.formData.professional_skills || [],
        equipment_list: state.formData.equipment_list || [],
        editing_software: state.formData.editing_software || [],
        languages: state.formData.languages || [],
        hourly_rate_min: state.formData.hourly_rate_min || null,
        hourly_rate_max: state.formData.hourly_rate_max || null,
        available_for_travel: state.formData.available_for_travel || false,
        travel_radius_km: state.formData.travel_radius_km || null,
        travel_unit_preference: state.formData.travel_unit_preference || 'km',
        studio_name: state.formData.studio_name?.trim() || null,
        has_studio: state.formData.has_studio || false,
        studio_address: state.formData.studio_address?.trim() || null,
        show_location: state.formData.show_location !== undefined ? state.formData.show_location : true,
        typical_turnaround_days: state.formData.typical_turnaround_days || null,
        turnaround_unit_preference: state.formData.turnaround_unit_preference || 'days',
        height_cm: state.formData.height_cm || null,
        measurements: state.formData.measurements?.trim() || null,
        eye_color: state.formData.eye_color?.trim() || null,
        hair_color: state.formData.hair_color?.trim() || null,
        shoe_size: state.formData.shoe_size?.trim() || null,
        clothing_sizes: state.formData.clothing_sizes?.trim() || null, // TEXT field, not array
        tattoos: state.formData.tattoos || false,
        piercings: state.formData.piercings || false,
        performance_roles: state.formData.performance_roles || [],
        style_tags: state.formData.style_tags || [],
        vibe_tags: state.formData.vibe_tags || [],
        avatar_url: state.formData.avatar_url || null,
        header_banner_url: state.formData.header_banner_url || null,
        header_banner_position: state.formData.header_banner_position || null,
        // Demographics fields
        gender_identity: state.formData.gender_identity?.trim() || null,
        ethnicity: state.formData.ethnicity?.trim() || null,
        nationality: state.formData.nationality?.trim() || null,
        experience_level: state.formData.experience_level?.trim() || null,
        availability_status: state.formData.availability_status?.trim() || null,
        state_province: state.formData.state_province?.trim() || null,
        timezone: state.formData.timezone?.trim() || null,
        passport_valid: state.formData.passport_valid || false,
        show_age: state.formData.show_age || false,
        show_physical_attributes: state.formData.show_physical_attributes || false,
        // Work preferences fields
        accepts_tfp: state.formData.accepts_tfp || false,
        accepts_expenses_only: state.formData.accepts_expenses_only || false,
        prefers_studio: state.formData.prefers_studio || false,
        prefers_outdoor: state.formData.prefers_outdoor || false,
        // These fields were removed from the database as redundant
        // Privacy settings fields
        show_phone: state.formData.show_phone || false,
        show_social_links: state.formData.show_social_links || false,
        show_website: state.formData.show_website || false,
        show_experience: state.formData.show_experience || false,
        show_specializations: state.formData.show_specializations || false,
        show_equipment: state.formData.show_equipment || false,
        show_rates: state.formData.show_rates || false,
        include_in_search: state.formData.include_in_search !== undefined ? state.formData.include_in_search : true,
        show_availability: state.formData.show_availability || false,
        allow_direct_booking: state.formData.allow_direct_booking || false,
        // Professional fields
        primary_skill: state.formData.primary_skill?.trim() || null,
        updated_at: new Date().toISOString()
      }

      // Update profile in database
      if (process.env.NODE_ENV === 'development') {
        console.log('Updating profile with sanitized data:', sanitizedFormData)
        console.log('Profile ID:', state.profile.id)
      }
      
      const { data, error } = await (supabase as any)
        .from('users_profile')
        .update(sanitizedFormData as any)
        .eq('user_id', user.id)
        .select()
        .single()
        
      if (process.env.NODE_ENV === 'development') {
        console.log('Supabase update response:', { data, error })
      }

      if (error) {
        console.error('Error saving profile:', error)
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          status: error.status,
          statusText: error.statusText
        })
        console.error('Full error object:', JSON.parse(JSON.stringify(error)))
        
        // Provide more specific error messages
        let errorMessage = 'Failed to save profile'
        if (error.code === 'PGRST116') {
          errorMessage = 'Permission denied. You can only update your own profile.'
        } else if (error.code === 'PGRST301') {
          errorMessage = 'Profile not found'
        } else if (error.code === '23505') {
          errorMessage = 'Handle already exists. Please choose a different handle.'
        } else if (error.message?.includes('row-level security') || error.message?.includes('RLS')) {
          errorMessage = 'Permission denied. Please make sure you are logged in and trying to update your own profile.'
        } else if (error.message) {
          errorMessage = error.message
        }
        
        dispatch({ type: 'SET_ERROR', payload: errorMessage })
        return
      }

      // Update local state
      dispatch({ type: 'SET_PROFILE', payload: data as any })
      dispatch({ type: 'SET_EDITING', payload: false })
      dispatch({ type: 'SET_FORM_DATA', payload: data as any })
      dispatch({ type: 'SET_ERROR', payload: null })
    } catch (err) {
      console.error('Error saving profile:', err)
      console.error('Error type:', typeof err)
      console.error('Error constructor:', err?.constructor?.name)
      console.error('Full error object:', JSON.parse(JSON.stringify(err)))
      
      let errorMessage = 'An unexpected error occurred'
      if (err instanceof Error) {
        errorMessage = err.message
      } else if (typeof err === 'string') {
        errorMessage = err
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message)
      } else if (err && typeof err === 'object') {
        // Try to extract error info from Supabase error
        const serializedErr = JSON.parse(JSON.stringify(err))
        if (serializedErr.message) {
          errorMessage = serializedErr.message
        } else if (serializedErr.error) {
          errorMessage = serializedErr.error
        }
      }
      
      dispatch({ type: 'SET_ERROR', payload: errorMessage })
    } finally {
      dispatch({ type: 'SET_SAVING', payload: false })
    }
  }

  const handleCancel = () => {
    if (state.profile) {
      // Reset form data to current profile values
      dispatch({ type: 'SET_FORM_DATA', payload: state.profile })
    }
    dispatch({ type: 'SET_EDITING', payload: false })
    dispatch({ type: 'SET_EDITING_HEADER', payload: false })
    dispatch({ type: 'SET_ERROR', payload: null })
  }

  return {
    formData: state.formData,
    saving: state.saving,
    error: state.error,
    updateField: (field: string, value: any) => dispatch({ type: 'UPDATE_FORM_FIELD', payload: { field, value } }),
    setFormData: (formData: Partial<UserProfile>) => dispatch({ type: 'SET_FORM_DATA', payload: formData }),
    resetFormData: () => dispatch({ type: 'RESET_FORM_DATA' }),
    setSaving: (saving: boolean) => dispatch({ type: 'SET_SAVING', payload: saving }),
    setError: (error: string | null) => dispatch({ type: 'SET_ERROR', payload: error }),
    handleSave,
    handleCancel
  }
}

export function useProfileUI() {
  const { state, dispatch } = useProfileContext()
  return {
    activeTab: state.activeTab,
    activeSubTab: state.activeSubTab,
    showLocation: state.showLocation,
    isDraggingHeader: state.isDraggingHeader,
    headerPosition: state.headerPosition,
    loading: state.loading,
    setActiveTab: (tab: string) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab }),
    setActiveSubTab: (subTab: string) => dispatch({ type: 'SET_ACTIVE_SUB_TAB', payload: subTab }),
    setShowLocation: (show: boolean) => dispatch({ type: 'SET_SHOW_LOCATION', payload: show }),
    setDraggingHeader: (dragging: boolean) => dispatch({ type: 'SET_DRAGGING_HEADER', payload: dragging }),
    setHeaderPosition: (position: BannerPosition) => dispatch({ type: 'SET_HEADER_POSITION', payload: position }),
    setLoading: (loading: boolean) => dispatch({ type: 'SET_LOADING', payload: loading })
  }
}
