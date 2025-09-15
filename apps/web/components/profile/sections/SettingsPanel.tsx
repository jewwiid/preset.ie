'use client'

import React, { useState, useEffect } from 'react'
import { useProfileSettings, useProfileEditing, useProfile } from '../context/ProfileContext'
import { ToggleSwitch, RangeField } from '../common/FormField'
import { ValidationMessage } from '../common/ValidationMessage'
import { Settings, Bell, Eye, Lock, Globe, Shield } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'

export function SettingsPanel() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { settings, notificationPrefs, setSettings, setNotificationPrefs } = useProfileSettings()
  const { isEditing } = useProfileEditing()
  
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Local state for form data
  const [formSettings, setFormSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    location_visibility: true,
    profile_visibility: true
  })

  const [formNotificationPrefs, setFormNotificationPrefs] = useState({
    location_radius: 50,
    max_budget: null as number | null,
    min_budget: null as number | null,
    preferred_purposes: [] as string[]
  })

  // Load settings when component mounts
  useEffect(() => {
    if (settings) {
      setFormSettings({
        email_notifications: settings.email_notifications,
        push_notifications: settings.push_notifications,
        marketing_emails: settings.marketing_emails,
        location_visibility: settings.location_visibility,
        profile_visibility: settings.profile_visibility
      })
    }
  }, [settings])

  useEffect(() => {
    if (notificationPrefs) {
      setFormNotificationPrefs({
        location_radius: notificationPrefs.location_radius,
        max_budget: notificationPrefs.max_budget,
        min_budget: notificationPrefs.min_budget,
        preferred_purposes: notificationPrefs.preferred_purposes
      })
    }
  }, [notificationPrefs])

  const handleSettingsChange = (field: string, value: any) => {
    setFormSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNotificationPrefsChange = (field: string, value: any) => {
    setFormNotificationPrefs(prev => ({
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

      // Update user settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('user_settings')
        .upsert({
          profile_id: profile.id,
          ...formSettings,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (settingsError) {
        throw settingsError
      }

      // Update notification preferences
      const { data: notificationData, error: notificationError } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...formNotificationPrefs,
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (notificationError) {
        throw notificationError
      }

      // Update context
      setSettings(settingsData)
      setNotificationPrefs(notificationData)
      setSuccess('Settings saved successfully!')

    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
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

      {/* Notification Settings */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Notification Settings
        </h3>
        
        <div className="space-y-4">
          <ToggleSwitch
            label="Email Notifications"
            checked={formSettings.email_notifications}
            onChange={(checked) => handleSettingsChange('email_notifications', checked)}
          />
          
          <ToggleSwitch
            label="Push Notifications"
            checked={formSettings.push_notifications}
            onChange={(checked) => handleSettingsChange('push_notifications', checked)}
          />
          
          <ToggleSwitch
            label="Marketing Emails"
            checked={formSettings.marketing_emails}
            onChange={(checked) => handleSettingsChange('marketing_emails', checked)}
          />
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Privacy Settings
        </h3>
        
        <div className="space-y-4">
          <ToggleSwitch
            label="Location Visibility"
            checked={formSettings.location_visibility}
            onChange={(checked) => handleSettingsChange('location_visibility', checked)}
          />
          
          <ToggleSwitch
            label="Profile Visibility"
            checked={formSettings.profile_visibility}
            onChange={(checked) => handleSettingsChange('profile_visibility', checked)}
          />
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Eye className="w-4 h-4" />
          Notification Preferences
        </h3>
        
        <div className="space-y-4">
          <RangeField
            label="Location Radius (km)"
            value={formNotificationPrefs.location_radius}
            onChange={(value) => handleNotificationPrefsChange('location_radius', parseInt(value))}
            min={5}
            max={100}
            step={5}
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Minimum Budget ($)
              </label>
              <input
                type="number"
                value={formNotificationPrefs.min_budget || ''}
                onChange={(e) => handleNotificationPrefsChange('min_budget', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No minimum"
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all duration-200"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Maximum Budget ($)
              </label>
              <input
                type="number"
                value={formNotificationPrefs.max_budget || ''}
                onChange={(e) => handleNotificationPrefsChange('max_budget', e.target.value ? parseInt(e.target.value) : null)}
                placeholder="No maximum"
                className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all duration-200"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSaveSettings}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg transition-colors duration-200 flex items-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            <>
              <Settings className="w-4 h-4" />
              Save Settings
            </>
          )}
        </button>
      </div>

      {/* Current Settings Display */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Current Settings</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Notifications</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formSettings.email_notifications ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-600 dark:text-gray-400">Email Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formSettings.push_notifications ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-600 dark:text-gray-400">Push Notifications</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formSettings.marketing_emails ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-600 dark:text-gray-400">Marketing Emails</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700 dark:text-gray-300">Privacy</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formSettings.location_visibility ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-600 dark:text-gray-400">Location Visible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${formSettings.profile_visibility ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className="text-gray-600 dark:text-gray-400">Profile Visible</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
