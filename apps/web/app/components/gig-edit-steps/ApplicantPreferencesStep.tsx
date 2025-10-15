'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import RangeInput from '../form/RangeInput'
import MultiSelectChips from '../form/MultiSelectChips'
import PreferenceSection from '../form/PreferenceSection'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage} from '@/components/ui/form'
import { 
  Users, 
  Ruler, 
  Briefcase, 
  MapPin, 
  Star, 
  Plus, 
  X, 
  Eye, 
  Palette,
  Camera,
  Settings,
  Heart,
  Target,
  Minus,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import {
  SPECIALIZATIONS,
  TALENT_CATEGORIES,
  EQUIPMENT_LIST,
  SOFTWARE_LIST,
  LANGUAGES,
  EYE_COLORS,
  HAIR_COLORS,
  CLOTHING_SIZES
} from '@/lib/constants/creative-options'
import type { LookingForType } from '@/lib/gig-form-persistence'

export interface ApplicantPreferences {
  physical: {
    height_range: { min: number | null; max: number | null }
    measurements: { required: boolean; specific: string | null }
    eye_color: { required: boolean; preferred: string[] }
    hair_color: { required: boolean; preferred: string[] }
    tattoos: { allowed: boolean; required: boolean }
    piercings: { allowed: boolean; required: boolean }
    clothing_sizes: { required: boolean; preferred: string[] }
  }
  professional: {
    experience_years: { min: number | null; max: number | null }
    specializations: { required: string[]; preferred: string[] }
    equipment: { required: string[]; preferred: string[] }
    software: { required: string[]; preferred: string[] }
    talent_categories: { required: string[]; preferred: string[] }
    portfolio_required: boolean
  }
  availability: {
    travel_required: boolean
    travel_radius_km: number | null
    hourly_rate_range: { min: number | null; max: number | null }
  }
  other: {
    age_range: { min: number | null; max: number | null }
    languages: { required: string[]; preferred: string[] }
    additional_requirements: string
  }
}

interface ApplicantPreferencesStepProps {
  lookingFor?: LookingForType[]  // Changed to array for multi-select support
  preferences: ApplicantPreferences
  onPreferencesChange: (preferences: ApplicantPreferences) => void
  onNext: () => void
  onBack: () => void
  loading?: boolean
}

const defaultPreferences: ApplicantPreferences = {
  physical: {
    height_range: { min: null, max: null },
    measurements: { required: false, specific: null },
    eye_color: { required: false, preferred: [] },
    hair_color: { required: false, preferred: [] },
    tattoos: { allowed: true, required: false },
    piercings: { allowed: true, required: false },
    clothing_sizes: { required: false, preferred: [] }
  },
  professional: {
    experience_years: { min: null, max: null },
    specializations: { required: [], preferred: [] },
    equipment: { required: [], preferred: [] },
    software: { required: [], preferred: [] },
    talent_categories: { required: [], preferred: [] },
    portfolio_required: false
  },
  availability: {
    travel_required: false,
    travel_radius_km: null,
    hourly_rate_range: { min: null, max: null }
  },
  other: {
    age_range: { min: 18, max: null },
    languages: { required: ['English'], preferred: [] },
    additional_requirements: ''
  }
}

// Import shared constants instead of defining locally
// This centralizes options and makes them easier to maintain

export default function ApplicantPreferencesStep({
  lookingFor,
  preferences: initialPreferences,
  onPreferencesChange,
  onNext,
  onBack,
  loading = false
}: ApplicantPreferencesStepProps) {
  // Determine which sections to show based on lookingFor type
  const shouldShowPhysicalAttributes = () => {
    const physicalRoles = [
      'MODELS', 'MODELS_FASHION', 'MODELS_COMMERCIAL', 'MODELS_FITNESS',
      'MODELS_EDITORIAL', 'MODELS_RUNWAY', 'MODELS_HAND', 'MODELS_PARTS',
      'ACTORS', 'DANCERS', 'PERFORMERS'
    ]
    return lookingFor ? lookingFor.some(role => physicalRoles.includes(role)) : false
  }

  const shouldShowProfessionalSkills = () => {
    const professionalRoles = [
      'PHOTOGRAPHERS', 'VIDEOGRAPHERS', 'CINEMATOGRAPHERS',
      'MAKEUP_ARTISTS', 'HAIR_STYLISTS', 'FASHION_STYLISTS', 'WARDROBE_STYLISTS',
      'PRODUCTION_CREW', 'PRODUCERS', 'DIRECTORS',
      'CREATIVE_DIRECTORS', 'ART_DIRECTORS'
    ]
    return lookingFor ? lookingFor.some(role => professionalRoles.includes(role)) : false
  }

  const shouldShowEquipment = () => {
    const equipmentRoles = [
      'PHOTOGRAPHERS', 'VIDEOGRAPHERS', 'CINEMATOGRAPHERS',
      'PRODUCTION_CREW', 'PRODUCERS', 'DIRECTORS'
    ]
    return lookingFor ? lookingFor.some(role => equipmentRoles.includes(role)) : false
  }

  const shouldShowSoftware = () => {
    const softwareRoles = [
      'PHOTOGRAPHERS', 'VIDEOGRAPHERS', 'CINEMATOGRAPHERS',
      'EDITORS', 'VIDEO_EDITORS', 'PHOTO_EDITORS',
      'VFX_ARTISTS', 'MOTION_GRAPHICS', 'RETOUCHERS', 'COLOR_GRADERS',
      'DESIGNERS', 'GRAPHIC_DESIGNERS', 'ILLUSTRATORS', 'ANIMATORS',
      'CREATIVE_DIRECTORS', 'ART_DIRECTORS'
    ]
    return lookingFor ? lookingFor.some(role => softwareRoles.includes(role)) : false
  }
  // Helper function to safely merge preferences with defaults
  const mergeWithDefaults = (initial: any): ApplicantPreferences => {
    if (!initial) return defaultPreferences
    
    return {
      physical: {
        ...defaultPreferences.physical,
        ...initial.physical
      },
      professional: {
        ...defaultPreferences.professional,
        ...initial.professional
      },
      availability: {
        ...defaultPreferences.availability,
        ...initial.availability
      },
      other: {
        ...defaultPreferences.other,
        ...initial.other
      }
    }
  }

  const [preferences, setPreferences] = useState<ApplicantPreferences>(
    mergeWithDefaults(initialPreferences)
  )
  
  // Initialize hasPreferences based on whether any preferences are set
  const getInitialHasPreferences = () => {
    const prefs = mergeWithDefaults(initialPreferences)
    return (
      prefs?.physical?.height_range?.min !== null ||
      prefs?.physical?.height_range?.max !== null ||
      prefs?.professional?.experience_years?.min !== null ||
      (prefs?.professional?.specializations?.required?.length || 0) > 0 ||
      (prefs?.professional?.specializations?.preferred?.length || 0) > 0 ||
      (prefs?.professional?.equipment?.required?.length || 0) > 0 ||
      (prefs?.professional?.equipment?.preferred?.length || 0) > 0 ||
      (prefs?.professional?.software?.required?.length || 0) > 0 ||
      (prefs?.professional?.software?.preferred?.length || 0) > 0 ||
      (prefs?.other?.languages?.required?.length || 0) > 0 ||
      (prefs?.other?.languages?.preferred?.length || 0) > 0 ||
      (prefs?.physical?.eye_color?.preferred?.length || 0) > 0 ||
      (prefs?.physical?.hair_color?.preferred?.length || 0) > 0 ||
      prefs?.availability?.travel_required ||
      (prefs?.other?.additional_requirements || '').trim() !== ''
    )
  }
  
  const [hasPreferences, setHasPreferences] = useState(getInitialHasPreferences())
  
  // State for managing collapsible sections
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    professional: true,
    equipment: false,
    software: false,
    languages: false,
    physical: false,
    availability: false,
    additional: false
  })
  
  // State for additional requirements toggle
  const [showAdditionalRequirements, setShowAdditionalRequirements] = useState(() => {
    const hasContent = !!(initialPreferences?.other?.additional_requirements?.trim())
    return hasContent
  })

  // Track if user has manually toggled additional requirements
  const [userToggledAdditional, setUserToggledAdditional] = useState(false)

  // Update preferences when initialPreferences changes (e.g., when data loads from DB)
  useEffect(() => {
    const newPreferences = mergeWithDefaults(initialPreferences)
    setPreferences(newPreferences)
    // Only update hasPreferences if we don't have any preferences set yet
    setHasPreferences(prev => prev || getInitialHasPreferences())
    // Only update toggle states based on initial data if user hasn't manually toggled
    if (!userToggledAdditional) {
      const hasContent = !!(newPreferences.other?.additional_requirements?.trim())
      setShowAdditionalRequirements(hasContent)
    }
  }, [initialPreferences, userToggledAdditional])

  // Ensure English is included in required languages on initial load
  useEffect(() => {
    // Only add English if no required languages are set (initial load)
    if (preferences.other.languages.required.length === 0) {
      const updatedPreferences = {
        ...preferences,
        other: {
          ...preferences.other,
          languages: {
            ...preferences.other.languages,
            required: ['English']
          }
        }
      }
      setPreferences(updatedPreferences)
      onPreferencesChange(updatedPreferences)
    }
  }, []) // Empty dependency array - only run on mount

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const updatePreferences = (section: keyof ApplicantPreferences, field: string, value: any) => {
    const newPreferences = {
      ...preferences,
      [section]: {
        ...preferences[section],
        [field]: value
      }
    }
    setPreferences(newPreferences)
    onPreferencesChange(newPreferences)
  }

  const addArrayItem = (section: keyof ApplicantPreferences, field: string, subfield: 'required' | 'preferred', item: string) => {
    const currentArray = ((preferences[section] as any)[field][subfield] as string[]) || []
    if (!currentArray.includes(item)) {
      const newArray = [...currentArray, item]
      const newPreferences = {
        ...preferences,
        [section]: {
          ...preferences[section],
          [field]: {
            ...(preferences[section] as any)[field],
            [subfield]: newArray
          }
        }
      }
      setPreferences(newPreferences)
      onPreferencesChange(newPreferences)
    }
  }

  const removeArrayItem = (section: keyof ApplicantPreferences, field: string, subfield: 'required' | 'preferred', item: string) => {
    const currentArray = ((preferences[section] as any)[field][subfield] as string[]) || []
    const newArray = currentArray.filter(i => i !== item)
    const newPreferences = {
      ...preferences,
      [section]: {
        ...preferences[section],
        [field]: {
          ...(preferences[section] as any)[field],
          [subfield]: newArray
        }
      }
    }
    setPreferences(newPreferences)
    onPreferencesChange(newPreferences)
  }

  // Helper function for number input with increment/decrement
  const NumberInputWithButtons = ({
    id,
    label,
    value,
    onChange,
    placeholder,
    min = 0,
    max = 999,
    step = 1
  }: {
    id: string
    label: string
    value: number | null
    onChange: (value: number | null) => void
    placeholder: string
    min?: number
    max?: number
    step?: number
  }) => {
    // Local state to track the input text while typing
    const [inputText, setInputText] = useState<string>(value?.toString() || '')

    // Update local state when value prop changes externally
    useEffect(() => {
      setInputText(value?.toString() || '')
    }, [value])

    const increment = () => {
      const currentValue = value || 0
      const newValue = Math.min(currentValue + step, max)
      onChange(newValue)
    }

    const decrement = () => {
      const currentValue = value || 0
      const newValue = Math.max(currentValue - step, min)
      onChange(newValue)
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      // Only update local state, don't call onChange yet
      setInputText(inputValue)
    }

    const handleBlur = () => {
      // Parse and validate when user finishes typing
      if (inputText === '') {
        onChange(null)
        return
      }
      
      const numValue = parseInt(inputText, 10)
      if (!isNaN(numValue) && numValue >= 0) {
        // Clamp value to min/max range
        const clampedValue = Math.min(Math.max(numValue, min), max)
        onChange(clampedValue)
        setInputText(clampedValue.toString())
      } else {
        // Invalid input, reset to current value
        setInputText(value?.toString() || '')
      }
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={id} className="text-sm">{label}</Label>
        <div className="flex items-center">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-r-none border-r-0"
            onClick={decrement}
            disabled={value !== null && value <= min}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Input
            id={id}
            type="text"
            placeholder={placeholder}
            value={inputText}
            onChange={handleInputChange}
            onBlur={handleBlur}
            className="rounded-none border-x-0 text-center h-10"
            inputMode="numeric"
            pattern="[0-9]*"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-l-none border-l-0"
            onClick={increment}
            disabled={value !== null && value >= max}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  const handleNext = () => {
    onNext()
  }

  const getLookingForLabel = () => {
    const labels: Record<LookingForType, string> = {
      // Talent & Performers
      'Model': '🎭 Models (All Types)',
      'Fashion Model': '🎭 Fashion Models',
      'Commercial Model': '🎭 Commercial Models',
      'Fitness Model': '🎭 Fitness Models',
      'Actor': '🎬 Actors / Actresses',
      'Actress': '🎬 Actors / Actresses',
      'Dancer': '💃 Dancers',
      'Musician': '🎸 Musicians',
      'Singer': '🎤 Singers',
      'Voice Actor': '🎙️ Voice Actors',
      'Performer': '🎭 Performers',
      'Influencer': '⭐ Influencers',
      'Content Creator': '📱 Content Creators',
      'Stunt Performer': '🤸 Stunt Performers',
      'Extra/Background Actor': '👥 Background Actors',
      'Hand Model': '🖐️ Hand Models',
      'Plus-Size Model': '🌟 Plus-Size Models',
      'Child Model': '👶 Child Models',
      'Teen Model': '👦 Teen Models',
      'Mature Model': '👵 Mature Models',

      // Visual Creators
      'Photographer': '📷 Photographers',
      'Videographer': '🎥 Videographers',
      'Cinematographer': '🎬 Cinematographers',
      'Drone Operator': '🚁 Drone Operators',
      'Camera Operator': '📷 Camera Operators',
      'Steadicam Operator': '🎥 Steadicam Operators',
      'BTS Photographer': '📸 BTS Photographers',
      'Product Photographer': '📦 Product Photographers',

      // Production & Crew
      'Producer': '🎬 Producers',
      'Director': '🎬 Directors',
      'Creative Director': '🎨 Creative Directors',
      'Art Director': '🖼️ Art Directors',
      'Production Manager': '📋 Production Managers',
      'Production Assistant': '📋 Production Assistants',
      'First AD': '🎬 First ADs',
      'Second AD': '🎬 Second ADs',
      'Script Supervisor': '📝 Script Supervisors',
      'Location Manager': '📍 Location Managers',

      // Styling & Beauty
      'Makeup Artist': '💄 Makeup Artists',
      'Hair Stylist': '💇 Hair Stylists',
      'Fashion Stylist': '👗 Fashion Stylists',
      'Wardrobe Stylist': '👔 Wardrobe Stylists',
      'Costume Designer': '🎭 Costume Designers',
      'Grooming Artist': '✨ Grooming Artists',
      'Special Effects Makeup': '🎭 Special Effects Makeup',
      'Nail Artist': '💅 Nail Artists',

      // Post-Production
      'Editor': '✂️ Editors (All Types)',
      'Video Editor': '✂️ Video Editors',
      'Photo Editor': '✂️ Photo Editors',
      'Retoucher': '🖌️ Retouchers',
      'Color Grader': '🎨 Color Graders',
      'Colorist': '🎨 Colorists',
      'VFX Artist': '✨ VFX Artists',
      'Motion Graphics Designer': '🎞️ Motion Graphics Designers',
      'Animator': '🎬 Animators',
      'Compositor': '🎬 Compositors',
      'Sound Designer': '🔊 Sound Designers',
      'Sound Engineer': '🔊 Sound Engineers',

      // Design & Creative
      'Graphic Designer': '🎨 Graphic Designers',
      'UI/UX Designer': '💻 UI/UX Designers',
      'Web Designer': '🌐 Web Designers',
      'Illustrator': '🖼️ Illustrators',
      '3D Artist': '🎮 3D Artists',
      'Set Designer': '🎭 Set Designers',
      'Prop Master': '🎪 Prop Masters',
      'Production Designer': '🎨 Production Designers',
      'Visual Designer': '🎨 Visual Designers',
      'Brand Designer': '🏢 Brand Designers',

      // Lighting & Grip
      'Gaffer': '💡 Gaffers',
      'Key Grip': '🔧 Key Grips',
      'Best Boy Electric': '⚡ Best Boy Electric',
      'Best Boy Grip': '🔧 Best Boy Grip',
      'Lighting Technician': '💡 Lighting Technicians',
      'Grip': '🔧 Grips',

      // Digital & Social
      'Social Media Manager': '📱 Social Media Managers',
      'Digital Marketer': '📱 Digital Marketers',
      'Copywriter': '✍️ Copywriters',
      'Scriptwriter': '📝 Scriptwriters',
      'Writer': '✍️ Writers',
      'Blogger': '📝 Bloggers',
      'Journalist': '📰 Journalists',

      // Business & Management
      'Agent': '🤵 Agents',
      'Casting Director': '🎭 Casting Directors',
      'Talent Manager': '⭐ Talent Managers',
      'Brand Manager': '🏢 Brand Managers',
      'Marketing Manager': '📊 Marketing Managers',
      'Public Relations': '🗣️ PR Professionals',
      'Event Coordinator': '📅 Event Coordinators',
      'Studio Manager': '🏢 Studio Managers',

      // Audio
      'Music Producer': '🎵 Music Producers',
      'DJ': '🎧 DJs',
      'Boom Operator': '🎤 Boom Operators',
      'Audio Engineer': '🔊 Audio Engineers',
      'Foley Artist': '🎵 Foley Artists',

      // Technical
      'DIT': '💻 DITs',
      'Data Wrangler': '📊 Data Wranglers',
      'Playback Operator': '▶️ Playback Operators',
      'Technical Director': '🔧 Technical Directors',
      'Systems Engineer': '💻 Systems Engineers',
    }

    if (!lookingFor || lookingFor.length === 0) return 'talent'
    
    // For multiple selections, join them
    if (lookingFor.length > 1) {
      return lookingFor.map(role => labels[role]).join(', ')
    }
    
    // For single selection
    return labels[lookingFor[0]] || 'talent'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Applicant Preferences</h2>
        {lookingFor && (
          <p className="text-lg font-medium text-primary mb-2">
            Looking for: {getLookingForLabel()}
          </p>
        )}
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Set your preferences for applicants to improve matchmaking quality. All preferences are optional and will help us find the best matches for your project.
        </p>
      </div>

      {/* Enable/Disable Preferences */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                <Label className="text-base font-medium">Preference Settings</Label>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose whether to set specific preferences or accept all applicants
              </p>
            </div>
            <Switch
              checked={hasPreferences}
              onCheckedChange={(checked) => {
                setHasPreferences(checked)
                if (!checked) {
                  // Reset all preferences to defaults when turning off
                  setPreferences(defaultPreferences)
                  onPreferencesChange(defaultPreferences)
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      {hasPreferences && (
        <>
          {/* Physical Preferences - Only show for Models and Actors */}
          {shouldShowPhysicalAttributes() && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5" />
                Physical Preferences
              </CardTitle>
              <CardDescription>
                Specify physical attributes if relevant to your project
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Height Range */}
              <RangeInput
                label="Height Range"
                description="Specify preferred height range for applicants"
                minValue={preferences.physical.height_range.min}
                maxValue={preferences.physical.height_range.max}
                onMinChange={(value) => updatePreferences('physical', 'height_range', {
                  ...preferences.physical.height_range,
                  min: value
                })}
                onMaxChange={(value) => updatePreferences('physical', 'height_range', {
                  ...preferences.physical.height_range,
                  max: value
                })}
                minPlaceholder="e.g., 150"
                maxPlaceholder="e.g., 200"
                min={100}
                max={250}
                unit="cm"
              />

              {/* Eye Color Preferences */}
              <MultiSelectChips
                label="Eye Color Preferences"
                description="Select preferred eye colors (optional)"
                options={EYE_COLORS.map(color => ({ value: color, label: color }))}
                selectedValues={preferences.physical.eye_color.preferred}
                onValuesChange={(values) => updatePreferences('physical', 'eye_color', {
                  ...preferences.physical.eye_color,
                  preferred: values
                })}
                placeholder="Select eye colors..."
                emptyText="No eye colors found"
              />

              {/* Hair Color Preferences */}
              <MultiSelectChips
                label="Hair Color Preferences"
                description="Select preferred hair colors (optional)"
                options={HAIR_COLORS.map(color => ({ value: color, label: color }))}
                selectedValues={preferences.physical.hair_color.preferred}
                onValuesChange={(values) => updatePreferences('physical', 'hair_color', {
                  ...preferences.physical.hair_color,
                  preferred: values
                })}
                placeholder="Select hair colors..."
                emptyText="No hair colors found"
              />

              {/* Age Range */}
              <RangeInput
                label="Age Range"
                description="Specify age requirements for applicants (18+ minimum)"
                minValue={preferences.other.age_range.min}
                maxValue={preferences.other.age_range.max}
                onMinChange={(value) => updatePreferences('other', 'age_range', {
                  ...preferences.other.age_range,
                  min: value
                })}
                onMaxChange={(value) => updatePreferences('other', 'age_range', {
                  ...preferences.other.age_range,
                  max: value
                })}
                minPlaceholder="e.g., 18"
                maxPlaceholder="e.g., 65"
                min={18}
                max={80}
                unit="years"
              />

              {/* Tattoos & Piercings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Tattoos</Label>
                    <p className="text-sm text-muted-foreground mt-1">Set tattoo preferences</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="tattoos-allowed" className="text-sm font-normal">Tattoos allowed</Label>
                        <p className="text-xs text-muted-foreground">Accept applicants with tattoos</p>
                      </div>
                      <Checkbox
                        id="tattoos-allowed"
                        checked={preferences.physical.tattoos.allowed}
                        onCheckedChange={(checked) => updatePreferences('physical', 'tattoos', {
                          ...preferences.physical.tattoos,
                          allowed: !!checked
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="tattoos-required" className="text-sm font-normal">Tattoos preferred</Label>
                        <p className="text-xs text-muted-foreground">Prefer applicants with tattoos</p>
                      </div>
                      <Checkbox
                        id="tattoos-required"
                        checked={preferences.physical.tattoos.required}
                        onCheckedChange={(checked) => updatePreferences('physical', 'tattoos', {
                          ...preferences.physical.tattoos,
                          required: !!checked
                        })}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-medium">Piercings</Label>
                    <p className="text-sm text-muted-foreground mt-1">Set piercing preferences</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="piercings-allowed" className="text-sm font-normal">Piercings allowed</Label>
                        <p className="text-xs text-muted-foreground">Accept applicants with piercings</p>
                      </div>
                      <Checkbox
                        id="piercings-allowed"
                        checked={preferences.physical.piercings.allowed}
                        onCheckedChange={(checked) => updatePreferences('physical', 'piercings', {
                          ...preferences.physical.piercings,
                          allowed: !!checked
                        })}
                      />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <Label htmlFor="piercings-required" className="text-sm font-normal">Piercings preferred</Label>
                        <p className="text-xs text-muted-foreground">Prefer applicants with piercings</p>
                      </div>
                      <Checkbox
                        id="piercings-required"
                        checked={preferences.physical.piercings.required}
                        onCheckedChange={(checked) => updatePreferences('physical', 'piercings', {
                          ...preferences.physical.piercings,
                          required: !!checked
                        })}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          )}

          {/* Professional Preferences - Only show for creative professionals */}
          {shouldShowProfessionalSkills() && (
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection('professional')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  <div className="text-left">
                    <CardTitle>Professional Preferences</CardTitle>
                    <CardDescription>
                      Set requirements for experience, skills, and specializations
                    </CardDescription>
                  </div>
                </div>
                {expandedSections.professional ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedSections.professional && (
              <CardContent className="space-y-6">
                  {/* Experience Range */}
                  <RangeInput
                    label="Experience Range"
                    description="Specify required experience level"
                    minValue={preferences.professional.experience_years.min}
                    maxValue={preferences.professional.experience_years.max}
                    onMinChange={(value) => updatePreferences('professional', 'experience_years', {
                      ...preferences.professional.experience_years,
                      min: value
                    })}
                    onMaxChange={(value) => updatePreferences('professional', 'experience_years', {
                      ...preferences.professional.experience_years,
                      max: value
                    })}
                    minPlaceholder="e.g., 2"
                    maxPlaceholder="e.g., 10"
                    min={0}
                    max={30}
                    unit="years"
                  />

                  {/* Portfolio Required */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="portfolio-required"
                      checked={preferences.professional.portfolio_required}
                      onCheckedChange={(checked) => updatePreferences('professional', 'portfolio_required', !!checked)}
                    />
                    <Label htmlFor="portfolio-required">Portfolio required</Label>
                  </div>

                  {/* Specializations - Required vs Preferred */}
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Required Specializations */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-medium flex items-center gap-2">
                            <Target className="w-4 h-4 text-destructive" />
                            Required Specializations
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">Must have these skills</p>
                        </div>
                        <div className="grid gap-3 max-h-64 overflow-y-auto">
                          {SPECIALIZATIONS.map(spec => (
                            <div key={spec} className="flex items-center space-x-2">
                              <Checkbox
                                id={`spec-required-${spec.toLowerCase().replace(/\s+/g, '-')}`}
                                checked={preferences.professional.specializations.required.includes(spec)}
                                onCheckedChange={(checked) => {
                                  // Handle Radix UI checkbox type (boolean | "indeterminate")
                                  if (checked === true) {
                                    addArrayItem('professional', 'specializations', 'required', spec)
                                  } else if (checked === false) {
                                    removeArrayItem('professional', 'specializations', 'required', spec)
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`spec-required-${spec.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {spec}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Preferred Talent Categories */}
                      <div className="space-y-4">
                        <div>
                          <Label className="text-base font-medium flex items-center gap-2">
                            <Heart className="w-4 h-4 text-primary" />
                            Preferred Talent Categories
                          </Label>
                          <p className="text-sm text-muted-foreground mt-1">Nice to have these roles</p>
                        </div>
                        <div className="grid gap-3 max-h-64 overflow-y-auto">
                          {TALENT_CATEGORIES.map(category => (
                            <div key={category} className="flex items-center space-x-2">
                              <Checkbox
                                id={`talent-${category.toLowerCase().replace(/\s+/g, '-')}`}
                                checked={preferences.professional.talent_categories.preferred.includes(category)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    addArrayItem('professional', 'talent_categories', 'preferred', category)
                                  } else {
                                    removeArrayItem('professional', 'talent_categories', 'preferred', category)
                                  }
                                }}
                              />
                              <Label 
                                htmlFor={`talent-${category.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-sm font-normal cursor-pointer"
                              >
                                {category}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
              </CardContent>
            )}
          </Card>
          )}

          {/* Equipment Requirements - Only show for photographers, videographers, and production crew */}
          {shouldShowEquipment() && (
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection('equipment')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  <div className="text-left">
                    <CardTitle>Equipment Requirements</CardTitle>
                    <CardDescription>
                      Specify required or preferred equipment for applicants
                    </CardDescription>
                  </div>
                </div>
                {expandedSections.equipment ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedSections.equipment && (
              <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Required Equipment */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Target className="w-4 h-4 text-destructive-500" />
                          Required Equipment
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">Must have access to</p>
                      </div>
                      <div className="grid gap-3 max-h-64 overflow-y-auto">
                        {EQUIPMENT_LIST.map(item => (
                          <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                              id={`equipment-req-${item.toLowerCase().replace(/\s+/g, '-')}`}
                              checked={preferences.professional.equipment?.required?.includes(item) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addArrayItem('professional', 'equipment', 'required', item)
                                } else {
                                  removeArrayItem('professional', 'equipment', 'required', item)
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`equipment-req-${item.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {item}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preferred Equipment */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary-500" />
                          Preferred Equipment
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">Nice to have access to</p>
                      </div>
                      <div className="grid gap-3 max-h-64 overflow-y-auto">
                        {EQUIPMENT_LIST.map(item => (
                          <div key={item} className="flex items-center space-x-2">
                            <Checkbox
                              id={`equipment-pref-${item.toLowerCase().replace(/\s+/g, '-')}`}
                              checked={preferences.professional.equipment?.preferred?.includes(item) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addArrayItem('professional', 'equipment', 'preferred', item)
                                } else {
                                  removeArrayItem('professional', 'equipment', 'preferred', item)
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`equipment-pref-${item.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {item}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
              </CardContent>
            )}
          </Card>
          )}

          {/* Software Requirements - Only show for photographers, videographers, and directors */}
          {shouldShowSoftware() && (
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection('software')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5" />
                  <div className="text-left">
                    <CardTitle>Software Requirements</CardTitle>
                    <CardDescription>
                      Specify required or preferred software proficiency for applicants
                    </CardDescription>
                  </div>
                </div>
                {expandedSections.software ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedSections.software && (
              <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Required Software */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Target className="w-4 h-4 text-destructive-500" />
                          Required Software
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">Must be proficient in</p>
                      </div>
                      <div className="grid gap-3 max-h-64 overflow-y-auto">
                        {SOFTWARE_LIST.map(app => (
                          <div key={app} className="flex items-center space-x-2">
                            <Checkbox
                              id={`software-req-${app.toLowerCase().replace(/\s+/g, '-')}`}
                              checked={preferences.professional.software?.required?.includes(app) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addArrayItem('professional', 'software', 'required', app)
                                } else {
                                  removeArrayItem('professional', 'software', 'required', app)
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`software-req-${app.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {app}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preferred Software */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary-500" />
                          Preferred Software
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">Nice to be proficient in</p>
                      </div>
                      <div className="grid gap-3 max-h-64 overflow-y-auto">
                        {SOFTWARE_LIST.map(app => (
                          <div key={app} className="flex items-center space-x-2">
                            <Checkbox
                              id={`software-pref-${app.toLowerCase().replace(/\s+/g, '-')}`}
                              checked={preferences.professional.software?.preferred?.includes(app) || false}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  addArrayItem('professional', 'software', 'preferred', app)
                                } else {
                                  removeArrayItem('professional', 'software', 'preferred', app)
                                }
                              }}
                            />
                            <Label 
                              htmlFor={`software-pref-${app.toLowerCase().replace(/\s+/g, '-')}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {app}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
              </CardContent>
            )}
          </Card>
          )}

          {/* Availability Preferences - Always show */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Availability Preferences
              </CardTitle>
              <CardDescription>
                Set travel and rate requirements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Travel Requirements */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="travel-required" className="text-base font-medium">Travel required for this project</Label>
                  <p className="text-sm text-muted-foreground">
                    Toggle to set travel and budget requirements for this project
                  </p>
                </div>
                <Switch
                  id="travel-required"
                  checked={preferences.availability.travel_required}
                  onCheckedChange={(checked) => updatePreferences('availability', 'travel_required', checked)}
                />
              </div>

              {/* Rate Range - Only show when travel is required */}
              {preferences.availability.travel_required && (
                <RangeInput
                  label="Hourly Rate Budget"
                  description="Set your budget range for hourly rates"
                  minValue={preferences.availability.hourly_rate_range.min}
                  maxValue={preferences.availability.hourly_rate_range.max}
                  onMinChange={(value) => updatePreferences('availability', 'hourly_rate_range', {
                    ...preferences.availability.hourly_rate_range,
                    min: value
                  })}
                  onMaxChange={(value) => updatePreferences('availability', 'hourly_rate_range', {
                    ...preferences.availability.hourly_rate_range,
                    max: value
                  })}
                  minPlaceholder="e.g., 25"
                  maxPlaceholder="e.g., 100"
                  min={5}
                  max={500}
                  step={5}
                  unit="€/hour"
                />
              )}
            </CardContent>
          </Card>

          {/* Language Requirements */}
          <Card>
            <CardHeader 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleSection('languages')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  <div className="text-left">
                    <CardTitle>Language Requirements</CardTitle>
                    <CardDescription>
                      Specify required or preferred languages for applicants
                    </CardDescription>
                  </div>
                </div>
                {expandedSections.languages ? (
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            {expandedSections.languages && (
              <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Required Languages */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Target className="w-4 h-4 text-destructive-500" />
                          Required Languages
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">Must speak fluently (English pre-selected)</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                        {LANGUAGES.map(lang => (
                          <div key={lang} className="flex items-center space-x-2">
                            <Checkbox
                              id={`language-req-${lang.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
                        checked={preferences.other.languages?.required?.includes(lang) || (lang === 'English')}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            addArrayItem('other', 'languages', 'required', lang)
                          } else {
                            removeArrayItem('other', 'languages', 'required', lang)
                          }
                        }}
                            />
                            <Label 
                              htmlFor={`language-req-${lang.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {lang} {lang === 'English' && '(Recommended)'}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preferred Languages */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium flex items-center gap-2">
                          <Heart className="w-4 h-4 text-primary-500" />
                          Preferred Languages
                        </Label>
                        <p className="text-sm text-muted-foreground mt-1">Nice to speak</p>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                        {LANGUAGES.filter(lang => lang !== 'English').map(lang => (
                          <div key={lang} className="flex items-center space-x-2">
                            <Checkbox
                              id={`language-pref-${lang.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
                        checked={preferences.other.languages?.preferred?.includes(lang) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            addArrayItem('other', 'languages', 'preferred', lang)
                          } else {
                            removeArrayItem('other', 'languages', 'preferred', lang)
                          }
                        }}
                            />
                            <Label 
                              htmlFor={`language-pref-${lang.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '')}`}
                              className="text-sm font-normal cursor-pointer"
                            >
                              {lang}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
              </CardContent>
            )}
          </Card>

        </>
      )}

      {/* Additional Requirements - Always visible */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5" />
              <div>
                <CardTitle>Additional Requirements</CardTitle>
                <CardDescription>
                  Toggle to add any other specific requirements or preferences
                </CardDescription>
              </div>
            </div>
            <Switch
              id="additional-requirements-toggle"
              checked={showAdditionalRequirements}
              onCheckedChange={(checked) => {
                setUserToggledAdditional(true)
                setShowAdditionalRequirements(checked)
                if (!checked) {
                  // If turning off, clear the content
                  updatePreferences('other', 'additional_requirements', '')
                } else if (!preferences.other.additional_requirements) {
                  // If turning on and no content, set a default empty string
                  updatePreferences('other', 'additional_requirements', '')
                }
              }}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Text field - Only show when toggle is on */}
          {showAdditionalRequirements && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Describe your requirements</Label>
              <Textarea
                placeholder="Describe any other specific requirements or preferences..."
                value={preferences.other.additional_requirements}
                onChange={(e) => updatePreferences('other', 'additional_requirements', e.target.value)}
                rows={4}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          Back
        </Button>
        <Button
          onClick={handleNext}
          disabled={loading}
          className="w-full sm:w-auto"
        >
          {loading ? 'Saving...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
