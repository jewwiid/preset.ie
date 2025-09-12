'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, Check, CheckCheck, X, BellOff, Volume2, VolumeX } from 'lucide-react'
import { useNotifications, type Notification } from '../lib/hooks/useNotifications'

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [isMuted, setIsMuted] = useState(() => {
    // Load mute state from localStorage
    if (typeof window !== 'undefined') {
      return localStorage.getItem('notifications-muted') === 'true'
    }
    return false
  })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    dismiss
  } = useNotifications()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read_at) {
      await markAsRead(notification.id)
    }

    // Navigate to action URL if available
    if (notification.action_url) {
      setIsOpen(false)
      window.location.href = notification.action_url
    }
  }

  const toggleMute = () => {
    const newMutedState = !isMuted
    setIsMuted(newMutedState)
    
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('notifications-muted', newMutedState.toString())
    }
  }

  const getNotificationIcon = (notification: Notification) => {
    // Return appropriate icon based on notification type
    const iconMap = {
      'new_gig_match': '🎯',
      'application_received': '📝',
      'booking_confirmed': '🎉',
      'talent_booked': '⭐',
      'message_received': '💬',
      'system_update': '🔔',
      'credit_low': '💰',
      'profile_viewed': '👀'
    }

    return iconMap[notification.type as keyof typeof iconMap] || '🔔'
  }

  const formatNotificationTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMinutes = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMinutes / 60)
      const diffDays = Math.floor(diffHours / 24)

      if (diffMinutes < 1) return 'Just now'
      if (diffMinutes < 60) return `${diffMinutes}m ago`
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString()
    } catch {
      return 'Recently'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 rounded-md transition-colors ${
          isMuted 
            ? 'text-gray-400 hover:text-gray-500' 
            : 'text-gray-600 hover:text-gray-900'
        }`}
        aria-label={`Notifications ${isMuted ? '(muted)' : ''} ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        {isMuted ? (
          <BellOff className="w-6 h-6" />
        ) : (
          <Bell className="w-6 h-6" />
        )}
        
        {/* Badge - show even when muted but with different style */}
        {unreadCount > 0 && (
          <span className={`absolute -top-1 -right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 rounded-full ${
            isMuted ? 'bg-gray-400' : 'bg-red-500'
          }`}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900">
              Notifications {isMuted && <span className="text-sm text-gray-500">(muted)</span>}
            </h3>
            <div className="flex items-center gap-2">
              {/* Mute Toggle */}
              <button
                onClick={toggleMute}
                className={`flex items-center gap-1 text-sm font-medium transition-colors p-1.5 rounded-md ${
                  isMuted
                    ? 'text-gray-500 hover:text-gray-600 bg-gray-100'
                    : 'text-emerald-600 hover:text-emerald-700'
                }`}
                title={isMuted ? 'Unmute notifications' : 'Mute notifications'}
              >
                {isMuted ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              
              {/* Mark All Read */}
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                >
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8">
                {isMuted ? (
                  <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                ) : (
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                )}
                <p className="text-gray-500">
                  {isMuted ? 'Notifications are muted' : 'No notifications yet'}
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  {isMuted 
                    ? 'Click the sound icon above to unmute notifications'
                    : "You'll see updates about your gigs and applications here"
                  }
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.slice(0, 10).map((notification) => (
                  <div
                    key={notification.id}
                    className={`relative p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                      !notification.read_at ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon/Avatar */}
                      <div className="flex-shrink-0">
                        {notification.avatar_url ? (
                          <img
                            src={notification.avatar_url}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                            {getNotificationIcon(notification)}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 leading-5">
                              {notification.title}
                            </p>
                            {notification.message && (
                              <p className="text-sm text-gray-600 mt-1 leading-5">
                                {notification.message}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">
                              {formatNotificationTime(notification.created_at)}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1">
                            {!notification.read_at && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  markAsRead(notification.id)
                                }}
                                className="p-1 text-gray-400 hover:text-emerald-600 transition-colors"
                                title="Mark as read"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                dismiss(notification.id)
                              }}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Dismiss"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unread indicator */}
                    {!notification.read_at && (
                      <div className="absolute left-2 top-6 w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-gray-100 p-3">
              <button
                onClick={() => {
                  setIsOpen(false)
                  window.location.href = '/notifications'
                }}
                className="w-full text-center text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
              >
                View all notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}