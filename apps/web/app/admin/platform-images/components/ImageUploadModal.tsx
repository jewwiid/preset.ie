'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, ImageIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Image from 'next/image';

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
  const [imageFilter, setImageFilter] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Update preview when image file changes or existing image is selected
  useEffect(() => {
    if (formData.image_file) {
      const objectUrl = URL.createObjectURL(formData.image_file);
      setPreviewUrl(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    } else if (formData.selected_image_url) {
      setPreviewUrl(formData.selected_image_url);
    } else if (editingImage?.image_url) {
      setPreviewUrl(editingImage.image_url);
    } else {
      setPreviewUrl('');
    }
  }, [formData.image_file, formData.selected_image_url, editingImage]);

  const fetchExistingImages = async () => {
    const supabase = createClient();

    // Helper function to recursively list all files
    async function listAllFiles(path = ''): Promise<any[]> {
      const { data: items } = await supabase.storage
        .from('platform-images')
        .list(path, {
          limit: 1000,
          sortBy: { column: 'name', order: 'asc' }
        });

      if (!items || items.length === 0) return [];

      let allFiles: any[] = [];

      for (const item of items) {
        const fullPath = path ? `${path}/${item.name}` : item.name;

        // If it's a folder, recursively list its contents
        if (item.id === null || item.metadata?.mimetype === 'application/x-directory') {
          const subFiles = await listAllFiles(fullPath);
          allFiles = allFiles.concat(subFiles);
        } else {
          // It's a file
          allFiles.push({ ...item, fullPath });
        }
      }

      return allFiles;
    }

    const files = await listAllFiles();
    const imageUrls = files.map(file => {
      const pathParts = file.fullPath.split('/');
      const folder = pathParts.length > 1 ? pathParts[0] : 'Root';
      const fileName = pathParts[pathParts.length - 1];

      return {
        url: supabase.storage.from('platform-images').getPublicUrl(file.fullPath).data.publicUrl,
        name: file.fullPath,
        folder: folder,
        fileName: fileName,
      };
    });
    setExistingImages(imageUrls);
    setShowExistingImages(true);
  };

  if (!showAddForm) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-background rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col my-4"
        onClick={(e) => e.stopPropagation()}
      >
        <Card className="border-0 shadow-none flex-1 flex flex-col">
          <CardHeader className="bg-background border-b flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>
              {editingImage ? 'Edit Image' : quickUploadMode ? `Upload Image for ${quickUploadMode.name}` : 'Add New Image'}
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="pt-6 flex-1 overflow-hidden">
            <form onSubmit={onSubmit} className="h-full flex flex-col">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden">
                {/* Left Column - Form Fields */}
                <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 180px)' }}>
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
                        <div className="space-y-2 p-4 border rounded-lg bg-muted/20">
                          <Input
                            placeholder="Filter images by name or folder..."
                            value={imageFilter}
                            onChange={(e) => setImageFilter(e.target.value)}
                            className="bg-background"
                          />
                          <p className="text-sm text-muted-foreground">
                            Found {existingImages.filter(img =>
                              img.name.toLowerCase().includes(imageFilter.toLowerCase())
                            ).length} of {existingImages.length} images
                          </p>
                          <div className="max-h-64 overflow-y-auto border rounded-md p-3 space-y-4 bg-background">
                            {(Object.entries(
                              existingImages
                               .filter(img => img.name.toLowerCase().includes(imageFilter.toLowerCase()))
                               .reduce((acc, img) => {
                                 if (!acc[img.folder]) acc[img.folder] = [];
                                 acc[img.folder].push(img);
                                 return acc;
                               }, {} as Record<string, any[]>)
                            ) as [string, any[]][]).map(([folder, images]) => (
                              <div key={folder}>
                                <h4 className="text-sm font-medium mb-2 text-muted-foreground">{folder}</h4>
                                <div className="grid grid-cols-3 gap-2">
                                  {images.map((img) => (
                                    <div
                                      key={img.url}
                                      className="cursor-pointer border rounded-md overflow-hidden hover:border-primary transition-colors"
                                      onClick={() => {
                                        onSelectExisting(img.url);
                                        setShowExistingImages(false);
                                        setImageFilter('');
                                      }}
                                      title={img.name}
                                    >
                                      <div className="aspect-square w-full overflow-hidden bg-muted">
                                        <img
                                          src={img.url}
                                          alt={img.fileName}
                                          className="w-full h-full object-cover"
                                        />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1">
                      {editingImage ? 'Save Changes' : 'Save Image'}
                    </Button>
                    <Button type="button" variant="outline" onClick={onClose}>
                      Cancel
                    </Button>
                  </div>
                </div>

                {/* Right Column - Image Preview */}
                <div className="flex flex-col overflow-hidden" style={{ maxHeight: 'calc(90vh - 180px)' }}>
                  <div className="flex-1 border-2 border-dashed rounded-lg overflow-hidden bg-muted/30 flex items-center justify-center min-h-[300px]">
                    {previewUrl ? (
                      <div className="relative w-full h-full p-4">
                        {previewUrl.startsWith('blob:') ? (
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Image
                            src={previewUrl}
                            alt="Preview"
                            fill
                            className="object-contain"
                            sizes="(max-width: 768px) 100vw, 50vw"
                            unoptimized={previewUrl.startsWith('blob:')}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-8 text-center">
                        <ImageIcon className="w-24 h-24 text-muted-foreground/40 mb-4" />
                        <p className="text-muted-foreground text-lg font-medium">No Image Selected</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          Upload a new image or select from existing
                        </p>
                      </div>
                    )}
                  </div>
                  {previewUrl && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-start gap-3">
                        <ImageIcon className="w-5 h-5 text-primary mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium mb-1">Image Preview</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {formData.image_file?.name || editingImage?.title || 'Selected from library'}
                          </p>
                          {formData.image_file && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Size: {(formData.image_file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
