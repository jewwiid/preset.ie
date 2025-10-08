'use client'

import { ChevronLeft, ChevronRight, MapPin, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar as CalendarComponent } from '@/components/ui/calendar'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { useState, useEffect } from 'react'

interface LocationScheduleStepProps {
  location: string
  startDate: string
  endDate: string
  applicationDeadline: string
  onLocationChange: (value: string) => void
  onStartDateChange: (value: string) => void
  onEndDateChange: (value: string) => void
  onApplicationDeadlineChange: (value: string) => void
  onNext: () => void
  onBack: () => void
  isValid: boolean
  validationErrors?: string[]
}

export default function LocationScheduleStep({
  location,
  startDate,
  endDate,
  applicationDeadline,
  onLocationChange,
  onStartDateChange,
  onEndDateChange,
  onApplicationDeadlineChange,
  onNext,
  onBack,
  isValid,
  validationErrors = []
}: LocationScheduleStepProps) {
  // Time format toggle state
  const [is24Hour, setIs24Hour] = useState(true)
  
  // Local display state for 12hr inputs to avoid feedback loops
  const [startTimeDisplay, setStartTimeDisplay] = useState('')
  const [endTimeDisplay, setEndTimeDisplay] = useState('')
  const [deadlineTimeDisplay, setDeadlineTimeDisplay] = useState('')

  // Sync display values when format changes or actual values change
  useEffect(() => {
    if (!is24Hour) {
      setStartTimeDisplay(startDate ? convertTo12Hour(startDate.split('T')[1] || '') : '')
      setEndTimeDisplay(endDate ? convertTo12Hour(endDate.split('T')[1] || '') : '')
      setDeadlineTimeDisplay(applicationDeadline ? convertTo12Hour(applicationDeadline.split('T')[1] || '') : '')
    }
  }, [is24Hour, startDate, endDate, applicationDeadline])

  // Helper function to convert 24h to 12h format
  const convertTo12Hour = (time24: string): string => {
    if (!time24 || !time24.includes(':')) return ''
    
    const parts = time24.split(':')
    if (parts.length < 2) return ''
    
    const hours = parts[0]
    const minutes = parts[1]
    
    // Validate hours and minutes
    const hour24 = parseInt(hours, 10)
    const min = parseInt(minutes, 10)
    
    if (isNaN(hour24) || isNaN(min) || hour24 < 0 || hour24 > 23 || min < 0 || min > 59) {
      return ''
    }
    
    const hour12 = hour24 === 0 ? 12 : hour24 > 12 ? hour24 - 12 : hour24
    const ampm = hour24 >= 12 ? 'PM' : 'AM'
    return `${hour12.toString().padStart(2, '0')}:${minutes.padStart(2, '0')} ${ampm}`
  }

  // Helper function to convert 12h to 24h format
  const convertTo24Hour = (time12: string): string => {
    if (!time12) return ''
    
    // Clean the input string
    const cleanInput = time12.trim()
    const match = cleanInput.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    
    if (!match) {
      // If it doesn't match the expected format, try to extract just numbers
      const timeOnly = cleanInput.replace(/[^0-9:]/g, '')
      if (timeOnly.includes(':')) {
        const [h, m] = timeOnly.split(':')
        const hour = parseInt(h, 10)
        const minute = parseInt(m, 10)
        if (!isNaN(hour) && !isNaN(minute) && hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
          return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        }
      }
      return ''
    }
    
    let [, hours, minutes, ampm] = match
    let hour24 = parseInt(hours, 10)
    const min = parseInt(minutes, 10)
    
    // Validate input
    if (isNaN(hour24) || isNaN(min) || hour24 < 1 || hour24 > 12 || min < 0 || min > 59) {
      return ''
    }
    
    if (ampm.toUpperCase() === 'PM' && hour24 !== 12) {
      hour24 += 12
    } else if (ampm.toUpperCase() === 'AM' && hour24 === 12) {
      hour24 = 0
    }
    
    return `${hour24.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
  }

  // Helper function to safely get max date for application deadline
  const getMaxDeadlineDate = (): string | undefined => {
    if (!startDate) return undefined
    
    try {
      // Validate startDate format
      const startDateObj = new Date(startDate)
      if (isNaN(startDateObj.getTime())) {
        return undefined
      }
      
      // Allow deadline up to the start date (same day is OK)
      // The time validation will handle the 24-hour requirement
      return startDateObj.toISOString().split('T')[0]
    } catch (error) {
      console.error('Error calculating max deadline date:', error)
      return undefined
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onNext()
    }
  }

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Schedule & Location</h2>
            <p className="text-muted-foreground text-sm">When and where will the shoot take place?</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-foreground mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Shoot Location <span className="text-destructive">*</span>
            </div>
          </label>
          <Input
            type="text"
            id="location"
            required
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            placeholder="e.g., Manchester, United Kingdom  •  Dublin, Ireland  •  Paris, France"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            💡 Use format: <strong>City, Country</strong> (e.g., "London, United Kingdom") to help talent find and filter gigs
          </p>
        </div>

        {/* Schedule Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Shoot Schedule
            </h3>
            
            {/* Time Format Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">12hr</span>
              <Switch
                checked={is24Hour}
                onCheckedChange={setIs24Hour}
                className="data-[state=checked]:bg-primary"
              />
              <span className="text-xs text-muted-foreground">24hr</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date/Time */}
            <div>
              <Label htmlFor="start-date" className="text-sm font-medium text-foreground mb-2">
                Start Date/Time <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Date
                  </div>
                  <Input
                    type="date"
                    required
                    value={startDate ? startDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const time = startDate ? startDate.split('T')[1] || '09:00' : '09:00'
                      onStartDateChange(`${e.target.value}T${time}`)
                    }}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Time
                  </div>
                  <div className="relative">
                    {is24Hour ? (
                      <Input
                        type="time"
                        required
                        value={startDate ? startDate.split('T')[1] || '' : ''}
                        onChange={(e) => {
                          const date = startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0]
                          onStartDateChange(`${date}T${e.target.value}`)
                        }}
                        className="pr-10"
                        id="start-time"
                      />
                    ) : (
                      <div className="relative">
                        <Input
                          type="text"
                          required
                          value={startTimeDisplay}
                          onChange={(e) => {
                            setStartTimeDisplay(e.target.value)
                          }}
                          onBlur={(e) => {
                            // On blur, try to convert whatever the user typed
                            const time24 = convertTo24Hour(e.target.value)
                            if (time24) {
                              const date = startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0]
                              onStartDateChange(`${date}T${time24}`)
                            } else {
                              // Reset to converted value if invalid
                              setStartTimeDisplay(startDate ? convertTo12Hour(startDate.split('T')[1] || '') : '')
                            }
                          }}
                          placeholder="12:00 PM"
                          className="pr-10"
                          id="start-time"
                        />
                      </div>
                    )}
                    <Clock 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => document.getElementById('start-time')?.focus()}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* End Date/Time */}
            <div>
              <Label htmlFor="end-date" className="text-sm font-medium text-foreground mb-2">
                End Date/Time <span className="text-destructive">*</span>
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Date
                  </div>
                  <Input
                    type="date"
                    required
                    value={endDate ? endDate.split('T')[0] : ''}
                    onChange={(e) => {
                      const time = endDate ? endDate.split('T')[1] || '18:00' : '18:00'
                      onEndDateChange(`${e.target.value}T${time}`)
                    }}
                    min={startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">
                    Time
                  </div>
                  <div className="relative">
                    {is24Hour ? (
                      <Input
                        type="time"
                        required
                        value={endDate ? endDate.split('T')[1] || '' : ''}
                        onChange={(e) => {
                          const date = endDate ? endDate.split('T')[0] : (startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0])
                          onEndDateChange(`${date}T${e.target.value}`)
                        }}
                        className="pr-10"
                        id="end-time"
                      />
                    ) : (
                      <div className="relative">
                        <Input
                          type="text"
                          required
                          value={endTimeDisplay}
                          onChange={(e) => {
                            setEndTimeDisplay(e.target.value)
                          }}
                          onBlur={(e) => {
                            // On blur, try to convert whatever the user typed
                            const time24 = convertTo24Hour(e.target.value)
                            if (time24) {
                              const date = endDate ? endDate.split('T')[0] : (startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0])
                              onEndDateChange(`${date}T${time24}`)
                            } else {
                              // Reset to converted value if invalid
                              setEndTimeDisplay(endDate ? convertTo12Hour(endDate.split('T')[1] || '') : '')
                            }
                          }}
                          placeholder="06:00 PM"
                          className="pr-10"
                          id="end-time"
                        />
                      </div>
                    )}
                    <Clock 
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                      onClick={() => document.getElementById('end-time')?.focus()}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Application Deadline */}
        <div>
          <Label htmlFor="deadline" className="text-sm font-medium text-foreground mb-2">
            Application Deadline <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Date
              </div>
              <Input
                type="date"
                required
                value={applicationDeadline ? applicationDeadline.split('T')[0] : ''}
                onChange={(e) => {
                  const time = applicationDeadline ? applicationDeadline.split('T')[1] || '23:59' : '23:59'
                  onApplicationDeadlineChange(`${e.target.value}T${time}`)
                }}
                min={new Date().toISOString().split('T')[0]}
                max={getMaxDeadlineDate()}
              />
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-1">
                Time
              </div>
              <div className="relative">
                {is24Hour ? (
                  <Input
                    type="time"
                    required
                    value={applicationDeadline ? applicationDeadline.split('T')[1] || '' : ''}
                    onChange={(e) => {
                      const date = applicationDeadline ? applicationDeadline.split('T')[0] : new Date().toISOString().split('T')[0]
                      onApplicationDeadlineChange(`${date}T${e.target.value}`)
                    }}
                    className="pr-10"
                    id="deadline-time"
                  />
                ) : (
                  <div className="relative">
                    <Input
                      type="text"
                      required
                      value={deadlineTimeDisplay}
                      onChange={(e) => {
                        setDeadlineTimeDisplay(e.target.value)
                      }}
                      onBlur={(e) => {
                        // On blur, try to convert whatever the user typed
                        const time24 = convertTo24Hour(e.target.value)
                        if (time24) {
                          const date = applicationDeadline ? applicationDeadline.split('T')[0] : new Date().toISOString().split('T')[0]
                          onApplicationDeadlineChange(`${date}T${time24}`)
                        } else {
                          // Reset to converted value if invalid
                          setDeadlineTimeDisplay(applicationDeadline ? convertTo12Hour(applicationDeadline.split('T')[1] || '') : '')
                        }
                      }}
                      placeholder="11:59 PM"
                      className="pr-10"
                      id="deadline-time"
                    />
                  </div>
                )}
                <Clock 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => document.getElementById('deadline-time')?.focus()}
                />
              </div>
            </div>
          </div>
          {/* Conditional warning - only show if deadline is too close to shoot */}
          {applicationDeadline && startDate && (
            (() => {
              try {
                const deadline = new Date(applicationDeadline)
                const shootStart = new Date(startDate)
                
                // Validate both dates
                if (isNaN(deadline.getTime()) || isNaN(shootStart.getTime())) {
                  return null
                }
                
                const timeDiff = shootStart.getTime() - deadline.getTime()
                const hoursDiff = timeDiff / (1000 * 60 * 60)
                
                if (hoursDiff < 24 && hoursDiff > 0) {
                  const hoursRounded = Math.round(hoursDiff * 10) / 10
                  return (
                    <p className="mt-2 text-xs text-destructive">
                      <strong>Only {hoursRounded} hours before shoot</strong> - Consider allowing at least 24 hours to review applications
                    </p>
                  )
                } else if (hoursDiff <= 0) {
                  return (
                    <p className="mt-2 text-xs text-destructive">
                      <strong>Deadline must be before the shoot starts</strong>
                    </p>
                  )
                }
                return null
              } catch (error) {
                console.error('Error validating deadline warning:', error)
                return null
              }
            })()
          )}
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
        <div className="flex justify-between pt-6 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            size="lg"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Details
          </Button>
          
          <Button
            type="submit"
            disabled={!isValid}
            size="lg"
            className="flex items-center gap-2"
          >
            Continue to Requirements
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}