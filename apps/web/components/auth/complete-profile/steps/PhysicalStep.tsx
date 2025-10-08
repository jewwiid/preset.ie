'use client'

import { useCompleteProfile } from '../CompleteProfileProvider'
import { Button } from '../../../ui/button'

export function PhysicalStep() {
  const { setCurrentStep } = useCompleteProfile()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Physical Attributes
        </h2>
        <p className="text-muted-foreground">
          Tell us about your physical characteristics for casting purposes
        </p>
      </div>

      <div className="p-8 text-center text-muted-foreground">
        Physical attributes form content will be implemented here...
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
          onClick={() => setCurrentStep('categories')}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
