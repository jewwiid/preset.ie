'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TagInput } from '@/components/ui/TagInput'
import { InlinePrivacyToggle } from '@/components/ui/InlinePrivacyToggle'
import { ProfileFormData } from '@/lib/profile-validation'

interface ProfessionalStepProps {
  formData: ProfileFormData
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>
  userRole: any
}

interface ExperienceLevel {
  id: number
  level_name: string
  sort_order: number
}

interface ProfessionalSkill {
  skill_name: string
  category: string
  description: string
}

interface ContributorRole {
  name: string
  category: string
  description: string
}

interface TalentCategory {
  category_name: string
  description: string
}

export default function ProfessionalStep({
  formData,
  setFormData,
  userRole
}: ProfessionalStepProps) {
  const isContributor = userRole?.isContributor
  const isTalent = userRole?.isTalent

  // State for predefined data from database
  const [experienceLevels, setExperienceLevels] = useState<ExperienceLevel[]>([])
  const [professionalSkills, setProfessionalSkills] = useState<ProfessionalSkill[]>([])
  const [contributorRoles, setContributorRoles] = useState<ContributorRole[]>([])
  const [talentCategories, setTalentCategories] = useState<TalentCategory[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch predefined data from API
  useEffect(() => {
    const fetchPredefinedData = async () => {
      try {
        const response = await fetch('/api/predefined-data')
        if (response.ok) {
          const data = await response.json()
          setExperienceLevels(data.experience_levels || [])
          setProfessionalSkills(data.professional_skills || [])
          setContributorRoles(data.predefined_roles || [])
          setTalentCategories(data.talent_categories || [])
        } else {
          console.error('Failed to fetch predefined data')
        }
      } catch (error) {
        console.error('Error fetching predefined data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPredefinedData()
  }, [])

  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }


  return (
    <div className="space-y-6">
      {/* Common Professional Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Professional Information</CardTitle>
          <CardDescription>
            Share your professional background and skills
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Years of Experience */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                min="0"
                max="100"
                value={formData.years_experience || ''}
                onChange={(e) => handleFieldChange('years_experience', parseInt(e.target.value) || undefined)}
                placeholder="5"
                className="mt-1"
              />
            </div>
            <InlinePrivacyToggle
              checked={formData.show_experience ?? true}
              onChange={(checked) => handleFieldChange('show_experience', checked)}
              label="Show experience"
              className="ml-4"
            />
          </div>

          {/* Languages */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label>Languages</Label>
              <TagInput
                value={formData.languages || []}
                onChange={(languages) => handleFieldChange('languages', languages)}
                placeholder="Add language (e.g., English, Spanish)"
                maxTags={20}
                className="mt-1"
              />
            </div>
          </div>

          {/* Specializations */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <Label>Specializations</Label>
              <TagInput
                value={formData.specializations || []}
                onChange={(specializations) => handleFieldChange('specializations', specializations)}
                placeholder="Add specialization (e.g., Portrait Photography, Event Photography)"
                maxTags={20}
                className="mt-1"
              />
            </div>
            <InlinePrivacyToggle
              checked={formData.show_specializations ?? true}
              onChange={(checked) => handleFieldChange('show_specializations', checked)}
              label="Show specializations"
              className="ml-4"
            />
          </div>

          {/* Experience Level */}
          <div>
            <Label htmlFor="experience_level">Experience Level</Label>
            <Select
              value={formData.experience_level || ''}
              onValueChange={(value) => handleFieldChange('experience_level', value)}
              disabled={loading}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={loading ? "Loading experience levels..." : "Select experience level"} />
              </SelectTrigger>
              <SelectContent>
                {experienceLevels.map((level) => (
                  <SelectItem key={level.id} value={level.level_name}>
                    {level.level_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {loading && (
              <p className="text-xs text-muted-foreground mt-1">Fetching options from database...</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Contributor-specific Fields */}
      {isContributor && (
        <Card>
          <CardHeader>
            <CardTitle>Contributor Skills</CardTitle>
            <CardDescription>
              Share your technical skills and equipment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Equipment */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label>Equipment</Label>
                <TagInput
                  value={formData.equipment_list || []}
                  onChange={(equipment) => handleFieldChange('equipment_list', equipment)}
                  placeholder="Add equipment (e.g., Canon EOS R5, 24-70mm f/2.8)"
                  maxTags={50}
                  className="mt-1"
                />
              </div>
              <InlinePrivacyToggle
                checked={formData.show_equipment ?? true}
                onChange={(checked) => handleFieldChange('show_equipment', checked)}
                label="Show equipment"
                className="ml-4"
              />
            </div>

            {/* Editing Software */}
            <div>
              <Label>Editing Software</Label>
              <TagInput
                value={formData.editing_software || []}
                onChange={(software) => handleFieldChange('editing_software', software)}
                placeholder="Add software (e.g., Adobe Photoshop, Lightroom, DaVinci Resolve)"
                maxTags={20}
                className="mt-1"
              />
            </div>

            {/* Professional Skills */}
            <div>
              <Label>Professional Skills</Label>
              <TagInput
                value={formData.professional_skills || []}
                onChange={(skills) => handleFieldChange('professional_skills', skills)}
                placeholder={loading ? "Loading skills..." : "Add skills (e.g., Color Grading, Retouching, Video Editing)"}
                maxTags={30}
                className="mt-1"
                predefinedOptions={professionalSkills.map(skill => skill.skill_name)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Select from database or add custom skills. Available categories: {Array.from(new Set(professionalSkills.map(s => s.category))).join(', ')}
              </p>
            </div>

            {/* Contributor Roles */}
            <div>
              <Label>Contributor Roles</Label>
              <TagInput
                value={formData.contributor_roles || []}
                onChange={(roles) => handleFieldChange('contributor_roles', roles)}
                placeholder={loading ? "Loading roles..." : "Add roles (e.g., Photographer, Videographer, Editor)"}
                maxTags={20}
                className="mt-1"
                predefinedOptions={contributorRoles.map(role => role.name)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Select from database or add custom roles. Available categories: {Array.from(new Set(contributorRoles.map(r => r.category))).join(', ')}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Talent-specific Fields */}
      {isTalent && (
        <Card>
          <CardHeader>
            <CardTitle>Performance Information</CardTitle>
            <CardDescription>
              Share your performance background and roles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Performance Roles */}
            <div>
              <Label>Performance Roles</Label>
              <TagInput
                value={formData.performance_roles || []}
                onChange={(roles) => handleFieldChange('performance_roles', roles)}
                placeholder={loading ? "Loading roles..." : "Add roles (e.g., Actor, Model, Dancer, Voice Artist)"}
                maxTags={20}
                className="mt-1"
                predefinedOptions={talentCategories.map(category => category.category_name)}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Select from database: {talentCategories.length > 0 ? talentCategories.map(c => c.category_name).join(', ') : 'Loading talent categories...'}
              </p>
            </div>

            {/* Placeholder for future physical attributes */}
            <div className="p-4 border border-dashed border-muted-foreground/25 rounded-lg bg-muted/10">
              <p className="text-sm text-muted-foreground">
                Physical attributes (height, eye color, etc.) will be available in a future update.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
