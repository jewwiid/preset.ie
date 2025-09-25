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
  ChevronUp
} from 'lucide-react'

interface ProfileField {
  key: string
  label: string
  weight: number
  icon: React.ComponentType<{ className?: string }>
  category: 'basic' | 'professional' | 'contact' | 'social' | 'equipment'
  description: string
  actionText: string
}

const PROFILE_FIELDS: ProfileField[] = [
  // Basic Information (High Priority)
  { key: 'bio', label: 'Bio', weight: 10, icon: Edit3, category: 'basic', description: 'Tell others about yourself', actionText: 'Add Bio' },
  { key: 'city', label: 'Location', weight: 8, icon: MapPin, category: 'basic', description: 'Where are you based?', actionText: 'Set Location' },
  { key: 'country', label: 'Country', weight: 5, icon: MapPin, category: 'basic', description: 'Your country', actionText: 'Set Country' },
  
  // Professional Information (High Priority)
  { key: 'years_experience', label: 'Experience', weight: 12, icon: Award, category: 'professional', description: 'Years of experience', actionText: 'Add Experience' },
  { key: 'specializations', label: 'Specializations', weight: 15, icon: Star, category: 'professional', description: 'What do you specialize in?', actionText: 'Add Specializations' },
  { key: 'hourly_rate_min', label: 'Rate Range', weight: 10, icon: DollarSign, category: 'professional', description: 'Your hourly rate', actionText: 'Set Rates' },
  { key: 'typical_turnaround_days', label: 'Turnaround Time', weight: 6, icon: Clock, category: 'professional', description: 'How fast do you work?', actionText: 'Set Turnaround' },
  
  // Equipment & Software (Medium Priority)
  { key: 'equipment_list', label: 'Equipment', weight: 8, icon: Camera, category: 'equipment', description: 'What gear do you use?', actionText: 'Add Equipment' },
  { key: 'editing_software', label: 'Software', weight: 6, icon: Settings, category: 'equipment', description: 'Editing software you use', actionText: 'Add Software' },
  
  // Contact Information (Medium Priority)
  { key: 'phone_number', label: 'Phone', weight: 5, icon: Phone, category: 'contact', description: 'Contact number', actionText: 'Add Phone' },
  
  // Social & Portfolio (Lower Priority)
  { key: 'portfolio_url', label: 'Portfolio', weight: 8, icon: Briefcase, category: 'social', description: 'Showcase your work', actionText: 'Add Portfolio' },
  { key: 'website_url', label: 'Website', weight: 5, icon: Globe, category: 'social', description: 'Your website', actionText: 'Add Website' },
  { key: 'instagram_handle', label: 'Instagram', weight: 3, icon: ExternalLink, category: 'social', description: 'Instagram profile', actionText: 'Add Instagram' },
  { key: 'tiktok_handle', label: 'TikTok', weight: 2, icon: ExternalLink, category: 'social', description: 'TikTok profile', actionText: 'Add TikTok' },
  
  // Additional Info (Lower Priority)
  { key: 'available_for_travel', label: 'Travel Availability', weight: 4, icon: Globe, category: 'professional', description: 'Can you travel for work?', actionText: 'Set Travel Info' },
  { key: 'has_studio', label: 'Studio Info', weight: 4, icon: Camera, category: 'professional', description: 'Do you have a studio?', actionText: 'Add Studio Info' },
  { key: 'languages', label: 'Languages', weight: 4, icon: Users, category: 'contact', description: 'Languages you speak', actionText: 'Add Languages' }
]

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

  PROFILE_FIELDS.forEach(field => {
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
    progress.percentage = Math.round((progress.completed / progress.total) * 100)
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
      case 'basic': return 'from-primary to-primary/90'
      case 'professional': return 'from-primary to-primary/90'
      case 'contact': return 'from-primary to-primary/90'
      case 'social': return 'from-primary to-primary/90'
      case 'equipment': return 'from-primary to-primary/90'
      default: return 'from-primary to-primary/90'
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
                ? 'bg-gradient-to-br from-primary to-primary/90' 
                : 'bg-gradient-to-br from-primary to-primary/90'
            }`}>
              {isComplete ? (
                <CheckCircle className="w-6 h-6 text-white" />
              ) : (
                <Award className="w-6 h-6 text-white" />
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
              className={`h-3 rounded-full transition-all duration-500 ${
                isComplete 
                  ? 'bg-gradient-to-r from-primary to-primary/90' 
                  : 'bg-gradient-to-r from-primary to-primary/90'
              }`}
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
            {Object.entries(completion.categoryProgress).map(([category, progress]) => {
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
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 mx-auto bg-gradient-to-br ${colorClass}`}>
                    <Icon className="w-4 h-4 text-white" />
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
                      className={`h-2 rounded-full bg-gradient-to-r ${getCategoryColor(category)}`}
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
