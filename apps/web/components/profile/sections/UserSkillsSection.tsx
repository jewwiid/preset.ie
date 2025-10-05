'use client'

import React, { useState, useEffect } from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, X, Star, Edit, Trash2, Award, Clock } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { TagInput } from '../common/FormField'

interface UserSkill {
  id: string
  skill_name: string
  skill_type: 'technical' | 'creative' | 'equipment' | 'software' | 'interpersonal'
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  years_experience: number | null
  verified: boolean
  description: string | null
  is_featured: boolean
  experience_level_label: string
}

const SKILL_TYPE_OPTIONS = [
  { value: 'creative', label: 'Creative' },
  { value: 'technical', label: 'Technical' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'software', label: 'Software' },
  { value: 'interpersonal', label: 'Interpersonal' }
]

const PROFICIENCY_OPTIONS = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
  { value: 'expert', label: 'Expert' }
]

export function UserSkillsSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData } = useProfileForm()
  
  const [skills, setSkills] = useState<UserSkill[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingSkill, setEditingSkill] = useState<UserSkill | null>(null)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [quickAddValue, setQuickAddValue] = useState('')
  
  // Form state for new/editing skill
  const [skillName, setSkillName] = useState('')
  const [skillType, setSkillType] = useState<'technical' | 'creative' | 'equipment' | 'software' | 'interpersonal'>('creative')
  const [proficiencyLevel, setProficiencyLevel] = useState<'beginner' | 'intermediate' | 'advanced' | 'expert'>('intermediate')
  const [yearsExperience, setYearsExperience] = useState<number | null>(null)
  const [description, setDescription] = useState('')
  const [isFeatured, setIsFeatured] = useState(false)

  // Predefined skill options
  const [predefinedSkills, setPredefinedSkills] = useState<Array<{skill_name: string, category: string}>>([])
  const [predefinedSpecializations, setPredefinedSpecializations] = useState<string[]>([])
  const [loadingOptions, setLoadingOptions] = useState(false)

  // Fetch user skills
  useEffect(() => {
    if (profile?.id) {
      fetchUserSkills()
    }
  }, [profile?.id])

  // Fetch predefined skill options
  useEffect(() => {
    const fetchPredefinedOptions = async () => {
      if (typeof window === 'undefined') return
      
      setLoadingOptions(true)
      try {
        const response = await fetch('/api/predefined-data')
        if (response.ok) {
          const data = await response.json()
          setPredefinedSkills(data.professional_skills || [])
          setPredefinedSpecializations(
            data.specializations?.map((spec: any) => spec.name) || []
          )
        }
      } catch (error) {
        console.error('Error fetching predefined options:', error)
      } finally {
        setLoadingOptions(false)
      }
    }

    fetchPredefinedOptions()
  }, [])

  const fetchUserSkills = async () => {
    if (!profile?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/user-skills?profile_id=${profile.id}`)
      if (response.ok) {
        const data = await response.json()
        setSkills(data.skills || [])
      } else {
        setError('Failed to load skills')
      }
    } catch (err) {
      setError('Failed to load skills')
      console.error('Error fetching user skills:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSkill = async () => {
    if (!profile?.id || !skillName.trim()) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile_id: profile.id,
          skill_name: skillName.trim(),
          skill_type: skillType,
          proficiency_level: proficiencyLevel,
          years_experience: yearsExperience,
          description: description.trim() || null,
          is_featured: isFeatured
        })
      })
      
      if (response.ok) {
        await fetchUserSkills() // Refresh the list
        resetForm()
      } else {
        setError('Failed to save skill')
      }
    } catch (err) {
      setError('Failed to save skill')
      console.error('Error saving skill:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteSkill = async (skillName: string) => {
    if (!profile?.id) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/user-skills?profile_id=${profile.id}&skill_name=${encodeURIComponent(skillName)}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        await fetchUserSkills() // Refresh the list
      } else {
        setError('Failed to delete skill')
      }
    } catch (err) {
      setError('Failed to delete skill')
      console.error('Error deleting skill:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleEditSkill = (skill: UserSkill) => {
    setEditingSkill(skill)
    setSkillName(skill.skill_name)
    setSkillType(skill.skill_type)
    setProficiencyLevel(skill.proficiency_level)
    setYearsExperience(skill.years_experience)
    setDescription(skill.description || '')
    setIsFeatured(skill.is_featured)
  }

  const resetForm = () => {
    setEditingSkill(null)
    setSkillName('')
    setSkillType('creative')
    setProficiencyLevel('intermediate')
    setYearsExperience(null)
    setDescription('')
    setIsFeatured(false)
  }

  const getExperienceLevelColor = (label: string) => {
    switch (label) {
      case 'Expert': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'Advanced': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
      case 'Intermediate': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'Novice': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'Beginner': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loading && skills.length === 0) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-6 w-20 mb-2" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-muted rounded-lg p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div>
            <h4 className="font-medium text-foreground">Skills & Experience</h4>
            <p className="text-sm text-muted-foreground">
              Add skills with experience levels or keep as simple tags
            </p>
          </div>
        </div>
        {isEditing && (
          <div className="flex gap-2">
            <Button
              onClick={resetForm}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Skill
            </Button>
            <Button
              onClick={() => setShowQuickAdd(!showQuickAdd)}
              variant="ghost"
              size="sm"
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Quick Add
            </Button>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Quick Add Interface */}
      {showQuickAdd && isEditing && (
        <Alert className="border-blue-200 bg-blue-50">
          <div className="space-y-3">
            <h4 className="font-medium text-blue-900">Quick Add Skills</h4>
            <p className="text-sm text-blue-700">
              Add skills as simple tags (like specializations) or upgrade them later with experience details.
            </p>
            <TagInput
              label=""
              tags={[]}
              onAddTag={async (skillName) => {
                try {
                  const response = await fetch('/api/user-skills', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      profile_id: profile?.id,
                      skill_name: skillName,
                      skill_type: 'creative',
                      proficiency_level: 'intermediate'
                    })
                  })
                  if (response.ok) {
                    await fetchUserSkills()
                  }
                } catch (error) {
                  console.error('Failed to add skill:', error)
                }
              }}
              onRemoveTag={() => {}}
              placeholder="Type skill name and press Enter..."
              predefinedOptions={[...predefinedSkills.map(s => s.skill_name), ...predefinedSpecializations].filter((skill, index, arr) => arr.indexOf(skill) === index)}
              strictMode={false}
              className="mb-2"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => setShowQuickAdd(false)}
                variant="ghost"
                size="sm"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setShowQuickAdd(false)}
                variant="outline"
                size="sm"
              >
                Done
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {/* Migration Notice for existing specializations */}
      {profile?.specializations && profile.specializations.length > 0 && skills.length === 0 && (
        <Alert>
          <AlertDescription>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm">
                  <strong>Migration Available:</strong> You have {profile.specializations.length} specialization(s) in your profile. 
                  Would you like to migrate them to the new Skills & Experience system for better tracking?
                </p>
                {isEditing && (
                  <Button
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/user-skills/migrate', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ 
                            profile_id: profile.id,
                            specializations: profile.specializations 
                          })
                        })
                        if (response.ok) {
                          await fetchUserSkills()
                        }
                      } catch (error) {
                        console.error('Migration failed:', error)
                      }
                    }}
                    variant="outline"
                    size="sm"
                    className="mt-2"
                  >
                    Migrate Specializations
                  </Button>
                )}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Skills List */}
      <div className="space-y-3">
        {skills.map((skill) => (
          <Card key={skill.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">{skill.skill_name}</h4>
                    {skill.is_featured && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                    {skill.verified && (
                      <Award className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary">{skill.skill_type}</Badge>
                    <Badge variant="secondary">{skill.proficiency_level}</Badge>
                    <Badge className={getExperienceLevelColor(skill.experience_level_label)}>
                      {skill.experience_level_label}
                    </Badge>
                    {skill.years_experience !== null && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {skill.years_experience} {skill.years_experience === 1 ? 'year' : 'years'}
                      </Badge>
                    )}
                  </div>
                  
                  {skill.description && (
                    <p className="text-sm text-muted-foreground">{skill.description}</p>
                  )}
                </div>
                
                {isEditing && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditSkill(skill)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSkill(skill.skill_name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {skills.length === 0 && !loading && (
          <Alert className="text-center py-8 border-blue-200 bg-blue-50">
            <Award className="h-12 w-12 text-blue-500 mx-auto mb-3" />
            <AlertDescription className="space-y-4">
              <div>
                <h4 className="font-medium text-blue-900 mb-2">No Skills Added Yet</h4>
                <p className="text-sm text-blue-700 mb-4">
                  Add your professional skills with years of experience to showcase your expertise and improve job matching.
                </p>
              </div>
              {isEditing && (
                <Button
                  onClick={resetForm}
                  variant="default"
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Skill
                </Button>
              )}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Add/Edit Skill Form */}
      {isEditing && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingSkill ? 'Edit Skill' : 'Add New Skill'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="skill-name">Skill Name *</Label>
                <Input
                  id="skill-name"
                  value={skillName}
                  onChange={(e) => setSkillName(e.target.value)}
                  placeholder="e.g., Portrait Photography"
                  list="skill-suggestions"
                />
                <datalist id="skill-suggestions">
                  {[...predefinedSkills.map(s => s.skill_name), ...predefinedSpecializations]
                    .filter((skill, index, arr) => arr.indexOf(skill) === index) // Remove duplicates
                    .sort()
                    .map((skill) => (
                      <option key={skill} value={skill} />
                    ))
                  }
                </datalist>
                {loadingOptions && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Loading skill options...
                  </div>
                )}
                {!loadingOptions && (predefinedSkills.length > 0 || predefinedSpecializations.length > 0) && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {predefinedSkills.length + predefinedSpecializations.length} predefined options available
                  </div>
                )}
              </div>
              
              <div>
                <Label htmlFor="skill-type">Skill Type</Label>
                <Select value={skillType} onValueChange={(value: any) => setSkillType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SKILL_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="proficiency-level">Proficiency Level</Label>
                <Select value={proficiencyLevel} onValueChange={(value: any) => setProficiencyLevel(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROFICIENCY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="years-experience">Years of Experience</Label>
                <Input
                  id="years-experience"
                  type="number"
                  min="0"
                  max="50"
                  value={yearsExperience || ''}
                  onChange={(e) => setYearsExperience(e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="e.g., 5"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Additional details about this skill"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is-featured"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="is-featured">Feature this skill prominently</Label>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                onClick={handleSaveSkill}
                disabled={loading || !skillName.trim()}
              >
                {loading ? 'Saving...' : editingSkill ? 'Update Skill' : 'Add Skill'}
              </Button>
              {editingSkill && (
                <Button variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
