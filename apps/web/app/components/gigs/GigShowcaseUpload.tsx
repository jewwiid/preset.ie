'use client';

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Upload, X, Check } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/useToast';

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
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [uploadedMedia, setUploadedMedia] = useState<UploadedMedia[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedMedia.length + acceptedFiles.length > 6) {
      showToast('Maximum 6 images allowed', 'error');
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
            'Authorization': `Bearer ${user?.access_token}`
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
      showToast(`Uploaded ${acceptedFiles.length} image(s)`, 'success');
      
    } catch (error) {
      console.error('Upload error:', error);
      showToast('Failed to upload images', 'error');
    } finally {
      setIsUploading(false);
    }
  }, [uploadedMedia.length, gigId, user?.access_token, showToast]);

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
      showToast('Please upload at least 3 images', 'error');
      return;
    }

    if (!title.trim()) {
      showToast('Please enter a title', 'error');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const response = await fetch(`/api/gigs/${gigId}/showcase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
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

      showToast('Showcase created successfully! Submit for approval when ready.', 'success');
      onSuccess?.(result.showcase.id);
      
    } catch (error) {
      console.error('Create showcase error:', error);
      showToast('Failed to create showcase', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <YStack space="$4" padding="$4" maxWidth={800} margin="0 auto">
      <Text fontSize="$6" fontWeight="bold">
        Create Showcase for "{gigTitle}"
      </Text>
      
      <Text fontSize="$4" color="$gray10">
        Upload 3-6 custom photos from your gig. These will be tagged as custom images and require approval from the talent before being published.
      </Text>

      {/* Upload Area */}
      <Card padding="$4" borderWidth={2} borderStyle="dashed" borderColor="$gray8">
        <div {...getRootProps()} style={{ cursor: 'pointer' }}>
          <input {...getInputProps()} />
          <YStack alignItems="center" space="$3">
            <Upload size={48} color="$gray10" />
            <Text fontSize="$4" color="$gray10">
              {isDragActive 
                ? 'Drop images here...' 
                : 'Drag & drop images here, or click to select'
              }
            </Text>
            <Text fontSize="$3" color="$gray9">
              {uploadedMedia.length}/6 images uploaded
            </Text>
          </YStack>
        </div>
      </Card>

      {/* Uploaded Images Preview */}
      {uploadedMedia.length > 0 && (
        <YStack space="$3">
          <Text fontSize="$4" fontWeight="600">Uploaded Images:</Text>
          <XStack flexWrap="wrap" gap="$2">
            {uploadedMedia.map((media) => (
              <Card key={media.id} padding="$2" position="relative">
                <Image
                  src={media.preview}
                  width={100}
                  height={100}
                  borderRadius="$2"
                  objectFit="cover"
                />
                <Button
                  position="absolute"
                  top={-8}
                  right={-8}
                  size="$2"
                  circular
                  backgroundColor="$red9"
                  onPress={() => removeMedia(media.id)}
                >
                  <X size={12} color="white" />
                </Button>
              </Card>
            ))}
          </XStack>
        </YStack>
      )}

      {/* Title Input */}
      <YStack space="$2">
        <Text fontSize="$4" fontWeight="600">Title *</Text>
        <Input
          placeholder="Enter showcase title..."
          value={title}
          onChangeText={setTitle}
        />
      </YStack>

      {/* Description Input */}
      <YStack space="$2">
        <Text fontSize="$4" fontWeight="600">Description</Text>
        <TextArea
          placeholder="Describe your showcase..."
          value={description}
          onChangeText={setDescription}
          minHeight={100}
        />
      </YStack>

      {/* Tags Input */}
      <YStack space="$2">
        <Text fontSize="$4" fontWeight="600">Tags</Text>
        <XStack space="$2">
          <Input
            placeholder="Add a tag..."
            value={tagInput}
            onChangeText={setTagInput}
            onKeyPress={(e) => e.key === 'Enter' && addTag()}
            flex={1}
          />
          <Button onPress={addTag} disabled={!tagInput.trim()}>
            Add
          </Button>
        </XStack>
        
        {tags.length > 0 && (
          <XStack flexWrap="wrap" gap="$2">
            {tags.map((tag) => (
              <Card key={tag} padding="$2" backgroundColor="$blue3">
                <XStack alignItems="center" space="$2">
                  <Text fontSize="$3">{tag}</Text>
                  <Button
                    size="$1"
                    circular
                    backgroundColor="$red8"
                    onPress={() => removeTag(tag)}
                  >
                    <X size={10} color="white" />
                  </Button>
                </XStack>
              </Card>
            ))}
          </XStack>
        )}
      </YStack>

      {/* Action Buttons */}
      <XStack space="$3" justifyContent="flex-end">
        <Button variant="outlined" onPress={onCancel}>
          Cancel
        </Button>
        <Button
          onPress={handleSubmit}
          disabled={uploadedMedia.length < 3 || !title.trim() || isSubmitting}
          opacity={uploadedMedia.length < 3 || !title.trim() ? 0.5 : 1}
        >
          {isSubmitting ? 'Creating...' : 'Create Showcase'}
        </Button>
      </XStack>

      {/* Info Text */}
      <Text fontSize="$3" color="$gray9" textAlign="center">
        After creating, you can submit the showcase for talent approval. The talent will review all images before the showcase becomes public.
      </Text>
    </YStack>
  );
}
