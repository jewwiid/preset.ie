'use client'

import { ChevronLeft, ChevronRight, Image } from 'lucide-react'
import MoodboardBuilder from '../MoodboardBuilder'

interface MoodboardStepProps {
  gigId: string
  moodboardId?: string
  onMoodboardSave: (newMoodboardId: string) => void
  onNext: () => void
  onBack: () => void
}

export default function MoodboardStep({
  gigId,
  moodboardId,
  onMoodboardSave,
  onNext,
  onBack
}: MoodboardStepProps) {
  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-100 p-2 rounded-lg">
            <Image className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Visual Moodboard</h2>
            <p className="text-gray-600 text-sm">Add visual inspiration to help talent understand your vision</p>
          </div>
        </div>
      </div>

      {/* Moodboard Builder */}
      <MoodboardBuilder 
        gigId={gigId}
        moodboardId={moodboardId}
        onSave={onMoodboardSave}
        compactMode={true}
      />

      {/* Navigation */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Requirements
          </button>
          
          <button
            type="button"
            onClick={onNext}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-colors"
          >
            Continue to Review
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}