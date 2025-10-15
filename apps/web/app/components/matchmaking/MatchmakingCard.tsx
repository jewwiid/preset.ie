import React from 'react'
import { Card, CardContent, CardHeader, CardFooter } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { MapPin, Calendar, Clock, DollarSign } from 'lucide-react'
import CompatibilityScore from './CompatibilityScore'

interface MatchmakingCardProps {
  type?: 'gig' | 'user'
  data?: any
  user?: {
    id: string
    name: string
    avatar?: string
    bio?: string
    location?: string
    skills?: string[]
  }
  compatibility?: number
  compatibilityScore?: number
  compatibilityBreakdown?: any
  onConnect?: () => void
  onViewDetails?: () => void
  onApply?: () => void
}

// Helper function to get gig image with fallback
const getGigImage = (data: any): string => {
  // Check for moodboard featured image first
  if (data.moodboard?.featured_image_id && data.moodboard?.items) {
    const featuredItem = data.moodboard.items.find((item: any) => item.id === data.moodboard.featured_image_id)
    if (featuredItem) {
      return featuredItem.thumbnail_url || featuredItem.url
    }
  }

  // Fallback to preset logo
  return '/logo.png'
}

// Helper function to get compatibility reason for tooltip
const getCompatibilityReason = (breakdown: any): string => {
  if (!breakdown) return 'Basic compatibility score'

  const reasons = []
  if (breakdown.total >= 80) reasons.push('Excellent match')
  else if (breakdown.total >= 60) reasons.push('Good match')
  else if (breakdown.total >= 40) reasons.push('Fair match')
  else reasons.push('Basic match')

  if (breakdown.experience > 0) reasons.push('Role aligned')
  if (breakdown.specialization > 0) reasons.push('Category aligned')
  if (breakdown.height > 0) reasons.push('Physical attributes')

  return reasons.join(', ')
}

// Helper function to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

// Helper function to format compensation
const formatCompensation = (data: any): string => {
  if (data.comp_details && data.comp_details.trim()) {
    return data.comp_details
  }

  switch (data.comp_type) {
    case 'TFP':
      return 'Trade for Portfolio'
    case 'PAID':
      return 'Paid Opportunity'
    case 'EXPENSES_ONLY':
      return 'Expenses Covered'
    default:
      return 'Compensation Details'
  }
}

export default function MatchmakingCard({
  type = 'user',
  data,
  user,
  compatibility,
  compatibilityScore,
  compatibilityBreakdown,
  onConnect,
  onViewDetails,
  onApply
}: MatchmakingCardProps) {
  // Use the appropriate data source based on type
  const cardData = type === 'gig' ? data : user
  const score = compatibilityScore || compatibility || 0

  if (type === 'gig' && data) {
    const gigImage = getGigImage(data)
    const formattedDate = data.start_time ? formatDate(data.start_time) : 'Flexible'
    const formattedComp = formatCompensation(data)

    return (
      <Card className="w-full max-w-sm mx-auto group hover:shadow-lg transition-all duration-200 border-border">
        {/* Card Header with Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={gigImage}
            alt={data.title || 'Gig preview'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/logo.png'
            }}
          />

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

          {/* Compatibility Score Badge */}
          <div className="absolute top-3 left-3">
            <div className="bg-primary/90 backdrop-blur-sm rounded-full px-3 py-1" title={`${compatibilityBreakdown ? getCompatibilityReason(compatibilityBreakdown) : 'Click to see compatibility details'}`}>
              <span className="text-white text-sm font-semibold">{score}%</span>
            </div>
          </div>

          {/* Location Badge */}
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="bg-black/50 backdrop-blur-sm text-white">
              <MapPin className="w-3 h-3 mr-1" />
              {data.location_text || 'Remote'}
            </Badge>
          </div>
        </div>

        {/* Card Content */}
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Title and Description */}
            <div>
              <h3 className="font-semibold text-foreground line-clamp-2 text-base">
                {data.title}
              </h3>
              {data.description && (
                <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
                  {data.description}
                </p>
              )}
            </div>

            {/* Gig Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{formattedDate}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{formattedComp}</span>
              </div>
            </div>

            {/* Categories */}
            {data.looking_for_types && data.looking_for_types.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.looking_for_types.slice(0, 3).map((category, index) => (
                  <Badge
                    key={index}
                    variant="outline"
                    className="bg-preset-50 text-preset-800 border-preset-200 dark:bg-preset-900/20 dark:text-preset-300"
                  >
                    {category}
                  </Badge>
                ))}
                {data.looking_for_types.length > 3 && (
                  <Badge
                    variant="outline"
                    className="bg-preset-50 text-preset-800 border-preset-200 dark:bg-preset-900/20 dark:text-preset-300"
                  >
                    +{data.looking_for_types.length - 3}
                  </Badge>
                )}
              </div>
            )}

            {/* Compatibility Score */}
            <div className="pt-2 border-t border-border">
              <div className="flex items-center justify-center">
                <CompatibilityScore
                  score={score}
                  breakdown={compatibilityBreakdown}
                  size="sm"
                />
              </div>
            </div>
          </div>
        </CardContent>

        {/* Card Footer with Action Buttons */}
        <CardFooter className="pt-4 pb-6 px-6">
          <div className="grid grid-cols-2 gap-3">
            {onViewDetails && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDetails}
                className="w-full"
              >
                View Details
              </Button>
            )}
            {onApply && (
              <Button
                size="sm"
                onClick={onApply}
                className="w-full"
                disabled={score < 50}
              >
                Apply
              </Button>
            )}
          </div>
        </CardFooter>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm mx-auto group hover:shadow-lg transition-all duration-200 border-border">
      {/* User Header */}
      <CardHeader className="text-center pb-4">
        <div className="flex flex-col items-center space-y-3">
          {/* Avatar */}
          <div className="relative">
            <Avatar className="w-20 h-20">
              <AvatarImage
                src={cardData?.avatar}
                alt={cardData?.name || 'User'}
              />
              <AvatarFallback className="bg-preset-100 text-preset-900 dark:bg-preset-900/20 dark:text-preset-100">
                {cardData?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-preset-500 rounded-full border-2 border-background flex items-center justify-center">
              <span className="text-xs font-semibold text-white">
                {Math.round(score)}%
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      {/* User Info */}
      <CardContent className="pt-0">
        <div className="text-center space-y-3">
          <h3 className="font-semibold text-foreground text-lg">{cardData?.name || 'Unknown User'}</h3>
          {cardData?.location && (
            <div className="flex items-center justify-center gap-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{cardData.location}</p>
            </div>
          )}
          {cardData?.bio && (
            <p className="text-sm text-muted-foreground line-clamp-2">{cardData.bio}</p>
          )}

          {/* Compatibility Score */}
          <div className="pt-2 border-t border-border">
            <CompatibilityScore
              score={score}
              breakdown={compatibilityBreakdown}
              size="sm"
            />
          </div>
        </div>
      </CardContent>

      {/* Skills */}
      {cardData?.skills && cardData.skills.length > 0 && (
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1 justify-center">
            {cardData.skills.slice(0, 3).map((skill, index) => (
              <Badge
                key={index}
                variant="outline"
                className="bg-preset-50 text-preset-800 border-preset-200 dark:bg-preset-900/20 dark:text-preset-300"
              >
                {skill}
              </Badge>
            ))}
            {cardData.skills.length > 3 && (
              <Badge
                variant="outline"
                className="bg-preset-50 text-preset-800 border-preset-200 dark:bg-preset-900/20 dark:text-preset-300"
              >
                +{cardData.skills.length - 3}
              </Badge>
            )}
          </div>
        </CardContent>
      )}

      {/* Action Button */}
      <CardFooter className="pt-0">
        {onConnect && (
          <Button
            onClick={onConnect}
            className="w-full"
            variant="outline"
            disabled={score < 50}
          >
            Connect
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
