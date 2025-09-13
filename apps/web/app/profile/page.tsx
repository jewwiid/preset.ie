'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, Suspense } from 'react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import CreditsDashboard from '../../components/profile/CreditsDashboard'
import { AvatarUpload } from '../../components/AvatarUpload'
import { HeaderBannerUpload } from '../../components/HeaderBannerUpload'
import { validateAndCheckTag } from '../../lib/contentModeration'
import { 
  User, 
  Camera, 
  MapPin, 
  Briefcase, 
  Star, 
  Edit3, 
  Save, 
  X,
  Mail,
  Calendar,
  Shield,
  CheckCircle,
  Tag,
  Plus,
  Sparkles,
  AlertTriangle,
  CreditCard,
  Settings,
  Bell,
  Eye,
  Lock,
  Globe,
  Users,
  UserX,
  DollarSign,
  Radius,
  Filter,
  Target,
  Palette,
  Hash,
  ArrowLeft,
  TrendingUp,
  Coins,
  History,
  ShoppingCart
} from 'lucide-react'

// Predefined vibe options  
const PREDEFINED_VIBES = [
  'Professional', 'Creative', 'Experimental', 'Classic',
  'Bold', 'Natural', 'Dramatic', 'Soft', 'Edgy', 'Timeless'
]

// Predefined style options
const PREDEFINED_STYLES = [
  'Portrait', 'Fashion', 'Editorial', 'Commercial', 'Beauty',
  'Lifestyle', 'Street', 'Documentary', 'Fine Art', 'Conceptual',
  'Wedding', 'Event', 'Product', 'Architecture', 'Nature'
]

interface UserProfile {
  id: string
  user_id: string
  display_name: string
  handle: string
  avatar_url?: string
  header_banner_url?: string
  header_banner_position?: string // JSON string of BannerPosition
  bio?: string
  city?: string
  role_flags: string[]
  style_tags: string[]
  vibe_tags: string[]
  subscription_tier: string
  subscription_status: string
  verified_id: boolean
  created_at: string
  updated_at: string
}

interface BannerPosition {
  y: number
  scale: number
}

interface UserSettings {
  id: string
  user_id: string
  email_notifications: boolean
  push_notifications: boolean
  marketing_emails: boolean
  profile_visibility: 'public' | 'private'
  show_contact_info: boolean
  two_factor_enabled: boolean
  created_at: string
  updated_at: string
}

interface NotificationPreferences {
  id?: string
  user_id: string
  location_radius: number
  max_budget: number | null
  min_budget: number | null
  preferred_purposes: string[]
  preferred_vibes: string[]
  preferred_styles: string[]
  notify_on_match: boolean
  created_at: string
  updated_at: string
}

// Purpose types from gig creation
type PurposeType = 'PORTFOLIO' | 'COMMERCIAL' | 'EDITORIAL' | 'FASHION' | 'BEAUTY' | 'LIFESTYLE' | 'WEDDING' | 'EVENT' | 'PRODUCT' | 'ARCHITECTURE' | 'STREET' | 'CONCEPTUAL' | 'OTHER'

const PURPOSE_LABELS: Record<PurposeType, string> = {
  'PORTFOLIO': 'Portfolio Building',
  'COMMERCIAL': 'Commercial',
  'EDITORIAL': 'Editorial',
  'FASHION': 'Fashion',
  'BEAUTY': 'Beauty',
  'LIFESTYLE': 'Lifestyle',
  'WEDDING': 'Wedding',
  'EVENT': 'Event',
  'PRODUCT': 'Product',
  'ARCHITECTURE': 'Architecture',
  'STREET': 'Street Photography',
  'CONCEPTUAL': 'Conceptual',
  'OTHER': 'Other'
}


// Settings Tab Component
function UserSettingsTab() {
  const { user } = useAuth()
  const [settings, setSettings] = useState<UserSettings | null>(null)
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dynamicVibes, setDynamicVibes] = useState<string[]>([])
  const [dynamicStyles, setDynamicStyles] = useState<string[]>([])
  const [loadingDynamic, setLoadingDynamic] = useState(false)

  useEffect(() => {
    if (user) {
      fetchSettings()
      fetchDynamicVibesAndStyles()
    }
  }, [user])

  const fetchDynamicVibesAndStyles = async () => {
    setLoadingDynamic(true)
    try {
      // First, try to fetch with the correct status and check if columns exist
      console.log('🔍 Fetching dynamic vibes from gigs...')
      
      const { data: gigsData, error: gigsError } = await supabase
        .from('gigs')
        .select('vibe_tags, style_tags')
        .eq('status', 'PUBLISHED')
        .not('vibe_tags', 'is', null)
        .not('style_tags', 'is', null)

      if (gigsError) {
        console.error('Error fetching dynamic vibes and styles:', JSON.stringify(gigsError, null, 2))
        console.log('Trying fallback approach without column filters...')
        
        // Fallback: try to fetch just basic gig data to see if table is accessible
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('gigs')
          .select('id, title, status')
          .eq('status', 'PUBLISHED')
          .limit(1)
          
        if (fallbackError) {
          console.error('Fallback query also failed:', JSON.stringify(fallbackError, null, 2))
          return
        } else {
          console.log('✅ Gigs table accessible, but vibe_tags/style_tags columns likely missing')
          console.log('Please run the SQL script to add the missing columns')
          return
        }
      }

      // Extract unique vibes and styles
      const uniqueVibes = new Set<string>()
      const uniqueStyles = new Set<string>()

      gigsData?.forEach(gig => {
        if (gig.vibe_tags && Array.isArray(gig.vibe_tags)) {
          gig.vibe_tags.forEach((vibe: string) => {
            if (vibe && vibe.trim()) {
              uniqueVibes.add(vibe.trim().toLowerCase())
            }
          })
        }
        if (gig.style_tags && Array.isArray(gig.style_tags)) {
          gig.style_tags.forEach((style: string) => {
            if (style && style.trim()) {
              uniqueStyles.add(style.trim().toLowerCase())
            }
          })
        }
      })

      // Convert to sorted arrays
      const vibesArray = Array.from(uniqueVibes).sort()
      const stylesArray = Array.from(uniqueStyles).sort()

      setDynamicVibes(vibesArray)
      setDynamicStyles(stylesArray)

      console.log('Dynamic vibes loaded:', vibesArray.length)
      console.log('Dynamic styles loaded:', stylesArray.length)

    } catch (error) {
      console.error('Error fetching dynamic vibes and styles:', error)
    } finally {
      setLoadingDynamic(false)
    }
  }

  const fetchSettings = async () => {
    if (!user) return

    try {
      // Fetch both user settings and notification preferences in parallel
      const [settingsResult, notificationResult] = await Promise.all([
        supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', user.id)
          .single(),
        supabase
          .from('gig_notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle()
      ])

      // Handle user settings
      if (settingsResult.error && settingsResult.error.code !== 'PGRST116') {
        console.error('Error fetching settings:', settingsResult.error)
        setError('Failed to load settings')
      } else if (settingsResult.data) {
        setSettings(settingsResult.data)
      } else {
        // Create default settings if none exist
        const { data: newSettings, error: insertError } = await supabase
          .from('user_settings')
          .insert({
            user_id: user.id,
            email_notifications: true,
            push_notifications: true,
            marketing_emails: false,
            profile_visibility: 'public',
            show_contact_info: true,
            two_factor_enabled: false
          })
          .select()
          .single()

        if (insertError) {
          console.error('Error creating settings:', insertError)
          setError('Failed to create settings')
        } else {
          setSettings(newSettings)
        }
      }

      // Handle notification preferences
      if (notificationResult.error) {
        console.error('Error fetching notification preferences:', notificationResult.error)
        // Don't set error for notification preferences as they're optional
      } else if (notificationResult.data) {
        console.log('Successfully loaded notification preferences:', notificationResult.data)
        setNotificationPrefs(notificationResult.data)
      } else {
        // No records found - create default preferences
        console.log('No notification preferences found, creating defaults...')
        
        const defaultPrefs: Omit<NotificationPreferences, 'id' | 'created_at' | 'updated_at'> = {
          user_id: user.id,
          location_radius: 25, // 25 miles default
          max_budget: null,
          min_budget: null,
          preferred_purposes: [],
          preferred_vibes: [],
          preferred_styles: [],
          notify_on_match: true
        }

        const { data: newPrefs, error: insertError } = await supabase
          .from('gig_notification_preferences')
          .insert(defaultPrefs)
          .select()
          .single()

        if (!insertError && newPrefs) {
          console.log('Successfully created default notification preferences:', newPrefs)
          setNotificationPrefs(newPrefs)
        } else if (insertError) {
          console.error('Error creating default notification preferences:', insertError)
          // If record already exists, try to fetch it
          if (insertError.code === '23505') {
            console.log('Record already exists, trying to fetch existing preferences...')
            const { data: existingPrefs, error: fetchError } = await supabase
              .from('gig_notification_preferences')
              .select('*')
              .eq('user_id', user.id)
              .single()
              
            if (!fetchError && existingPrefs) {
              console.log('Successfully loaded existing notification preferences:', existingPrefs)
              setNotificationPrefs(existingPrefs)
            }
          }
        } else {
          console.log('No error but no preferences created either')
        }
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = async (key: keyof UserSettings, value: any) => {
    if (!user || !settings) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('user_settings')
        .update({ [key]: value })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating setting:', error)
        setError('Failed to update setting')
      } else {
        setSettings({ ...settings, [key]: value })
        setError(null)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to update setting')
    } finally {
      setSaving(false)
    }
  }

  const updateNotificationPreference = async (key: keyof NotificationPreferences, value: any) => {
    if (!user || !notificationPrefs) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('gig_notification_preferences')
        .update({ [key]: value })
        .eq('user_id', user.id)

      if (error) {
        console.error('Error updating notification preference:', error)
        setError('Failed to update notification preference')
      } else {
        setNotificationPrefs({ ...notificationPrefs, [key]: value })
        setError(null)
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to update notification preference')
    } finally {
      setSaving(false)
    }
  }

  const togglePurposePreference = (purpose: string) => {
    if (!notificationPrefs) return
    
    const currentPrefs = notificationPrefs.preferred_purposes || []
    const updatedPrefs = currentPrefs.includes(purpose)
      ? currentPrefs.filter(p => p !== purpose)
      : [...currentPrefs, purpose]
    
    updateNotificationPreference('preferred_purposes', updatedPrefs)
  }

  const toggleVibePreference = (vibe: string) => {
    if (!notificationPrefs) return
    
    const currentPrefs = notificationPrefs.preferred_vibes || []
    const updatedPrefs = currentPrefs.includes(vibe)
      ? currentPrefs.filter(v => v !== vibe)
      : [...currentPrefs, vibe]
    
    updateNotificationPreference('preferred_vibes', updatedPrefs)
  }

  const toggleStylePreference = (style: string) => {
    if (!notificationPrefs) return
    
    const currentPrefs = notificationPrefs.preferred_styles || []
    const updatedPrefs = currentPrefs.includes(style)
      ? currentPrefs.filter(s => s !== style)
      : [...currentPrefs, style]
    
    updateNotificationPreference('preferred_styles', updatedPrefs)
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Settings Not Available</h3>
          <p className="text-gray-600">Unable to load your settings. Please try refreshing the page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Notifications */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Bell className="w-5 h-5 text-emerald-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Notification Preferences</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Email Notifications</h3>
              <p className="text-sm text-gray-500">Receive notifications about gigs, messages, and updates via email</p>
            </div>
            <button
              onClick={() => updateSetting('email_notifications', !settings.email_notifications)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                settings.email_notifications ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.email_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Push Notifications</h3>
              <p className="text-sm text-gray-500">Receive push notifications on your device</p>
            </div>
            <button
              onClick={() => updateSetting('push_notifications', !settings.push_notifications)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                settings.push_notifications ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.push_notifications ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Marketing Emails</h3>
              <p className="text-sm text-gray-500">Receive emails about new features, tips, and promotional content</p>
            </div>
            <button
              onClick={() => updateSetting('marketing_emails', !settings.marketing_emails)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                settings.marketing_emails ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.marketing_emails ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Privacy */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Eye className="w-5 h-5 text-blue-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Privacy Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Profile Visibility</h3>
              <p className="text-sm text-gray-500">Control who can see your profile</p>
            </div>
            <select
              value={settings.profile_visibility}
              onChange={(e) => updateSetting('profile_visibility', e.target.value)}
              disabled={saving}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Show Contact Information</h3>
              <p className="text-sm text-gray-500">Allow others to see your contact details</p>
            </div>
            <button
              onClick={() => updateSetting('show_contact_info', !settings.show_contact_info)}
              disabled={saving}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                settings.show_contact_info ? 'bg-emerald-600' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.show_contact_info ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Security */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Lock className="w-5 h-5 text-red-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Security Settings</h2>
        </div>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
            </div>
            <div className="flex items-center space-x-3">
              <span className={`text-xs font-medium ${settings.two_factor_enabled ? 'text-emerald-600' : 'text-gray-500'}`}>
                {settings.two_factor_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <button
                onClick={() => updateSetting('two_factor_enabled', !settings.two_factor_enabled)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                  settings.two_factor_enabled ? 'bg-emerald-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.two_factor_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Gig Notification Preferences */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center mb-6">
          <Target className="w-5 h-5 text-purple-600 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">Gig Notification Preferences</h2>
        </div>
        <div className="space-y-6">
          <p className="text-sm text-gray-600 mb-4">
            Customize what types of gigs you want to be notified about. Only gigs matching your preferences will trigger notifications.
          </p>
          
          {notificationPrefs ? (
            <>
              {/* Master Toggle */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Smart Gig Notifications</h3>
                  <p className="text-sm text-gray-500">Get notified when gigs match your preferences below</p>
                </div>
                <button
                  onClick={() => updateNotificationPreference('notify_on_match', !notificationPrefs.notify_on_match)}
                  disabled={saving}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                    notificationPrefs.notify_on_match ? 'bg-emerald-600' : 'bg-gray-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notificationPrefs.notify_on_match ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {notificationPrefs.notify_on_match && (
                <>
                  {/* Location Radius */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Location Radius</h3>
                    </div>
                    <div className="flex items-center space-x-4">
                      <input
                        type="range"
                        min="5"
                        max="100"
                        step="5"
                        value={notificationPrefs.location_radius}
                        onChange={(e) => updateNotificationPreference('location_radius', parseInt(e.target.value))}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="text-sm font-medium text-gray-700 min-w-[60px]">
                        {notificationPrefs.location_radius} miles
                      </span>
                    </div>
                  </div>

                  {/* Budget Range */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Budget Range</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Minimum</label>
                        <input
                          type="number"
                          placeholder="No minimum"
                          value={notificationPrefs.min_budget || ''}
                          onChange={(e) => updateNotificationPreference('min_budget', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Maximum</label>
                        <input
                          type="number"
                          placeholder="No maximum"
                          value={notificationPrefs.max_budget || ''}
                          onChange={(e) => updateNotificationPreference('max_budget', e.target.value ? parseInt(e.target.value) : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Preferred Purposes */}
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 text-gray-400 mr-2" />
                      <h3 className="text-sm font-medium text-gray-900">Preferred Gig Types</h3>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(PURPOSE_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          onClick={() => togglePurposePreference(key)}
                          disabled={saving}
                          className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                            notificationPrefs.preferred_purposes?.includes(key)
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                              : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {notificationPrefs.preferred_purposes?.includes(key) && '✓ '}
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500">
                      {notificationPrefs.preferred_purposes?.length || 0} selected • Leave empty to receive all types
                    </p>
                  </div>

                  {/* Preferred Vibes */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Palette className="w-4 h-4 text-gray-400 mr-2" />
                        <h3 className="text-sm font-medium text-gray-900">Preferred Vibes</h3>
                      </div>
                      {loadingDynamic && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      )}
                    </div>
                    
                    {/* Dynamic Vibes from Database */}
                    {dynamicVibes.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                          {dynamicVibes.map(vibe => (
                            <button
                              key={vibe}
                              onClick={() => toggleVibePreference(vibe)}
                              disabled={saving}
                              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                                notificationPrefs.preferred_vibes?.includes(vibe)
                                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {vibe}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          {notificationPrefs.preferred_vibes?.length || 0} selected • {dynamicVibes.length} vibes available from active gigs
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          {loadingDynamic ? 'Loading vibes...' : 'No vibes found in active gigs yet'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Preferred Styles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Hash className="w-4 h-4 text-gray-400 mr-2" />
                        <h3 className="text-sm font-medium text-gray-900">Preferred Styles</h3>
                      </div>
                      {loadingDynamic && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-emerald-500"></div>
                      )}
                    </div>
                    
                    {/* Dynamic Styles from Database */}
                    {dynamicStyles.length > 0 ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-32 overflow-y-auto">
                          {dynamicStyles.map(style => (
                            <button
                              key={style}
                              onClick={() => toggleStylePreference(style)}
                              disabled={saving}
                              className={`px-3 py-2 text-xs rounded-lg border transition-colors ${
                                notificationPrefs.preferred_styles?.includes(style)
                                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                              }`}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          {notificationPrefs.preferred_styles?.length || 0} selected • {dynamicStyles.length} styles available from active gigs
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500">
                          {loadingDynamic ? 'Loading styles...' : 'No styles found in active gigs yet'}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <Filter className="w-8 h-8 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Notification preferences will be available once the database is set up.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ProfilePageContent() {
  const { user, userRole, loading: authLoading } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isDraggingHeader, setIsDraggingHeader] = useState(false)
  const [headerPosition, setHeaderPosition] = useState({ y: 0, scale: 1 })
  const [showHeaderOptions, setShowHeaderOptions] = useState(false)
  const [isHoveringHeader, setIsHoveringHeader] = useState(false)
  const [isEditingHeader, setIsEditingHeader] = useState(false)
  const [stats, setStats] = useState({
    gigsCreated: 0,
    applications: 0,
    showcases: 0,
    profileViews: 0
  })
  const [statsLoading, setStatsLoading] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState<'profile' | 'credits' | 'settings'>('profile')

  // Form state
  const [formData, setFormData] = useState({
    display_name: '',
    handle: '',
    bio: '',
    city: '',
    style_tags: [] as string[],
  })

  const [newStyleTag, setNewStyleTag] = useState('')
  
  // Vibe tags management state
  const [vibeTags, setVibeTags] = useState<string[]>([])
  const [customVibeInput, setCustomVibeInput] = useState('')
  const [showCustomVibeInput, setShowCustomVibeInput] = useState(false)

  // Tag validation state
  const [styleTagError, setStyleTagError] = useState<string | null>(null)
  const [vibeTagError, setVibeTagError] = useState<string | null>(null)
  const [styleTagValidating, setStyleTagValidating] = useState(false)
  const [vibeTagValidating, setVibeTagValidating] = useState(false)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin')
      return
    }

    if (user) {
      fetchProfile()
    }
  }, [user, authLoading, router])

  // Handle URL tab parameter
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'credits' || tab === 'settings') {
      setActiveTab(tab)
    }
  }, [searchParams])

  // Fetch stats when profile is loaded
  useEffect(() => {
    if (profile && user) {
      fetchStats()
    }
  }, [profile, user])

  // Initialize header position from profile data
  useEffect(() => {
    if (profile?.header_banner_position) {
      try {
        const position = JSON.parse(profile.header_banner_position)
        setHeaderPosition(position)
      } catch {
        setHeaderPosition({ y: 0, scale: 1 })
      }
    }
  }, [profile?.header_banner_position])

  // Close header options dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showHeaderOptions) {
        setShowHeaderOptions(false)
      }
    }

    if (showHeaderOptions) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showHeaderOptions])

  // Keyboard support for header positioning
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!profile?.header_banner_url) return
      
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault()
        const step = 10 // pixels to move per keypress
        const newY = event.key === 'ArrowUp' 
          ? headerPosition.y - step 
          : headerPosition.y + step
        
        const newPosition = { ...headerPosition, y: newY }
        setHeaderPosition(newPosition)
        
        // Save position after keyboard adjustment
        if (user) {
          supabase
            .from('users_profile')
            .update({
              header_banner_position: JSON.stringify(newPosition),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.id)
            .then(({ error }) => {
              if (error) console.error('Error updating header position:', error)
            })
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [profile?.header_banner_url, headerPosition, user])

  // Global mouse event handling for drag
  useEffect(() => {
    if (!isDraggingHeader) return

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!profile?.header_banner_url) {
        console.log('❌ No header banner URL in global mouse move')
        return
      }
      
      console.log('🌍 Global mouse move while dragging:', { 
        clientY: e.clientY, 
        isDraggingHeader,
        hasBanner: !!profile.header_banner_url 
      })
      
      // Get the header container bounds
      const headerContainer = document.querySelector('[data-header-container]') as HTMLElement
      if (!headerContainer) {
        console.log('❌ Header container not found')
        return
      }
      
      const rect = headerContainer.getBoundingClientRect()
      const relativeY = e.clientY - rect.top
      const percentage = relativeY / rect.height
      const y = (percentage - 0.5) * 200 // Limit movement to ±200px
      
      console.log('🌍 Global drag update:', { 
        relativeY, 
        percentage, 
        y, 
        rectTop: rect.top,
        rectHeight: rect.height,
        newPosition: { y }
      })
      
      setHeaderPosition(prevPosition => {
        const newPos = { ...prevPosition, y }
        console.log('🔄 Setting new position:', newPos)
        return newPos
      })
    }

    const handleGlobalMouseUp = () => {
      console.log('🌍 Global mouse up - ending drag')
      handleHeaderDragEnd()
    }

    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
    }
  }, [isDraggingHeader, profile?.header_banner_url])

  const fetchProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('users_profile')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          router.push('/auth/create-profile')
          return
        }
        console.error('Error fetching profile:', error)
        setError('Failed to load profile')
      } else {
        setProfile(data)
        setFormData({
          display_name: data.display_name || '',
          handle: data.handle || '',
          bio: data.bio || '',
          city: data.city || '',
          style_tags: data.style_tags || [],
        })
        setVibeTags(data.vibe_tags || [])
      }
    } catch (err) {
      console.error('Error:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user || !profile) return

    console.log('🔄 Starting profile save...')
    console.log('📋 Data to save:', {
      display_name: formData.display_name,
      handle: formData.handle,
      bio: formData.bio,
      city: formData.city,
      style_tags: formData.style_tags,
      vibe_tags: vibeTags,
    })

    setSaving(true)
    setError(null)

    try {
      const { error, data } = await supabase
        .from('users_profile')
        .update({
          display_name: formData.display_name,
          handle: formData.handle,
          bio: formData.bio,
          city: formData.city,
          style_tags: formData.style_tags,
          vibe_tags: vibeTags,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()

      if (error) {
        console.error('❌ Error updating profile:', JSON.stringify(error, null, 2))
        setError(`Failed to update profile: ${error.message}`)
      } else {
        console.log('✅ Profile updated successfully:', data)
        setProfile({
          ...profile,
          ...formData,
          vibe_tags: vibeTags,
          updated_at: new Date().toISOString(),
        })
        setEditing(false)
        console.log('✅ Edit mode disabled, save completed')
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err)
      setError('Failed to update profile - check console for details')
    } finally {
      setSaving(false)
      console.log('🏁 Save process finished')
    }
  }

  const handleCancel = () => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || '',
        handle: profile.handle || '',
        bio: profile.bio || '',
        city: profile.city || '',
        style_tags: profile.style_tags || [],
      })
    }
    setEditing(false)
    setError(null)
  }

  const addStyleTag = async () => {
    const trimmed = newStyleTag.trim()
    if (!trimmed) return

    console.log('🏷️ Adding style tag:', trimmed)

    // Clear any previous errors
    setStyleTagError(null)
    setStyleTagValidating(true)

    try {
      // Check for duplicates in current form data
      if (formData.style_tags.includes(trimmed)) {
        console.log('⚠️ Duplicate style tag detected')
        setStyleTagError('This style already exists in your profile')
        setStyleTagValidating(false)
        return
      }

      console.log('🔍 Validating style tag...')
      // Validate content and check for database duplicates
      const validation = await validateAndCheckTag(trimmed, 'style')
      console.log('✅ Validation result:', validation)
      
      if (!validation.isValid) {
        console.log('❌ Validation failed:', validation.reason)
        setStyleTagError(validation.reason || 'Invalid style tag')
        setStyleTagValidating(false)
        return
      }

      // Add the tag if validation passes
      console.log('✅ Adding style tag to form data')
      setFormData({
        ...formData,
        style_tags: [...formData.style_tags, trimmed],
      })
      setNewStyleTag('')
      setStyleTagError(null)
      console.log('✅ Style tag added successfully')
    } catch (error) {
      console.error('❌ Error validating style tag:', error)
      setStyleTagError('Error validating tag. Please try again.')
    } finally {
      setStyleTagValidating(false)
    }
  }

  const removeStyleTag = (tag: string) => {
    setFormData({
      ...formData,
      style_tags: formData.style_tags.filter(t => t !== tag),
    })
  }

  const toggleStyleTag = (tag: string) => {
    if (formData.style_tags.includes(tag)) {
      removeStyleTag(tag)
    } else {
      setFormData({
        ...formData,
        style_tags: [...formData.style_tags, tag],
      })
    }
  }

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'CONTRIBUTOR': return 'Contributor'
      case 'TALENT': return 'Talent'
      case 'ADMIN': return 'Admin'
      default: return role
    }
  }

  const getSubscriptionDisplayName = (tier: string) => {
    switch (tier) {
      case 'FREE': return 'Free'
      case 'PLUS': return 'Plus'
      case 'PRO': return 'Pro'
      default: return tier
    }
  }

  const handleAvatarUpdate = (newAvatarUrl: string) => {
    // Update the profile state immediately for UI feedback
    if (profile) {
      setProfile({
        ...profile,
        avatar_url: newAvatarUrl
      })
    }
  }

  const handleBannerUpdate = async (newBannerUrl: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('users_profile')
        .update({
          header_banner_url: newBannerUrl,
          header_banner_position: JSON.stringify(headerPosition),
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)

      if (error) throw error

    // Update the profile state immediately for UI feedback
    if (profile) {
      setProfile({
        ...profile,
          header_banner_url: newBannerUrl,
          header_banner_position: JSON.stringify(headerPosition)
        })
      }
    } catch (error) {
      console.error('Error updating banner:', error)
      setError('Failed to update banner')
    }
  }

  const handleHeaderDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!profile?.header_banner_url) {
      console.log('❌ No header banner URL, drag start blocked')
      return
    }
    console.log('🎯 Drag START triggered!', { 
      isDraggingHeader, 
      isEditingHeader,
      hasBanner: !!profile.header_banner_url, 
      eventType: e.type,
      target: e.currentTarget,
      clientY: 'touches' in e ? e.touches[0].clientY : e.clientY,
      currentPosition: headerPosition
    })
    setIsDraggingHeader(true)
    setIsEditingHeader(true) // Set editing mode when drag starts
    console.log('✅ Drag state set to true')
    e.preventDefault()
    e.stopPropagation()
  }

  const handleHeaderDrag = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDraggingHeader || !profile?.header_banner_url) return
    
    e.preventDefault()
    e.stopPropagation()
    
    const rect = e.currentTarget.getBoundingClientRect()
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
    
    // Simple vertical positioning based on mouse position
    const relativeY = clientY - rect.top
    const percentage = relativeY / rect.height
    const y = (percentage - 0.5) * 200 // Limit movement to ±200px
    
    const newPosition = { ...headerPosition, y }
    
    console.log('🔄 Dragging:', { 
      clientY, 
      relativeY, 
      percentage, 
      y, 
      newPosition
    })
    
    setHeaderPosition(newPosition)
  }

  const handleHeaderDragEnd = () => {
    if (!isDraggingHeader) return
    console.log('🏁 Drag END - position updated locally, waiting for save')
    setIsDraggingHeader(false)
    setShowHeaderOptions(false)
    // Don't reset isEditingHeader here - keep it true so "Save Changes" button stays visible
  }

  const handleHeaderUpload = () => {
    // Trigger file input for header upload
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file || !user) return

      setIsEditingHeader(true)
      setSaving(true)
      setError(null)
      setShowHeaderOptions(false)

      try {
        const fileExt = file.name.split('.').pop()
        const fileName = `header-${Date.now()}.${fileExt}`
        const filePath = `${user.id}/${fileName}`

        // Upload to Supabase storage
        console.log('📤 Uploading header banner:', { filePath, fileName, fileSize: file.size })
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars') // Using avatars bucket for header banners
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          })

        if (uploadError) {
          console.error('❌ Upload error:', uploadError)
          throw uploadError
        }

        console.log('✅ Upload successful:', uploadData)

        // Get public URL
        const { data: publicUrlData } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath)

        console.log('🔗 Public URL generated:', publicUrlData?.publicUrl)

        if (publicUrlData?.publicUrl) {
          await handleBannerUpdate(publicUrlData.publicUrl)
        } else {
          throw new Error('Failed to get public URL for uploaded banner')
        }
      } catch (err: any) {
        console.error('❌ Error uploading header banner:', err)
        
        // Provide more specific error messages
        let errorMessage = 'Failed to upload header banner'
        if (err.message?.includes('row-level security')) {
          errorMessage = 'Permission denied. Please try again.'
        } else if (err.message?.includes('Bucket not found')) {
          errorMessage = 'Storage bucket not configured. Please contact support.'
        } else if (err.message?.includes('File too large')) {
          errorMessage = 'File is too large. Please choose a smaller image.'
        } else if (err.message) {
          errorMessage = `Upload failed: ${err.message}`
        }
        
        setError(errorMessage)
      } finally {
        setSaving(false)
        setIsEditingHeader(false)
      }
    }
    input.click()
  }

  const handleRepositionHeader = () => {
    setShowHeaderOptions(false)
    setIsEditingHeader(true)
    // Don't set isDraggingHeader here - only when user actually starts dragging
    console.log('🎯 Reposition mode ready - click and drag to reposition!')
  }

  const fetchStats = async () => {
    if (!user || !profile) return

    setStatsLoading(true)
    try {
      // Fetch gigs created by this user (as contributor)
      const { count: gigsCount } = await supabase
        .from('gigs')
        .select('*', { count: 'exact', head: true })
        .eq('owner_user_id', profile.id)

      // Fetch applications made by this user (as talent)
      const { count: applicationsCount } = await supabase
        .from('applications')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_user_id', profile.id)

      // Fetch showcases where this user is either creator or talent
      const { count: showcasesCount } = await supabase
        .from('showcases')
        .select('*', { count: 'exact', head: true })
        .or(`creator_user_id.eq.${profile.id},talent_user_id.eq.${profile.id}`)
        .eq('visibility', 'PUBLIC')

      setStats({
        gigsCreated: gigsCount || 0,
        applications: applicationsCount || 0,
        showcases: showcasesCount || 0,
        profileViews: 0 // Profile views feature not implemented yet
      })
    } catch (error: any) {
      console.error('Error fetching stats:', error)
      // Keep default stats (0) on error
    } finally {
      setStatsLoading(false)
    }
  }

  // Vibe tags management functions
  const toggleVibeTag = (tag: string) => {
    setVibeTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag].slice(0, 5) // Max 5 vibe tags
    )
  }

  const addCustomVibeTag = async () => {
    const trimmed = customVibeInput.trim()
    if (!trimmed) return

    // Clear any previous errors
    setVibeTagError(null)
    setVibeTagValidating(true)

    try {
      // Check if at max limit
      if (vibeTags.length >= 5) {
        setVibeTagError('Maximum 5 vibe tags allowed')
        setVibeTagValidating(false)
        return
      }

      // Check for duplicates in current vibe tags
      if (vibeTags.includes(trimmed)) {
        setVibeTagError('This vibe already exists in your profile')
        setVibeTagValidating(false)
        return
      }

      // Validate content and check for database duplicates
      const validation = await validateAndCheckTag(trimmed, 'vibe')
      
      if (!validation.isValid) {
        setVibeTagError(validation.reason || 'Invalid vibe tag')
        setVibeTagValidating(false)
        return
      }

      // Add the tag if validation passes
      setVibeTags(prev => [...prev, trimmed])
      setCustomVibeInput('')
      setShowCustomVibeInput(false)
      setVibeTagError(null)
    } catch (error) {
      console.error('Error validating vibe tag:', error)
      setVibeTagError('Error validating tag. Please try again.')
    } finally {
      setVibeTagValidating(false)
    }
  }

  const removeVibeTag = (tag: string) => {
    setVibeTags(prev => prev.filter(t => t !== tag))
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    )
  }

  if (!user || !profile) {
    return null
  }

  const isContributor = userRole?.isContributor || profile.role_flags.includes('CONTRIBUTOR')
  const isTalent = userRole?.isTalent || profile.role_flags.includes('TALENT')
  const isAdmin = userRole?.isAdmin || profile.role_flags.includes('ADMIN')

  const vibeTagsCount = vibeTags.length
  const maxVibeTags = 5

  return (
    <div className="min-h-screen bg-gradient-to-br from-preset-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Header - Dashboard Style */}
        <div className="relative overflow-hidden pb-80">
        {/* Custom Banner Background */}
        {profile.header_banner_url ? (
          <div 
            data-header-container
            className={`absolute inset-0 overflow-hidden bg-gradient-to-r from-gray-200 to-gray-300 ${isDraggingHeader ? 'cursor-grabbing select-none' : 'cursor-grab select-none'}`}
            onClick={() => console.log('🎯 Container clicked!')}
            style={{ userSelect: 'none', zIndex: 10 }}
            onMouseDown={(e) => {
              console.log('🖱️ Mouse down on header container', {
                event: e,
                target: e.target,
                currentTarget: e.currentTarget,
                clientX: e.clientX,
                clientY: e.clientY,
                isEditingHeader,
                isDraggingHeader
              })
              e.preventDefault() // Prevent text selection
              handleHeaderDragStart(e)
            }}
            onMouseUp={(e) => {
              console.log('🖱️ Mouse up on header container')
              e.preventDefault() // Prevent text selection
              handleHeaderDragEnd()
            }}
            onMouseLeave={(e) => {
              console.log('🖱️ Mouse leave header container')
              handleHeaderDragEnd()
              setIsHoveringHeader(false)
            }}
            onMouseEnter={() => {
              console.log('🖱️ Mouse enter header container')
              setIsHoveringHeader(true)
            }}
            onTouchStart={handleHeaderDragStart}
            onTouchMove={handleHeaderDrag}
            onTouchEnd={handleHeaderDragEnd}
            onDragStart={(e) => e.preventDefault()} // Prevent image drag
          >
            <img
              src={profile.header_banner_url}
              alt="Header banner"
              className="w-full h-full object-cover transition-transform duration-300 select-none"
              style={{
                transform: `translateY(${headerPosition.y}px)`,
                pointerEvents: 'none', // Prevent image from interfering with drag events
                userSelect: 'none',
                WebkitUserSelect: 'none',
                MozUserSelect: 'none',
                msUserSelect: 'none'
              }}
              draggable={false}
            />
            {/* Dark overlay gradient - same as dashboard */}
            <div className="absolute inset-0 bg-black/40"></div>
            {/* Drag indicator */}
            {isDraggingHeader && (
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white/90 rounded-lg px-4 py-2 text-sm font-medium text-gray-900">
                  Drag to adjust position
                </div>
              </div>
            )}
            
            
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-preset-500 to-preset-600">
            <div className="absolute inset-0 bg-gradient-to-r from-preset-600/90 to-preset-500/90"></div>
          </div>
        )}
        
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20" style={{ zIndex: 0 }}>
          <div className="absolute inset-0" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}></div>
        </div>
        
        
        <div className="relative z-50 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <div className="flex justify-between items-start">
            <div className="text-white select-none" style={{ userSelect: 'none' }}>
              <div className="flex items-center mb-2">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="mr-4 p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all backdrop-blur-sm border border-white/20"
                >
                  <ArrowLeft className="w-5 h-5 text-white" />
                </button>
                <h1 className="text-4xl md:text-5xl font-bold select-none">Profile Settings</h1>
              </div>
              <p className="text-gray-300 text-lg select-none">Manage your profile, credits, and preferences</p>
            </div>
            
            {/* Action Buttons - Dashboard Style */}
            <div className="flex gap-2">
              {activeTab === 'profile' && !editing && !isEditingHeader && (
                <>
              <button
                onClick={() => setEditing(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl"
              >
                    <Edit3 className="w-4 h-4 mr-2 inline" />
                Edit Profile
              </button>
                  <button
                    onClick={() => setShowHeaderOptions(!showHeaderOptions)}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm border border-white/20 transition-all"
                  >
                    <Camera className="w-4 h-4 mr-2 inline" />
                    {profile.header_banner_url ? 'Edit Header' : 'Add Header'}
                  </button>
                </>
              )}
              {(activeTab === 'profile' && editing) || (activeTab === 'profile' && isEditingHeader) ? (
                <>
                  <button
                    onClick={() => {
                      setEditing(false)
                      setIsEditingHeader(false)
                      setIsDraggingHeader(false)
                      setShowHeaderOptions(false)
                    }}
                    className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-medium backdrop-blur-sm border border-white/20 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={isEditingHeader ? async () => {
                      // Save header position
                      if (profile?.header_banner_url && user) {
                        setSaving(true)
                        try {
                          const { error } = await supabase
                            .from('users_profile')
                            .update({
                              header_banner_position: JSON.stringify(headerPosition),
                              updated_at: new Date().toISOString()
                            })
                            .eq('user_id', user.id)

                          if (error) throw error

                          // Update the profile state
                          if (profile) {
                            setProfile({
                              ...profile,
                              header_banner_position: JSON.stringify(headerPosition)
                            })
                          }
                          
                          console.log('✅ Header position saved:', headerPosition)
                        } catch (error) {
                          console.error('Error updating header position:', error)
                          setError('Failed to save header position')
                        } finally {
                          setSaving(false)
                        }
                      }
                      
                      // Reset editing states
                      setIsEditingHeader(false)
                      setIsDraggingHeader(false)
                      setShowHeaderOptions(false)
                    } : handleSave}
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 inline" />
                        Save Changes
                      </>
                    )}
                  </button>
                </>
              ) : null}
            </div>
          </div>
          </div>

        {/* Header Options Dropdown */}
        {showHeaderOptions && (
          <div className="absolute top-20 right-4 z-50 bg-white rounded-xl shadow-xl border border-gray-200 py-2 min-w-[200px]">
            {profile.header_banner_url ? (
              <>
                <button
                  onClick={handleHeaderUpload}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <Camera className="w-4 h-4 text-gray-500" />
                  Change Header Image
                </button>
                <button
                  onClick={handleRepositionHeader}
                  className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
                >
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                  </svg>
                  Reposition Header
                </button>
              </>
            ) : (
              <button
                onClick={handleHeaderUpload}
                className="w-full px-4 py-3 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-3"
              >
                <Camera className="w-4 h-4 text-gray-500" />
                Upload Header Image
              </button>
            )}
          </div>
        )}
      </div>


      {/* Main Content */}
      <main className="relative -mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
          {/* Tab Navigation - Dashboard Style */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-2 relative z-50">
              <nav className="flex space-x-1">
                {[
                  { id: 'profile', label: 'Profile', icon: User },
                  { id: 'credits', label: 'Credits & Billing', icon: CreditCard },
                  { id: 'settings', label: 'Settings', icon: Settings },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id as any)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium text-sm transition-all ${
                      activeTab === id
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </nav>
        </div>
      </div>

          {/* Tab Content */}
        {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {activeTab === 'credits' && <div className="relative z-50"><CreditsDashboard /></div>}
        
        {activeTab === 'settings' && <div className="relative z-50"><UserSettingsTab /></div>}

        {activeTab === 'profile' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-50">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-xl relative z-50">
                <div className="flex items-center mb-6">
                  <User className="w-5 h-5 text-emerald-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Basic Information</h2>
                </div>

              <div className="space-y-3">
                {/* Avatar and Name in one row */}
                <div className="flex items-start gap-4">
                  <div className="relative">
                    <div className="relative">
                      {profile.avatar_url ? (
                        <img
                          src={profile.avatar_url}
                          alt={profile.display_name}
                          className="w-16 h-16 rounded-full object-cover border-2 border-preset-200 shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-preset-400 to-preset-600 rounded-full flex items-center justify-center border-2 border-preset-200 shadow-lg">
                          <span className="text-white font-bold text-lg">
                            {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                      )}
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 border-2 border-white dark:border-gray-800 rounded-full flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                      </div>
                      
                      {/* Compact upload overlay for editing */}
                      {editing && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              const input = document.createElement('input')
                              input.type = 'file'
                              input.accept = 'image/*'
                              input.onchange = async (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (file) {
                                  // Upload file and get URL
                                  try {
                                    const fileExt = file.name.split('.').pop()
                                    const fileName = `${Date.now()}.${fileExt}`
                                    const filePath = `${user?.id}/${fileName}`
                                    
                                    const { error: uploadError } = await supabase.storage
                                      .from('profile-images')
                                      .upload(filePath, file, {
                                        cacheControl: '3600',
                                        upsert: false
                                      })
                                    
                                    if (uploadError) throw uploadError
                                    
                                    const { data } = supabase.storage
                                      .from('profile-images')
                                      .getPublicUrl(filePath)
                                    
                                    handleAvatarUpdate(data.publicUrl)
                                  } catch (error) {
                                    console.error('Avatar upload error:', error)
                                    alert('Failed to upload avatar. Please try again.')
                                  }
                                }
                              }
                              input.click()
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-full transition-colors"
                          >
                            <Camera className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Name and Handle */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editing ? (
                          <input
                            type="text"
                            value={formData.display_name}
                            onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-lg font-bold"
                            placeholder="Display name"
                          />
                        ) : (
                          profile.display_name
                        )}
                      </h3>
                      <span className="px-2 py-0.5 bg-gradient-to-r from-preset-500 to-preset-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                        {profile.subscription_tier}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                      <span className="text-sm">
                        @{editing ? (
                          <input
                            type="text"
                            value={formData.handle}
                            onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                            className="px-2 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            placeholder="Handle"
                          />
                        ) : (
                          profile.handle
                        )}
                      </span>
                      <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span className="text-xs font-medium">
                          {profile.role_flags?.includes('CONTRIBUTOR') && profile.role_flags?.includes('TALENT') ? 'Contributor & Talent' : 
                           profile.role_flags?.includes('CONTRIBUTOR') ? 'Contributor' : 'Talent'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>


                {/* Bio and Location in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                    {editing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="Tell us about yourself..."
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white">{profile.bio || 'No bio provided'}</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    {editing ? (
                      <input
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        placeholder="City, Country"
                      />
                    ) : (
                      <p className="text-sm text-gray-900 dark:text-white flex items-center">
                        <MapPin className="w-3 h-3 mr-1" />
                        {profile.city || 'No location provided'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Style Tags */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Style Tags</label>
                  {editing ? (
                    <div className="space-y-2">
                      {/* Current Style Tags */}
                      <div className="flex flex-wrap gap-2">
                        {formData.style_tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                          >
                            {tag}
                            <button
                              onClick={() => removeStyleTag(tag)}
                              className="ml-2 text-emerald-600 hover:text-emerald-800"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {formData.style_tags.length === 0 && (
                          <span className="text-sm text-gray-500 italic">No style tags selected</span>
                        )}
                      </div>

                      {/* Predefined Style Tags */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Popular Styles</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {PREDEFINED_STYLES.map((style) => (
                            <button
                              key={style}
                              onClick={() => toggleStyleTag(style)}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                formData.style_tags.includes(style)
                                  ? 'bg-emerald-200 text-emerald-800'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {formData.style_tags.includes(style) ? '✓ Added' : style}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Style Tag Input */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-gray-700">Add Custom Style</h4>
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newStyleTag}
                            onChange={(e) => {
                              setNewStyleTag(e.target.value)
                              if (styleTagError) setStyleTagError(null)
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && addStyleTag()}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            placeholder="Add a custom style tag"
                          />
                          <button
                            onClick={addStyleTag}
                            disabled={styleTagValidating}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                          >
                            {styleTagValidating && (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            )}
                            Add
                          </button>
                        </div>
                        {styleTagError && (
                          <div className="flex items-center text-red-600 text-sm">
                            <AlertTriangle className="w-4 h-4 mr-1" />
                            {styleTagError}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.style_tags.length > 0 ? (
                        profile.style_tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No style tags added</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Vibe Tags */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <div className="flex items-center">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Vibe Tags
                    </div>
                  </label>
                  {editing ? (
                    <div className="space-y-2">
                      {/* Current Vibe Tags */}
                      <div className="flex flex-wrap gap-2">
                        {vibeTags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-teal-100 text-teal-800 border border-teal-200"
                          >
                            {tag}
                            <button
                              onClick={() => removeVibeTag(tag)}
                              className="ml-2 w-4 h-4 rounded-full bg-teal-200 hover:bg-teal-300 flex items-center justify-center"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        {vibeTags.length === 0 && (
                          <span className="text-sm text-gray-500 italic">No vibe tags selected</span>
                        )}
                      </div>

                      {/* Predefined Vibe Tags */}
                      <div>
                        <h4 className="text-xs font-medium text-gray-700 mb-2">Popular Vibes</h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {PREDEFINED_VIBES.map((vibe) => (
                            <button
                              key={vibe}
                              onClick={() => toggleVibeTag(vibe)}
                              disabled={!vibeTags.includes(vibe) && vibeTags.length >= 5}
                              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                                vibeTags.includes(vibe)
                                  ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
                              }`}
                            >
                              {vibeTags.includes(vibe) ? '✓ Added' : vibe}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Vibe Tag Input */}
                      <div>
                        {!showCustomVibeInput ? (
                          <button
                            onClick={() => setShowCustomVibeInput(true)}
                            disabled={vibeTags.length >= 5}
                            className="inline-flex items-center px-3 py-1 text-sm text-teal-600 hover:text-teal-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add Custom Vibe
                          </button>
                        ) : (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={customVibeInput}
                              onChange={(e) => {
                                setCustomVibeInput(e.target.value)
                                if (vibeTagError) setVibeTagError(null)
                              }}
                              onKeyDown={(e) => e.key === 'Enter' && addCustomVibeTag()}
                              placeholder="Enter custom vibe..."
                              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                              autoFocus
                            />
                            <button
                              onClick={addCustomVibeTag}
                              disabled={!customVibeInput.trim() || vibeTagValidating}
                              className="px-3 py-1 bg-teal-600 text-white rounded text-sm hover:bg-teal-700 disabled:bg-gray-300 flex items-center"
                            >
                              {vibeTagValidating && (
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                              )}
                              Add
                            </button>
                            <button
                              onClick={() => {
                                setShowCustomVibeInput(false)
                                setCustomVibeInput('')
                                setVibeTagError(null)
                              }}
                              className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>

                      {vibeTagError && (
                        <div className="flex items-center text-red-600 text-sm">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {vibeTagError}
                        </div>
                      )}

                      <div className="text-xs text-gray-500">
                        {vibeTagsCount} of {maxVibeTags} vibe tags • Save changes when done editing
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(profile.vibe_tags && profile.vibe_tags.length > 0) ? (
                        profile.vibe_tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-teal-100 text-teal-800 border border-teal-200"
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No vibe tags added</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Info */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <Shield className="w-5 h-5 text-blue-600 mr-3" />
                  <h2 className="text-xl font-bold text-gray-900">Account Information</h2>
                </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">Email</span>
                  </div>
                  <span className="text-gray-900">{user.email}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Briefcase className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">Role</span>
                  </div>
                  <div className="flex space-x-2">
                    {profile.role_flags.map((role, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                      >
                        {getRoleDisplayName(role)}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">Subscription</span>
                  </div>
                  <span className="text-gray-900">{getSubscriptionDisplayName(profile.subscription_tier)}</span>
                </div>
                
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 text-gray-400 mr-3" />
                    <span className="text-gray-700">Member since</span>
                  </div>
                  <span className="text-gray-900">
                    {new Date(profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                
                {profile.verified_id && (
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Shield className="w-5 h-5 text-emerald-500 mr-3" />
                      <span className="text-gray-700">Verification</span>
                    </div>
                    <div className="flex items-center text-emerald-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span className="text-sm font-medium">Verified</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
              <div className="bg-white rounded-xl shadow-lg p-6 relative z-50">
                <div className="flex items-center mb-6">
                  <Briefcase className="w-5 h-5 text-emerald-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
                </div>
              <div className="space-y-3">
                {isContributor && (
                  <button
                    onClick={() => router.push('/gigs/create')}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                  >
                      <Plus className="w-4 h-4 mr-2 inline" />
                    Create New Gig
                  </button>
                )}
                {isTalent && (
                  <button
                    onClick={() => router.push('/gigs')}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                  >
                      <Briefcase className="w-4 h-4 mr-2 inline" />
                    Browse Gigs
                  </button>
                )}
                <button
                  onClick={() => router.push('/showcases')}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg"
                >
                    <Star className="w-4 h-4 mr-2 inline" />
                  View Showcases
                </button>
                <button
                  onClick={() => router.push('/settings')}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-all"
                >
                    <Settings className="w-4 h-4 mr-2 inline" />
                  Account Settings
                </button>
              </div>
            </div>

            {/* Stats */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-center mb-6">
                  <TrendingUp className="w-5 h-5 text-green-600 mr-3" />
                  <h3 className="text-xl font-bold text-gray-900">Stats</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Eye className="w-4 h-4 text-gray-500 mr-3" />
                      <span className="text-gray-700 font-medium">Profile views</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                    ) : (
                      stats.profileViews || '-'
                    )}
                  </span>
                </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Briefcase className="w-4 h-4 text-green-500 mr-3" />
                      <span className="text-gray-700 font-medium">Gigs created</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                    ) : (
                      stats.gigsCreated
                    )}
                  </span>
                </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <User className="w-4 h-4 text-blue-500 mr-3" />
                      <span className="text-gray-700 font-medium">Applications</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                    ) : (
                      stats.applications
                    )}
                  </span>
                </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-purple-500 mr-3" />
                      <span className="text-gray-700 font-medium">Showcases</span>
                    </div>
                    <span className="text-2xl font-bold text-gray-900">
                    {statsLoading ? (
                        <div className="animate-pulse bg-gray-200 h-6 w-12 rounded"></div>
                    ) : (
                      stats.showcases
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
          </div>
        )}
          </div>
      </main>
    </div>
  )
}

// Wrapper component with Suspense for useSearchParams
export default function ProfilePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500"></div>
      </div>
    }>
      <ProfilePageContent />
    </Suspense>
  )
}