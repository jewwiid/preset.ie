'use client'

import { useRouter } from 'next/navigation'
import { Target, TrendingUp, Users } from 'lucide-react'
import CompatibilityScore from '../matchmaking/CompatibilityScore'
import { Recommendation } from '../../lib/types/matchmaking'
import { LoadingSpinner } from '../ui/loading-spinner'
import { IconBadge } from '../ui/icon-badge'

interface MatchmakingData {
  topCompatibleGigs: Recommendation[]
  topCompatibleProjects: any[]
  averageCompatibility: number
  totalMatches: number
}

interface DashboardMatchmakingCardProps {
  matchmakingData: MatchmakingData
  loading?: boolean
}

export function DashboardMatchmakingCard({
  matchmakingData,
  loading = false
}: DashboardMatchmakingCardProps) {
  const router = useRouter()

  if (!loading && matchmakingData.topCompatibleGigs.length === 0 && matchmakingData.topCompatibleProjects.length === 0) {
    return null
  }

  return (
    <div className="mb-6 max-w-7xl mx-auto">
      <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <IconBadge icon={Target} size="md" variant="primary" />
          <div>
            <h3 className="text-lg font-bold text-foreground">Perfect Matches For You</h3>
            <p className="text-sm text-muted-foreground">
              {matchmakingData.averageCompatibility > 0
                ? `${Math.round(matchmakingData.averageCompatibility)}% average compatibility`
                : 'Based on your profile and skills'}
            </p>
          </div>
        </div>

        {/* Collaboration Projects */}
        {matchmakingData.topCompatibleProjects.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Collaboration Projects
            </h4>
            <div className="space-y-3">
              {matchmakingData.topCompatibleProjects.map((rec: any) => (
                <div
                  key={rec.role.id}
                  className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => router.push(`/collaborate/projects/${rec.project.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-foreground">{rec.project.title}</h5>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-primary/20 rounded-full">
                          <span className="text-xs font-medium text-primary">
                            {Math.round(rec.compatibility.overall_score)}% match
                          </span>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.role.role_name}</p>
                      {rec.compatibility.matched_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {rec.compatibility.matched_skills.slice(0, 3).map((skill: string) => (
                            <span key={skill} className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-md">
                              {skill}
                            </span>
                          ))}
                          {rec.compatibility.matched_skills.length > 3 && (
                            <span className="text-xs px-2 py-0.5 text-muted-foreground">
                              +{rec.compatibility.matched_skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors">
                      Apply
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/collaborate?tab=for_you')}
              className="w-full text-center py-3 text-sm text-primary hover:text-primary/80 font-medium mt-3"
            >
              View All Project Recommendations →
            </button>
          </div>
        )}

        {/* Gig Recommendations */}
        {matchmakingData.topCompatibleGigs.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Compatible Gigs
            </h4>
            <div className="space-y-3">
              {matchmakingData.topCompatibleGigs.map((rec: Recommendation) => (
                <div
                  key={rec.id}
                  className="p-4 bg-gradient-to-r from-muted/50 to-muted/80 border border-border rounded-xl hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => router.push(`/gigs/${rec.data.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-foreground">{rec.data.title as string}</h5>
                        <CompatibilityScore
                          score={rec.compatibility_score}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mb-1">{rec.data.location_text as string}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{rec.data.comp_type as string}</span>
                        <span>•</span>
                        <span>{new Date(rec.data.start_time as string).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <button className="px-3 py-1.5 bg-foreground text-background text-xs font-medium rounded-lg hover:bg-foreground/90 transition-colors">
                      View
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => router.push('/gigs')}
              className="w-full text-center py-3 text-sm text-primary hover:text-primary/80 font-medium mt-3"
            >
              Browse All Gigs →
            </button>
          </div>
        )}

        {loading && (
          <LoadingSpinner size="md" text="Finding perfect matches..." className="py-8" />
        )}
      </div>
    </div>
  )
}
