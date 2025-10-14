'use client'

import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useState } from 'react'
import { format } from 'date-fns'

interface LocationScheduleStepProps {
  location: string
  city?: string
  country?: string
  startDate: string
  endDate: string
  applicationDeadline: string
  onLocationChange: (value: string) => void
  onCityChange?: (value: string) => void
  onCountryChange?: (value: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onApplicationDeadlineChange: (value: string) => void
  onNext: () => void
  onBack: () => void
  isValid: boolean
  validationErrors?: string[]
}

// Countries list
const COUNTRIES = [
  'Ireland',
  'United Kingdom',
  'United States',
  'Canada',
  'Australia',
  'New Zealand',
  'France',
  'Germany',
  'Spain',
  'Italy',
  'Netherlands',
  'Belgium',
  'Switzerland',
  'Austria',
  'Portugal',
  'Denmark',
  'Sweden',
  'Norway',
  'Finland',
  'Poland',
  'Czech Republic',
  'Greece',
  'Japan',
  'South Korea',
  'Singapore',
  'United Arab Emirates',
  'India',
  'Mexico',
  'Brazil',
  'Argentina'
].sort()

export default function LocationScheduleStep({
  location,
  city,
  country,
  startDate,
  endDate,
  applicationDeadline,
  onLocationChange,
  onCityChange,
  onCountryChange,
  onStartDateChange,
  onEndDateChange,
  onApplicationDeadlineChange,
  onNext,
  onBack,
  isValid,
  validationErrors = []
}: LocationScheduleStepProps) {
  // Removed date picker open states since we're using simple HTML date inputs

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onNext()
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm relative overflow-visible">
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-foreground">Schedule & Location</h2>
            <p className="text-muted-foreground text-sm">When and where will the shoot take place?</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6 overflow-visible">

        {/* Location - City and Country */}
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Shoot Location <span className="text-destructive">*</span>
            </div>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* City Input */}
            <div>
              <Label htmlFor="city" className="text-xs text-muted-foreground mb-1">
                City
              </Label>
              <Input
                type="text"
                id="city"
                required
                value={city || ''}
                onChange={(e) => {
                  if (onCityChange) {
                    onCityChange(e.target.value)
                  }
                  // Also update combined location for backward compatibility
                  if (country) {
                    onLocationChange(`${e.target.value}, ${country}`)
                  }
                }}
                placeholder="e.g., Galway, Dublin, London..."
                className="w-full"
              />
            </div>
            
            {/* Country Select */}
            <div>
              <Label htmlFor="country" className="text-xs text-muted-foreground mb-1">
                Country
              </Label>
              <Select
                value={country}
                onValueChange={(value) => {
                  // Update country value
                  if (onCountryChange) {
                    onCountryChange(value)
                  }
                  // Also update combined location for backward compatibility
                  const newLocation = city ? `${city}, ${value}` : `, ${value}`
                  onLocationChange(newLocation)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country..." />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            💡 Specify the city and country to help talent find and filter gigs in their area
          </p>
        </div>

        {/* Schedule Section - Simplified with Shadcn Date Pickers */}
        <div>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4" />
            Shoot Schedule
          </h3>
          
          {/* Start Date/Time */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium text-foreground mb-2">
                Start Date/Time <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date Input - Simple HTML */}
                <Input
                  type="date"
                  value={startDate ? startDate.split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value
                    if (date) {
                      const time = startDate ? startDate.split('T')[1] || '14:00' : '14:00'
                      onStartDateChange(`${date}T${time}`)
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />

                {/* Time Input - Simple */}
                <Input
                  type="time"
                  value={startDate ? startDate.split('T')[1]?.substring(0, 5) || '' : ''}
                  onChange={(e) => {
                    const date = startDate ? startDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd')
                    onStartDateChange(`${date}T${e.target.value}:00`)
                  }}
                  placeholder="14:00"
                  className="w-full"
                />
              </div>
            </div>

            {/* End Date/Time */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2">
                End Date/Time <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date Input - Simple HTML */}
                <Input
                  type="date"
                  value={endDate ? endDate.split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value
                    if (date) {
                      const time = endDate ? endDate.split('T')[1] || '18:00' : '18:00'
                      onEndDateChange(`${date}T${time}`)
                    }
                  }}
                  min={startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0]}
                  className="w-full"
                />

                {/* Time Input - Simple */}
                <Input
                  type="time"
                  value={endDate ? endDate.split('T')[1]?.substring(0, 5) || '' : ''}
                  onChange={(e) => {
                    const date = endDate ? endDate.split('T')[0] : (startDate ? startDate.split('T')[0] : format(new Date(), 'yyyy-MM-dd'))
                    onEndDateChange(`${date}T${e.target.value}:00`)
                  }}
                  placeholder="18:00"
                  className="w-full"
                />
              </div>
            </div>

            {/* Application Deadline */}
            <div>
              <Label className="text-sm font-medium text-foreground mb-2">
                Application Deadline <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Date Input - Simple HTML */}
                <Input
                  type="date"
                  value={applicationDeadline ? applicationDeadline.split('T')[0] : ''}
                  onChange={(e) => {
                    const date = e.target.value
                    if (date) {
                      const time = applicationDeadline ? applicationDeadline.split('T')[1] || '23:59' : '23:59'
                      onApplicationDeadlineChange(`${date}T${time}`)
                    }
                  }}
                  min={new Date().toISOString().split('T')[0]}
                  max={startDate ? startDate.split('T')[0] : new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]}
                  className="w-full"
                />

                {/* Time Input - Simple */}
                <Input
                  type="time"
                  value={applicationDeadline ? applicationDeadline.split('T')[1]?.substring(0, 5) || '' : ''}
                  onChange={(e) => {
                    const date = applicationDeadline ? applicationDeadline.split('T')[0] : format(new Date(), 'yyyy-MM-dd')
                    onApplicationDeadlineChange(`${date}T${e.target.value}:00`)
                  }}
                  placeholder="23:59"
                  className="w-full"
                />
              </div>
              {/* Deadline warning */}
              {applicationDeadline && startDate && (() => {
                try {
                  const deadline = new Date(applicationDeadline)
                  const shootStart = new Date(startDate)
                  
                  if (isNaN(deadline.getTime()) || isNaN(shootStart.getTime())) {
                    return null
                  }
                  
                  const timeDiff = shootStart.getTime() - deadline.getTime()
                  const hoursDiff = timeDiff / (1000 * 60 * 60)
                  
                  if (hoursDiff < 24 && hoursDiff > 0) {
                    const hoursRounded = Math.round(hoursDiff * 10) / 10
                    return (
                      <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Only {hoursRounded} hours before shoot - Consider allowing at least 24 hours
                      </p>
                    )
                  } else if (hoursDiff <= 0) {
                    return (
                      <p className="mt-2 text-xs text-destructive">
                        ⚠️ Deadline must be before the shoot starts
                      </p>
                    )
                  }
                  return null
                } catch (error) {
                  return null
                }
              })()}
            </div>
          </div>
        </div>

        {/* Validation Errors - Above continue button */}
        {validationErrors.length > 0 && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <div className="flex flex-wrap items-center gap-2 text-sm text-destructive">
              <span className="font-medium">Please fix the following:</span>
              {validationErrors.map((error, index) => (
                <span key={index} className="text-destructive/80">
                  {index > 0 && " • "} {error}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            size="lg"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Details
          </Button>
          
          <Button
            type="submit"
            disabled={!isValid}
            size="lg"
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            Continue to Requirements
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}