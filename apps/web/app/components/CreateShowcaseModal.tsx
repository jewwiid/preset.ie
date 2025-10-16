'use client';

import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Plus, Image as ImageIcon, Video, FileText, Palette, X, Check, Upload, Eye, EyeOff, Globe, Lock, Camera } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { Badge } from '../../components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useFormManager } from '../../hooks/useFormManager';
import { useShowcaseMedia } from '../../hooks/useShowcaseMedia';
import VoiceToTextButton from '@/components/ui/VoiceToTextButton';

// Define ShowcaseFormData type (moved from deleted useShowcaseForm hook)
export interface ShowcaseFormData {
  title: string;
  description: string;
  type: 'moodboard' | 'individual_image' | 'treatment' | 'video' | 'gig';
  visibility: 'public' | 'private';
  tags: string[];
  selectedMoodboard: string;
}
import { useShowcaseSubscription } from '../../hooks/useShowcaseSubscription';

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
  width?: number;
  height?: number;
}

export default function CreateShowcaseModal({ isOpen, onClose, onSuccess }: CreateShowcaseModalProps) {
  const { user, session } = useAuth();

  // User subscription tier state
  const [userSubscriptionTier, setUserSubscriptionTier] = React.useState<string>('FREE');

  // Show all media state
  const [showAllMedia, setShowAllMedia] = React.useState<boolean>(false);

  // Full-screen preview modal state
  const [isPreviewModalOpen, setIsPreviewModalOpen] = React.useState<boolean>(false);

  // Show more options state
  const [showMoreOptions, setShowMoreOptions] = React.useState<boolean>(false);

  // Close preview modal on Escape key and dropdown on outside click
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewModalOpen) {
        setIsPreviewModalOpen(false);
      }
      if (e.key === 'Escape' && showMoreOptions) {
        setShowMoreOptions(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (showMoreOptions && !target.closest('.more-options-dropdown')) {
        setShowMoreOptions(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isPreviewModalOpen, showMoreOptions]);

  // Form state management using useFormManager
  const formBase = useFormManager<ShowcaseFormData>({
    initialData: {
      title: '',
      description: '',
      type: 'individual_image',
      visibility: 'public',
      tags: [],
      selectedMoodboard: ''
    },
    validationRules: {
      title: (val) => !val.trim() ? 'Please enter a title for your showcase' : null,
      description: (val) => !val.trim() ? 'Please enter a description' : null,
    },
    onError: (errorMsg) => console.error('Form error:', errorMsg)
  });

  // Tag management state
  const [newTag, setNewTag] = React.useState('');

  // Compatibility wrapper for old API
  const form = React.useMemo(() => ({
    // Form data
    formData: formBase.formData,
    title: formBase.formData.title,
    description: formBase.formData.description,
    type: formBase.formData.type,
    visibility: formBase.formData.visibility,
    tags: formBase.formData.tags,
    selectedMoodboard: formBase.formData.selectedMoodboard,

    // Tag input
    newTag,
    setNewTag,

    // State
    loading: formBase.loading,
    setLoading: (val: boolean) => {}, // No-op since loading is managed by formBase
    error: (formBase.errors as any)._form as string | null,
    setError: (val: string | null) => formBase.setFieldError('_form' as any, val),

    // Actions
    updateField: formBase.updateField,
    addTag: () => {
      if (!newTag.trim()) return;
      const trimmedTag = newTag.trim();
      if (formBase.formData.tags.includes(trimmedTag)) {
        formBase.setFieldError('_form' as any, 'Tag already added');
        return;
      }
      formBase.updateField('tags', [...formBase.formData.tags, trimmedTag]);
      setNewTag('');
    },
    removeTag: (tagToRemove: string) => {
      formBase.updateField('tags', formBase.formData.tags.filter(tag => tag !== tagToRemove));
    },
    resetForm: formBase.resetForm,
    validateForm: formBase.validateForm,

    // Setters for backward compatibility
    setTitle: (value: string) => formBase.updateField('title', value),
    setDescription: (value: string) => formBase.updateField('description', value),
    setType: (value: ShowcaseFormData['type']) => formBase.updateField('type', value),
    setVisibility: (value: ShowcaseFormData['visibility']) => formBase.updateField('visibility', value),
    setTags: (value: string[]) => formBase.updateField('tags', value),
    setSelectedMoodboard: (value: string) => formBase.updateField('selectedMoodboard', value),
  }), [formBase.formData, formBase.loading, formBase.errors, newTag]);

  // Media management hook
  const media = useShowcaseMedia({
    accessToken: session?.access_token,
    onError: (errorMsg) => form.setError(errorMsg)
  });

  // Subscription/limits hook
  const subscription = useShowcaseSubscription({
    accessToken: session?.access_token
  });

  useEffect(() => {
    if (user && session) {
      console.log('🔄 Initial data fetch for user:', user.id);
      const fetchStartTime = performance.now();

      // Fetch data in parallel for better performance
      const fetchData = async () => {
        try {
          await Promise.all([
            subscription.fetchUserProfile(),
            media.fetchAvailableMedia(),
            media.fetchPlaygroundGallery(),
            media.fetchAvailableTreatments()
          ]);

          console.log(`🎯 All data fetch completed in ${(performance.now() - fetchStartTime).toFixed(2)}ms`);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      };

      fetchData();
      
      // Fetch user subscription tier
      const fetchUserProfile = async () => {
        try {
          const { supabase } = await import('../../lib/supabase');
          const { data: profile } = await supabase
            .from('users_profile')
            .select('subscription_tier')
            .eq('user_id', user.id)
            .single()
          
          if (profile) {
            setUserSubscriptionTier(profile.subscription_tier || 'FREE')
          }
        } catch (error) {
          console.warn('Failed to fetch user profile:', error)
        }
      }
      
      fetchUserProfile()
    }
  }, [user, session?.access_token]); // Only re-fetch when user changes or token changes

  // Clear selected media when showcase type changes
  useEffect(() => {
    media.clearSelectedMedia();
    form.setSelectedMoodboard('');
    setShowAllMedia(false); // Reset to filtered view when type changes
  }, [form.type]);

  // Render filtered media based on showcase type - memoized to prevent excessive re-renders
  const filteredMedia = React.useMemo(() => {
    const filtered = showAllMedia
      ? media.getFilteredMedia('individual_image' as any) // Get all images when showing all
      : media.getFilteredMedia(form.type === 'gig' ? 'individual_image' : form.type);

    console.log('🎨 renderFilteredMedia called:', {
      showAllMedia,
      formType: form.type,
      playgroundCount: filtered.playground.length,
      mediaCount: filtered.media.length,
      totalItems: filtered.playground.length + filtered.media.length,
      playgroundItems: filtered.playground.slice(0, 2).map(item => ({
        id: item.id,
        url: item.url || item.image_url,
        thumbnail_url: item.thumbnail_url,
        type: item.type || item.media_type,
        width: item.width,
        height: item.height
      })),
      mediaItems: filtered.media.slice(0, 2).map(item => ({
        id: item.id,
        url: item.url || item.image_url,
        thumbnail_url: item.thumbnail_url,
        type: item.type || item.media_type,
        width: item.width,
        height: item.height
      }))
    });
    
    // Show treatments section for treatment type
    if (form.type === 'treatment' && filtered.treatments && filtered.treatments.length > 0) {
      return (
        <>
          <div className="col-span-full text-xs text-muted-foreground font-medium mb-2">
            🎬 Available Treatments ({filtered.treatments.length})
          </div>
          {filtered.treatments.map((treatment) => (
            <div key={treatment.id} className="relative group col-span-full">
              <button
                type="button"
                className={`relative rounded-lg overflow-hidden border-2 transition-all w-full aspect-square ${
                  form.selectedMoodboard === treatment.id
                    ? 'border-primary ring-4 ring-primary/20 scale-105 bg-primary/10'
                    : 'bg-muted/50 hover:bg-muted/70 border-border/30 hover:border-primary/60'
                }`}
                onClick={() => {
                  form.setSelectedMoodboard(treatment.id);
                }}
                disabled={form.loading || !subscription.canCreateShowcase()}
              >
                <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                  <div className="text-2xl mb-2">🎬</div>
                  <div className="text-xs font-medium">{treatment.title}</div>
                </div>
                {form.selectedMoodboard === treatment.id && (
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      Selected treatment
                    </div>
                  </div>
                )}
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
          <div className="col-span-full text-xs text-muted-foreground font-medium mb-2">
            🎨 Playground Gallery ({filtered.playground.length})
          </div>
          {filtered.playground.map((item) => (
            <div key={`playground-${item.id}`} className="relative group">
              <button
                type="button"
                className={`relative rounded-2xl overflow-hidden border-2 transition-all w-full shadow-lg hover:shadow-xl ${
                  media.selectedMedia.some(media => media.id === `playground-${item.id}`)
                    ? 'border-primary ring-4 ring-primary/20 scale-105'
                    : 'border-border/30 hover:border-primary/60'
                }`}
                style={{
                  aspectRatio: item.width && item.height ? `${item.width}/${item.height}` : '1/1',
                  minHeight: '120px'
                }}
                onClick={() => media.handleMediaSelect({
                  id: `playground-${item.id}`,
                  url: item.image_url || item.video_url,
                  type: item.media_type === 'video' ? 'video' as const : 'image' as const,
                  thumbnail_url: item.thumbnail_url || item.image_url,
                  metadata: item.generation_metadata || {},
                  preset: item.generation_metadata?.preset || item.generation_metadata?.style || 'realistic',
                  source: 'playground_gallery'
                })}
                disabled={form.loading || !subscription.canCreateShowcase() || 
                  (media.selectedMedia.length >= 6 && !media.selectedMedia.some(media => media.id === `playground-${item.id}`))}
              >
                {item.media_type === 'video' ? (
                  <video
                    src={item.video_url || item.image_url}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    muted
                    preload="metadata"
                    poster={item.thumbnail_url || item.image_url}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <div className="relative w-full h-full">
                    {/* Debug overlay showing URL */}
                    <div className="absolute top-0 left-0 right-0 bg-black/70 text-white text-xs p-1 z-10 opacity-0 hover:opacity-100 transition-opacity">
                      URL: {item.image_url?.slice(0, 50)}...
                    </div>
                    {/* Fallback for missing URL */}
                    {!item.image_url && (
                      <div className="absolute inset-0 bg-muted/80 flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                        <div>No URL<br/>ID: {item.id?.slice(0, 8)}</div>
                      </div>
                    )}
                      <img
                      src={item.image_url}
                      alt={item.title || 'Playground image'}
                      className="w-full h-full object-contain transition-transform group-hover:scale-110 bg-muted/20"
                    onError={(e) => {
                      console.error('Failed to load playground image:', {
                        image_url: item.image_url,
                        item_id: item.id,
                        item_type: item.media_type,
                        width: item.width,
                        height: item.height
                      });
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      // Show error placeholder with debug info
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.error-placeholder')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-placeholder absolute inset-0 bg-muted/50 flex items-center justify-center text-muted-foreground text-xs p-2 text-center';
                        errorDiv.innerHTML = `<div>Load Error<br/>ID: ${item.id?.slice(0, 8)}</div>`;
                        parent.appendChild(errorDiv);
                      }
                    }}
                    onLoad={() => {
                      console.log('✅ Successfully loaded playground image:', {
                        image_url: item.image_url,
                        item_id: item.id,
                        dimensions: `${item.width}x${item.height}`
                      });
                    }}
                    />
                  </div>
                )}

                {/* Solid overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Selection overlay */}
                {media.selectedMedia.some(media => media.id === `playground-${item.id}`) && (
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      Click to deselect
                    </div>
                  </div>
                )}
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                  <div className="space-y-1">
                    {item.generation_metadata?.preset && (
                      <div className="text-xs font-medium bg-black/50 px-2 py-1 rounded-full inline-block">
                        🎨 {item.generation_metadata.preset}
                      </div>
                    )}
                    <div className="text-xs opacity-90">Playground Gallery</div>
                  </div>
                </div>
                
                {/* Promoted badge */}
                {item.is_promoted && (
                  <div className="absolute top-3 right-3 bg-primary-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                    ✓ Promoted
                  </div>
                )}
                
                {/* Promote button */}
                {item.can_promote && (
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      media.promoteToMedia(item.id);
                    }}
                    disabled={media.promotingImage === item.id || form.loading}
                    className="absolute top-3 left-3 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity font-medium shadow-lg"
                  >
                    {media.promotingImage === item.id ? '...' : 'Promote'}
                  </button>
                )}
              </button>
            </div>
          ))}
        </>
      );
    }

    // Show filtered media library
    if (filtered.media.length > 0) {
      return (
        <>
          <div className="col-span-full text-xs text-muted-foreground font-medium mb-2 mt-4">
            📁 Media Library ({filtered.media.length})
          </div>
          {filtered.media.map((mediaItem) => (
            <div key={mediaItem.id} className="relative group">
              <button
                type="button"
                onClick={() => media.handleMediaSelect(mediaItem)}
                className={`relative rounded-2xl overflow-hidden border-2 transition-all w-full shadow-lg hover:shadow-xl ${
                  media.selectedMedia.some(item => item.id === mediaItem.id)
                    ? 'border-primary ring-4 ring-primary/20 scale-105'
                    : 'border-border/30 hover:border-primary/60'
                }`}
                style={{
                  aspectRatio: mediaItem.width && mediaItem.height ? `${mediaItem.width}/${mediaItem.height}` : '1/1',
                  minHeight: '120px'
                }}
                disabled={form.loading || !subscription.canCreateShowcase() ||
                  (media.selectedMedia.length >= 6 && !media.selectedMedia.some(item => item.id === mediaItem.id))}
              >
                {mediaItem.type === 'video' ? (
                  <video
                    src={mediaItem.url}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    muted
                    preload="metadata"
                    poster={mediaItem.thumbnail_url}
                  />
                ) : (
                  <div className="relative w-full h-full">
                    {/* Debug overlay showing URL */}
                    <div className="absolute top-0 left-0 right-0 bg-black/70 text-white text-xs p-1 z-10 opacity-0 hover:opacity-100 transition-opacity">
                      URL: {(mediaItem.thumbnail_url || mediaItem.url)?.slice(0, 50)}...
                    </div>
                    {/* Fallback for missing URL */}
                    {!(mediaItem.thumbnail_url || mediaItem.url) && (
                      <div className="absolute inset-0 bg-muted/80 flex items-center justify-center text-muted-foreground text-xs p-2 text-center">
                        <div>No URL<br/>ID: {mediaItem.id?.slice(0, 8)}</div>
                      </div>
                    )}
                    <img
                      src={mediaItem.thumbnail_url || mediaItem.url}
                      alt="Media"
                      className="w-full h-full object-contain transition-transform group-hover:scale-110 bg-muted/20"
                    onError={(e) => {
                      console.error('Failed to load media library image:', mediaItem.thumbnail_url || mediaItem.url);
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      // Show error placeholder
                      const parent = target.parentElement;
                      if (parent && !parent.querySelector('.error-placeholder')) {
                        const errorDiv = document.createElement('div');
                        errorDiv.className = 'error-placeholder absolute inset-0 bg-muted/50 flex items-center justify-center text-muted-foreground text-xs p-2 text-center';
                        errorDiv.innerHTML = `<div>Image<br/>Failed<br/>to Load</div>`;
                        parent.appendChild(errorDiv);
                      }
                    }}
                    onLoad={() => {
                      console.log('Successfully loaded media library image:', mediaItem.thumbnail_url || mediaItem.url);
                    }}
                    />
                  </div>
                )}

                {/* Solid overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity" />
                
                {/* Selection overlay */}
                {media.selectedMedia.some(selectedItem => selectedItem.id === mediaItem.id) && (
                  <div className="absolute inset-0 bg-primary/30 flex items-center justify-center backdrop-blur-sm">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Check className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full">
                      Click to deselect
                    </div>
                  </div>
                )}
                
                {/* Content overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform">
                  <div className="space-y-1">
                    {mediaItem.preset && (
                      <div className="text-xs font-medium bg-black/50 px-2 py-1 rounded-full inline-block">
                        🎨 {mediaItem.preset}
                      </div>
                    )}
                    <div className="text-xs opacity-90">Media Library</div>
                  </div>
                </div>

                {/* Media type indicator */}
                <div className="absolute top-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-medium shadow-lg">
                  {mediaItem.type === 'video' ? '🎥 Video' : '🖼️ Image'}
                </div>
              </button>
            </div>
          ))}
        </>
      );
    }
    
    // Loading state
    if (media.loadingMedia || media.loadingPlayground) {
      return (
        <div className="col-span-full flex flex-col items-center justify-center py-8 text-center">
          <LoadingSpinner size="lg" />
          <p className="text-sm text-muted-foreground mb-2">Loading media...</p>
          <p className="text-xs text-muted-foreground">Fetching your media and playground gallery</p>
        </div>
      );
    }
    
    // Empty state - check if it's due to authentication issues
    const hasAuthError = form.error && form.error.includes('session has expired');

    return (
      <div className="col-span-full flex flex-col items-center justify-center py-12 text-center px-6">
        <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
          {hasAuthError ? (
            <div className="text-2xl">🔐</div>
          ) : (
            <Upload className="h-8 w-8 text-muted-foreground" />
          )}
        </div>
        <h4 className="text-lg font-semibold mb-2">
          {hasAuthError ? 'Authentication Required' :
           showAllMedia ? 'No content found' :
           form.type === 'treatment' ? 'No treatments available' :
           form.type === 'video' ? 'No videos available' :
           'No media available'}
        </h4>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          {hasAuthError ?
            form.error :
            showAllMedia ?
              'You haven\'t created any content yet. Start by generating images in the playground!' :
              form.type === 'treatment' ? 'Generate treatments to create showcases' :
              form.type === 'video' ? 'Upload videos to create showcases' :
              'Try clicking "Show All" to see all your content, or upload new media'
          }
        </p>
        {!hasAuthError && !showAllMedia && (
          <p className="text-xs text-muted-foreground mb-6 max-w-sm">
            💡 Tip: Use the "Show All" button to see content from all categories
          </p>
        )}
        <div className="space-y-3 w-full max-w-xs">
          <div className="relative">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) media.handleMediaUpload(file); }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              disabled={media.uploadingMedia || form.loading || !subscription.canCreateShowcase()}
            />
            <Button 
              type="button" 
              variant="default" 
              size="lg"
              disabled={media.uploadingMedia || form.loading || !subscription.canCreateShowcase()}
              className="w-full bg-primary hover:bg-primary/90"
            >
              {media.uploadingMedia ? (
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
          <div className="flex gap-2">
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={() => {
                media.fetchAvailableMedia();
                media.fetchPlaygroundGallery();
              }}
              disabled={media.loadingMedia || media.loadingPlayground}
              className="flex-1 text-xs"
            >
              Refresh
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
              className="flex-1 text-xs"
            >
              Debug
            </Button>
          </div>
        </div>
      </div>
    );
  }, [
    showAllMedia,
    form.type,
    media.getFilteredMedia,
    media.selectedMedia,
    form.loading,
    subscription.canCreateShowcase,
    media.loadingMedia,
    media.loadingPlayground,
    session?.access_token,
    media.handleMediaSelect,
    media.fetchAvailableMedia,
    media.fetchPlaygroundGallery,
    form.error
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submit clicked - selectedMedia:', media.selectedMedia);
    console.log('Submit clicked - media.selectedMedia.length:', media.selectedMedia.length);
    
    if (!subscription.canCreateShowcase()) {
      form.setError('Monthly showcase limit reached. Upgrade your plan to create more showcases.');
      return;
    }

    if (media.selectedMedia.length === 0) {
      form.setError('Please select at least one media item.');
      return;
    }

    form.setLoading(true);
    form.setError(null);

    try {
      // Check if any selected media items are playground gallery items that need promotion
      const playgroundItems = media.selectedMedia.filter(media => media.id.startsWith('playground-'));
      const regularMediaItems = media.selectedMedia.filter(media => !media.id.startsWith('playground-'));
      
      console.log('Playground items found:', playgroundItems.length);
      console.log('Regular media items found:', regularMediaItems.length);
      console.log('All selected media:', media.selectedMedia);
      
      let finalMediaIds = [...regularMediaItems.map(media => media.id)];
      
      // Promote playground gallery items to media first
      if (playgroundItems.length > 0) {
        console.log('Promoting playground gallery items:', playgroundItems);
        
        for (const playgroundItem of playgroundItems) {
          const galleryItemId = playgroundItem.id.replace('playground-', '');
          console.log('Promoting gallery item:', galleryItemId);
          
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
            // Use the new media ID
            finalMediaIds.push(data.mediaId);
          } else {
            const errorData = await response.json();
            console.error('Promotion failed:', errorData);
            throw new Error(`Failed to promote gallery item: ${errorData.error || 'Unknown error'}`);
          }
        }
      }

      const requestBody = {
        title: form.title,
        description: form.description,
        type: form.type,
        visibility: form.visibility,
        tags: form.tags,
        mediaIds: finalMediaIds,
        moodboardId: form.selectedMoodboard || null,
        mediaMetadata: media.selectedMedia.map(media => ({
          id: media.id,
          preset: media.preset,
          metadata: media.metadata,
          source: media.source
        }))
      };

      console.log('Request body:', requestBody);
      console.log('Final media IDs being sent:', finalMediaIds);

      // Special handling for gig showcases
      if (form.type === 'gig') {
        // For gig showcases, redirect to gig selection or show a message
        form.setError('To create a showcase from a completed gig, please visit the gig page and use the "Create Showcase" button there.');
        form.setLoading(false);
        return;
      }

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
        form.setTitle('');
        form.setDescription('');
        media.setSelectedMedia([]);
        form.setTags([]);
        form.setNewTag('');
        form.setError(null);
      } else {
        const errorData = await response.json();
        form.setError(errorData.error || 'Failed to create showcase');
      }
    } catch (err) {
      console.error('Error creating showcase:', err);
      form.setError(err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.');
    } finally {
      form.setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[1200px] h-[95vh] max-h-[95vh] overflow-hidden flex flex-col p-0">
        {/* Header - Compact */}
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b bg-muted/20">
          <DialogTitle className="text-xl font-bold text-primary">
            Create Showcase
          </DialogTitle>
          <p className="text-xs text-muted-foreground mt-0.5">
            Share your creative work with the community
          </p>
        </DialogHeader>

        {/* Monthly Limit Reached Banner */}
        {!subscription.canCreateShowcase() && (
          <div className="flex-shrink-0 mx-6 mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-destructive/20 rounded-full flex items-center justify-center">
                <EyeOff className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-destructive">
                  Monthly Limit Reached
                </p>
                <p className="text-xs text-destructive/80 mt-1">
                  You've used {subscription.monthlyShowcaseCount} of {subscription.getMaxShowcases()} showcases this month. 
                  <span className="underline ml-1 cursor-pointer hover:text-destructive">Upgrade your plan</span> to create more showcases.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {form.error && (
          <div className="flex-shrink-0 mx-6 mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-destructive rounded-full flex-shrink-0"></div>
              <p className="text-sm text-destructive">{form.error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-1 min-h-0 flex flex-col">
          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 flex-1 min-h-0 overflow-hidden">
            {/* Left Column - Media Selection & Preview */}
            <div className="border-r border-border/50 bg-muted/20 flex flex-col h-full min-h-0">
              {/* Media Selection Header - Compact */}
              <div className="px-6 py-3 border-b bg-background/50">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base font-semibold">Select Media</h3>
                    <p className="text-xs text-muted-foreground">Choose up to 6 items</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {(media.selectedMedia.length > 0 || form.selectedMoodboard) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          media.clearSelectedMedia();
                          form.setSelectedMoodboard('');
                        }}
                        disabled={form.loading || !subscription.canCreateShowcase()}
                        className="text-xs px-2 py-1 h-7"
                      >
                        Clear All
                      </Button>
                    )}
                    <Badge variant="secondary" className="px-2 py-1 text-xs font-medium">
                      {form.type === 'treatment'
                        ? (form.selectedMoodboard ? '1 selected' : '0 selected')
                        : `${media.selectedMedia.length}/6 selected`
                      }
                    </Badge>
                  </div>
                </div>
                
                {/* Showcase Type Quick Selector - Compact */}
                <div className="flex gap-1 flex-wrap items-center">
                  {/* Primary Options */}
                  {[
                    { value: 'individual_image', label: 'Image', icon: ImageIcon, color: 'bg-blue-500' },
                    { value: 'moodboard', label: 'Moodboard', icon: Palette, color: 'bg-purple-500' },
                    { value: 'video', label: 'Video', icon: Video, color: 'bg-primary-500' }
                  ].map((option) => {
                    const Icon = option.icon
                    return (
                      <Button
                        key={option.value}
                        type="button"
                        variant={form.type === option.value ? "default" : "outline"}
                        onClick={() => form.setType(option.value as any)}
                        disabled={form.loading || !subscription.canCreateShowcase()}
                        className={`flex items-center space-x-1 h-7 px-2 transition-all ${
                          form.type === option.value ? 'shadow-sm scale-105' : 'hover:shadow-sm hover:scale-102'
                        }`}
                        size="sm"
                      >
                        <Icon className="h-3 w-3" />
                        <span className="text-xs font-medium">{option.label}</span>
                      </Button>
                    )
                  })}

                  {/* More Options Dropdown */}
                  <div className="relative more-options-dropdown">
                    <Button
                      type="button"
                      variant={showMoreOptions ? "default" : "outline"}
                      onClick={() => setShowMoreOptions(!showMoreOptions)}
                      disabled={form.loading || !subscription.canCreateShowcase()}
                      className={`flex items-center space-x-1 h-7 px-2 transition-all ${
                        showMoreOptions ? 'shadow-sm scale-105' : 'hover:shadow-sm hover:scale-102'
                      }`}
                      size="sm"
                    >
                      <span className="text-xs font-medium">More</span>
                      <svg className={`h-3 w-3 transition-transform ${showMoreOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </Button>

                    {/* Dropdown Menu */}
                    {showMoreOptions && (
                      <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-md shadow-lg z-50 min-w-[120px] animate-in fade-in-0 zoom-in-95 duration-100">
                        <div className="py-1">
                          {[
                            { value: 'treatment', label: 'Treatment', icon: FileText, color: 'bg-orange-500' },
                            { value: 'gig', label: 'From Gig', icon: Camera, color: 'bg-green-500' }
                          ].map((option) => {
                            const Icon = option.icon
                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                  form.setType(option.value as any)
                                  setShowMoreOptions(false)
                                }}
                                disabled={form.loading || !subscription.canCreateShowcase()}
                                className={`flex items-center space-x-2 w-full px-3 py-2 text-xs hover:bg-muted/50 transition-colors ${
                                  form.type === option.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'
                                }`}
                              >
                                <Icon className="h-3 w-3" />
                                <span>{option.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Show All Button */}
                  <Button
                    type="button"
                    variant={showAllMedia ? "default" : "outline"}
                    onClick={() => {
                      setShowAllMedia(!showAllMedia);
                    }}
                    disabled={form.loading || !subscription.canCreateShowcase()}
                    className="flex items-center space-x-1 h-7 px-2 text-xs"
                    size="sm"
                  >
                    <span>{showAllMedia ? "Filtered" : "Show All"}</span>
                  </Button>
                </div>
              </div>

              {/* Scrollable Media Content Area */}
              <div className="flex-1 overflow-y-auto">

              {/* Main Preview - Compact */}
              {media.selectedMedia.length > 0 && (
                <div className="p-4 border-b bg-muted/10">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Preview</h4>
                    {media.selectedMedia.length > 1 && (
                      <div className="flex gap-1.5">
                        {media.selectedMedia.map((_, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => media.setPreviewIndex(index)}
                            className={`w-2 h-2 rounded-full transition-all ${
                              media.previewIndex === index ? 'bg-primary scale-110' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                            }`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => setIsPreviewModalOpen(true)}
                      className="w-full aspect-video bg-muted/50 rounded-xl overflow-hidden shadow-lg ring-1 ring-border/50 hover:ring-primary/30 transition-all"
                    >
                      {media.selectedMedia[media.previewIndex].type === 'video' ? (
                        <video
                          src={media.selectedMedia[media.previewIndex].url}
                          className="w-full h-full object-cover"
                          controls
                          preload="metadata"
                          poster={media.selectedMedia[media.previewIndex].thumbnail_url}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : (
                        <img
                          src={media.selectedMedia[media.previewIndex].thumbnail_url || media.selectedMedia[media.previewIndex].url}
                          alt="Preview"
                          className="w-full h-full object-contain transition-transform group-hover:scale-105 bg-muted/20"
                        />
                      )}
                    </button>

                    {/* Preview Overlay Info */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-4 rounded-b-xl pointer-events-none">
                      <div className="text-white">
                        <p className="text-sm font-medium">{media.selectedMedia[media.previewIndex].preset || 'Custom'}</p>
                        {media.selectedMedia[media.previewIndex].metadata?.generation_metadata?.resolution && (
                          <p className="text-xs opacity-80">{media.selectedMedia[media.previewIndex].metadata.generation_metadata.resolution}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Media Details */}
                  <div className="mt-4 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {media.selectedMedia[media.previewIndex].preset && (
                        <Badge variant="secondary" className="px-2 py-1 text-xs">
                          🎨 {media.selectedMedia[media.previewIndex].preset}
                        </Badge>
                      )}
                      {media.selectedMedia[media.previewIndex].metadata?.generation_metadata?.aspect_ratio && (
                        <Badge variant="outline" className="px-2 py-1 text-xs">
                          📐 {media.selectedMedia[media.previewIndex].metadata.generation_metadata.aspect_ratio}
                        </Badge>
                      )}
                      {media.selectedMedia[media.previewIndex].metadata?.generation_metadata?.provider && (
                        <Badge variant="outline" className="px-2 py-1 text-xs">
                          ⚡ {media.selectedMedia[media.previewIndex].metadata.generation_metadata.provider}
                        </Badge>
                      )}
                    </div>
                    
                    {/* Prompt Preview */}
                    {media.selectedMedia[media.previewIndex].metadata?.generation_metadata?.prompt && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground font-medium">Generation Prompt</Label>
                        <div className="text-xs bg-background/70 p-3 rounded-lg border max-h-16 overflow-y-auto leading-relaxed">
                          {media.selectedMedia[media.previewIndex].metadata.generation_metadata.prompt}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Selected Media Thumbnails - Compact */}
              {media.selectedMedia.length > 1 && (
                <div className="p-4 border-b bg-background/30">
                  <h4 className="text-xs font-semibold text-muted-foreground mb-3">
                    Selected ({media.selectedMedia.length}/6)
                  </h4>
                  <div className="grid grid-cols-4 gap-3">
                    {media.selectedMedia.map((mediaItem, index) => (
                      <button
                        key={mediaItem.id}
                        type="button"
                        onClick={() => media.setPreviewIndex(index)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all group ${
                          media.previewIndex === index ? 'border-primary ring-2 ring-primary/30 scale-105' : 'border-border hover:border-primary/50'
                        }`}
                      >
                        {mediaItem.type === 'video' ? (
                          <video
                            src={mediaItem.url}
                            className="w-full h-full object-contain bg-muted/20"
                            muted
                            preload="metadata"
                            poster={mediaItem.thumbnail_url}
                          />
                        ) : (
                          <img
                            src={mediaItem.thumbnail_url || mediaItem.url}
                            alt="Media thumbnail"
                            className="w-full h-full object-contain bg-muted/20 transition-transform group-hover:scale-110"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={async (e) => {
                                e.stopPropagation()
                                media.setSelectedMedia(prev => prev.filter(item => item.id !== mediaItem.id))
                              }}
                              className="h-6 w-6 p-0 rounded-full"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {media.previewIndex === index && (
                          <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full font-medium">
                            {index + 1}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Available Media Grid */}
              <div className="flex-1 min-h-0 p-6">
                <div className="h-full overflow-y-auto">
                  {/* Media Stats */}
                  {(() => {
                    const filtered = showAllMedia
                      ? media.getFilteredMedia('individual_image' as any) // Get all images when showing all
                      : media.getFilteredMedia(form.type === 'gig' ? 'individual_image' : form.type);
                    const totalMedia = filtered.media.length + filtered.playground.length + (filtered.treatments?.length || 0);
                    return totalMedia > 0 && (
                      <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-muted-foreground">
                            {showAllMedia ? 'All Media' : `Media (${form.type === 'gig' ? 'image' : form.type})`}
                          </span>
                          <div className="flex gap-4 text-xs">
                            {filtered.media.length > 0 && (
                              <span className="text-primary">📁 {filtered.media.length} from library</span>
                            )}
                            {filtered.playground.length > 0 && (
                              <span className="text-primary">🎨 {filtered.playground.length} from playground</span>
                            )}
                            {filtered.treatments && filtered.treatments.length > 0 && (
                              <span className="text-primary">🎬 {filtered.treatments.length} treatments</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {filteredMedia}
                  </div>
                </div>
              </div>
              </div>
            </div>


            {/* Right Column - Form Fields */}
            <div className="bg-background flex flex-col overflow-hidden">
              {/* Form Header */}
              <div className="p-6 pb-4 border-b bg-muted/20">
                <h3 className="text-lg font-semibold">Showcase Details</h3>
                <p className="text-sm text-muted-foreground mt-1">Fill in the details for your showcase</p>
              </div>
              
              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Title and Description */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label htmlFor="title" className="text-sm font-semibold">Title *</Label>
                    <Input
                      id="title"
                      value={form.title}
                      onChange={(e) => form.setTitle(e.target.value)}
                      placeholder="Enter a compelling title..."
                      disabled={form.loading || !subscription.canCreateShowcase()}
                      className="text-sm h-11 border-border/50 focus:border-primary/50 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <Label htmlFor="description" className="text-sm font-semibold">Description</Label>
                    <div className="relative">
                      <Textarea
                        id="description"
                        value={form.description}
                        onChange={(e) => form.setDescription(e.target.value)}
                        placeholder="Describe your showcase, the process, or any interesting details..."
                        rows={4}
                        disabled={form.loading || !subscription.canCreateShowcase()}
                        className="text-sm resize-none border-border/50 focus:border-primary/50 transition-colors pr-14"
                      />
                      <div className="absolute right-2 bottom-2">
                    <VoiceToTextButton
                      onAppendText={async (text) => {
                        // Typewriter effect
                        const base = form.description.endsWith(' ') || !form.description ? form.description : form.description + ' ';
                        let out = base;
                        form.setDescription(out);
                        for (let i = 0; i < text.length; i++) {
                          out += text[i];
                          form.setDescription(out);
                          await new Promise(r => setTimeout(r, 8));
                        }
                      }}
                      userSubscriptionTier={userSubscriptionTier as 'FREE' | 'PLUS' | 'PRO'}
                      disabled={form.loading || !subscription.canCreateShowcase()}
                      size={32}
                    />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visibility */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Visibility</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={form.visibility === 'public' ? "default" : "outline"}
                        onClick={() => form.setVisibility('public')}
                        disabled={form.loading || !subscription.canCreateShowcase()}
                        className="flex items-center justify-center space-x-2 h-12 border-border/50 hover:border-primary/50 transition-colors"
                        size="sm"
                      >
                        <Globe className="h-4 w-4" />
                        <span className="text-sm font-medium">Public</span>
                      </Button>
                      <Button
                        type="button"
                        variant={form.visibility === 'private' ? "default" : "outline"}
                        onClick={() => form.setVisibility('private')}
                        disabled={form.loading || !subscription.canCreateShowcase()}
                        className="flex items-center justify-center space-x-2 h-12 border-border/50 hover:border-primary/50 transition-colors"
                        size="sm"
                      >
                        <Lock className="h-4 w-4" />
                        <span className="text-sm font-medium">Private</span>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Tags */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-semibold mb-3 block">Tags (Optional)</Label>
                    <div className="flex gap-2">
                      <Input
                        value={form.newTag}
                        onChange={(e) => form.setNewTag(e.target.value)}
                        placeholder="Add a tag..."
                        disabled={form.loading || !subscription.canCreateShowcase()}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            form.addTag()
                          }
                        }}
                        className="text-sm h-11 border-border/50 focus:border-primary/50 transition-colors"
                      />
                      <Button
                        type="button"
                        onClick={() => form.addTag()}
                        disabled={form.loading || !subscription.canCreateShowcase() || !form.newTag.trim()}
                        size="sm"
                        className="px-4 h-11"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {form.tags.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs text-muted-foreground font-medium">Added Tags</Label>
                      <div className="flex flex-wrap gap-2">
                        {form.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs px-3 py-1">
                            {tag}
                            <button
                              type="button"
                              onClick={() => form.removeTag(tag)}
                              className="ml-1 hover:text-destructive transition-colors"
                              disabled={form.loading || !subscription.canCreateShowcase()}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <DialogFooter className="flex-shrink-0 p-6 pt-4 border-t border-border/50 bg-muted/20 relative z-10">
          <div className="flex items-center justify-between w-full">
            <div className="text-xs text-muted-foreground">
              {subscription.canCreateShowcase() ? (
                <span>You have {subscription.getMaxShowcases() === -1 ? 'unlimited' : `${subscription.getMaxShowcases() - subscription.monthlyShowcaseCount} remaining`} showcases this month</span>
              ) : (
                <span className="text-destructive">Monthly limit reached - upgrade to create more</span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={form.loading} className="px-6">
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={form.loading || !subscription.canCreateShowcase()}
                onClick={handleSubmit}
                className="px-6 bg-primary hover:bg-primary/90"
              >
                {form.loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Showcase'
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Full-Screen Preview Modal */}
      <Dialog open={isPreviewModalOpen} onOpenChange={setIsPreviewModalOpen}>
        <DialogContent className="w-[95vw] max-w-[1200px] h-[90vh] max-h-[90vh] p-0 overflow-hidden">
          <div className="relative w-full h-full flex items-center justify-center bg-black/90">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsPreviewModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Display */}
            {media.selectedMedia[media.previewIndex]?.type === 'video' ? (
              <video
                src={media.selectedMedia[media.previewIndex].url}
                className="max-w-full max-h-full object-contain"
                controls
                autoPlay
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <img
                src={media.selectedMedia[media.previewIndex]?.thumbnail_url || media.selectedMedia[media.previewIndex]?.url}
                alt="Full preview"
                className="max-w-full max-h-full object-contain"
              />
            )}

            {/* Navigation Arrows for multiple items */}
            {media.selectedMedia.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => media.setPreviewIndex((media.previewIndex - 1 + media.selectedMedia.length) % media.selectedMedia.length)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={() => media.setPreviewIndex((media.previewIndex + 1) % media.selectedMedia.length)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}

            {/* Media Info */}
            <div className="absolute bottom-4 left-4 right-4 bg-black/60 backdrop-blur-sm rounded-lg p-4">
              <div className="text-white">
                <p className="text-sm font-medium">{media.selectedMedia[media.previewIndex]?.preset || 'Custom'}</p>
                {media.selectedMedia[media.previewIndex]?.metadata?.generation_metadata?.resolution && (
                  <p className="text-xs opacity-80">{media.selectedMedia[media.previewIndex].metadata.generation_metadata.resolution}</p>
                )}
                {media.selectedMedia.length > 1 && (
                  <p className="text-xs opacity-80 mt-1">
                    {media.previewIndex + 1} of {media.selectedMedia.length}
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
