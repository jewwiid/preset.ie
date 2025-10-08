'use client'

import { useCompleteProfile } from '../CompleteProfileProvider'
import { Button } from '../../../ui/button'

export function EquipmentStep() {
  const { setCurrentStep } = useCompleteProfile()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Equipment & Tools
        </h2>
        <p className="text-muted-foreground">
          Tell us about your professional equipment and software
        </p>
      </div>

      <div className="p-8 text-center text-muted-foreground">
        Equipment form content will be implemented here...
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('details')}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => setCurrentStep('preferences')}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
