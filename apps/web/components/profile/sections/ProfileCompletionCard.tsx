'use client'

import React, { useState } from 'react'
import { useProfile, useProfileEditing, useProfileUI } from '../context/ProfileContext'
import { UserProfile } from '../types/profile'
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  Star,
  Award,
  Camera,
  Briefcase,
  MapPin,
  Phone,
  Globe,
  Palette,
  Clock,
  DollarSign,
  Users,
  Settings,
  ExternalLink,
  Edit3,
  X,
  ChevronDown,
  ChevronUp,
  User
} from 'lucide-react'

interface ProfileField {
  key: string
  label: string
  weight: number
  icon: React.ComponentType<{ className?: string }>
  category: 'basic' | 'professional' | 'contact' | 'social' | 'equipment'
  description: string
  actionText: string
  applicableRoles?: ('CONTRIBUTOR' | 'TALENT' | 'BOTH')[] // Which roles this field applies to
}

const PROFILE_FIELDS: ProfileField[] = [
  // ============ CRITICAL FIELDS - Visual Identity ============
  { key: 'avatar_url', label: 'Profile Photo', weight: 15, icon: User, category: 'basic', description: 'Upload your profile photo', actionText: 'Add Photo' },
  { key: 'primary_skill', label: 'Primary Skill', weight: 15, icon: Star, category: 'professional', description: 'Your main profession', actionText: 'Set Primary Skill' },
  
  // ============ UNIVERSAL FIELDS - Basic Information ============
  { key: 'bio', label: 'Bio', weight: 10, icon: Edit3, category: 'basic', description: 'Tell others about yourself', actionText: 'Add Bio' },
  { key: 'city', label: 'Location', weight: 8, icon: MapPin, category: 'basic', description: 'Where are you based?', actionText: 'Set Location' },
  { key: 'country', label: 'Country', weight: 5, icon: MapPin, category: 'basic', description: 'Your country', actionText: 'Set Country' },
  
  // ============ UNIVERSAL FIELDS - Skills & Experience ============
  { key: 'specializations', label: 'Specializations', weight: 12, icon: Star, category: 'professional', description: 'What do you specialize in?', actionText: 'Add Specializations' },
  { key: 'years_experience', label: 'Years Experience', weight: 10, icon: Award, category: 'professional', description: 'Years of experience', actionText: 'Add Experience' },
  { key: 'experience_level', label: 'Experience Level', weight: 8, icon: Award, category: 'professional', description: 'Beginner to Expert', actionText: 'Set Level' },
  
  // ============ UNIVERSAL FIELDS - Rates & Availability ============
  { key: 'hourly_rate_min', label: 'Rate Range', weight: 10, icon: DollarSign, category: 'professional', description: 'Your hourly rate', actionText: 'Set Rates' },
  { key: 'typical_turnaround_days', label: 'Turnaround Time', weight: 6, icon: Clock, category: 'professional', description: 'How fast do you work?', actionText: 'Set Turnaround' },
  { key: 'availability_status', label: 'Availability', weight: 5, icon: Clock, category: 'professional', description: 'Your current availability', actionText: 'Set Status' },
  
  // ============ UNIVERSAL FIELDS - Contact & Portfolio ============
  { key: 'phone_number', label: 'Phone', weight: 5, icon: Phone, category: 'contact', description: 'Contact number', actionText: 'Add Phone' },
  { key: 'portfolio_url', label: 'Portfolio', weight: 8, icon: Briefcase, category: 'social', description: 'Showcase your work', actionText: 'Add Portfolio' },
  { key: 'website_url', label: 'Website', weight: 5, icon: Globe, category: 'social', description: 'Your website', actionText: 'Add Website' },
  { key: 'instagram_handle', label: 'Instagram', weight: 3, icon: ExternalLink, category: 'social', description: 'Instagram profile', actionText: 'Add Instagram' },
  { key: 'tiktok_handle', label: 'TikTok', weight: 2, icon: ExternalLink, category: 'social', description: 'TikTok profile', actionText: 'Add TikTok' },
  
  // ============ UNIVERSAL FIELDS - Additional Info ============
  { key: 'available_for_travel', label: 'Travel Availability', weight: 4, icon: Globe, category: 'professional', description: 'Can you travel for work?', actionText: 'Set Travel Info' },
  { key: 'languages', label: 'Languages', weight: 4, icon: Users, category: 'contact', description: 'Languages you speak', actionText: 'Add Languages' },
  
  // ============ CONTRIBUTOR-SPECIFIC FIELDS ============
  { key: 'equipment_list', label: 'Equipment', weight: 8, icon: Camera, category: 'equipment', description: 'What gear do you use?', actionText: 'Add Equipment', applicableRoles: ['CONTRIBUTOR', 'BOTH'] },
  { key: 'editing_software', label: 'Software', weight: 6, icon: Settings, category: 'equipment', description: 'Editing software you use', actionText: 'Add Software', applicableRoles: ['CONTRIBUTOR', 'BOTH'] },
  { key: 'studio_name', label: 'Studio Info', weight: 4, icon: Camera, category: 'equipment', description: 'Do you have a studio?', actionText: 'Add Studio Info', applicableRoles: ['CONTRIBUTOR', 'BOTH'] },
  { key: 'has_studio', label: 'Has Studio', weight: 3, icon: Camera, category: 'equipment', description: 'Studio availability', actionText: 'Set Studio', applicableRoles: ['CONTRIBUTOR', 'BOTH'] },
  
  // ============ TALENT-SPECIFIC FIELDS ============
  { key: 'talent_categoriess', label: 'Talent Categorys', weight: 10, icon: Star, category: 'professional', description: 'Types of performance work', actionText: 'Add Roles', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'height_cm', label: 'Height', weight: 6, icon: Users, category: 'professional', description: 'Your height', actionText: 'Add Height', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'weight_kg', label: 'Weight', weight: 4, icon: Users, category: 'professional', description: 'Your weight', actionText: 'Add Weight', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'body_type', label: 'Body Type', weight: 4, icon: Users, category: 'professional', description: 'Your body type', actionText: 'Set Body Type', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'eye_color', label: 'Eye Color', weight: 3, icon: Users, category: 'professional', description: 'Your eye color', actionText: 'Add Eye Color', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'hair_color', label: 'Hair Color', weight: 3, icon: Users, category: 'professional', description: 'Your hair color', actionText: 'Add Hair Color', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'hair_length', label: 'Hair Length', weight: 2, icon: Users, category: 'professional', description: 'Your hair length', actionText: 'Set Hair Length', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'skin_tone', label: 'Skin Tone', weight: 2, icon: Users, category: 'professional', description: 'Your skin tone', actionText: 'Set Skin Tone', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'gender_identity', label: 'Gender Identity', weight: 4, icon: Users, category: 'basic', description: 'Your gender identity', actionText: 'Set Gender', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'ethnicity', label: 'Ethnicity', weight: 3, icon: Users, category: 'basic', description: 'Your ethnicity', actionText: 'Set Ethnicity', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'nationality', label: 'Nationality', weight: 3, icon: Globe, category: 'basic', description: 'Your nationality', actionText: 'Set Nationality', applicableRoles: ['TALENT', 'BOTH'] },
  { key: 'tattoos', label: 'Tattoos/Piercings', weight: 2, icon: Users, category: 'professional', description: 'Body modifications', actionText: 'Add Info', applicableRoles: ['TALENT', 'BOTH'] }
]

// Helper function to get applicable fields for a user's role
const getApplicableFields = (roleFlags: string[]): ProfileField[] => {
  const hasContributor = roleFlags.includes('CONTRIBUTOR')
  const hasTalent = roleFlags.includes('TALENT')
  
  return PROFILE_FIELDS.filter(field => {
    // If no applicableRoles specified, field applies to everyone
    if (!field.applicableRoles) return true
    
    // Check if user's role matches any of the applicable roles
    if (hasContributor && hasTalent && field.applicableRoles.includes('BOTH')) return true
    if (hasContributor && field.applicableRoles.includes('CONTRIBUTOR')) return true
    if (hasTalent && field.applicableRoles.includes('TALENT')) return true
    
    return false
  })
}

const calculateProfileCompletion = (profile: UserProfile): { 
  percentage: number
  missingFields: ProfileField[]
  completedFields: ProfileField[]
  categoryProgress: Record<string, { completed: number; total: number; percentage: number }>
} => {
  let completedWeight = 0
  let totalWeight = 0
  const missingFields: ProfileField[] = []
  const completedFields: ProfileField[] = []
  const categoryProgress: Record<string, { completed: number; total: number; percentage: number }> = {}

  // Initialize category progress
  const categories = ['basic', 'professional', 'contact', 'social', 'equipment']
  categories.forEach(cat => {
    categoryProgress[cat] = { completed: 0, total: 0, percentage: 0 }
  })

  // Get only the fields applicable to this user's role
  const applicableFields = getApplicableFields(profile.account_type || [])

  applicableFields.forEach(field => {
    totalWeight += field.weight
    categoryProgress[field.category].total += field.weight

    const value = profile[field.key as keyof UserProfile]
    const isCompleted = value !== undefined && value !== null && value !== '' && 
      (!Array.isArray(value) || value.length > 0)

    if (isCompleted) {
      completedWeight += field.weight
      completedFields.push(field)
      categoryProgress[field.category].completed += field.weight
    } else {
      missingFields.push(field)
    }
  })

  // Calculate category percentages
  Object.keys(categoryProgress).forEach(cat => {
    const progress = categoryProgress[cat]
    // Prevent NaN by checking if total is 0 (no fields in this category for this role)
    progress.percentage = progress.total > 0 
      ? Math.round((progress.completed / progress.total) * 100) 
      : 0
  })

  return {
    percentage: Math.round((completedWeight / totalWeight) * 100),
    missingFields,
    completedFields,
    categoryProgress
  }
}

export function ProfileCompletionCard() {
  const { profile } = useProfile()
  const { setEditing } = useProfileEditing()
  const { setActiveTab, setActiveSubTab } = useProfileUI()
  const [showDetails, setShowDetails] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)

  if (!profile) return null

  const completion = calculateProfileCompletion(profile)
  const isComplete = completion.percentage === 100

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'basic': return Edit3
      case 'professional': return Briefcase
      case 'contact': return Phone
      case 'social': return Globe
      case 'equipment': return Camera
      default: return Circle
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'basic': return 'bg-primary'
      case 'professional': return 'bg-primary'
      case 'contact': return 'bg-primary'
      case 'social': return 'bg-primary'
      case 'equipment': return 'bg-primary'
      default: return 'bg-primary'
    }
  }

  const getPriorityFields = () => {
    return completion.missingFields
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3)
  }

  const handleFieldAction = (field: ProfileField) => {
    // Enable editing mode
    setEditing(true)
    
    // Set the main tab to 'profile'
    setActiveTab('profile')
    
    // Map field categories to sub-tabs
    const categoryToSubTab: Record<string, string> = {
      'basic': 'personal',
      'professional': 'professional', 
      'contact': 'personal',
      'social': 'personal',
      'equipment': 'professional'
    }
    
    // Set the appropriate sub-tab based on field category
    const subTab = categoryToSubTab[field.category] || 'personal'
    setActiveSubTab(subTab)
  }

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header - Always Visible */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              isComplete
                ? 'bg-primary'
                : 'bg-primary'
            }`}>
              {isComplete ? (
                <CheckCircle className="w-6 h-6 text-primary-foreground" />
              ) : (
                <Award className="w-6 h-6 text-primary-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">
                Profile Completion
              </h3>
              <p className="text-sm text-muted-foreground">
                {isComplete 
                  ? '🎉 Your profile is complete!' 
                  : `${completion.missingFields.length} fields remaining`
                }
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {isComplete && (
              <div className="flex items-center gap-2 px-3 py-1 bg-primary-100 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400 rounded-full text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Complete
              </div>
            )}
            
            {/* Expand/Collapse Button */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="text-sm font-medium">
                {isExpanded ? 'Hide Details' : 'Show Details'}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Overall Progress</span>
            <span className="text-sm font-bold text-foreground">{completion.percentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="h-3 rounded-full transition-all duration-500 bg-primary"
              style={{ width: `${completion.percentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Expandable Content */}
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
        isExpanded ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
      }`}>

        {/* Category Progress */}
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {Object.entries(completion.categoryProgress)
              .filter(([_, progress]) => progress.total > 0) // Only show categories applicable to user's role
              .map(([category, progress]) => {
              const Icon = getCategoryIcon(category)
              const colorClass = getCategoryColor(category)
              
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    selectedCategory === category
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-border'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 mx-auto ${colorClass}`}>
                    <Icon className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-medium text-foreground capitalize mb-1">
                      {category}
                    </p>
                    <p className="text-sm font-bold text-foreground">
                      {progress.percentage}%
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Priority Actions */}
          {!isComplete && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground mb-3">
                Complete these to improve your profile:
              </h4>
              {getPriorityFields().map((field, index) => (
                <div key={field.key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <field.icon className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {field.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {field.description}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleFieldAction(field)}
                    className="flex items-center gap-1 px-3 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium rounded-md transition-colors"
                  >
                    {field.actionText}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Show All Fields Button */}
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="w-full mt-4 flex items-center justify-center gap-2 p-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-sm font-medium">
              {showDetails ? 'Hide All Fields' : 'Show All Fields'}
            </span>
            {showDetails ? (
              <X className="w-4 h-4" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Detailed View */}
        {showDetails && (
          <div className="border-t border-border p-6 bg-muted">
            <div className="space-y-4">
              {Object.entries(completion.categoryProgress).map(([category, progress]) => (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {React.createElement(getCategoryIcon(category), { 
                        className: "w-4 h-4 text-muted-foreground" 
                      })}
                      <span className="text-sm font-medium text-foreground capitalize">
                        {category} ({progress.completed}/{progress.total} points)
                      </span>
                    </div>
                    <span className="text-sm font-bold text-foreground">
                      {progress.percentage}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getCategoryColor(category)}`}
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
