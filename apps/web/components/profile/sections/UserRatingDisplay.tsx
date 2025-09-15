'use client'

import React, { useState, useEffect } from 'react'
import { Star, Users, MessageSquare, TrendingUp } from 'lucide-react'
import { supabase } from '../../../lib/supabase'

interface Review {
  id: string
  rating: number
  comment: string
  tags: string[]
  created_at: string
  reviewer_user_id: string
  gig_id: string
}

interface UserRatingStats {
  averageRating: number
  totalReviews: number
  ratingDistribution: { [key: number]: number }
  recentReviews: Review[]
  topTags: { tag: string; count: number }[]
}

interface UserRatingDisplayProps {
  userId: string
  compact?: boolean
}

export function UserRatingDisplay({ userId, compact = false }: UserRatingDisplayProps) {
  const [ratingStats, setRatingStats] = useState<UserRatingStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllReviews, setShowAllReviews] = useState(false)

  useEffect(() => {
    fetchUserRatings()
  }, [userId])

  const fetchUserRatings = async () => {
    try {
      if (!supabase) return

      // Fetch all reviews for the user
      const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
          id,
          rating,
          comment,
          tags,
          created_at,
          reviewer_user_id,
          gig_id,
          reviewer:users_profile!reviews_reviewer_user_id_fkey(
            display_name,
            handle,
            avatar_url
          )
        `)
        .eq('reviewed_user_id', userId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching reviews:', error)
        return
      }

      if (!reviews || reviews.length === 0) {
        setRatingStats({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: {},
          recentReviews: [],
          topTags: []
        })
        setLoading(false)
        return
      }

      // Calculate average rating
      const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0)
      const averageRating = totalRating / reviews.length

      // Calculate rating distribution
      const ratingDistribution = reviews.reduce((dist, review) => {
        dist[review.rating] = (dist[review.rating] || 0) + 1
        return dist
      }, {} as { [key: number]: number })

      // Get top tags
      const tagCounts = reviews.reduce((counts, review) => {
        if (review.tags) {
          review.tags.forEach((tag: string) => {
            counts[tag] = (counts[tag] || 0) + 1
          })
        }
        return counts
      }, {} as { [key: string]: number })

      const topTags = Object.entries(tagCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }))

      setRatingStats({
        averageRating,
        totalReviews: reviews.length,
        ratingDistribution,
        recentReviews: reviews.slice(0, 3),
        topTags
      })
    } catch (error) {
      console.error('Error fetching user ratings:', error)
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'w-3 h-3',
      md: 'w-4 h-4',
      lg: 'w-5 h-5'
    }

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${sizeClasses[size]} ${
              star <= rating
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.0) return 'text-yellow-600'
    if (rating >= 2.0) return 'text-orange-600'
    return 'text-red-600'
  }

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return 'Excellent'
    if (rating >= 4.0) return 'Very Good'
    if (rating >= 3.0) return 'Good'
    if (rating >= 2.0) return 'Fair'
    return 'Poor'
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 rounded w-16 h-4"></div>
        <div className="animate-pulse bg-gray-200 rounded w-12 h-4"></div>
      </div>
    )
  }

  if (!ratingStats || ratingStats.totalReviews === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
        <Star className="w-4 h-4" />
        <span className="text-sm">No ratings yet</span>
      </div>
    )
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {renderStars(Math.round(ratingStats.averageRating), 'sm')}
        <span className={`text-sm font-medium ${getRatingColor(ratingStats.averageRating)}`}>
          {ratingStats.averageRating.toFixed(1)}
        </span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          ({ratingStats.totalReviews})
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-600 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl flex items-center justify-center">
            <Star className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              User Ratings
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Based on {ratingStats.totalReviews} review{ratingStats.totalReviews !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="flex items-center gap-2 mb-1">
            {renderStars(Math.round(ratingStats.averageRating), 'lg')}
            <span className={`text-2xl font-bold ${getRatingColor(ratingStats.averageRating)}`}>
              {ratingStats.averageRating.toFixed(1)}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {getRatingLabel(ratingStats.averageRating)}
          </p>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Rating Breakdown
        </h4>
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = ratingStats.ratingDistribution[rating] || 0
            const percentage = ratingStats.totalReviews > 0 ? (count / ratingStats.totalReviews) * 100 : 0
            
            return (
              <div key={rating} className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400 w-4">{rating}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                  {count}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Top Tags */}
      {ratingStats.topTags.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Most Mentioned
          </h4>
          <div className="flex flex-wrap gap-2">
            {ratingStats.topTags.map(({ tag, count }) => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm font-medium"
              >
                {tag} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Reviews */}
      {ratingStats.recentReviews.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Recent Reviews
            </h4>
            {ratingStats.totalReviews > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
              >
                {showAllReviews ? 'Show Less' : `View All ${ratingStats.totalReviews}`}
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {(showAllReviews ? ratingStats.recentReviews : ratingStats.recentReviews.slice(0, 2)).map((review) => (
              <div key={review.id} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {(review as any).reviewer?.display_name?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {(review as any).reviewer?.display_name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        @{(review as any).reviewer?.handle || 'user'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(review.rating, 'sm')}
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {review.rating}
                    </span>
                  </div>
                </div>
                
                {review.comment && (
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                    {review.comment}
                  </p>
                )}
                
                {review.tags && review.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {review.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
