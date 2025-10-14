'use client'

import React, { useState } from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { TextField, NumberField } from '../common/FormField'
import { TattoosToggle, PiercingsToggle } from '../common/ToggleSwitch'
import { Star, Ruler, Eye, Palette, Shirt, Plus, X } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { normalizeUrl } from '@/lib/utils/url-formatter'
import { useTalentData } from '../../../hooks/useTalentData'
import { useClothingSizes } from '../../../hooks/useClothingSizes'

export function TalentSpecificSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()
  const { user } = useAuth()
  
  // Check if user has TALENT role
  const userRoleFlags = profile?.role_flags || []
  const canEditTalentCategories = userRoleFlags.includes('TALENT') || userRoleFlags.includes('BOTH')

  // Use custom hooks for data fetching
  const talentData = useTalentData()
  const clothingSizes = useClothingSizes({
    profileId: profile?.id,
    userId: user?.id
  })

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

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value)
  }

  const addTalentCategory = (category: string) => {
    const currentCategories = formData.performance_roles || []
    if (!currentCategories.includes(category)) {
      handleFieldChange('performance_roles', [...currentCategories, category])
    }
  }

  const removeTalentCategory = (category: string) => {
    const currentCategories = formData.performance_roles || []
    handleFieldChange('performance_roles', currentCategories.filter(c => c !== category))
  }

  // Clothing size management functions
  const addClothingSize = async () => {
    if (!newClothingType || !newClothingSizeSystem || !newClothingSizeValue) return

    const result = await clothingSizes.addClothingSize(
      newClothingType,
      newClothingSizeSystem,
      newClothingSizeValue,
      newCustomSizeDescription
    )

    if (result.success) {
      // Clear form
      setNewClothingType('')
      setNewClothingSizeSystem('')
      setNewClothingSizeValue('')
      setNewCustomSizeDescription('')
    }
  }

  const removeClothingSize = async (clothingSizeId: string) => {
    await clothingSizes.deleteClothingSize(clothingSizeId)
  }

  // Measurement management functions
  const addMeasurement = async () => {
    if (!newMeasurementType || !newMeasurementValue) return

    const result = await clothingSizes.addMeasurement(
      newMeasurementType,
      parseFloat(newMeasurementValue),
      newMeasurementUnit,
      newMeasurementNotes
    )

    if (result.success) {
      // Clear form
      setNewMeasurementType('')
      setNewMeasurementValue('')
      setNewMeasurementUnit('in')
      setNewMeasurementNotes('')
    }
  }

  const removeMeasurement = async (measurementId: string) => {
    await clothingSizes.deleteMeasurement(measurementId)
  }

  // Shoe size management functions
  const addShoeSize = async () => {
    if (!supabase || !user || !profile || !newShoeSizeSystem || !newShoeSizeValue) return

    try {
      const selectedSystem = talentData.shoeSizeSystems.find(s => s.id.toString() === newShoeSizeSystem)
      const selectedSize = talentData.shoeSizes.find(s => s.size_system_id.toString() === newShoeSizeSystem && s.size_value === newShoeSizeValue)
      
      if (!selectedSystem || !selectedSize) {
        console.error('Selected system or size not found')
        return
      }

      // Store shoe size in the profile's shoe_size field with system info
      const shoeSizeDisplay = `${newShoeSizeValue} (${selectedSystem.system_name} - ${selectedSystem.region})`
      
      const { error } = await (supabase as any)
        .from('users_profile')
        .update({
          shoe_size: shoeSizeDisplay
        } as any)
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
    return talentData.clothingSizes.filter(size => size.size_system_id.toString() === systemId)
  }

  // Get available shoe sizes for selected system
  const getAvailableShoeSizes = (systemId: string) => {
    if (!systemId) return []
    return talentData.shoeSizes.filter(size => size.size_system_id.toString() === systemId)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <Star className="w-5 h-5" />
        Talent-Specific Information
      </h2>

      {/* Physical Attributes */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
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
          
          <div>
            <Label htmlFor="body-type">Body Type</Label>
            <Select
              value={isEditing ? (formData.body_type || '') : (profile?.body_type || '')}
              onValueChange={(value) => handleFieldChange('body_type', value)}
              disabled={!isEditing}
            >
              <SelectTrigger id="body-type">
                <SelectValue placeholder="Select body type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="petite">Petite</SelectItem>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="plus">Plus Size</SelectItem>
                <SelectItem value="tall">Tall</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Appearance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="eye-color">Eye Color</Label>
            <Select
              value={isEditing ? (formData.eye_color || '') : (profile?.eye_color || '')}
              onValueChange={(value) => handleFieldChange('eye_color', value)}
              disabled={!isEditing}
            >
              <SelectTrigger id="eye-color">
                <SelectValue placeholder="Select eye color" />
              </SelectTrigger>
              <SelectContent>
                {talentData.predefinedEyeColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="hair-color">Hair Color</Label>
            <Select
              value={isEditing ? (formData.hair_color || '') : (profile?.hair_color || '')}
              onValueChange={(value) => handleFieldChange('hair_color', value)}
              disabled={!isEditing}
            >
              <SelectTrigger id="hair-color">
                <SelectValue placeholder="Select hair color" />
              </SelectTrigger>
              <SelectContent>
                {talentData.predefinedHairColors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Clothing Sizes */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Shirt className="w-4 h-4" />
          Clothing & Sizes
        </h3>
        
        {/* Current Clothing Sizes */}
        {clothingSizes.userClothingSizes.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-foreground mb-2">Current Clothing Sizes</h4>
            <div className="space-y-2">
              {clothingSizes.userClothingSizes.map((size) => {
                const system = talentData.clothingSizeSystems.find(s => s.id.toString() === size.size_system_id)
                return (
                  <div key={size.id} className="flex items-center justify-between p-2 bg-card rounded border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {size.clothing_type}: {size.size_value}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({system?.region} {system?.system_type})
                      </span>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => removeClothingSize(size.id)}
                        className="text-destructive-500 hover:text-destructive-700 transition-colors"
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
          <div className="space-y-3 p-3 bg-card rounded border">
            <h4 className="text-sm font-medium text-foreground">Add Clothing Size</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <Label htmlFor="clothing-type" className="text-xs">Clothing Type</Label>
                <Select
                  value={newClothingType}
                  onValueChange={setNewClothingType}
                >
                  <SelectTrigger id="clothing-type" className="h-8">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tops">Tops</SelectItem>
                    <SelectItem value="bottoms">Bottoms</SelectItem>
                    <SelectItem value="dresses">Dresses</SelectItem>
                    <SelectItem value="outerwear">Outerwear</SelectItem>
                    <SelectItem value="accessories">Accessories</SelectItem>
                    <SelectItem value="underwear">Underwear</SelectItem>
                    <SelectItem value="swimwear">Swimwear</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="size-system" className="text-xs">Size System</Label>
                <Select
                  value={newClothingSizeSystem}
                  onValueChange={(value) => {
                    setNewClothingSizeSystem(value)
                    setNewClothingSizeValue('')
                  }}
                >
                  <SelectTrigger id="size-system" className="h-8">
                    <SelectValue placeholder="Select system" />
                  </SelectTrigger>
                  <SelectContent>
                    {talentData.clothingSizeSystems.map((system) => (
                      <SelectItem key={system.id} value={system.id.toString()}>
                        {system.system_name} ({system.region})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="size-value" className="text-xs">Size Value</Label>
                <Select
                  value={newClothingSizeValue}
                  onValueChange={setNewClothingSizeValue}
                  disabled={!newClothingSizeSystem}
                >
                  <SelectTrigger id="size-value" className="h-8">
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailableSizes(newClothingSizeSystem).map((size) => (
                      <SelectItem key={size.id} value={size.size_value}>
                        {size.size_value} {size.size_label && `(${size.size_label})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="custom-description" className="text-xs">Custom Description (Optional)</Label>
                <Input
                  id="custom-description"
                  type="text"
                  value={newCustomSizeDescription}
                  onChange={(e) => setNewCustomSizeDescription(e.target.value)}
                  placeholder="e.g., Fits loose"
                  className="h-8"
                />
              </div>
            </div>

            <Button
              onClick={addClothingSize}
              disabled={!newClothingType || !newClothingSizeSystem || !newClothingSizeValue}
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Clothing Size
            </Button>
          </div>
        )}

        {/* Measurements */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Body Measurements</h4>
          
          {/* Current Measurements */}
          {clothingSizes.userMeasurements.length > 0 && (
            <div className="mb-3 space-y-2">
              {clothingSizes.userMeasurements.map((measurement) => (
                <div key={measurement.id} className="flex items-center justify-between p-2 bg-card rounded border">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground capitalize">
                      {measurement.measurement_type}: {measurement.measurement_value} {measurement.unit}
                    </span>
                    {measurement.notes && (
                      <span className="text-xs text-muted-foreground">
                        ({measurement.notes})
                      </span>
                    )}
                  </div>
                  {isEditing && (
                    <button
                      onClick={() => removeMeasurement(measurement.id)}
                      className="text-destructive-500 hover:text-destructive-700 transition-colors"
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
            <div className="space-y-3 p-3 bg-card rounded border">
              <h5 className="text-xs font-medium text-muted-foreground">Add Measurement</h5>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="measurement-type" className="text-xs">Type</Label>
                  <Select
                    value={newMeasurementType}
                    onValueChange={setNewMeasurementType}
                  >
                    <SelectTrigger id="measurement-type" className="h-8">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="chest">Chest</SelectItem>
                      <SelectItem value="waist">Waist</SelectItem>
                      <SelectItem value="hips">Hips</SelectItem>
                      <SelectItem value="inseam">Inseam</SelectItem>
                      <SelectItem value="shoulder">Shoulder</SelectItem>
                      <SelectItem value="sleeve">Sleeve</SelectItem>
                      <SelectItem value="neck">Neck</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="measurement-value" className="text-xs">Value</Label>
                  <Input
                    id="measurement-value"
                    type="number"
                    step="0.1"
                    value={newMeasurementValue}
                    onChange={(e) => setNewMeasurementValue(e.target.value)}
                    placeholder="e.g., 36"
                    className="h-8"
                  />
                </div>

                <div>
                  <Label htmlFor="measurement-unit" className="text-xs">Unit</Label>
                  <Select
                    value={newMeasurementUnit}
                    onValueChange={setNewMeasurementUnit}
                  >
                    <SelectTrigger id="measurement-unit" className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in">Inches</SelectItem>
                      <SelectItem value="cm">Centimeters</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="measurement-notes" className="text-xs">Notes (Optional)</Label>
                <Input
                  id="measurement-notes"
                  type="text"
                  value={newMeasurementNotes}
                  onChange={(e) => setNewMeasurementNotes(e.target.value)}
                  placeholder="e.g., Relaxed fit"
                  className="h-8"
                />
              </div>

              <Button
                onClick={addMeasurement}
                disabled={!newMeasurementType || !newMeasurementValue}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Measurement
              </Button>
            </div>
          )}
        </div>
        
        {/* Shoe Sizes */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-foreground mb-2">Shoe Sizes</h4>
          
          {/* Current Shoe Sizes */}
          {profile?.shoe_size && (
            <div className="mb-3">
              <div className="flex items-center justify-between p-2 bg-card rounded border">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {profile.shoe_size}
                  </span>
                </div>
                {isEditing && (
                  <button
                    onClick={() => handleFieldChange('shoe_size', '')}
                    className="text-destructive-500 hover:text-destructive-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Add New Shoe Size */}
          {isEditing && (
            <div className="space-y-3 p-3 bg-card rounded border">
              <h4 className="text-sm font-medium text-foreground">Add Shoe Size</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="shoe-size-system" className="text-xs">Size System</Label>
                  <Select
                    value={newShoeSizeSystem}
                    onValueChange={(value) => {
                      setNewShoeSizeSystem(value)
                      setNewShoeSizeValue('')
                    }}
                  >
                    <SelectTrigger id="shoe-size-system" className="h-8">
                      <SelectValue placeholder="Select system" />
                    </SelectTrigger>
                    <SelectContent>
                      {talentData.shoeSizeSystems.map((system) => (
                        <SelectItem key={system.id} value={system.id.toString()}>
                          {system.system_name} ({system.region})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shoe-size-value" className="text-xs">Size Value</Label>
                  <Select
                    value={newShoeSizeValue}
                    onValueChange={setNewShoeSizeValue}
                    disabled={!newShoeSizeSystem}
                  >
                    <SelectTrigger id="shoe-size-value" className="h-8">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableShoeSizes(newShoeSizeSystem).map((size) => (
                        <SelectItem key={size.id} value={size.size_value}>
                          {size.size_value} {size.size_label && `(${size.size_label})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={addShoeSize}
                disabled={!newShoeSizeSystem || !newShoeSizeValue}
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Shoe Size
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Body Modifications */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
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

      {/* Performance Roles */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Performance Roles</h3>
        
        {!canEditTalentCategories && (
          <div className="mb-4 p-3 bg-muted-foreground/10 border border-muted-foreground/20 rounded-md">
            <p className="text-sm text-muted-foreground">
              <strong>Note:</strong> You signed up as a <strong>CONTRIBUTOR</strong>. Performance roles are only available for users with the TALENT role. You can manage your professional skills in the Professional section instead.
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="talent-category">Add Performance Role</Label>
            <Select
              onValueChange={(value) => {
                if (value && !(isEditing ? (formData.performance_roles || []) : (profile?.performance_roles || [])).includes(value)) {
                  addTalentCategory(value)
                }
              }}
              disabled={!isEditing || !canEditTalentCategories}
            >
              <SelectTrigger id="talent-category">
                <SelectValue placeholder={canEditTalentCategories ? "Select a performance role..." : "Not available for your role"} />
              </SelectTrigger>
              <SelectContent>
                {talentData.predefinedTalentCategories
                  .filter(category => !(isEditing ? (formData.performance_roles || []) : (profile?.performance_roles || [])).includes(category))
                  .map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Display Selected Categories */}
          {(isEditing ? (formData.performance_roles || []) : (profile?.performance_roles || [])).length > 0 && (
            <div>
              <Label className="text-sm font-medium text-foreground mb-2">Selected Performance Roles</Label>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? (formData.performance_roles || []) : (profile?.performance_roles || [])).map((category, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {category}
                    {isEditing && canEditTalentCategories && (
                      <button
                        onClick={() => removeTalentCategory(category)}
                        className="ml-1 text-primary/70 hover:text-primary transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          {canEditTalentCategories 
            ? "Select what you perform as (e.g., Model, Actor, Dancer)" 
            : "Your role was set during signup and determines which fields you can edit."}
        </p>
      </div>

      {/* Portfolio & Links Section */}
      <div className="space-y-3">
        <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Star className="w-4 h-4" />
          Portfolio & Links
        </h3>
        
        <div>
          <TextField
            label="Portfolio URL"
            value={formData?.portfolio_url || ''}
            onChange={(value) => updateField('portfolio_url', value)}
            placeholder="https://your-portfolio.com"
            disabled={!isEditing}
          />
          <p className="text-xs text-muted-foreground mt-1">Link to your online portfolio or modeling book</p>
        </div>
        
        <div>
          <Label htmlFor="website-url">Website URL</Label>
          <Input
            id="website-url"
            type="text"
            value={formData?.website_url || ''}
            onChange={(e) => updateField('website_url', e.target.value)}
            onBlur={(e) => {
              if (isEditing) {
                const normalized = normalizeUrl(e.target.value);
                if (normalized !== e.target.value) {
                  updateField('website_url', normalized);
                }
              }
            }}
            placeholder="example.com"
            disabled={!isEditing}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {isEditing ? "We'll add https:// automatically" : "Your personal website or professional page"}
          </p>
        </div>
      </div>

      {/* Current Information Display (when not editing) */}
      {!isEditing && (
        <div className="space-y-4">
          {/* Physical Attributes Display */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">Physical Attributes</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Height:</span>
                <span className="ml-2 text-foreground">
                  {profile?.height_cm ? `${profile.height_cm} cm` : 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Body Type:</span>
                <span className="ml-2 text-foreground">
                  {profile?.body_type || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Eye Color:</span>
                <span className="ml-2 text-foreground">
                  {profile?.eye_color || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Hair Color:</span>
                <span className="ml-2 text-foreground">
                  {profile?.hair_color || 'Not specified'}
                </span>
              </div>
            </div>
          </div>

          {/* Body Modifications Display */}
          <div className="bg-card rounded-lg p-4 border border-border">
            <h3 className="text-sm font-medium text-foreground mb-3">Body Modifications</h3>
            <div className="flex gap-4 text-sm">
              <span className={`px-2 py-1 rounded-full text-xs ${
                profile?.tattoos 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                Tattoos: {profile?.tattoos ? 'Yes' : 'No'}
              </span>
              <span className={`px-2 py-1 rounded-full text-xs ${
                profile?.piercings 
                  ? 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200' 
                  : 'bg-muted text-muted-foreground'
              }`}>
                Piercings: {profile?.piercings ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {talentData.loading && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-border border-t-primary rounded-full animate-spin"></div>
            Loading predefined options...
          </div>
        </div>
      )}
    </div>
  )
}
