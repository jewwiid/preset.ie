'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { RecentGig } from '../../lib/types/dashboard'

interface RecentGigsCardProps {
  gigs: RecentGig[]
  isContributor: boolean
}

export function RecentGigsCard({ gigs, isContributor }: RecentGigsCardProps) {
  const router = useRouter()
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">
              {isContributor ? 'My Recent Gigs' : 'Recent Gigs'}
            </h3>
            {/* Mobile summary when collapsed */}
            {!isExpanded && (
              <p className="text-xs text-muted-foreground mt-1 lg:hidden">
                {gigs.length > 0
                  ? `${gigs.length} recent ${gigs.length === 1 ? 'gig' : 'gigs'}`
                  : 'No recent gigs'
                }
              </p>
            )}
          </div>
        </div>

        {/* Mobile expand/collapse button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          aria-label={isExpanded ? 'Collapse gigs' : 'Expand gigs'}
        >
          <svg
            className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
              isExpanded ? 'rotate-180' : ''
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className={`space-y-3 transition-all duration-300 ease-in-out overflow-hidden lg:max-h-none lg:opacity-100 ${
        isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
      }`}>
        {gigs.length > 0 ? (
          gigs.map((gig) => (
            <div key={gig.id} className="p-4 bg-muted rounded-xl hover:bg-accent transition-colors cursor-pointer">
              <h4 className="font-medium text-foreground text-sm mb-1">{gig.title}</h4>
              <p className="text-xs text-muted-foreground mb-2">{gig.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-primary">{gig.comp_type}</span>
                <span className="text-xs text-muted-foreground">{gig.location_text}</span>
              </div>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-muted-foreground">
                  {new Date(gig.created_at).toLocaleDateString()}
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  gig.status === 'PUBLISHED'
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {gig.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p className="text-sm">
              {isContributor ? 'No gigs created yet' : 'No recent gigs available'}
            </p>
          </div>
        )}
        {gigs.length > 0 && (
          <button
            onClick={() => router.push(isContributor ? '/gigs/my-gigs' : '/gigs')}
            className="w-full text-center py-3 text-sm text-primary hover:text-primary/80 font-medium"
          >
            {isContributor ? 'View All My Gigs' : 'Browse All Gigs'} →
          </button>
        )}
      </div>
    </div>
  )
}
