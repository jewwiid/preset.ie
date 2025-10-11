'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface ImageLibraryProps {
  images: any[];
  onEdit: (image: any) => void;
  onDelete: (imageId: string) => void;
}

export default function ImageLibrary({
  images,
  onEdit,
  onDelete,
}: ImageLibraryProps) {
  const [showAllImages, setShowAllImages] = useState(false);

  return (
    <Card className="mt-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>Platform Images Library</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Manage all platform images. Only place to permanently delete images.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAllImages(!showAllImages)}
        >
          {showAllImages ? (
            <>
              <ChevronUp className="h-4 w-4 mr-2" />
              Collapse
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-2" />
              Expand ({images.length} images)
            </>
          )}
        </Button>
      </CardHeader>

      {showAllImages && (
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No images found in the library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {images.map((img) => {
                if (!img || !img.id || !img.image_url) {
                  console.warn('Invalid image data:', img);
                  return null;
                }

                return (
                  <div
                    key={img.id}
                    className="border rounded-lg overflow-hidden bg-card hover:border-primary transition-colors group"
                  >
                    <div className="relative aspect-video bg-muted">
                      <Image
                        src={img.image_url}
                        alt={img.alt_text || 'Platform image'}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 25vw, 20vw"
                        unoptimized
                        onError={(e) => {
                          console.warn('Image unavailable:', img.image_url);
                          const imgElement = e.target as HTMLImageElement;
                          imgElement.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f0f0f0"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3EImage not found%3C/text%3E%3C/svg%3E';
                          imgElement.style.objectFit = 'contain';
                        }}
                      />
                      {!img.is_active && (
                        <Badge className="absolute top-2 left-2 bg-yellow-500">
                          Inactive
                        </Badge>
                      )}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <Button
                          size="sm"
                          onClick={() => onEdit(img)}
                          className="w-full"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(img.id)}
                          className="w-full"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Delete Permanently
                        </Button>
                      </div>
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{img.title || 'Untitled'}</p>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {img.image_type && (
                          <Badge variant="outline" className="text-xs">
                            {img.image_type}
                          </Badge>
                        )}
                        {img.category && (
                          <Badge variant="secondary" className="text-xs">
                            {img.category}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
