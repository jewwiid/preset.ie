'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Sparkles, AlertCircle, DollarSign, ChevronDown, Film, Coins, Settings } from 'lucide-react';
import { toast } from 'sonner';
import CinematicParameterSelector from '../cinematic/CinematicParameterSelector';
import { CinematicParameters } from '@preset/types';
import { getProviderCost } from '../../../lib/credits';
import { MentionInput } from '../ui/mention-input';
import { MentionableItem } from '../../../hooks/useMentionSystem';
import { StitchImage } from './StitchImageManager';
import { getReferencedItems } from '../../../lib/utils/mention-parser';
import StitchPresetSelector from './StitchPresetSelector';
import { StitchPreset } from '../../../types/stitch-preset';

interface StitchControlPanelProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  provider: 'seedream' | 'nanobanana';
  onProviderChange: (provider: 'seedream' | 'nanobanana') => void;
  maxImages: number;
  onMaxImagesChange: (maxImages: number) => void;
  size: '1024' | '1280' | '1536' | '2048' | '3072' | '4096';
  onSizeChange: (size: '1024' | '1280' | '1536' | '2048' | '3072' | '4096') => void;
  aspectRatio: string;
  onAspectRatioChange: (aspectRatio: string) => void;
  cinematicParams?: Partial<CinematicParameters>;
  onCinematicParamsChange?: (params: Partial<CinematicParameters>) => void;
  sourceImageCount: number;
  sourceImages: StitchImage[];
  loading: boolean;
  onGenerate: () => void;
  userCredits?: number;
  userSubscriptionTier?: string;
  selectedStitchPreset?: StitchPreset | null;
  onPresetSelect?: (preset: StitchPreset | null) => void;
  onApplyPreset?: (data: {
    prompt: string;
    aspectRatio?: string;
    maxImages?: number;
    cinematicParams?: any;
  }) => void;
}

export default function StitchControlPanel({
  prompt,
  onPromptChange,
  provider,
  onProviderChange,
  maxImages,
  onMaxImagesChange,
  size,
  onSizeChange,
  aspectRatio,
  onAspectRatioChange,
  cinematicParams,
  onCinematicParamsChange,
  sourceImageCount,
  sourceImages,
  loading,
  onGenerate,
  userCredits = 0,
  userSubscriptionTier = 'free',
  selectedStitchPreset,
  onPresetSelect,
  onApplyPreset}: StitchControlPanelProps) {
  const [promptMaxImages, setPromptMaxImages] = useState<number | null>(null);

  // Helper function to get type labels
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
      rims_wheels: 'Rims/Wheels',
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
      effect: 'Effect'
    };
    return labels[type];
  };

  // Create mentionable items from source images
  const mentionableItems: MentionableItem[] = useMemo(() => {
    return sourceImages.map((image, index) => ({
      id: image.id,
      label: image.customLabel || getTypeLabel(image.type),
      thumbnail: image.url,
      type: getTypeLabel(image.type),
      metadata: {
        originalType: image.type,
        index: index + 1}}));
  }, [sourceImages]);

  // Calculate actual dimensions based on size + aspect ratio
  const calculateDimensions = (baseSize: number, ratio: string) => {
    const [w, h] = ratio.split(':').map(Number);
    
    // Safety check for valid numbers
    if (isNaN(w) || isNaN(h) || h === 0 || isNaN(baseSize)) {
      return { width: baseSize || 1024, height: baseSize || 1024 };
    }
    
    const aspectValue = w / h;
    
    if (aspectValue >= 1) {
      return { width: baseSize, height: Math.round(baseSize / aspectValue) };
    } else {
      return { width: Math.round(baseSize * aspectValue), height: baseSize };
    }
  };

  // Extract max_images from prompt
  useEffect(() => {
    const match = prompt.match(/\b(\d+)\s+images?\b/i);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num >= 1 && num <= 15) {
        setPromptMaxImages(num);
      } else {
        setPromptMaxImages(null);
      }
    } else {
      setPromptMaxImages(null);
    }
  }, [prompt]);

  // Calculate cost using credit system
  const totalCreditsNeeded = useMemo(() => {
    // For Nanobanana, estimate based on prompt or default to 1
    const estimatedCount = provider === 'nanobanana'
      ? (promptMaxImages || 1)
      : maxImages;
    
    // Ensure we have valid numbers to prevent NaN
    const validCount = isNaN(estimatedCount) ? 1 : Math.max(1, estimatedCount);
    return getProviderCost(provider, validCount);
  }, [maxImages, provider, promptMaxImages]);

  // Validate generation
  const canGenerate = useMemo(() => {
    if (sourceImageCount === 0) return false;
    if (!prompt.trim()) return false;
    // For Seedream, validate max_images
    if (provider === 'seedream' && (isNaN(maxImages) || maxImages < 1 || maxImages > 15)) return false;
    return true;
  }, [sourceImageCount, prompt, maxImages, provider]);

  const getValidationMessages = () => {
    const messages: string[] = [];

    if (sourceImageCount === 0) {
      messages.push('Add at least one source image');
    }

    if (!prompt.trim()) {
      messages.push('Enter a prompt');
    }

    // Only show max_images validation for Seedream
    if (provider === 'seedream') {
      if (!isNaN(maxImages)) {
        if (promptMaxImages !== null && promptMaxImages !== maxImages) {
          messages.push(
            `⚠️ Prompt mentions ${promptMaxImages} images but max_images is set to ${maxImages}`
          );
        }

        if (maxImages > sourceImageCount) {
          messages.push(
            `💡 max_images (${maxImages}) is greater than source images (${sourceImageCount})`
          );
        }
      } else {
        messages.push('⚠️ Invalid max_images value');
      }
    } else if (provider === 'nanobanana') {
      if (promptMaxImages === null) {
        messages.push(
          `💡 Specify how many images you want in your prompt (e.g., "Create 5 images...")`
        );
      }
    }

    return messages;
  };

  const handleGenerate = () => {
    if (!canGenerate) {
      toast.error('Please fix validation errors before generating');
      return;
    }

    if (totalCreditsNeeded <= 0) {
      toast.error('Invalid cost calculation. Please check your settings.');
      return;
    }

    const credits = isNaN(userCredits) ? 0 : userCredits;
    if (credits < totalCreditsNeeded && userSubscriptionTier === 'free') {
      toast.error(`Insufficient credits. Need ${totalCreditsNeeded} credits but have ${credits} credits.`);
      return;
    }

    onGenerate();
  };

  const validationMessages = getValidationMessages();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Generation Settings & Presets</CardTitle>
        <CardDescription>
          Choose presets and configure how your images will be stitched together
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stitch Presets */}
        {onPresetSelect && onApplyPreset && (
          <Collapsible className="space-y-2">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-muted hover:bg-muted/80 rounded-lg transition-colors">
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span className="text-sm font-medium">Stitch Presets</span>
              </div>
              <ChevronDown className="h-4 w-4 ml-auto transition-transform ui-expanded:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-3">
              <StitchPresetSelector
                sourceImages={sourceImages}
                currentPrompt={prompt}
                currentAspectRatio={aspectRatio}
                currentMaxImages={maxImages}
                currentCinematicParams={cinematicParams}
                currentProvider={provider}
                onPresetSelect={onPresetSelect}
                onApplyPreset={onApplyPreset}
              />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Prompt */}
        <div className="space-y-2">
          <Label htmlFor="stitch-prompt">
            Prompt <span className="text-destructive">*</span>
          </Label>
          <MentionInput
            value={prompt}
            onChange={onPromptChange}
            placeholder="Describe how you want to combine the reference images... (e.g., 'Create 5 images showing @Character in different locations with consistent style')"
            mentionableItems={mentionableItems}
            onMentionSelect={(item) => {
              console.log('Mentioned:', item.label, item.metadata);
            }}
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground">
            💡 Tip: Use @ to reference your images (e.g., "@Character", "@shoes") and mention the number of images you want (e.g., "Create 5 images...")
          </p>
          
          {/* Referenced Images */}
          {prompt && (() => {
            const referencedItems = getReferencedItems(prompt, mentionableItems);
            return referencedItems.length > 0 && (
              <div className="mt-2 p-2 bg-muted/50 rounded-md">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Referenced in prompt:
                </p>
                <div className="flex flex-wrap gap-2">
                  {referencedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded overflow-hidden bg-muted">
                        <img
                          src={item.thumbnail}
                          alt={item.label}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider">Provider</Label>
          <Select value={provider} onValueChange={onProviderChange}>
            <SelectTrigger id="provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seedream">Seedream (Recommended)</SelectItem>
              <SelectItem value="nanobanana">Nanobanana (Auto-detect count)</SelectItem>
            </SelectContent>
          </Select>
          {provider === 'nanobanana' && (
            <p className="text-xs text-muted-foreground">
              ℹ️ Nanobanana automatically determines output count from your prompt
            </p>
          )}
        </div>

        {/* Max Images - Only for Seedream */}
        {provider === 'seedream' && (
          <div className="space-y-2">
          <Label htmlFor="max-images">
            Max Images <span className="text-destructive">*</span>
          </Label>
          <Input
            id="max-images"
            type="number"
            min={1}
            max={15}
            value={isNaN(maxImages) ? '' : maxImages}
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (!isNaN(value) && value >= 1 && value <= 15) {
                onMaxImagesChange(value);
              } else if (e.target.value === '') {
                // Allow empty input temporarily, will validate on generate
                onMaxImagesChange(1);
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Number of images to generate (1-15). Should match your prompt.
          </p>
          {promptMaxImages !== null && promptMaxImages !== maxImages && !isNaN(maxImages) && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your prompt mentions {promptMaxImages} images but max_images is set to {maxImages}.
                These should match for best results.
              </AlertDescription>
            </Alert>
          )}
        </div>
        )}

        {/* Size Selection */}
        <div className="space-y-2">
          <Label htmlFor="size">Base Size</Label>
          <Select value={size} onValueChange={onSizeChange}>
            <SelectTrigger id="size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1024">1024 (Standard)</SelectItem>
              <SelectItem value="1280">1280</SelectItem>
              <SelectItem value="1536">1536</SelectItem>
              <SelectItem value="2048">2048 (High Quality)</SelectItem>
              <SelectItem value="3072">3072</SelectItem>
              <SelectItem value="4096">4096 (Ultra HD)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Base dimension for aspect ratio calculation
          </p>
        </div>

        {/* Aspect Ratio Selection */}
        <div className="space-y-2">
          <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
          <Select value={aspectRatio} onValueChange={onAspectRatioChange}>
            <SelectTrigger id="aspect-ratio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1:1">Square (1:1)</SelectItem>
              <SelectItem value="3:2">Standard (3:2)</SelectItem>
              <SelectItem value="2:3">Portrait (2:3)</SelectItem>
              <SelectItem value="3:4">Portrait (3:4)</SelectItem>
              <SelectItem value="4:3">Standard (4:3)</SelectItem>
              <SelectItem value="4:5">Portrait (4:5)</SelectItem>
              <SelectItem value="5:4">Landscape (5:4)</SelectItem>
              <SelectItem value="9:16">Vertical (9:16)</SelectItem>
              <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
              <SelectItem value="21:9">Ultrawide (21:9)</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            Final output: {calculateDimensions(parseInt(size, 10) || 1024, aspectRatio).width}×{calculateDimensions(parseInt(size, 10) || 1024, aspectRatio).height} (Nanobanana supports 10 ratios)
          </p>
        </div>

        {/* Cinematic Parameters (Optional) */}
        <Collapsible className="space-y-2">
          <CollapsibleTrigger className="flex items-center justify-between w-full p-3 text-left bg-muted hover:bg-muted/80 rounded-lg transition-colors">
            <div className="flex items-center gap-2">
              <Film className="h-4 w-4" />
              <span className="text-sm font-medium">Cinematic Settings (Optional)</span>
            </div>
            <ChevronDown className="h-4 w-4 ml-auto transition-transform ui-expanded:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3">
            <CinematicParameterSelector
              parameters={cinematicParams || {}}
              onParametersChange={onCinematicParamsChange || (() => {})}
              compact={true}
            />
          </CollapsibleContent>
        </Collapsible>

        {/* Cost Display */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Credits Required</span>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold">{isNaN(totalCreditsNeeded) ? '?' : totalCreditsNeeded} credit{totalCreditsNeeded !== 1 ? 's' : ''}</div>
            <div className="text-xs text-muted-foreground">
              {provider === 'nanobanana'
                ? `${getProviderCost('nanobanana', 1)} credit${getProviderCost('nanobanana', 1) !== 1 ? 's' : ''} × ${promptMaxImages || 1} images (estimated)`
                : `${getProviderCost('seedream', 1)} credit${getProviderCost('seedream', 1) !== 1 ? 's' : ''} × ${isNaN(maxImages) ? '?' : maxImages} images`
              }
            </div>
          </div>
        </div>

        {/* Validation Messages */}
        {validationMessages.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="text-xs space-y-1 mt-1">
                {validationMessages.map((msg, idx) => (
                  <li key={idx}>• {msg}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Generate Button */}
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {provider === 'nanobanana'
                ? 'Generate Images'
                : `Generate ${isNaN(maxImages) ? '?' : maxImages} Image${maxImages !== 1 ? 's' : ''}`
              }
            </>
          )}
        </Button>

        {/* Info Section */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <div className="mt-0.5">ℹ️</div>
            <div className="space-y-1">
              <p>
                <strong>Source Images:</strong> {sourceImageCount} added
              </p>
              <p>
                <strong>Credits Available:</strong> {isNaN(userCredits) ? '0' : userCredits} credit{userCredits !== 1 ? 's' : ''}
              </p>
              <p className="text-[10px] leading-relaxed mt-2">
                The Stitch feature combines multiple reference images into a cohesive sequence.
                Label your images (character, location, style, etc.) for better results.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
