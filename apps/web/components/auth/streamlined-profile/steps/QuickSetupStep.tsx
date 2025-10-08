'use client'

import { useStreamlinedProfile } from '../StreamlinedProfileProvider'
import { usePredefinedOptions, getOptionNames } from '../../../../lib/hooks/use-predefined-options'
import { Button } from '../../../../components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select'
import { Label } from '../../../../components/ui/label'
import { Checkbox } from '../../../../components/ui/checkbox'

export function QuickSetupStep() {
  const { 
    setCurrentStep, 
    handleFinalSubmit, 
    loading,
    selectedRole,
    profileData,
    setProfileData
  } = useStreamlinedProfile()

  const { options: predefinedOptions, loading: optionsLoading } = usePredefinedOptions()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground mb-2">
          Quick Setup
        </h2>
        <p className="text-muted-foreground">
          Just a few quick preferences to get you started
        </p>
      </div>

      {/* Availability Status */}
      <div className="space-y-2">
        <Label htmlFor="availabilityStatus">
          Availability Status
        </Label>
        <Select
          value={profileData.availabilityStatus || 'available'}
          onValueChange={(value) => setProfileData(prev => ({ ...prev, availabilityStatus: value }))}
          disabled={optionsLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select your availability..." />
          </SelectTrigger>
          <SelectContent>
            {getOptionNames(predefinedOptions.availabilityStatuses).map(status => (
              <SelectItem key={status} value={status}>{status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          You can change this anytime in your profile settings
        </p>
      </div>

      {/* Work Preferences */}
      <div className="border-t pt-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Work Preferences</h3>
        
        <div className="space-y-4">
          {/* TFP Acceptance (for Talent) */}
          {(selectedRole === 'TALENT' || selectedRole === 'BOTH') && (
            <div className="space-y-2">
              <Label htmlFor="tfpAcceptance">
                TFP (Trade for Portfolio) Work
              </Label>
              <Select
                value={profileData.tfpAcceptance || 'sometimes'}
                onValueChange={(value) => setProfileData(prev => ({ ...prev, tfpAcceptance: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select TFP preference..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yes">Yes, I accept TFP work</SelectItem>
                  <SelectItem value="sometimes">Sometimes, depends on the project</SelectItem>
                  <SelectItem value="no">No, paid work only</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                TFP work is unpaid but provides portfolio material
              </p>
            </div>
          )}

          {/* Work Type Preferences */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Work Preferences
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prefersStudio"
                  checked={profileData.prefersStudio || false}
                  onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, prefersStudio: !!checked }))}
                />
                <Label htmlFor="prefersStudio" className="text-sm">
                  Prefers Studio Work
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="prefersOutdoor"
                  checked={profileData.prefersOutdoor || false}
                  onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, prefersOutdoor: !!checked }))}
                />
                <Label htmlFor="prefersOutdoor" className="text-sm">
                  Prefers Outdoor Work
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="availableWeekdays"
                  checked={profileData.availableWeekdays !== false}
                  onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, availableWeekdays: !!checked }))}
                />
                <Label htmlFor="availableWeekdays" className="text-sm">
                  Available Weekdays
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="availableWeekends"
                  checked={profileData.availableWeekends || false}
                  onCheckedChange={(checked) => setProfileData(prev => ({ ...prev, availableWeekends: !!checked }))}
                />
                <Label htmlFor="availableWeekends" className="text-sm">
                  Available Weekends
                </Label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Fields Notice */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-2">
          ✨ Complete Your Profile Later
        </h4>
        <p className="text-xs text-muted-foreground">
          You can add more details like equipment, physical attributes, style preferences, 
          and privacy settings anytime in your profile settings. For now, let's get you started!
        </p>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setCurrentStep('profile')}
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
          {loading ? 'Creating Profile...' : 'Complete Setup'}
        </Button>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        You can always update these preferences later in your profile settings
      </p>
    </div>
  )
}
