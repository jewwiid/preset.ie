'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Slider } from '../../../components/ui/slider'
import { Checkbox } from '../../../components/ui/checkbox'
import { Calendar } from '../../../components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover'
import { 
  Filter, 
  X, 
  MapPin, 
  DollarSign, 
  Award, 
  Clock,
  Calendar as CalendarIcon,
  Target
} from 'lucide-react'
import { MatchmakingFilters as MatchmakingFiltersType } from '../../../lib/types/matchmaking'
import { format } from 'date-fns'

interface MatchmakingFiltersProps {
  onFiltersChange: (filters: MatchmakingFiltersType) => void
  userType: 'talent' | 'contributor'
  className?: string
}

const MatchmakingFilters: React.FC<MatchmakingFiltersProps> = ({
  onFiltersChange,
  userType,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState<MatchmakingFiltersType>({
    compatibility_min: 60,
    compatibility_max: 100,
    location_radius: 50,
    date_range: {
      start: null,
      end: null
    },
    compensation_types: [],
    specializations: [],
    experience_levels: [],
    availability_status: []
  })

  const compensationTypes = [
    { value: 'TFP', label: 'Time for Prints' },
    { value: 'PAID', label: 'Paid' },
    { value: 'EXPENSES_ONLY', label: 'Expenses Only' }
  ]

  const specializations = [
    'Fashion Photography',
    'Portrait Photography',
    'Event Photography',
    'Commercial Photography',
    'Wedding Photography',
    'Street Photography',
    'Product Photography',
    'Architecture Photography'
  ]

  const experienceLevels = [
    'beginner',
    'intermediate', 
    'advanced',
    'professional',
    'expert'
  ]

  const availabilityStatuses = [
    'available',
    'busy',
    'unavailable',
    'limited',
    'weekends_only',
    'weekdays_only'
  ]

  const handleFilterChange = (key: keyof MatchmakingFiltersType, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleCompatibilityRangeChange = (value: number | number[]) => {
    const values = Array.isArray(value) ? value : [value]
    handleFilterChange('compatibility_min', values[0])
    handleFilterChange('compatibility_max', values[1])
  }

  const handleLocationRadiusChange = (value: number | number[]) => {
    const values = Array.isArray(value) ? value : [value]
    handleFilterChange('location_radius', values[0])
  }

  const handleCompensationTypeToggle = (type: string) => {
    const newTypes = filters.compensation_types.includes(type)
      ? filters.compensation_types.filter(t => t !== type)
      : [...filters.compensation_types, type]
    handleFilterChange('compensation_types', newTypes)
  }

  const handleSpecializationToggle = (specialization: string) => {
    const newSpecializations = filters.specializations.includes(specialization)
      ? filters.specializations.filter(s => s !== specialization)
      : [...filters.specializations, specialization]
    handleFilterChange('specializations', newSpecializations)
  }

  const handleExperienceLevelToggle = (level: string) => {
    const newLevels = filters.experience_levels.includes(level)
      ? filters.experience_levels.filter(l => l !== level)
      : [...filters.experience_levels, level]
    handleFilterChange('experience_levels', newLevels)
  }

  const handleAvailabilityStatusToggle = (status: string) => {
    const newStatuses = filters.availability_status.includes(status)
      ? filters.availability_status.filter(s => s !== status)
      : [...filters.availability_status, status]
    handleFilterChange('availability_status', newStatuses)
  }

  const clearAllFilters = () => {
    const clearedFilters: MatchmakingFiltersType = {
      compatibility_min: 60,
      compatibility_max: 100,
      location_radius: 50,
      date_range: {
        start: null,
        end: null
      },
      compensation_types: [],
      specializations: [],
      experience_levels: [],
      availability_status: []
    }
    setFilters(clearedFilters)
    onFiltersChange(clearedFilters)
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.compatibility_min !== 60 || filters.compatibility_max !== 100) count++
    if (filters.location_radius !== 50) count++
    if (filters.date_range.start || filters.date_range.end) count++
    if (filters.compensation_types.length > 0) count++
    if (filters.specializations.length > 0) count++
    if (filters.experience_levels.length > 0) count++
    if (filters.availability_status.length > 0) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className={className}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        
        <PopoverContent className="w-96 p-0" align="end">
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Matchmaking Filters</CardTitle>
                <div className="flex items-center gap-2">
                  {activeFiltersCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6 max-h-96 overflow-y-auto">
              {/* Compatibility Score Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary-600" />
                  <h4 className="font-medium">Compatibility Score</h4>
                </div>
                <div className="px-3">
                  <Slider
                    value={[filters.compatibility_min, filters.compatibility_max]}
                    onValueChange={handleCompatibilityRangeChange}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>{filters.compatibility_min}%</span>
                    <span>{filters.compatibility_max}%</span>
                  </div>
                </div>
              </div>

              {/* Location Radius */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium">Location Radius</h4>
                </div>
                <div className="px-3">
                  <Slider
                    value={[filters.location_radius]}
                    onValueChange={handleLocationRadiusChange}
                    max={200}
                    min={5}
                    step={5}
                    className="w-full"
                  />
                  <div className="text-sm text-gray-600 mt-2 text-center">
                    {filters.location_radius} km
                  </div>
                </div>
              </div>

              {/* Date Range */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-purple-600" />
                  <h4 className="font-medium">Date Range</h4>
                </div>
                <div className="space-y-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.date_range.start ? format(filters.date_range.start, 'PPP') : 'Start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.date_range.start || undefined}
                        onSelect={(date) => handleFilterChange('date_range', { ...filters.date_range, start: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.date_range.end ? format(filters.date_range.end, 'PPP') : 'End date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.date_range.end || undefined}
                        onSelect={(date) => handleFilterChange('date_range', { ...filters.date_range, end: date })}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Compensation Types */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary-600" />
                  <h4 className="font-medium">Compensation</h4>
                </div>
                <div className="space-y-2">
                  {compensationTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={filters.compensation_types.includes(type.value)}
                        onCheckedChange={() => handleCompensationTypeToggle(type.value)}
                      />
                      <label
                        htmlFor={type.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specializations */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-orange-600" />
                  <h4 className="font-medium">Specializations</h4>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {specializations.map((specialization) => (
                    <div key={specialization} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialization}
                        checked={filters.specializations.includes(specialization)}
                        onCheckedChange={() => handleSpecializationToggle(specialization)}
                      />
                      <label
                        htmlFor={specialization}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {specialization}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Levels */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <h4 className="font-medium">Experience Level</h4>
                </div>
                <div className="space-y-2">
                  {experienceLevels.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={filters.experience_levels.includes(level)}
                        onCheckedChange={() => handleExperienceLevelToggle(level)}
                      />
                      <label
                        htmlFor={level}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Availability Status */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-red-600" />
                  <h4 className="font-medium">Availability</h4>
                </div>
                <div className="space-y-2">
                  {availabilityStatuses.map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={status}
                        checked={filters.availability_status.includes(status)}
                        onCheckedChange={() => handleAvailabilityStatusToggle(status)}
                      />
                      <label
                        htmlFor={status}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 capitalize"
                      >
                        {status.replace('_', ' ')}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default MatchmakingFilters
