'use client';

import { useState } from 'react';

export function usePlaygroundTabs(onTabChange?: (tab: string) => void) {
  const [activeTab, setActiveTab] = useState('generate');

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    onTabChange?.(tab);
  };

  return { activeTab, setActiveTab: handleTabChange };
}
