'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Download, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { NSFWContentWrapper } from '../ui/nsfw-content-wrapper';

interface GeneratedImage {
  url: string;
  index: number;
  is_nsfw?: boolean;
  user_marked_nsfw?: boolean;
  moderation_status?: string;
}

interface StitchPreviewAreaProps {
  images: GeneratedImage[];
  loading: boolean;
  selectedImage: string | null;
  onSelectImage: (url: string | null) => void;
  onSaveToGallery?: (url: string) => Promise<void>;
  savingImage?: string | null;
  aspectRatio?: string;
}

export default function StitchPreviewArea({
  images,
  loading,
  selectedImage,
  onSelectImage,
  onSaveToGallery,
  savingImage,
  aspectRatio = '1:1',
}: StitchPreviewAreaProps) {
  // Convert aspect ratio string to CSS class
  const getAspectRatioClass = (ratio: string) => {
    switch (ratio) {
      case '1:1': return 'aspect-square';
      case '16:9': return 'aspect-video';
      case '9:16': return 'aspect-[9/16]';
      case '4:3': return 'aspect-[4/3]';
      case '3:4': return 'aspect-[3/4]';
      case '21:9': return 'aspect-[21/9]';
      case '9:21': return 'aspect-[9/21]';
      case '2:3': return 'aspect-[2/3]';
      case '3:2': return 'aspect-[3/2]';
      default: return 'aspect-square';
    }
  };

  const handleDownload = async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `stitch-${index + 1}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Image downloaded');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download image');
    }
  };

  const handleSave = async (url: string) => {
    if (!onSaveToGallery) return;
    try {
      await onSaveToGallery(url);
      toast.success('Saved to gallery');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save image');
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Generated Images</CardTitle>
        <CardDescription>
          {loading
            ? 'Generating your stitched images...'
            : images.length > 0
            ? `${images.length} image${images.length !== 1 ? 's' : ''} generated`
            : 'Generated images will appear here'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <LoadingSpinner size="xl" />
            <p className="text-sm text-muted-foreground">
              Stitching your images together...
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              This may take a minute or two
            </p>
          </div>
        )}

        {!loading && images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
            <p className="text-sm font-medium">No images generated yet</p>
            <p className="text-xs mt-2">
              Add source images and configure settings to generate
            </p>
          </div>
        )}

        {!loading && images.length > 0 && (
          <div className="space-y-4">
            {/* Main Preview */}
            {selectedImage && (() => {
              const selectedImageData = images.find(img => img.url === selectedImage);
              return (
                <NSFWContentWrapper
                  contentId={`stitch-main-preview-${selectedImageData?.index || 0}`}
                  contentType="playground_gallery"
                  isNsfw={selectedImageData?.is_nsfw || selectedImageData?.user_marked_nsfw || false}
                  className={`relative ${getAspectRatioClass(aspectRatio)} w-full rounded-lg overflow-hidden bg-muted border`}
                  onContentAccess={(action) => {
                    console.log('NSFW Content Access:', {
                      contentId: `stitch-main-preview-${selectedImageData?.index || 0}`,
                      contentType: 'playground_gallery',
                      action,
                      timestamp: new Date().toISOString()
                    })
                  }}
                >
                  <img
                    src={selectedImage}
                    alt="Selected preview"
                    className="w-full h-full object-contain"
                  />
                </NSFWContentWrapper>
              );
            })()}

            {/* Thumbnail Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {images.map((image) => (
                <NSFWContentWrapper
                  key={image.index}
                  contentId={`stitch-generated-${image.index}`}
                  contentType="playground_gallery"
                  isNsfw={image.is_nsfw || image.user_marked_nsfw || false}
                  className={`group relative ${getAspectRatioClass(aspectRatio)} rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                    selectedImage === image.url
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                  onContentAccess={(action) => {
                    console.log('NSFW Content Access:', {
                      contentId: `stitch-generated-${image.index}`,
                      contentType: 'playground_gallery',
                      action,
                      timestamp: new Date().toISOString()
                    })
                  }}
                >
                  <div onClick={() => onSelectImage(image.url)}>
                    {/* Image */}
                    <img
                      src={image.url}
                      alt={`Generated ${image.index + 1}`}
                      className="w-full h-full object-cover"
                    />

                  {/* Index Badge */}
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs font-medium px-2 py-1 rounded">
                    #{image.index + 1}
                  </div>

                  {/* Hover Actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(image.url, image.index);
                      }}
                      title="Download"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {onSaveToGallery && (
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSave(image.url);
                        }}
                        disabled={savingImage === image.url}
                        title="Save to Gallery"
                      >
                        {savingImage === image.url ? (
                          <LoadingSpinner size="sm" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                  </div>
                </NSFWContentWrapper>
              ))}
            </div>

            {/* Bulk Actions */}
            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  images.forEach((img) => handleDownload(img.url, img.index));
                }}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
              {onSaveToGallery && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    for (const img of images) {
                      await handleSave(img.url);
                    }
                  }}
                  disabled={!!savingImage}
                  className="flex-1"
                >
                  {savingImage ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save All
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
