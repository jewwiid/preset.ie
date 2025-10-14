'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { EmptyState } from '../ui/empty-state';

interface EmptyLibraryStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/**
 * @deprecated Use EmptyState from @/components/ui/empty-state instead
 * This component is kept for backwards compatibility
 */
export function EmptyLibraryState({ icon, title, description }: EmptyLibraryStateProps) {
  return <EmptyState icon={icon} title={title} description={description} />;
}
