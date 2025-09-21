'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Users, MapPin, Star, ExternalLink } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

interface TalentProfile {
  id: string
  display_name: string
  handle: string
  avatar_url?: string
  bio?: string
  city?: string
  style_tags?: string[]
  specializations?: string[]
  years_experience?: number
  compatibility_score?: number
}

interface SimilarTalentSlimProps {
  gigId: string
  className?: string
}

export default function SimilarTalentSlim({ gigId, className = "" }: SimilarTalentSlimProps) {
  const router = useRouter()
  const [talent, setTalent] = useState<TalentProfile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSimilarTalent()
  }, [gigId])

  const fetchSimilarTalent = async () => {
    try {
      setLoading(true)
      
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }

      // Fetch talent profiles with TALENT role
      const { data, error } = await supabase
        .from('users_profile')
        .select(`
          id,
          display_name,
          handle,
          avatar_url,
          bio,
          city,
          style_tags,
          specializations,
          years_experience
        `)
        .contains('role_flags', ['TALENT'])
        .neq('id', (await supabase.from('gigs').select('owner_user_id').eq('id', gigId).single())?.data?.owner_user_id || '')
        .limit(6)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching similar talent:', error)
        return
      }

      // Add mock compatibility scores for now (will be replaced with real calculation)
      const talentWithScores = data?.map(profile => ({
        ...profile,
        compatibility_score: Math.floor(Math.random() * 40) + 60 // 60-100% for demo
      })) || []

      setTalent(talentWithScores)
    } catch (error) {
      console.error('Error in fetchSimilarTalent:', error)
    } finally {
      setLoading(false)
    }
  }

  const getCompatibilityColor = (score: number) => {
    if (score >= 80) return 'text-primary'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-muted-foreground'
  }

  const getCompatibilityLabel = (score: number) => {
    if (score >= 80) return 'Excellent Match'
    if (score >= 60) return 'Good Match'
    return 'Fair Match'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Similar Talent
          </CardTitle>
          <CardDescription>Loading talent profiles...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex-shrink-0 w-48 h-20 bg-muted rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (talent.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5" />
            Similar Talent
          </CardTitle>
          <CardDescription>No matching talent profiles found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Check back later for talent recommendations</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="w-5 h-5" />
          Similar Talent
        </CardTitle>
        <CardDescription>
          Other users who match this gig's requirements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {talent.map((profile) => (
            <div
              key={profile.id}
              className="flex-shrink-0 w-48 bg-muted/20 rounded-lg p-3 border border-border hover:bg-muted/40 transition-colors cursor-pointer group"
              onClick={() => router.push(`/profile/${profile.handle}`)}
            >
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <Avatar className="w-12 h-12 border border-border">
                  <AvatarImage 
                    src={profile.avatar_url || undefined} 
                    alt={profile.display_name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {profile.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-foreground truncate">
                      {profile.display_name}
                    </h4>
                    <Badge 
                      variant="secondary" 
                      className={`text-xs ${getCompatibilityColor(profile.compatibility_score || 0)}`}
                    >
                      {profile.compatibility_score}%
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    {profile.city && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="truncate">{profile.city}</span>
                      </div>
                    )}
                    
                    {profile.years_experience && (
                      <div className="text-xs text-muted-foreground">
                        {profile.years_experience} years experience
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Specializations */}
              {profile.specializations && profile.specializations.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {profile.specializations.slice(0, 2).map((spec, index) => (
                    <Badge key={index} variant="outline" className="text-xs py-0 px-1">
                      {spec}
                    </Badge>
                  ))}
                  {profile.specializations.length > 2 && (
                    <Badge variant="outline" className="text-xs py-0 px-1">
                      +{profile.specializations.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Hover indicator */}
              <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{getCompatibilityLabel(profile.compatibility_score || 0)}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {talent.length >= 6 && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push(`/gigs/${gigId}/applications`)}
            >
              View All Talent
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
