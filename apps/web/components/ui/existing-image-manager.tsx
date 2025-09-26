import * as React from "react"
import { X, Image as ImageIcon, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import Image from "next/image"
import { toast } from "sonner"

export interface ExistingImage {
  id: string;
  url: string;
  alt_text?: string;
  sort_order: number;
}

export interface ExistingImageManagerProps {
  existingImages?: ExistingImage[]
  onDeleteImage?: (imageId: string) => void
  className?: string
}

const ExistingImageManager = React.forwardRef<HTMLDivElement, ExistingImageManagerProps>(
  ({ 
    existingImages = [], 
    onDeleteImage,
    className 
  }, ref) => {
    const [deleting, setDeleting] = React.useState<string | null>(null)


    const handleDelete = async (imageId: string) => {
      if (!onDeleteImage) return;
      
      setDeleting(imageId);
      try {
        await onDeleteImage(imageId);
        toast.success('Image deleted successfully');
      } catch (error) {
        console.error('Error deleting image:', error);
        toast.error('Failed to delete image');
      } finally {
        setDeleting(null);
      }
    }

    if (existingImages.length === 0) {
      return null;
    }

    return (
      <div ref={ref} className={cn("space-y-4", className)}>
        <div>
          <h4 className="text-sm font-medium text-foreground mb-2">Existing Images</h4>
          <p className="text-sm text-muted-foreground mb-4">
            Click the trash icon to delete an image
          </p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {existingImages
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((image) => (
            <Card key={image.id} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square rounded-md overflow-hidden bg-muted">
                  <Image
                    src={image.url}
                    alt={image.alt_text || 'Listing image'}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  
                  {/* Delete button overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(image.id)}
                      disabled={deleting === image.id}
                      className="h-8 w-8 p-0"
                    >
                      {deleting === image.id ? (
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }
)

ExistingImageManager.displayName = "ExistingImageManager"

export { ExistingImageManager }
