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
        return `${baseClasses} bg-primary/10 text-primary border border-primary/20`
      case 'error':
        return `${baseClasses} bg-destructive/10 text-destructive border border-destructive/20`
      case 'warning':
        return `${baseClasses} bg-primary/10 text-primary border border-primary/20`
      case 'info':
        return `${baseClasses} bg-primary/10 text-primary border border-primary/20`
      default:
        return `${baseClasses} bg-muted text-muted-foreground border border-border`
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
