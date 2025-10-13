'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { InlinePrivacyToggle } from '@/components/ui/InlinePrivacyToggle'
import { ProfileFormData } from '@/lib/profile-validation'

interface AvailabilityStepProps {
  data: ProfileFormData
  onChange: (data: Partial<ProfileFormData>) => void
  onNext: () => void
  onPrevious?: () => void
  isFirstStep?: boolean
  isLastStep?: boolean
}

const availabilityStatuses = [
  { value: 'available', label: 'Available' },
  { value: 'limited', label: 'Limited Availability' },
  { value: 'busy', label: 'Busy' },
  { value: 'unavailable', label: 'Unavailable' }
]

export default function AvailabilityStep({
  data,
  onChange,
  onNext,
  onPrevious,
  isFirstStep = false,
  isLastStep = false
}: AvailabilityStepProps) {

  const handleFieldChange = (field: keyof ProfileFormData, value: any) => {
    onChange({ [field]: value })
  }

  const handleNext = () => {
    onNext()
  }

  return (
    <div className="space-y-6">
      {/* Availability Status */}
      <Card>
        <CardHeader>
          <CardTitle>Availability Status</CardTitle>
          <CardDescription>
            Let others know your current availability
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label htmlFor="availability_status">Current Status</Label>
              <Select
                value={data.availability_status || 'available'}
                onValueChange={(value) => handleFieldChange('availability_status', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select availability status" />
                </SelectTrigger>
                <SelectContent>
                  {availabilityStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <InlinePrivacyToggle
              checked={data.show_availability ?? true}
              onChange={(checked) => handleFieldChange('show_availability', checked)}
              label="Show availability"
              className="ml-4"
            />
          </div>
        </CardContent>
      </Card>

      {/* Rates */}
      <Card>
        <CardHeader>
          <CardTitle>Rates & Pricing</CardTitle>
          <CardDescription>
            Set your hourly rates (optional)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Hourly Rates */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <Label>Hourly Rates (EUR)</Label>
              <div className="grid grid-cols-2 gap-4 mt-1">
                <div>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.hourly_rate_min || ''}
                    onChange={(e) => handleFieldChange('hourly_rate_min', parseFloat(e.target.value) || undefined)}
                    placeholder="50"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Minimum rate</p>
                </div>
                <div>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={data.hourly_rate_max || ''}
                    onChange={(e) => handleFieldChange('hourly_rate_max', parseFloat(e.target.value) || undefined)}
                    placeholder="150"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Maximum rate</p>
                </div>
              </div>
            </div>
            <InlinePrivacyToggle
              checked={data.show_rates ?? false}
              onChange={(checked) => handleFieldChange('show_rates', checked)}
              label="Show rates"
              className="ml-4"
            />
          </div>

          {/* Compensation Preferences */}
          <div className="space-y-4">
            <Label>Compensation Preferences</Label>
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="accepts_tfp"
                  checked={data.accepts_tfp ?? false}
                  onChange={(e) => handleFieldChange('accepts_tfp', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="accepts_tfp" className="text-sm font-normal">
                  Accept TFP (Trade for Portfolio) collaborations
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="accepts_expenses_only"
                  checked={data.accepts_expenses_only ?? false}
                  onChange={(e) => handleFieldChange('accepts_expenses_only', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="accepts_expenses_only" className="text-sm font-normal">
                  Accept expenses-only compensation
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="allow_direct_booking"
                  checked={data.allow_direct_booking ?? true}
                  onChange={(e) => handleFieldChange('allow_direct_booking', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="allow_direct_booking" className="text-sm font-normal">
                  Allow direct booking requests
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Travel & Location */}
      <Card>
        <CardHeader>
          <CardTitle>Travel & Location</CardTitle>
          <CardDescription>
            Your travel preferences and studio information
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Travel Availability */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="available_for_travel"
                checked={data.available_for_travel ?? false}
                onChange={(e) => handleFieldChange('available_for_travel', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="available_for_travel" className="text-sm font-normal">
                Available for travel
              </Label>
            </div>
            
            {data.available_for_travel && (
              <div>
                <Label htmlFor="travel_radius_km">Travel Radius (km)</Label>
                <Input
                  id="travel_radius_km"
                  type="number"
                  min="0"
                  max="10000"
                  value={data.travel_radius_km || ''}
                  onChange={(e) => handleFieldChange('travel_radius_km', parseInt(e.target.value) || undefined)}
                  placeholder="50"
                  className="mt-1"
                />
              </div>
            )}
          </div>

          {/* Studio Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="has_studio"
                checked={data.has_studio ?? false}
                onChange={(e) => handleFieldChange('has_studio', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="has_studio" className="text-sm font-normal">
                Have a studio/workspace
              </Label>
            </div>
            
            {data.has_studio && (
              <div>
                <Label htmlFor="studio_name">Studio Name</Label>
                <Input
                  id="studio_name"
                  value={data.studio_name || ''}
                  onChange={(e) => handleFieldChange('studio_name', e.target.value)}
                  placeholder="Your Studio Name"
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Work Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Work Schedule Preferences</CardTitle>
          <CardDescription>
            When are you typically available for work?
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="available_weekdays"
                checked={data.available_weekdays ?? true}
                onChange={(e) => handleFieldChange('available_weekdays', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="available_weekdays" className="text-sm font-normal">
                Weekdays
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="available_weekends"
                checked={data.available_weekends ?? false}
                onChange={(e) => handleFieldChange('available_weekends', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="available_weekends" className="text-sm font-normal">
                Weekends
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="available_evenings"
                checked={data.available_evenings ?? false}
                onChange={(e) => handleFieldChange('available_evenings', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="available_evenings" className="text-sm font-normal">
                Evenings
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="available_overnight"
                checked={data.available_overnight ?? false}
                onChange={(e) => handleFieldChange('available_overnight', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="available_overnight" className="text-sm font-normal">
                Overnight
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div>
          {!isFirstStep && onPrevious && (
            <Button variant="outline" onClick={onPrevious}>
              Previous
            </Button>
          )}
        </div>
        <div>
          <Button onClick={handleNext}>
            {isLastStep ? 'Save Changes' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  )
}
