'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Heart, MessageCircle, User, Image as ImageIcon, Film, Palette, Video, FileText } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { Button } from './ui/button';

interface ShowcaseMedia {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
}

interface Showcase {
  id: string;
  title: string;
  description?: string;
  type: 'moodboard' | 'individual_image' | 'treatment' | 'video';
  media: ShowcaseMedia[];
  tags: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  creator: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
    verified_id?: boolean;
  };
  is_liked_by_user: boolean;
  moodboard_summary?: string;
  moodboard_palette?: string[];
}

interface ShowcaseFeedProps {
  className?: string;
  showcaseType?: 'all' | 'moodboard' | 'individual_image' | 'treatment' | 'video';
  showCinematicFilters?: boolean;
  userId?: string;
  tabFilter?: 'trending' | 'featured' | 'latest' | 'community';
}

export default function ShowcaseFeed({ 
  className, 
  showcaseType = 'all', 
  showCinematicFilters = false, 
  userId,
  tabFilter = 'trending'
}: ShowcaseFeedProps) {
  const { user, session } = useAuth();
  const [showcases, setShowcases] = useState<Showcase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShowcases();
  }, [showcaseType, userId, session, tabFilter]);

  const fetchShowcases = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (showcaseType !== 'all') params.append('type', showcaseType);
      if (userId) params.append('userId', userId);
      if (tabFilter) params.append('filter', tabFilter);

      const response = await fetch(`/api/showcases?${params.toString()}`, {
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch showcases');
      }

      const data = await response.json();
      setShowcases(data.showcases || []);
    } catch (err: any) {
      console.error('Error fetching showcases:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (showcaseId: string, isLiked: boolean) => {
    if (!user) {
      alert('You must be logged in to like a showcase.');
      return;
    }
    try {
      const response = await fetch(`/api/showcases/${showcaseId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ action: isLiked ? 'unlike' : 'like' })
      });

      if (!response.ok) {
        throw new Error('Failed to update like status');
      }

      const { likes_count, is_liked_by_user } = await response.json();
      setShowcases(prev => prev.map(s =>
        s.id === showcaseId ? { ...s, likes_count, is_liked_by_user } : s
      ));
    } catch (err) {
      console.error('Error liking/unliking showcase:', err);
      setError('Failed to update like status.');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
        <p className="text-muted-foreground-600">Loading showcases...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-destructive-600 mb-4">{error}</p>
        <Button onClick={fetchShowcases}>Try Again</Button>
      </div>
    );
  }

  if (showcases.length === 0) {
    return (
      <div className="text-center py-12">
        <ImageIcon className="h-12 w-12 text-muted-foreground-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-muted-foreground-900 mb-2">No showcases found</h3>
        <p className="text-muted-foreground-500 mb-4">Be the first to create an amazing showcase!</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {showcases.map((showcase) => (
        <Card key={showcase.id} className="showcase-card group cursor-pointer">
          {showcase.media && showcase.media.length > 0 && (
            <div className="relative h-64 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
              {showcase.media[0].type === 'video' ? (
                <video
                  src={showcase.media[0].url}
                  poster={showcase.media[0].thumbnail_url}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  controls={false}
                  muted
                  loop
                  preload="metadata"
                />
              ) : (
                <img
                  src={showcase.media[0].url}
                  alt={showcase.title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              <Badge className="absolute top-3 left-3 bg-background/90 text-slate-800 backdrop-blur-sm">
                {showcase.type === 'moodboard' ? (
                  <><Palette className="h-3 w-3 mr-1" /> Moodboard</>
                ) : showcase.type === 'video' ? (
                  <><Video className="h-3 w-3 mr-1" /> Video</>
                ) : showcase.type === 'treatment' ? (
                  <><FileText className="h-3 w-3 mr-1" /> Treatment</>
                ) : (
                  <><ImageIcon className="h-3 w-3 mr-1" /> Image</>
                )}
              </Badge>
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleLike(showcase.id, showcase.is_liked_by_user)
                  }}
                  className={`like-button ${showcase.is_liked_by_user ? 'liked' : ''}`}
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </div>
            </div>
          )}
          <CardContent className="p-4">
            <div className="space-y-3">
              <Link href={`/showcases/${showcase.id}`} className="block">
                <h3 className="font-semibold text-slate-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                  {showcase.title}
                </h3>
              </Link>
              
              {showcase.moodboard_summary && (
                <p className="text-sm text-slate-600 line-clamp-2">{showcase.moodboard_summary}</p>
              )}
              
              <div className="flex flex-wrap gap-1.5">
                {showcase.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                    {tag}
                  </Badge>
                ))}
                {showcase.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs bg-slate-100 text-slate-600">
                    +{showcase.tags.length - 3}
                  </Badge>
                )}
              </div>

              {showcase.moodboard_palette && showcase.moodboard_palette.length > 0 && (
                <div className="flex gap-1">
                  {showcase.moodboard_palette.slice(0, 5).map((color, index) => (
                    <div 
                      key={index} 
                      className="w-4 h-4 rounded-full border border-slate-200 shadow-sm" 
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              )}
              
              <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t border-slate-100">
                <Link
                  href={`/users/${showcase.creator.handle}`}
                  className="flex items-center space-x-2 hover:text-slate-700 transition-colors"
                >
                  {showcase.creator.avatar_url ? (
                    <img 
                      src={showcase.creator.avatar_url} 
                      alt={showcase.creator.display_name} 
                      className="w-5 h-5 rounded-full border border-slate-200" 
                    />
                  ) : (
                    <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 text-slate-500" />
                    </div>
                  )}
                  <span className="font-medium">@{showcase.creator.handle}</span>
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Heart className="h-3 w-3" />
                    <span className="text-xs">{showcase.likes_count}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="h-3 w-3" />
                    <span className="text-xs">{showcase.comments_count}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
