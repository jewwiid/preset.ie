'use client'

import { Check } from 'lucide-react'

export type GigEditStep = 'basic' | 'schedule' | 'requirements' | 'moodboard' | 'review'

interface StepIndicatorProps {
  currentStep: GigEditStep
  completedSteps: GigEditStep[]
  onStepClick?: (step: GigEditStep) => void
}

const steps = [
  { key: 'basic' as const, label: 'Basic Details', description: 'Title & Description' },
  { key: 'schedule' as const, label: 'Schedule', description: 'Location & Timing' },
  { key: 'requirements' as const, label: 'Requirements', description: 'Rights & Limits' },
  { key: 'moodboard' as const, label: 'Moodboard', description: 'Visual Inspiration' },
  { key: 'review' as const, label: 'Review', description: 'Publish Settings' }
]

export default function StepIndicator({ currentStep, completedSteps, onStepClick }: StepIndicatorProps) {
  const currentIndex = steps.findIndex(s => s.key === currentStep)

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 sm:p-6 mb-6">
      <div className="overflow-x-auto">
        <div className="flex items-center min-w-max sm:min-w-0 sm:justify-between">
          {steps.map((step, index) => {
            const isCompleted = completedSteps.includes(step.key)
            const isCurrent = step.key === currentStep
            const isPast = index < currentIndex
            
            return (
              <div key={step.key} className="flex items-center flex-shrink-0">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <div 
                    onClick={() => {
                      if (onStepClick && (isCompleted || isPast)) {
                        onStepClick(step.key)
                      }
                    }}
                    className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 transition-all ${
                      isCompleted || isPast
                        ? 'bg-emerald-600 border-emerald-600 text-white cursor-pointer hover:bg-emerald-700 hover:shadow-md' 
                        : isCurrent
                        ? 'bg-emerald-100 border-emerald-600 text-emerald-600'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {isCompleted || isPast ? (
                      <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                    ) : (
                      <span className="text-xs sm:text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Step Labels */}
                  <div className="text-center mt-1 sm:mt-2">
                    <div className={`text-xs sm:text-sm font-medium ${
                      isCurrent ? 'text-emerald-600' : 'text-gray-900'
                    }`}>
                      <span className="hidden sm:inline">{step.label}</span>
                      <span className="sm:hidden">{step.label.split(' ')[0]}</span>
                    </div>
                    <div className="text-xs text-gray-500 hidden sm:block">
                      {step.description}
                    </div>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 lg:w-20 h-0.5 mx-1 sm:mx-2 lg:mx-4 transition-all ${
                    index < currentIndex ? 'bg-emerald-600' : 'bg-gray-300'
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