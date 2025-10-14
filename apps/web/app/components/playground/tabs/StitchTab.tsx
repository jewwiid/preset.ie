'use client';

import { useState, useCallback } from 'react';
import StitchImageManager, { StitchImage } from '../StitchImageManager';
import StitchControlPanel from '../StitchControlPanel';
import StitchPreviewArea from '../StitchPreviewArea';
import StitchPresetSelector from '../StitchPresetSelector';
import { toast } from 'sonner';
import { CinematicParameters } from '@preset/types';
import { StitchPreset } from '../../../../types/stitch-preset';
import { useAuth } from '../../../../lib/auth-context';

interface StitchTabProps {
  loading?: boolean;
  userCredits?: number;
  userSubscriptionTier?: string;
  onSaveToGallery?: (url: string) => Promise<void>;
}

interface GeneratedImage {
  url: string;
  index: number;
}

export default function StitchTab({
  loading: externalLoading = false,
  userCredits = 0,
  userSubscriptionTier = 'free',
  onSaveToGallery}: StitchTabProps) {
  const { session } = useAuth();
  
  // Source images state
  const [sourceImages, setSourceImages] = useState<StitchImage[]>([]);
  const [selectedSourceImageId, setSelectedSourceImageId] = useState<string | null>(null);

  // Generation settings state
  const [prompt, setPrompt] = useState('');
  const [provider, setProvider] = useState<'seedream' | 'nanobanana'>('seedream');
  const [maxImages, setMaxImages] = useState(5);
  const [size, setSize] = useState<'1024' | '1280' | '1536' | '2048' | '3072' | '4096'>('1024');
  const [aspectRatio, setAspectRatio] = useState<string>('1:1');
  const [cinematicParams, setCinematicParams] = useState<Partial<CinematicParameters>>();
  
  // Preset state
  const [selectedStitchPreset, setSelectedStitchPreset] = useState<StitchPreset | null>(null);

  // Generated images state
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
  const [selectedGeneratedImage, setSelectedGeneratedImage] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [savingImage, setSavingImage] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!session?.access_token) {
      toast.error('Please log in to generate images');
      return;
    }

    if (sourceImages.length === 0) {
      toast.error('Please add at least one source image');
      return;
    }

    if (!prompt.trim()) {
      toast.error('Please enter a prompt');
      return;
    }

    setGenerating(true);
    setGeneratedImages([]);
    setSelectedGeneratedImage(null);

    try {
      // Prepare images array for API
      const imagesPayload = sourceImages.map((img) => ({
        url: img.url,
        type: img.type === 'custom' && img.customLabel ? img.customLabel : img.type}));

      const requestBody = {
        prompt: prompt.trim(),
        images: imagesPayload,
        max_images: maxImages,
        size: parseInt(size),
        aspect_ratio: aspectRatio,
        cinematic_parameters: cinematicParams && Object.keys(cinematicParams).length > 0 ? cinematicParams : undefined,
        provider,
        enable_base64_output: false,
        enable_sync_mode: true};

      console.log('Stitch API Request:', requestBody);

      const response = await fetch('/api/v3/bytedance/seedream-v4/edit-sequential', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`},
        body: JSON.stringify(requestBody)});

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate images');
      }

      if (data.images && Array.isArray(data.images)) {
        const newImages: GeneratedImage[] = data.images.map((url: string, index: number) => ({
          url,
          index}));
        setGeneratedImages(newImages);
        setSelectedGeneratedImage(newImages[0]?.url || null);
        toast.success(`Generated ${newImages.length} image${newImages.length !== 1 ? 's' : ''}!`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Stitch generation error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate images');
    } finally {
      setGenerating(false);
    }
  }, [sourceImages, prompt, maxImages, size, aspectRatio, cinematicParams, provider, session?.access_token]);

  const handleSaveToGallery = useCallback(
    async (url: string) => {
      if (!onSaveToGallery) {
        toast.error('Save to gallery not available');
        return;
      }

      setSavingImage(url);
      try {
        await onSaveToGallery(url);
      } catch (error) {
        console.error('Save to gallery error:', error);
        throw error;
      } finally {
        setSavingImage(null);
      }
    },
    [onSaveToGallery]
  );

  const handleApplyPreset = useCallback((data: {
    prompt: string;
    aspectRatio?: string;
    maxImages?: number;
    cinematicParams?: any;
  }) => {
    setPrompt(data.prompt);
    if (data.aspectRatio) setAspectRatio(data.aspectRatio);
    if (data.maxImages) setMaxImages(data.maxImages);
    if (data.cinematicParams) setCinematicParams(data.cinematicParams);
    toast.success('Preset applied successfully!');
  }, []);

  return (
    <div className="space-y-6">
      {/* Top Row: Source Images and Generated Images */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Left: Source Images */}
        <div>
          <StitchImageManager
            images={sourceImages}
            maxImages={10}
            onImagesChange={setSourceImages}
            selectedImageId={selectedSourceImageId}
            onSelectImage={setSelectedSourceImageId}
          />
        </div>

        {/* Right: Generated Images */}
        <div>
          <StitchPreviewArea
            images={generatedImages}
            loading={generating || externalLoading}
            selectedImage={selectedGeneratedImage}
            onSelectImage={setSelectedGeneratedImage}
            onSaveToGallery={handleSaveToGallery}
            savingImage={savingImage}
            aspectRatio={aspectRatio}
          />
        </div>
      </div>

      {/* Bottom: Full-width Generation Settings with Presets */}
      <StitchControlPanel
        prompt={prompt}
        onPromptChange={setPrompt}
        provider={provider}
        onProviderChange={setProvider}
        maxImages={maxImages}
        onMaxImagesChange={setMaxImages}
        size={size}
        onSizeChange={setSize}
        aspectRatio={aspectRatio}
        onAspectRatioChange={setAspectRatio}
        cinematicParams={cinematicParams}
        onCinematicParamsChange={setCinematicParams}
        sourceImageCount={sourceImages.length}
        sourceImages={sourceImages}
        loading={generating || externalLoading}
        onGenerate={handleGenerate}
        userCredits={userCredits}
        userSubscriptionTier={userSubscriptionTier}
        selectedStitchPreset={selectedStitchPreset}
        onPresetSelect={setSelectedStitchPreset}
        onApplyPreset={handleApplyPreset}
      />
    </div>
  );
}
