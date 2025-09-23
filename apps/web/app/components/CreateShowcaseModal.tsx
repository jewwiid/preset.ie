'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Image as ImageIcon, Video, FileText, Palette, X, Check, Upload, Eye, EyeOff, Globe, Lock } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { Badge } from '../../components/ui/badge';

interface CreateShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  thumbnail_url?: string;
  metadata?: any;
  preset?: string;
  source?: string;
}

export default function CreateShowcaseModal({ isOpen, onClose, onSuccess }: CreateShowcaseModalProps) {
  const { user, session } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'moodboard' | 'individual_image' | 'treatment' | 'video'>('individual_image');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userSubscriptionTier, setUserSubscriptionTier] = useState<string>('FREE');
  const [monthlyShowcaseCount, setMonthlyShowcaseCount] = useState<number>(0);
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([]);
  const [playgroundGallery, setPlaygroundGallery] = useState<any[]>([]);
  const [availableTreatments, setAvailableTreatments] = useState<Array<{ id: string; title: string; }>>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [selectedMoodboard, setSelectedMoodboard] = useState<string>('');
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [promotingImage, setPromotingImage] = useState<string | null>(null)
  const [previewIndex, setPreviewIndex] = useState(0);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [loadingPlayground, setLoadingPlayground] = useState(false);

  useEffect(() => {
    if (user && session) {
      fetchUserProfile();
      fetchAvailableMedia();
      fetchPlaygroundGallery();
      fetchAvailableTreatments();
    }
  }, [user, session]);

  // Reset preview index when selectedMedia changes
  useEffect(() => {
    if (selectedMedia.length === 0) {
      setPreviewIndex(0);
    } else if (previewIndex >= selectedMedia.length) {
      setPreviewIndex(selectedMedia.length - 1);
    }
  }, [selectedMedia, previewIndex]);

  // Clear selected media when showcase type changes
  useEffect(() => {
    setSelectedMedia([]);
    setSelectedMoodboard('');
  }, [type]);

  // Render filtered media based on showcase type
  const renderFilteredMedia = () => {
    const filtered = getFilteredMedia();
    
    // Show treatments section for treatment type
    if (type === 'treatment' && filtered.treatments && filtered.treatments.length > 0) {
      return (
        <>
          <div className="col-span-4 text-xs text-muted-foreground font-medium mb-2">
            🎬 Available Treatments ({filtered.treatments.length})
          </div>
          {filtered.treatments.map((treatment) => (
            <div key={treatment.id} className="relative group">
              <button
                type="button"
                className="relative rounded-lg overflow-hidden border-2 transition-all w-full aspect-square bg-muted/50 hover:bg-muted/70"
                onClick={() => {
                  setSelectedMoodboard(treatment.id);
                }}
                disabled={loading || !canCreateShowcase()}
              >
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <div className="text-2xl mb-2">🎬</div>
                  <div className="text-xs font-medium">{treatment.title}</div>
                </div>
              </button>
            </div>
          ))}
        </>
      );
    }
    
    // Show filtered playground gallery
    if (filtered.playground.length > 0) {
      return (
        <>
          <div className="col-span-4 text-xs text-muted-foreground font-medium mb-2">
            🎨 Playground Gallery ({filtered.playground.length})
          </div>
          {filtered.playground.map((item) => (
            <div key={`playground-${item.id}`} className="relative group">
              <button
                type="button"
                className={`relative rounded-lg overflow-hidden border-2 transition-all w-full ${
                  selectedMedia.some(media => media.id === `playground-${item.id}`)
                    ? 'border-primary ring-2 ring-primary/20'
                    : 'border-border hover:border-border'
                }`}
                style={{
                  aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : '1/1'
                }}
                onClick={() => handleMediaSelect({
                  id: `playground-${item.id}`,
                  url: item.image_url || item.video_url,
                  type: item.media_type === 'video' ? 'video' as const : 'image' as const,
                  thumbnail_url: item.thumbnail_url || item.image_url,
                  metadata: item.generation_metadata || {},
                  preset: item.generation_metadata?.preset || item.generation_metadata?.style || 'realistic',
                  source: 'playground_gallery'
                })}
                disabled={loading || !canCreateShowcase() || 
                  (selectedMedia.length >= 6 && !selectedMedia.some(media => media.id === `playground-${item.id}`))}
              >
                {item.media_type === 'video' ? (
                  <video
                    src={item.video_url || item.image_url}
                    className="w-full h-full object-cover"
                    muted
                    preload="metadata"
                    poster={item.thumbnail_url || item.image_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={item.image_url}
                    alt={item.title || 'Playground image'}
                    className="w-full h-full object-cover"
                  />
                )}
                {item.is_promoted && (
                  <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-1 py-0.5 rounded">
                    ✓
                  </div>
                )}
              </button>
              {item.can_promote && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    promoteToMedia(item.id);
                  }}
                  disabled={promotingImage === item.id || loading}
                  className="absolute bottom-1 left-1 bg-blue-500 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {promotingImage === item.id ? '...' : 'Promote'}
                </button>
              )}
            </div>
          ))}
        </>
      );
    }
    
    // Show filtered media library
    if (filtered.media.length > 0) {
      return (
        <>
          <div className="col-span-4 text-xs text-muted-foreground font-medium mb-2 mt-4">
            📁 Media Library ({filtered.media.length})
          </div>
          {filtered.media.map((media) => (
            <button
              key={media.id}
              type="button"
              onClick={() => handleMediaSelect(media)}
              className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                selectedMedia.some(item => item.id === media.id)
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-border'
              }`}
              style={{
                aspectRatio: media.width && media.height ? `${media.width}/${media.height}` : '1/1'
              }}
              disabled={loading || !canCreateShowcase() || 
                (selectedMedia.length >= 6 && !selectedMedia.some(item => item.id === media.id))}
            >
              {media.type === 'video' ? (
                <video 
                  src={media.url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                  poster={media.thumbnail_url}
                />
              ) : (
                <img
                  src={media.thumbnail_url || media.url}
                  alt="Media"
                  className="w-full h-full object-cover"
                />
              )}
              {selectedMedia.some(item => item.id === media.id) && (
                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                  <Check className="h-6 w-6 text-primary" />
                </div>
              )}
            </button>
          ))}
        </>
      );
    }
    
    // Loading state
    if (loadingMedia || loadingPlayground) {
      return (
        <div className="col-span-4 flex flex-col items-center justify-center py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
          <p className="text-sm text-muted-foreground mb-2">Loading media...</p>
          <p className="text-xs text-muted-foreground">Fetching your media and playground gallery</p>
        </div>
      );
    }
    
    // Empty state
    return (
      <div className="col-span-4 flex flex-col items-center justify-center py-8 text-center">
        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground mb-2">
          {type === 'treatment' ? 'No treatments available' : 
           type === 'video' ? 'No videos available' : 
           'No media available'}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          {type === 'treatment' ? 'Generate treatments to create showcases' :
           type === 'video' ? 'Upload videos to create showcases' :
           'Upload media to create showcases'}
        </p>
        <div className="space-y-2">
          <div className="relative">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleMediaUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={uploadingMedia || loading || !canCreateShowcase()}
            />
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              disabled={uploadingMedia || loading || !canCreateShowcase()}
            >
              {uploadingMedia ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Media
                </>
              )}
            </Button>
          </div>
          <div className="space-y-1">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => {
                fetchAvailableMedia();
                fetchPlaygroundGallery();
              }}
              disabled={loadingMedia || loadingPlayground}
              className="text-xs"
            >
              Refresh Media
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug/media', {
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                  });
                  const data = await response.json();
                  console.log('Debug data:', data);
                  alert(`Debug info logged to console. Profile exists: ${data.debug.profileExists}, Total media: ${data.debug.totalMediaRecords}`);
                } catch (err) {
                  console.error('Debug error:', err);
                }
              }}
              className="text-xs"
            >
              Debug Media
            </Button>
            <Button 
              type="button" 
              variant="ghost" 
              size="sm"
              onClick={async () => {
                try {
                  const response = await fetch('/api/debug/fix-media-ownership', {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${session?.access_token}` }
                  });
                  const data = await response.json();
                  console.log('Fix media ownership result:', data);
                  alert(`Fixed ${data.updatedRecords || 0} media records. Refreshing media list...`);
                  fetchAvailableMedia();
                } catch (err) {
                  console.error('Fix media ownership error:', err);
                }
              }}
              className="text-xs"
            >
              Fix Media Ownership
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserSubscriptionTier(data.subscription_tier || 'FREE');
        setMonthlyShowcaseCount(data.monthly_showcase_count || 0);
      }
    } catch (err) {
      console.error('Failed to fetch user profile:', err);
    }
  };

  const fetchAvailableMedia = async () => {
    setLoadingMedia(true);
    try {
      console.log('Fetching available media...');
      const response = await fetch('/api/media', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
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
          source: m.source
        })));
      } else {
        const errorData = await response.json();
        console.error('Media API error:', errorData);
        setError(`Failed to load media: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to fetch available media:', err);
      setError('Failed to load media. Please try again.');
    } finally {
      setLoadingMedia(false);
    }
  };

  const fetchPlaygroundGallery = async () => {
    setLoadingPlayground(true);
    try {
      console.log('Fetching playground gallery...');
      const response = await fetch('/api/playground/gallery-with-status', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      console.log('Playground gallery response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Playground gallery data:', data);
        setPlaygroundGallery(data.gallery || []);
      } else {
        const errorData = await response.json();
        console.error('Playground gallery API error:', errorData);
        setError(`Failed to load playground gallery: ${errorData.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error('Failed to fetch playground gallery:', err);
      setError('Failed to load playground gallery. Please try again.');
    } finally {
      setLoadingPlayground(false);
    }
  };

  const fetchAvailableTreatments = async () => {
    try {
      const response = await fetch('/api/treatments', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableTreatments(data.treatments || []);
      }
    } catch (err) {
      console.error('Failed to fetch available treatments:', err);
    }
  };

  const getMaxShowcases = () => {
    switch (userSubscriptionTier) {
      case 'FREE':
        return 3;
      case 'PLUS':
        return 10;
      case 'PRO':
        return -1; // unlimited
      default:
        return 0;
    }
  };

  const canCreateShowcase = () => {
    const maxShowcases = getMaxShowcases();
    return maxShowcases === -1 || monthlyShowcaseCount < maxShowcases;
  };

  // Filter media based on showcase type
  const getFilteredMedia = () => {
    switch (type) {
      case 'moodboard':
        // Moodboards should show multiple images, prefer playground gallery
        return {
          playground: playgroundGallery.filter(item => item.media_type === 'image'),
          media: availableMedia.filter(item => item.type === 'image')
        };
      case 'individual_image':
        // Individual images can be any single image
        return {
          playground: playgroundGallery.filter(item => item.media_type === 'image'),
          media: availableMedia.filter(item => item.type === 'image')
        };
      case 'treatment':
        // Treatments should show available treatments
        return {
          playground: [],
          media: [],
          treatments: availableTreatments
        };
      case 'video':
        // Videos should only show video content
        return {
          playground: playgroundGallery.filter(item => item.media_type === 'video'),
          media: availableMedia.filter(item => item.type === 'video')
        };
      default:
        return {
          playground: playgroundGallery,
          media: availableMedia
        };
    }
  };

  const handleMediaSelect = (media: MediaItem) => {
      console.log('Media selected:', media);
      console.log('Media preset:', media.preset);
      console.log('Media metadata:', media.metadata);
      console.log('Media source:', media.source);
      console.log('Media keys:', Object.keys(media));
      console.log('Current selectedMedia:', selectedMedia);
      
      if (selectedMedia.some(item => item.id === media.id)) {
        console.log('Removing media:', media.id);
        setSelectedMedia(prev => prev.filter(item => item.id !== media.id));
      } else if (selectedMedia.length < 6) {
        console.log('Adding media:', media.id);
        setSelectedMedia(prev => [...prev, media]);
      } else {
        console.log('Cannot add more media - limit reached');
      }
    };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingMedia(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', file.name);

      const response = await fetch('/api/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${session?.access_token}` },
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
      } else {
        const errorData = await response.json();
        console.error('Upload failed:', errorData);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingMedia(false);
    }
  };

  const promoteToMedia = async (galleryItemId: string) => {
    setPromotingImage(galleryItemId);
    try {
      const response = await fetch('/api/playground/promote-to-media', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}` 
        },
        body: JSON.stringify({ galleryItemId })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Promotion successful:', data);
        // Refresh both media lists
        fetchAvailableMedia();
        fetchPlaygroundGallery();
      } else {
        const errorData = await response.json();
        console.error('Promotion failed:', errorData);
      }
    } catch (err) {
      console.error('Promotion error:', err);
    } finally {
      setPromotingImage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submit clicked - selectedMedia:', selectedMedia);
    console.log('Submit clicked - selectedMedia.length:', selectedMedia.length);
    
    if (!canCreateShowcase()) {
      setError('Monthly showcase limit reached. Upgrade your plan to create more showcases.');
      return;
    }

    if (selectedMedia.length === 0) {
      setError('Please select at least one media item.');
      return;
    }

    setLoading(true);
    setError(null);

      const requestBody = {
        title,
        description,
        type,
        visibility,
        tags,
        mediaIds: selectedMedia.map(media => media.id),
        moodboardId: selectedMoodboard || null,
        mediaMetadata: selectedMedia.map(media => ({
          id: media.id,
          preset: media.preset,
          metadata: media.metadata,
          source: media.source
        }))
      };

    console.log('Request body:', requestBody);
    console.log('Media IDs being sent:', selectedMedia.map(media => media.id));

    try {
      const response = await fetch('/api/showcases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        onSuccess();
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setSelectedMedia([]);
        setTags([]);
        setNewTag('');
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create showcase');
      }
    } catch (err) {
      console.error('Error creating showcase:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1200px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle>Create Showcase</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Share your creative work with the community
          </p>
        </DialogHeader>

        {/* Monthly Limit Reached Banner */}
        {!canCreateShowcase() && (
          <div className="flex-shrink-0 mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center space-x-2">
              <EyeOff className="h-4 w-4 text-destructive" />
              <div>
                <p className="text-sm font-medium text-destructive">
                  Monthly Limit Reached
                </p>
                <p className="text-xs text-destructive/80">
                  You've used {monthlyShowcaseCount} of {getMaxShowcases()} showcases this month. 
                  Upgrade your plan to create more showcases.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
          {error && (
          <div className="flex-shrink-0 mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          {/* Main Content Grid */}
          <div className="grid grid-cols-5 gap-6 flex-1 min-h-0">
            {/* Left Column - Media Selection */}
            <div className="col-span-3 space-y-3 overflow-hidden flex flex-col">
              <Label>Select Media (Max 6)</Label>
              
              {/* Main Preview - Above the media grid */}
              {selectedMedia.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <div className="text-sm font-medium mb-3 text-muted-foreground">
                    Preview
                  </div>
                  <div className="relative w-full h-64 rounded-lg overflow-hidden border border-border bg-background">
                    {selectedMedia[previewIndex].type === 'video' ? (
                      <video
                        src={selectedMedia[previewIndex].url}
                        className="w-full h-full object-cover"
                        controls
                        preload="metadata"
                        poster={selectedMedia[previewIndex].thumbnail_url}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={selectedMedia[previewIndex].thumbnail_url || selectedMedia[previewIndex].url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    )}
                    {selectedMedia.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                        {previewIndex + 1} of {selectedMedia.length}
                      </div>
                    )}
                  </div>
                  
                  {/* Media Info */}
                  <div className="mt-3 p-3 bg-muted/50 rounded-lg">
                    <div className="text-xs text-muted-foreground space-y-1">
                      {/* Debug info */}
                      <div className="text-xs text-muted-foreground mb-2">
                        Debug: preset={selectedMedia[previewIndex].preset || 'none'}, 
                        metadata={selectedMedia[previewIndex].metadata ? 'exists' : 'none'},
                        source={selectedMedia[previewIndex].source || 'unknown'}
                      </div>
                      
                      {selectedMedia[previewIndex].preset && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Preset:</span>
                          <span className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                            {selectedMedia[previewIndex].preset}
                          </span>
                        </div>
                      )}
                      {selectedMedia[previewIndex].metadata?.prompt && (
                <div>
                          <span className="font-medium">Prompt:</span>
                          <p className="text-xs mt-1 max-h-32 overflow-y-auto bg-background/50 p-2 rounded border">
                            {selectedMedia[previewIndex].metadata.prompt}
                          </p>
                        </div>
                      )}
                      {selectedMedia[previewIndex].metadata?.aspect_ratio && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Aspect Ratio:</span>
                          <span>{selectedMedia[previewIndex].metadata.aspect_ratio}</span>
                        </div>
                      )}
                      {selectedMedia[previewIndex].metadata?.resolution && (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Resolution:</span>
                          <span>{selectedMedia[previewIndex].metadata.resolution}</span>
                        </div>
                      )}
                      
                      {/* Show raw metadata for debugging */}
                      {selectedMedia[previewIndex].metadata && (
                        <div className="mt-2 p-2 bg-background/50 rounded text-xs">
                          <span className="font-medium">Raw Metadata:</span>
                          <pre className="text-xs mt-1 overflow-auto max-h-20">
                            {JSON.stringify(selectedMedia[previewIndex].metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Selected Media List - Below preview */}
              {selectedMedia.length > 0 && (
                <div className="bg-muted/30 rounded-lg p-4 border">
                  <div className="text-sm font-medium mb-3 text-muted-foreground">
                    Selected Media ({selectedMedia.length}/6)
                  </div>
                  <div className="space-y-3">
                    {selectedMedia.map((media, index) => (
                      <div key={media.id} className="flex items-center space-x-3">
                        <button
                          type="button"
                          onClick={() => setPreviewIndex(index)}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden border transition-all ${
                            previewIndex === index ? 'border-primary ring-2 ring-primary/20' : 'border-border hover:border-border'
                          }`}
                        >
                          {media.type === 'video' ? (
                            <video
                              src={media.url}
                              className="w-full h-full object-cover"
                              muted
                              preload="metadata"
                              poster={media.thumbnail_url}
                            />
                          ) : (
                            <img
                              src={media.thumbnail_url || media.url}
                              alt={`Selected ${media.type}`}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">
                            {media.type === 'video' ? 'Video' : 'Image'} {index + 1}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {media.type === 'video' ? 'Video content' : 'Image content'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('Remove button clicked for media:', media.id);
                            setSelectedMedia(prev => prev.filter(item => item.id !== media.id))
                          }}
                          className="flex-shrink-0 p-2 hover:bg-destructive/10 rounded-full transition-colors border border-destructive/20 hover:border-destructive/40 bg-destructive/5"
                          disabled={loading || !canCreateShowcase()}
                          title="Remove from selection"
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex-1 min-h-0">
                <div className="grid grid-cols-4 gap-3 h-full overflow-y-auto border rounded-lg p-4">
                  {renderFilteredMedia()}
                </div>
              </div>
            </div>


            {/* Right Column - Form Fields */}
            <div className="col-span-2 space-y-4 overflow-y-auto pr-2">
              {/* Title and Description */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a compelling title"
                    disabled={loading || !canCreateShowcase()}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your showcase..."
                    rows={2}
                    disabled={loading || !canCreateShowcase()}
                  />
                </div>
              </div>

              {/* Showcase Type - Horizontal */}
              <div className="space-y-2">
                <Label>Showcase Type</Label>
                <div className="flex gap-2">
                  {[
                    { value: 'individual_image', label: 'Image', icon: ImageIcon },
                    { value: 'moodboard', label: 'Moodboard', icon: Palette },
                    { value: 'video', label: 'Video', icon: Video },
                    { value: 'treatment', label: 'Treatment', icon: FileText }
                  ].map((option) => {
                    const Icon = option.icon
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={type === option.value ? "default" : "outline"}
                        onClick={() => setType(option.value as any)}
                        disabled={loading || !canCreateShowcase()}
                        className="flex items-center space-x-2"
                        size="sm"
                      >
                        <Icon className="h-4 w-4" />
                        <span>{option.label}</span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              {/* Visibility and Tags - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                {/* Visibility */}
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={visibility === 'public' ? "default" : "outline"}
                      onClick={() => setVisibility('public')}
                      disabled={loading || !canCreateShowcase()}
                      className="flex items-center space-x-2"
                      size="sm"
                    >
                      <Globe className="h-4 w-4" />
                      <span>Public</span>
                    </Button>
                    <Button
                      type="button"
                      variant={visibility === 'private' ? "default" : "outline"}
                      onClick={() => setVisibility('private')}
                      disabled={loading || !canCreateShowcase()}
                      className="flex items-center space-x-2"
                      size="sm"
                    >
                      <Lock className="h-4 w-4" />
                      <span>Private</span>
                    </Button>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <Label>Tags (Optional)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      disabled={loading || !canCreateShowcase()}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          if (newTag.trim() && !tags.includes(newTag.trim())) {
                            setTags([...tags, newTag.trim()])
                            setNewTag('')
                          }
                        }
                      }}
                    />
                    <Button 
                      type="button" 
                      onClick={() => {
                        if (newTag.trim() && !tags.includes(newTag.trim())) {
                          setTags([...tags, newTag.trim()])
                          setNewTag('')
                        }
                      }}
                      disabled={loading || !canCreateShowcase() || !newTag.trim()}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs">
                      {tag}
                      <button
                        type="button"
                            onClick={() => setTags(tags.filter((_, i) => i !== index))}
                            className="ml-1 hover:text-destructive"
                            disabled={loading || !canCreateShowcase()}
                          >
                            <X className="h-2 w-2" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={loading || !canCreateShowcase()}
            onClick={handleSubmit}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                Creating...
              </>
            ) : (
              'Create Showcase'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
