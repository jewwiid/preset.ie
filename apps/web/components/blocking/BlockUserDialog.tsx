'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useUserBlockingApi, BlockReason, UserBlockingApi } from '@/lib/api/user-blocking';
import { AlertTriangle, Shield } from 'lucide-react';

interface BlockUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    id: string;
    displayName?: string;
    handle?: string;
    avatarUrl?: string;
  };
  onBlockSuccess?: (blockId: string) => void;
}

export function BlockUserDialog({ isOpen, onClose, targetUser, onBlockSuccess }: BlockUserDialogProps) {
  const [selectedReason, setSelectedReason] = useState<BlockReason | ''>('');
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userBlockingApi = useUserBlockingApi();
  const blockReasons = UserBlockingApi.getBlockReasons();

  const handleBlock = async () => {
    if (!selectedReason) {
      setError('Please select a reason for blocking');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await userBlockingApi.blockUser({
        blockedUserId: targetUser.id,
        reason: selectedReason as BlockReason,
        details: details.trim() || undefined
      });

      if (response.success) {
        onBlockSuccess?.(response.data.blockId);
        onClose();
        // Reset form
        setSelectedReason('');
        setDetails('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to block user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
      setError(null);
      setSelectedReason('');
      setDetails('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-destructive-500" />
            Block User
          </DialogTitle>
          <DialogDescription>
            You're about to block{' '}
            <span className="font-semibold">
              {targetUser.displayName || targetUser.handle || 'this user'}
            </span>
            . This will prevent all communication between you and this user.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Blocking prevents this user from messaging you and vice versa. You can unblock them later from your settings.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason for blocking *</Label>
            <Select value={selectedReason} onValueChange={(value) => setSelectedReason(value as BlockReason)}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {blockReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Additional details (optional)</Label>
            <Textarea
              id="details"
              placeholder="Provide more context about why you're blocking this user..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={3}
              maxLength={500}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {details.length}/500 characters
            </p>
          </div>

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
            variant="destructive" 
            onClick={handleBlock} 
            disabled={isLoading || !selectedReason}
          >
            {isLoading ? 'Blocking...' : 'Block User'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}