'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { MapPin, Calendar, DollarSign, Clock, Users, Star } from 'lucide-react'
import CompatibilityScore from './CompatibilityScore'
import { MatchmakingCardProps, Gig, UserProfile } from '../../lib/types/matchmaking'

const MatchmakingCard: React.FC<MatchmakingCardProps> = ({
  type,
  data,
  compatibilityScore,
  compatibilityBreakdown,
  onViewDetails,
  onApply,
  className = ''
}) => {
  const isGig = type === 'gig'
  const gig = isGig ? data as Gig : null
  const user = !isGig ? data as UserProfile : null

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

  const getCompensationBadge = (compType: string) => {
    const types = {
      'TFP': { label: 'TFP', variant: 'secondary' as const },
      'PAID': { label: 'Paid', variant: 'default' as const },
      'EXPENSES_ONLY': { label: 'Expenses Only', variant: 'outline' as const }
    }
    return types[compType as keyof typeof types] || { label: compType, variant: 'outline' as const }
  }

  const getExperienceBadge = (years?: number) => {
    if (!years) return null
    if (years >= 5) return { label: 'Expert', variant: 'default' as const }
    if (years >= 3) return { label: 'Advanced', variant: 'secondary' as const }
    if (years >= 1) return { label: 'Intermediate', variant: 'outline' as const }
    return { label: 'Beginner', variant: 'outline' as const }
  }

  return (
    <Card className={`matchmaking-card hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold line-clamp-2">
              {isGig ? gig?.title : user?.display_name}
            </CardTitle>
            
            {isGig && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground-600">
                <MapPin className="w-4 h-4" />
                <span>{gig?.location_text}</span>
              </div>
            )}
            
            {!isGig && user?.city && (
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground-600">
                <MapPin className="w-4 h-4" />
                <span>{user.city}, {user.country}</span>
              </div>
            )}
          </div>
          
          <div className="ml-4">
            <CompatibilityScore
              score={compatibilityScore}
              breakdown={compatibilityBreakdown}
              size="sm"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Description/Bio */}
        <p className="text-sm text-muted-foreground-700 line-clamp-2 mb-4">
          {isGig ? gig?.description : user?.bio}
        </p>

        {/* Gig-specific details */}
        {isGig && gig && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar className="w-4 h-4 text-muted-foreground-500" />
                <span>{formatDate(gig.start_time)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-muted-foreground-500" />
                <span>{formatTime(gig.start_time)}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground-500" />
              <Badge variant={getCompensationBadge(gig.comp_type).variant}>
                {getCompensationBadge(gig.comp_type).label}
              </Badge>
            </div>
          </div>
        )}

        {/* User-specific details */}
        {!isGig && user && (
          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user.avatar_url} alt={user.display_name} />
                <AvatarFallback>
                  {user.display_name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">@{user.handle}</p>
                {user.years_experience && (
                  <Badge variant={getExperienceBadge(user.years_experience)?.variant || 'outline'}>
                    {getExperienceBadge(user.years_experience)?.label}
                  </Badge>
                )}
              </div>
            </div>
            
            {user.specializations && user.specializations.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {user.specializations.slice(0, 3).map((spec, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {spec}
                  </Badge>
                ))}
                {user.specializations.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{user.specializations.length - 3} more
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex-1"
          >
            View Details
          </Button>
          
          {onApply && (
            <Button
              size="sm"
              onClick={onApply}
              className="flex-1 bg-preset-500 hover:bg-preset-600"
            >
              {isGig ? 'Apply' : 'Contact'}
            </Button>
          )}
        </div>

        {/* Compatibility Indicators */}
        <div className="mt-3 pt-3 border-t border-border-100">
          <div className="flex items-center justify-between text-xs text-muted-foreground-500">
            <span>Match Quality</span>
            <div className="flex items-center gap-1">
              {compatibilityScore >= 80 && <Star className="w-3 h-3 fill-primary-primary text-primary-400" />}
              {compatibilityScore >= 60 && <Star className="w-3 h-3 fill-primary-primary text-primary-400" />}
              <span className="ml-1">{compatibilityScore}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MatchmakingCard
