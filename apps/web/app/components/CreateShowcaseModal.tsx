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
  const [availableMedia, setAvailableMedia] = useState<MediaItem[]>([]);
  const [availableTreatments, setAvailableTreatments] = useState<Array<{ id: string; title: string; }>>([]);
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [selectedMoodboard, setSelectedMoodboard] = useState<string>('');

  useEffect(() => {
    if (user && session) {
      fetchUserSubscription();
      fetchAvailableMedia();
      fetchAvailableTreatments();
    }
  }, [user, session]);

  const fetchUserSubscription = async () => {
    try {
      const response = await fetch('/api/user/subscription', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUserSubscriptionTier(data.tier || 'FREE');
      }
    } catch (err) {
      console.error('Failed to fetch subscription tier:', err);
    }
  };

  const fetchAvailableMedia = async () => {
    try {
      const response = await fetch('/api/media', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableMedia(data.media.map((m: any) => ({
          id: m.id,
          url: m.url,
          type: m.type,
          thumbnail_url: m.thumbnail_url || m.url
        })));
      }
    } catch (err) {
      console.error('Failed to fetch available media:', err);
    }
  };

  const fetchAvailableTreatments = async () => {
    try {
      const response = await fetch('/api/treatments', {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableTreatments(data.treatments.map((t: any) => ({ id: t.id, title: t.title })));
      }
    } catch (err) {
      console.error('Failed to fetch available treatments:', err);
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleMediaSelect = (media: MediaItem) => {
    setSelectedMedia(prev =>
      prev.some(item => item.id === media.id)
        ? prev.filter(item => item.id !== media.id)
        : [...prev, media]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !session) {
      setError('You must be logged in to create a showcase.');
      return;
    }
    if (userSubscriptionTier === 'FREE') {
      setError('Free users cannot post to showcase. Please upgrade your plan.');
      return;
    }
    if (!title.trim() || selectedMedia.length === 0) {
      setError('Title and at least one media item are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/showcases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title,
          description,
          type,
          media_ids: selectedMedia.map(m => m.id),
          tags,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create showcase');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating showcase:', err);
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle className="text-2xl font-semibold">Create Showcase</DialogTitle>
          <p className="text-muted-foreground">Share your creative work with the community</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-4 overflow-hidden">
          {error && (
            <div className="p-3 border border-destructive/20 bg-destructive/5 rounded-lg flex-shrink-0">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {userSubscriptionTier === 'FREE' && (
            <div className="p-3 border border-amber-200 bg-amber-50 rounded-lg flex-shrink-0">
              <div className="flex items-center space-x-2">
                <Lock className="h-4 w-4 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-800">Upgrade Required</p>
                  <p className="text-sm text-amber-700">Free users cannot create showcases. Upgrade your plan to share your work!</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Content Grid */}
          <div className="grid grid-cols-2 gap-6 flex-1 min-h-0">
            {/* Left Column - Form Fields */}
            <div className="space-y-4 overflow-y-auto pr-2">
              {/* Title and Description */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a compelling title"
                    disabled={loading || userSubscriptionTier === 'FREE'}
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
                    disabled={loading || userSubscriptionTier === 'FREE'}
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
                        disabled={loading || userSubscriptionTier === 'FREE'}
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

              {/* Visibility and Tags Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Visibility</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={visibility === 'public' ? "default" : "outline"}
                      onClick={() => setVisibility('public')}
                      disabled={loading || userSubscriptionTier === 'FREE'}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <Globe className="h-3 w-3" />
                      <span>Public</span>
                    </Button>
                    <Button
                      type="button"
                      variant={visibility === 'private' ? "default" : "outline"}
                      onClick={() => setVisibility('private')}
                      disabled={loading || userSubscriptionTier === 'FREE'}
                      size="sm"
                      className="flex items-center space-x-1"
                    >
                      <EyeOff className="h-3 w-3" />
                      <span>Private</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tags (Optional)</Label>
                  <div className="flex space-x-1">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add tag"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      disabled={loading || userSubscriptionTier === 'FREE'}
                      className="flex-1 text-sm"
                      size={1}
                    />
                    <Button 
                      type="button" 
                      onClick={handleAddTag} 
                      variant="outline"
                      size="sm"
                      disabled={loading || userSubscriptionTier === 'FREE'}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1 text-xs">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-destructive" 
                        onClick={() => handleRemoveTag(tag)} 
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column - Media Selection */}
            <div className="space-y-3 overflow-hidden flex flex-col">
              <Label>Select Media (Max 6)</Label>
              <div className="flex-1 min-h-0">
                <div className="grid grid-cols-3 gap-2 h-full overflow-y-auto border rounded-lg p-3">
                  {availableMedia.length === 0 ? (
                    <div className="col-span-3 flex flex-col items-center justify-center py-8 text-center">
                      <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">No media available</p>
                      <p className="text-xs text-muted-foreground">Upload media first</p>
                    </div>
                  ) : (
                    availableMedia.map((media) => (
                      <button
                        key={media.id}
                        type="button"
                        onClick={() => handleMediaSelect(media)}
                        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                          selectedMedia.some(item => item.id === media.id)
                            ? 'border-primary ring-2 ring-primary/20'
                            : 'border-border hover:border-border'
                        }`}
                        disabled={loading || userSubscriptionTier === 'FREE' || 
                          (selectedMedia.length >= 6 && !selectedMedia.some(item => item.id === media.id))}
                      >
                        {media.type === 'video' ? (
                          <video 
                            src={media.thumbnail_url || media.url} 
                            className="w-full h-full object-cover" 
                            muted 
                            playsInline 
                            preload="metadata" 
                          />
                        ) : (
                          <img 
                            src={media.url} 
                            alt="Media" 
                            className="w-full h-full object-cover" 
                          />
                        )}
                        {selectedMedia.some(item => item.id === media.id) && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              <Check className="h-3 w-3 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                        <Badge className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 py-0">
                          {media.type === 'video' ? <Video className="h-2 w-2" /> : <ImageIcon className="h-2 w-2" />}
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              </div>
              
              {selectedMedia.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {selectedMedia.map(media => (
                    <Badge key={media.id} variant="secondary" className="flex items-center gap-1 text-xs">
                      {media.type === 'video' ? <Video className="h-2 w-2" /> : <ImageIcon className="h-2 w-2" />}
                      {media.type}
                      <X 
                        className="h-2 w-2 cursor-pointer hover:text-destructive" 
                        onClick={() => handleMediaSelect(media)} 
                      />
                    </Badge>
                  ))}
                </div>
              )}
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
            disabled={loading || userSubscriptionTier === 'FREE'}
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