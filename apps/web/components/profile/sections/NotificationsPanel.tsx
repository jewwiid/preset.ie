'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../lib/auth-context'
import { useNotifications } from '../../../lib/hooks/useNotifications'
import { supabase } from '../../../lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card'
import { Button } from '../../ui/button'
import { Badge } from '../../ui/badge'
import { 
  Bell, 
  BellOff, 
  Mail, 
  Smartphone, 
  Clock, 
  Settings,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  Calendar,
  Volume2,
  VolumeX,
  Vibrate,
  Smartphone as Mobile
} from 'lucide-react'
import { format } from 'date-fns'

interface NotificationPreferences {
  id: string
  user_id: string
  email_enabled: boolean
  push_enabled: boolean
  in_app_enabled: boolean
  gig_notifications: boolean
  application_notifications: boolean
  message_notifications: boolean
  booking_notifications: boolean
  system_notifications: boolean
  marketing_notifications: boolean
  digest_frequency: 'real-time' | 'hourly' | 'daily' | 'weekly'
  quiet_hours_start: string | null
  quiet_hours_end: string | null
  timezone: string
  badge_count_enabled: boolean
  sound_enabled: boolean
  vibration_enabled: boolean
  created_at: string
  updated_at: string
}

export function NotificationsPanel() {
  const { user } = useAuth()
  const { notifications, unreadCount, preferences, loading, markAsRead, markAllAsRead, dismiss, refresh } = useNotifications()
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreferences | null>(null)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'preferences' | 'history'>('preferences')

  // Fetch notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!user || !supabase) return

      try {
        const { data, error } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('user_id', user.id)
          .single()

        if (error && error.code === 'PGRST116') {
          // Create default preferences if none exist
          const defaultPrefs = {
            user_id: user.id,
            email_enabled: true,
            push_enabled: true,
            in_app_enabled: true,
            gig_notifications: true,
            application_notifications: true,
            message_notifications: true,
            booking_notifications: true,
            system_notifications: true,
            marketing_notifications: false,
            digest_frequency: 'real-time' as const,
            timezone: 'UTC',
            badge_count_enabled: true,
            sound_enabled: true,
            vibration_enabled: true
          }

          const { data: newPrefs, error: createError } = await supabase
            .from('notification_preferences')
            .insert(defaultPrefs)
            .select()
            .single()

          if (createError) {
            console.error('Failed to create default preferences:', createError)
            return
          }

          setNotificationPrefs(newPrefs)
        } else if (error) {
          console.error('Failed to fetch preferences:', error)
        } else {
          setNotificationPrefs(data)
        }
      } catch (err) {
        console.error('Error fetching notification preferences:', err)
      }
    }

    fetchPreferences()
  }, [user])

  const updatePreference = async (field: keyof NotificationPreferences, value: any) => {
    if (!user || !supabase || !notificationPrefs) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update({ [field]: value })
        .eq('user_id', user.id)

      if (error) {
        throw new Error(`Failed to update preference: ${error.message}`)
      }

      setNotificationPrefs(prev => prev ? { ...prev, [field]: value } : null)
    } catch (err: any) {
      console.error('Error updating preference:', err)
    } finally {
      setSaving(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'gig_published':
      case 'new_gig_match':
        return <Calendar className="w-4 h-4 text-blue-600" />
      case 'application_received':
      case 'application_viewed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'booking_confirmed':
      case 'talent_booked':
        return <AlertCircle className="w-4 h-4 text-purple-600" />
      case 'message_received':
        return <Bell className="w-4 h-4 text-orange-600" />
      case 'system':
        return <Settings className="w-4 h-4 text-gray-600" />
      default:
        return <Info className="w-4 h-4 text-gray-600" />
    }
  }

  const getNotificationCategory = (category: string) => {
    switch (category) {
      case 'gig': return 'Gig Updates'
      case 'application': return 'Applications'
      case 'booking': return 'Bookings'
      case 'message': return 'Messages'
      case 'system': return 'System'
      default: return 'Other'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-32 bg-gray-200 rounded-lg mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unread Notifications</p>
                <p className="text-2xl font-bold text-blue-700">{unreadCount}</p>
              </div>
              <Bell className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Notifications</p>
                <p className="text-2xl font-bold text-gray-900">{notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In-App Enabled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {notificationPrefs?.in_app_enabled ? 'Yes' : 'No'}
                </p>
              </div>
              {notificationPrefs?.in_app_enabled ? (
                <Bell className="w-8 h-8 text-green-600" />
              ) : (
                <BellOff className="w-8 h-8 text-red-600" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: 'preferences', label: 'Preferences', icon: Settings },
          { id: 'history', label: 'Notification History', icon: Bell },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-md transition-colors ${
              activeTab === id
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'preferences' && (
        <div className="space-y-6">
          {/* Channel Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Notification Channels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-gray-500">Email notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreference('email_enabled', !notificationPrefs?.email_enabled)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationPrefs?.email_enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationPrefs?.email_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Push</p>
                      <p className="text-sm text-gray-500">Browser notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreference('push_enabled', !notificationPrefs?.push_enabled)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationPrefs?.push_enabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationPrefs?.push_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">In-App</p>
                      <p className="text-sm text-gray-500">App notifications</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreference('in_app_enabled', !notificationPrefs?.in_app_enabled)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationPrefs?.in_app_enabled ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationPrefs?.in_app_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Category Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Categories
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { key: 'gig_notifications', label: 'Gig Updates', description: 'New gigs, gig changes' },
                  { key: 'application_notifications', label: 'Applications', description: 'Application status updates' },
                  { key: 'message_notifications', label: 'Messages', description: 'Direct messages' },
                  { key: 'booking_notifications', label: 'Bookings', description: 'Booking confirmations' },
                  { key: 'system_notifications', label: 'System', description: 'Account updates, security' },
                  { key: 'marketing_notifications', label: 'Marketing', description: 'Promotions, updates' },
                ].map(({ key, label, description }) => (
                  <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{label}</p>
                      <p className="text-sm text-gray-500">{description}</p>
                    </div>
                    <button
                      onClick={() => updatePreference(key as keyof NotificationPreferences, !notificationPrefs?.[key as keyof NotificationPreferences])}
                      disabled={saving}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notificationPrefs?.[key as keyof NotificationPreferences] ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notificationPrefs?.[key as keyof NotificationPreferences] ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Mobile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mobile className="w-5 h-5" />
                Mobile Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Badge Count</p>
                      <p className="text-sm text-gray-500">Show unread count</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreference('badge_count_enabled', !notificationPrefs?.badge_count_enabled)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationPrefs?.badge_count_enabled ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationPrefs?.badge_count_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {notificationPrefs?.sound_enabled ? (
                      <Volume2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-600" />
                    )}
                    <div>
                      <p className="font-medium">Sound</p>
                      <p className="text-sm text-gray-500">Notification sounds</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreference('sound_enabled', !notificationPrefs?.sound_enabled)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationPrefs?.sound_enabled ? 'bg-green-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationPrefs?.sound_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Vibrate className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Vibration</p>
                      <p className="text-sm text-gray-500">Device vibration</p>
                    </div>
                  </div>
                  <button
                    onClick={() => updatePreference('vibration_enabled', !notificationPrefs?.vibration_enabled)}
                    disabled={saving}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      notificationPrefs?.vibration_enabled ? 'bg-purple-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        notificationPrefs?.vibration_enabled ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Digest Frequency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Email Digest Frequency
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-600">Choose how often you receive email summaries</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: 'real-time', label: 'Real-time' },
                    { value: 'hourly', label: 'Hourly' },
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => updatePreference('digest_frequency', value)}
                      disabled={saving}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        notificationPrefs?.digest_frequency === value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Actions */}
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Recent Notifications</h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
              >
                Mark All Read
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
              >
                Refresh
              </Button>
            </div>
          </div>

          {/* Notifications List */}
          <Card>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No notifications yet</h3>
                  <p className="text-gray-500">You'll see notifications here when you receive them.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.slice(0, 20).map((notification) => (
                    <div key={notification.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-900">{notification.title}</p>
                              {!notification.read_at && (
                                <Badge variant="default" className="bg-blue-100 text-blue-800 text-xs">
                                  New
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {getNotificationCategory(notification.category)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {format(new Date(notification.created_at), 'MMM d, h:mm a')}
                              </span>
                            </div>
                          </div>
                          {notification.message && (
                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            {!notification.read_at && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-700"
                              >
                                Mark as Read
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => dismiss(notification.id)}
                              className="text-gray-600 hover:text-gray-700"
                            >
                              Dismiss
                            </Button>
                            {notification.action_url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(notification.action_url, '_blank')}
                                className="text-green-600 hover:text-green-700"
                              >
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
