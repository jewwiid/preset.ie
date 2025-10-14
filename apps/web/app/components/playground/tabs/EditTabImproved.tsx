'use client';

import { useState } from 'react';
import AdvancedEditingPanelRefactored from '../AdvancedEditingPanelRefactored';
import EditComparisonView from '../edit/EditComparisonView';

interface EditTabImprovedProps {
  onEdit: any;
  loading: boolean;
  selectedImage: string | null;
  savedImages: any[];
  onSelectImage: (url: string | null) => void;
  currentSettings: any;
  currentProject: any;
  additionalPreviewImages: any[];
  onUpdateProject: (project: any) => void;
  onSaveToGallery: (url: string, overrideExisting?: boolean) => Promise<void>;
  savingImage: string | null;
  userSubscriptionTier: string;
}

export default function EditTabImproved({
  onEdit,
  loading,
  selectedImage,
  savedImages,
  onSelectImage,
  currentSettings,
  currentProject,
  additionalPreviewImages,
  onUpdateProject,
  savingImage,
  userSubscriptionTier}: EditTabImprovedProps) {
  const [editResult, setEditResult] = useState<string | null>(null);
  const [editHistory, setEditHistory] = useState<string[]>([]);

  // Enhanced edit handler that manages before/after state
  const handleEdit = async (params: any) => {
    try {
      // Call the original edit function
      await onEdit(params);
      
      // For now, we'll simulate getting a result URL
      // In a real implementation, this would come from the edit API response
      const resultUrl = params.imageUrl; // This should be the actual result URL
      setEditResult(resultUrl);
      
      // Add to edit history
      setEditHistory(prev => [...prev, resultUrl]);
    } catch (error) {
      console.error('Edit failed:', error);
    }
  };

  const handleSaveResult = async (imageUrl: string) => {
    try {
      await onSaveToGallery(imageUrl);
    } catch (error) {
      console.error('Failed to save result:', error);
    }
  };

  const handleDownloadResult = (imageUrl: string) => {
    // Create download link
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `edited-image-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleTryAnotherEdit = () => {
    // Reset the result to allow another edit
    setEditResult(null);
  };

  const handleUseResultAsSource = () => {
    // Use the current result as the new source image
    if (editResult) {
      onSelectImage(editResult);
      setEditResult(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left: Edit Controls */}
      <div className="space-y-6">
        <AdvancedEditingPanelRefactored
          onEdit={handleEdit}
          loading={loading}
          selectedImage={selectedImage}
          savedImages={savedImages}
          onSelectSavedImage={(imageUrl) => onSelectImage(imageUrl)}
          onImageUpload={async (file: File) => {
            return new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.readAsDataURL(file);
            });
          }}
        />
      </div>

      {/* Right: Before/After Comparison */}
      <div className="space-y-6">
        <EditComparisonView
          sourceImage={selectedImage}
          resultImage={editResult}
          loading={loading}
          onSaveResult={handleSaveResult}
          onDownloadResult={handleDownloadResult}
          onTryAnotherEdit={handleTryAnotherEdit}
          onUseResultAsSource={handleUseResultAsSource}
          savingImage={savingImage}
        />

        {/* Edit History */}
        {editHistory.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Recent Edits</h3>
            <div className="grid grid-cols-2 gap-2">
              {editHistory.slice(-4).map((url, index) => (
                <div
                  key={index}
                  className="relative aspect-square bg-muted rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                  onClick={() => onSelectImage(url)}
                >
                  <img
                    src={url}
                    alt={`Edit result ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-1 left-1">
                    <span className="bg-primary text-primary-foreground text-xs px-1 py-0.5 rounded">
                      #{editHistory.length - index}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
