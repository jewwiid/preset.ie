'use client'

import React, { useState, useEffect } from 'react'
import { useProfileSettings, useProfile } from '../context/ProfileContext'
import { ValidationMessage } from '../common/ValidationMessage'
import { Settings, Shield } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'
import { Switch } from '../../ui/switch'
import { Label } from '../../ui/label'

export function SettingsPanel() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { settings, setSettings } = useProfileSettings()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Local state for form data (using profile fields, not settings)
  const [formSettings, setFormSettings] = useState({
    show_location: true,
    show_age: true,
    show_physical_attributes: true
  })

  // Load settings from profile when component mounts
  useEffect(() => {
    if (profile) {
      setFormSettings({
        show_location: profile.show_location ?? true,
        show_age: profile.show_age ?? true,
        show_physical_attributes: profile.show_physical_attributes ?? true
      })
    }
  }, [profile])

  const handleSettingsChange = (field: string, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveSettings = async () => {
    if (!user || !profile) return

    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      // Update privacy settings in users_profile table
      const { error: updateError } = await (supabase as any)
        .from('users_profile')
        .update({
          show_location: formSettings.show_location,
          show_age: formSettings.show_age,
          show_physical_attributes: formSettings.show_physical_attributes,
          updated_at: new Date().toISOString()
        })
        .eq('id', profile.id)

      if (updateError) {
        throw updateError
      }

      setSuccess('Privacy settings saved successfully!')

    } catch (err) {
      console.error('Error saving privacy settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save privacy settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-6 flex items-center gap-2">
        <Settings className="w-5 h-5" />
        Settings
      </h2>

      {/* Success/Error Messages */}
      {success && (
        <ValidationMessage type="success" message={success} />
      )}

      {error && (
        <ValidationMessage type="error" message={error} />
      )}

      {/* Privacy Settings */}
      <div className="bg-muted rounded-lg p-4">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Privacy Settings
        </h3>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <Label htmlFor="show-location" className="text-sm font-medium">
                Show Location
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow others to see your city and country
              </p>
            </div>
            <Switch
              id="show-location"
              checked={formSettings.show_location}
              onCheckedChange={(checked) => handleSettingsChange('show_location', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <Label htmlFor="show-age" className="text-sm font-medium">
                Show Age
              </Label>
              <p className="text-xs text-muted-foreground">
                Display your age on your profile
              </p>
            </div>
            <Switch
              id="show-age"
              checked={formSettings.show_age}
              onCheckedChange={(checked) => handleSettingsChange('show_age', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <Label htmlFor="show-physical" className="text-sm font-medium">
                Show Physical Attributes
              </Label>
              <p className="text-xs text-muted-foreground">
                Display height, weight, body type, etc. (for talents)
              </p>
            </div>
            <Switch
              id="show-physical"
              checked={formSettings.show_physical_attributes}
              onCheckedChange={(checked) => handleSettingsChange('show_physical_attributes', checked)}
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-primary hover:bg-primary/90 disabled:bg-muted text-primary-foreground px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Shield className="w-4 h-4" />
              Save Privacy Settings
            </>
          )}
        </button>
      </div>

      {/* Current Settings Display */}
      <div className="bg-card rounded-lg p-4 border border-border">
        <h3 className="text-lg font-medium text-foreground mb-4">Current Privacy Settings</h3>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${formSettings.show_location ? 'bg-green-500' : 'bg-muted'}`}></div>
            <span className="text-muted-foreground">Location {formSettings.show_location ? 'Visible' : 'Hidden'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${formSettings.show_age ? 'bg-green-500' : 'bg-muted'}`}></div>
            <span className="text-muted-foreground">Age {formSettings.show_age ? 'Visible' : 'Hidden'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${formSettings.show_physical_attributes ? 'bg-green-500' : 'bg-muted'}`}></div>
            <span className="text-muted-foreground">Physical Attributes {formSettings.show_physical_attributes ? 'Visible' : 'Hidden'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
