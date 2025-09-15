'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Progress } from '../../../components/ui/progress'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Award, 
  Target, 
  MapPin, 
  Clock,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import CompatibilityScore from './CompatibilityScore'
import { CompatibilityBreakdownModalProps } from '../../../lib/types/matchmaking'

const CompatibilityBreakdownModal: React.FC<CompatibilityBreakdownModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  gig,
  compatibilityData
}) => {
  const { score, breakdown, factors } = compatibilityData

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const getFactorIcon = (match: boolean | number) => {
    if (typeof match === 'boolean') {
      return match ? (
        <CheckCircle className="w-5 h-5 text-green-500" />
      ) : (
        <XCircle className="w-5 h-5 text-red-500" />
      )
    }
    return <Info className="w-5 h-5 text-blue-500" />
  }

  const getFactorLabel = (match: boolean | number, factorName: string) => {
    if (typeof match === 'boolean') {
      return match ? 'Perfect Match' : 'No Match'
    }
    return `${match}% Match`
  }

  const getFactorColor = (match: boolean | number) => {
    if (typeof match === 'boolean') {
      return match ? 'text-green-600' : 'text-red-600'
    }
    if (match >= 80) return 'text-green-600'
    if (match >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Compatibility Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Overall Score */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Overall Compatibility</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <CompatibilityScore
                  score={score}
                  breakdown={breakdown}
                  size="lg"
                  showBreakdown={false}
                />
              </div>
            </CardContent>
          </Card>

          {/* Detailed Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Detailed Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Gender Match */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Gender Compatibility</p>
                    <p className="text-sm text-gray-600">Gender identity matching</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getFactorIcon(factors.gender_match)}
                  <span className={`font-medium ${getFactorColor(factors.gender_match)}`}>
                    {getFactorLabel(factors.gender_match, 'gender')}
                  </span>
                </div>
              </div>

              {/* Age Match */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Age Compatibility</p>
                    <p className="text-sm text-gray-600">Age range requirements</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getFactorIcon(factors.age_match)}
                  <span className={`font-medium ${getFactorColor(factors.age_match)}`}>
                    {getFactorLabel(factors.age_match, 'age')}
                  </span>
                </div>
              </div>

              {/* Height Match */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Height Compatibility</p>
                    <p className="text-sm text-gray-600">Height range requirements</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getFactorIcon(factors.height_match)}
                  <span className={`font-medium ${getFactorColor(factors.height_match)}`}>
                    {getFactorLabel(factors.height_match, 'height')}
                  </span>
                </div>
              </div>

              {/* Experience Match */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Experience Compatibility</p>
                    <p className="text-sm text-gray-600">Years of experience matching</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getFactorIcon(factors.experience_match)}
                  <span className={`font-medium ${getFactorColor(factors.experience_match)}`}>
                    {getFactorLabel(factors.experience_match, 'experience')}
                  </span>
                </div>
              </div>

              {/* Specialization Match */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Target className="w-5 h-5 text-gray-600" />
                  <div>
                    <p className="font-medium">Specialization Compatibility</p>
                    <p className="text-sm text-gray-600">Skills and specializations</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getFactorIcon(factors.specialization_match)}
                  <span className={`font-medium ${getFactorColor(factors.specialization_match)}`}>
                    {getFactorLabel(factors.specialization_match, 'specialization')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gig and User Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Gig Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gig Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium">{gig.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{gig.description}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span>{gig.location_text}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{formatDate(gig.start_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{formatTime(gig.start_time)} - {formatTime(gig.end_time)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Talent Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={userProfile.avatar_url} alt={userProfile.display_name} />
                    <AvatarFallback>
                      {userProfile.display_name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{userProfile.display_name}</h4>
                    <p className="text-sm text-gray-600">@{userProfile.handle}</p>
                  </div>
                </div>
                
                {userProfile.bio && (
                  <p className="text-sm text-gray-700">{userProfile.bio}</p>
                )}
                
                <div className="space-y-2">
                  {userProfile.city && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{userProfile.city}, {userProfile.country}</span>
                    </div>
                  )}
                  
                  {userProfile.years_experience && (
                    <div className="flex items-center gap-2 text-sm">
                      <Award className="w-4 h-4 text-gray-500" />
                      <span>{userProfile.years_experience} years experience</span>
                    </div>
                  )}
                </div>
                
                {userProfile.specializations && userProfile.specializations.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Specializations:</p>
                    <div className="flex flex-wrap gap-1">
                      {userProfile.specializations.map((spec, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button className="bg-preset-500 hover:bg-preset-600">
              Apply to Gig
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CompatibilityBreakdownModal
