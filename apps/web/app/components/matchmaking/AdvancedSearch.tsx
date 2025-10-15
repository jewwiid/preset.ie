'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Input } from '../../../components/ui/input'
import { Textarea } from '../../../components/ui/textarea'
import { Checkbox } from '../../../components/ui/checkbox'
import { Slider } from '../../../components/ui/slider'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs'
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Search,
  Filter,
  Save,
  Download, 
  MapPin, 
  Calendar,
  DollarSign,
  Award,
  Clock,
  Star,
  Users,
  Target,
  RefreshCw
} from 'lucide-react'
import MatchmakingCard from './MatchmakingCard'
import CompatibilityScore from './CompatibilityScore'
import { supabase } from '../../../lib/supabase'
import { useAuth } from '../../../lib/auth-context'

interface AdvancedSearchProps {
  userType: 'talent' | 'contributor'
  onSearch: (results: SearchResult[]) => void
  className?: string
}

interface SearchResult {
  id: string
  type: 'gig' | 'user'
  data: any
  compatibility_score: number
  compatibility_breakdown: any
  reason: string
  priority: 'high' | 'medium' | 'low'
}

interface SearchFilters {
  query: string
  compatibility_min: number
  compatibility_max: number
  location_radius: number
  date_range: {
    start: Date | null
    end: Date | null
  }
  compensation_types: string[]
  specializations: string[]
  experience_levels: string[]
  availability_status: string[]
  sort_by: 'compatibility' | 'date' | 'location' | 'relevance'
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  userType,
  onSearch,
  className = ''
}) => {
  const { user } = useAuth()
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    compatibility_min: 60,
    compatibility_max: 100,
    location_radius: 50,
    date_range: {
      start: null,
      end: null
    },
    compensation_types: [],
    specializations: [],
    experience_levels: [],
    availability_status: [],
    sort_by: 'compatibility'
  })
  
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [savedSearches, setSavedSearches] = useState<any[]>([])
  const [showFilters, setShowFilters] = useState(false)

  const compensationTypes = [
    { value: 'TFP', label: 'Time for Prints' },
    { value: 'PAID', label: 'Paid' },
    { value: 'EXPENSES_ONLY', label: 'Expenses Only' }
  ]

  const specializations = [
    'Fashion Photography',
    'Portrait Photography',
    'Event Photography',
    'Commercial Photography',
    'Wedding Photography',
    'Street Photography',
    'Product Photography',
    'Architecture Photography'
  ]

  const experienceLevels = [
    'beginner',
    'intermediate', 
    'advanced',
    'professional',
    'expert'
  ]

  const availabilityStatuses = [
    'Available',
    'Busy',
    'Unavailable',
    'Limited',
    'Weekends Only',
    'Weekdays Only'
  ]

  useEffect(() => {
    loadSavedSearches()
  }, [])

  const loadSavedSearches = async () => {
    if (!user) return

    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    try {
      const { data, error } = await supabase
        .from('saved_search_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (!error && data) {
        setSavedSearches(data)
      }
    } catch (error) {
      console.error('Error loading saved searches:', error)
    }
  }

  const performSearch = async () => {
    if (!user) return

    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    try {
      setLoading(true)

      let searchResults: SearchResult[] = []

      if (userType === 'talent') {
        // Search for gigs
        const { data: gigs, error: gigsError } = await supabase
          .from('gigs')
          .select(`
            id,
            title,
            description,
            location_text,
            start_time,
            end_time,
            comp_type,
            owner_user_id,
            status,
            created_at,
            updated_at
          `)
          .eq('status', 'PUBLISHED')
          .ilike('title', `%${filters.query}%`)
          .limit(50)

        if (gigsError) {
          console.error('Error searching gigs:', {
            message: gigsError?.message || 'No message',
            code: gigsError?.code || 'No code',
            details: gigsError?.details || 'No details',
            hint: gigsError?.hint || 'No hint',
            fullError: gigsError,
            errorType: typeof gigsError,
            errorKeys: gigsError ? Object.keys(gigsError) : 'No keys',
            errorStringified: JSON.stringify(gigsError)
          })
          return
        }

        // Calculate compatibility for each gig
        for (const gig of gigs || []) {
          const { data: compatibilityResult, error: compatibilityError } = await supabase
            .rpc('calculate_gig_compatibility', {
              p_profile_id: user.id,
              p_gig_id: gig.id
            })

          if (!compatibilityError && compatibilityResult && compatibilityResult.length > 0) {
            const result = compatibilityResult[0]
            const compatibilityScore = result.compatibility_score

            if (compatibilityScore >= filters.compatibility_min && 
                compatibilityScore <= filters.compatibility_max) {
              searchResults.push({
                id: gig.id,
                type: 'gig',
                data: gig,
                compatibility_score: compatibilityScore,
                compatibility_breakdown: {
                  gender: result.match_factors.gender_match ? 20 : 0,
                  age: result.match_factors.age_match ? 20 : 0,
                  height: result.match_factors.height_match ? 15 : 0,
                  experience: result.match_factors.experience_match ? 25 : 0,
                  specialization: typeof result.match_factors.specialization_match === 'number' ? 
                    (result.match_factors.specialization_match / result.match_factors.total_required) * 20 : 
                    result.match_factors.specialization_match ? 20 : 0,
                  total: compatibilityScore
                },
                reason: 'Matches your profile',
                priority: compatibilityScore >= 80 ? 'high' : 
                         compatibilityScore >= 60 ? 'medium' : 'low'
              })
            }
          }
        }
      } else {
        // Search for users
        const { data: users, error: usersError } = await supabase
          .from('users_profile')
          .select(`
            id,
            user_id,
            display_name,
            handle,
            bio,
            city,
            country,
            avatar_url,
            created_at,
            updated_at
          `)
          .contains('account_type', ['TALENT'])
          .or(`display_name.ilike.%${filters.query}%,bio.ilike.%${filters.query}%`)
          .limit(50)

        if (usersError) {
          console.error('Error searching users:', usersError)
          return
        }

        // For contributors, we'd need a gig context to calculate compatibility
        // For now, we'll show all matching users
        searchResults = (users || []).map(user => ({
          id: user.id,
          type: 'user',
          data: user,
          compatibility_score: 75, // Placeholder - would need gig context
          compatibility_breakdown: {
            gender: 20,
            age: 20,
            height: 15,
            experience: 25,
            specialization: 20,
            total: 75
          },
          reason: 'Matches search criteria',
          priority: 'medium'
        }))
      }

      // Sort results
      searchResults.sort((a, b) => {
        switch (filters.sort_by) {
          case 'compatibility':
            return b.compatibility_score - a.compatibility_score
          case 'date':
            return new Date(b.data.created_at).getTime() - new Date(a.data.created_at).getTime()
          case 'relevance':
            return a.priority === 'high' ? -1 : b.priority === 'high' ? 1 : 0
          default:
            return b.compatibility_score - a.compatibility_score
        }
      })

      setResults(searchResults)
      onSearch(searchResults)

    } catch (error) {
      console.error('Error performing search:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSearch = async () => {
    if (!user || !filters.query.trim()) return

    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    try {
      const { error } = await supabase
        .from('saved_search_preferences')
        .insert({
          user_id: user.id,
          name: filters.query || 'Advanced Search',
          search_type: userType === 'talent' ? 'gig' : 'user',
          filters: filters
        })

      if (!error) {
        loadSavedSearches()
      }
    } catch (error) {
      console.error('Error saving search:', error)
    }
  }

  const loadSavedSearch = (savedSearch: any) => {
    setFilters({
      ...filters,
      ...savedSearch.filters,
      query: savedSearch.name
    })
  }

  const exportResults = () => {
    const dataStr = JSON.stringify(results, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `matchmaking-search-results-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-600" />
              Advanced Search
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={saveSearch}
                disabled={!filters.query.trim()}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Query */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder={`Search ${userType === 'talent' ? 'gigs' : 'talent'}...`}
                value={filters.query}
                onChange={(e) => setFilters({ ...filters, query: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              />
            </div>
            <Button onClick={performSearch} disabled={loading}>
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-2" />
              )}
              Search
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Compatibility:</label>
              <Slider
                value={[filters.compatibility_min, filters.compatibility_max]}
                onValueChange={(values) => setFilters({
                  ...filters,
                  compatibility_min: (values as number[])[0],
                  compatibility_max: (values as number[])[1]
                })}
                max={100}
                min={0}
                step={5}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground-600 w-16">
                {filters.compatibility_min}-{filters.compatibility_max}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium">Sort by:</label>
              <select
                value={filters.sort_by}
                onChange={(e) => setFilters({ ...filters, sort_by: e.target.value as any })}
                className="px-3 py-1 border rounded-md text-sm"
              >
                <option value="compatibility">Compatibility</option>
                <option value="date">Date</option>
                <option value="relevance">Relevance</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Saved Searches */}
      {savedSearches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Saved Searches</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {savedSearches.map((search) => (
                <Button
                  key={search.id}
                  variant="outline"
                  size="sm"
                  onClick={() => loadSavedSearch(search)}
                >
                  {search.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Advanced Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Compensation Types */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-primary-600" />
                  Compensation
                </h4>
                <div className="space-y-2">
                  {compensationTypes.map((type) => (
                    <div key={type.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={type.value}
                        checked={filters.compensation_types.includes(type.value)}
                        onCheckedChange={(checked) => {
                          const newTypes = checked
                            ? [...filters.compensation_types, type.value]
                            : filters.compensation_types.filter(t => t !== type.value)
                          setFilters({ ...filters, compensation_types: newTypes })
                        }}
                      />
                      <label htmlFor={type.value} className="text-sm">
                        {type.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Specializations */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Award className="w-4 h-4 text-primary-600" />
                  Specializations
                </h4>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {specializations.map((specialization) => (
                    <div key={specialization} className="flex items-center space-x-2">
                      <Checkbox
                        id={specialization}
                        checked={filters.specializations.includes(specialization)}
                        onCheckedChange={(checked) => {
                          const newSpecializations = checked
                            ? [...filters.specializations, specialization]
                            : filters.specializations.filter(s => s !== specialization)
                          setFilters({ ...filters, specializations: newSpecializations })
                        }}
                      />
                      <label htmlFor={specialization} className="text-sm">
                        {specialization}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Experience Levels */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary-600" />
                  Experience
                </h4>
                <div className="space-y-2">
                  {experienceLevels.map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={filters.experience_levels.includes(level)}
                        onCheckedChange={(checked) => {
                          const newLevels = checked
                            ? [...filters.experience_levels, level]
                            : filters.experience_levels.filter(l => l !== level)
                          setFilters({ ...filters, experience_levels: newLevels })
                        }}
                      />
                      <label htmlFor={level} className="text-sm capitalize">
                        {level}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-primary-600" />
                Search Results ({results.length})
              </CardTitle>
              <Button variant="outline" size="sm" onClick={exportResults}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((result) => (
                <MatchmakingCard
                  key={result.id}
                  type={result.type}
                  data={result.data}
                  compatibilityScore={result.compatibility_score}
                  compatibilityBreakdown={result.compatibility_breakdown}
                  onViewDetails={() => {
                    const url = result.type === 'gig' ? `/gigs/${result.id}` : `/users/${result.data?.handle || result.id}`
                    window.open(url, '_blank')
                  }}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!loading && results.length === 0 && filters.query && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-6 text-muted-foreground-300" />
            <h3 className="text-xl font-semibold text-muted-foreground-900 dark:text-primary-foreground mb-2">
              No Results Found
            </h3>
            <p className="text-muted-foreground mb-6">
              Try adjusting your search criteria or filters to find more {userType === 'talent' ? 'gigs' : 'talent'}.
            </p>
            <Button onClick={performSearch} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default AdvancedSearch
