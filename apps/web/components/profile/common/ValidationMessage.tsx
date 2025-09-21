'use client'

import React from 'react'
import { ValidationMessageProps } from '../types/profile'
import { CheckCircle, AlertTriangle, Info, XCircle } from 'lucide-react'

export function ValidationMessage({
  type,
  message,
  className = ''
}: ValidationMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />
      case 'error':
        return <XCircle className="w-4 h-4" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />
      case 'info':
        return <Info className="w-4 h-4" />
      default:
        return <Info className="w-4 h-4" />
    }
  }

  const getClasses = () => {
    const baseClasses = "flex items-center gap-2 p-3 rounded-lg text-sm font-medium"
    
    switch (type) {
      case 'success':
        return `${baseClasses} bg-primary-50 dark:bg-primary-900/20 text-primary-800 dark:text-primary-200 border border-primary/20 dark:border-primary-800`
      case 'error':
        return `${baseClasses} bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800`
      case 'warning':
        return `${baseClasses} bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 border border-yellow-200 dark:border-yellow-800`
      case 'info':
        return `${baseClasses} bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800`
      default:
        return `${baseClasses} bg-gray-50 dark:bg-gray-900/20 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800`
    }
  }

  return (
    <div className={`${getClasses()} ${className}`}>
      {getIcon()}
      <span>{message}</span>
    </div>
  )
}

// Specialized message components
export function SuccessMessage({ message, className }: { message: string; className?: string }) {
  return <ValidationMessage type="success" message={message} className={className} />
}

export function ErrorMessage({ message, className }: { message: string; className?: string }) {
  return <ValidationMessage type="error" message={message} className={className} />
}

export function WarningMessage({ message, className }: { message: string; className?: string }) {
  return <ValidationMessage type="warning" message={message} className={className} />
}

export function InfoMessage({ message, className }: { message: string; className?: string }) {
  return <ValidationMessage type="info" message={message} className={className} />
}
