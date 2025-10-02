'use client'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface SkillMatchWarningProps {
  matchPercentage: number
  matchedSkills: string[]
  missingSkills: string[]
  profileCompletenessScore: number
  missingProfileFields: string[]
  className?: string
}

export function SkillMatchWarning({
  matchPercentage,
  matchedSkills,
  missingSkills,
  profileCompletenessScore,
  missingProfileFields,
  className
}: SkillMatchWarningProps) {
  const getWarningLevel = () => {
    // Profile incomplete - critical
    if (profileCompletenessScore < 100) return 'destructive'

    // Skill match levels
    if (matchPercentage >= 70) return 'success'
    if (matchPercentage >= 30) return 'warning'
    return 'destructive'
  }

  const getIcon = () => {
    const level = getWarningLevel()
    if (level === 'success') return <CheckCircle className="h-4 w-4" />
    if (level === 'warning') return <AlertCircle className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  const getTitle = () => {
    if (profileCompletenessScore < 100) {
      return 'Complete Your Profile to Apply'
    }

    if (matchPercentage >= 70) return `Great Match! ${Math.round(matchPercentage)}%`
    if (matchPercentage >= 30) return `Partial Match: ${Math.round(matchPercentage)}%`
    return `Low Skill Match: ${Math.round(matchPercentage)}%`
  }

  const getDescription = () => {
    if (profileCompletenessScore < 100) {
      return `Please complete your profile before applying. Missing: ${missingProfileFields.join(', ')}`
    }

    if (matchPercentage >= 70) {
      return 'You have strong skills for this role! Your application has a great chance of success.'
    }

    if (matchPercentage >= 30) {
      return 'You have some relevant skills. Consider explaining your related experience in your application message.'
    }

    return 'Your skills do not meet the minimum requirements. Your application may be automatically rejected.'
  }

  const variant = getWarningLevel() as 'default' | 'destructive'

  return (
    <div className={className}>
      <Alert variant={variant}>
        <div className="flex items-start gap-2">
          {getIcon()}
          <div className="flex-1">
            <AlertTitle>{getTitle()}</AlertTitle>
            <AlertDescription className="mt-2">
              {getDescription()}
            </AlertDescription>

            {/* Profile Completeness Issues */}
            {profileCompletenessScore < 100 && missingProfileFields.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-sm font-medium">Missing profile information:</p>
                <div className="flex flex-wrap gap-2">
                  {missingProfileFields.map((field) => (
                    <Badge key={field} variant="destructive">
                      {field.charAt(0).toUpperCase() + field.slice(1)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Skill Match Breakdown */}
            {profileCompletenessScore === 100 && (
              <div className="mt-3 space-y-2">
                {matchedSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Matched skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {matchedSkills.map((skill) => (
                        <Badge key={skill} variant="secondary" className="bg-primary-100 text-primary-800">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {missingSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {matchPercentage >= 30 ? 'Additional skills for this role:' : 'Required skills:'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {missingSkills.map((skill) => (
                        <Badge key={skill} variant="outline">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </Alert>
    </div>
  )
}
