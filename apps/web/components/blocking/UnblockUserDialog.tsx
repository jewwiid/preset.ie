'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserBlockingApi, BlockedUserDTO } from '@/lib/api/user-blocking';
import { ShieldOff, AlertTriangle, CheckCircle } from 'lucide-react';

interface UnblockUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  blockedUser: BlockedUserDTO;
  onUnblockSuccess?: () => void;
}

export function UnblockUserDialog({ isOpen, onClose, blockedUser, onUnblockSuccess }: UnblockUserDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userBlockingApi = useUserBlockingApi();

  const handleUnblock = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userBlockingApi.unblockUser({
        blockedUserId: blockedUser.blockedUserId,
        reason: 'user_requested'
      });

      if (response.success) {
        onUnblockSuccess?.();
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unblock user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError(null);
    }
  };

  const getInitials = (name?: string, handle?: string) => {
    const displayName = name || handle || 'U';
    return displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const displayName = blockedUser.blockedUserDisplayName || blockedUser.blockedUserHandle || 'Unknown User';

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldOff className="h-5 w-5 text-primary-600" />
            Unblock User
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to unblock this user? They will be able to message you again.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* User Info */}
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarImage 
                src={blockedUser.blockedUserAvatarUrl} 
                alt={displayName}
              />
              <AvatarFallback>
                {getInitials(blockedUser.blockedUserDisplayName, blockedUser.blockedUserHandle)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="font-medium">{displayName}</p>
              {blockedUser.blockedUserHandle && blockedUser.blockedUserDisplayName && (
                <p className="text-sm text-muted-foreground">@{blockedUser.blockedUserHandle}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Blocked for: {blockedUser.reasonDetails.label}
              </p>
            </div>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              After unblocking, this user will be able to send you messages and interact with your content again.
            </AlertDescription>
          </Alert>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button 
            variant="default" 
            onClick={handleUnblock} 
            disabled={isLoading}
            className="bg-primary-600 hover:bg-primary/90"
          >
            {isLoading ? 'Unblocking...' : 'Unblock User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}