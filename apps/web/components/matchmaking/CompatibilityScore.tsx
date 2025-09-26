'use client'

import React, { useState } from 'react'
import { Badge } from '../ui/badge'
import { Card, CardContent } from '../ui/card'
import { Progress } from '../ui/progress'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip'
import { Info, TrendingUp, Users, Calendar, Award, Target } from 'lucide-react'
import { CompatibilityScoreProps, CompatibilityBreakdown } from '../../lib/types/matchmaking'

const CompatibilityScore: React.FC<CompatibilityScoreProps> = ({
  score,
  breakdown,
  showBreakdown = false,
  size = 'md',
  className = ''
}) => {
  const [showDetails, setShowDetails] = useState(false)

  // Determine score color and label
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-primary-600 bg-primary-50 border-primary/20'
    if (score >= 80) return 'text-primary-500 bg-primary-50 border-primary/20'
    if (score >= 70) return 'text-primary-600 bg-primary-50 border-primary-200'
    if (score >= 60) return 'text-primary-600 bg-primary-50 border-primary-200'
    return 'text-destructive-600 bg-destructive-50 border-destructive-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Perfect Match'
    if (score >= 80) return 'Excellent Match'
    if (score >= 70) return 'Good Match'
    if (score >= 60) return 'Fair Match'
    return 'Poor Match'
  }

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <TrendingUp className="w-4 h-4" />
    if (score >= 60) return <Target className="w-4 h-4" />
    return <Info className="w-4 h-4" />
  }

  // Size variants
  const sizeClasses = {
    sm: 'text-sm px-2 py-1',
    md: 'text-base px-3 py-2',
    lg: 'text-lg px-4 py-3'
  }

  const progressSize = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  }

  const iconSize = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const scoreColor = getScoreColor(score)
  const scoreLabel = getScoreLabel(score)
  const scoreIcon = getScoreIcon(score)

  return (
    <TooltipProvider>
      <div className={`compatibility-score ${className}`}>
        {/* Main Score Display */}
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline" 
            className={`${scoreColor} ${sizeClasses[size]} font-semibold flex items-center gap-1`}
          >
            {scoreIcon}
            {score}%
          </Badge>
          
          <span className={`text-sm font-medium ${scoreColor.split(' ')[0]}`}>
            {scoreLabel}
          </span>
        </div>

        {/* Progress Bar */}
        <div className={`mt-2 ${progressSize[size]}`}>
          <Progress 
            value={score} 
            className="w-full"
            // Custom styling for different score ranges
            style={{
              '--progress-background': score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
            } as React.CSSProperties}
          />
        </div>

        {/* Breakdown Details */}
        {showBreakdown && breakdown && (
          <div className="mt-3">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-muted-foreground-500 hover:text-muted-foreground-700 flex items-center gap-1"
            >
              <Info className={iconSize[size]} />
              {showDetails ? 'Hide' : 'Show'} breakdown
            </button>

            {showDetails && (
              <Card className="mt-2 p-3 bg-muted-50">
                <CardContent className="p-0 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Gender
                    </span>
                    <span className="font-medium">{breakdown.gender}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Age
                    </span>
                    <span className="font-medium">{breakdown.age}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      Height
                    </span>
                    <span className="font-medium">{breakdown.height}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <Award className="w-3 h-3" />
                      Experience
                    </span>
                    <span className="font-medium">{breakdown.experience}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      Specialization
                    </span>
                    <span className="font-medium">{breakdown.specialization}%</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Tooltip for additional info */}
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-0 right-0 w-full h-full cursor-help" />
          </TooltipTrigger>
          <TooltipContent>
            <div className="text-sm">
              <p className="font-medium">Compatibility Score: {score}%</p>
              <p className="text-muted-foreground-600">{scoreLabel}</p>
              {breakdown && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-muted-foreground-500">Breakdown:</p>
                  <p className="text-xs">• Gender: {breakdown.gender}%</p>
                  <p className="text-xs">• Age: {breakdown.age}%</p>
                  <p className="text-xs">• Height: {breakdown.height}%</p>
                  <p className="text-xs">• Experience: {breakdown.experience}%</p>
                  <p className="text-xs">• Specialization: {breakdown.specialization}%</p>
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

export default CompatibilityScore
