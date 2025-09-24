'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Heart, Eye, Share2, Download } from 'lucide-react';
import Link from 'next/link';

interface MediaItem {
  id: string;
  url: string;
  type: string;
  thumbnail_url?: string;
  width?: number;
  height?: number;
  exif_json?: any;
}

interface Creator {
  id: string;
  display_name: string;
  handle: string;
  avatar_url?: string;
  verified_id: boolean;
}

interface Showcase {
  id: string;
  title: string;
  caption: string;
  description: string;
  type: string;
  media: MediaItem[];
  media_count: number;
  tags: string[];
  palette: any;
  visibility: string;
  likes_count: number;
  views_count: number;
  creator: Creator;
  talent?: Creator;
  created_at: string;
  updated_at: string;
  moodboard_summary?: string;
  moodboard_palette?: any;
}

export default function ShowcaseDetailPage() {
  const params = useParams();
  const showcaseId = params.id as string;
  
  const [showcase, setShowcase] = useState<Showcase | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchShowcase = async () => {
      try {
        const response = await fetch(`/api/showcases/${showcaseId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch showcase');
        }
        const data = await response.json();
        setShowcase(data.showcase);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    if (showcaseId) {
      fetchShowcase();
    }
  }, [showcaseId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading showcase...</p>
        </div>
      </div>
    );
  }

  if (error || !showcase) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Showcase Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'The showcase you\'re looking for doesn\'t exist.'}</p>
          <Link href="/showcases">
            <Button>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Showcases
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/showcases">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Showcases
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">{showcase.title}</h1>
              <p className="text-muted-foreground">{showcase.description}</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Heart className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{showcase.likes_count}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Eye className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{showcase.views_count}</span>
              </div>
              <Button variant="outline" size="sm">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>

        {/* Creator Info */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              {showcase.creator.avatar_url ? (
                <Image
                  src={showcase.creator.avatar_url}
                  alt={showcase.creator.display_name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                  <span className="text-lg font-semibold">
                    {showcase.creator.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-semibold text-foreground">{showcase.creator.display_name}</h3>
                <p className="text-sm text-muted-foreground">@{showcase.creator.handle}</p>
                {showcase.creator.verified_id && (
                  <Badge variant="secondary" className="mt-1">Verified</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Media Grid */}
        {showcase.media.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {showcase.media.map((media, index) => (
              <Card key={media.id} className="overflow-hidden">
                <div className="relative aspect-square">
                  {media.type === 'VIDEO' ? (
                    <video
                      src={media.url}
                      controls
                      className="w-full h-full object-cover"
                      poster={media.thumbnail_url}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <Image
                      src={media.url}
                      alt={`${showcase.title} - Image ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <Button variant="secondary" size="sm" className="opacity-0 hover:opacity-100 transition-opacity">
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">No media found for this showcase.</p>
            </CardContent>
          </Card>
        )}

        {/* Tags */}
        {showcase.tags.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {showcase.tags.map((tag, index) => (
                  <Badge key={index} variant="outline">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Showcase Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">Type:</span>
                <p className="capitalize">{showcase.type.replace('_', ' ')}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Media Count:</span>
                <p>{showcase.media_count}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Visibility:</span>
                <p className="capitalize">{showcase.visibility.toLowerCase()}</p>
              </div>
              <div>
                <span className="font-medium text-muted-foreground">Created:</span>
                <p>{new Date(showcase.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
