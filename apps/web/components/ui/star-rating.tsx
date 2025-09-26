'use client';

import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function StarRating({ 
  value, 
  onChange, 
  max = 5, 
  size = 'md',
  className,
  disabled = false 
}: StarRatingProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  const handleClick = (rating: number) => {
    if (!disabled) {
      onChange(rating);
    }
  };

  const handleMouseEnter = (rating: number) => {
    if (!disabled) {
      // Could add hover state here if needed
    }
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, index) => {
        const rating = index + 1;
        const isFilled = rating <= value;
        
        return (
          <button
            key={rating}
            type="button"
            onClick={() => handleClick(rating)}
            onMouseEnter={() => handleMouseEnter(rating)}
            disabled={disabled}
            className={cn(
              'transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-sm',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:scale-110'
            )}
          >
            <Star
              className={cn(
                sizeClasses[size],
                isFilled 
                  ? 'fill-yellow-400 text-yellow-400' 
                  : 'fill-gray-200 text-gray-200',
                !disabled && 'hover:fill-yellow-300 hover:text-yellow-300'
              )}
            />
          </button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value} star{value !== 1 ? 's' : ''}
        </span>
      )}
    </div>
  );
}

// Read-only version for displaying ratings
interface StarDisplayProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function StarDisplay({ 
  value, 
  max = 5, 
  size = 'md',
  className,
  showText = true 
}: StarDisplayProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }, (_, index) => {
        const rating = index + 1;
        const isFilled = rating <= value;
        
        return (
          <Star
            key={rating}
            className={cn(
              sizeClasses[size],
              isFilled 
                ? 'fill-yellow-400 text-yellow-400' 
                : 'fill-gray-200 text-gray-200'
            )}
          />
        );
      })}
      {showText && (
        <span className="ml-2 text-sm text-muted-foreground">
          {value.toFixed(1)} ({value} star{value !== 1 ? 's' : ''})
        </span>
      )}
    </div>
  );
}
