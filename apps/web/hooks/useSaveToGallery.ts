'use client';

import { useState } from 'react';
import { useAuth } from '../lib/auth-context';
import type { PastGeneration } from './usePastGenerations';

interface SaveToGalleryOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function useSaveToGallery(options?: SaveToGalleryOptions) {
  const { session } = useAuth();
  const [savingImage, setSavingImage] = useState<string | null>(null);
  const [promotingImage, setPromotingImage] = useState<string | null>(null);

  const extractSubjectFromPrompt = (prompt: string): string | null => {
    if (!prompt) return null;

    const patterns = [
      /(?:of|for|with)\s+(?:a\s+)?([a-zA-Z]+)(?:\s|,|$)/i,
      /(?:subject|feature|show|display|portrait|image)\s+(?:of\s+)?([a-zA-Z]+)(?:\s|,|$)/i,
      /^([a-zA-Z]+)\s+(?:in|with|doing|wearing)/i,
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match && match[1] && match[1].length > 2) {
        return match[1].toLowerCase();
      }
    }

    return null;
  };

  const saveImageToGallery = async (
    imageUrl: string,
    projectTitle: string,
    generation: PastGeneration
  ): Promise<{ success: boolean; galleryItemId?: string; isDuplicate?: boolean }> => {
    setSavingImage(imageUrl);
    try {
      const response = await fetch('/api/playground/save-to-gallery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          imageUrl,
          title: projectTitle,
          description: `Generated from: ${projectTitle}`,
          tags: ['ai-generated'],
          generationMetadata: {
            ...generation.metadata,
            subject: generation.metadata?.enhanced_prompt
              ? extractSubjectFromPrompt(generation.metadata.enhanced_prompt)
              : null,
            subject_placeholder_used: generation.prompt?.includes('{subject}') || false,
            preset_id: (generation.metadata as any)?.custom_style_preset?.id || (generation.metadata as any)?.preset_id || null,
            preset_name: (generation.metadata as any)?.custom_style_preset?.name || (generation.metadata as any)?.preset_name || null,
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        options?.onSuccess?.();
        return { success: true, galleryItemId: data.galleryItem?.id };
      }

      // Handle duplicate images gracefully
      if (response.status === 409) {
        const errorData = await response.json();
        if (errorData.error === 'duplicate') {
          return { success: true, isDuplicate: true };
        }
      }

      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to save image');
    } catch (error) {
      console.error('Error saving image:', error);
      options?.onError?.(error instanceof Error ? error : new Error('Failed to save image'));
      return { success: false };
    } finally {
      setSavingImage(null);
    }
  };

  const promoteImageToMedia = async (
    imageUrl: string,
    projectTitle: string,
    generation: PastGeneration
  ): Promise<boolean> => {
    setPromotingImage(imageUrl);
    try {
      // First save to gallery if not already saved
      const saveResult = await saveImageToGallery(imageUrl, projectTitle, generation);

      if (!saveResult.success) {
        throw new Error('Failed to save image to gallery');
      }

      // Get gallery item ID
      let galleryItemId = saveResult.galleryItemId;

      // If it's a duplicate, we need to find the existing gallery item
      if (saveResult.isDuplicate && !galleryItemId) {
        const galleryResponse = await fetch('/api/playground/gallery-with-status', {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });

        if (galleryResponse.ok) {
          const galleryData = await galleryResponse.json();
          const existingItem = galleryData.gallery.find((item: any) => item.image_url === imageUrl);
          if (existingItem) {
            galleryItemId = existingItem.id;
          } else {
            throw new Error('Could not find gallery item to promote');
          }
        } else {
          throw new Error('Could not find gallery item to promote');
        }
      }

      if (!galleryItemId) {
        throw new Error('No gallery item ID available');
      }

      // Now promote to media
      const promoteResponse = await fetch('/api/playground/promote-to-media', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ galleryItemId }),
      });

      if (promoteResponse.ok) {
        options?.onSuccess?.();
        return true;
      }

      const errorData = await promoteResponse.json();
      throw new Error(errorData.error || 'Failed to promote image');
    } catch (error) {
      console.error('Error promoting image:', error);
      options?.onError?.(error instanceof Error ? error : new Error('Failed to promote image'));
      return false;
    } finally {
      setPromotingImage(null);
    }
  };

  return {
    savingImage,
    promotingImage,
    saveImageToGallery,
    promoteImageToMedia,
  };
}
