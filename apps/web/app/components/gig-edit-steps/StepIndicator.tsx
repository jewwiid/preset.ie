'use client'

import { Check } from 'lucide-react'

export type GigEditStep = 'basic' | 'schedule' | 'requirements' | 'preferences' | 'moodboard' | 'review'

interface StepIndicatorProps {
  currentStep: GigEditStep
  completedSteps: GigEditStep[]
  onStepClick?: (step: GigEditStep) => void
}

const steps = [
  { key: 'basic' as const, label: 'Basic Details', description: 'Title & Description' },
  { key: 'schedule' as const, label: 'Schedule', description: 'Location & Timing' },
  { key: 'requirements' as const, label: 'Requirements', description: 'Rights & Limits' },
  { key: 'preferences' as const, label: 'Preferences', description: 'Applicant Criteria' },
  { key: 'moodboard' as const, label: 'Moodboard', description: 'Visual Inspiration' },
  { key: 'review' as const, label: 'Review', description: 'Publish Settings' }
]

export default function StepIndicator({ currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm p-4 sm:p-6 mb-6">
      <div className="overflow-x-auto">
        <div className="flex items-center justify-between min-w-full">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.key)
            const isCurrent = step.key === currentStep
            const isPast = index < currentIndex
            
            return (
              <div key={step.key} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center w-full">
                  <div 
                    onClick={() => {
                      if (onStepClick && (isCompleted || isPast)) {
                        onStepClick(step.key)
                      }
                    }}
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                      isCompleted || isPast
                        ? 'bg-primary border-primary text-primary-foreground cursor-pointer hover:bg-primary/90 hover:shadow-md' 
                        : isCurrent
                        ? 'bg-primary/10 border-primary text-primary'
                        : 'bg-background border-border text-muted-foreground'
                    }`}
                  >
                    {isCompleted || isPast ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step Labels */}
                  <div className="text-center mt-1 sm:mt-2 w-full">
                    <div className={`text-xs sm:text-sm font-medium ${
                      isCurrent ? 'text-primary' : 'text-foreground'
                    }`}>
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{step.label.split(' ')[0]}</span>
                    </div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 transition-all ${
                    index < currentIndex ? 'bg-primary' : 'bg-border'
                  }`} />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}