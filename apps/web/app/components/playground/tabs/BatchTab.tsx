'use client';

import BatchProcessingPanel from '../BatchProcessingPanel';
import ImagePreviewArea from '../ImagePreviewArea';

interface BatchTabProps {
  onPerformBatchEdit: any;
  loading: boolean;
  savedImages: any[];
  onSelectImage: (url: string | null) => void;
  selectedImage: string | null;
  currentSettings: any;
  currentProject: any;
  additionalPreviewImages: any[];
  onSaveToGallery: (url: string, overrideExisting?: boolean) => Promise<void>;
  onUpdateProject: (project: any) => void;
  savingImage: string | null;
  userSubscriptionTier: string;
}

export default function BatchTab({
  onPerformBatchEdit,
  loading,
  savedImages,
  onSelectImage,
  selectedImage,
  currentSettings,
  currentProject,
  additionalPreviewImages,
  onSaveToGallery,
  onUpdateProject,
  savingImage,
  userSubscriptionTier}: BatchTabProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
      <BatchProcessingPanel
        onPerformBatchEdit={onPerformBatchEdit}
        loading={loading}
        savedImages={savedImages}
        onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
      />

      <ImagePreviewArea
        title="Images to Process"
        description="Select images from your generated content for batch processing"
        aspectRatio={currentSettings.baseImageAspectRatio || currentSettings.aspectRatio}
        resolution={currentSettings.resolution}
        images={[...(currentProject?.generated_images || []), ...additionalPreviewImages]}
        selectedImage={selectedImage}
        onSelectImage={onSelectImage}
        onSaveToGallery={onSaveToGallery}
        onRemoveImage={(imageUrl) => {
          if (currentProject) {
            const updatedImages = currentProject.generated_images.filter(
              (img: any) => img.url !== imageUrl
            );
            const updatedProject = {
              ...currentProject,
              generated_images: updatedImages};
            onUpdateProject(updatedProject);

            if (selectedImage === imageUrl) {
              onSelectImage('');
            }
          }
        }}
        savingImage={savingImage}
        loading={loading}
        showSaveButton={true}
        showDownloadButton={true}
        showRemoveButton={true}
        emptyStateMessage="No images available for batch processing. Generate some images first!"
        subscriptionTier={userSubscriptionTier as 'free' | 'plus' | 'pro'}
      />
    </div>
  );
}
