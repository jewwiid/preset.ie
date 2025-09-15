import React from 'react'
import { Card, CardContent } from '../../../components/ui/card'
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
    return (
      <Card className="w-full max-w-sm mx-auto">
        <CardContent className="p-6">
          <div className="flex flex-col space-y-4">
            {/* Gig Title */}
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{data.title}</h3>
              <p className="text-sm text-gray-600">{data.location_text}</p>
              {data.description && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{data.description}</p>
              )}
            </div>

            {/* Compatibility Score */}
            <div className="flex justify-center">
              <CompatibilityScore 
                score={score} 
                breakdown={compatibilityBreakdown}
                size="md"
              />
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              {onViewDetails && (
                <button
                  onClick={onViewDetails}
                  className="w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors"
                >
                  View Details
                </button>
              )}
              {onApply && (
                <button
                  onClick={onApply}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Apply
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-sm mx-auto">
      <CardContent className="p-6">
        <div className="flex flex-col items-center space-y-4">
          {/* Avatar */}
          <div className="relative">
            <img
              src={cardData?.avatar || '/default-avatar.png'}
              alt={cardData?.name || 'User'}
              className="w-20 h-20 rounded-full object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          {/* User Info */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900">{cardData?.name || 'Unknown User'}</h3>
            {cardData?.location && (
              <p className="text-sm text-gray-600">{cardData.location}</p>
            )}
            {cardData?.bio && (
              <p className="text-sm text-gray-500 mt-2 line-clamp-2">{cardData.bio}</p>
            )}
          </div>

          {/* Compatibility Score */}
          <CompatibilityScore 
            score={score} 
            breakdown={compatibilityBreakdown}
            size="md"
          />

          {/* Skills */}
          {cardData?.skills && cardData.skills.length > 0 && (
            <div className="flex flex-wrap gap-1 justify-center">
              {cardData.skills.slice(0, 3).map((skill: string, index: number) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {skill}
                </span>
              ))}
              {cardData.skills.length > 3 && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                  +{cardData.skills.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Connect Button */}
          {onConnect && (
            <button
              onClick={onConnect}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
