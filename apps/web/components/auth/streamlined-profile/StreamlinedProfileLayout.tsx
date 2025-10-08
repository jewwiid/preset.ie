'use client'

import { useStreamlinedProfile } from '../streamlined-profile/StreamlinedProfileProvider'
import { StreamlinedStepIndicator } from './steps/StreamlinedStepIndicator'
import { RoleStep } from './steps/RoleStep'
import { EssentialProfileStep } from './steps/EssentialProfileStep'
import { QuickSetupStep } from './steps/QuickSetupStep'
import { Alert, AlertDescription } from '../../../components/ui/alert'
import { Card, CardContent } from '../../../components/ui/card'
import { AlertCircle } from 'lucide-react'

export function StreamlinedProfileLayout() {
  const { currentStep, error } = useStreamlinedProfile()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Complete your profile
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Just a few quick steps to get you started on Preset
          </p>
        </div>

        {/* Step Indicator */}
        <StreamlinedStepIndicator />

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card className="shadow-xl">
          <CardContent className="p-4 sm:p-6 md:p-8">
            {currentStep === 'role' && <RoleStep />}
            {currentStep === 'profile' && <EssentialProfileStep />}
            {currentStep === 'setup' && <QuickSetupStep />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
