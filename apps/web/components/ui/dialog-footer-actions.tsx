import { DialogFooter } from '@/components/ui/dialog';
import { AsyncButton } from './async-button';
import { Button } from './button';
import { LucideIcon } from 'lucide-react';

interface DialogFooterActionsProps {
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
  cancelText?: string;
  confirmText?: string;
  loadingText?: string;
  confirmVariant?: 'default' | 'destructive';
  confirmIcon?: LucideIcon;
  disabled?: boolean;
  className?: string;
}

export function DialogFooterActions({
  onCancel,
  onConfirm,
  isLoading,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  loadingText,
  confirmVariant = 'default',
  confirmIcon,
  disabled,
  className
}: DialogFooterActionsProps) {
  return (
    <DialogFooter className={className}>
      <Button
        variant="outline"
        onClick={onCancel}
        disabled={isLoading || disabled}
      >
        {cancelText}
      </Button>
      <AsyncButton
        variant={confirmVariant}
        onClick={onConfirm}
        isLoading={isLoading}
        loadingText={loadingText}
        icon={confirmIcon}
        disabled={disabled}
      >
        {confirmText}
      </AsyncButton>
    </DialogFooter>
  );
}
