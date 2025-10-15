import React, { useState } from 'react'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent } from '../../../components/ui/card'
import { Progress } from '../../../components/ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip'

interface CompatibilityScoreProps {
  score: number
  breakdown?: any
  size?: 'sm' | 'md' | 'lg'
  showBreakdown?: boolean
  showDetails?: boolean
}

export default function CompatibilityScore({
  score,
  breakdown,
  size = 'md',
  showBreakdown = false,
  showDetails = false
}: CompatibilityScoreProps) {
  const [showTooltip, setShowTooltip] = useState(false)

  
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary-600'
    if (score >= 60) return 'text-primary-600'
    return 'text-destructive-600'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match'
    if (score >= 60) return 'Good Match'
    return 'Fair Match'
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default'
    if (score >= 60) return 'secondary'
    return 'destructive'
  }

  const getSizeClasses = (size: string) => {
    switch (size) {
      case 'sm':
        return {
          container: 'space-y-1',
          badge: 'text-xs',
          progress: 'w-16 h-1',
          label: 'text-xs'
        }
      case 'lg':
        return {
          container: 'space-y-3',
          badge: 'text-base',
          progress: 'w-32 h-3',
          label: 'text-sm'
        }
      default: // md
        return {
          container: 'space-y-2',
          badge: 'text-sm',
          progress: 'w-24 h-2',
          label: 'text-xs'
        }
    }
  }

  const sizeClasses = getSizeClasses(size)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`flex flex-col items-center ${sizeClasses.container}`}>
            <Badge variant={getScoreBadgeVariant(score)} className={sizeClasses.badge}>
              {score}% Match
            </Badge>
            <div className={sizeClasses.progress}>
              <Progress value={score} className="h-full" />
            </div>
            <span className={`${sizeClasses.label} font-medium ${getScoreColor(score)}`}>
              {getScoreLabel(score)}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Compatibility based on skills, location, and preferences</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
