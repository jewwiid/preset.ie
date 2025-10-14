'use client'

import { useCompleteProfile } from '../../../components/auth/complete-profile/CompleteProfileProvider'
import { StepIndicator } from './steps/StepIndicator'
import { RoleStep } from './steps/RoleStep'
import { ProfileStep } from './steps/ProfileStep'
import { DemographicsStep } from './steps/DemographicsStep'
import { DetailsStep } from './steps/DetailsStep'
import { EquipmentStep } from './steps/EquipmentStep'
import { PhysicalStep } from './steps/PhysicalStep'
import { CategoriesStep } from './steps/CategoriesStep'
import { PreferencesStep } from './steps/PreferencesStep'
import { PrivacyStep } from './steps/PrivacyStep'
import { StylesStep } from './steps/StylesStep'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'

export function CompleteProfileLayout() {
  const { currentStep, error } = useCompleteProfile()

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-primary/5 py-6 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Complete your profile
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Tell us about yourself to get started on Preset
          </p>
        </div>

        {/* Step Indicator */}
        <StepIndicator />

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
            {currentStep === 'profile' && <ProfileStep />}
            {currentStep === 'demographics' && <DemographicsStep />}
            {currentStep === 'details' && <DetailsStep />}
            {currentStep === 'equipment' && <EquipmentStep />}
            {currentStep === 'physical' && <PhysicalStep />}
            {currentStep === 'categories' && <CategoriesStep />}
            {currentStep === 'preferences' && <PreferencesStep />}
            {currentStep === 'privacy' && <PrivacyStep />}
            {currentStep === 'styles' && <StylesStep />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
