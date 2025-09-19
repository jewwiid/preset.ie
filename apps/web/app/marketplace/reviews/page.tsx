'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';
import MarketplaceLayout from '@/components/marketplace/MarketplaceLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Star, 
  MessageSquare, 
  Calendar,
  User,
  Package,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import Link from 'next/link';

interface Review {
  id: string;
  order_type: 'rent' | 'sale';
  order_id: string;
  author_id: string;
  subject_user_id: string;
  rating: number;
  comment: string | null;
  response: string | null;
  created_at: string;
  author: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
    verified_id: boolean;
  };
  subject_user: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url: string | null;
    verified_id: boolean;
  };
  order?: {
    id: string;
    listing_id: string;
    listing?: {
      id: string;
      title: string;
      images?: Array<{
        id: string;
        url: string;
        alt_text?: string;
      }>;
    };
  };
}

interface ReviewStats {
  total_reviews: number;
  average_rating: number;
  rating_breakdown: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
}

export default function ReviewsPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('received');

  useEffect(() => {
    if (user) {
      fetchReviews();
      fetchStats();
    }
  }, [user, activeTab]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get the current session to get the access token
      if (!supabase) {
        setError('Database connection not available');
        setLoading(false);
        return;
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Error getting session:', sessionError);
        setError('Authentication error: ' + sessionError.message);
        return;
      }

      if (!session?.access_token) {
        setError('No authentication token available');
        return;
      }

      // Get user profile to get the profile ID
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        setError('User profile not found');
        return;
      }

      const response = await fetch(`/api/marketplace/reviews?user_id=${profile.id}&page=1&limit=50`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        // Filter reviews based on active tab
        const filteredReviews = activeTab === 'received' 
          ? data.reviews.filter((review: Review) => review.subject_user_id === profile.id)
          : data.reviews.filter((review: Review) => review.author_id === profile.id);
        
        setReviews(filteredReviews);
      } else {
        console.error('API Error:', data);
        setError(data.error || 'Failed to fetch reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('An unexpected error occurred: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Get user profile to get the profile ID
      if (!supabase || !user) {
        return;
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('users_profile')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        return;
      }

      // Get reviews received by this user
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('marketplace_reviews')
        .select('rating')
        .eq('subject_user_id', profile.id);

      if (reviewsError) {
        console.error('Error fetching review stats:', reviewsError);
        return;
      }

      const totalReviews = reviewsData.length;
      const averageRating = totalReviews > 0 
        ? reviewsData.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
        : 0;

      const ratingBreakdown = {
        5: reviewsData.filter(r => r.rating === 5).length,
        4: reviewsData.filter(r => r.rating === 4).length,
        3: reviewsData.filter(r => r.rating === 3).length,
        2: reviewsData.filter(r => r.rating === 2).length,
        1: reviewsData.filter(r => r.rating === 1).length,
      };

      setStats({
        total_reviews: totalReviews,
        average_rating: averageRating,
        rating_breakdown: ratingBreakdown
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    if (rating >= 3) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
  };

  const getOrderTypeIcon = (orderType: string) => {
    return orderType === 'rent' ? <Package className="w-4 h-4" /> : <ThumbsUp className="w-4 h-4" />;
  };

  const getOrderTypeLabel = (orderType: string) => {
    return orderType === 'rent' ? 'Rental' : 'Sale';
  };

  if (!user) {
    return (
      <MarketplaceLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Sign in required</h2>
            <p className="text-gray-600 mb-4">Please sign in to view your reviews</p>
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Reviews</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Track your marketplace reviews and ratings
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Star className="h-8 w-8 text-yellow-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Rating</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.average_rating.toFixed(1)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <MessageSquare className="h-8 w-8 text-blue-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Reviews</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.total_reviews}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <ThumbsUp className="h-8 w-8 text-green-400" />
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Positive Reviews</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.rating_breakdown[5] + stats.rating_breakdown[4]}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Rating Breakdown */}
        {stats && stats.total_reviews > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Rating Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <div key={rating} className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400 w-8">
                      {rating}
                    </span>
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{
                          width: `${stats.total_reviews > 0 ? (stats.rating_breakdown[rating as keyof typeof stats.rating_breakdown] / stats.total_reviews) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-8 text-right">
                      {stats.rating_breakdown[rating as keyof typeof stats.rating_breakdown]}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Reviews Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Reviews Received</TabsTrigger>
            <TabsTrigger value="given">Reviews Given</TabsTrigger>
          </TabsList>

          <TabsContent value="received" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading reviews...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading reviews</h2>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={fetchReviews}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No reviews yet</h2>
                  <p className="text-gray-600 mb-4">
                    You haven't received any reviews yet. Complete some marketplace transactions to start building your reputation.
                  </p>
                  <Button asChild>
                    <Link href="/marketplace">Browse Marketplace</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {review.author.avatar_url ? (
                            <img
                              src={review.author.avatar_url}
                              alt={review.author.display_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              {review.author.display_name}
                            </h3>
                            {review.author.verified_id && (
                              <Badge variant="secondary" className="text-xs">
                                Verified
                              </Badge>
                            )}
                            <Badge className={getRatingColor(review.rating)}>
                              {review.rating}/5
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {getOrderTypeIcon(review.order_type)}
                              <span className="ml-1">{getOrderTypeLabel(review.order_type)}</span>
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                              {review.comment}
                            </p>
                          )}
                          {review.response && (
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-3">
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                                Your Response:
                              </p>
                              <p className="text-gray-700 dark:text-gray-300">
                                {review.response}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              @{review.author.handle}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="given" className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading reviews...</p>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Error loading reviews</h2>
                  <p className="text-gray-600 mb-4">{error}</p>
                  <Button onClick={fetchReviews}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">No reviews given</h2>
                  <p className="text-gray-600 mb-4">
                    You haven't given any reviews yet. Complete some marketplace transactions to leave reviews for others.
                  </p>
                  <Button asChild>
                    <Link href="/marketplace">Browse Marketplace</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          {review.subject_user.avatar_url ? (
                            <img
                              src={review.subject_user.avatar_url}
                              alt={review.subject_user.display_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                              Review for {review.subject_user.display_name}
                            </h3>
                            {review.subject_user.verified_id && (
                              <Badge variant="secondary" className="text-xs">
                                Verified
                              </Badge>
                            )}
                            <Badge className={getRatingColor(review.rating)}>
                              {review.rating}/5
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 mb-2">
                            {renderStars(review.rating)}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {getOrderTypeIcon(review.order_type)}
                              <span className="ml-1">{getOrderTypeLabel(review.order_type)}</span>
                            </span>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700 dark:text-gray-300 mb-3">
                              {review.comment}
                            </p>
                          )}
                          {review.response && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 mb-3">
                              <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
                                Response from {review.subject_user.display_name}:
                              </p>
                              <p className="text-blue-700 dark:text-blue-300">
                                {review.response}
                              </p>
                            </div>
                          )}
                          <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(review.created_at).toLocaleDateString()}
                            </span>
                            <span className="flex items-center">
                              <User className="w-4 h-4 mr-1" />
                              @{review.subject_user.handle}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </MarketplaceLayout>
  );
}
