import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';

interface UnifiedMediaMetadata {
  // Core media info
  id: string;
  type: 'image' | 'video';
  url: string;
  title?: string;
  description?: string;
  tags?: string[];
  
  // Dimensions
  width?: number;
  height?: number;
  
  // Generation metadata
  generation_metadata?: {
    prompt?: string;
    enhanced_prompt?: string;
    style_prompt?: string;
    provider?: string;
    credits_used?: number;
    resolution?: string;
    aspect_ratio?: string;
    cinematic_parameters?: any;
    generation_mode?: string;
    base_image?: string;
  };
  
  // Source images (for Stitch)
  source_images?: Array<{
    id: string;
    url: string;
    thumbnail_url?: string;
    type?: string;
    custom_label?: string;
    width?: number;
    height?: number;
  }>;
  
  // Cross-references
  cross_references?: Array<{
    id: string;
    type: string;
    title?: string;
    url?: string;
  }>;
  
  // Preset info
  preset_info?: {
    id?: string;
    name?: string;
    category?: string;
  };
}

export function useUnifiedMediaMetadata(mediaId: string | null, mediaSource: 'gallery' | 'project' | 'showcase' = 'gallery') {
  const { session } = useAuth();
  const [metadata, setMetadata] = useState<UnifiedMediaMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mediaId || !session) {
      setMetadata(null);
      return;
    }

    const fetchMetadata = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/metadata/unified?id=${mediaId}&source=${mediaSource}`, {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch metadata');
        }

        const data = await response.json();
        setMetadata(data.metadata);
      } catch (err) {
        console.error('Error fetching unified metadata:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, [mediaId, mediaSource, session]);

  return { metadata, loading, error };
}
