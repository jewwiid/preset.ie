'use client'

import React, { useState, useEffect } from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { TagInput } from '../common/FormField'
import { Camera, Monitor, Plus, X, AlertCircle, Settings, Zap, Mic, Headphones, Lightbulb, Filter, Battery, HardDrive } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface EquipmentType {
  id: string
  name: string
  sort_order: number
}

interface EquipmentBrand {
  id: string
  name: string
  display_name: string
  sort_order: number
  is_active: boolean
}

interface EquipmentModel {
  id: string
  equipment_type_id: string
  brand: string
  model: string
  description: string
  sort_order: number
  is_active: boolean
}

interface UserEquipment {
  id: string
  user_id: string
  equipment_model_id: string
  brand: string
  model: string
  equipment_type: string
  is_primary: boolean
  display_order: number
}

export function EquipmentSection() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()
  
  // Equipment form state
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([])
  const [equipmentBrands, setEquipmentBrands] = useState<EquipmentBrand[]>([])
  const [equipmentModels, setEquipmentModels] = useState<EquipmentModel[]>([])
  const [userEquipment, setUserEquipment] = useState<UserEquipment[]>([])
  const [loadingEquipmentData, setLoadingEquipmentData] = useState(false)
  
  // Form selections
  const [selectedEquipmentType, setSelectedEquipmentType] = useState('')
  const [selectedEquipmentBrand, setSelectedEquipmentBrand] = useState('')
  const [selectedEquipmentModel, setSelectedEquipmentModel] = useState('')
  const [newEquipmentBrand, setNewEquipmentBrand] = useState('')
  const [newEquipmentModel, setNewEquipmentModel] = useState('')
  const [allowCustomModel, setAllowCustomModel] = useState(false)
  const [equipmentValidationError, setEquipmentValidationError] = useState<string | null>(null)

  // Fetch equipment data
  useEffect(() => {
    if (user && supabase && profile) {
      fetchEquipmentData()
    }
  }, [user, profile])

  const fetchEquipmentData = async () => {
    if (!user || !supabase || !profile) return

    setLoadingEquipmentData(true)
    try {
      // Fetch equipment data from centralized API
      const response = await fetch('/api/predefined-data')
      if (response.ok) {
        const data = await response.json()
        setEquipmentTypes(data.equipment_types || [])
        setEquipmentBrands(data.equipment_brands || [])
      } else {
        console.log('Equipment functionality not yet implemented in database')
        setEquipmentTypes([])
        setEquipmentBrands([])
        setEquipmentModels([])
        setUserEquipment([])
        return
      }

      // Fetch equipment models directly from database (not in predefined API yet)
      const { data: modelsData, error: modelsError } = await (supabase as any)
        .from('equipment_predefined_models')
        .select('*')
        .order('sort_order')

      if (modelsError) throw modelsError
      setEquipmentModels((modelsData as any) || [])

      // Fetch user equipment using the view
      const { data: equipmentData, error: equipmentError } = await (supabase as any)
        .from('user_equipment_view')
        .select('*')
        .eq('profile_id', profile.id)

      if (equipmentError) throw equipmentError
      setUserEquipment((equipmentData as any) || [])

      // Sync equipment with profile on load
      await syncEquipmentWithProfile()

    } catch (error) {
      console.error('Error fetching equipment data:', error)
      // Set empty arrays to prevent further errors
      setEquipmentTypes([])
      setEquipmentBrands([])
      setEquipmentModels([])
      setUserEquipment([])
    } finally {
      setLoadingEquipmentData(false)
    }
  }

  const addEquipment = async () => {
    if (!user || !supabase || !selectedEquipmentType) return
    
    // Check if equipment tables exist
    const { error: checkError } = await (supabase as any)
      .from('user_equipment')
      .select('id')
      .limit(1)

    if (checkError) {
      setEquipmentValidationError('Equipment functionality is not yet available')
      return
    }
    
    setEquipmentValidationError(null)
    
    const brandToUse = allowCustomModel ? newEquipmentBrand.trim() : getBrandDisplayName(selectedEquipmentBrand)
    const modelToUse = allowCustomModel ? newEquipmentModel.trim() : getModelDisplayName(selectedEquipmentModel)
    
    if (!brandToUse || !modelToUse) {
      setEquipmentValidationError('Please select or enter both brand and model')
      return
    }

    // Validate custom input if using custom mode
    if (allowCustomModel) {
      const brandValidation = validateEquipmentInput(brandToUse, 'brand')
      if (!brandValidation.isValid) {
        setEquipmentValidationError(brandValidation.error || 'Invalid brand name')
        return
      }
      
      const modelValidation = validateEquipmentInput(modelToUse, 'model')
      if (!modelValidation.isValid) {
        setEquipmentValidationError(modelValidation.error || 'Invalid model name')
        return
      }
      
      // Check if brand already exists
      const brandExists = await checkBrandExists(brandToUse, selectedEquipmentType)
      if (brandExists) {
        setEquipmentValidationError('This brand already exists for this equipment type. Please select it from the dropdown instead.')
        return
      }
      
      // Check if model already exists for the brand
      if (selectedEquipmentBrand) {
        const modelExists = await checkModelExists(modelToUse, selectedEquipmentBrand)
        if (modelExists) {
          setEquipmentValidationError('This model already exists for this brand. Please select it from the dropdown instead.')
          return
        }
      }
    }

    try {
      // Create equipment model
      const { data: modelData, error: modelError } = await (supabase as any)
        .from('equipment_models')
        .insert({
          user_id: user.id,
          equipment_type_id: selectedEquipmentType,
          brand: brandToUse,
          model: modelToUse,
          description: null,
          condition: 'good'
        } as any)
        .select()
        .single()

      if (modelError) throw modelError

      // Link to user equipment
      const { error: userEquipmentError } = await (supabase as any)
        .from('user_equipment')
        .insert({
          profile_id: profile!.id, // Use profile ID instead of auth user ID
          equipment_model_id: (modelData as any).id,
          is_primary: false,
          display_order: userEquipment.length
        } as any)

      if (userEquipmentError) throw userEquipmentError

      // Refresh equipment data
      await fetchEquipmentData()

      // Sync equipment list with profile
      await syncEquipmentWithProfile()

      // Reset form
      setSelectedEquipmentType('')
      setSelectedEquipmentBrand('')
      setSelectedEquipmentModel('')
      setNewEquipmentBrand('')
      setNewEquipmentModel('')
      setAllowCustomModel(false)
      setEquipmentValidationError(null)

    } catch (error) {
      console.error('Error adding equipment:', error)
      setEquipmentValidationError('Failed to add equipment. Please try again.')
    }
  }

  const removeEquipment = async (equipmentId: string) => {
    if (!user || !supabase) return

    // Check if equipment tables exist
    const { error: checkError } = await (supabase as any)
      .from('user_equipment')
      .select('id')
      .limit(1)

    if (checkError) {
      console.log('Equipment tables not available, cannot remove equipment')
      return
    }

    try {
      // Remove from user_equipment (this will cascade delete the equipment_model)
      const { error } = await (supabase as any)
        .from('user_equipment')
        .delete()
        .eq('id', equipmentId)
        .eq('profile_id', profile!.id)

      if (error) throw error

      // Refresh equipment data
      await fetchEquipmentData()

      // Sync equipment list with profile
      await syncEquipmentWithProfile()

    } catch (error) {
      console.error('Error removing equipment:', error)
    }
  }

  // Sync equipment data with profile equipment_list field
  const syncEquipmentWithProfile = async () => {
    if (!user || !supabase || !profile) return

    try {
      // Check if equipment tables exist
      const { error: checkError } = await (supabase as any)
        .from('user_equipment_view')
        .select('id')
        .limit(1)

      if (checkError) {
        // Equipment tables don't exist yet - skip sync
        console.log('Equipment tables not available, skipping sync')
        return
      }

      // Get current user equipment
      const { data: equipmentData, error: equipmentError } = await (supabase as any)
        .from('user_equipment_view')
        .select('*')
        .eq('profile_id', profile.id)

      if (equipmentError) throw equipmentError

      // Create equipment list array from user equipment
      const equipmentList = equipmentData?.map((equipment: any) => 
        `${equipment.brand} ${equipment.model}`
      ) || []

      // Update profile equipment_list field
      const { error: updateError } = await (supabase as any)
        .from('users_profile')
        .update({ 
          equipment_list: equipmentList,
          updated_at: new Date().toISOString()
        } as any)
        .eq('id', profile.id)

      if (updateError) throw updateError

      console.log('Equipment synced with profile:', equipmentList)

    } catch (error) {
      console.error('Error syncing equipment with profile:', error)
    }
  }

  // Helper functions
  const getBrandsForType = (equipmentTypeId: string) => {
    // Get unique brands from models that belong to this equipment type
    const typeModels = equipmentModels.filter(model => model.equipment_type_id === equipmentTypeId)
    const uniqueBrands = [...new Set(typeModels.map(model => model.brand))]
    
    // Return brands that match the unique brand names from models
    return equipmentBrands.filter(brand => uniqueBrands.includes(brand.name))
  }

  const getModelsForBrand = (brandName: string) => {
    return equipmentModels.filter(model => model.brand === brandName && model.equipment_type_id === selectedEquipmentType)
  }

  const getBrandDisplayName = (brandName: string) => {
    const brand = equipmentBrands.find(b => b.name === brandName)
    return brand ? brand.display_name : brandName
  }

  const getModelDisplayName = (modelId: string) => {
    const model = equipmentModels.find(m => m.id === modelId)
    return model ? model.model : ''
  }

  // Helper function to format equipment type names for display
  const formatEquipmentTypeName = (typeName: string | undefined | null) => {
    if (!typeName) return 'Unknown Equipment';
    const typeMap: Record<string, string> = {
      'camera_body': 'Camera Body',
      'lens': 'Lens',
      'flash': 'Flash/Strobe',
      'tripod': 'Tripod',
      'memory_card': 'Memory Card',
      'battery': 'Battery',
      'filter': 'Filter',
      'bag': 'Camera Bag',
      'video_camera': 'Video Camera',
      'gimbal': 'Gimbal',
      'monitor': 'Monitor',
      'recorder': 'Audio Recorder',
      'microphone': 'Microphone',
      'audio_recorder': 'Audio Recorder',
      'headphones': 'Headphones',
      'speaker': 'Speaker',
      'continuous_light': 'Continuous Light',
      'strobe_light': 'Strobe Light',
      'light_modifier': 'Light Modifier',
      'light_stand': 'Light Stand',
      'backdrop': 'Backdrop',
      'reflector': 'Reflector',
      'diffuser': 'Diffuser',
      'softbox': 'Softbox',
      'umbrella': 'Umbrella',
      'snoot': 'Snoot',
      'grid': 'Grid',
      'barn_doors': 'Barn Doors',
      'color_gel': 'Color Gel',
      'wireless_trigger': 'Wireless Trigger',
      'remote_control': 'Remote Control',
      'lens_cap': 'Lens Cap',
      'lens_hood': 'Lens Hood',
      'lens_adapter': 'Lens Adapter',
      'extension_tube': 'Extension Tube',
      'close_up_filter': 'Close-up Filter',
      'polarizing_filter': 'Polarizing Filter',
      'nd_filter': 'ND Filter',
      'uv_filter': 'UV Filter',
      'camera_strap': 'Camera Strap',
      'camera_grip': 'Camera Grip',
      'external_flash': 'External Flash',
      'ring_flash': 'Ring Flash',
      'macro_flash': 'Macro Flash',
      'studio_flash': 'Studio Flash',
      'speedlight': 'Speedlight',
      'monopod': 'Monopod',
      'slider': 'Slider',
      'jib': 'Jib',
      'dolly': 'Dolly',
      'steadycam': 'Steadycam',
      'shoulder_rig': 'Shoulder Rig',
      'cage': 'Cage',
      'handle': 'Handle',
      'follow_focus': 'Follow Focus',
      'matte_box': 'Matte Box',
      'v_mount_battery': 'V-Mount Battery',
      'npf_battery': 'NPF Battery',
      'power_adapter': 'Power Adapter',
      'charger': 'Charger',
      'cable': 'Cable',
      'hdmi_cable': 'HDMI Cable',
      'usb_cable': 'USB Cable',
      'audio_cable': 'Audio Cable',
      'sync_cable': 'Sync Cable',
      'wireless_transmitter': 'Wireless Transmitter',
      'wireless_receiver': 'Wireless Receiver',
      'lavalier_mic': 'Lavalier Microphone',
      'shotgun_mic': 'Shotgun Microphone',
      'boom_pole': 'Boom Pole',
      'wind_screen': 'Wind Screen',
      'pop_filter': 'Pop Filter',
      'shock_mount': 'Shock Mount',
      'audio_interface': 'Audio Interface',
      'mixer': 'Mixer',
      'field_recorder': 'Field Recorder',
      'timecode_generator': 'Timecode Generator',
      'clapperboard': 'Clapperboard',
      'slate': 'Slate',
      'color_chart': 'Color Chart',
      'gray_card': 'Gray Card',
      'white_balance_card': 'White Balance Card',
      'lens_pen': 'Lens Pen',
      'cleaning_kit': 'Cleaning Kit',
      'air_blower': 'Air Blower',
      'lens_tissue': 'Lens Tissue',
      'lens_fluid': 'Lens Fluid',
      'sensor_swab': 'Sensor Swab',
      'sensor_cleaning_kit': 'Sensor Cleaning Kit'
    }
    
    return typeMap[typeName] || typeName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  // Helper function to get icon for equipment type
  const getEquipmentTypeIcon = (typeName: string | undefined | null) => {
    if (!typeName) return Camera; // Default icon
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'camera_body': Camera,
      'lens': Camera,
      'video_camera': Camera,
      'flash': Zap,
      'strobe_light': Zap,
      'continuous_light': Lightbulb,
      'light_modifier': Lightbulb,
      'light_stand': Lightbulb,
      'microphone': Mic,
      'audio_recorder': Mic,
      'headphones': Headphones,
      'speaker': Headphones,
      'monitor': Monitor,
      'filter': Filter,
      'battery': Battery,
      'memory_card': HardDrive,
      'tripod': Settings,
      'gimbal': Settings,
      'bag': Settings,
      'backdrop': Settings,
      'recorder': Mic,
      'wireless_trigger': Settings,
      'remote_control': Settings,
      'lens_cap': Camera,
      'lens_hood': Camera,
      'lens_adapter': Camera,
      'extension_tube': Camera,
      'close_up_filter': Filter,
      'polarizing_filter': Filter,
      'nd_filter': Filter,
      'uv_filter': Filter,
      'camera_strap': Settings,
      'camera_grip': Settings,
      'external_flash': Zap,
      'ring_flash': Zap,
      'macro_flash': Zap,
      'studio_flash': Zap,
      'speedlight': Zap,
      'monopod': Settings,
      'slider': Settings,
      'jib': Settings,
      'dolly': Settings,
      'steadycam': Settings,
      'shoulder_rig': Settings,
      'cage': Settings,
      'handle': Settings,
      'follow_focus': Settings,
      'matte_box': Settings,
      'v_mount_battery': Battery,
      'npf_battery': Battery,
      'power_adapter': Battery,
      'charger': Battery,
      'cable': Settings,
      'hdmi_cable': Settings,
      'usb_cable': Settings,
      'audio_cable': Settings,
      'sync_cable': Settings,
      'wireless_transmitter': Settings,
      'wireless_receiver': Settings,
      'lavalier_mic': Mic,
      'shotgun_mic': Mic,
      'boom_pole': Mic,
      'wind_screen': Mic,
      'pop_filter': Mic,
      'shock_mount': Mic,
      'audio_interface': Mic,
      'mixer': Mic,
      'field_recorder': Mic,
      'timecode_generator': Settings,
      'clapperboard': Settings,
      'slate': Settings,
      'color_chart': Settings,
      'gray_card': Settings,
      'white_balance_card': Settings,
      'lens_pen': Camera,
      'cleaning_kit': Settings,
      'air_blower': Settings,
      'lens_tissue': Camera,
      'lens_fluid': Camera,
      'sensor_swab': Camera,
      'sensor_cleaning_kit': Camera
    }
    
    return iconMap[typeName] || Settings
  }

  // Equipment validation functions
  const validateEquipmentInput = (input: string, type: 'brand' | 'model'): { isValid: boolean; error?: string } => {
    const normalized = input.toLowerCase().trim()
    
    // Check length
    if (normalized.length < 2) {
      return { isValid: false, error: `${type} must be at least 2 characters long` }
    }
    
    if (normalized.length > 50) {
      return { isValid: false, error: `${type} must be no more than 50 characters long` }
    }
    
    // Check for valid characters (letters, numbers, spaces, hyphens, parentheses)
    const validPattern = /^[a-zA-Z0-9\s\-\(\)]+$/
    if (!validPattern.test(normalized)) {
      return { isValid: false, error: `${type} can only contain letters, numbers, spaces, hyphens, and parentheses` }
    }
    
    // Check for excessive repetition
    const repetitionPattern = /(.)\1{4}/
    if (repetitionPattern.test(normalized)) {
      return { isValid: false, error: `${type} cannot have more than 4 repeated characters` }
    }
    
    // Content filtering (basic inappropriate content check)
    const inappropriateWords = ['fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap', 'nude', 'naked', 'sex', 'porn', 'xxx', 'nsfw', 'adult', 'hate', 'nazi', 'racist', 'sexist', 'homophobic', 'transphobic', 'illegal', 'drugs', 'violence', 'weapon', 'blood', 'gore']
    const containsInappropriate = inappropriateWords.some(word => normalized.includes(word))
    if (containsInappropriate) {
      return { isValid: false, error: `${type} contains inappropriate content` }
    }
    
    return { isValid: true }
  }

  const checkBrandExists = async (brandName: string, equipmentTypeId: string): Promise<boolean> => {
    if (!supabase) return false
    
    try {
      const { data, error } = await (supabase as any)
        .from('equipment_brands')
        .select('id')
        .eq('name', brandName.toLowerCase().trim())
        .eq('equipment_type_id', equipmentTypeId)
        .single()
      
      return !error && !!data
    } catch (error) {
      console.error('Error checking brand existence:', error)
      return false
    }
  }

  const checkModelExists = async (modelName: string, brandId: string): Promise<boolean> => {
    if (!supabase) return false
    
    try {
      const { data, error } = await (supabase as any)
        .from('equipment_predefined_models')
        .select('id')
        .eq('model_name', modelName.toLowerCase().trim())
        .eq('brand_id', brandId)
        .single()
      
      return !error && !!data
    } catch (error) {
      console.error('Error checking model existence:', error)
      return false
    }
  }

  const handleBrandChange = (brandId: string) => {
    setSelectedEquipmentBrand(brandId)
    setSelectedEquipmentModel('') // Reset model when brand changes
  }

  const handleTypeChange = (typeId: string) => {
    setSelectedEquipmentType(typeId)
    setSelectedEquipmentBrand('') // Reset brand when type changes
    setSelectedEquipmentModel('') // Reset model when type changes
  }

  const toggleCustomMode = () => {
    setAllowCustomModel(!allowCustomModel)
    setSelectedEquipmentBrand('')
    setSelectedEquipmentModel('')
    setNewEquipmentBrand('')
    setNewEquipmentModel('')
    setEquipmentValidationError(null)
  }

  return (
    <div className="space-y-6">
      {/* Equipment List */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Equipment
        </h3>
        
        {loadingEquipmentData ? (
          <div className="text-center py-4">
            <LoadingSpinner size="md" />
            <p className="text-sm text-muted-foreground mt-2">Loading equipment...</p>
          </div>
        ) : userEquipment.length === 0 ? (
          <div className="text-center py-8">
            <Camera className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">No equipment added yet</h4>
            <p className="text-muted-foreground text-sm">Add your photography and video equipment to showcase your capabilities.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {userEquipment.map((equipment) => {
              const EquipmentIcon = getEquipmentTypeIcon(equipment.equipment_type)
              return (
                <div key={equipment.id} className="flex items-center justify-between bg-card rounded-lg p-4 border border-border hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                        <EquipmentIcon className="w-5 h-5 text-muted-foreground" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{equipment.brand}</span>
                        <span className="text-sm text-muted-foreground">{equipment.model}</span>
                        {equipment.is_primary && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Primary
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">{formatEquipmentTypeName(equipment.equipment_type)}</div>
                    </div>
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeEquipment(equipment.id)}
                      className="text-destructive-600 hover:text-destructive-800 dark:text-destructive-400 dark:hover:text-destructive-300 p-1 flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Equipment Form */}
      {isEditing && (
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Plus className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h4 className="text-lg font-medium text-foreground">Add Equipment</h4>
              <p className="text-sm text-muted-foreground">Add your photography and video equipment</p>
            </div>
          </div>
          
          <div className="space-y-4">
            {/* Equipment Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Equipment Type *
              </label>
              <select
                value={selectedEquipmentType}
                onChange={(e) => handleTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
              >
                <option value="">Select equipment type...</option>
                {equipmentTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {formatEquipmentTypeName(type.name)}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand Selection */}
            {selectedEquipmentType && !allowCustomModel && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Brand *
                </label>
                <select
                  value={selectedEquipmentBrand}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">Select brand...</option>
                  {getBrandsForType(selectedEquipmentType).map((brand) => (
                    <option key={brand.id} value={brand.name}>
                      {brand.display_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Model Selection */}
            {selectedEquipmentBrand && !allowCustomModel && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Model *
                </label>
                <select
                  value={selectedEquipmentModel}
                  onChange={(e) => setSelectedEquipmentModel(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                >
                  <option value="">Select model...</option>
                  {getModelsForBrand(selectedEquipmentBrand).map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.model}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Input Toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Use custom brand/model
              </span>
              <button
                onClick={toggleCustomMode}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  allowCustomModel ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
                    allowCustomModel ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Custom Brand Input */}
            {allowCustomModel && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  value={newEquipmentBrand}
                  onChange={(e) => setNewEquipmentBrand(e.target.value)}
                  placeholder="Enter brand name..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            )}

            {/* Custom Model Input */}
            {allowCustomModel && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Model Name *
                </label>
                <input
                  type="text"
                  value={newEquipmentModel}
                  onChange={(e) => setNewEquipmentModel(e.target.value)}
                  placeholder="Enter model name..."
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-ring focus:border-ring"
                />
              </div>
            )}

            {/* Error Display */}
            {equipmentValidationError && (
              <div className="bg-destructive-50 dark:bg-destructive-900/20 border border-destructive-200 dark:border-destructive-800 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">
                    {equipmentValidationError}
                  </span>
                </div>
              </div>
            )}

            {/* Add Button */}
            <button
              onClick={addEquipment}
              disabled={!selectedEquipmentType || (!allowCustomModel && (!selectedEquipmentBrand || !selectedEquipmentModel)) || (allowCustomModel && (!newEquipmentBrand.trim() || !newEquipmentModel.trim()))}
              className="w-full bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Equipment
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
