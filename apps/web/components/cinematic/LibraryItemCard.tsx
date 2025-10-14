'use client';

import React, { ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';

interface LibraryItemCardProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  onClick: () => void;
  compact?: boolean;
}

export function LibraryItemCard({
  title,
  description,
  icon,
  badge,
  onClick,
  compact = false
}: LibraryItemCardProps) {
  return (
    <div
      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {icon ? (
            <div className="flex items-center gap-2">
              {icon}
              <span className="font-medium text-sm leading-tight truncate">{title}</span>
            </div>
          ) : (
            <span className="font-medium text-sm leading-tight block truncate">{title}</span>
          )}
          {description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {description}
            </p>
          )}
        </div>
        {badge && <div className="flex-shrink-0">{badge}</div>}
      </div>
    </div>
  );
}
