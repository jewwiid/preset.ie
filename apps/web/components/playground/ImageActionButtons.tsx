'use client';

import { Heart, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageActionButtonsProps {
  imageUrl: string;
  onSave: (url: string) => void;
  onDownload: (url: string, filename: string) => void;
  isSaving?: boolean;
  className?: string;
}

export function ImageActionButtons({
  imageUrl,
  onSave,
  onDownload,
  isSaving = false,
  className = ''
}: ImageActionButtonsProps) {
  const filename = `preset-${Date.now()}.png`;

  return (
    <div className={`flex gap-1 ${className}`}>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 w-7 p-0 bg-background/90 hover:bg-background shadow-md"
        onClick={(e) => {
          e.stopPropagation();
          onSave(imageUrl);
        }}
        disabled={isSaving}
        title="Save to Gallery"
      >
        <Heart className={`h-3.5 w-3.5 ${isSaving ? 'fill-current' : ''}`} />
      </Button>
      <Button
        size="sm"
        variant="secondary"
        className="h-7 w-7 p-0 bg-background/90 hover:bg-background shadow-md"
        onClick={(e) => {
          e.stopPropagation();
          onDownload(imageUrl, filename);
        }}
        title="Download"
      >
        <Download className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
