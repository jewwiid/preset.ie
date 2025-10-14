'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PreferenceSectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  defaultExpanded?: boolean;
  icon?: ReactNode;
  className?: string;
}

export default function PreferenceSection({
  title,
  description,
  children,
  defaultExpanded = true,
  icon,
  className}: PreferenceSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon && <div className="text-primary">{icon}</div>}
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              {description && (
                <CardDescription className="mt-1">{description}</CardDescription>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-auto"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      {isExpanded && <CardContent className="space-y-6">{children}</CardContent>}
    </Card>
  );
}
