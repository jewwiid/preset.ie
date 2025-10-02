'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Sparkles,
  MapPin,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  Loader2
} from 'lucide-react'
import { getAuthToken } from '@/lib/auth-utils'
import { format } from 'date-fns'

interface Recommendation {
  role: {
    id: string
    role_name: string
    skills_required: string[]
    is_paid: boolean
    compensation_details?: string
    headcount: number
  }
  project: {
    id: string
    title: string
    description?: string
    city?: string
    country?: string
    start_date?: string
    end_date?: string
    creator: {
      id: string
      display_name: string
      handle?: string
      avatar_url?: string
      verified_id?: boolean
    }
  }
  compatibility: {
    overall_score: number
    skill_match_score: number
    profile_completeness_score: number
    matched_skills: string[]
    missing_skills: string[]
  }
  already_applied: boolean
  application_status: string | null
}

interface RoleRecommendationsProps {
  onApply?: (projectId: string, roleId: string) => void
  limit?: number
  minCompatibility?: number
}

export function RoleRecommendations({
  onApply,
  limit = 10,
  minCompatibility = 30
}: RoleRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchRecommendations()
  }, [limit, minCompatibility])

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const token = await getAuthToken()
      if (!token) {
        setError('Please log in to see recommendations')
        setLoading(false)
        return
      }

      const response = await fetch(
        `/api/collab/recommendations?limit=${limit}&min_compatibility=${minCompatibility}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRecommendations(data.recommendations || [])
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to fetch recommendations')
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err)
      setError('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const getCompatibilityBadge = (score: number) => {
    if (score >= 70) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <TrendingUp className="h-3 w-3 mr-1" />
          {Math.round(score)}% Match
        </Badge>
      )
    } else if (score >= 50) {
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <TrendingUp className="h-3 w-3 mr-1" />
          {Math.round(score)}% Match
        </Badge>
      )
    } else {
      return (
        <Badge className="bg-yellow-100 text-yellow-800">
          {Math.round(score)}% Match
        </Badge>
      )
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-destructive-600">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Sparkles className="h-12 w-12 text-muted-foreground-400 mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-2">No Recommendations Yet</h3>
          <p className="text-muted-foreground-600 max-w-md mx-auto">
            We couldn't find any roles matching your skills right now.
            Check back later or browse all projects to find opportunities.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary-600" />
          <h2 className="text-xl font-semibold">Perfect Matches For You</h2>
        </div>
        <Badge variant="secondary">{recommendations.length} role{recommendations.length !== 1 ? 's' : ''}</Badge>
      </div>

      {recommendations.map((rec) => (
        <Card key={rec.role.id} className="hover:border-primary-300 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <CardTitle className="text-lg">{rec.role.role_name}</CardTitle>
                  {getCompatibilityBadge(rec.compatibility.overall_score)}
                  {rec.role.is_paid && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Paid
                    </Badge>
                  )}
                </div>
                <CardDescription className="font-medium text-base">
                  {rec.project.title}
                </CardDescription>
              </div>
            </div>

            {/* Creator Info */}
            <div className="flex items-center space-x-3 mt-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={rec.project.creator.avatar_url} />
                <AvatarFallback>
                  {rec.project.creator.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{rec.project.creator.display_name}</p>
                {rec.project.creator.handle && (
                  <p className="text-xs text-muted-foreground-500">
                    @{rec.project.creator.handle}
                  </p>
                )}
              </div>
              {rec.project.creator.verified_id && (
                <Badge variant="secondary" className="text-xs">Verified</Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Project Details */}
            {rec.project.description && (
              <p className="text-sm text-muted-foreground-700 line-clamp-2">
                {rec.project.description}
              </p>
            )}

            {/* Location & Dates */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground-600">
              {(rec.project.city || rec.project.country) && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {[rec.project.city, rec.project.country].filter(Boolean).join(', ')}
                </div>
              )}
              {rec.project.start_date && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {format(new Date(rec.project.start_date), 'MMM d, yyyy')}
                </div>
              )}
            </div>

            {/* Skill Match Breakdown */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-blue-900">Why you're a great fit:</span>
                <span className="text-blue-700">
                  {rec.compatibility.matched_skills.length} of {rec.role.skills_required?.length || 0} skills
                </span>
              </div>

              {rec.compatibility.matched_skills.length > 0 && (
                <div>
                  <p className="text-xs text-blue-800 mb-1">✓ Your matching skills:</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.compatibility.matched_skills.map((skill, idx) => (
                      <Badge key={idx} className="bg-green-100 text-green-800 text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {rec.compatibility.missing_skills.length > 0 && (
                <div>
                  <p className="text-xs text-blue-800 mb-1">📚 Skills to highlight:</p>
                  <div className="flex flex-wrap gap-1">
                    {rec.compatibility.missing_skills.slice(0, 3).map((skill, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2 pt-2">
              {rec.already_applied ? (
                <Button disabled variant="outline" size="sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {rec.application_status === 'pending' ? 'Application Pending' : 'Applied'}
                </Button>
              ) : (
                <Button
                  onClick={() => onApply?.(rec.project.id, rec.role.id)}
                  size="sm"
                >
                  Apply Now
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.href = `/collaborate/projects/${rec.project.id}`}
              >
                View Project
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
