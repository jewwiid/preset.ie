'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '../../lib/auth-context'
import { Bell, CheckCircle, X, ExternalLink, Palette, Users, Shield, RefreshCw } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { ScrollArea } from '../../components/ui/scroll-area'
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface Notification {
  id: string
  preset_id: string
  preset_name: string
  notification_type: string
  title: string
  message: string
  data: any
  is_read: boolean
  created_at: string
  read_at: string | null
}

interface NotificationsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export default function NotificationsPanel({ isOpen, onClose }: NotificationsPanelProps) {
  const { user, session } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    if (!user || !session) return

    setLoading(true)
    try {
      const response = await fetch('/api/notifications?limit=50', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    if (!user || !session) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          notificationId,
          isRead: true
        })
      })

      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => 
            n.id === notificationId 
              ? { ...n, is_read: true, read_at: new Date().toISOString() }
              : n
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'preset_used':
        return <Palette className="h-4 w-4 text-primary-500" />
      case 'sample_created':
        return <CheckCircle className="h-4 w-4 text-primary-500" />
      case 'verification_requested':
        return <Shield className="h-4 w-4 text-primary-500" />
      default:
        return <Bell className="h-4 w-4 text-muted-foreground-500" />
    }
  }

  const getNotificationAction = (notification: Notification) => {
    switch (notification.notification_type) {
      case 'preset_used':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              markAsRead(notification.id)
              window.open(`/presets/${notification.preset_id}`, '_blank')
            }}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Preset
          </Button>
        )
      case 'sample_created':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              markAsRead(notification.id)
              window.open(`/presets/${notification.preset_id}#samples`, '_blank')
            }}
            className="text-xs"
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            View Samples
          </Button>
        )
      default:
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => markAsRead(notification.id)}
            className="text-xs"
          >
            Mark Read
          </Button>
        )
    }
  }

  useEffect(() => {
    if (isOpen && user) {
      fetchNotifications()
    }
  }, [isOpen, user])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[80vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-2">
            <Bell className="h-5 w-5" />
            <CardTitle>Notifications</CardTitle>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchNotifications}
              disabled={loading}
              title="Refresh notifications"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No notifications yet</p>
              <p className="text-sm mt-1">You'll be notified when your presets are used!</p>
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border ${
                      notification.is_read 
                        ? 'bg-muted/50 border-muted' 
                        : 'bg-background border-border shadow-sm'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        {getNotificationIcon(notification.notification_type)}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-sm truncate">
                              {notification.title}
                            </h4>
                            {!notification.is_read && (
                              <div className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                            <span className="font-medium">{notification.preset_name}</span>
                            <span>•</span>
                            <span>{new Date(notification.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        {getNotificationAction(notification)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

