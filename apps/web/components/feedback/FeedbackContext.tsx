'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { Feedback } from './Feedback'

export type FeedbackType = 'success' | 'error' | 'info' | 'warning' | 'notification'

export interface FeedbackAction {
  label: string
  action: () => void
  style?: 'primary' | 'secondary' | 'destructive'
}

export interface FeedbackMessage {
  id: string
  type: FeedbackType
  title: string
  message?: string
  duration?: number
  actions?: FeedbackAction[]
  avatar?: string
  dismissible?: boolean
}

interface FeedbackContextType {
  showFeedback: (feedback: Omit<FeedbackMessage, 'id'>) => void
  removeFeedback: (id: string) => void
}

const FeedbackContext = createContext<FeedbackContextType | undefined>(undefined)

export const useFeedback = () => {
  const context = useContext(FeedbackContext)
  if (!context) {
    throw new Error('useFeedback must be used within a FeedbackProvider')
  }
  return context
}

export function FeedbackProvider({ children }: { children: React.ReactNode }) {
  const [feedbacks, setFeedbacks] = useState<FeedbackMessage[]>([])

  const showFeedback = useCallback((feedback: Omit<FeedbackMessage, 'id'>) => {
    const id = Math.random().toString(36).substring(2)
    const newFeedback: FeedbackMessage = {
      ...feedback,
      id,
      duration: feedback.duration || 5000,
      dismissible: feedback.dismissible !== false}

    setFeedbacks(prev => [...prev, newFeedback])

    // Auto remove after duration
    setTimeout(() => {
      removeFeedback(id)
    }, newFeedback.duration)
  }, [])

  const removeFeedback = useCallback((id: string) => {
    setFeedbacks(prev => prev.filter(feedback => feedback.id !== id))
  }, [])

  return (
    <FeedbackContext.Provider value={{ showFeedback, removeFeedback }}>
      {children}
      {/* Mobile: bottom positioning, Desktop: top-right */}
      <div className="fixed bottom-4 left-4 right-4 sm:top-4 sm:right-4 sm:left-auto sm:bottom-auto z-50 space-y-2">
        {feedbacks.map(feedback => (
          <Feedback
            key={feedback.id}
            {...feedback}
            onClose={() => removeFeedback(feedback.id)}
          />
        ))}
      </div>
    </FeedbackContext.Provider>
  )
}