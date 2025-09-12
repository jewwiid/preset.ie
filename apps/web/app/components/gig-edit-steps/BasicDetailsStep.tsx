'use client'

import { ChevronRight, FileText, Target, DollarSign } from 'lucide-react'
import { CompType, PurposeType } from '../../../lib/gig-form-persistence'

interface BasicDetailsStepProps {
  title: string
  description: string
  purpose: PurposeType
  compType: CompType
  onTitleChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  onPurposeChange: (value: PurposeType) => void
  onCompTypeChange: (value: CompType) => void
  onNext: () => void
  isValid: boolean
}

export default function BasicDetailsStep({
  title,
  description,
  purpose,
  compType,
  onTitleChange,
  onDescriptionChange,
  onPurposeChange,
  onCompTypeChange,
  onNext,
  isValid
}: BasicDetailsStepProps) {
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
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Basic Details</h2>
            <p className="text-gray-600 text-sm">Let's start with the essential information about your gig</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            Gig Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="title"
            required
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            placeholder="e.g., Fashion Editorial Shoot in Studio"
          />
          <p className="mt-1 text-xs text-gray-500">
            Write a clear, descriptive title that will attract the right talent
          </p>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            required
            rows={4}
            value={description}
            onChange={(e) => onDescriptionChange(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors resize-none"
            placeholder="Describe your shoot concept, what you're looking for, and any specific requirements..."
          />
          <p className="mt-1 text-xs text-gray-500">
            Provide details about the concept, style, and what talent should expect
          </p>
        </div>

        {/* Purpose and Compensation Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Purpose */}
          <div>
            <label htmlFor="purpose" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                Purpose of Shoot <span className="text-red-500">*</span>
              </div>
            </label>
            <select
              id="purpose"
              required
              value={purpose}
              onChange={(e) => onPurposeChange(e.target.value as PurposeType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="PORTFOLIO">Portfolio Building</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="EDITORIAL">Editorial</option>
              <option value="FASHION">Fashion</option>
              <option value="BEAUTY">Beauty</option>
              <option value="LIFESTYLE">Lifestyle</option>
              <option value="WEDDING">Wedding</option>
              <option value="EVENT">Event</option>
              <option value="PRODUCT">Product</option>
              <option value="ARCHITECTURE">Architecture</option>
              <option value="STREET">Street</option>
              <option value="CONCEPTUAL">Conceptual</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          {/* Compensation Type */}
          <div>
            <label htmlFor="comp-type" className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Compensation Type <span className="text-red-500">*</span>
              </div>
            </label>
            <select
              id="comp-type"
              value={compType}
              onChange={(e) => onCompTypeChange(e.target.value as CompType)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
            >
              <option value="TFP">TFP (Time for Prints/Portfolio)</option>
              <option value="PAID">Paid</option>
              <option value="EXPENSES">Expenses Covered</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-end pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={!isValid}
            className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Continue to Schedule
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}