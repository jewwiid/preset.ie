'use client'

import { ChevronLeft, ChevronRight, Image } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Image className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Visual Moodboard</h2>
            <p className="text-muted-foreground text-sm">Add visual inspiration to help talent understand your vision</p>
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
      <div className="bg-card rounded-lg border border-border shadow-sm p-4">
        <div className="flex justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            size="lg"
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Requirements
          </Button>
          
          <Button
            type="button"
            onClick={onNext}
            size="lg"
            className="flex items-center gap-2"
          >
            Continue to Review
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}