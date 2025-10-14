'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface AnalysisCardSectionProps {
  title: string;
  description?: string;
  icon: LucideIcon;
  iconClassName?: string;
  variant?: 'default' | 'primary' | 'destructive';
  children: React.ReactNode;
}

export function AnalysisCardSection({
  title,
  description,
  icon: Icon,
  iconClassName = 'text-primary',
  variant = 'default',
  children}: AnalysisCardSectionProps) {
  const variantStyles = {
    default: '',
    primary: 'border-primary/20 bg-primary/5',
    destructive: 'border-destructive/20 bg-destructive/5'};

  return (
    <Card className={variantStyles[variant]}>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <Icon className={`w-4 h-4 ${iconClassName}`} />
          {title}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
