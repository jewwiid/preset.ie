import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../lib/auth-context';

export type ContentType = 'playground_gallery' | 'media' | 'enhancement_tasks' | 'user_type' | 'suggested_type';
export type FlagType = 'nsfw' | 'inappropriate' | 'spam' | 'copyright' | 'violence' | 'hate_speech' | 'other';

export interface ContentModerationInfo {
  id: string;
  is_nsfw: boolean;
  is_flagged: boolean;
  moderation_status: 'pending' | 'approved' | 'rejected' | 'flagged';
  user_marked_nsfw: boolean;
  nsfw_confidence_score: number;
  flag_count: number;
  recent_flags: Array<{
    flag_type: FlagType;
    reason: string;
    created_at: string;
    status: string;
  }>;
}

export const useContentModerationExtended = () => {
  const { session } = useAuth();
  const [loading, setLoading] = useState(false);

  // Get moderation information for content
  const getModerationInfo = useCallback(async (
    contentType: ContentType,
    contentId: string
  ): Promise<ContentModerationInfo | null> => {
    if (!session?.access_token) {
      console.error('No access token available');
      return null;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/content/moderation-info?content_type=${contentType}&content_id=${contentId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return data.moderation_info;
      } else {
        console.error('Failed to get moderation info:', response.statusText);
        return null;
      }
    } catch (error) {
      console.error('Error getting moderation info:', error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Flag content
  const flagContent = useCallback(async (
    contentType: ContentType,
    contentId: string,
    flagType: FlagType,
    reason: string,
    description?: string
  ): Promise<boolean> => {
    if (!session?.access_token) {
      toast.error('You must be logged in to flag content.');
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/content/flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          flag_type: flagType,
          reason,
          description,
        }),
      });

      if (response.ok) {
        toast.success('Content flagged successfully. Thank you for helping keep our community safe!');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to flag content.');
        return false;
      }
    } catch (error) {
      console.error('Error flagging content:', error);
      toast.error('Failed to flag content. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Mark content as NSFW (for content owners)
  const markContentNsfw = useCallback(async (
    contentType: ContentType,
    contentId: string,
    isNsfw: boolean
  ): Promise<boolean> => {
    if (!session?.access_token) {
      toast.error('You must be logged in to mark content as NSFW.');
      return false;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/content/mark-nsfw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          is_nsfw: isNsfw,
        }),
      });

      if (response.ok) {
        toast.success(isNsfw ? 'Content marked as NSFW' : 'Content unmarked as NSFW');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update NSFW status.');
        return false;
      }
    } catch (error) {
      console.error('Error marking content as NSFW:', error);
      toast.error('Failed to update NSFW status. Please try again.');
      return false;
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  // Check if content should be hidden based on user preferences
  const shouldHideContent = useCallback((
    isNsfw: boolean,
    moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged',
    userPreferences?: {
      allow_nsfw_content: boolean;
      auto_hide_nsfw: boolean;
    }
  ): boolean => {
    if (!isNsfw) return false; // Not NSFW, so not hidden by NSFW filter

    if (userPreferences?.allow_nsfw_content) {
      return false; // User allows NSFW, so not hidden
    }

    // If user doesn't allow NSFW, hide if auto_hide_nsfw is true
    return userPreferences?.auto_hide_nsfw ?? true; // Default to true if preferences not loaded
  }, []);

  // Check if content should show a warning
  const shouldShowWarning = useCallback((
    isNsfw: boolean,
    moderationStatus: 'pending' | 'approved' | 'rejected' | 'flagged',
    userPreferences?: {
      allow_nsfw_content: boolean;
      show_nsfw_warnings: boolean;
      auto_hide_nsfw?: boolean;
    }
  ): boolean => {
    if (!isNsfw) return false; // Not NSFW, no warning needed

    if (userPreferences?.allow_nsfw_content && userPreferences?.show_nsfw_warnings) {
      return true; // User allows NSFW but wants warnings
    }

    if (!userPreferences?.allow_nsfw_content && !userPreferences?.auto_hide_nsfw) {
      return true; // User doesn't allow NSFW, but doesn't auto-hide, so warn
    }

    return false;
  }, []);

  return {
    loading,
    getModerationInfo,
    flagContent,
    markContentNsfw,
    shouldHideContent,
    shouldShowWarning,
  };
};
