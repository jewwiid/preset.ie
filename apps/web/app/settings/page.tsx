'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Switch } from '../../components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { useFeedback } from '../../components/feedback/FeedbackContext'
import { supabase } from '../../lib/supabase'

export default function SettingsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { showFeedback } = useFeedback()
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    profile_visibility: 'public',
    show_contact_info: true,
    two_factor_enabled: false
  })
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  })
  const [loadingSettings, setLoadingSettings] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchUserSettings()
    }
  }, [user])

  const fetchUserSettings = async () => {
    if (!user) return

    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      const { data, error } = await supabase!
        .from('user_settings')
        .select('*')
        .eq('profile_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST205') {
          // Table doesn't exist - show message to user
          showFeedback({
            type: 'warning',
            title: 'Setup Required',
            message: 'User settings table needs to be created. Please contact support.'
          })
          console.error('user_settings table does not exist:', error)
          return
        }
        
        if (error.code !== 'PGRST116') {
          console.error('Error fetching settings:', error)
          return
        }
      }

      if (data) {
        setSettings({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          marketing_emails: data.marketing_emails ?? false,
          profile_visibility: data.profile_visibility ?? 'public',
          show_contact_info: data.show_contact_info ?? true,
          two_factor_enabled: data.two_factor_enabled ?? false
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    }
  }

  const updateSettings = async () => {
    if (!user) return

    setLoadingSettings(true)
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        setLoadingSettings(false)
        return
      }

      const { data, error } = await supabase!
        .from('user_settings')
        .upsert({
          profile_id: user.id,
          email_notifications: settings.email_notifications,
          push_notifications: settings.push_notifications,
          marketing_emails: settings.marketing_emails,
          profile_visibility: settings.profile_visibility,
          show_contact_info: settings.show_contact_info,
          two_factor_enabled: settings.two_factor_enabled
        }, {
          onConflict: 'user_id'
        })

      if (error) {
        console.error('Error updating settings:', error)
        
        if (error.code === 'PGRST205') {
          showFeedback({
            type: 'error',
            title: 'Database Setup Required',
            message: 'Settings table is missing. Please contact support to set up the database.'
          })
        } else {
          showFeedback({
            type: 'error',
            title: 'Error',
            message: error.message || 'Failed to update settings'
          })
        }
      } else {
        showFeedback({
          type: 'success',
          title: 'Success',
          message: 'Settings updated successfully'
        })
      }
    } catch (error) {
      console.error('Catch error updating settings:', error)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to update settings'
      })
    } finally {
      setLoadingSettings(false)
    }
  }

  const changePassword = async () => {
    if (passwords.new !== passwords.confirm) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'New passwords do not match'
      })
      return
    }

    if (passwords.new.length < 8) {
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Password must be at least 8 characters long'
      })
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await supabase!.auth.updateUser({
        password: passwords.new
      })

      if (error) {
        console.error('Error changing password:', error)
        showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to change password'
      })
      } else {
        showFeedback({
          type: 'success',
          title: 'Success',
          message: 'Password changed successfully'
        })
        setPasswords({ current: '', new: '', confirm: '' })
      }
    } catch (error) {
      console.error('Error changing password:', error)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to change password'
      })
    } finally {
      setChangingPassword(false)
    }
  }

  const deleteAccount = async () => {
    if (!confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return
    }

    try {
      showFeedback({
        type: 'info',
        title: 'Info',
        message: 'Account deletion will be available soon'
      })
    } catch (error) {
      console.error('Error deleting account:', error)
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to delete account'
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Platform Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account preferences, notifications, and security settings.</p>
      </div>

      <Tabs defaultValue="notifications" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how you want to be notified about activity on Preset.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications" className="text-base">Email notifications</Label>
                  <p className="text-sm text-muted-foreground">Receive emails about gig applications, bookings, and messages.</p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, email_notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-notifications" className="text-base">Push notifications</Label>
                  <p className="text-sm text-muted-foreground">Get notified on your device about important activity.</p>
                </div>
                <Switch
                  id="push-notifications"
                  checked={settings.push_notifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, push_notifications: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="marketing-emails" className="text-base">Marketing emails</Label>
                  <p className="text-sm text-muted-foreground">Receive updates about new features and tips.</p>
                </div>
                <Switch
                  id="marketing-emails"
                  checked={settings.marketing_emails}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, marketing_emails: checked }))}
                />
              </div>

              <Button onClick={updateSettings} disabled={loadingSettings}>
                {loadingSettings ? 'Saving...' : 'Save Notification Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>
                Control how your profile and information is displayed to others.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="profile-visibility" className="text-base">Profile visibility</Label>
                <Select
                  value={settings.profile_visibility}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, profile_visibility: value }))}
                >
                  <SelectTrigger id="profile-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Anyone can see your profile</SelectItem>
                    <SelectItem value="private">Private - Only you can see your profile</SelectItem>
                    <SelectItem value="connections">Connections only - Only people you've worked with</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="show-contact" className="text-base">Show contact information</Label>
                  <p className="text-sm text-muted-foreground">Allow others to see your contact details in your profile.</p>
                </div>
                <Switch
                  id="show-contact"
                  checked={settings.show_contact_info}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, show_contact_info: checked }))}
                />
              </div>

              <Button onClick={updateSettings} disabled={loadingSettings}>
                {loadingSettings ? 'Saving...' : 'Save Privacy Settings'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Password & Security</CardTitle>
              <CardDescription>
                Keep your account secure with a strong password and security features.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                    placeholder="Enter your current password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    placeholder="Enter your new password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    placeholder="Confirm your new password"
                  />
                </div>

                <Button onClick={changePassword} disabled={changingPassword || !passwords.current || !passwords.new}>
                  {changingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
              </div>

              <hr className="my-6" />

              <div className="space-y-4">
                <div className="flex items-center justify-between opacity-50">
                  <div className="space-y-0.5">
                    <Label className="text-base text-muted-foreground">Two-factor authentication</Label>
                    <p className="text-sm text-muted-foreground">Add an extra layer of security to your account.</p>
                  </div>
                  <Button variant="outline" size="sm" disabled className="cursor-not-allowed">
                    Coming Soon
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Management</CardTitle>
              <CardDescription>
                Manage your account settings and data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Account Information</h3>
                  <p className="text-sm text-muted-foreground mb-4">Your account email: {user.email}</p>
                  <p className="text-sm text-muted-foreground">Account created: {new Date(user.created_at).toLocaleDateString()}</p>
                </div>

                <hr className="my-6" />

                <div>
                  <h3 className="text-lg font-medium text-foreground mb-2">Data Export</h3>
                  <p className="text-sm text-muted-foreground mb-4">Download a copy of all your data from Preset.</p>
                  <Button variant="outline">
                    Request Data Export
                  </Button>
                </div>

                <hr className="my-6" />

                <div>
                  <h3 className="text-lg font-medium text-destructive mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" onClick={deleteAccount}>
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
