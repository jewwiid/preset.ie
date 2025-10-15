'use client'

import React from 'react'
import { MapPin, Calendar, Users, DollarSign, ExternalLink, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'

// Types
import { MapGig } from '@/app/gigs/types'

type Gig = MapGig

interface GigsMapSidebarProps {
  gigs: Gig[]
  selectedGig?: Gig | null
  onGigSelect: (gig: Gig) => void
  onGigView: (gig: Gig) => void
  className?: string
}

export default function GigsMapSidebar({
  gigs,
  selectedGig,
  onGigSelect,
  onGigView,
  className = ''
}: GigsMapSidebarProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getCompTypeColor = (compType: string) => {
    switch (compType) {
      case 'PAID': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'TFP': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'EXPENSES': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getCompTypeIcon = (compType: string) => {
    switch (compType) {
      case 'PAID': return <DollarSign className="w-4 h-4" />
      case 'TFP': return <Users className="w-4 h-4" />
      case 'EXPENSES': return <DollarSign className="w-4 h-4" />
      default: return <Users className="w-4 h-4" />
    }
  }

  if (gigs.length === 0) {
    return (
      <div className={`bg-background border-l border-border ${className}`}>
        <div className="p-6 text-center">
          <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No gigs in this area</h3>
          <p className="text-sm text-muted-foreground">
            Try panning the map to explore different locations
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-background border-l border-border overflow-hidden flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">
          Gigs in View
        </h2>
        <p className="text-sm text-muted-foreground">
          {gigs.length} gig{gigs.length !== 1 ? 's' : ''} found
        </p>
      </div>

      {/* Gigs List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {gigs.map((gig) => (
            <Card
              key={gig.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                selectedGig?.id === gig.id
                  ? 'ring-2 ring-primary shadow-md'
                  : 'hover:shadow-sm'
              }`}
              onClick={() => onGigSelect(gig)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold text-foreground line-clamp-2">
                    {gig.title}
                  </CardTitle>
                  <Badge className={`${getCompTypeColor(gig.comp_type)} flex items-center gap-1`}>
                    {getCompTypeIcon(gig.comp_type)}
                    {gig.comp_type}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {gig.description}
                </p>
                
                {/* Location */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{gig.location_text}</span>
                </div>
                
                {/* Date & Time */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
                  <Calendar className="w-4 h-4 flex-shrink-0" />
                  <span>{formatDate(gig.start_time)}</span>
                  <span className="text-xs">•</span>
                  <span>{formatTime(gig.start_time)}</span>
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      onGigView(gig)
                    }}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => {
                      e.stopPropagation()
                      window.open(`/gigs/${gig.id}`, '_blank')
                    }}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border bg-muted/30">
        <p className="text-xs text-muted-foreground text-center">
          Click on gigs in the map or list to view details
        </p>
      </div>
    </div>
  )
}
