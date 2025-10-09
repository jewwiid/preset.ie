'use client'

import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Briefcase, Users, ArrowRight, Mail } from 'lucide-react'

interface AllInvitationsCardProps {
  gigInvitationsCount: number
  collabInvitationsCount: number
  loading?: boolean
}

export function AllInvitationsCard({
  gigInvitationsCount,
  collabInvitationsCount,
  loading = false
}: AllInvitationsCardProps) {
  const totalInvitations = gigInvitationsCount + collabInvitationsCount

  // Don't show card if there are no invitations
  if (!loading && totalInvitations === 0) {
    return null
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <CardTitle>My Invitations</CardTitle>
            {totalInvitations > 0 && (
              <Badge variant="default" className="ml-2">
                {totalInvitations}
              </Badge>
            )}
          </div>
        </div>
        <CardDescription>
          View and manage all your invitations in one place
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Gig Invitations */}
          <Link href="/dashboard/invitations?type=gigs">
            <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Gig Invitations</h4>
                  <p className="text-xs text-muted-foreground">
                    {gigInvitationsCount === 0 
                      ? 'No pending invitations' 
                      : gigInvitationsCount === 1
                      ? '1 pending invitation'
                      : `${gigInvitationsCount} pending invitations`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {gigInvitationsCount > 0 && (
                  <Badge variant="secondary">
                    {gigInvitationsCount}
                  </Badge>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>

          {/* Collaboration Invitations */}
          <Link href="/dashboard/invitations?type=collabs">
            <div className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium text-sm">Collaboration Invitations</h4>
                  <p className="text-xs text-muted-foreground">
                    {collabInvitationsCount === 0 
                      ? 'No pending invitations' 
                      : collabInvitationsCount === 1
                      ? '1 pending invitation'
                      : `${collabInvitationsCount} pending invitations`
                    }
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {collabInvitationsCount > 0 && (
                  <Badge variant="secondary">
                    {collabInvitationsCount}
                  </Badge>
                )}
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          </Link>
        </div>

        {/* View All Button */}
        {totalInvitations > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Link href="/dashboard/invitations">
              <Button variant="ghost" className="w-full group">
                View All Invitations
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

