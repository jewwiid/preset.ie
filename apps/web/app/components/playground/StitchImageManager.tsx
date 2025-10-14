'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '../../../lib/auth-context';
import { useApiQuery } from '../../../hooks/useApiQuery';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, GripVertical, Plus, Save, Flag, Shield } from 'lucide-react';
import { toast } from 'sonner';
import UnifiedImageImportDialog, { ImportedImage } from '@/components/ui/image-import-dialog';
import { NSFWWarning, NSFWBadge } from '../ui/nsfw-warning';
import { useContentModeration } from '@/hooks/useContentModeration';

// Comprehensive Stitch Image Types
export type StitchImageType = 
  // Legacy types (kept for backward compatibility)
  | 'character' | 'location' | 'style' | 'object' | 'reference' | 'custom'
  // Fashion & Apparel
  | 'model' | 'garment' | 'fabric' | 'outfit'
  // Product Design
  | 'product' | 'logo' | 'packaging' | 'brand_element'
  // Automotive
  | 'vehicle' | 'rims_wheels' | 'paint_color' | 'interior'
  // Interior Design
  | 'furniture' | 'room' | 'lighting' | 'wall_finish'
  // Beauty & Cosmetics
  | 'face' | 'makeup' | 'hair' | 'skincare'
  // Architecture & Construction
  | 'building' | 'material' | 'landscape' | 'fixture'
  // Marketing & Advertising
  | 'lifestyle' | 'scene' | 'prop' | 'text_overlay'
  // Real Estate
  | 'property' | 'staging' | 'renovation'
  // General Purpose
  | 'texture' | 'color' | 'pattern' | 'effect';

export interface StitchImage {
  id: string;
  url: string;
  type: StitchImageType;
  customLabel?: string;
  is_nsfw?: boolean;
  is_flagged?: boolean;
  moderation_status?: 'pending' | 'approved' | 'rejected' | 'flagged';
  attribution?: {
    source: 'pexels' | 'url' | 'upload' | 'saved';
    photographer?: string;
    photographer_url?: string;
    photographer_id?: number;
    original_url?: string;
  };
}

interface StitchImageManagerProps {
  images: StitchImage[];
  maxImages?: number;
  onImagesChange: (images: StitchImage[]) => void;
  selectedImageId: string | null;
  onSelectImage: (id: string | null) => void;
}

interface CustomType {
  id: string;
  type_label: string;
  description?: string;
  usage_count: number;
}

export default function StitchImageManager({
  images,
  maxImages = 10,
  onImagesChange,
  selectedImageId,
  onSelectImage}: StitchImageManagerProps) {
  const { session } = useAuth();
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const { moderateContent, flagContent, shouldHideContent, shouldShowWarning } = useContentModeration();

  // Fetch custom types from database using useApiQuery
  const { data: customTypesData, loading: loadingTypes, refetch: refetchCustomTypes } = useApiQuery<{
    userTypes: CustomType[];
    suggestedTypes: CustomType[];
  }>({
    endpoint: '/api/stitch/custom-types',
    enabled: !!session?.access_token,
    dependencies: [session?.access_token],
    headers: session?.access_token ? {
      'Authorization': `Bearer ${session.access_token}`} : undefined,
    onError: (err) => console.error('Error fetching custom types:', err)});

  const userCustomTypes = customTypesData?.userTypes || [];
  const suggestedTypes = customTypesData?.suggestedTypes || [];

  const handleImagesImported = useCallback(
    (importedImages: ImportedImage[]) => {
      // Convert ImportedImage[] to StitchImage[]
      const newStitchImages: StitchImage[] = importedImages.map((img) => ({
        id: img.id,
        url: img.url,
        type: 'reference', // Default type, user can change later
        attribution: img.attribution}));
      onImagesChange([...images, ...newStitchImages]);
    },
    [images, onImagesChange]
  );

  const handleRemoveImage = useCallback(
    (id: string) => {
      const updatedImages = images.filter((img) => img.id !== id);
      onImagesChange(updatedImages);
      if (selectedImageId === id) {
        onSelectImage(updatedImages.length > 0 ? updatedImages[0].id : null);
      }
      toast.success('Image removed');
    },
    [images, selectedImageId, onImagesChange, onSelectImage]
  );

  const handleTypeChange = useCallback(
    (id: string, type: StitchImage['type']) => {
      const updatedImages = images.map((img) =>
        img.id === id ? { ...img, type } : img
      );
      onImagesChange(updatedImages);
    },
    [images, onImagesChange]
  );

  const handleCustomLabelChange = useCallback(
    (id: string, customLabel: string) => {
      const updatedImages = images.map((img) =>
        img.id === id ? { ...img, customLabel } : img
      );
      onImagesChange(updatedImages);
    },
    [images, onImagesChange]
  );

  const handleSaveCustomType = useCallback(
    async (customLabel: string, description?: string) => {
      if (!customLabel || customLabel.trim().length === 0) {
        toast.error('Custom label cannot be empty');
        return;
      }

      // Check for NSFW content
      const moderationResult = moderateContent(`${customLabel} ${description || ''}`);
      
      if (moderationResult.is_nsfw) {
        toast.warning('NSFW content detected. This type will be flagged for moderation.');
      }

      try {
        const response = await fetch('/api/stitch/custom-types', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`},
          body: JSON.stringify({ 
            type_label: customLabel.trim(),
            description: description?.trim(),
            is_nsfw: moderationResult.is_nsfw
          })});

        if (response.ok) {
          const { data } = await response.json();
          // Refetch custom types to update the list
          refetchCustomTypes();

          if (moderationResult.is_nsfw) {
            toast.success(`Custom type "${customLabel}" saved but flagged for moderation`);
          } else {
            toast.success(`Custom type "${customLabel}" saved to your library`);
          }
        } else {
          const error = await response.json();
          toast.error(error.error || 'Failed to save custom type');
        }
      } catch (error) {
        console.error('Error saving custom type:', error);
        toast.error('Failed to save custom type');
      }
    },
    [session?.access_token, moderateContent, refetchCustomTypes]
  );

  const handleSelectSavedType = useCallback(
    (id: string, typeLabel: string) => {
      // Set as custom type with the saved label
      const updatedImages = images.map((img) =>
        img.id === id ? { ...img, type: 'custom' as const, customLabel: typeLabel } : img
      );
      onImagesChange(updatedImages);
    },
    [images, onImagesChange]
  );

  const handleDragStart = useCallback((index: number) => {
    setDraggedIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newImages = [...images];
    const draggedItem = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedItem);

    onImagesChange(newImages);
    setDraggedIndex(index);
  }, [draggedIndex, images, onImagesChange]);

  const handleDragEnd = useCallback(() => {
    setDraggedIndex(null);
  }, []);

  const getTypeLabel = (type: StitchImage['type']) => {
    const labels: Record<StitchImage['type'], string> = {
      // Legacy types
      character: 'Character',
      location: 'Location',
      style: 'Style',
      object: 'Object',
      reference: 'Reference',
      custom: 'Custom',
      // Fashion & Apparel
      model: 'Model',
      garment: 'Garment',
      fabric: 'Fabric',
      outfit: 'Outfit',
      // Product Design
      product: 'Product',
      logo: 'Logo',
      packaging: 'Packaging',
      brand_element: 'Brand Element',
      // Automotive
      vehicle: 'Vehicle',
      rims_wheels: 'Rims & Wheels',
      paint_color: 'Paint Color',
      interior: 'Interior',
      // Interior Design
      furniture: 'Furniture',
      room: 'Room',
      lighting: 'Lighting',
      wall_finish: 'Wall Finish',
      // Beauty & Cosmetics
      face: 'Face',
      makeup: 'Makeup',
      hair: 'Hair',
      skincare: 'Skincare',
      // Architecture & Construction
      building: 'Building',
      material: 'Material',
      landscape: 'Landscape',
      fixture: 'Fixture',
      // Marketing & Advertising
      lifestyle: 'Lifestyle',
      scene: 'Scene',
      prop: 'Prop',
      text_overlay: 'Text Overlay',
      // Real Estate
      property: 'Property',
      staging: 'Staging',
      renovation: 'Renovation',
      // General Purpose
      texture: 'Texture',
      color: 'Color',
      pattern: 'Pattern',
      effect: 'Effect'};
    return labels[type] || type;
  };

  const getTypeColor = (type: StitchImage['type']) => {
    const colors: Record<StitchImage['type'], string> = {
      // Legacy types
      character: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      location: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      style: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      object: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      reference: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      custom: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      // Fashion & Apparel
      model: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
      garment: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300',
      fabric: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
      outfit: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      // Product Design
      product: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      logo: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      packaging: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300',
      brand_element: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      // Automotive
      vehicle: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
      rims_wheels: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
      paint_color: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300',
      interior: 'bg-stone-100 text-stone-800 dark:bg-stone-900 dark:text-stone-300',
      // Interior Design
      furniture: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      room: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      lighting: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      wall_finish: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      // Beauty & Cosmetics
      face: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
      makeup: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300',
      hair: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900 dark:text-fuchsia-300',
      skincare: 'bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300',
      // Architecture & Construction
      building: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
      material: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      landscape: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      fixture: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300',
      // Marketing & Advertising
      lifestyle: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      scene: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      prop: 'bg-lime-100 text-lime-800 dark:bg-lime-900 dark:text-lime-300',
      text_overlay: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      // Real Estate
      property: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
      staging: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      renovation: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      // General Purpose
      texture: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
      color: 'bg-slate-100 text-slate-800 dark:bg-slate-900 dark:text-slate-300',
      pattern: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
      effect: 'bg-neutral-100 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-300'};
    return colors[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Source Images</CardTitle>
        <CardDescription>
          Add up to {maxImages} images to stitch together. Drag to reorder, label each image type.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Import Button */}
        <div className="space-y-3">
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowImportDialog(true)}
            disabled={images.length >= maxImages}
          >
            <Plus className="h-4 w-4 mr-2" />
            Import Images {images.length > 0 && `(${images.length}/${maxImages})`}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Import from file, URL, Pexels, or your saved gallery
          </p>
        </div>

        {/* Image Grid */}
        {images.length > 0 && (
          <div className="space-y-2">
            <Label>Image Sequence ({images.length}/{maxImages})</Label>
            <div className="space-y-2">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-start gap-3 p-3 border rounded-lg cursor-move transition-all ${
                    selectedImageId === image.id
                      ? 'border-primary bg-primary/5'
                      : 'hover:border-muted-foreground/30'
                  } ${draggedIndex === index ? 'opacity-50' : ''}`}
                  onClick={() => onSelectImage(image.id)}
                >
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-1 flex-shrink-0" />

                  <div className="relative w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-muted">
                    <img
                      src={image.url}
                      alt={`Source ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.png';
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
                      <ImageIcon className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="flex items-start gap-2">
                      <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                        #{index + 1}
                      </span>
                      <Select
                        value={
                          image.type === 'custom' && image.customLabel
                            ? `custom:${image.customLabel}`
                            : image.type
                        }
                        onValueChange={(value) => {
                          if (value.startsWith('custom:')) {
                            const typeLabel = value.replace('custom:', '');
                            handleSelectSavedType(image.id, typeLabel);
                          } else {
                            handleTypeChange(image.id, value as StitchImage['type']);
                          }
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            <SelectLabel>Legacy Types</SelectLabel>
                            <SelectItem value="character">Character</SelectItem>
                            <SelectItem value="location">Location</SelectItem>
                            <SelectItem value="style">Style</SelectItem>
                            <SelectItem value="object">Object</SelectItem>
                            <SelectItem value="reference">Reference</SelectItem>
                            <SelectItem value="custom">Custom (New)</SelectItem>
                          </SelectGroup>
                          
                          <SelectGroup>
                            <SelectLabel>Fashion & Apparel</SelectLabel>
                            <SelectItem value="model">Model</SelectItem>
                            <SelectItem value="garment">Garment</SelectItem>
                            <SelectItem value="fabric">Fabric</SelectItem>
                            <SelectItem value="outfit">Outfit</SelectItem>
                          </SelectGroup>
                          
                          <SelectGroup>
                            <SelectLabel>Product Design</SelectLabel>
                            <SelectItem value="product">Product</SelectItem>
                            <SelectItem value="logo">Logo</SelectItem>
                            <SelectItem value="packaging">Packaging</SelectItem>
                            <SelectItem value="brand_element">Brand Element</SelectItem>
                          </SelectGroup>
                          
                          <SelectGroup>
                            <SelectLabel>Automotive</SelectLabel>
                            <SelectItem value="vehicle">Vehicle</SelectItem>
                            <SelectItem value="rims_wheels">Rims & Wheels</SelectItem>
                            <SelectItem value="paint_color">Paint Color</SelectItem>
                            <SelectItem value="interior">Interior</SelectItem>
                          </SelectGroup>
                          
                          <SelectGroup>
                            <SelectLabel>Interior Design</SelectLabel>
                            <SelectItem value="furniture">Furniture</SelectItem>
                            <SelectItem value="room">Room</SelectItem>
                            <SelectItem value="lighting">Lighting</SelectItem>
                            <SelectItem value="wall_finish">Wall Finish</SelectItem>
                          </SelectGroup>
                          
                          <SelectGroup>
                            <SelectLabel>Beauty & Cosmetics</SelectLabel>
                            <SelectItem value="face">Face</SelectItem>
                            <SelectItem value="makeup">Makeup</SelectItem>
                            <SelectItem value="hair">Hair</SelectItem>
                            <SelectItem value="skincare">Skincare</SelectItem>
                          </SelectGroup>
                          
                          <SelectGroup>
                            <SelectLabel>Architecture</SelectLabel>
                            <SelectItem value="building">Building</SelectItem>
                            <SelectItem value="material">Material</SelectItem>
                            <SelectItem value="landscape">Landscape</SelectItem>
                            <SelectItem value="fixture">Fixture</SelectItem>
                          </SelectGroup>
                          
                          <SelectGroup>
                            <SelectLabel>Marketing & Advertising</SelectLabel>
                            <SelectItem value="lifestyle">Lifestyle</SelectItem>
                            <SelectItem value="scene">Scene</SelectItem>
                            <SelectItem value="prop">Prop</SelectItem>
                            <SelectItem value="text_overlay">Text Overlay</SelectItem>
                          </SelectGroup>
                          
                          <SelectGroup>
                            <SelectLabel>Real Estate</SelectLabel>
                            <SelectItem value="property">Property</SelectItem>
                            <SelectItem value="staging">Staging</SelectItem>
                            <SelectItem value="renovation">Renovation</SelectItem>
                          </SelectGroup>
                          
                          <SelectGroup>
                            <SelectLabel>General Purpose</SelectLabel>
                            <SelectItem value="texture">Texture</SelectItem>
                            <SelectItem value="color">Color</SelectItem>
                            <SelectItem value="pattern">Pattern</SelectItem>
                            <SelectItem value="effect">Effect</SelectItem>
                          </SelectGroup>
                          
                          {userCustomTypes.length > 0 && (
                            <SelectGroup>
                              <SelectLabel>My Saved Types ({userCustomTypes.length})</SelectLabel>
                              {userCustomTypes.map((type) => (
                                <SelectItem key={type.id} value={`custom:${type.type_label}`}>
                                  {type.type_label} {type.usage_count > 1 && `(${type.usage_count})`}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}

                          {suggestedTypes.length > 0 && !loadingTypes && (
                            <SelectGroup>
                              <SelectLabel>Suggested Types</SelectLabel>
                              {suggestedTypes.slice(0, 8).map((type) => (
                                <SelectItem key={type.id} value={`custom:${type.type_label}`}>
                                  {type.type_label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    {image.type === 'custom' && (
                      <div className="flex gap-1">
                        <Input
                          type="text"
                          placeholder="Custom label..."
                          value={image.customLabel || ''}
                          onChange={(e) => handleCustomLabelChange(image.id, e.target.value)}
                          className="h-7 text-xs flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && image.customLabel) {
                              handleSaveCustomType(image.customLabel);
                            }
                          }}
                        />
                        {image.customLabel && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => handleSaveCustomType(image.customLabel!)}
                            title="Save to your type library"
                          >
                            <Save className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    )}

                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(image.type)}`}>
                      {image.type === 'custom' && image.customLabel
                        ? image.customLabel
                        : getTypeLabel(image.type)}
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage(image.id);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {images.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <ImageIcon className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm">No images added yet</p>
            <p className="text-xs mt-1">Click "Import Images" to get started</p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Import Dialog */}
    <UnifiedImageImportDialog
      open={showImportDialog}
      onOpenChange={setShowImportDialog}
      onImagesSelected={handleImagesImported}
      maxImages={maxImages}
      currentImageCount={images.length}
      multiSelect={true}
      enableFileUpload={true}
      enableUrlImport={true}
      enablePexelsSearch={true}
      enableSavedGallery={true}
      title="Import Images"
      description={`Add images for stitch generation. You can add ${maxImages - images.length} more image${maxImages - images.length !== 1 ? 's' : ''}.`}
    />
    </>
  );
}
