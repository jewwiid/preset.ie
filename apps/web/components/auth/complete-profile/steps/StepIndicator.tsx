'use client'

import { useCompleteProfile } from '../CompleteProfileProvider'
import { Check } from 'lucide-react'

export function StepIndicator() {
  const { selectedRole, currentStep } = useCompleteProfile()

  const getStepsForRole = (role: typeof selectedRole) => {
    const baseSteps = [
      { key: 'role', label: 'Choose Role', stepNumber: 1 },
      { key: 'profile', label: 'Basic Info', stepNumber: 3 },
      { key: 'demographics', label: 'Demographics', stepNumber: 4 }
    ]

    if (role === 'CONTRIBUTOR') {
      return [
        ...baseSteps,
        { key: 'details', label: 'Professional', stepNumber: 5 },
        { key: 'equipment', label: 'Equipment', stepNumber: 6 },
        { key: 'preferences', label: 'Preferences', stepNumber: 7 },
        { key: 'privacy', label: 'Privacy', stepNumber: 8 },
        { key: 'styles', label: 'Style', stepNumber: 9 }
      ]
    } else if (role === 'TALENT') {
      return [
        ...baseSteps,
        { key: 'physical', label: 'Physical', stepNumber: 5 },
        { key: 'categories', label: 'Categories', stepNumber: 6 },
        { key: 'preferences', label: 'Preferences', stepNumber: 7 },
        { key: 'privacy', label: 'Privacy', stepNumber: 8 },
        { key: 'styles', label: 'Style', stepNumber: 9 }
      ]
    } else if (role === 'BOTH') {
      return [
        ...baseSteps,
        { key: 'details', label: 'Professional', stepNumber: 5 },
        { key: 'equipment', label: 'Equipment', stepNumber: 6 },
        { key: 'physical', label: 'Physical', stepNumber: 7 },
        { key: 'categories', label: 'Categories', stepNumber: 8 },
        { key: 'preferences', label: 'Preferences', stepNumber: 9 },
        { key: 'privacy', label: 'Privacy', stepNumber: 10 },
        { key: 'styles', label: 'Style', stepNumber: 11 }
      ]
    }

    // Default fallback
    return [
      ...baseSteps,
      { key: 'details', label: 'Professional', stepNumber: 5 },
      { key: 'preferences', label: 'Preferences', stepNumber: 6 },
      { key: 'privacy', label: 'Privacy', stepNumber: 7 },
      { key: 'styles', label: 'Style', stepNumber: 8 }
    ]
  }

  const steps = getStepsForRole(selectedRole)
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <div className="mb-8">
      {/* Desktop: Full steps indicator */}
      <div className="hidden md:flex items-center justify-center">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              index <= currentIndex 
                ? 'bg-primary border-primary-600 text-primary-foreground' 
                : 'bg-background border-border text-muted-foreground'
            }`}>
              {index < currentIndex ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="text-sm font-medium">{step.stepNumber}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                index < currentIndex ? 'bg-primary' : 'bg-muted-300'
              }`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Mobile: Compact steps indicator */}
      <div className="md:hidden flex items-center justify-center space-x-2">
        {steps.map((step, index) => (
          <div key={step.key} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              index <= currentIndex 
                ? 'bg-primary border-primary-600 text-primary-foreground' 
                : 'bg-background border-border text-muted-foreground'
            }`}>
              {index < currentIndex ? (
                <Check className="w-4 h-4" />
              ) : (
                <span className="text-xs font-medium">{step.stepNumber}</span>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className={`w-8 h-0.5 mx-1 ${
                index < currentIndex ? 'bg-primary' : 'bg-muted-300'
              }`} />
            )}
          </div>
        ))}
      </div>
      
      {/* Current step label */}
      <div className="text-center mt-4">
        <span className="text-sm text-muted-foreground">
          Step {steps[currentIndex]?.stepNumber}: {steps[currentIndex]?.label}
        </span>
      </div>
    </div>
  )
}
