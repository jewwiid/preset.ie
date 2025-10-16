import { useState, useCallback, useEffect } from 'react';

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
  metadata?: any;
  preset?: string;
  source?: string;
  source_type?: string;
  image_url?: string;
  upload_path?: string;
  width?: number;
  height?: number;
}

interface Treatment {
  id: string;
  title: string;
}

interface ShowcaseMediaOptions {
  accessToken?: string;
  onError?: (error: string) => void;
}

export function useShowcaseMedia({ accessToken, onError }: ShowcaseMediaOptions = {}) {
  // State
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([]);
  const [playgroundGallery, setPlaygroundGallery] = useState<any[]>([]);
  const [availableTreatments, setAvailableTreatments] = useState<Treatment[]>([]);
  const [previewIndex, setPreviewIndex] = useState(0);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingPlayground, setLoadingPlayground] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [promotingImage, setPromotingImage] = useState<string | null>(null);

  // Reset preview index when selectedMedia changes
  useEffect(() => {
    if (selectedMedia.length === 0) {
      setPreviewIndex(0);
    } else if (previewIndex >= selectedMedia.length) {
      setPreviewIndex(selectedMedia.length - 1);
    }
  }, [selectedMedia, previewIndex]);

  const fetchAvailableMedia = useCallback(async () => {
    if (!accessToken) return;

    setLoadingMedia(true);
    const startTime = performance.now();
    try {
      console.log('🚀 Fetching available media...');
      const response = await fetch('/api/media', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const responseTime = performance.now() - startTime;
      console.log(`⏱️ Media API response took ${responseTime.toFixed(2)}ms, status:`, response.status);
      if (response.ok) {
        const data = await response.json();
        const processingTime = performance.now() - startTime;
        console.log(`📦 Media API data processed in ${processingTime.toFixed(2)}ms, items:`, data.media?.length);
        console.log('Sample media item from API:', data.media[0]);
        setAvailableMedia(data.media.map((m: any) => ({
          id: m.id,
          url: m.url,
          type: m.type,
          thumbnail_url: m.thumbnail_url || m.url,
          metadata: m.metadata,
          preset: m.preset,
          source: m.source,
          source_type: m.source_type,
          width: m.width,
          height: m.height
        })));
      } else {
        const errorData = await response.json();
        console.error('Media API error:', errorData);

        // Handle authentication errors specifically
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed - token may be expired');
          onError?.('Your session has expired. Please refresh the page and sign in again to load your media.');
          // Clear the media arrays to show proper empty state
          setAvailableMedia([]);
        } else {
          onError?.(`Failed to load media: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch available media:', err);
      onError?.('Failed to load media. Please try again.');
    } finally {
      setLoadingMedia(false);
    }
  }, [accessToken, onError]);

  const fetchPlaygroundGallery = useCallback(async () => {
    if (!accessToken) return;

    setLoadingPlayground(true);
    const startTime = performance.now();
    try {
      console.log('🚀 Fetching playground gallery...');
      const response = await fetch('/api/playground/gallery', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      const responseTime = performance.now() - startTime;
      console.log(`⏱️ Playground API response took ${responseTime.toFixed(2)}ms, status:`, response.status);
      if (response.ok) {
        const data = await response.json();
        const processingTime = performance.now() - startTime;
        console.log(`📦 Playground API data processed in ${processingTime.toFixed(2)}ms, items:`, data.media?.length);
        setPlaygroundGallery(data.media || []);
      } else {
        const errorData = await response.json();
        console.error('Playground gallery API error:', errorData);

        // Handle authentication errors specifically
        if (response.status === 401 || response.status === 403) {
          console.error('Authentication failed - token may be expired');
          onError?.('Your session has expired. Please refresh the page and sign in again to load your media.');
          // Clear the playground gallery to show proper empty state
          setPlaygroundGallery([]);
        } else {
          onError?.(`Failed to load playground gallery: ${errorData.error || 'Unknown error'}`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch playground gallery:', err);
      onError?.('Failed to load playground gallery. Please try again.');
    } finally {
      setLoadingPlayground(false);
    }
  }, [accessToken, onError]);

  const fetchAvailableTreatments = useCallback(async () => {
    if (!accessToken) return;

    try {
      const response = await fetch('/api/treatments', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableTreatments(data.treatments || []);
      }
    } catch (err) {
      console.error('Failed to fetch available treatments:', err);
    }
  }, [accessToken]);

  const getFilteredMedia = useCallback((type: 'moodboard' | 'individual_image' | 'treatment' | 'video') => {
    console.log(`🔍 Filtering for ${type} - Available media: ${availableMedia.length}, Playground: ${playgroundGallery.length}`);

    // Process playground gallery items directly (they're already in the correct format)
    const playgroundItems = playgroundGallery.map(item => ({
      id: item.id,
      url: item.image_url || item.video_url,
      type: item.media_type === 'video' ? 'video' as const : 'image' as const,
      thumbnail_url: item.thumbnail_url || item.image_url,
      metadata: item.generation_metadata || {},
      preset: item.generation_metadata?.preset || item.generation_metadata?.style || 'realistic',
      source: 'playground_gallery',
      title: item.title,
      description: item.description,
      width: item.width,
      height: item.height,
      image_url: item.image_url,
      video_url: item.video_url,
      media_type: item.media_type
    }));

    // Filter media library items (uploads and other media)
    const uploadItems = availableMedia.filter(item => {
      // Exclude playground items from availableMedia to avoid duplication
      if (item.source_type === 'playground' || item.source === 'playground_gallery') return false;
      // Only include upload/media table items
      if (item.source_type === 'upload' || item.source === 'media_table') return true;
      // Fallback: exclude playground items by URL pattern
      if (item.url && item.url.includes('playground-images')) return false;
      return true;
    });

    
    switch (type) {
      case 'moodboard':
        return {
          playground: playgroundItems.filter(item => item.type === 'image'),
          media: uploadItems.filter(item => item.type === 'image' || !item.type),
          treatments: []
        };
      case 'individual_image':
        return {
          playground: playgroundItems.filter(item => item.type === 'image'),
          media: uploadItems.filter(item => item.type === 'image' || !item.type),
          treatments: []
        };
      case 'treatment':
        return {
          playground: [],
          media: [],
          treatments: availableTreatments
        };
      case 'video':
        return {
          playground: playgroundItems.filter(item => item.type === 'video'),
          media: availableMedia.filter(item => item.type === 'video'),
          treatments: []
        };
      default:
        return {
          playground: playgroundItems,
          media: availableMedia,
          treatments: []
        };
    }
  }, [availableMedia, playgroundGallery, availableTreatments]);

  const handleMediaSelect = useCallback((media: MediaItem) => {
    console.log('Media selected:', media);
    console.log('Media preset:', media.preset);
    console.log('Media metadata:', media.metadata);
    console.log('Media source:', media.source);
    console.log('Media keys:', Object.keys(media));

    setSelectedMedia(prev => {
      console.log('Current selectedMedia:', prev);

      if (prev.some(item => item.id === media.id)) {
        console.log('Removing media:', media.id);
        return prev.filter(item => item.id !== media.id);
      } else if (prev.length < 6) {
        console.log('Adding media:', media.id);
        return [...prev, media];
      } else {
        console.log('Cannot add more media - limit reached');
        return prev;
      }
    });
  }, []);

  const handleMediaUpload = useCallback(async (file: File) => {
    if (!accessToken) return;

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        const newMedia: MediaItem = {
          id: data.id,
          url: data.url,
          type: data.type,
          thumbnail_url: data.thumbnail_url
        };
        setAvailableMedia(prev => [newMedia, ...prev]);
        return newMedia;
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
        onError?.('Failed to upload media');
      }
    } catch (err) {
      console.error('Failed to upload media:', err);
      onError?.('Failed to upload media');
    } finally {
      setUploadingMedia(false);
    }
  }, [accessToken, onError]);

  const promoteToMedia = useCallback(async (galleryItemId: string) => {
    if (!accessToken) return;

    setPromotingImage(galleryItemId);
    try {
      const response = await fetch('/api/playground/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ gallery_item_id: galleryItemId })
      });

      if (response.ok) {
        await fetchAvailableMedia();
        await fetchPlaygroundGallery();
      } else {
        const errorData = await response.json();
        console.error('Promotion failed:', errorData);
        onError?.('Failed to promote image');
      }
    } catch (err) {
      console.error('Failed to promote image:', err);
      onError?.('Failed to promote image');
    } finally {
      setPromotingImage(null);
    }
  }, [accessToken, fetchAvailableMedia, fetchPlaygroundGallery, onError]);

  const clearSelectedMedia = useCallback(() => {
    setSelectedMedia([]);
  }, []);

  return {
    // State
    selectedMedia,
    availableMedia,
    playgroundGallery,
    availableTreatments,
    previewIndex,
    loadingMedia,
    loadingPlayground,
    uploadingMedia,
    promotingImage,

    // Actions
    fetchAvailableMedia,
    fetchPlaygroundGallery,
    fetchAvailableTreatments,
    getFilteredMedia,
    handleMediaSelect,
    handleMediaUpload,
    promoteToMedia,
    clearSelectedMedia,
    setPreviewIndex,
    setSelectedMedia,
  };
}
