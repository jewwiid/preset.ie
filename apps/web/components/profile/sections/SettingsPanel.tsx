'use client'

import React, { useState, useEffect } from 'react'
import { useProfileSettings, useProfile } from '../context/ProfileContext'
import { ValidationMessage } from '../common/ValidationMessage'
import { Settings, Shield, CheckCircle, ArrowRight } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { Switch } from '../../ui/switch'
import { Label } from '../../ui/label'
import { Button } from '../../ui/button'
import { VerificationBadges } from '../../VerificationBadges'
import { parseVerificationBadges } from '../../../lib/utils/verification-badges'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
export function SettingsPanel() {
  const { user } = useAuth()
  const { profile } = useProfile()
  const { settings, setSettings } = useProfileSettings()
  const router = useRouter()

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Parse verification badges
  const verificationBadges = parseVerificationBadges(
    (profile as any)?.verification_badges || null
  )
  const hasAnyVerification = verificationBadges.identity || verificationBadges.professional || verificationBadges.business

  // Local state for form data (using profile fields, not settings)
  const [formSettings, setFormSettings] = useState({
    show_location: true,
    show_age: true,
    show_physical_attributes: true,
    allow_collaboration_invites: true
  })

  // Load settings from profile when component mounts
  useEffect(() => {
    if (profile) {
      setFormSettings({
        show_location: profile.show_location ?? true,
        show_age: profile.show_age ?? true,
        show_physical_attributes: profile.show_physical_attributes ?? true,
        allow_collaboration_invites: (profile as any).allow_collaboration_invites ?? true
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
          allow_collaboration_invites: formSettings.allow_collaboration_invites,
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

      {/* Verification Section */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h3 className="text-lg font-medium text-foreground mb-2 flex items-center gap-2">
          <Shield className="w-5 h-5 text-primary" />
          Verification
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Build trust and stand out with verified badges
        </p>

        {hasAnyVerification ? (
          <>
            {/* Current Verifications */}
            <div className="space-y-3 mb-4">
              {verificationBadges.identity && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <CheckCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Identity Verified</p>
                    <p className="text-xs text-muted-foreground">Your identity has been confirmed</p>
                  </div>
                </div>
              )}

              {verificationBadges.professional && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <CheckCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Professional Verified</p>
                    <p className="text-xs text-muted-foreground">Your credentials have been confirmed</p>
                  </div>
                </div>
              )}

              {verificationBadges.business && (
                <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20">
                  <CheckCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">Business Verified</p>
                    <p className="text-xs text-muted-foreground">Your business has been confirmed</p>
                  </div>
                </div>
              )}
            </div>

            {/* Add More Verifications */}
            {(!verificationBadges.identity || !verificationBadges.professional || !verificationBadges.business) && (
              <Button
                variant="outline"
                onClick={() => router.push('/verify')}
                className="w-full"
              >
                <Shield className="w-4 h-4 mr-2" />
                Add More Verifications
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </>
        ) : (
          <>
            {/* Get Verified CTA */}
            <div className="space-y-3 mb-4">
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Increase trust with clients and collaborators</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Stand out in search results and listings</span>
              </div>
              <div className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span>Show your professionalism with badges</span>
              </div>
            </div>

            <Button
              onClick={() => router.push('/verify')}
              className="w-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              Get Verified
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </>
        )}
      </div>

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

          <div className="flex items-center justify-between py-3 border-t border-border mt-2 pt-4">
            <div className="space-y-0.5">
              <Label htmlFor="allow-collaboration" className="text-sm font-medium">
                Allow Collaboration Invites
              </Label>
              <p className="text-xs text-muted-foreground">
                Let others invite you to collaborate on projects
              </p>
            </div>
            <Switch
              id="allow-collaboration"
              checked={formSettings.allow_collaboration_invites}
              onCheckedChange={(checked) => handleSettingsChange('allow_collaboration_invites', checked)}
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
            <div className={`w-2 h-2 rounded-full ${formSettings.show_location ? 'bg-primary-500' : 'bg-muted'}`}></div>
            <span className="text-muted-foreground">Location {formSettings.show_location ? 'Visible' : 'Hidden'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${formSettings.show_age ? 'bg-primary-500' : 'bg-muted'}`}></div>
            <span className="text-muted-foreground">Age {formSettings.show_age ? 'Visible' : 'Hidden'}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${formSettings.show_physical_attributes ? 'bg-primary-500' : 'bg-muted'}`}></div>
            <span className="text-muted-foreground">Physical Attributes {formSettings.show_physical_attributes ? 'Visible' : 'Hidden'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
