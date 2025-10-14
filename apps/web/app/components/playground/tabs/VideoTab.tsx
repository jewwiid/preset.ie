'use client';

import VideoPreviewArea from '../VideoPreviewArea';
import VideoGenerationPanel from '../VideoGenerationPanel';

interface VideoTabProps {
  videoSourceImage: string | null;
  selectedImage: string | null;
  videoStyledImage: string | null;
  generatedVideoMetadata: any;
  videoAspectRatio: string;
  videoResolution: string;
  videoPrompt: string;
  displayVideos: any[];
  selectedVideo: string | null;
  setSelectedVideo: (url: string | null) => void;
  onSaveToGallery: (url: string) => Promise<void>;
  onDeleteVideo: (url: string) => Promise<void>;
  savingImage: string | null;
  deletingVideo: string | null;
  loading: boolean;
  onGenerateVideo: any;
  savedImages: any[];
  onSelectImage: (url: string | null) => void;
  setVideoPrompt: (prompt: string) => void;
  setVideoAspectRatio: (ratio: string) => void;
  setVideoResolution: (resolution: string) => void;
  setVideoSourceImage: (url: string | null) => void;
  setVideoStyledImage: (url: string | null) => void;
  userCredits: number;
  userSubscriptionTier: string;
  videoProvider: 'seedream' | 'wan';
  setVideoProvider: (provider: 'seedream' | 'wan') => void;
  selectedPreset: any;
  setSelectedPreset: (preset: any) => void;
  videoPreviewRef: React.RefObject<HTMLDivElement | null>;
}

export default function VideoTab({
  videoSourceImage,
  selectedImage,
  videoStyledImage,
  generatedVideoMetadata,
  videoAspectRatio,
  videoResolution,
  videoPrompt,
  displayVideos,
  selectedVideo,
  setSelectedVideo,
  onSaveToGallery,
  onDeleteVideo,
  savingImage,
  deletingVideo,
  loading,
  onGenerateVideo,
  savedImages,
  onSelectImage,
  setVideoPrompt,
  setVideoAspectRatio,
  setVideoResolution,
  setVideoSourceImage,
  setVideoStyledImage,
  userCredits,
  userSubscriptionTier,
  videoProvider,
  setVideoProvider,
  selectedPreset,
  setSelectedPreset,
  videoPreviewRef}: VideoTabProps) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:gap-6">
      {/* Video Preview - Full Width Above Controls */}
      <div ref={videoPreviewRef}>
        <VideoPreviewArea
          sourceImage={videoSourceImage || selectedImage}
          styledImageUrl={videoStyledImage || generatedVideoMetadata?.styledImageUrl || null}
          aspectRatio={videoAspectRatio}
          resolution={videoResolution}
          prompt={videoPrompt}
          videos={displayVideos}
          selectedVideo={selectedVideo}
          onSelectVideo={setSelectedVideo}
          onSaveToGallery={onSaveToGallery}
          onDeleteVideo={onDeleteVideo}
          savingVideo={savingImage}
          deletingVideo={deletingVideo}
          loading={loading}
          fullWidth={true}
        />
      </div>

      {/* Video Generation Controls - Full Width Below Preview */}
      <div className="w-full">
        <VideoGenerationPanel
          onGenerateVideo={onGenerateVideo}
          loading={loading}
          selectedImage={selectedImage}
          aspectRatio={videoAspectRatio}
          savedImages={savedImages}
          onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
          onPromptChange={setVideoPrompt}
          onAspectRatioChange={setVideoAspectRatio}
          onResolutionChange={setVideoResolution}
          onActiveImageChange={setVideoSourceImage}
          onStyledImageChange={setVideoStyledImage}
          userCredits={userCredits}
          userSubscriptionTier={userSubscriptionTier}
          selectedProvider={videoProvider}
          onProviderChange={setVideoProvider}
          selectedPreset={selectedPreset}
          onPresetChange={(preset) => setSelectedPreset(preset)}
        />
      </div>
    </div>
  );
}
