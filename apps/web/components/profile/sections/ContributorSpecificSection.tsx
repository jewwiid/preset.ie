'use client'

import React, { useState, useEffect } from 'react'
import { useProfileEditing } from '../context/ProfileContext'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { X, Plus } from 'lucide-react'
import { normalizeUrl } from '@/lib/utils/url-formatter'

interface ContributorSpecificSectionProps {
  profile?: any
  formData?: any
  onFieldChange?: (field: string, value: any) => void
}

interface PredefinedRole {
  name: string
  category: string
  description: string
}

interface PredefinedSkill {
  skill_name: string
  category: string
  description: string
}

interface PredefinedData {
  predefined_roles: PredefinedRole[]
  professional_skills: PredefinedSkill[]
}

export function ContributorSpecificSection({ 
  profile, 
  formData, 
  onFieldChange 
}: ContributorSpecificSectionProps) {
  const { isEditing } = useProfileEditing()
  const [predefinedRoles, setPredefinedRoles] = useState<PredefinedRole[]>([])
  const [predefinedSkills, setPredefinedSkills] = useState<PredefinedSkill[]>([])
  const [selectedSkillDescription, setSelectedSkillDescription] = useState<string>('')
  const [loading, setLoading] = useState(true)

  // Fetch predefined roles from API
  useEffect(() => {
    const fetchPredefinedData = async () => {
      try {
        const response = await fetch('/api/predefined-data')
        if (response.ok) {
          const data: PredefinedData = await response.json()
          setPredefinedRoles(data.predefined_roles || [])
          setPredefinedSkills(data.professional_skills || [])
        } else {
          console.error('Failed to fetch predefined data')
          // Fallback to hardcoded roles
          setPredefinedRoles([
            { name: 'Photographer', category: 'creative', description: 'Captures still images and photographs' },
            { name: 'Videographer', category: 'creative', description: 'Records video content and footage' },
            { name: 'Copywriter', category: 'creative', description: 'Writes marketing copy and content' },
            { name: 'Script Writer', category: 'creative', description: 'Writes scripts for video content' },
            { name: 'Lighting Technician', category: 'technical', description: 'Sets up and operates lighting equipment' },
            { name: 'Sound Engineer', category: 'technical', description: 'Manages audio recording and mixing' },
            { name: 'Audio Technician', category: 'technical', description: 'Handles audio equipment and recording' },
            { name: 'Gaffer', category: 'technical', description: 'Chief lighting technician' },
            { name: 'Grip', category: 'technical', description: 'Handles camera support and rigging' },
            { name: 'Drone Operator', category: 'technical', description: 'Operates drone equipment for aerial shots' },
            { name: 'Production Assistant', category: 'production', description: 'Assists with production tasks' },
            { name: 'Assistant', category: 'production', description: 'General production support' },
            { name: 'Location Scout', category: 'production', description: 'Finds and secures shooting locations' },
            { name: 'Script Supervisor', category: 'production', description: 'Maintains continuity and script notes' },
            { name: 'Creative Director', category: 'creative', description: 'Oversees creative strategy and vision' },
            { name: 'Freelancer', category: 'creative', description: 'Independent creative professional' },
            { name: 'Artist', category: 'creative', description: 'Visual artist and creative professional' },
            { name: 'Agency', category: 'business', description: 'Creative agency or studio' },
            { name: 'Entrepreneur', category: 'business', description: 'Business owner and innovator' },
            { name: 'Studio', category: 'business', description: 'Creative studio or production house' },
            { name: 'Contractor', category: 'business', description: 'Independent contractor and freelancer' }
          ])
        }
      } catch (error) {
        console.error('Error fetching predefined data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPredefinedData()
  }, [])

  const [selectedRoleDescription, setSelectedRoleDescription] = useState<string>('')

  const addContributorRole = (role: string) => {
    const currentRoles = isEditing ? (formData.contributor_roles || []) : (profile?.contributor_roles || [])
    if (!currentRoles.includes(role)) {
      const newRoles = [...currentRoles, role]
      onFieldChange?.('contributor_roles', newRoles)
    }
    // Clear the description after selection
    setSelectedRoleDescription('')
  }

  const addProfessionalSkill = (skill: string) => {
    const currentSkills = isEditing ? (formData.professional_skills || []) : (profile?.professional_skills || [])
    if (!currentSkills.includes(skill)) {
      const newSkills = [...currentSkills, skill]
      onFieldChange?.('professional_skills', newSkills)
    }
    // Clear the description after selection
    setSelectedSkillDescription('')
  }

  const removeContributorRole = (role: string) => {
    const currentRoles = isEditing ? (formData.contributor_roles || []) : (profile?.contributor_roles || [])
    const newRoles = currentRoles.filter((r: string) => r !== role)
    onFieldChange?.('contributor_roles', newRoles)
  }

  const removeProfessionalSkill = (skill: string) => {
    const currentSkills = isEditing ? (formData.professional_skills || []) : (profile?.professional_skills || [])
    const newSkills = currentSkills.filter((s: string) => s !== skill)
    onFieldChange?.('professional_skills', newSkills)
  }

  // Group roles by category
  const rolesByCategory = predefinedRoles.reduce((acc, role) => {
    if (!acc[role.category]) {
      acc[role.category] = []
    }
    acc[role.category].push(role)
    return acc
  }, {} as Record<string, PredefinedRole[]>)

  // Group skills by category
  const skillsByCategory = predefinedSkills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = []
    }
    acc[skill.category].push(skill)
    return acc
  }, {} as Record<string, PredefinedSkill[]>)

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">Contributor Information</h2>
        <p className="text-sm text-muted-foreground">
          Specify your professional roles and specializations as a contributor.
        </p>
      </div>

      {/* Contributor Roles */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Contributor Roles</h3>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="contributor-role">Add Contributor Role</Label>
            <Select
              onValueChange={(value) => {
                if (value) {
                  // Find the role description before adding
                  const role = predefinedRoles.find(r => r.name === value)
                  if (role) {
                    setSelectedRoleDescription(role.description)
                  }
                  addContributorRole(value)
                }
              }}
              disabled={!isEditing || loading}
            >
              <SelectTrigger id="contributor-role">
                <SelectValue placeholder={loading ? "Loading roles..." : "Select a contributor role..."} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(rolesByCategory).map(([category, roles]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {category}
                    </div>
                    {roles
                      .filter(role => !(isEditing ? (formData.contributor_roles || []) : (profile?.contributor_roles || [])).includes(role.name))
                      .map((role) => (
                        <SelectItem key={role.name} value={role.name}>
                          {role.name}
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            
            {/* Role Description */}
            {selectedRoleDescription && (
              <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Description:</span> {selectedRoleDescription}
                </p>
              </div>
            )}
          </div>
          
          {/* Display Selected Roles */}
          {(isEditing ? (formData.contributor_roles || []) : (profile?.contributor_roles || [])).length > 0 && (
            <div>
              <Label className="text-sm font-medium text-foreground mb-2">Selected Roles</Label>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? (formData.contributor_roles || []) : (profile?.contributor_roles || [])).map((role: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm"
                  >
                    {role}
                    {isEditing && (
                      <button
                        onClick={() => removeContributorRole(role)}
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
          Select the professional roles that best describe your work as a contributor.
        </p>
      </div>

      {/* Professional Skills */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Professional Skills</h3>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="professional-skills">Add Professional Skill</Label>
            <Select
              onValueChange={(value) => {
                if (value) {
                  // Find the skill description before adding
                  const skill = predefinedSkills.find(s => s.skill_name === value)
                  if (skill) {
                    setSelectedSkillDescription(skill.description)
                  }
                  addProfessionalSkill(value)
                }
              }}
              disabled={!isEditing || loading}
            >
              <SelectTrigger id="professional-skills">
                <SelectValue placeholder={loading ? "Loading skills..." : "Select a professional skill..."} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(skillsByCategory).map(([category, skills]) => (
                  <div key={category}>
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      {category}
                    </div>
                    {skills
                      .filter(skill => !(isEditing ? (formData.professional_skills || []) : (profile?.professional_skills || [])).includes(skill.skill_name))
                      .map((skill) => (
                        <SelectItem key={skill.skill_name} value={skill.skill_name}>
                          {skill.skill_name}
                        </SelectItem>
                      ))}
                  </div>
                ))}
              </SelectContent>
            </Select>
            
            {/* Skill Description */}
            {selectedSkillDescription && (
              <div className="mt-2 p-3 bg-muted/50 rounded-md border">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium">Description:</span> {selectedSkillDescription}
                </p>
              </div>
            )}
          </div>
          
          {/* Display Selected Skills */}
          {(isEditing ? (formData.professional_skills || []) : (profile?.professional_skills || [])).length > 0 && (
            <div>
              <Label className="text-sm font-medium text-foreground mb-2">Selected Skills</Label>
              <div className="flex flex-wrap gap-2">
                {(isEditing ? (formData.professional_skills || []) : (profile?.professional_skills || [])).map((skill: string, index: number) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-secondary text-secondary-foreground rounded-full text-sm"
                  >
                    {skill}
                    {isEditing && (
                      <button
                        onClick={() => removeProfessionalSkill(skill)}
                        className="ml-1 text-secondary-foreground/70 hover:text-secondary-foreground transition-colors"
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
          Select your professional skills, tools, and certifications from the database.
        </p>
      </div>

      {/* Portfolio/Work Samples */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4">Portfolio & Work Samples</h3>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="website-url">Website URL</Label>
            <Input
              id="website-url"
              type="text"
              placeholder="example.com"
              value={isEditing ? (formData.website_url || '') : (profile?.website_url || '')}
              onChange={(e) => onFieldChange?.('website_url', e.target.value)}
              onBlur={(e) => {
                if (isEditing) {
                  const normalized = normalizeUrl(e.target.value);
                  if (normalized !== e.target.value) {
                    onFieldChange?.('website_url', normalized);
                  }
                }
              }}
              disabled={!isEditing}
            />
            {isEditing && (
              <p className="text-xs text-muted-foreground mt-1">
                We'll add https:// automatically
              </p>
            )}
          </div>
          
          <div>
            <Label htmlFor="portfolio-url">Portfolio URL</Label>
            <Input
              id="portfolio-url"
              type="url"
              placeholder="https://your-portfolio.com"
              value={isEditing ? (formData.portfolio_url || '') : (profile?.portfolio_url || '')}
              onChange={(e) => onFieldChange?.('portfolio_url', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          
          <div>
            <Label htmlFor="behance-url">Behance Profile</Label>
            <Input
              id="behance-url"
              type="url"
              placeholder="https://behance.net/yourusername"
              value={isEditing ? (formData.behance_url || '') : (profile?.behance_url || '')}
              onChange={(e) => onFieldChange?.('behance_url', e.target.value)}
              disabled={!isEditing}
            />
          </div>
          
          <div>
            <Label htmlFor="dribbble-url">Dribbble Profile</Label>
            <Input
              id="dribbble-url"
              type="url"
              placeholder="https://dribbble.com/yourusername"
              value={isEditing ? (formData.dribbble_url || '') : (profile?.dribbble_url || '')}
              onChange={(e) => onFieldChange?.('dribbble_url', e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mt-2">
          Share links to your professional portfolio and work samples.
        </p>
      </div>
    </div>
  )
}
