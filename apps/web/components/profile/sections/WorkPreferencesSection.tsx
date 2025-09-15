'use client'

import React from 'react'
import { useProfile, useProfileEditing, useProfileForm } from '../context/ProfileContext'
import { ToggleSwitch } from '../common/ToggleSwitch'
import { Briefcase, Clock, Users, Shield, DollarSign, MapPin } from 'lucide-react'

export function WorkPreferencesSection() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const { formData, updateField } = useProfileForm()

  const handleFieldChange = (field: string, value: any) => {
    updateField(field, value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Briefcase className="h-5 w-5 text-emerald-600" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Work Preferences</h2>
      </div>

      {/* Compensation Preferences */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-4 w-4 text-emerald-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Compensation</h3>
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
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-emerald-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Location Preferences</h3>
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
        </div>
      </div>

      {/* Schedule Preferences */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-emerald-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Schedule Preferences</h3>
        </div>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Available Weekdays"
            checked={isEditing ? (formData.available_weekdays || false) : (profile?.available_weekdays || false)}
            onChange={(checked) => handleFieldChange('available_weekdays', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Available Weekends"
            checked={isEditing ? (formData.available_weekends || false) : (profile?.available_weekends || false)}
            onChange={(checked) => handleFieldChange('available_weekends', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Available Evenings"
            checked={isEditing ? (formData.available_evenings || false) : (profile?.available_evenings || false)}
            onChange={(checked) => handleFieldChange('available_evenings', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Available Overnight"
            checked={isEditing ? (formData.available_overnight || false) : (profile?.available_overnight || false)}
            onChange={(checked) => handleFieldChange('available_overnight', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Collaboration Preferences */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="h-4 w-4 text-emerald-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Collaboration Style</h3>
        </div>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Works with Teams"
            checked={isEditing ? (formData.works_with_teams || false) : (profile?.works_with_teams || false)}
            onChange={(checked) => handleFieldChange('works_with_teams', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Prefers Solo Work"
            checked={isEditing ? (formData.prefers_solo_work || false) : (profile?.prefers_solo_work || false)}
            onChange={(checked) => handleFieldChange('prefers_solo_work', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Content Preferences */}
      <div className="space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="h-4 w-4 text-emerald-600" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Content Comfort</h3>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Specify your comfort level with different types of content
        </p>
        
        <div className="space-y-3">
          <ToggleSwitch
            label="Comfortable with Nudity"
            checked={isEditing ? (formData.comfortable_with_nudity || false) : (profile?.comfortable_with_nudity || false)}
            onChange={(checked) => handleFieldChange('comfortable_with_nudity', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Comfortable with Intimate Content"
            checked={isEditing ? (formData.comfortable_with_intimate_content || false) : (profile?.comfortable_with_intimate_content || false)}
            onChange={(checked) => handleFieldChange('comfortable_with_intimate_content', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />

          <ToggleSwitch
            label="Requires Model Release"
            checked={isEditing ? (formData.requires_model_release || false) : (profile?.requires_model_release || false)}
            onChange={(checked) => handleFieldChange('requires_model_release', checked)}
            className={isEditing ? '' : 'pointer-events-none'}
          />
        </div>
      </div>

      {/* Information Notice */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Privacy & Safety
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
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
