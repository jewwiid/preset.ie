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
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key)
          const isCurrent = step.key === currentStep
          const isPast = index < currentIndex
          
          return (
            <div key={step.key} className="flex items-center">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div 
                  onClick={() => {
                    if (onStepClick && (isCompleted || isPast)) {
                      onStepClick(step.key)
                    }
                  }}
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all ${
                    isCompleted || isPast
                      ? 'bg-emerald-600 border-emerald-600 text-white cursor-pointer hover:bg-emerald-700 hover:shadow-md' 
                      : isCurrent
                      ? 'bg-emerald-100 border-emerald-600 text-emerald-600'
                      : 'bg-white border-gray-300 text-gray-400'
                  }`}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                {/* Step Labels */}
                <div className="text-center mt-2">
                  <div className={`text-sm font-medium ${
                    isCurrent ? 'text-emerald-600' : 'text-gray-900'
                  }`}>
                    {step.label}
                  </div>
                  <div className="text-xs text-gray-500 hidden sm:block">
                    {step.description}
                  </div>
                </div>
              </div>
              
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className={`w-12 sm:w-20 h-0.5 mx-2 sm:mx-4 transition-all ${
                  index < currentIndex ? 'bg-emerald-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}