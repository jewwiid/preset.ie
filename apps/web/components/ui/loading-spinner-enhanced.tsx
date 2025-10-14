import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
  variant?: 'default' | 'lucide'; // Choose between CSS or Lucide
}

export function LoadingSpinner({
  size = 'md',
  text,
  className,
  fullScreen,
  variant = 'default' // Default to CSS spinner
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  const spinner = variant === 'lucide' ? (
    <Loader2 className={cn("animate-spin text-primary", sizeClasses[size])} />
  ) : (
    <div className={cn("animate-spin rounded-full border-b-2 border-primary", sizeClasses[size])} />
  );

  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      {spinner}
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-50">
        {content}
      </div>
    );
  }

  return content;
}
