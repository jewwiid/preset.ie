'use client'

import { ChevronLeft, ChevronRight, MapPin, Calendar, Clock } from 'lucide-react'

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onNext()
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <Calendar className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Schedule & Location</h2>
            <p className="text-gray-600 text-sm">When and where will the shoot take place?</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Please fix the following:</h4>
            <ul className="text-sm text-red-700 space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Location */}
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Shoot Location <span className="text-red-500">*</span>
            </div>
          </label>
          <input
            type="text"
            id="location"
            required
            value={location}
            onChange={(e) => onLocationChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="e.g., Downtown Studio, Central Park, Dublin City Centre"
          />
          <p className="mt-1 text-xs text-gray-500">
            Be specific about the location to help talent plan their journey
          </p>
        </div>

        {/* Schedule Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Shoot Schedule
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Date/Time */}
            <div>
              <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date/Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="start-date"
                required
                value={startDate}
                onChange={(e) => onStartDateChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>

            {/* End Date/Time */}
            <div>
              <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-2">
                End Date/Time <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                id="end-date"
                required
                value={endDate}
                onChange={(e) => onEndDateChange(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Application Deadline */}
        <div>
          <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
            Application Deadline <span className="text-red-500">*</span>
          </label>
          <input
            type="datetime-local"
            id="deadline"
            required
            value={applicationDeadline}
            onChange={(e) => onApplicationDeadlineChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">
            Deadline must be before the shoot starts to give you time to review applications
          </p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-gray-100">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Details
          </button>
          
          <button
            type="submit"
            disabled={!isValid}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Requirements
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}