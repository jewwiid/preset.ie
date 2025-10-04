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

  // Local state for form data
  const [formSettings, setFormSettings] = useState({
    location_visibility: true,
    profile_visibility: true
  })

  // Load settings when component mounts
  useEffect(() => {
    if (settings) {
      setFormSettings({
        location_visibility: settings.location_visibility,
        profile_visibility: settings.profile_visibility
      })
    }
  }, [settings])

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

      // Update only privacy settings
      const { data: settingsData, error: settingsError } = await (supabase as any)
        .from('user_settings')
        .upsert({
          user_id: profile.user_id,
          location_visibility: formSettings.location_visibility,
          profile_visibility: formSettings.profile_visibility,
          updated_at: new Date().toISOString()
        } as any)
        .select()
        .single()

      if (settingsError) {
        throw settingsError
      }

      // Update context
      setSettings(settingsData as any)
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
              <Label htmlFor="location-visibility" className="text-sm font-medium">
                Location Visibility
              </Label>
              <p className="text-xs text-muted-foreground">
                Allow others to see your location
              </p>
            </div>
            <Switch
              id="location-visibility"
              checked={formSettings.location_visibility}
              onCheckedChange={(checked) => handleSettingsChange('location_visibility', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <Label htmlFor="profile-visibility" className="text-sm font-medium">
                Profile Visibility
              </Label>
              <p className="text-xs text-muted-foreground">
                Make your profile visible to others
              </p>
            </div>
            <Switch
              id="profile-visibility"
              checked={formSettings.profile_visibility}
              onCheckedChange={(checked) => handleSettingsChange('profile_visibility', checked)}
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
            <div className={`w-2 h-2 rounded-full ${formSettings.location_visibility ? 'bg-primary' : 'bg-muted'}`}></div>
            <span className="text-muted-foreground">Location Visible</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${formSettings.profile_visibility ? 'bg-primary' : 'bg-muted'}`}></div>
            <span className="text-muted-foreground">Profile Visible</span>
          </div>
        </div>
      </div>
    </div>
  )
}
