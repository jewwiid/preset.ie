'use client';

import React, { useState, useCallback, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Upload, LinkIcon, Search, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePexelsSearch } from '@/lib/hooks/playground/usePexelsSearch';
import { PexelsSearchPanel } from '@/components/playground/PexelsSearchPanel';
import { useAuth } from '@/lib/auth-context';

/**
 * Generic imported image format
 */
export interface ImportedImage {
  id: string;
  url: string;
  source: 'upload' | 'url' | 'pexels' | 'saved';
  width?: number;
  height?: number;
  attribution?: {
    source: 'pexels' | 'url' | 'upload' | 'saved';
    photographer?: string;
    photographer_url?: string;
    photographer_id?: number;
    original_url?: string;
  };
  metadata?: {
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
    title?: string;
  };
}

interface SavedMedia {
  id: string;
  media_type: 'image' | 'video';
  image_url?: string;
  thumbnail_url: string;
  title: string;
  width: number;
  height: number;
}

export interface UnifiedImageImportDialogProps {
  // Dialog state
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Selection config
  maxImages: number;
  currentImageCount?: number; // For "X more allowed" messaging
  multiSelect?: boolean; // Default: true

  // Callback with generic format
  onImagesSelected: (images: ImportedImage[]) => void;

  // Feature toggles (customize per use case)
  enableFileUpload?: boolean; // Default: true
  enableUrlImport?: boolean; // Default: true
  enablePexelsSearch?: boolean; // Default: true
  enableSavedGallery?: boolean; // Default: true

  // Customization
  title?: string; // Default: "Import Images"
  description?: string; // Custom description
  acceptedFileTypes?: string; // Default: "image/*"

  // Filtering (for saved gallery)
  galleryFilter?: {
    mediaType?: 'image' | 'video' | 'all'; // Default: 'image'
  };
}

export default function UnifiedImageImportDialog({
  open,
  onOpenChange,
  maxImages,
  currentImageCount = 0,
  multiSelect = true,
  onImagesSelected,
  enableFileUpload = true,
  enableUrlImport = true,
  enablePexelsSearch = true,
  enableSavedGallery = true,
  title = 'Import Images',
  description,
  acceptedFileTypes = 'image/*',
  galleryFilter = { mediaType: 'image' },
}: UnifiedImageImportDialogProps) {
  const { session, user } = useAuth();

  // Determine default tab based on enabled features
  const getDefaultTab = () => {
    if (enableFileUpload) return 'file';
    if (enableUrlImport) return 'url';
    if (enablePexelsSearch) return 'pexels';
    if (enableSavedGallery) return 'gallery';
    return 'file';
  };

  const [activeTab, setActiveTab] = useState(getDefaultTab());
  const [urlInput, setUrlInput] = useState('');
  const [selectedUrls, setSelectedUrls] = useState<string[]>([]);
  const [urlPreviews, setUrlPreviews] = useState<Record<string, { url: string; error?: boolean }>>({});

  // Pexels hook
  const {
    pexelsQuery,
    pexelsResults,
    pexelsPage,
    pexelsLoading,
    pexelsTotalResults,
    pexelsFilters,
    customHexColor,
    showHexInput,
    updateQuery,
    updateFilters,
    updateCustomHexColor,
    toggleHexInput,
    goToPage,
    nextPage,
    prevPage,
  } = usePexelsSearch();

  // Saved gallery state
  const [savedMedia, setSavedMedia] = useState<SavedMedia[]>([]);
  const [loadingGallery, setLoadingGallery] = useState(false);
  const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>([]);

  const remainingSlots = maxImages - currentImageCount;

  // Generate description
  const dialogDescription = description || (
    multiSelect
      ? `Add images from various sources. You can add ${remainingSlots} more image${remainingSlots !== 1 ? 's' : ''}.`
      : 'Select an image from various sources.'
  );

  // Fetch saved gallery images
  const fetchSavedGallery = useCallback(async () => {
    if (!session?.access_token || !user) return;

    try {
      setLoadingGallery(true);
      const response = await fetch('/api/playground/gallery', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch saved images');
      }

      const data = await response.json();

      if (data.success) {
        // Filter based on galleryFilter.mediaType
        let filtered = data.media || [];
        if (galleryFilter.mediaType === 'image') {
          filtered = filtered.filter((m: SavedMedia) => m.media_type === 'image');
        } else if (galleryFilter.mediaType === 'video') {
          filtered = filtered.filter((m: SavedMedia) => m.media_type === 'video');
        }
        setSavedMedia(filtered);
      }
    } catch (error) {
      console.error('Error fetching saved gallery:', error);
      toast.error('Failed to load saved images');
    } finally {
      setLoadingGallery(false);
    }
  }, [session?.access_token, user, galleryFilter.mediaType]);

  // Load gallery when switching to that tab
  useEffect(() => {
    if (activeTab === 'gallery' && savedMedia.length === 0) {
      fetchSavedGallery();
    }
  }, [activeTab, savedMedia.length, fetchSavedGallery]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files) return;

      const maxAllowed = multiSelect ? remainingSlots : 1;
      if (files.length > maxAllowed) {
        toast.error(`You can only add ${maxAllowed} ${multiSelect ? 'more ' : ''}image${maxAllowed !== 1 ? 's' : ''}`);
        return;
      }

      const newImages: ImportedImage[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          continue;
        }

        const url = URL.createObjectURL(file);
        newImages.push({
          id: `file-${Date.now()}-${i}`,
          url,
          source: 'upload',
          metadata: {
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          },
        });
      }

      if (newImages.length > 0) {
        onImagesSelected(newImages);
        toast.success(`Added ${newImages.length} image${newImages.length !== 1 ? 's' : ''}`);
        onOpenChange(false);
      }
    },
    [remainingSlots, multiSelect, onImagesSelected, onOpenChange]
  );

  // Function to fetch image preview
  const fetchImagePreview = useCallback(async (url: string) => {
    try {
      const img = new Image();
      return new Promise<{ url: string; error?: boolean }>((resolve) => {
        img.onload = () => {
          resolve({ url });
        };
        img.onerror = () => {
          resolve({ url, error: true });
        };
        img.src = url;
      });
    } catch (error) {
      return { url, error: true };
    }
  }, []);

  // Handle URL add
  const handleUrlAdd = useCallback(async () => {
    if (!urlInput.trim()) {
      toast.error('Please enter an image URL');
      return;
    }

    const maxAllowed = multiSelect ? remainingSlots : 1;
    if (selectedUrls.length >= maxAllowed) {
      toast.error(`Maximum ${maxAllowed} ${multiSelect ? 'more ' : ''}image${maxAllowed !== 1 ? 's' : ''} allowed`);
      return;
    }

    const newUrl = urlInput.trim();
    setSelectedUrls([...selectedUrls, newUrl]);
    setUrlInput('');

    // Fetch preview for the new URL
    const preview = await fetchImagePreview(newUrl);
    setUrlPreviews((prev) => ({
      ...prev,
      [newUrl]: preview,
    }));
  }, [urlInput, selectedUrls, remainingSlots, multiSelect, fetchImagePreview]);

  // Handle URL confirm
  const handleUrlConfirm = useCallback(() => {
    if (selectedUrls.length === 0) {
      toast.error('Please add at least one URL');
      return;
    }

    const newImages: ImportedImage[] = selectedUrls.map((url, index) => ({
      id: `url-${Date.now()}-${index}`,
      url,
      source: 'url',
      attribution: {
        source: 'url',
        original_url: url,
      },
    }));

    onImagesSelected(newImages);
    toast.success(`Added ${newImages.length} image${newImages.length !== 1 ? 's' : ''}`);
    setSelectedUrls([]);
    setUrlPreviews({});
    onOpenChange(false);
  }, [selectedUrls, onImagesSelected, onOpenChange]);

  // Handle URL removal
  const handleUrlRemove = useCallback(
    (index: number) => {
      const urlToRemove = selectedUrls[index];
      setSelectedUrls(selectedUrls.filter((_, i) => i !== index));
      setUrlPreviews((prev) => {
        const newPreviews = { ...prev };
        delete newPreviews[urlToRemove];
        return newPreviews;
      });
    },
    [selectedUrls]
  );

  // Handle Pexels selection
  const handlePexelsSelect = useCallback(
    (photo: any) => {
      const newImage: ImportedImage = {
        id: `pexels-${Date.now()}`,
        url: photo.src.large2x || photo.src.large,
        source: 'pexels',
        width: photo.width,
        height: photo.height,
        attribution: {
          source: 'pexels',
          photographer: photo.photographer,
          photographer_url: photo.photographer_url,
          photographer_id: photo.photographer_id,
          original_url: photo.url,
        },
      };

      onImagesSelected([newImage]);
      toast.success(`Added image from Pexels by ${photo.photographer}`);
      onOpenChange(false);
    },
    [onImagesSelected, onOpenChange]
  );

  // Handle gallery image toggle
  const handleGalleryImageToggle = useCallback(
    (imageUrl: string, media: SavedMedia) => {
      if (!multiSelect) {
        // Single select mode - immediately select and close
        const newImage: ImportedImage = {
          id: `gallery-${Date.now()}`,
          url: imageUrl,
          source: 'saved',
          width: media.width,
          height: media.height,
          attribution: {
            source: 'saved',
            original_url: imageUrl,
          },
          metadata: {
            title: media.title,
          },
        };
        onImagesSelected([newImage]);
        toast.success(`Added image from gallery`);
        onOpenChange(false);
        return;
      }

      // Multi-select mode
      if (selectedGalleryImages.includes(imageUrl)) {
        setSelectedGalleryImages(selectedGalleryImages.filter((url) => url !== imageUrl));
      } else {
        if (selectedGalleryImages.length >= remainingSlots) {
          toast.error(`Maximum ${remainingSlots} more images allowed`);
          return;
        }
        setSelectedGalleryImages([...selectedGalleryImages, imageUrl]);
      }
    },
    [selectedGalleryImages, remainingSlots, multiSelect, onImagesSelected, onOpenChange]
  );

  // Handle gallery confirm (multi-select only)
  const handleGalleryConfirm = useCallback(() => {
    if (selectedGalleryImages.length === 0) {
      toast.error('Please select at least one image');
      return;
    }

    const newImages: ImportedImage[] = selectedGalleryImages.map((url, index) => {
      const media = savedMedia.find((m) => (m.image_url || m.thumbnail_url) === url);
      return {
        id: `gallery-${Date.now()}-${index}`,
        url,
        source: 'saved' as const,
        width: media?.width,
        height: media?.height,
        attribution: {
          source: 'saved' as const,
          original_url: url,
        },
        metadata: {
          title: media?.title,
        },
      };
    });

    onImagesSelected(newImages);
    toast.success(`Added ${newImages.length} image${newImages.length !== 1 ? 's' : ''} from gallery`);
    setSelectedGalleryImages([]);
    onOpenChange(false);
  }, [selectedGalleryImages, savedMedia, onImagesSelected, onOpenChange]);

  // Count enabled tabs
  const enabledTabs = [enableFileUpload, enableUrlImport, enablePexelsSearch, enableSavedGallery].filter(Boolean).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className={`grid w-full grid-cols-${enabledTabs}`}>
            {enableFileUpload && (
              <TabsTrigger value="file" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
            )}
            {enableUrlImport && (
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                <span className="hidden sm:inline">URL</span>
              </TabsTrigger>
            )}
            {enablePexelsSearch && (
              <TabsTrigger value="pexels" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                <span className="hidden sm:inline">Pexels</span>
              </TabsTrigger>
            )}
            {enableSavedGallery && (
              <TabsTrigger value="gallery" className="flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Saved</span>
              </TabsTrigger>
            )}
          </TabsList>

          {/* File Upload Tab */}
          {enableFileUpload && (
            <TabsContent value="file" className="flex-1 overflow-auto">
              <div className="space-y-4 py-4">
                <div className="text-center">
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed rounded-lg p-12 hover:border-primary transition-colors">
                      <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-sm font-medium">Click to upload images</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {multiSelect ? 'You can select multiple files' : 'Select a single image'}
                      </p>
                    </div>
                    <input
                      id="file-upload"
                      type="file"
                      accept={acceptedFileTypes}
                      multiple={multiSelect}
                      className="hidden"
                      onChange={(e) => handleFileUpload(e.target.files)}
                    />
                  </label>
                </div>
              </div>
            </TabsContent>
          )}

          {/* URL Tab */}
          {enableUrlImport && (
            <TabsContent value="url" className="flex-1 overflow-auto">
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="url-input">Image URL</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url-input"
                      type="url"
                      placeholder="https://example.com/image.jpg"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleUrlAdd()}
                    />
                    <Button
                      type="button"
                      onClick={handleUrlAdd}
                      disabled={!urlInput.trim() || selectedUrls.length >= (multiSelect ? remainingSlots : 1)}
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {selectedUrls.length > 0 && (
                  <div className="space-y-2">
                    <Label>Selected URLs ({selectedUrls.length})</Label>
                    <div className="space-y-2 max-h-48 overflow-auto">
                      <div className="grid grid-cols-4 gap-3">
                        {selectedUrls.map((url, index) => {
                          const preview = urlPreviews[url];
                          return (
                            <div key={index} className="relative group">
                              <div className="aspect-square rounded-lg overflow-hidden bg-muted">
                                {preview ? (
                                  preview.error ? (
                                    <div className="w-full h-full flex items-center justify-center bg-destructive/10">
                                      <ImageIcon className="w-6 h-6 text-destructive" />
                                    </div>
                                  ) : (
                                    <img
                                      src={preview.url}
                                      alt="Preview"
                                      className="w-full h-full object-cover"
                                      onError={() => {
                                        setUrlPreviews((prev) => ({
                                          ...prev,
                                          [url]: { url, error: true },
                                        }));
                                      }}
                                    />
                                  )
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <LoadingSpinner size="md" />
                                  </div>
                                )}
                              </div>

                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="absolute -top-2 -right-2 w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleUrlRemove(index)}
                              >
                                ×
                              </Button>

                              {preview?.error && (
                                <div className="absolute bottom-1 left-1 right-1">
                                  <span className="text-xs text-destructive bg-background/80 px-1 py-0.5 rounded text-center block">
                                    Failed to load
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <Button type="button" onClick={handleUrlConfirm} className="w-full">
                      Import {selectedUrls.length} Image{selectedUrls.length !== 1 ? 's' : ''}
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>
          )}

          {/* Pexels Tab */}
          {enablePexelsSearch && (
            <TabsContent value="pexels" className="flex-1 overflow-auto">
              <div className="py-4">
                <PexelsSearchPanel
                  query={pexelsQuery}
                  results={pexelsResults}
                  loading={pexelsLoading}
                  page={pexelsPage}
                  totalResults={pexelsTotalResults}
                  filters={pexelsFilters}
                  customHexColor={customHexColor}
                  showHexInput={showHexInput}
                  onQueryChange={updateQuery}
                  onFiltersChange={updateFilters}
                  onCustomHexColorChange={updateCustomHexColor}
                  onToggleHexInput={toggleHexInput}
                  onSelectPhoto={handlePexelsSelect}
                  onPrevPage={prevPage}
                  onNextPage={nextPage}
                  onGoToPage={goToPage}
                />
              </div>
            </TabsContent>
          )}

          {/* Saved Gallery Tab */}
          {enableSavedGallery && (
            <TabsContent value="gallery" className="flex-1 overflow-auto">
              <div className="py-4">
                {loadingGallery ? (
                  <div className="flex items-center justify-center py-12">
                    <LoadingSpinner size="lg" />
                    <span className="ml-2 text-muted-foreground">Loading saved images...</span>
                  </div>
                ) : !session?.access_token || !user ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-sm text-muted-foreground">Please sign in to access saved images</p>
                  </div>
                ) : savedMedia.length === 0 ? (
                  <div className="text-center py-12">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-20" />
                    <p className="text-sm font-medium">No saved images yet</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Save images from playground to use them here
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {multiSelect && (
                      <div className="text-sm text-muted-foreground">
                        {selectedGalleryImages.length > 0
                          ? `${selectedGalleryImages.length} selected`
                          : 'Click to select images'}
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-3 max-h-96 overflow-auto">
                      {savedMedia.map((media) => {
                        const imageUrl = media.image_url || media.thumbnail_url;
                        const isSelected = selectedGalleryImages.includes(imageUrl);

                        return (
                          <div
                            key={media.id}
                            className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden transition-all ${
                              isSelected ? 'border-primary ring-2 ring-primary' : 'border-transparent'
                            }`}
                            onClick={() => handleGalleryImageToggle(imageUrl, media)}
                          >
                            <div
                              className="relative"
                              style={{
                                aspectRatio: `${media.width}/${media.height}`,
                                maxHeight: '200px',
                              }}
                            >
                              <img src={imageUrl} alt={media.title} className="w-full h-full object-cover" />
                              <div
                                className={`absolute inset-0 transition-opacity ${
                                  isSelected ? 'bg-primary/20' : 'bg-black/0 group-hover:bg-black/30'
                                }`}
                              >
                                {isSelected && multiSelect && (
                                  <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                    ✓
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                              <p className="text-xs text-white truncate">{media.title}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {multiSelect && selectedGalleryImages.length > 0 && (
                      <Button type="button" onClick={handleGalleryConfirm} className="w-full">
                        Import {selectedGalleryImages.length} Image{selectedGalleryImages.length !== 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Export named for convenience
export { UnifiedImageImportDialog };
