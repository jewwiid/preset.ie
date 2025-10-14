'use client';

import { X, CheckCircle, Edit3, Video, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { PastGeneration } from '@/hooks/usePastGenerations';

interface GenerationMetadataModalProps {
  generation: PastGeneration | null;
  open: boolean;
  onClose: () => void;
  onImport: (generation: PastGeneration) => void;
  onViewAll?: (generation: PastGeneration) => void;
}

export function GenerationMetadataModal({
  generation,
  open,
  onClose,
  onImport,
  onViewAll}: GenerationMetadataModalProps) {
  if (!open || !generation) return null;

  const getAspectRatioLabel = (width: number, height: number): string => {
    const aspectRatio = width / height;

    if (Math.abs(aspectRatio - 1) < 0.05) return '1:1';
    if (Math.abs(aspectRatio - 16 / 9) < 0.05) return '16:9';
    if (Math.abs(aspectRatio - 9 / 16) < 0.05) return '9:16';
    if (Math.abs(aspectRatio - 4 / 3) < 0.05) return '4:3';
    if (Math.abs(aspectRatio - 3 / 4) < 0.05) return '3:4';
    if (Math.abs(aspectRatio - 21 / 9) < 0.05) return '21:9';
    if (Math.abs(aspectRatio - 3 / 2) < 0.05) return '3:2';
    if (Math.abs(aspectRatio - 2 / 3) < 0.05) return '2:3';
    if (Math.abs(aspectRatio - 5 / 4) < 0.05) return '5:4';
    if (Math.abs(aspectRatio - 4 / 5) < 0.05) return '4:5';

    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    const divisor = gcd(width, height);
    const w = Math.round(width / divisor);
    const h = Math.round(height / divisor);

    if (w > 32 || h > 32) {
      return aspectRatio.toFixed(2) + ':1';
    }

    return `${w}:${h}`;
  };

  const formatModelName = (model: string) => {
    return model
      .replace(/-v\d+/g, ' V$&'.replace('-v', ''))
      .replace(/seedream/gi, 'Seedream')
      .replace(/nanobanana/gi, 'Nanobanana')
      .replace(/wavespeed/gi, 'Wavespeed')
      .replace(/dalle/gi, 'DALL-E')
      .replace(/midjourney/gi, 'Midjourney');
  };

  const primaryImage = generation.generated_images[0];
  const metadata = generation.metadata as any;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Generation Metadata</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Image Preview - Left Column */}
            <div className="space-y-4">
              <div className="rounded-lg overflow-hidden border">
                {primaryImage ? (
                  generation.is_video || primaryImage.type === 'video' ? (
                    <video
                      src={primaryImage.url}
                      poster={primaryImage.url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                      className="w-full h-auto max-h-96 object-contain"
                      controls
                      preload="metadata"
                      loop
                    />
                  ) : (
                    <img
                      src={primaryImage.url}
                      alt={generation.title}
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  )
                ) : (
                  <div className="w-full h-64 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>

              {/* Image Info */}
              {primaryImage && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Dimensions:</span>
                    <span className="font-medium">
                      {primaryImage.width} × {primaryImage.height}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Aspect Ratio:</span>
                    <Badge variant="secondary" className="text-sm">
                      {getAspectRatioLabel(primaryImage.width, primaryImage.height)}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="text-sm text-muted-foreground">
                      {generation.is_video ? 'Video' : 'Image'}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Metadata - Right Column */}
            <div className="space-y-4 overflow-y-auto max-h-[60vh]">
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Title</label>
                  <p className="text-sm">{generation.title}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Prompt</label>
                  <p className="text-sm">{generation.prompt}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p className="text-sm">{new Date(generation.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Credits Used</label>
                  <p className="text-sm">{generation.credits_used}</p>
                </div>

                {/* Generation Provider/Model */}
                {(metadata?.generation_provider || metadata?.generation_model) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Generation Method
                    </label>
                    <p className="text-sm">
                      {metadata.generation_model
                        ? formatModelName(metadata.generation_model)
                        : metadata.generation_provider?.replace(/wavespeed-nanobanan/gi, 'Nanobanana').replace(/seedream/gi, 'Seedream') || 'Unknown'}
                    </p>
                  </div>
                )}

                {/* Generation Mode */}
                {metadata?.generation_mode && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Generation Mode
                    </label>
                    <Badge variant="outline" className="text-xs">
                      {metadata.generation_mode.replace('-', ' ')}
                    </Badge>
                  </div>
                )}

                {generation.style && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Style</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-sm">
                        {generation.style === 'realistic'
                          ? '📸'
                          : generation.style === 'artistic'
                            ? '🎨'
                            : generation.style === 'cartoon'
                              ? '🎭'
                              : generation.style === 'anime'
                                ? '🌸'
                                : generation.style === 'fantasy'
                                  ? '✨'
                                  : generation.is_edit
                                    ? '✏️'
                                    : ''}{' '}
                        {generation.style}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Status indicators */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {generation.is_saved && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Saved
                      </Badge>
                    )}
                    {generation.is_edit && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        <Edit3 className="h-3 w-3 mr-1" />
                        Edit
                      </Badge>
                    )}
                    {generation.is_video && (
                      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                        <Video className="h-3 w-3 mr-1" />
                        Video
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Enhanced Prompt */}
                {generation.metadata?.enhanced_prompt && (
                  <div className="border-t pt-3">
                    <label className="text-sm font-medium text-muted-foreground">
                      Enhanced Prompt
                    </label>
                    <p className="text-sm mt-1">{generation.metadata.enhanced_prompt}</p>
                  </div>
                )}

                {/* Style Prompt */}
                {generation.metadata?.style_prompt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Style Prompt</label>
                    <p className="text-sm mt-1">{generation.metadata.style_prompt}</p>
                  </div>
                )}

                {/* Preset Information */}
                {metadata?.preset_id && (
                  <div className="border-t pt-3">
                    <label className="text-sm font-medium text-muted-foreground">Preset Used</label>
                    <p className="text-sm mt-1">
                      {metadata.preset_name || 'Custom Preset'}
                      {metadata.preset_id && (
                        <span className="text-muted-foreground text-xs ml-2">
                          (ID: {metadata.preset_id.slice(0, 8)}...)
                        </span>
                      )}
                    </p>
                  </div>
                )}

                {/* Negative Prompt */}
                {metadata?.negative_prompt && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Negative Prompt
                    </label>
                    <p className="text-sm mt-1 bg-muted/50 p-2 rounded">{metadata.negative_prompt}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t px-6 pb-6">
            <Button onClick={() => onImport(generation)} className="flex-1">
              {generation.is_video ? 'Import to Video' : 'Import to Edit'}
            </Button>
            {generation.generated_images.length > 1 && onViewAll && (
              <Button variant="outline" onClick={() => onViewAll(generation)} className="flex-1">
                View All Images
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
