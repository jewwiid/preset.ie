import { LucideIcon } from 'lucide-react';
import { IconBadge } from './icon-badge';
import { cn } from '@/lib/utils';

interface EnhancedCardHeaderProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent';
  className?: string;
}

export function EnhancedCardHeader({
  icon,
  title,
  description,
  action,
  variant = 'primary',
  className
}: EnhancedCardHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div className="flex items-center gap-3">
        <IconBadge icon={icon} size="md" variant={variant} />
        <div>
          <h3 className="text-lg font-bold text-foreground">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
