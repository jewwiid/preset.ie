import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconBadge } from './icon-badge';

interface InfoCardProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  variant?: 'default' | 'primary' | 'accent' | 'destructive' | 'success' | 'warning';
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function InfoCard({
  icon,
  title,
  description,
  variant = 'default',
  action,
  className
}: InfoCardProps) {
  const variantClasses = {
    default: 'bg-muted/50 border-muted',
    primary: 'bg-primary/10 border-primary/20',
    accent: 'bg-accent/10 border-accent/20',
    destructive: 'bg-destructive/10 border-destructive/20',
    success: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800',
    warning: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'};

  return (
    <div className={cn(
      "p-4 rounded-xl border",
      variantClasses[variant],
      className
    )}>
      <div className="flex items-start gap-3">
        <IconBadge icon={icon} size="sm" variant={variant === 'default' ? 'muted' : variant} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          )}
          {action && (
            <button
              onClick={action.onClick}
              className="mt-2 text-xs font-medium hover:underline"
            >
              {action.label} →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
