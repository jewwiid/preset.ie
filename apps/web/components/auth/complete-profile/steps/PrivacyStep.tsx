'use client'

import { useCompleteProfile } from '../CompleteProfileProvider'
import { Button } from '../../../ui/button'

export function PrivacyStep() {
  const { setCurrentStep } = useCompleteProfile()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Privacy Settings
        </h2>
        <p className="text-muted-foreground">
          Control what information is visible to other users
        </p>
      </div>

      <div className="p-8 text-center text-muted-foreground">
        Privacy settings form content will be implemented here...
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('preferences')}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={() => setCurrentStep('styles')}
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </div>
  )
}
