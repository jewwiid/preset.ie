'use client'

import React, { useEffect, useState } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, Bell, X } from 'lucide-react'
import type { FeedbackMessage } from './FeedbackContext'

interface FeedbackProps extends FeedbackMessage {
  onClose: () => void
}

const feedbackStyles = {
  success: {
    container: 'bg-background/95 backdrop-blur-md border-primary/20/50 shadow-lg shadow-primary-primary/10/50',
    accent: 'border-l-4 border-l-primary-primary',
    icon: CheckCircle,
    iconColor: 'text-primary-500',
    iconBg: 'bg-primary-50'
  },
  error: {
    container: 'bg-background/95 backdrop-blur-md border-destructive-200/50 shadow-lg shadow-destructive-primary/20/50',
    accent: 'border-l-4 border-l-destructive-primary',
    icon: XCircle,
    iconColor: 'text-destructive-500',
    iconBg: 'bg-destructive-50'
  },
  warning: {
    container: 'bg-background/95 backdrop-blur-md border-amber-200/50 shadow-lg shadow-amber-100/50',
    accent: 'border-l-4 border-l-amber-500',
    icon: AlertCircle,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-50'
  },
  info: {
    container: 'bg-background/95 backdrop-blur-md border-primary-200/50 shadow-lg shadow-primary-primary/20/50',
    accent: 'border-l-4 border-l-primary-primary',
    icon: Info,
    iconColor: 'text-primary-500',
    iconBg: 'bg-primary-50'
  },
  notification: {
    container: 'bg-background/95 backdrop-blur-md border-primary-200/50 shadow-lg shadow-primary-primary/20/50',
    accent: 'border-l-4 border-l-primary-primary',
    icon: Bell,
    iconColor: 'text-primary-500',
    iconBg: 'bg-primary-50'
  }
}

export function Feedback({ type, title, message, actions, avatar, dismissible = true, onClose }: FeedbackProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  // Ensure we have a valid type, default to 'info' if undefined or invalid
  const feedbackType = type && feedbackStyles[type] ? type : 'info'
  const style = feedbackStyles[feedbackType]
  const IconComponent = style.icon

  useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 300) // Wait for exit animation
  }

  return (
    <div
      className={`
        w-full max-w-md sm:max-w-sm mx-auto border rounded-xl transition-all duration-300 ease-out transform
        ${style.container} ${style.accent}
        ${isVisible && !isExiting 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-2 opacity-0 scale-95'
        }
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icon or Avatar */}
          <div className="flex-shrink-0">
            {avatar ? (
              <img 
                src={avatar} 
                alt="" 
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className={`p-1.5 rounded-full ${style.iconBg}`}>
                <IconComponent className={`w-4 h-4 ${style.iconColor}`} />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground-900 leading-5">
                  {title}
                </p>
                {message && (
                  <p className="mt-1 text-sm text-muted-foreground-600 leading-5">
                    {message}
                  </p>
                )}
              </div>
              
              {/* Close Button */}
              {dismissible && (
                <button
                  onClick={handleClose}
                  className="flex-shrink-0 p-1 text-muted-foreground-400 hover:text-muted-foreground-600 transition-colors rounded-md hover:bg-muted-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-muted-primary/40"
                >
                  <span className="sr-only">Close</span>
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Action Buttons */}
            {actions && actions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {actions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      action.action()
                      handleClose()
                    }}
                    className={`
                      px-3 py-1.5 text-xs font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2
                      ${action.style === 'primary' 
                        ? 'bg-primary-600 text-primary-foreground hover:bg-primary/90 focus:ring-primary'
                        : action.style === 'destructive'
                        ? 'bg-destructive-600 text-primary-foreground hover:bg-destructive-700 focus:ring-destructive-primary'
                        : 'bg-muted-100 text-muted-foreground-700 hover:bg-muted-200 focus:ring-muted-primary/40'
                      }
                    `}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}