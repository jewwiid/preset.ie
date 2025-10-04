'use client'

import React from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { ToggleSwitch } from '../common/ToggleSwitch'
import { Shield, Eye, MapPin, User, Lock, Globe } from 'lucide-react'

export function PrivacySettingsSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold text-foreground">Privacy Settings</h2>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary">
              Your Privacy Matters
            </h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>
                Control what information is visible to other users. You can change these settings 
                at any time, and they will be applied immediately.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Visibility */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Profile Visibility</h3>
        </div>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Show Age"
            checked={isEditing ? (formData.show_age || false) : (profile?.show_age || false)}
            onChange={(checked) => handleFieldChange('show_age', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Show Location"
            checked={isEditing ? (formData.show_location || false) : (profile?.show_location || false)}
            onChange={(checked) => handleFieldChange('show_location', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Show Physical Attributes"
            checked={isEditing ? (formData.show_physical_attributes || false) : (profile?.show_physical_attributes || false)}
            onChange={(checked) => handleFieldChange('show_physical_attributes', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Contact Information</h3>
        </div>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Show Phone Number"
            checked={isEditing ? (formData.show_phone || false) : (profile?.show_phone || false)}
            onChange={(checked) => handleFieldChange('show_phone', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Show Social Media Links"
            checked={isEditing ? (formData.show_social_links || false) : (profile?.show_social_links || false)}
            onChange={(checked) => handleFieldChange('show_social_links', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Show Website & Portfolio"
            checked={isEditing ? (formData.show_website || false) : (profile?.show_website || false)}
            onChange={(checked) => handleFieldChange('show_website', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Professional Information */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Professional Information</h3>
        </div>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Show Experience Level"
            checked={isEditing ? (formData.show_experience || false) : (profile?.show_experience || false)}
            onChange={(checked) => handleFieldChange('show_experience', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Show Specializations"
            checked={isEditing ? (formData.show_specializations || false) : (profile?.show_specializations || false)}
            onChange={(checked) => handleFieldChange('show_specializations', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Show Equipment & Software"
            checked={isEditing ? (formData.show_equipment || false) : (profile?.show_equipment || false)}
            onChange={(checked) => handleFieldChange('show_equipment', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Show Rate Information"
            checked={isEditing ? (formData.show_rates || false) : (profile?.show_rates || false)}
            onChange={(checked) => handleFieldChange('show_rates', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Search & Discovery */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Search & Discovery</h3>
        </div>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Include in Search Results"
            checked={isEditing ? (formData.include_in_search || false) : (profile?.include_in_search || false)}
            onChange={(checked) => handleFieldChange('include_in_search', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Show Availability Status"
            checked={isEditing ? (formData.show_availability || false) : (profile?.show_availability || false)}
            onChange={(checked) => handleFieldChange('show_availability', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Allow Direct Messages"
            checked={isEditing ? (formData.allow_direct_messages || false) : (profile?.allow_direct_messages || false)}
            onChange={(checked) => handleFieldChange('allow_direct_messages', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Allow Collaboration Invitations"
            description="Allow other users to invite you to collaborate on projects"
            checked={isEditing ? (formData.allow_collaboration_invites !== false) : (profile?.allow_collaboration_invites !== false)}
            onChange={(checked) => handleFieldChange('allow_collaboration_invites', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Data & Analytics */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Data & Analytics</h3>
        </div>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Share Profile Analytics"
            checked={isEditing ? (formData.share_analytics || false) : (profile?.share_analytics || false)}
            onChange={(checked) => handleFieldChange('share_analytics', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Participate in Research"
            checked={isEditing ? (formData.participate_research || false) : (profile?.participate_research || false)}
            onChange={(checked) => handleFieldChange('participate_research', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-muted border border-border rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-foreground">
              Privacy Notice
            </h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>
                Your privacy settings control what information is visible to other users on the platform. 
                Some information may still be visible to Preset administrators for moderation and support purposes. 
                We never share your personal information with third parties without your explicit consent.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
