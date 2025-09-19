'use client'

import React, { useState, useEffect } from 'react'
import { useProfile, useProfileEditing } from '../context/ProfileContext'
import { ProfileCompletionCard } from './ProfileCompletionCard'
import { UserRatingDisplay } from './UserRatingDisplay'
import { supabase } from '../../../lib/supabase'
import CompatibilityScore from '../../matchmaking/CompatibilityScore'
import MatchmakingCard from '../../matchmaking/MatchmakingCard'
import { Recommendation } from '../../../lib/types/matchmaking'
import { 
  User, 
  Briefcase, 
  Camera, 
  Palette, 
  MapPin, 
  Calendar, 
  Award, 
  Star, 
  Globe, 
  Phone, 
  Mail, 
  Languages, 
  Settings, 
  Eye,
  Heart,
  Users,
  Clock,
  DollarSign,
  CheckCircle,
  XCircle,
  Edit3,
  Save,
  X,
  Target,
  TrendingUp
} from 'lucide-react'

export function ProfileContentEnhanced() {
  const { profile } = useProfile()
  const { isEditing } = useProfileEditing()
  const [userRating, setUserRating] = useState<{ average: number; total: number } | null>(null)
  const [stats, setStats] = useState({
    totalGigs: 0,
    totalShowcases: 0
  })
  
  // Matchmaking state
  const [compatibleGigs, setCompatibleGigs] = useState<Recommendation[]>([])
  const [matchmakingLoading, setMatchmakingLoading] = useState(false)

  useEffect(() => {
    if (profile?.id) {
      fetchUserRating()
      fetchCompatibleGigs()
      fetchStats()
    }
  }, [profile?.id])

  const fetchStats = async () => {
    try {
      if (!supabase || !profile?.id) return

      // Fetch gig count (gigs where user is owner)
      const { data: gigsData, error: gigsError } = await supabase
        .from('gigs')
        .select('id', { count: 'exact' })
        .eq('owner_user_id', profile.id)

      if (gigsError) {
        console.error('Error fetching gigs count:', gigsError)
      }

      // Fetch showcase count (showcases where user is creator or talent)
      const { data: showcasesData, error: showcasesError } = await supabase
        .from('showcases')
        .select('id', { count: 'exact' })
        .or(`creator_user_id.eq.${profile.id},talent_user_id.eq.${profile.id}`)

      if (showcasesError) {
        console.error('Error fetching showcases count:', showcasesError)
      }

      setStats({
        totalGigs: gigsData?.length || 0,
        totalShowcases: showcasesData?.length || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const fetchUserRating = async () => {
    try {
      if (!supabase || !profile?.id) return

      const { data: reviews, error } = await supabase
        .from('reviews')
        .select('rating')
        .eq('reviewed_user_id', profile.id)

      if (error) {
        console.error('Error fetching reviews:', error)
        return
      }

      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
        const averageRating = totalRating / reviews.length
        setUserRating({
          average: averageRating,
          total: reviews.length
        })
      } else {
        setUserRating(null)
      }
    } catch (error) {
      console.error('Error fetching user rating:', error)
    }
  }

  const fetchCompatibleGigs = async () => {
    try {
      if (!supabase || !profile?.id) return
      
      setMatchmakingLoading(true)
      
      // Only fetch for talent users - check if user has talent-related fields
      const isTalent = profile.talent_categories && profile.talent_categories.length > 0
      if (!isTalent) return

      const { data: compatibleGigs, error } = await supabase
        .rpc('find_compatible_gigs_for_user', {
          p_profile_id: profile.id,
          p_limit: 6
        })

      if (error) {
        console.error('Error fetching compatible gigs:', error)
        return
      }

      if (compatibleGigs) {
        const gigRecommendations = compatibleGigs.map((gig: any) => ({
          id: gig.gig_id,
          type: 'gig' as const,
          data: {
            id: gig.gig_id,
            title: gig.title,
            description: 'Compatible gig based on your profile',
            location_text: gig.location_text,
            start_time: gig.start_time,
            end_time: gig.start_time,
            comp_type: 'TFP',
            owner_user_id: 'unknown',
            status: 'PUBLISHED',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          compatibility_score: gig.compatibility_score,
          compatibility_breakdown: {
            gender: gig.match_factors.gender_match ? 20 : 0,
            age: gig.match_factors.age_match ? 20 : 0,
            height: gig.match_factors.height_match ? 15 : 0,
            experience: gig.match_factors.experience_match ? 25 : 0,
            specialization: typeof gig.match_factors.specialization_match === 'number' ? 
              (gig.match_factors.specialization_match / gig.match_factors.total_required) * 20 : 
              gig.match_factors.specialization_match ? 20 : 0,
            total: gig.compatibility_score
          },
          reason: 'Matches your profile',
          priority: gig.compatibility_score >= 80 ? 'high' as const : 
                   gig.compatibility_score >= 60 ? 'medium' as const : 'low' as const
        }))

        setCompatibleGigs(gigRecommendations)
      }
    } catch (error) {
      console.error('Error fetching compatible gigs:', error)
    } finally {
      setMatchmakingLoading(false)
    }
  }

  // Overview Cards Data (excluding Profile Completion which is now a full-width card)
  const overviewCards = [
    {
      title: 'Total Gigs',
      value: stats.totalGigs.toString(),
      icon: Briefcase,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20',
      description: 'Gigs you\'ve posted or applied to'
    },
    {
      title: 'Showcases',
      value: stats.totalShowcases.toString(),
      icon: Camera,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20',
      description: 'Portfolio showcases created'
    },
    {
      title: 'Rating',
      value: userRating ? userRating.average.toFixed(1) : 'N/A',
      icon: Star,
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20',
      description: userRating ? `Based on ${userRating.total} review${userRating.total !== 1 ? 's' : ''}` : 'No ratings yet'
    }
  ]

  // Professional Information
  const professionalInfo = [
    {
      label: 'Years of Experience',
      value: profile?.years_experience ? `${profile.years_experience} years` : 'Not specified',
      icon: Calendar,
      editable: true
    },
    {
      label: 'Specializations',
      value: profile?.specializations && profile.specializations.length > 0 ? profile.specializations.join(', ') : 'Not specified',
      icon: Award,
      editable: true
    },
    {
      label: 'Hourly Rate',
      value: profile?.hourly_rate_min ? `€${profile.hourly_rate_min} - €${profile.hourly_rate_max || 'N/A'}` : 'Not specified',
      icon: DollarSign,
      editable: true
    },
    {
      label: 'Turnaround Time',
      value: profile?.typical_turnaround_days ? `${profile.typical_turnaround_days} days` : 'Not specified',
      icon: Clock,
      editable: true
    }
  ]

  // Contact Information
  const contactInfo = [
    {
      label: 'Phone',
      value: profile?.phone_number || 'Not provided',
      icon: Phone,
      editable: true
    },
    {
      label: 'Email',
      value: 'Contact via profile', // Email is not stored in profile, handled by auth
      icon: Mail,
      editable: false
    },
    {
      label: 'Location',
      value: profile?.city && profile?.country ? `${profile.city}, ${profile.country}` : 'Not specified',
      icon: MapPin,
      editable: true
    },
    {
      label: 'Languages',
      value: profile?.languages && profile.languages.length > 0 ? profile.languages.join(', ') : 'Not specified',
      icon: Languages,
      editable: true
    }
  ]

  // Equipment & Software
  const equipmentInfo = [
    {
      label: 'Equipment',
      value: profile?.equipment_list && profile.equipment_list.length > 0 ? profile.equipment_list.slice(0, 3).join(', ') + (profile.equipment_list.length > 3 ? ` +${profile.equipment_list.length - 3} more` : '') : 'Not specified',
      icon: Camera,
      editable: true
    },
    {
      label: 'Editing Software',
      value: profile?.editing_software && profile.editing_software.length > 0 ? profile.editing_software.slice(0, 3).join(', ') + (profile.editing_software.length > 3 ? ` +${profile.editing_software.length - 3} more` : '') : 'Not specified',
      icon: Settings,
      editable: true
    },
    {
      label: 'Travel Availability',
      value: profile?.available_for_travel ? `Yes (${profile.travel_radius_km}km radius)` : 'No',
      icon: Globe,
      editable: true
    },
    {
      label: 'Studio',
      value: profile?.has_studio ? profile.studio_name || 'Yes' : 'No',
      icon: Briefcase,
      editable: true
    }
  ]

  // Physical Attributes (for talent)
  const physicalInfo = profile?.talent_categories && profile.talent_categories.length > 0 ? [
    {
      label: 'Height',
      value: profile?.height_cm ? `${profile.height_cm}cm` : 'Not specified',
      icon: Users,
      editable: true
    },
    {
      label: 'Measurements',
      value: profile?.measurements || 'Not specified',
      icon: Users,
      editable: true
    },
    {
      label: 'Eye Color',
      value: profile?.eye_color || 'Not specified',
      icon: Eye,
      editable: true
    },
    {
      label: 'Hair Color',
      value: profile?.hair_color || 'Not specified',
      icon: Palette,
      editable: true
    }
  ] : []

  const renderEditableField = (item: any) => {
    if (isEditing && item.editable) {
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            defaultValue={item.value}
            className="flex-1 px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button className="p-1 text-green-600 hover:text-green-700">
            <Save className="w-4 h-4" />
          </button>
          <button className="p-1 text-red-600 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )
    }
    return <span className="text-sm text-gray-600 dark:text-gray-400">{item.value}</span>
  }

  return (
    <div className="space-y-6">
      {/* Profile Completion Card - Full Width */}
      <ProfileCompletionCard />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {overviewCards.map((card, index) => (
          <div key={index} className={`bg-gradient-to-br ${card.bgColor} rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:shadow-lg transition-all duration-200`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-lg flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</span>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{card.title}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">{card.description}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Professional Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Professional Information</h2>
          </div>
          <div className="space-y-4">
            {professionalInfo.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</label>
                  <div className="mt-1">
                    {renderEditableField(item)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Contact Information</h2>
          </div>
          <div className="space-y-4">
            {contactInfo.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</label>
                  <div className="mt-1">
                    {renderEditableField(item)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Equipment & Software */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Equipment & Software</h2>
          </div>
          <div className="space-y-4">
            {equipmentInfo.map((item, index) => (
              <div key={index} className="flex items-start gap-3">
                <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</label>
                  <div className="mt-1">
                    {renderEditableField(item)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Physical Attributes (for talent) */}
        {physicalInfo.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-pink-600 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Physical Attributes</h2>
            </div>
            <div className="space-y-4">
              {physicalInfo.map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <item.icon className="w-5 h-5 text-gray-500 dark:text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</label>
                    <div className="mt-1">
                      {renderEditableField(item)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bio Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">About Me</h2>
        </div>
        {isEditing ? (
          <textarea
            defaultValue={profile?.bio || ''}
            placeholder="Tell us about yourself..."
            className="w-full h-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          />
        ) : (
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {profile?.bio || 'No bio provided. Click "Edit Profile" to add your bio.'}
          </p>
        )}
      </div>

      {/* Compatible Gigs Section - Only for Talent Users */}
      {profile?.talent_categories && profile.talent_categories.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Compatible Gigs</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gigs that match your profile and preferences
              </p>
            </div>
            <div className="flex items-center gap-2">
              {compatibleGigs.length > 0 && (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm text-emerald-600 font-medium">
                    {compatibleGigs.length} matches found
                  </span>
                </div>
              )}
            </div>
          </div>

          {matchmakingLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">Finding compatible gigs...</span>
            </div>
          ) : compatibleGigs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {compatibleGigs.map((gig) => (
                <MatchmakingCard
                  key={gig.id}
                  type={gig.type}
                  data={gig.data}
                  compatibilityScore={gig.compatibility_score}
                  compatibilityBreakdown={gig.compatibility_breakdown}
                  onViewDetails={() => window.open(`/gigs/${gig.id}`, '_blank')}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No Compatible Gigs Found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-4">
                Complete your profile to get better matches, or check back later for new opportunities.
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => window.location.href = '/profile?edit=true'}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Complete Profile
                </button>
                <button
                  onClick={() => window.location.href = '/gigs'}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Browse All Gigs
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Ratings Section */}
      <UserRatingDisplay userId={profile?.id || ''} />
    </div>
  )
}
