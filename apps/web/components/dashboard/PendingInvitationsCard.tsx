'use client'

import { useRouter } from 'next/navigation'
import { Invitation } from '../../lib/types/dashboard'
import { getDaysUntilExpiry, getUserInitials } from '../../lib/utils/dashboard'
import { LoadingSpinner } from '../ui/loading-spinner'
import { IconBadge } from '../ui/icon-badge'
import { Mail } from 'lucide-react'

interface PendingInvitationsCardProps {
  invitations: Invitation[]
  loading?: boolean
  onAccept: (invitationId: string) => Promise<boolean>
  onDecline: (invitationId: string) => Promise<boolean>
}

export function PendingInvitationsCard({
  invitations,
  loading = false,
  onAccept,
  onDecline
}: PendingInvitationsCardProps) {
  const router = useRouter()

  if (invitations.length === 0) return null

  return (
    <div className="mb-6 max-w-7xl mx-auto">
      <div className="bg-card rounded-2xl p-6 border border-border shadow-xl">
        <div className="flex items-center gap-3 mb-6">
          <IconBadge icon={Mail} size="md" variant="primary" />
          <div>
            <h3 className="text-lg font-bold text-foreground">Pending Invitations</h3>
            <p className="text-sm text-muted-foreground">
              {invitations.length} invitation{invitations.length !== 1 ? 's' : ''} waiting for your response
            </p>
          </div>
          <div className="ml-auto">
            <button
              onClick={() => router.push('/collaborate?tab=invited')}
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View All →
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {loading ? (
            <LoadingSpinner size="md" className="py-8" />
          ) : (
            invitations.slice(0, 3).map((invitation) => {
              const daysUntilExpiry = getDaysUntilExpiry(invitation.expires_at)

              return (
                <div
                  key={invitation.id}
                  className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-xl hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="font-semibold text-foreground">{invitation.project?.title || 'Project'}</h5>
                        {daysUntilExpiry <= 3 && (
                          <span className="text-xs px-2 py-0.5 bg-destructive/10 text-destructive-foreground rounded-full">
                            {daysUntilExpiry}d left
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        {invitation.inviter?.avatar_url ? (
                          <img
                            src={invitation.inviter.avatar_url}
                            alt={invitation.inviter.display_name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-[8px] text-primary-foreground font-medium">
                              {getUserInitials(invitation.inviter?.display_name || '')}
                            </span>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Invited by <span className="font-medium text-foreground">{invitation.inviter?.display_name || 'Unknown'}</span>
                          {invitation.role && ` • ${invitation.role.role_name}`}
                        </p>
                      </div>
                      {invitation.message && (
                        <p className="text-xs text-muted-foreground italic line-clamp-2 mb-2">
                          "{invitation.message}"
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={() => onAccept(invitation.id)}
                        className="px-3 py-1.5 bg-primary text-primary-foreground text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onDecline(invitation.id)}
                        className="px-3 py-1.5 bg-muted text-foreground text-xs font-medium rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {invitations.length > 3 && (
          <button
            onClick={() => router.push('/collaborate?tab=invited')}
            className="w-full text-center py-3 text-sm text-primary hover:text-primary/80 font-medium mt-3"
          >
            View All {invitations.length} Invitations →
          </button>
        )}
      </div>
    </div>
  )
}
