'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Image from 'next/image';

interface ImageSection {
  name: string;
  category?: string;
  imageType?: string;
  description: string;
}

interface ImageSectionManagerProps {
  section: ImageSection;
  images: any[];
  onQuickUpload: (section: ImageSection) => void;
  onEdit: (image: any) => void;
  onDeactivate: (imageId: string) => void;
}

export default function ImageSectionManager({
  section,
  images,
  onQuickUpload,
  onEdit,
  onDeactivate,
}: ImageSectionManagerProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle>{section.name}</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
        </div>
        <Button onClick={() => onQuickUpload(section)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </CardHeader>

      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No images yet. Click &quot;Add&quot; to upload an image for this section.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {images.map((img) => (
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
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                  />
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
                      variant="outline"
                      onClick={() => onDeactivate(img.id)}
                      className="w-full bg-yellow-500/10 hover:bg-yellow-500/20 border-yellow-500/50 text-yellow-600"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remove from Section
                    </Button>
                  </div>
                </div>
                <div className="p-2">
                  <p className="text-sm font-medium truncate">{img.title || 'Untitled'}</p>
                  {img.description && (
                    <p className="text-xs text-muted-foreground truncate">{img.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
