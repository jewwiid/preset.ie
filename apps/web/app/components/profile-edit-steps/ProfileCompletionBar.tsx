'use client'

import React from 'react'
import { Award, CheckCircle } from 'lucide-react'

interface ProfileCompletionBarProps {
  completionPercentage: number
  missingFieldsCount: number
}

export function ProfileCompletionBar({ completionPercentage, missingFieldsCount }: ProfileCompletionBarProps) {
  const isComplete = completionPercentage === 100

  return (
    <div className="bg-card rounded-lg border border-border p-4 mb-6">
      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
          isComplete ? 'bg-primary' : 'bg-primary/10'
        }`}>
          {isComplete ? (
            <CheckCircle className="w-5 h-5 text-primary-foreground" />
          ) : (
            <Award className="w-5 h-5 text-primary" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Profile Completion
              </h3>
              <p className="text-xs text-muted-foreground">
                {isComplete 
                  ? '🎉 Your profile is complete!' 
                  : `${missingFieldsCount} fields remaining`
                }
              </p>
            </div>
            <span className="text-lg font-bold text-foreground">{completionPercentage}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="h-2 rounded-full transition-all duration-500 bg-primary"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

