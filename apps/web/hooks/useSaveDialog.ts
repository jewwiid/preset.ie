'use client';

import { useState, useCallback } from 'react';

export function useSaveDialog() {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [pendingSaveUrl, setPendingSaveUrl] = useState<string | null>(null);
  const [pendingSaveMetadata, setPendingSaveMetadata] = useState<any>(null);

  const openSaveDialog = useCallback((url: string, metadata?: any) => {
    setPendingSaveUrl(url);
    setPendingSaveMetadata(metadata || null);
    setSaveDialogOpen(true);
  }, []);

  const closeSaveDialog = useCallback(() => {
    setSaveDialogOpen(false);
    setPendingSaveUrl(null);
    setPendingSaveMetadata(null);
  }, []);

  return {
    saveDialogOpen,
    pendingSaveUrl,
    pendingSaveMetadata,
    openSaveDialog,
    closeSaveDialog,
  };
}
