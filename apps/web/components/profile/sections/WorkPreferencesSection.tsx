'use client'

import React from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { ToggleSwitch } from '../common/ToggleSwitch'
import WorkingHoursSection from './WorkingHoursSection'
import { Briefcase, Clock, Users, Shield, DollarSign, MapPin } from 'lucide-react'

export function WorkPreferencesSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value)
  }

  const handleEdit = () => {
    // This will be handled by the parent component
  }

  const handleSave = () => {
    // This will be handled by the parent component
  }

  const handleCancel = () => {
    // This will be handled by the parent component
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="h-5 w-5 text-primary-600" />
        <h2 className="text-xl font-semibold text-muted-foreground-900 dark:text-primary-foreground">Work Preferences</h2>
      </div>

      {/* Compensation Preferences */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-primary-600" />
          <h3 className="text-lg font-medium text-muted-foreground-900 dark:text-primary-foreground">Compensation</h3>
        </div>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Accept TFP (Trade for Portfolio)"
            checked={isEditing ? (formData.accepts_tfp || false) : (profile?.accepts_tfp || false)}
            onChange={(checked) => handleFieldChange('accepts_tfp', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Accept Expenses Only"
            checked={isEditing ? (formData.accepts_expenses_only || false) : (profile?.accepts_expenses_only || false)}
            onChange={(checked) => handleFieldChange('accepts_expenses_only', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Location Preferences */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-primary-600" />
          <h3 className="text-lg font-medium text-muted-foreground-900 dark:text-primary-foreground">Location Preferences</h3>
        </div>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Prefer Studio Work"
            checked={isEditing ? (formData.prefers_studio || false) : (profile?.prefers_studio || false)}
            onChange={(checked) => handleFieldChange('prefers_studio', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Prefer Outdoor Work"
            checked={isEditing ? (formData.prefers_outdoor || false) : (profile?.prefers_outdoor || false)}
            onChange={(checked) => handleFieldChange('prefers_outdoor', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Available for Travel"
            checked={isEditing ? (formData.available_for_travel || false) : (profile?.available_for_travel || false)}
            onChange={(checked) => handleFieldChange('available_for_travel', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Working Hours */}
      <WorkingHoursSection 
        profile={profile || undefined}
        isEditing={isEditing}
        onEdit={handleEdit}
        onSave={handleSave}
        onCancel={handleCancel}
        onFieldChange={handleFieldChange}
        formData={formData || undefined}
      />

      {/* Collaboration Preferences */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-primary-600" />
          <h3 className="text-lg font-medium text-muted-foreground-900 dark:text-primary-foreground">Collaboration Style</h3>
        </div>
        
        {/* These fields were removed from the database as redundant */}
      </div>

      {/* Content Preferences */}
      <div className="space-y-4 border-t border-border pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-primary-600" />
          <h3 className="text-lg font-medium text-muted-foreground-900 dark:text-primary-foreground">Content Comfort</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Specify your comfort level with different types of content
        </p>
        
        {/* These fields were removed from the database as redundant */}
      </div>

      {/* Information Notice */}
      <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-primary">
              Privacy & Safety
            </h3>
            <div className="mt-2 text-sm text-muted-foreground">
              <p>
                Your work preferences help us match you with compatible opportunities. 
                All information is kept private and only shared with potential collaborators 
                when you choose to apply for gigs.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
