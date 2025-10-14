'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageUpload } from '@/components/ui/image-upload';
import { ExistingImageManager, ExistingImage } from '@/components/ui/existing-image-manager';
import { ImageIcon } from 'lucide-react';

interface ImageUploadSectionProps {
  images: File[];
  existingImages: ExistingImage[];
  loading: boolean;
  onImagesChange: (files: File[]) => void;
  onDeleteExistingImage: (imageId: string) => Promise<void>;
}

export function ImageUploadSection({
  images,
  existingImages,
  loading,
  onImagesChange,
  onDeleteExistingImage}: ImageUploadSectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Images
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {existingImages.length > 0 ? (
          <ExistingImageManager
            existingImages={existingImages}
            onDeleteImage={onDeleteExistingImage}
          />
        ) : (
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">No existing images found</p>
          </div>
        )}

        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Add New Images</h4>
          <ImageUpload
            value={images}
            onChange={onImagesChange}
            maxFiles={10}
            maxSize={5}
            accept="image/*"
            disabled={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
