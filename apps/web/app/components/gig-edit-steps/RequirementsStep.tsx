'use client'

import { ChevronLeft, ChevronRight, FileText, Users, AlertCircle, X, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'

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
  // Parse existing usage rights into array (split by comma or semicolon)
  const [selectedRights, setSelectedRights] = useState<string[]>(
    usageRights ? usageRights.split(/[,;]/).map(right => right.trim()).filter(Boolean) : []
  )
  const [customRight, setCustomRight] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (isValid) {
      onNext()
    }
  }

  // Update parent component when selected rights change
  const updateUsageRights = (rights: string[]) => {
    setSelectedRights(rights)
    onUsageRightsChange(rights.join(', '))
  }

  // Add a usage right
  const addUsageRight = (right: string) => {
    if (right && !selectedRights.includes(right)) {
      updateUsageRights([...selectedRights, right])
    }
  }

  // Remove a usage right
  const removeUsageRight = (rightToRemove: string) => {
    updateUsageRights(selectedRights.filter(right => right !== rightToRemove))
  }

  // Add custom usage right
  const addCustomRight = () => {
    if (customRight.trim() && !selectedRights.includes(customRight.trim())) {
      updateUsageRights([...selectedRights, customRight.trim()])
      setCustomRight('')
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
    <div className="bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-foreground">Requirements & Rights</h2>
            <p className="text-muted-foreground text-sm">Set usage rights and application limits</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Usage Rights */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-2">
            Usage Rights <span className="text-destructive">*</span>
          </Label>
          
          {/* Selected Usage Rights */}
          {selectedRights.length > 0 && (
            <div className="mb-3">
              <div className="flex flex-wrap gap-2">
                {selectedRights.map((right) => (
                  <Badge
                    key={right}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {right}
                    <button
                      type="button"
                      onClick={() => removeUsageRight(right)}
                      className="ml-1 hover:bg-destructive/20 rounded-full p-0.5 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Add Custom Usage Right */}
          <div className="flex gap-2 mb-3">
            <Input
              type="text"
              value={customRight}
              onChange={(e) => setCustomRight(e.target.value)}
              placeholder="Add custom usage right..."
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomRight()
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={addCustomRight}
              disabled={!customRight.trim() || selectedRights.includes(customRight.trim())}
            >
              Add
            </Button>
          </div>

          {/* Common Usage Options */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Common options (click to add):</p>
            <div className="flex flex-wrap gap-2">
              {commonUsageOptions.map((option) => (
                <Button
                  key={option}
                  type="button"
                  variant={selectedRights.includes(option) ? "default" : "secondary"}
                  size="sm"
                  onClick={() => {
                    if (selectedRights.includes(option)) {
                      removeUsageRight(option)
                    } else {
                      addUsageRight(option)
                    }
                  }}
                  className="text-xs h-8 px-3"
                >
                  {selectedRights.includes(option) ? '✓ ' : ''}{option}
                </Button>
              ))}
            </div>
          </div>

          <p className="mt-2 text-xs text-muted-foreground">
            Select multiple usage rights that apply to your shoot. Be specific to help talent understand their permissions.
          </p>
        </div>

        {/* Max Applicants */}
        <div>
          <Label className="text-sm font-medium text-foreground mb-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Maximum Applicants
            </div>
          </Label>
          
          <div className="flex items-center gap-3">
            {/* Decrement Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onMaxApplicantsChange(Math.max(1, maxApplicants - 1))}
              disabled={maxApplicants <= 1}
              className="h-10 w-10 shrink-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            
            {/* Value Display */}
            <div className="flex-1 text-center">
              <div className="text-2xl font-bold text-foreground">{maxApplicants}</div>
              <div className="text-sm text-muted-foreground">
                {maxApplicants === 1 ? 'applicant' : 'applicants'}
              </div>
            </div>
            
            {/* Increment Button */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => onMaxApplicantsChange(Math.min(100, maxApplicants + 1))}
              disabled={maxApplicants >= 100}
              className="h-10 w-10 shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Range Display */}
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span>Min: 1</span>
            <span>Max: 100</span>
          </div>
          
          {/* Application Count Warning */}
          {applicationCount > 0 && (
            <div className="mt-2 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="text-primary font-medium">Current applications: {applicationCount}</p>
                  <p className="text-primary/80">
                    {maxApplicants < applicationCount 
                      ? `Warning: You have more applications (${applicationCount}) than your new limit (${maxApplicants}). Existing applications won't be removed.`
                      : `You can accept ${maxApplicants - applicationCount} more applications.`
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <p className="mt-1 text-xs text-muted-foreground">
            Limit the number of applications to make selection easier
          </p>
        </div>

        {/* Safety Notes */}
        <div>
          <Label htmlFor="safety-notes" className="text-sm font-medium text-foreground mb-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Safety Notes (Optional)
            </div>
          </Label>
          <textarea
            id="safety-notes"
            rows={3}
            value={safetyNotes}
            onChange={(e) => onSafetyNotesChange(e.target.value)}
            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
            placeholder="e.g., Location has stairs, bring comfortable shoes, weather-dependent shoot..."
          />
          <p className="mt-1 text-xs text-muted-foreground">
            Important safety information, accessibility notes, or special requirements for talent
          </p>
        </div>

        {/* Additional Requirements (Optional) */}
        <div className="bg-muted rounded-lg p-4">
          <h3 className="text-sm font-medium text-foreground mb-2">Pro Tip</h3>
          <p className="text-sm text-muted-foreground">
            Clear usage rights help talent understand what they're agreeing to. 
            Be specific about social media, commercial use, and portfolio rights.
          </p>
        </div>

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
            Back to Schedule
          </Button>
          
          <Button
            type="submit"
            disabled={!isValid}
            size="lg"
            className="flex items-center gap-2"
          >
            Continue to Moodboard
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </form>
    </div>
  )
}