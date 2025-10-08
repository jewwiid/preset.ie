'use client'

import { useCompleteProfile } from '../CompleteProfileProvider'
import { Button } from '../../../ui/button'

export function StylesStep() {
  const { setCurrentStep, handleFinalSubmit, loading } = useCompleteProfile()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Define your style
        </h2>
        <p className="text-muted-foreground">
          Choose tags that best describe your creative style
        </p>
      </div>

      <div className="p-8 text-center text-muted-foreground">
        Styles form content will be implemented here...
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('privacy')}
          disabled={loading}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleFinalSubmit}
          disabled={loading}
          className="flex-1"
        >
          {loading ? 'Saving profile...' : 'Complete setup'}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        You can always update these preferences later in your settings
      </p>
    </div>
  )
}
