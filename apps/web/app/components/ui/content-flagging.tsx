import React, { useState } from 'react';
import { Flag, AlertTriangle, Shield, Eye, EyeOff, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';

export type ContentType = 'playground_gallery' | 'media' | 'enhancement_tasks' | 'user_type' | 'suggested_type';
export type FlagType = 'nsfw' | 'inappropriate' | 'spam' | 'copyright' | 'violence' | 'hate_speech' | 'other';

interface ContentFlaggingProps {
  contentId: string;
  contentType: ContentType;
  isOwner?: boolean;
  isNsfw?: boolean;
  isFlagged?: boolean;
  moderationStatus?: 'pending' | 'approved' | 'rejected' | 'flagged';
  onNsfwToggle?: (isNsfw: boolean) => void;
  className?: string;
}

const FLAG_TYPES: { value: FlagType; label: string; description: string }[] = [
  { value: 'nsfw', label: 'NSFW Content', description: 'Sexual, explicit, or adult content' },
  { value: 'inappropriate', label: 'Inappropriate', description: 'Content that violates community guidelines' },
  { value: 'spam', label: 'Spam', description: 'Repetitive, irrelevant, or promotional content' },
  { value: 'copyright', label: 'Copyright Violation', description: 'Unauthorized use of copyrighted material' },
  { value: 'violence', label: 'Violence', description: 'Graphic violence or disturbing content' },
  { value: 'hate_speech', label: 'Hate Speech', description: 'Content that promotes hatred or discrimination' },
  { value: 'other', label: 'Other', description: 'Other violations not covered above' },
];

export const ContentFlagging: React.FC<ContentFlaggingProps> = ({
  contentId,
  contentType,
  isOwner = false,
  isNsfw = false,
  isFlagged = false,
  moderationStatus = 'pending',
  onNsfwToggle,
  className = ''}) => {
  const { session } = useAuth();
  const [isFlagDialogOpen, setIsFlagDialogOpen] = useState(false);
  const [isNsfwDialogOpen, setIsNsfwDialogOpen] = useState(false);
  const [flagType, setFlagType] = useState<FlagType>('other');
  const [flagReason, setFlagReason] = useState('');
  const [flagDescription, setFlagDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFlagContent = async () => {
    if (!session?.access_token) {
      toast.error('You must be logged in to flag content.');
      return;
    }

    if (!flagReason.trim()) {
      toast.error('Please provide a reason for flagging this content.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/content/flag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`},
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          flag_type: flagType,
          reason: flagReason,
          description: flagDescription || undefined})});

      if (response.ok) {
        toast.success('Content flagged successfully. Thank you for helping keep our community safe!');
        setIsFlagDialogOpen(false);
        setFlagReason('');
        setFlagDescription('');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to flag content.');
      }
    } catch (error) {
      console.error('Error flagging content:', error);
      toast.error('Failed to flag content. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkNsfw = async (isNsfw: boolean) => {
    if (!session?.access_token) {
      toast.error('You must be logged in to mark content as NSFW.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/content/mark-nsfw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`},
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          is_nsfw: isNsfw})});

      if (response.ok) {
        toast.success(isNsfw ? 'Content marked as NSFW' : 'Content unmarked as NSFW');
        onNsfwToggle?.(isNsfw);
        setIsNsfwDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to update NSFW status.');
      }
    } catch (error) {
      console.error('Error marking content as NSFW:', error);
      toast.error('Failed to update NSFW status. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = () => {
    if (isNsfw) {
      return <Badge variant="destructive" className="flex items-center gap-1"><Shield className="h-3 w-3" />NSFW</Badge>;
    }
    if (isFlagged) {
      return <Badge variant="outline" className="flex items-center gap-1 border-yellow-500 text-yellow-600"><Flag className="h-3 w-3" />Flagged</Badge>;
    }
    if (moderationStatus === 'approved') {
      return <Badge variant="secondary" className="flex items-center gap-1 bg-primary-100 text-primary-700"><Eye className="h-3 w-3" />Approved</Badge>;
    }
    if (moderationStatus === 'rejected') {
      return <Badge variant="destructive" className="flex items-center gap-1"><EyeOff className="h-3 w-3" />Rejected</Badge>;
    }
    return null;
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Badge */}
      {getStatusBadge()}

      {/* Owner Actions */}
      {isOwner && (
        <Dialog open={isNsfwDialogOpen} onOpenChange={setIsNsfwDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant={isNsfw ? "destructive" : "outline"}
              size="sm"
              className="flex items-center gap-1"
            >
              {isNsfw ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              {isNsfw ? 'Mark Safe' : 'Mark NSFW'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                {isNsfw ? 'Mark Content as Safe' : 'Mark Content as NSFW'}
              </DialogTitle>
              <DialogDescription>
                {isNsfw 
                  ? 'Are you sure you want to mark this content as safe for all audiences?'
                  : 'Are you sure you want to mark this content as NSFW? This will flag it for moderation review.'
                }
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsNsfwDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={isNsfw ? "default" : "destructive"}
                onClick={() => handleMarkNsfw(!isNsfw)}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : (isNsfw ? 'Mark as Safe' : 'Mark as NSFW')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Flag Content Button */}
      <Dialog open={isFlagDialogOpen} onOpenChange={setIsFlagDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Flag className="h-3 w-3" />
            Flag
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Flag Content
            </DialogTitle>
            <DialogDescription>
              Help us keep the community safe by reporting inappropriate content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="flag-type">Type of Issue</Label>
              <Select value={flagType} onValueChange={(value: FlagType) => setFlagType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select issue type" />
                </SelectTrigger>
                <SelectContent>
                  {FLAG_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="flag-reason">Reason *</Label>
              <Textarea
                id="flag-reason"
                placeholder="Please describe why you're flagging this content..."
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {flagReason.length}/500 characters
              </div>
            </div>

            <div>
              <Label htmlFor="flag-description">Additional Details (Optional)</Label>
              <Textarea
                id="flag-description"
                placeholder="Any additional context or details..."
                value={flagDescription}
                onChange={(e) => setFlagDescription(e.target.value)}
                maxLength={1000}
                rows={2}
              />
              <div className="text-xs text-muted-foreground mt-1">
                {flagDescription.length}/1000 characters
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFlagDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleFlagContent}
              disabled={isSubmitting || !flagReason.trim()}
              className="flex items-center gap-1"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Flag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Info Button */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-1">
            <Info className="h-3 w-3" />
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Content Moderation Info</DialogTitle>
            <DialogDescription>
              Information about this content's moderation status and community guidelines.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <div className="mt-1">{getStatusBadge()}</div>
              </div>
              <div>
                <Label className="text-sm font-medium">Content Type</Label>
                <div className="mt-1 text-sm text-muted-foreground capitalize">
                  {contentType.replace('_', ' ')}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Community Guidelines</Label>
              <div className="mt-2 text-sm text-muted-foreground space-y-1">
                <p>• No NSFW or explicit content</p>
                <p>• No spam or promotional content</p>
                <p>• No copyright violations</p>
                <p>• No hate speech or discrimination</p>
                <p>• No violence or disturbing content</p>
              </div>
            </div>

            {isOwner && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Owner Actions</Label>
                <div className="mt-1 text-sm text-muted-foreground">
                  As the owner of this content, you can mark it as NSFW or safe for all audiences.
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
