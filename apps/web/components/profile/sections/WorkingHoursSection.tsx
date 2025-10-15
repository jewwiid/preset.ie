'use client'

import React, { useState, useEffect } from 'react'
import { Clock, Edit3, Save, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface WorkingTimeOption {
  value: string
  label: string
  start_time?: string
  end_time?: string
  description?: string
  sort_order: number
}

interface TimezoneOption {
  value: string
  label: string
  utc_offset: string
  description?: string
  sort_order: number
}

interface WorkingHoursData {
  working_time_preference?: string
  preferred_start_time?: string
  preferred_end_time?: string
  working_timezone?: string
}

interface WorkingHoursSectionProps {
  profile?: WorkingHoursData
  isEditing: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  onFieldChange: (field: string, value: any) => void
  formData?: WorkingHoursData
}

// Working time options and timezones will be fetched from database

export default function WorkingHoursSection({
  profile,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onFieldChange,
  formData
}: WorkingHoursSectionProps) {
  const [showCustomTimes, setShowCustomTimes] = useState(false)
  const [workingTimeOptions, setWorkingTimeOptions] = useState<WorkingTimeOption[]>([])
  const [timezoneOptions, setTimezoneOptions] = useState<TimezoneOption[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch working time options and timezones from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch both working time preferences and timezones in parallel
        const [workingTimeResponse, timezonesResponse] = await Promise.all([
          fetch('/api/working-time-preferences'),
          fetch('/api/timezones')
        ])
        
        // Handle working time preferences
        if (workingTimeResponse.ok) {
          const { data } = await workingTimeResponse.json()
          setWorkingTimeOptions(data || [])
        } else {
          console.error('Failed to fetch working time preferences')
          setWorkingTimeOptions([
            { value: 'flexible', label: 'Flexible - Any time', sort_order: 1 },
            { value: 'custom', label: 'Custom Hours', sort_order: 7 }
          ])
        }
        
        // Handle timezones
        if (timezonesResponse.ok) {
          const { data } = await timezonesResponse.json()
          setTimezoneOptions(data || [])
        } else {
          console.error('Failed to fetch timezones')
          setTimezoneOptions([
            { value: 'UTC', label: 'UTC (Coordinated Universal Time)', utc_offset: '+00:00', sort_order: 1 },
            { value: 'EST', label: 'EST (Eastern Standard Time)', utc_offset: '-05:00', sort_order: 2 }
          ])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        // Fallback to hardcoded options if fetch fails
        setWorkingTimeOptions([
          { value: 'flexible', label: 'Flexible - Any time', sort_order: 1 },
          { value: 'custom', label: 'Custom Hours', sort_order: 7 }
        ])
        setTimezoneOptions([
          { value: 'UTC', label: 'UTC (Coordinated Universal Time)', utc_offset: '+00:00', sort_order: 1 },
          { value: 'EST', label: 'EST (Eastern Standard Time)', utc_offset: '-05:00', sort_order: 2 }
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    // Show custom times if preference is custom or if custom times are set
    const currentPreference = isEditing ? formData?.working_time_preference : profile?.working_time_preference
    const hasCustomTimes = Boolean((isEditing ? formData?.preferred_start_time : profile?.preferred_start_time) || 
                           (isEditing ? formData?.preferred_end_time : profile?.preferred_end_time))
    
    setShowCustomTimes(currentPreference === 'custom' || hasCustomTimes)
  }, [isEditing, formData?.working_time_preference, profile?.working_time_preference, formData?.preferred_start_time, formData?.preferred_end_time, profile?.preferred_start_time, profile?.preferred_end_time])

  const handlePreferenceChange = (value: string) => {
    onFieldChange('working_time_preference', value)
    
    // Find the selected option to get its default times
    const selectedOption = workingTimeOptions.find(option => option.value === value)
    
    if (selectedOption?.start_time && selectedOption?.end_time) {
      // Auto-fill times based on preference from database
      onFieldChange('preferred_start_time', selectedOption.start_time)
      onFieldChange('preferred_end_time', selectedOption.end_time)
    } else if (value !== 'custom') {
      // Clear times for flexible/weekends options
      onFieldChange('preferred_start_time', '')
      onFieldChange('preferred_end_time', '')
    }
    
    setShowCustomTimes(value === 'custom')
  }

  const formatWorkingHours = () => {
    const preference = isEditing ? formData?.working_time_preference : profile?.working_time_preference
    const startTime = isEditing ? formData?.preferred_start_time : profile?.preferred_start_time
    const endTime = isEditing ? formData?.preferred_end_time : profile?.preferred_end_time
    const timezone = isEditing ? formData?.working_timezone : profile?.working_timezone

    if (preference === 'flexible') {
      return 'Flexible - Any time'
    } else if (preference === 'weekends_only') {
      return 'Weekends Only'
    } else if (startTime && endTime) {
      const formatTime = (time: string) => {
        const [hours, minutes] = time.split(':')
        const hour = parseInt(hours)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
        return `${displayHour}:${minutes} ${ampm}`
      }
      
      return `${formatTime(startTime)} - ${formatTime(endTime)} ${timezone ? `(${timezone})` : ''}`
    } else {
      return workingTimeOptions.find(opt => opt.value === preference)?.label || 'Not specified'
    }
  }

  return (
    <div className="bg-card rounded-lg border p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium text-foreground">Preferred Working Hours</h3>
        </div>
        
        {!isEditing ? (
          <Button variant="ghost" size="sm" onClick={onEdit} className="text-muted-foreground hover:text-foreground">
            <Edit3 className="h-4 w-4 mr-1" />
            Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button size="sm" onClick={onSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        )}
      </div>

      {!isEditing ? (
        // Display mode
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
            <span className="text-foreground font-medium">{formatWorkingHours()}</span>
          </div>
          
          {(profile?.working_timezone) && (
            <div className="text-sm text-muted-foreground">
              Timezone: {profile.working_timezone}
            </div>
          )}
        </div>
      ) : (
        // Edit mode
        <div className="space-y-6">
          {/* Working Time Preference */}
          <div>
            <Label htmlFor="working_time_preference" className="text-sm font-medium">
              Working Time Preference
            </Label>
            <Select
              value={formData?.working_time_preference || ''}
              onValueChange={handlePreferenceChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your preferred working hours" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading" disabled>Loading options...</SelectItem>
                ) : (
                  workingTimeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Custom Time Fields */}
          {showCustomTimes && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div>
                <Label htmlFor="preferred_start_time" className="text-sm font-medium">
                  Preferred Start Time
                </Label>
                <Input
                  id="preferred_start_time"
                  type="time"
                  value={formData?.preferred_start_time || ''}
                  onChange={(e) => onFieldChange('preferred_start_time', e.target.value)}
                  className="w-full"
                />
              </div>
              
              <div>
                <Label htmlFor="preferred_end_time" className="text-sm font-medium">
                  Preferred End Time
                </Label>
                <Input
                  id="preferred_end_time"
                  type="time"
                  value={formData?.preferred_end_time || ''}
                  onChange={(e) => onFieldChange('preferred_end_time', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
          )}

          {/* Timezone */}
          <div>
            <Label htmlFor="working_timezone" className="text-sm font-medium">
              Working Timezone
            </Label>
            <Select
              value={formData?.working_timezone || 'UTC'}
              onValueChange={(value) => onFieldChange('working_timezone', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select your timezone" />
              </SelectTrigger>
              <SelectContent>
                {loading ? (
                  <SelectItem value="loading-timezones" disabled>Loading timezones...</SelectItem>
                ) : (
                  timezoneOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label} {option.utc_offset}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Preview */}
          <div className="p-3 bg-muted/30 rounded-lg">
            <div className="text-sm text-muted-foreground mb-1">Preview:</div>
            <div className="text-foreground font-medium">{formatWorkingHours()}</div>
          </div>
        </div>
      )}
    </div>
  )
}
