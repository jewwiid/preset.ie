import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../lib/auth-context';

export interface ContentPreferences {
  allow_nsfw_content: boolean;
  show_nsfw_warnings: boolean;
  auto_hide_nsfw: boolean;
  content_filter_level: 'strict' | 'moderate' | 'lenient';
  blocked_categories: string[];
}

export interface ModerationResult {
  is_nsfw: boolean;
  confidence_score: number;
  detected_categories: string[];
  keyword_count: number;
  total_words: number;
}

export interface CustomTypeWithModeration {
  id: string;
  type_label: string;
  description?: string;
  is_nsfw: boolean;
  is_flagged: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected' | 'flagged';
  moderation_reason?: string;
  usage_count: number;
  last_used_at: string;
  created_at: string;
}

export function useContentModeration() {
  const { session } = useAuth();
  const [preferences, setPreferences] = useState<ContentPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch user content preferences
  const fetchPreferences = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/user/content-preferences', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
      } else {
        // Set default preferences if none exist
        setPreferences({
          allow_nsfw_content: false,
          show_nsfw_warnings: true,
          auto_hide_nsfw: true,
          content_filter_level: 'moderate',
          blocked_categories: [],
        });
      }
    } catch (error) {
      console.error('Error fetching content preferences:', error);
      // Set default preferences on error
      setPreferences({
        allow_nsfw_content: false,
        show_nsfw_warnings: true,
        auto_hide_nsfw: true,
        content_filter_level: 'moderate',
        blocked_categories: [],
      });
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Update user content preferences
  const updatePreferences = useCallback(async (newPreferences: Partial<ContentPreferences>) => {
    if (!session?.access_token) return false;

    try {
      const response = await fetch('/api/user/content-preferences', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPreferences),
      });

      if (response.ok) {
        const data = await response.json();
        setPreferences(data);
        return true;
      }
    } catch (error) {
      console.error('Error updating content preferences:', error);
    }
    return false;
  }, [session?.access_token]);

  // Check if content should be hidden based on user preferences
  const shouldHideContent = useCallback((content: { is_nsfw?: boolean; moderation_status?: string }) => {
    if (!preferences) return false;
    
    // Hide if NSFW and user doesn't allow NSFW content
    if (content.is_nsfw && !preferences.allow_nsfw_content) {
      return true;
    }
    
    // Hide if flagged and user has strict filtering
    if (content.moderation_status === 'flagged' && preferences.content_filter_level === 'strict') {
      return true;
    }
    
    return false;
  }, [preferences]);

  // Check if content should show warning
  const shouldShowWarning = useCallback((content: { is_nsfw?: boolean; moderation_status?: string }) => {
    if (!preferences) return false;
    
    // Show warning if NSFW and user allows NSFW but has warnings enabled
    if (content.is_nsfw && preferences.allow_nsfw_content && preferences.show_nsfw_warnings) {
      return true;
    }
    
    // Show warning if flagged
    if (content.moderation_status === 'flagged') {
      return true;
    }
    
    return false;
  }, [preferences]);

  // Moderate content (client-side basic check)
  const moderateContent = useCallback((text: string): ModerationResult => {
    const nsfwKeywords = [
      'adult', 'explicit', 'nude', 'naked', 'sex', 'sexual', 'porn', 'pornography',
      'fetish', 'bdsm', 'kink', 'erotic', 'sensual', 'intimate', 'provocative',
      'lingerie', 'underwear', 'bra', 'panties', 'thong', 'bikini', 'swimsuit',
      'breast', 'boob', 'ass', 'butt', 'penis', 'dick', 'cock', 'vagina', 'pussy',
      'masturbation', 'orgasm', 'cum', 'sperm', 'ejaculation', 'climax',
      'strip', 'stripper', 'escort', 'prostitute', 'hooker', 'whore',
      'rape', 'molest', 'abuse', 'incest', 'pedophile', 'child porn',
      'violence', 'gore', 'blood', 'torture', 'murder', 'kill', 'death',
      'hate', 'racist', 'discrimination', 'slur', 'offensive'
    ];

    const words = text.toLowerCase().split(/\s+/);
    const totalWords = words.length;
    let keywordCount = 0;
    const detectedCategories: string[] = [];

    // Check for NSFW keywords
    nsfwKeywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        keywordCount++;
        if (!detectedCategories.includes('nsfw')) {
          detectedCategories.push('nsfw');
        }
      }
    });

    const confidenceScore = totalWords > 0 ? Math.min(keywordCount / totalWords * 10, 1) : 0;

    return {
      is_nsfw: keywordCount > 0,
      confidence_score: confidenceScore,
      detected_categories: detectedCategories,
      keyword_count: keywordCount,
      total_words: totalWords,
    };
  }, []);

  // Flag content for moderation
  const flagContent = useCallback(async (
    contentType: 'user_type' | 'suggested_type' | 'image' | 'generation',
    contentId: string,
    reason: string,
    details?: any
  ) => {
    if (!session?.access_token) return false;

    try {
      const response = await fetch('/api/moderation/flag', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          reason,
          details,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error flagging content:', error);
      return false;
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchPreferences();
  }, [fetchPreferences]);

  return {
    preferences,
    loading,
    updatePreferences,
    shouldHideContent,
    shouldShowWarning,
    moderateContent,
    flagContent,
    refreshPreferences: fetchPreferences,
  };
}
