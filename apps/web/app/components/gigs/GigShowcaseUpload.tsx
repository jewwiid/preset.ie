'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Upload, X, Check, Image as ImageIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '../../../lib/auth-context';
import { useToast } from '../../../components/ui/toast';

interface GigShowcaseUploadProps {
  gigId: string;
  gigTitle: string;
  onSuccess?: (showcaseId: string) => void;
  onCancel?: () => void;
}

interface UploadedMedia {
  id: string;
  url: string;
  file: File;
  preview: string;
}

export function GigShowcaseUpload({ 
  gigId, 
  gigTitle, 
  onSuccess, 
  onCancel 
}: GigShowcaseUploadProps) {
  const { user, session } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedMedia.length + acceptedFiles.length > 6) {
      showError('Maximum 6 images allowed');
      return;
    }

    setIsUploading(true);
    
    try {
      const newMedia: UploadedMedia[] = [];
      
      for (const file of acceptedFiles) {
        // Create preview URL
        const preview = URL.createObjectURL(file);
        
        // Upload to Supabase storage
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'showcase-media');
        formData.append('gigId', gigId);
        formData.append('sourceType', 'custom');
        
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${session?.access_token}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to upload ${file.name}`);
        }
        
        const uploadResult = await response.json();
        
        newMedia.push({
          id: uploadResult.mediaId,
          url: uploadResult.url,
          file,
          preview
        });
      }
      
      setUploadedMedia(prev => [...prev, ...newMedia]);
      showSuccess(`Uploaded ${acceptedFiles.length} image(s)`);
      
    } catch (error) {
      console.error('Upload error:', error);
      showError('Failed to upload images');
    } finally {
      setIsUploading(false);
    }
  }, [uploadedMedia.length, gigId, session?.access_token, showSuccess, showError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 6 - uploadedMedia.length,
    disabled: isUploading
  });

  const removeMedia = (mediaId: string) => {
    setUploadedMedia(prev => prev.filter(media => media.id !== mediaId));
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags(prev => [...prev, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async () => {
    if (uploadedMedia.length < 3) {
      showError('Please upload at least 3 images');
      return;
    }

    if (!title.trim()) {
      showError('Please enter a title');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/gigs/${gigId}/showcase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          mediaIds: uploadedMedia.map(media => media.id),
          tags,
          caption: description.trim()
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to create showcase');
      }

      showSuccess('Showcase created successfully! Submit for approval when ready.');
      onSuccess?.(result.showcase.id);
      
    } catch (error) {
      console.error('Create showcase error:', error);
      showError('Failed to create showcase');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          Create Showcase for "{gigTitle}"
        </h2>
        <p className="text-muted-foreground">
          Upload 3-6 custom photos from your gig. These will be tagged as custom images and require approval from the talent before being published.
        </p>
      </div>

      {/* Upload Area */}
      <Card className="border-2 border-dashed border-muted-foreground/25">
        <CardContent className="p-8">
          <div {...getRootProps()} className="cursor-pointer">
            <input {...getInputProps()} />
            <div className="flex flex-col items-center space-y-4">
              <Upload className="w-12 h-12 text-muted-foreground" />
              <div className="text-center">
                <p className="text-lg text-muted-foreground">
                  {isDragActive 
                    ? 'Drop images here...' 
                    : 'Drag & drop images here, or click to select'
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {uploadedMedia.length}/6 images uploaded
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Uploaded Images Preview */}
      {uploadedMedia.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Uploaded Images:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {uploadedMedia.map((media) => (
              <div key={media.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden border">
                  <img
                    src={media.preview}
                    alt="Uploaded image"
                    className="w-full h-full object-cover"
                  />
                </div>
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeMedia(media.id)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Title Input */}
      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          placeholder="Enter showcase title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      {/* Description Input */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          placeholder="Describe your showcase..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
        />
      </div>

      {/* Tags Input */}
      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <div className="flex gap-2">
          <Input
            id="tags"
            placeholder="Add a tag..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            className="flex-1"
          />
          <Button onClick={addTag} disabled={!tagInput.trim()}>
            Add
          </Button>
        </div>
        
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                {tag}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
                  onClick={() => removeTag(tag)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={uploadedMedia.length < 3 || !title.trim() || isSubmitting}
        >
          {isSubmitting ? 'Creating...' : 'Create Showcase'}
        </Button>
      </div>

      {/* Info Text */}
      <p className="text-sm text-muted-foreground text-center">
        After creating, you can submit the showcase for talent approval. The talent will review all images before the showcase becomes public.
      </p>
    </div>
  );
}
