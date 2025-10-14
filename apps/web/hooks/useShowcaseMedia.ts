import { useState, useCallback, useEffect } from 'react';

export interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
  metadata?: any;
  preset?: string;
  source?: string;
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
    try {
      console.log('Fetching available media...');
      const response = await fetch('/api/media', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      console.log('Media API response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Media API data:', data);
        console.log('Sample media item from API:', data.media[0]);
        setAvailableMedia(data.media.map((m: any) => ({
          id: m.id,
          url: m.url,
          type: m.type,
          thumbnail_url: m.thumbnail_url || m.url,
          metadata: m.metadata,
          preset: m.preset,
          source: m.source,
          width: m.width,
          height: m.height
        })));
      } else {
        const errorData = await response.json();
        console.error('Media API error:', errorData);
        onError?.(`Failed to load media: ${errorData.error || 'Unknown error'}`);
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
    try {
      console.log('Fetching playground gallery...');
      const response = await fetch('/api/playground/gallery', {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      console.log('Playground gallery response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Playground gallery data:', data);
        setPlaygroundGallery(data.media || []);
      } else {
        const errorData = await response.json();
        console.error('Playground gallery API error:', errorData);
        onError?.(`Failed to load playground gallery: ${errorData.error || 'Unknown error'}`);
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
    console.log('Filtering media for type:', type);
    console.log('Available media:', availableMedia);
    console.log('Playground gallery:', playgroundGallery);

    switch (type) {
      case 'moodboard':
        return {
          playground: playgroundGallery.filter(item => item.media_type === 'image'),
          media: availableMedia.filter(item => item.type === 'image'),
          treatments: []
        };
      case 'individual_image':
        return {
          playground: playgroundGallery.filter(item => item.media_type === 'image'),
          media: availableMedia.filter(item =>
            item.type === 'image' || !item.type
          ),
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
          playground: playgroundGallery.filter(item => item.media_type === 'video'),
          media: availableMedia.filter(item => item.type === 'video'),
          treatments: []
        };
      default:
        return {
          playground: playgroundGallery,
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
