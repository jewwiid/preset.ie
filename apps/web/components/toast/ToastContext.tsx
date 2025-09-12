'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Toast } from './Toast'

export type ToastType = 'success' | 'error' | 'info' | 'warning' | 'notification'

export interface ToastAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'destructive'
}

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
  actions?: ToastAction[]
  avatar?: string
  dismissible?: boolean
}

interface ToastContextType {
  showToast: (toast: Omit<ToastMessage, 'id'>) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2)
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration || 5000,
      dismissible: toast.dismissible !== false,
    }

    setToasts(prev => [...prev, newToast])

    // Auto remove after duration
    setTimeout(() => {
      removeToast(id)
    }, newToast.duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      {/* Mobile: bottom positioning, Desktop: top-right */}
      <div className="fixed bottom-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto z-50 space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}