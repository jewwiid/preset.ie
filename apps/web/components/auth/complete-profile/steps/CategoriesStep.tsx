'use client'

import { useState, useEffect } from 'react'
import { useCompleteProfile } from '../CompleteProfileProvider'
import { Button } from '../../../ui/button'
import { Card, CardContent } from '../../../ui/card'
import { Badge } from '../../../ui/badge'
import { Check, Users, Camera, Sparkles, Loader2 } from 'lucide-react'

interface CategoryOption {
  id: string
  name: string
  description?: string
  category?: string
}

export function CategoriesStep() {
  const { 
    selectedRole, 
    profileData, 
    setProfileData, 
    setCurrentStep 
  } = useCompleteProfile()
  
  const [performanceRoles, setPerformanceRoles] = useState<CategoryOption[]>([])
  const [professionalSkills, setProfessionalSkills] = useState<CategoryOption[]>([])
  const [predefinedRoles, setPredefinedRoles] = useState<CategoryOption[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Selected categories based on role
  const [selectedPerformanceRoles, setSelectedPerformanceRoles] = useState<string[]>(
    profileData.performanceRoles || []
  )
  const [selectedProfessionalSkills, setSelectedProfessionalSkills] = useState<string[]>(
    profileData.professionalSkills || []
  )
  const [selectedContributorRoles, setSelectedContributorRoles] = useState<string[]>(
    profileData.contributorRoles || []
  )

  // Fetch categories from database
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch('/api/predefined-data')
        if (!response.ok) {
          throw new Error('Failed to fetch categories')
        }
        
        const data = await response.json()
        
        // Map the data to our CategoryOption format
        setPerformanceRoles(
          data.performance_roles?.map((role: any) => ({
            id: role.id,
            name: role.role_name,  // NEW: role_name instead of category_name
            description: role.description,
            category: role.category
          })) || []
        )
        
        setProfessionalSkills(
          data.professional_skills?.map((skill: any) => ({
            id: skill.id,
            name: skill.skill_name,  // NEW: skill_name instead of name
            description: skill.description,
            category: skill.category
          })) || []
        )
        
        setPredefinedRoles(
          data.predefined_roles?.map((role: any) => ({
            id: role.id,
            name: role.name,
            description: role.description,
            category: role.category
          })) || []
        )
        
      } catch (err) {
        console.error('Error fetching categories:', err)
        setError('Failed to load categories. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()
  }, [])

  // Update profile data when selections change
  useEffect(() => {
    setProfileData(prev => ({
      ...prev,
      performanceRoles: selectedPerformanceRoles,
      professionalSkills: selectedProfessionalSkills,
      contributorRoles: selectedContributorRoles
    }))
  }, [selectedPerformanceRoles, selectedProfessionalSkills, selectedContributorRoles, setProfileData])

  const handleCategoryToggle = (categoryName: string, categoryType: 'performance' | 'professional' | 'contributor') => {
    switch (categoryType) {
      case 'performance':
        setSelectedPerformanceRoles(prev => 
          prev.includes(categoryName) 
            ? prev.filter(cat => cat !== categoryName)
            : [...prev, categoryName]
        )
        break
      case 'professional':
        setSelectedProfessionalSkills(prev => 
          prev.includes(categoryName) 
            ? prev.filter(spec => spec !== categoryName)
            : [...prev, categoryName]
        )
        break
      case 'contributor':
        setSelectedContributorRoles(prev => 
          prev.includes(categoryName) 
            ? prev.filter(role => role !== categoryName)
            : [...prev, categoryName]
        )
        break
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'TALENT':
        return <Users className="w-5 h-5" />
      case 'CONTRIBUTOR':
        return <Camera className="w-5 h-5" />
      case 'BOTH':
        return <Sparkles className="w-5 h-5" />
      default:
        return <Users className="w-5 h-5" />
    }
  }

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'TALENT':
        return 'Performance Roles'
      case 'CONTRIBUTOR':
        return 'Professional Skills'
      case 'BOTH':
        return 'Your Roles & Skills'
      default:
        return 'Categories'
    }
  }

  const getRoleDescription = (role: string) => {
    switch (role) {
      case 'TALENT':
        return 'Select what you perform as (Model, Actor, Dancer, etc.)'
      case 'CONTRIBUTOR':
        return 'Select services you provide (Photography, Video Editing, etc.)'
      case 'BOTH':
        return 'Select both your performance roles and professional skills'
      default:
        return 'Select your categories'
    }
  }

  const isRequiredComplete = () => {
    if (!selectedRole) return false
    
    switch (selectedRole) {
      case 'TALENT':
        return selectedPerformanceRoles.length > 0
      case 'CONTRIBUTOR':
        return selectedProfessionalSkills.length > 0
      case 'BOTH':
        return selectedPerformanceRoles.length > 0 || selectedProfessionalSkills.length > 0
      default:
        return false
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Loading Categories...
          </h2>
          <p className="text-muted-foreground">
            Please wait while we load your role-specific options
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Error Loading Categories
          </h2>
          <p className="text-muted-foreground">
            {error}
          </p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        {selectedRole && getRoleIcon(selectedRole)}
        <div>
          <h2 className="text-2xl font-semibold text-foreground">
            {selectedRole ? getRoleTitle(selectedRole) : 'Work Categories'}
          </h2>
          <p className="text-muted-foreground">
            {selectedRole ? getRoleDescription(selectedRole) : 'Select your categories'}
          </p>
        </div>
      </div>

      {/* Role Display - Non-editable */}
      {selectedRole && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                {selectedRole}
              </Badge>
              <span className="text-sm text-muted-foreground">
                Selected during signup (cannot be changed here)
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Roles */}
      {(selectedRole === 'TALENT' || selectedRole === 'BOTH') && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Performance Roles
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              What you perform as (Model, Actor, Dancer, etc.)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {performanceRoles.map((role) => (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedPerformanceRoles.includes(role.name)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => handleCategoryToggle(role.name, 'performance')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {role.name}
                      </h4>
                      {role.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {role.description}
                        </p>
                      )}
                    </div>
                    {selectedPerformanceRoles.includes(role.name) && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Professional Skills */}
      {(selectedRole === 'CONTRIBUTOR' || selectedRole === 'BOTH') && (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Professional Skills
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Services you provide (Photography, Video Editing, etc.)
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {professionalSkills.map((skill) => (
              <Card
                key={skill.id}
                className={`cursor-pointer transition-all hover:border-primary/50 ${
                  selectedProfessionalSkills.includes(skill.name)
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50'
                }`}
                onClick={() => handleCategoryToggle(skill.name, 'professional')}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">
                        {skill.name}
                      </h4>
                      {skill.description && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {skill.description}
                        </p>
                      )}
                    </div>
                    {selectedProfessionalSkills.includes(skill.name) && (
                      <Check className="w-5 h-5 text-primary flex-shrink-0 ml-2" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Selected Categories Summary */}
      {(selectedPerformanceRoles.length > 0 || selectedProfessionalSkills.length > 0) && (
        <Card className="bg-muted/50">
          <CardContent className="p-4">
            <h4 className="font-medium text-foreground mb-2">Your Selections</h4>
            <div className="flex flex-wrap gap-2">
              {selectedPerformanceRoles.map((role) => (
                <Badge key={role} variant="secondary" className="bg-primary/10 text-primary">
                  {role}
                </Badge>
              ))}
              {selectedProfessionalSkills.map((skill) => (
                <Badge key={skill} variant="outline">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('physical')}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => setCurrentStep('preferences')}
          className="flex-1"
          disabled={!isRequiredComplete()}
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
