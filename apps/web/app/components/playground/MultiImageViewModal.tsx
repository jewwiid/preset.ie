'use client';

import { X, Save, ArrowUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PastGeneration } from '@/hooks/usePastGenerations';

interface MultiImageViewModalProps {
  generation: PastGeneration | null;
  open: boolean;
  onClose: () => void;
  onSaveImage: (imageUrl: string, title: string, generation: PastGeneration) => Promise<void>;
  onPromoteImage: (imageUrl: string, title: string, generation: PastGeneration) => Promise<void>;
  onImport: (generation: PastGeneration) => void;
  savingImage: string | null;
  promotingImage: string | null;
}

export function MultiImageViewModal({
  generation,
  open,
  onClose,
  onSaveImage,
  onPromoteImage,
  onImport,
  savingImage,
  promotingImage}: MultiImageViewModalProps) {
  if (!open || !generation) return null;

  const handleSaveAll = () => {
    generation.generated_images.forEach((image) => {
      onSaveImage(image.url, generation.title, generation);
    });
  };

  const handlePromoteAll = () => {
    generation.generated_images.forEach((image) => {
      onPromoteImage(image.url, generation.title, generation);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-4xl max-h-[90vh] overflow-hidden w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-foreground">
            {generation.title} - All Images ({generation.generated_images.length})
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Image Grid */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-160px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {generation.generated_images.map((image, index) => (
              <div key={index} className="relative group">
                {image.type === 'video' || generation.is_video ? (
                  <video
                    src={image.url}
                    className="w-full h-64 object-cover rounded-lg border border-border"
                    controls
                    preload="metadata"
                    loop
                    poster={image.url.replace(/\.(mp4|webm|mov)$/i, '_poster.jpg')}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={image.url}
                    alt={`${generation.title} - Image ${index + 1}`}
                    className="w-full h-64 object-cover rounded-lg border border-border"
                    loading="lazy"
                  />
                )}

                {/* Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center space-y-2">
                    <span className="text-primary-foreground text-sm font-medium bg-black bg-opacity-70 px-2 py-1 rounded">
                      {image.type === 'video' ? 'Video' : 'Image'} {index + 1}
                    </span>
                    <div className="flex flex-col space-y-1">
                      <button
                        onClick={() => onSaveImage(image.url, generation.title, generation)}
                        disabled={savingImage === image.url}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                      >
                        <Save className="h-3 w-3" />
                        <span>{savingImage === image.url ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={() => onPromoteImage(image.url, generation.title, generation)}
                        disabled={promotingImage === image.url}
                        className="flex items-center space-x-1 px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                      >
                        <ArrowUp className="h-3 w-3" />
                        <span>{promotingImage === image.url ? 'Promoting...' : 'Promote'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              <span>
                {generation.generated_images.length}{' '}
                {generation.is_video ? 'video(s)' : 'image(s)'}
              </span>
              <span>{generation.credits_used} credits</span>
              {generation.style && (
                <span className="text-primary font-medium">
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
                </span>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveAll}
                disabled={savingImage !== null}
              >
                <Save className="h-4 w-4 mr-1" />
                {savingImage ? 'Saving...' : 'Save All'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePromoteAll}
                disabled={promotingImage !== null}
              >
                <ArrowUp className="h-4 w-4 mr-1" />
                {promotingImage ? 'Promoting...' : 'Promote All'}
              </Button>
              <Button variant="default" size="sm" onClick={() => onImport(generation)}>
                <Download className="h-4 w-4 mr-1" />
                {generation.is_video ? 'Import to Video' : 'Import to Edit'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
