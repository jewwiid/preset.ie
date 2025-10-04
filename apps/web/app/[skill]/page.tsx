'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '../../lib/supabase'
import { Card, CardContent } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { MapPin, Briefcase, ArrowLeft } from 'lucide-react'

interface DirectoryProfile {
  id: string
  user_id: string
  display_name: string
  handle: string
  avatar_url: string
  bio: string
  city: string
  country: string
  primary_skill: string
  role_flags: string[]
  specializations: string[]
  talent_categories: string[]
  style_tags: string[]
  vibe_tags: string[]
  years_experience: number
  experience_level: string
  hourly_rate_min: number
  hourly_rate_max: number
  available_for_travel: boolean
  profile_completion_percentage: number
  account_status: string
  created_at: string
}

export default function SkillDirectoryPage() {
  const params = useParams()
  const skill = decodeURIComponent(params.skill as string)

  const [profiles, setProfiles] = useState<DirectoryProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProfiles()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill])

  const fetchProfiles = async () => {
    try {
      setLoading(true)
      setError(null)

      // Normalize the skill from URL (e.g., "photographers" -> "photographer")
      const normalizedSkill = skill.toLowerCase()
        .replace(/-/g, ' ') // Replace hyphens with spaces
        .replace(/ies$/, 'y') // "agencies" -> "agency"
        .replace(/s$/, '') // "photographers" -> "photographer"

      if (!supabase) {
        setError('Database connection not available')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('directory_profiles')
        .select('*')
        .ilike('primary_skill', `%${normalizedSkill}%`)
        .order('created_at', { ascending: false })
        .limit(100)

      if (fetchError) {
        console.error('Error fetching directory profiles:', fetchError)
        setError('Failed to load profiles')
        return
      }

      setProfiles(data || [])
    } catch (err) {
      console.error('Directory fetch error:', err)
      setError('An error occurred while loading profiles')
    } finally {
      setLoading(false)
    }
  }

  const formatSkillTitle = (skill: string) => {
    // Pluralize skill names for directory title
    const plural = skill.endsWith('y')
      ? skill.slice(0, -1) + 'ies'
      : skill.endsWith('s')
      ? skill
      : skill + 's'
    return plural
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">
                {formatSkillTitle(skill)}
              </h1>
              <p className="text-xl text-muted-foreground">
                {profiles.length} {profiles.length === 1 ? 'professional' : 'professionals'} found
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Empty State */}
        {!loading && profiles.length === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No {skill.toLowerCase()}s found
              </h3>
              <p className="text-muted-foreground">
                Check back soon as more professionals join the platform
              </p>
            </CardContent>
          </Card>
        )}

        {/* Profiles Grid */}
        {profiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {profiles.map((profile) => (
              <Link
                key={profile.id}
                href={`/profile/${profile.handle}`}
                className="group"
              >
                <Card className="h-full hover:shadow-xl transition-shadow duration-300">
                  <CardContent className="p-0">
                    {/* Profile Image */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-t-lg">
                      <Image
                        src={profile.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg'}
                        alt={profile.display_name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg'
                          if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                            (e.target as HTMLImageElement).src = fallbackUrl
                          }
                        }}
                      />

                      {/* Experience Badge */}
                      {profile.years_experience > 0 && (
                        <div className="absolute top-3 right-3">
                          <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm">
                            {profile.years_experience} {profile.years_experience === 1 ? 'year' : 'years'}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Profile Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground text-lg mb-1 truncate">
                        {profile.display_name}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        @{profile.handle}
                      </p>

                      {/* Location */}
                      {(profile.city || profile.country) && (
                        <div className="flex items-center text-sm text-muted-foreground mb-3">
                          <MapPin className="w-4 h-4 mr-1" />
                          <span className="truncate">
                            {profile.city && profile.country
                              ? `${profile.city}, ${profile.country}`
                              : profile.city || profile.country}
                          </span>
                        </div>
                      )}

                      {/* Bio */}
                      {profile.bio && (
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {profile.bio}
                        </p>
                      )}

                      {/* Style Tags */}
                      {profile.style_tags && profile.style_tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {profile.style_tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {profile.style_tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{profile.style_tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
