'use client'

import React, { useState, useEffect } from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { TextField, NumberField, TagInput } from '../common/FormField'
import { ToggleSwitch, TattoosToggle, PiercingsToggle } from '../common/ToggleSwitch'
import { Star, Ruler, Eye, Palette, Shirt, Plus, X, MapPin } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'

// Types for clothing size system
interface ClothingSizeSystem {
  id: number
  system_name: string
  system_type: string
  region: string
  is_active: boolean
  sort_order: number
}

interface ClothingSize {
  id: number
  size_system_id: number
  size_value: string
  size_label: string
  is_active: boolean
  sort_order: number
}

interface UserClothingSize {
  id: string
  profile_id: string
  clothing_type: string
  size_system_id: string
  size_value: string
  notes?: string
}

interface UserMeasurement {
  id: string
  profile_id: string
  measurement_type: string
  measurement_value: number
  unit: string
  notes?: string
}

interface ShoeSizeSystem {
  id: number
  system_name: string
  region: string
  gender: string
  is_active: boolean
  sort_order: number
}

interface ShoeSize {
  id: number
  size_system_id: number
  size_value: string
  size_label?: string
  is_active: boolean
  sort_order: number
}

export function TalentSpecificSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()
  const { user } = useAuth()
  
  // Predefined data state
  const [predefinedTalentCategories, setPredefinedTalentCategories] = useState<string[]>([])
  const [predefinedEyeColors, setPredefinedEyeColors] = useState<string[]>([])
  const [predefinedHairColors, setPredefinedHairColors] = useState<string[]>([])
  const [loadingPredefined, setLoadingPredefined] = useState(false)

  // Clothing size system state
  const [clothingSizeSystems, setClothingSizeSystems] = useState<ClothingSizeSystem[]>([])
  const [clothingSizes, setClothingSizes] = useState<ClothingSize[]>([])
  const [userClothingSizes, setUserClothingSizes] = useState<UserClothingSize[]>([])
  const [userMeasurements, setUserMeasurements] = useState<UserMeasurement[]>([])
  
  // Shoe size system state
  const [shoeSizeSystems, setShoeSizeSystems] = useState<ShoeSizeSystem[]>([])
  const [shoeSizes, setShoeSizes] = useState<ShoeSize[]>([])
  
  // Form state for adding new clothing sizes
  const [newClothingType, setNewClothingType] = useState('')
  const [newClothingSizeSystem, setNewClothingSizeSystem] = useState('')
  const [newClothingSizeValue, setNewClothingSizeValue] = useState('')
  const [newCustomSizeDescription, setNewCustomSizeDescription] = useState('')
  
  // Form state for adding new measurements
  const [newMeasurementType, setNewMeasurementType] = useState('')
  const [newMeasurementValue, setNewMeasurementValue] = useState('')
  const [newMeasurementUnit, setNewMeasurementUnit] = useState('in')
  const [newMeasurementNotes, setNewMeasurementNotes] = useState('')
  
  // Form state for shoe sizes
  const [newShoeSizeSystem, setNewShoeSizeSystem] = useState('')
  const [newShoeSizeValue, setNewShoeSizeValue] = useState('')
  
  const [loadingClothingData, setLoadingClothingData] = useState(false)

  // Fetch predefined options from database
  useEffect(() => {
    const fetchPredefinedOptions = async () => {
      setLoadingPredefined(true)
      try {
        if (!supabase) return

        // Fetch talent categories
        const { data: talentCategories, error: talentError } = await supabase
          .from('predefined_talent_categories')
          .select('category_name')
          .eq('is_active', true)
          .order('sort_order')

        if (!talentError && talentCategories) {
          setPredefinedTalentCategories(talentCategories.map(c => c.category_name))
        }

        // Fetch eye colors
        const { data: eyeColors, error: eyeError } = await supabase
          .from('predefined_eye_colors')
          .select('color_name')
          .eq('is_active', true)
          .order('sort_order')

        if (!eyeError && eyeColors) {
          setPredefinedEyeColors(eyeColors.map(c => c.color_name))
        }

        // Fetch hair colors
        const { data: hairColors, error: hairError } = await supabase
          .from('predefined_hair_colors')
          .select('color_name')
          .eq('is_active', true)
          .order('sort_order')

        if (!hairError && hairColors) {
          setPredefinedHairColors(hairColors.map(c => c.color_name))
        }

      } catch (error) {
        console.error('Error fetching predefined options:', error)
        // Fallback to hardcoded values
        setPredefinedTalentCategories([
          'Model', 'Actor', 'Dancer', 'Musician', 'Artist', 'Influencer',
          'Athlete', 'Presenter', 'Voice Actor', 'Extra', 'Stunt Performer'
        ])
        setPredefinedEyeColors([
          'Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Violet'
        ])
        setPredefinedHairColors([
          'Black', 'Brown', 'Blonde', 'Red', 'Gray', 'White', 'Auburn',
          'Chestnut', 'Strawberry Blonde', 'Platinum', 'Silver'
        ])
      } finally {
        setLoadingPredefined(false)
      }
    }

    fetchPredefinedOptions()
  }, [])

  // Fetch clothing size system data
  useEffect(() => {
    const fetchClothingData = async () => {
      setLoadingClothingData(true)
      try {
        if (!supabase || !user) return

        // Fetch clothing size systems
        const { data: systemsData, error: systemsError } = await supabase
          .from('predefined_clothing_size_systems')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')

        if (!systemsError && systemsData) {
          setClothingSizeSystems(systemsData)
        }

        // Fetch clothing sizes
        const { data: sizesData, error: sizesError } = await supabase
          .from('predefined_clothing_sizes')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')

        if (!sizesError && sizesData) {
          setClothingSizes(sizesData)
        }

        // Fetch shoe size systems
        const { data: shoeSystemsData, error: shoeSystemsError } = await supabase
          .from('predefined_shoe_size_systems')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')

        if (!shoeSystemsError && shoeSystemsData) {
          setShoeSizeSystems(shoeSystemsData)
        }

        // Fetch shoe sizes
        const { data: shoeSizesData, error: shoeSizesError } = await supabase
          .from('predefined_shoe_sizes')
          .select('*')
          .eq('is_active', true)
          .order('sort_order')

        if (!shoeSizesError && shoeSizesData) {
          setShoeSizes(shoeSizesData)
        }

        // Fetch user's existing clothing sizes
        const { data: userClothingData, error: userClothingError } = await supabase
          .from('user_clothing_sizes')
          .select('*')
          .eq('profile_id', profile!.id)

        if (!userClothingError && userClothingData) {
          setUserClothingSizes(userClothingData)
        }

        // Fetch user's existing measurements
        const { data: userMeasurementData, error: userMeasurementError } = await supabase
          .from('user_measurements')
          .select('*')
          .eq('profile_id', profile!.id)

        if (!userMeasurementError && userMeasurementData) {
          setUserMeasurements(userMeasurementData)
        }

      } catch (error) {
        console.error('Error fetching clothing data:', error)
      } finally {
        setLoadingClothingData(false)
      }
    }

    fetchClothingData()
  }, [user])

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value)
  }

  const addTalentCategory = (category: string) => {
    const currentCategories = formData.talent_categories || []
    if (!currentCategories.includes(category)) {
      handleFieldChange('talent_categories', [...currentCategories, category])
    }
  }

  const removeTalentCategory = (category: string) => {
    const currentCategories = formData.talent_categories || []
    handleFieldChange('talent_categories', currentCategories.filter(c => c !== category))
  }

  // Clothing size management functions
  const addClothingSize = async () => {
    if (!supabase || !user || !profile || !newClothingType || !newClothingSizeSystem || !newClothingSizeValue) return

    try {
      const { data, error } = await supabase
        .from('user_clothing_sizes')
        .insert({
          profile_id: profile.id, // Use profile ID instead of user ID
          clothing_type: newClothingType,
          size_system_id: newClothingSizeSystem, // This is already a UUID from the dropdown
          size_value: newClothingSizeValue,
          notes: newCustomSizeDescription || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding clothing size:', error)
        return
      }

      // Update local state
      setUserClothingSizes(prev => [...prev, data])
      
      // Clear form
      setNewClothingType('')
      setNewClothingSizeSystem('')
      setNewClothingSizeValue('')
      setNewCustomSizeDescription('')

    } catch (error) {
      console.error('Error adding clothing size:', error)
    }
  }

  const removeClothingSize = async (clothingSizeId: string) => {
    if (!supabase) return

    try {
      const { error } = await supabase
        .from('user_clothing_sizes')
        .delete()
        .eq('id', clothingSizeId)

      if (error) {
        console.error('Error removing clothing size:', error)
        return
      }

      // Update local state
      setUserClothingSizes(prev => prev.filter(size => size.id !== clothingSizeId))

    } catch (error) {
      console.error('Error removing clothing size:', error)
    }
  }

  // Measurement management functions
  const addMeasurement = async () => {
    if (!supabase || !user || !profile || !newMeasurementType || !newMeasurementValue) return

    try {
      const { data, error } = await supabase
        .from('user_measurements')
        .insert({
          profile_id: profile.id, // Use profile ID instead of user ID
          measurement_type: newMeasurementType,
          measurement_value: parseFloat(newMeasurementValue),
          unit: newMeasurementUnit,
          notes: newMeasurementNotes || null
        })
        .select()
        .single()

      if (error) {
        console.error('Error adding measurement:', error)
        return
      }

      // Update local state
      setUserMeasurements(prev => [...prev, data])
      
      // Clear form
      setNewMeasurementType('')
      setNewMeasurementValue('')
      setNewMeasurementUnit('in')
      setNewMeasurementNotes('')

    } catch (error) {
      console.error('Error adding measurement:', error)
    }
  }

  const removeMeasurement = async (measurementId: string) => {
    if (!supabase) return

    try {
      const { error } = await supabase
        .from('user_measurements')
        .delete()
        .eq('id', measurementId)

      if (error) {
        console.error('Error removing measurement:', error)
        return
      }

      // Update local state
      setUserMeasurements(prev => prev.filter(measurement => measurement.id !== measurementId))

    } catch (error) {
      console.error('Error removing measurement:', error)
    }
  }

  // Shoe size management functions
  const addShoeSize = async () => {
    if (!supabase || !user || !profile || !newShoeSizeSystem || !newShoeSizeValue) return

    try {
      const selectedSystem = shoeSizeSystems.find(s => s.id.toString() === newShoeSizeSystem)
      const selectedSize = shoeSizes.find(s => s.size_system_id.toString() === newShoeSizeSystem && s.size_value === newShoeSizeValue)
      
      if (!selectedSystem || !selectedSize) {
        console.error('Selected system or size not found')
        return
      }

      // Store shoe size in the profile's shoe_size field with system info
      const shoeSizeDisplay = `${newShoeSizeValue} (${selectedSystem.system_name} - ${selectedSystem.region})`
      
      const { error } = await supabase
        .from('users_profile')
        .update({
          shoe_size: shoeSizeDisplay
        })
        .eq('id', profile.id)

      if (error) {
        console.error('Error adding shoe size:', error)
        return
      }

      // Clear form
      setNewShoeSizeSystem('')
      setNewShoeSizeValue('')

      // Refresh profile data
      window.location.reload()

    } catch (error) {
      console.error('Error adding shoe size:', error)
    }
  }

  // Get available sizes for selected system
  const getAvailableSizes = (systemId: string) => {
    if (!systemId) return []
    return clothingSizes.filter(size => size.size_system_id.toString() === systemId)
  }

  // Get available shoe sizes for selected system
  const getAvailableShoeSizes = (systemId: string) => {
    if (!systemId) return []
    return shoeSizes.filter(size => size.size_system_id.toString() === systemId)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
        <Star className="w-5 h-5" />
        Talent-Specific Information
      </h2>

      {/* Physical Attributes */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Ruler className="w-4 h-4" />
          Physical Attributes
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <NumberField
            label="Height (cm)"
            value={isEditing ? (formData.height_cm || '') : (profile?.height_cm || '')}
            onChange={(value) => handleFieldChange('height_cm', value ? parseInt(value) : null)}
            placeholder="Enter height"
            min={50}
            max={300}
            className={isEditing ? '' : 'pointer-events-none'}
          />
          
          <TextField
            label="Measurements"
            value={isEditing ? (formData.measurements || '') : (profile?.measurements || '')}
            onChange={(value) => handleFieldChange('measurements', value)}
            placeholder="e.g., 34-24-36"
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Appearance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Eye Color
            </label>
            <select
              value={isEditing ? (formData.eye_color || '') : (profile?.eye_color || '')}
              onChange={(e) => handleFieldChange('eye_color', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all duration-200"
            >
              <option value="">Select eye color</option>
              {predefinedEyeColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Hair Color
            </label>
            <select
              value={isEditing ? (formData.hair_color || '') : (profile?.hair_color || '')}
              onChange={(e) => handleFieldChange('hair_color', e.target.value)}
              disabled={!isEditing}
              className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all duration-200"
            >
              <option value="">Select hair color</option>
              {predefinedHairColors.map((color) => (
                <option key={color} value={color}>
                  {color}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Clothing Sizes */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shirt className="w-4 h-4" />
          Clothing & Sizes
        </h3>
        
        {/* Current Clothing Sizes */}
        {userClothingSizes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Clothing Sizes</h4>
            <div className="space-y-2">
              {userClothingSizes.map((size) => {
                const system = clothingSizeSystems.find(s => s.id.toString() === size.size_system_id)
                return (
                  <div key={size.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {size.clothing_type}: {size.size_value}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({system?.region} {system?.system_type})
                      </span>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => removeClothingSize(size.id)}
                        className="text-red-500 hover:text-red-700 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Add New Clothing Size */}
        {isEditing && (
          <div className="space-y-3 p-3 bg-white dark:bg-gray-800 rounded border">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Clothing Size</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Clothing Type
                </label>
                <select
                  value={newClothingType}
                  onChange={(e) => setNewClothingType(e.target.value)}
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="">Select type</option>
                  <option value="tops">Tops</option>
                  <option value="bottoms">Bottoms</option>
                  <option value="dresses">Dresses</option>
                  <option value="outerwear">Outerwear</option>
                  <option value="accessories">Accessories</option>
                  <option value="underwear">Underwear</option>
                  <option value="swimwear">Swimwear</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Size System
                </label>
                <select
                  value={newClothingSizeSystem}
                  onChange={(e) => {
                    setNewClothingSizeSystem(e.target.value)
                    setNewClothingSizeValue('')
                  }}
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                >
                  <option value="">Select system</option>
                  {clothingSizeSystems.map((system) => (
                    <option key={system.id} value={system.id}>
                      {system.system_name} ({system.region})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Size Value
                </label>
                <select
                  value={newClothingSizeValue}
                  onChange={(e) => setNewClothingSizeValue(e.target.value)}
                  disabled={!newClothingSizeSystem}
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white disabled:opacity-50"
                >
                  <option value="">Select size</option>
                  {getAvailableSizes(newClothingSizeSystem).map((size) => (
                    <option key={size.id} value={size.size_value}>
                      {size.size_value} {size.size_label && `(${size.size_label})`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Custom Description (Optional)
                </label>
                <input
                  type="text"
                  value={newCustomSizeDescription}
                  onChange={(e) => setNewCustomSizeDescription(e.target.value)}
                  placeholder="e.g., Fits loose"
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <button
              onClick={addClothingSize}
              disabled={!newClothingType || !newClothingSizeSystem || !newClothingSizeValue}
              className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Clothing Size
            </button>
          </div>
        )}

        {/* Measurements */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Body Measurements</h4>
          
          {/* Current Measurements */}
          {userMeasurements.length > 0 && (
            <div className="mb-3 space-y-2">
              {userMeasurements.map((measurement) => (
                <div key={measurement.id} className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-white capitalize">
                      {measurement.measurement_type}: {measurement.measurement_value} {measurement.unit}
                    </span>
                    {measurement.notes && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        ({measurement.notes})
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeMeasurement(measurement.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Add New Measurement */}
          {isEditing && (
            <div className="space-y-3 p-3 bg-white dark:bg-gray-800 rounded border">
              <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Add Measurement</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Type
                  </label>
                  <select
                    value={newMeasurementType}
                    onChange={(e) => setNewMeasurementType(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">Select type</option>
                    <option value="chest">Chest</option>
                    <option value="waist">Waist</option>
                    <option value="hips">Hips</option>
                    <option value="inseam">Inseam</option>
                    <option value="shoulder">Shoulder</option>
                    <option value="sleeve">Sleeve</option>
                    <option value="neck">Neck</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Value
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMeasurementValue}
                    onChange={(e) => setNewMeasurementValue(e.target.value)}
                    placeholder="e.g., 36"
                    className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Unit
                  </label>
                  <select
                    value={newMeasurementUnit}
                    onChange={(e) => setNewMeasurementUnit(e.target.value)}
                    className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="in">Inches</option>
                    <option value="cm">Centimeters</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={newMeasurementNotes}
                  onChange={(e) => setNewMeasurementNotes(e.target.value)}
                  placeholder="e.g., Relaxed fit"
                  className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                />
              </div>

              <button
                onClick={addMeasurement}
                disabled={!newMeasurementType || !newMeasurementValue}
                className="flex items-center gap-2 px-3 py-1 bg-primary-600 hover:bg-primary/90 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Measurement
              </button>
            </div>
          )}
        </div>
        
        {/* Shoe Sizes */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shoe Sizes</h4>
          
          {/* Current Shoe Sizes */}
          {profile?.shoe_size && (
            <div className="mb-3">
              <div className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {profile.shoe_size}
                  </span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleFieldChange('shoe_size', '')}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Add New Shoe Size */}
          {isEditing && (
            <div className="space-y-3 p-3 bg-white dark:bg-gray-800 rounded border">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Add Shoe Size</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Size System
                  </label>
                  <select
                    value={newShoeSizeSystem}
                    onChange={(e) => {
                      setNewShoeSizeSystem(e.target.value)
                      setNewShoeSizeValue('')
                    }}
                    className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                  >
                    <option value="">Select system</option>
                    {shoeSizeSystems.map((system) => (
                      <option key={system.id} value={system.id}>
                        {system.system_name} ({system.region})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Size Value
                  </label>
                  <select
                    value={newShoeSizeValue}
                    onChange={(e) => setNewShoeSizeValue(e.target.value)}
                    disabled={!newShoeSizeSystem}
                    className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white disabled:opacity-50"
                  >
                    <option value="">Select size</option>
                    {getAvailableShoeSizes(newShoeSizeSystem).map((size) => (
                      <option key={size.id} value={size.size_value}>
                        {size.size_value} {size.size_label && `(${size.size_label})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                onClick={addShoeSize}
                disabled={!newShoeSizeSystem || !newShoeSizeValue}
                className="flex items-center gap-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white text-sm rounded transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Shoe Size
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body Modifications */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Body Modifications
        </h3>
        
        <div className="space-y-4">
          <TattoosToggle
            checked={isEditing ? (formData.tattoos || false) : (profile?.tattoos || false)}
            onChange={(checked) => handleFieldChange('tattoos', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
          
          <PiercingsToggle
            checked={isEditing ? (formData.piercings || false) : (profile?.piercings || false)}
            onChange={(checked) => handleFieldChange('piercings', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Talent Categories */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Talent Categories</h3>
        
        <TagInput
          label="Talent Categories"
          tags={isEditing ? (formData.talent_categories || []) : (profile?.talent_categories || [])}
          onAddTag={addTalentCategory}
          onRemoveTag={removeTalentCategory}
          placeholder="Add a talent category..."
          predefinedOptions={predefinedTalentCategories}
          className={isEditing ? '' : 'pointer-events-none'}
        />
        
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
          Select the types of talent work you're interested in (e.g., Model, Actor, Dancer)
        </p>
      </div>

      {/* Current Information Display (when not editing) */}
      {!isEditing && (
        <div className="space-y-4">
          {/* Physical Attributes Display */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Physical Attributes</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Height:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {profile?.height_cm ? `${profile.height_cm} cm` : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Measurements:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {profile?.measurements || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Eye Color:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {profile?.eye_color || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Hair Color:</span>
                <span className="ml-2 text-gray-900 dark:text-white">
                  {profile?.hair_color || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Body Modifications Display */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Body Modifications</h3>
            <div className="flex gap-4 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs ${
                profile?.tattoos 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                Tattoos: {profile?.tattoos ? 'Yes' : 'No'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                profile?.piercings 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                Piercings: {profile?.piercings ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingPredefined && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
            Loading predefined options...
          </div>
        </div>
      )}
    </div>
  )
}
