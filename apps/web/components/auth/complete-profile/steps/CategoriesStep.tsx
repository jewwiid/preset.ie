'use client'

import { useCompleteProfile } from '../CompleteProfileProvider'
import { Button } from '../../../ui/button'

export function CategoriesStep() {
  const { setCurrentStep } = useCompleteProfile()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Work Categories
        </h2>
        <p className="text-muted-foreground">
          Select the types of work you're interested in
        </p>
      </div>

      <div className="p-8 text-center text-muted-foreground">
        Categories form content will be implemented here...
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('physical')}
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
