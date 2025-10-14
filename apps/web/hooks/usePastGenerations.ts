import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import { useApiQuery } from './useApiQuery';

export interface PastGeneration {
  id: string;
  title: string;
  prompt: string;
  style?: string;
  generated_images: Array<{
    url: string;
    width: number;
    height: number;
    generated_at: string;
    type?: string;
  }>;
  credits_used: number;
  created_at: string;
  last_generated_at: string;
  status: string;
  is_saved?: boolean;
  is_edit?: boolean;
  is_video?: boolean;
  metadata?: {
    enhanced_prompt?: string;
    style_applied?: string;
    style_prompt?: string;
  };
}

interface PastGenerationsResponse {
  generations: PastGeneration[];
  total: number;
}

export function usePastGenerations() {
  const { user, session } = useAuth();
  const [generations, setGenerations] = useState<PastGeneration[]>([]);

  const { loading, error, refetch } = useApiQuery<PastGenerationsResponse>({
    endpoint: '/api/playground/past-generations',
    enabled: !!(user && session?.access_token),
    dependencies: [user, session?.access_token],
    headers: session?.access_token ? {
      'Authorization': `Bearer ${session.access_token}`,
    } : undefined,
    onSuccess: (data) => {
      console.log('📊 Client: Received past generations:', {
        total: data.total,
        count: data.generations?.length || 0,
        videos: data.generations?.filter((g: any) => g.is_video).length || 0,
        images: data.generations?.filter((g: any) => !g.is_video).length || 0,
      });
      setGenerations(data.generations || []);
    },
    onError: (err) => console.error('Error fetching past generations:', err),
  });

  const deleteGeneration = async (id: string, permanent: boolean = false) => {
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    const endpoint = permanent
      ? `/api/playground/past-generations/${id}?permanent=true`
      : `/api/playground/past-generations/${id}`;

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

      // Check if it requires permanent deletion
      if (response.status === 409) {
        throw new Error('REQUIRES_PERMANENT');
      }

      throw new Error(errorData.error || 'Failed to delete generation');
    }

    // Remove from local state
    setGenerations(prev => prev.filter(g => g.id !== id));

    return true;
  };

  return {
    generations,
    loading,
    error,
    refetch,
    deleteGeneration,
  };
}
