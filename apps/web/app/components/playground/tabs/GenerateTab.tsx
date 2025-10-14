'use client';

import { useMemo } from 'react';
import DynamicPreviewArea from '../DynamicPreviewArea';
import UnifiedImageGenerationPanel from '../UnifiedImageGenerationPanel';

interface GenerateTabProps {
  // Preview props
  currentProject: any;
  additionalPreviewImages: any[];
  selectedImage: string | null;
  currentSettings: any;
  selectedProvider: string;
  onSelectImage: (url: string | null) => void;
  onSaveToGallery: (url: string) => Promise<void>;
  onUpdateProject: (project: any) => void;
  savingImage: string | null;
  loading: boolean;
  userSubscriptionTier: string;
  onRegenerate: () => void;
  onClearImages: () => void;

  // Generation panel props
  onGenerate: any;
  onSettingsChange: any;
  userCredits: number;
  savedImages: any[];
  selectedPreset: any;
  onStyleChange: (style: string) => void;
  onGenerationModeChange: (mode: string) => void;
  onProviderChange: (provider: string) => void;
  onConsistencyChange: (consistency: string) => void;
  onPromptChange: (prompt: string) => void;
  onEnhancedPromptChange: (prompt: string) => void;
  imagePreviewRef: React.RefObject<HTMLDivElement | null>;
}

export default function GenerateTab({
  currentProject,
  additionalPreviewImages,
  selectedImage,
  currentSettings,
  selectedProvider,
  onSelectImage,
  onSaveToGallery,
  onUpdateProject,
  savingImage,
  loading,
  userSubscriptionTier,
  onRegenerate,
  onClearImages,
  onGenerate,
  onSettingsChange,
  userCredits,
  savedImages,
  selectedPreset,
  onStyleChange,
  onGenerationModeChange,
  onProviderChange,
  onConsistencyChange,
  onPromptChange,
  onEnhancedPromptChange,
  imagePreviewRef}: GenerateTabProps) {
  // Build images array including base image if in img2img mode
  const allImages = useMemo(() => {
    const images = [...(currentProject?.generated_images || []), ...additionalPreviewImages];

    // Add base image to array if it exists in img2img mode
    if (currentSettings.generationMode === 'image-to-image' && currentSettings.baseImageUrl) {
      // Calculate dimensions from aspect ratio and resolution
      const aspectRatio = currentSettings.baseImageAspectRatio || currentSettings.aspectRatio || '1:1';
      const resolution = parseInt(currentSettings.resolution) || 1024;

      const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
      const aspectRatioValue = widthRatio / heightRatio;

      let width: number, height: number;

      if (aspectRatioValue >= 1) {
        // Landscape or square
        width = resolution;
        height = Math.round(resolution / aspectRatioValue);
      } else {
        // Portrait
        height = resolution;
        width = Math.round(resolution * aspectRatioValue);
      }

      const baseImage = {
        url: currentSettings.baseImageUrl,
        width,
        height,
        generated_at: new Date().toISOString(),
        type: 'base'};

      // Add to beginning if not already present
      if (!images.some((img: any) => img.url === currentSettings.baseImageUrl)) {
        images.unshift(baseImage);
      }
    }

    return images;
  }, [
    currentProject?.generated_images,
    additionalPreviewImages,
    currentSettings.generationMode,
    currentSettings.baseImageUrl,
    currentSettings.baseImageAspectRatio,
    currentSettings.aspectRatio,
    currentSettings.resolution,
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 lg:gap-6">
      {/* Preview Area - Full Width Above Controls */}
      <div ref={imagePreviewRef}>
        <DynamicPreviewArea
          images={allImages}
          selectedImage={selectedImage}
          onSelectImage={onSelectImage}
          onSaveToGallery={onSaveToGallery}
          savingImage={savingImage}
          loading={loading}
          aspectRatio={currentSettings.aspectRatio}
          resolution={currentSettings.resolution}
          subscriptionTier={userSubscriptionTier as 'free' | 'plus' | 'pro'}
          selectedProvider={selectedProvider || 'nanobanana'}
          onProviderChange={onProviderChange}
          consistencyLevel={currentSettings.consistencyLevel || 'high'}
          onConsistencyChange={onConsistencyChange}
          onRegenerate={onRegenerate}
          onClearImages={onClearImages}
          fullWidth={true}
          currentStyle={currentSettings.style}
          onStyleChange={onStyleChange}
          generationMode={currentSettings.generationMode}
          onGenerationModeChange={onGenerationModeChange}
          prompt={currentSettings.prompt}
          onRemoveBaseImage={currentSettings.onRemoveBaseImage}
        />
      </div>

      {/* Generation Controls - Full Width Below Preview */}
      <div className="w-full">
        <UnifiedImageGenerationPanel
          onGenerate={onGenerate}
          onSettingsChange={onSettingsChange}
          loading={loading}
          userCredits={userCredits}
          userSubscriptionTier={userSubscriptionTier}
          savedImages={savedImages}
          onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
          selectedPreset={selectedPreset}
          onPresetApplied={() => {
            console.log('🎯 Preset applied, keeping preset data for image generation');
          }}
          currentStyle={currentSettings.style}
          aspectRatio={currentSettings.aspectRatio}
          onStyleChange={onStyleChange}
          generationMode={currentSettings.generationMode}
          onGenerationModeChange={onGenerationModeChange}
          selectedProvider={currentSettings.selectedProvider}
          onProviderChange={onProviderChange}
          consistencyLevel={currentSettings.consistencyLevel}
          onConsistencyChange={onConsistencyChange}
          onPromptChange={onPromptChange}
          onEnhancedPromptChange={onEnhancedPromptChange}
        />
      </div>
    </div>
  );
}
