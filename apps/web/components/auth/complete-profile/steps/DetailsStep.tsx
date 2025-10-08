'use client'

import { useCompleteProfile } from '../CompleteProfileProvider'
import { Button } from '../../../ui/button'

export function DetailsStep() {
  const { setCurrentStep, selectedRole } = useCompleteProfile()

  const getNextStep = () => {
    if (selectedRole === 'CONTRIBUTOR') return 'equipment'
    if (selectedRole === 'TALENT') return 'physical'
    if (selectedRole === 'BOTH') return 'equipment'
    return 'preferences'
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Additional Details
        </h2>
        <p className="text-muted-foreground">
          Tell us more about your professional background
        </p>
      </div>

      <div className="p-8 text-center text-muted-foreground">
        Details form content will be implemented here...
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('demographics')}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => setCurrentStep(getNextStep())}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
