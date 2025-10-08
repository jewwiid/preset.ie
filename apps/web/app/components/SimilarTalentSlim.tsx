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
    if (score >= 60) return 'text-primary'
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
        <div className="flex gap-4 overflow-x-auto pb-2">
          {talent.map((profile) => (
            <div
              key={profile.id}
              className="flex-shrink-0 group cursor-pointer"
              onClick={() => router.push(`/users/${profile.handle}`)}
            >
              <div className="relative">
                {/* Avatar */}
                <Avatar className="w-20 h-20 border-2 border-border group-hover:border-primary transition-colors">
                  <AvatarImage
                    src={profile.avatar_url || undefined}
                    alt={profile.display_name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                    {profile.display_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>

                {/* Compatibility Badge - Overlay on bottom */}
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2">
                  <Badge className="text-xs font-bold px-2 py-1 shadow-lg bg-primary text-primary-foreground">
                    {profile.compatibility_score}%
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        {talent.length >= 6 && (
          <div className="mt-6 text-center">
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
