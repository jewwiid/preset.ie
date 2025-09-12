'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useUserBlockingApi, CheckBlockStatusResponse } from '@/lib/api/user-blocking';
import { Shield, ShieldOff, MoreVertical, AlertTriangle, CheckCircle } from 'lucide-react';
import { BlockUserDialog } from './BlockUserDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface BlockUserButtonProps {
  targetUser: {
    id: string;
    displayName?: string;
    handle?: string;
    avatarUrl?: string;
  };
  variant?: 'button' | 'dropdown' | 'inline';
  size?: 'sm' | 'md' | 'lg';
  onBlockStatusChange?: (canCommunicate: boolean) => void;
  className?: string;
}

export function BlockUserButton({ 
  targetUser, 
  variant = 'dropdown',
  size = 'sm',
  onBlockStatusChange,
  className 
}: BlockUserButtonProps) {
  const [blockStatus, setBlockStatus] = useState<CheckBlockStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [isUnblocking, setIsUnblocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userBlockingApi = useUserBlockingApi();

  const fetchBlockStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userBlockingApi.checkBlockStatus(targetUser.id);
      setBlockStatus(response);
      onBlockStatusChange?.(response.data.canCommunicate);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check block status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockStatus();
  }, [targetUser.id]);

  const handleUnblock = async () => {
    if (!blockStatus?.data.youBlockedThem.isBlocked) return;

    setIsUnblocking(true);
    setError(null);

    try {
      const response = await userBlockingApi.unblockUser({
        blockedUserId: targetUser.id,
        reason: 'user_requested'
      });

      if (response.success) {
        // Refresh block status
        await fetchBlockStatus();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock user');
    } finally {
      setIsUnblocking(false);
    }
  };

  const handleBlockSuccess = () => {
    // Refresh block status after successful block
    fetchBlockStatus();
  };

  if (loading) {
    return (
      <div className={className}>
        <div className="h-8 w-8 animate-pulse bg-muted rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="w-fit">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="text-xs">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!blockStatus) return null;

  const { youBlockedThem, theyBlockedYou, mutualBlock, canCommunicate } = blockStatus.data;

  // If they blocked you, show a disabled state
  if (theyBlockedYou.isBlocked && !youBlockedThem.isBlocked) {
    return (
      <div className={className}>
        <Alert variant="destructive" className="w-fit">
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            This user has blocked you
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // If it's a mutual block
  if (mutualBlock) {
    return (
      <div className={className}>
        <Button
          variant="outline"
          size={size === 'md' ? 'default' : size}
          onClick={handleUnblock}
          disabled={isUnblocking}
          className="text-red-600 hover:text-red-700 border-red-200"
        >
          <ShieldOff className="h-3 w-3 mr-1" />
          {isUnblocking ? 'Unblocking...' : 'Mutual Block - Unblock'}
        </Button>
      </div>
    );
  }

  // Render based on variant
  if (variant === 'button') {
    if (youBlockedThem.isBlocked) {
      return (
        <div className={className}>
          <Button
            variant="outline"
            size={size === 'md' ? 'default' : size}
            onClick={handleUnblock}
            disabled={isUnblocking}
            className="text-green-600 hover:text-green-700 border-green-200"
          >
            <ShieldOff className="h-3 w-3 mr-1" />
            {isUnblocking ? 'Unblocking...' : 'Unblock User'}
          </Button>
        </div>
      );
    } else {
      return (
        <div className={className}>
          <Button
            variant="outline"
            size={size === 'md' ? 'default' : size}
            onClick={() => setShowBlockDialog(true)}
            className="text-red-600 hover:text-red-700 border-red-200"
          >
            <Shield className="h-3 w-3 mr-1" />
            Block User
          </Button>
          
          <BlockUserDialog
            isOpen={showBlockDialog}
            onClose={() => setShowBlockDialog(false)}
            targetUser={targetUser}
            onBlockSuccess={handleBlockSuccess}
          />
        </div>
      );
    }
  }

  if (variant === 'inline') {
    if (youBlockedThem.isBlocked) {
      return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
          <Shield className="h-4 w-4 text-red-500" />
          <span className="text-red-600">Blocked</span>
          <Button
            variant="link"
            size="sm"
            onClick={handleUnblock}
            disabled={isUnblocking}
            className="text-green-600 hover:text-green-700 p-0 h-auto"
          >
            {isUnblocking ? 'Unblocking...' : 'Unblock'}
          </Button>
        </div>
      );
    }
    return null; // Don't show anything in inline mode if not blocked
  }

  // Default dropdown variant
  return (
    <div className={className}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {youBlockedThem.isBlocked ? (
            <DropdownMenuItem 
              onClick={handleUnblock} 
              disabled={isUnblocking}
              className="text-green-600 focus:text-green-700"
            >
              <ShieldOff className="h-4 w-4 mr-2" />
              {isUnblocking ? 'Unblocking...' : 'Unblock User'}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem 
              onClick={() => setShowBlockDialog(true)}
              className="text-red-600 focus:text-red-700"
            >
              <Shield className="h-4 w-4 mr-2" />
              Block User
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <BlockUserDialog
        isOpen={showBlockDialog}
        onClose={() => setShowBlockDialog(false)}
        targetUser={targetUser}
        onBlockSuccess={handleBlockSuccess}
      />
    </div>
  );
}