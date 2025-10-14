'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Download, Trash2, X, ChevronLeft, ChevronRight, Sparkles, Video } from 'lucide-react';
import { format } from 'date-fns';
import type { PastGeneration } from '@/hooks/usePastGenerations';

interface GenerationPreviewProps {
  generation: PastGeneration | null;
  open: boolean;
  onClose: () => void;
  onImport: (generation: PastGeneration) => void;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

export function GenerationPreview({
  generation,
  open,
  onClose,
  onImport,
  onDelete,
  isDeleting = false}: GenerationPreviewProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);

  if (!generation) return null;

  const images = generation.generated_images;
  const currentImage = images[currentImageIndex];
  const hasMultipleImages = images.length > 1;
  const isVideo = generation.is_video;

  const handlePrevImage = () => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    setImageError(false);
  };

  const handleNextImage = () => {
    setCurrentImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    setImageError(false);
  };

  const handleDownload = async () => {
    if (!currentImage) return;

    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generation-${generation.id}-${currentImageIndex + 1}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  const handleDelete = () => {
    onDelete(generation.id);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="line-clamp-1">{generation.title}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={isDeleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Image/Video Preview */}
        <div className="relative bg-muted rounded-lg overflow-hidden">
          {currentImage && !imageError ? (
            <>
              {isVideo ? (
                <video
                  src={currentImage.url}
                  className="w-full h-auto max-h-[60vh] object-contain"
                  controls
                  autoPlay
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={currentImage.url}
                  alt={`${generation.title} - Image ${currentImageIndex + 1}`}
                  className="w-full h-auto max-h-[60vh] object-contain"
                  onError={() => setImageError(true)}
                />
              )}
            </>
          ) : (
            <div className="w-full h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Failed to load image</p>
            </div>
          )}

          {/* Navigation Arrows for Multiple Images */}
          {hasMultipleImages && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2"
                onClick={handlePrevImage}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2"
                onClick={handleNextImage}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                <Badge variant="secondary" className="bg-black/70 text-white border-0">
                  {currentImageIndex + 1} / {images.length}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Metadata */}
        <div className="space-y-4">
          {/* Badges */}
          <div className="flex flex-wrap gap-2">
            {isVideo && (
              <Badge variant="secondary">
                <Video className="h-3 w-3 mr-1" />
                Video
              </Badge>
            )}
            {generation.metadata?.enhanced_prompt && (
              <Badge variant="secondary">
                <Sparkles className="h-3 w-3 mr-1" />
                Enhanced
              </Badge>
            )}
            {generation.style && (
              <Badge variant="outline">{generation.style}</Badge>
            )}
            <Badge variant="secondary">
              {generation.credits_used} credits
            </Badge>
          </div>

          <Separator />

          {/* Prompt */}
          <div>
            <h3 className="font-medium text-sm mb-2">Prompt</h3>
            <p className="text-sm text-muted-foreground">{generation.prompt}</p>
          </div>

          {/* Enhanced Prompt */}
          {generation.metadata?.enhanced_prompt && (
            <div>
              <h3 className="font-medium text-sm mb-2">Enhanced Prompt</h3>
              <p className="text-sm text-muted-foreground">
                {generation.metadata.enhanced_prompt}
              </p>
            </div>
          )}

          {/* Style Prompt */}
          {generation.metadata?.style_prompt && (
            <div>
              <h3 className="font-medium text-sm mb-2">Style Prompt</h3>
              <p className="text-sm text-muted-foreground">
                {generation.metadata.style_prompt}
              </p>
            </div>
          )}

          <Separator />

          {/* Technical Details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium mb-1">Resolution</h3>
              <p className="text-muted-foreground">
                {currentImage && `${currentImage.width} × ${currentImage.height}`}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Created</h3>
              <p className="text-muted-foreground">
                {format(new Date(generation.created_at), 'MMM d, yyyy • h:mm a')}
              </p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Status</h3>
              <p className="text-muted-foreground capitalize">{generation.status}</p>
            </div>
            <div>
              <h3 className="font-medium mb-1">Type</h3>
              <p className="text-muted-foreground">
                {generation.is_edit ? 'Edit' : 'Generation'}
              </p>
            </div>
          </div>

          <Separator />

          {/* Import Button */}
          <Button
            className="w-full"
            onClick={() => {
              onImport(generation);
              onClose();
            }}
          >
            Import to Playground
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
