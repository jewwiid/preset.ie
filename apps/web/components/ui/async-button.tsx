import { Button, ButtonProps } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Loader2, LucideIcon } from 'lucide-react';

interface AsyncButtonProps extends ButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export function AsyncButton({
  isLoading,
  loadingText,
  icon: Icon,
  iconPosition = 'left',
  children,
  disabled,
  ...props
}: AsyncButtonProps) {
  const isDisabled = isLoading || disabled;

  return (
    <Button {...props} disabled={isDisabled}>
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" />
          {loadingText || children}
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 mr-2" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 ml-2" />}
        </>
      )}
    </Button>
  );
}
