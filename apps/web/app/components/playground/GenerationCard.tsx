'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Download, Trash2, Eye, Video, Image as ImageIcon, Sparkles } from 'lucide-react';
import { format } from 'date-fns';
import type { PastGeneration } from '@/hooks/usePastGenerations';
import { getGenerationTypeBadge } from '@/lib/utils/badge-helpers';

interface GenerationCardProps {
  generation: PastGeneration;
  onImport: (generation: PastGeneration) => void;
  onDelete: (id: string) => void;
  onPreview: (generation: PastGeneration) => void;
  columnSpan?: number;
  isDeleting?: boolean;
}

export function GenerationCard({
  generation,
  onImport,
  onDelete,
  onPreview,
  columnSpan = 1,
  isDeleting = false}: GenerationCardProps) {
  const [imageError, setImageError] = useState(false);

  const primaryImage = generation.generated_images[0];
  const isVideo = generation.is_video;
  const imageCount = generation.generated_images.length;

  const getAspectRatioLabel = (width: number, height: number): string => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    const ratioW = width / divisor;
    const ratioH = height / divisor;
    return `${ratioW}:${ratioH}`;
  };

  const getImageStyle = (image: { width: number; height: number }) => {
    const aspectRatio = image.width / image.height;
    if (aspectRatio > 1.5) {
      return 'aspect-[16/9]';
    } else if (aspectRatio < 0.7) {
      return 'aspect-[9/16]';
    }
    return 'aspect-square';
  };

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!primaryImage) return;

    try {
      const response = await fetch(primaryImage.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generation-${generation.id}.${isVideo ? 'mp4' : 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Card
      className={`group relative overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer ${
        columnSpan > 1 ? `col-span-${columnSpan}` : ''
      }`}
      onClick={() => onPreview(generation)}
    >
      <CardContent className="p-0">
        {/* Image/Video Preview */}
        <div className={`relative ${primaryImage ? getImageStyle(primaryImage) : 'aspect-square'} bg-muted overflow-hidden`}>
          {primaryImage && !imageError ? (
            <>
              {isVideo ? (
                <video
                  src={primaryImage.url}
                  className="w-full h-full object-cover"
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={primaryImage.url}
                  alt={generation.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-12 h-12 text-muted-foreground" />
            </div>
          )}

          {/* Overlay on Hover */}
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(generation);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>View</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleDownload}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Download</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(generation.id);
                    }}
                    disabled={isDeleting}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-wrap gap-1">
            {(() => {
              const badgeConfig = getGenerationTypeBadge(isVideo, imageCount);
              if (!badgeConfig) return null;

              return (
                <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
                  {isVideo ? (
                    <>
                      <Video className="h-3 w-3 mr-1" />
                      Video
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-3 w-3 mr-1" />
                      {imageCount} images
                    </>
                  )}
                </Badge>
              );
            })()}

            {generation.metadata?.enhanced_prompt && (
              <Badge variant="secondary" className="bg-black/70 text-white border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Enhanced
              </Badge>
            )}
          </div>

          {/* Credits Used Badge */}
          <div className="absolute top-2 right-2">
            <Badge variant="secondary" className="bg-black/70 text-white border-0">
              {generation.credits_used} credits
            </Badge>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-3 space-y-2">
          {/* Title */}
          <h3 className="font-medium text-sm line-clamp-1">
            {generation.title}
          </h3>

          {/* Prompt */}
          <p className="text-xs text-muted-foreground line-clamp-2">
            {generation.prompt}
          </p>

          {/* Metadata */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {primaryImage && getAspectRatioLabel(primaryImage.width, primaryImage.height)}
            </span>
            <span>
              {format(new Date(generation.created_at), 'MMM d, yyyy')}
            </span>
          </div>

          {/* Action Button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onImport(generation);
            }}
          >
            Import to Playground
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
