'use client';

import PastGenerationsPanel from '../PastGenerationsPanel';

interface HistoryTabProps {
  onImportProject: (project: any) => void;
  updateSettings: (settings: any) => void;
  setActiveTab: (tab: string) => void;
}

export default function HistoryTab({
  onImportProject,
  updateSettings,
  setActiveTab}: HistoryTabProps) {
  return (
    <PastGenerationsPanel
      onImportProject={(project) => {
        onImportProject(project);

        // Extract aspect ratio from the imported project
        let aspectRatio: string | undefined;
        if (project.generated_images && project.generated_images.length > 0) {
          const image = project.generated_images[0];
          if (image.width && image.height) {
            const ratio = image.width / image.height;
            if (Math.abs(ratio - 1) < 0.05) aspectRatio = '1:1';
            else if (Math.abs(ratio - 16 / 9) < 0.05) aspectRatio = '16:9';
            else if (Math.abs(ratio - 9 / 16) < 0.05) aspectRatio = '9:16';
            else if (Math.abs(ratio - 21 / 9) < 0.05) aspectRatio = '21:9';
            else if (Math.abs(ratio - 4 / 3) < 0.05) aspectRatio = '4:3';
            else if (Math.abs(ratio - 3 / 4) < 0.05) aspectRatio = '3:4';
            else aspectRatio = '16:9';
          }
        }

        if (aspectRatio) {
          updateSettings({ baseImageAspectRatio: aspectRatio });
          console.log('📐 Updated aspect ratio from imported project:', aspectRatio);
        }

        // Route to appropriate tab based on media type
        if (project.is_video) {
          console.log('🎬 Importing video project, switching to video tab');
          setActiveTab('video');
        } else {
          console.log('🖼️ Importing image project, switching to edit tab');
          setActiveTab('edit');
        }
      }}
    />
  );
}
