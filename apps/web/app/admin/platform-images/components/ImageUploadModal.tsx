'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface ImageUploadModalProps {
  showAddForm: boolean;
  editingImage: any | null;
  quickUploadMode: { name: string; category?: string; imageType?: string } | null;
  formData: any;
  onClose: () => void;
  onFormDataChange: (data: any) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSelectExisting: (imageUrl: string) => void;
}

export default function ImageUploadModal({
  showAddForm,
  editingImage,
  quickUploadMode,
  formData,
  onClose,
  onFormDataChange,
  onSubmit,
  onImageFileChange,
  onSelectExisting,
}: ImageUploadModalProps) {
  const [existingImages, setExistingImages] = useState<any[]>([]);
  const [showExistingImages, setShowExistingImages] = useState(false);

  const fetchExistingImages = async () => {
    const supabase = createClient();
    const { data } = await supabase.storage.from('platform-images').list();
    if (data) {
      const imageUrls = data.map(file => ({
        url: supabase.storage.from('platform-images').getPublicUrl(file.name).data.publicUrl,
        name: file.name,
      }));
      setExistingImages(imageUrls);
      setShowExistingImages(true);
    }
  };

  if (!showAddForm) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="sticky top-0 bg-background z-10 border-b flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>
              {editingImage ? 'Edit Image' : quickUploadMode ? `Upload Image for ${quickUploadMode.name}` : 'Add New Image'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4 pt-6">
            <form onSubmit={onSubmit} className="space-y-4">
              {!quickUploadMode && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="image_type">Image Type</Label>
                    <select
                      id="image_type"
                      value={formData.image_type}
                      onChange={(e) => onFormDataChange({ ...formData, image_type: e.target.value })}
                      className="w-full p-2 border rounded-md bg-background"
                    >
                      <option value="homepage">Homepage</option>
                      <option value="about">About</option>
                      <option value="hero">Hero</option>
                      <option value="section">Section</option>
                      <option value="role">Role</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Category (Optional)</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => onFormDataChange({ ...formData, category: e.target.value })}
                      placeholder="e.g., role-actors, for-talents, hero-background"
                    />
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => onFormDataChange({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description / Attribution</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => onFormDataChange({ ...formData, description: e.target.value })}
                  placeholder='e.g., "Photo by John Doe" or "Professional studio shot"'
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="alt_text">Alt Text (for accessibility)</Label>
                <Input
                  id="alt_text"
                  value={formData.alt_text}
                  onChange={(e) => onFormDataChange({ ...formData, alt_text: e.target.value })}
                  placeholder="Describe the image for screen readers"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => onFormDataChange({ ...formData, display_order: parseInt(e.target.value) })}
                />
              </div>

              <div className="space-y-2">
                <Label>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => onFormDataChange({ ...formData, is_active: e.target.checked })}
                    className="mr-2"
                  />
                  Active (visible on site)
                </Label>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image_file">Upload New Image</Label>
                <Input
                  id="image_file"
                  type="file"
                  accept="image/*"
                  onChange={onImageFileChange}
                />
                {!editingImage && (
                  <p className="text-sm text-muted-foreground">
                    Required for new images. Leave empty when editing to keep current image.
                  </p>
                )}
              </div>

              {!editingImage && (
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={fetchExistingImages}
                    className="w-full"
                  >
                    Or Select from Existing Images
                  </Button>

                  {showExistingImages && (
                    <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto border rounded-md p-2">
                      {existingImages.map((img) => (
                        <div
                          key={img.url}
                          className="cursor-pointer border rounded-md overflow-hidden hover:border-primary transition-colors"
                          onClick={() => {
                            onSelectExisting(img.url);
                            setShowExistingImages(false);
                          }}
                        >
                          <img
                            src={img.url}
                            alt={img.name}
                            className="w-full h-24 object-cover"
                          />
                          <p className="text-xs p-1 truncate">{img.name}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  {editingImage ? 'Update Image' : 'Add Image'}
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
