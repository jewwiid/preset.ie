'use client';

import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface NumberInputProps {
  value?: number;
  onChange?: (value: number | undefined) => void;
  placeholder?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function NumberInput({
  value,
  onChange,
  placeholder,
  min,
  max,
  step = 1,
  disabled = false,
  className,
  size = 'md'
}: NumberInputProps) {
  const [inputValue, setInputValue] = React.useState(value?.toString() || '');

  // Update input value when prop value changes
  React.useEffect(() => {
    setInputValue(value?.toString() || '');
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    
    if (newValue === '') {
      onChange?.(undefined);
    } else {
      const numValue = parseFloat(newValue);
      if (!isNaN(numValue)) {
        onChange?.(numValue);
      }
    }
  };

  const handleIncrement = () => {
    const currentValue = value || 0;
    const newValue = Math.min(currentValue + step, max ?? Infinity);
    if (newValue !== currentValue) {
      onChange?.(newValue);
    }
  };

  const handleDecrement = () => {
    const currentValue = value || 0;
    const newValue = Math.max(currentValue - step, min ?? -Infinity);
    if (newValue !== currentValue) {
      onChange?.(newValue);
    }
  };

  const sizeClasses = {
    sm: 'h-8 text-sm',
    md: 'h-9 text-sm',
    lg: 'h-10 text-base'
  };

  const buttonSizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  const iconSizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-4 w-4'
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <Input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={inputValue}
        onChange={handleInputChange}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          sizeClasses[size],
          'pr-16 text-center [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]'
        )}
      />
      <div className="absolute right-0 flex flex-col">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            buttonSizeClasses[size],
            'h-1/2 rounded-none rounded-tr-md border-l border-border hover:bg-muted/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleIncrement}
          disabled={disabled || (max !== undefined && (value || 0) >= max)}
        >
          <Plus className={iconSizeClasses[size]} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            buttonSizeClasses[size],
            'h-1/2 rounded-none rounded-br-md border-l border-t border-border hover:bg-muted/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={handleDecrement}
          disabled={disabled || (min !== undefined && (value || 0) <= min)}
        >
          <Minus className={iconSizeClasses[size]} />
        </Button>
      </div>
    </div>
  );
}