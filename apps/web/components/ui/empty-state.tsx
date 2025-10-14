'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Main title/heading */
  title: string;
  /** Optional description text */
  description?: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  };
  /** Optional secondary action */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  /** Custom className for container */
  className?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Generic empty state component
 *
 * Displays a centered message with icon when there's no data to show.
 * Supports optional action buttons for creating or loading content.
 *
 * @example
 * <EmptyState
 *   icon={Inbox}
 *   title="No messages"
 *   description="You don't have any messages yet"
 *   action={{
 *     label: "Send message",
 *     onClick: () => openComposer()
 *   }}
 * />
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  className,
  size = 'md'}: EmptyStateProps) {
  const sizeStyles = {
    sm: {
      container: 'py-6',
      icon: 'h-6 w-6',
      title: 'text-sm',
      description: 'text-xs'},
    md: {
      container: 'py-8',
      icon: 'h-8 w-8',
      title: 'text-sm',
      description: 'text-xs'},
    lg: {
      container: 'py-12',
      icon: 'h-12 w-12',
      title: 'text-base',
      description: 'text-sm'}};

  const styles = sizeStyles[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        styles.container,
        className
      )}
    >
      <Icon className={cn(styles.icon, 'text-muted-foreground mb-2')} />

      <div className={cn(styles.title, 'text-muted-foreground font-medium')}>
        {title}
      </div>

      {description && (
        <div className={cn(styles.description, 'text-muted-foreground mt-1')}>
          {description}
        </div>
      )}

      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-4">
          {action && (
            <Button
              onClick={action.onClick}
              variant={action.variant || 'default'}
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="outline"
              size={size === 'sm' ? 'sm' : 'default'}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
