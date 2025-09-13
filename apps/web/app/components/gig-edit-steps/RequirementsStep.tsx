'use client'

import { ChevronLeft, ChevronRight, FileText, Users, AlertCircle } from 'lucide-react'

interface RequirementsStepProps {
  usageRights: string
  maxApplicants: number
  safetyNotes: string
  onUsageRightsChange: (value: string) => void
  onMaxApplicantsChange: (value: number) => void
  onSafetyNotesChange: (value: string) => void
  onNext: () => void
  onBack: () => void
  isValid: boolean
  applicationCount?: number
}

export default function RequirementsStep({
  usageRights,
  maxApplicants,
  safetyNotes,
  onUsageRightsChange,
  onMaxApplicantsChange,
  onSafetyNotesChange,
  onNext,
  onBack,
  isValid,
  applicationCount = 0
}: RequirementsStepProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onNext()
    }
  }

  const commonUsageOptions = [
    'Portfolio use only',
    'Social media allowed',
    'Commercial use permitted', 
    'Editorial use only',
    'Web & print allowed',
    'Unlimited usage rights'
  ]

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Requirements & Rights</h2>
            <p className="text-gray-600 text-sm">Set usage rights and application limits</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Usage Rights */}
        <div>
          <label htmlFor="usage-rights" className="block text-sm font-medium text-gray-700 mb-2">
            Usage Rights <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="usage-rights"
            required
            value={usageRights}
            onChange={(e) => onUsageRightsChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="e.g., Portfolio use only, Social media allowed"
          />
          <p className="mt-1 text-xs text-gray-500">
            Clearly specify how the images can be used by talent
          </p>

          {/* Common Usage Options */}
          <div className="mt-3">
            <p className="text-xs text-gray-600 mb-2">Common options (click to use):</p>
            <div className="flex flex-wrap gap-2">
              {commonUsageOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => onUsageRightsChange(option)}
                  className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded-full hover:bg-emerald-100 hover:text-emerald-700 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Max Applicants */}
        <div>
          <label htmlFor="max-applicants" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Maximum Applicants
            </div>
          </label>
          <div className="relative">
            <input
              type="number"
              id="max-applicants"
              min="1"
              max="100"
              value={maxApplicants}
              onChange={(e) => onMaxApplicantsChange(parseInt(e.target.value) || 1)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            />
          </div>
          
          {/* Application Count Warning */}
          {applicationCount > 0 && (
            <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-amber-800 font-medium">Current applications: {applicationCount}</p>
                  <p className="text-amber-700">
                    {maxApplicants < applicationCount 
                      ? `Warning: You have more applications (${applicationCount}) than your new limit (${maxApplicants}). Existing applications won't be removed.`
                      : `You can accept ${maxApplicants - applicationCount} more applications.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <p className="mt-1 text-xs text-gray-500">
            Limit the number of applications to make selection easier
          </p>
        </div>

        {/* Safety Notes */}
        <div>
          <label htmlFor="safety-notes" className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Safety Notes (Optional)
            </div>
          </label>
          <textarea
            id="safety-notes"
            rows={3}
            value={safetyNotes}
            onChange={(e) => onSafetyNotesChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
            placeholder="e.g., Location has stairs, bring comfortable shoes, weather-dependent shoot..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Important safety information, accessibility notes, or special requirements for talent
          </p>
        </div>

        {/* Additional Requirements (Optional) */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Pro Tip</h3>
          <p className="text-sm text-gray-600">
            Clear usage rights help talent understand what they're agreeing to. 
            Be specific about social media, commercial use, and portfolio rights.
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
            Back to Schedule
          </button>
          
          <button
            type="submit"
            disabled={!isValid}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Moodboard
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}