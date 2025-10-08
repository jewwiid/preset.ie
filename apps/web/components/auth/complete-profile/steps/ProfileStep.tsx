'use client'

import { useCompleteProfile } from '../CompleteProfileProvider'
import { Button } from '../../../ui/button'

export function ProfileStep() {
  const { handleProfileSubmit, setCurrentStep } = useCompleteProfile()

  return (
    <form onSubmit={handleProfileSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Tell us about yourself
        </h2>
        <p className="text-muted-foreground">
          Add your basic information and profile photo
        </p>
      </div>

      {/* Profile form content would go here */}
      <div className="p-8 text-center text-muted-foreground">
        Profile form content will be implemented here...
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('role')}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="submit"
          className="flex-1"
        >
          Continue
        </Button>
      </div>
    </form>
  )
}
