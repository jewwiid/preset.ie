'use client'

import { useCompleteProfile } from '../CompleteProfileProvider'
import { Button } from '../../../ui/button'

export function DemographicsStep() {
  const { setCurrentStep } = useCompleteProfile()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Demographics & Identity
        </h2>
        <p className="text-muted-foreground">
          Help us understand your background and preferences for better matching
        </p>
      </div>

      {/* Demographics content would go here */}
      <div className="p-8 text-center text-muted-foreground">
        Demographics form content will be implemented here...
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('profile')}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => setCurrentStep('details')}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
