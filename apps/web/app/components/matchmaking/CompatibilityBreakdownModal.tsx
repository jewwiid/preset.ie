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
  
  // Handle different data structures - create factors from breakdown if not available
  const compatibilityFactors = factors || {
    gender_match: (breakdown as any)?.role_match > 0 || breakdown?.gender > 0 || false,
    age_match: (breakdown as any)?.base_score > 0 || breakdown?.age > 0 || false,
    height_match: (breakdown as any)?.style_match > 0 || breakdown?.height > 0 || false,
    experience_match: (breakdown as any)?.location_match > 0 || breakdown?.experience > 0 || false,
    specialization_match: (breakdown as any)?.role_match > 0 || breakdown?.specialization > 0 || false
  }

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
        <CheckCircle className="w-5 h-5 text-primary" />
      ) : (
        <XCircle className="w-5 h-5 text-destructive" />
      )
    }
    return <Info className="w-5 h-5 text-muted-foreground" />
  }

  const getFactorLabel = (match: boolean | number, factorName: string) => {
    if (typeof match === 'boolean') {
      return match ? 'Perfect Match' : 'No Match'
    }
    return `${match}% Match`
  }

  const getFactorColor = (match: boolean | number) => {
    if (typeof match === 'boolean') {
      return match ? 'text-primary' : 'text-destructive'
    }
    if (match >= 80) return 'text-primary'
    if (match >= 60) return 'text-warning'
    return 'text-destructive'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Compatibility Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Overall Score and Breakdown */}
          <div className="space-y-6">
            {/* Overall Score */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Overall Compatibility
                </CardTitle>
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
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  Detailed Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Compatibility Factors Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gender Match */}
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Gender</p>
                        <p className="text-xs text-muted-foreground">Identity matching</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getFactorIcon(compatibilityFactors.gender_match)}
                      <span className={`text-sm font-medium ${getFactorColor(compatibilityFactors.gender_match)}`}>
                        {getFactorLabel(compatibilityFactors.gender_match, 'gender')}
                      </span>
                    </div>
                  </div>

                  {/* Age Match */}
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Age</p>
                        <p className="text-xs text-muted-foreground">Range requirements</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getFactorIcon(compatibilityFactors.age_match)}
                      <span className={`text-sm font-medium ${getFactorColor(compatibilityFactors.age_match)}`}>
                        {getFactorLabel(compatibilityFactors.age_match, 'age')}
                      </span>
                    </div>
                  </div>

                  {/* Height Match */}
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Height</p>
                        <p className="text-xs text-muted-foreground">Range requirements</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getFactorIcon(compatibilityFactors.height_match)}
                      <span className={`text-sm font-medium ${getFactorColor(compatibilityFactors.height_match)}`}>
                        {getFactorLabel(compatibilityFactors.height_match, 'height')}
                      </span>
                    </div>
                  </div>

                  {/* Experience Match */}
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Award className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Experience</p>
                        <p className="text-xs text-muted-foreground">Years matching</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getFactorIcon(compatibilityFactors.experience_match)}
                      <span className={`text-sm font-medium ${getFactorColor(compatibilityFactors.experience_match)}`}>
                        {getFactorLabel(compatibilityFactors.experience_match, 'experience')}
                      </span>
                    </div>
                  </div>

                  {/* Specialization Match */}
                  <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg border border-border">
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-foreground">Skills</p>
                        <p className="text-xs text-muted-foreground">Specializations</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getFactorIcon(compatibilityFactors.specialization_match)}
                      <span className={`text-sm font-medium ${getFactorColor(compatibilityFactors.specialization_match)}`}>
                        {getFactorLabel(compatibilityFactors.specialization_match, 'specialization')}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Gig and User Details */}
          <div className="space-y-6">
            {/* Gig Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-primary" />
                  Gig Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-foreground">{gig.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{gig.description}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-muted/10 rounded-md">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{gig.location_text}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 bg-muted/10 rounded-md">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{formatDate(gig.start_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-3 p-2 bg-muted/10 rounded-md">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">{formatTime(gig.start_time)} - {formatTime(gig.end_time)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* User Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  Talent Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar className="w-12 h-12 border border-border">
                    <AvatarImage src={userProfile.avatar_url || undefined} alt={userProfile.display_name} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {userProfile.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-semibold text-foreground">{userProfile.display_name}</h4>
                    <p className="text-sm text-muted-foreground">@{userProfile.handle}</p>
                  </div>
                </div>
                
                {userProfile.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{userProfile.bio}</p>
                )}
                
                <div className="space-y-3">
                  {userProfile.city && (
                    <div className="flex items-center gap-3 p-2 bg-muted/10 rounded-md">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{userProfile.city}, {userProfile.country}</span>
                    </div>
                  )}
                  
                  {userProfile.years_experience && (
                    <div className="flex items-center gap-3 p-2 bg-muted/10 rounded-md">
                      <Award className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{userProfile.years_experience} years experience</span>
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
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => {
            // TODO: Navigate to application or contact
            onClose()
          }}>
            Apply to Gig
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default CompatibilityBreakdownModal
