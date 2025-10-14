'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Copy,
  Check,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Share2
} from 'lucide-react';
import { toast } from 'sonner';

interface ShareProjectModalProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  projectDescription?: string;
}

export function ShareProjectModal({
  open,
  onClose,
  projectId,
  projectTitle,
  projectDescription
}: ShareProjectModalProps) {
  const [copied, setCopied] = useState(false);

  const projectUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/collaborate/projects/${projectId}`
    : '';

  const encodedTitle = encodeURIComponent(projectTitle);
  const encodedUrl = encodeURIComponent(projectUrl);
  const encodedDescription = encodeURIComponent(
    projectDescription || `Check out this collaboration project: ${projectTitle}`
  );

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(projectUrl);
      setCopied(true);
      toast.success('Link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy link');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: projectTitle,
          text: projectDescription || `Check out this collaboration project: ${projectTitle}`,
          url: projectUrl
        });
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      toast.error('Sharing not supported on this device');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Project</DialogTitle>
          <DialogDescription>
            Share "{projectTitle}" with your network
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Copy Link */}
          <div className="space-y-2">
            <Label htmlFor="project-url">Project Link</Label>
            <div className="flex space-x-2">
              <Input
                id="project-url"
                value={projectUrl}
                readOnly
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-primary-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3">
            <Label>Share on Social Media</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a
                  href={shareLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Twitter className="h-4 w-4 mr-2" />
                  Twitter
                </a>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a
                  href={shareLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Linkedin className="h-4 w-4 mr-2" />
                  LinkedIn
                </a>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a
                  href={shareLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Facebook className="h-4 w-4 mr-2" />
                  Facebook
                </a>
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <a href={shareLinks.email}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>
              </Button>
            </div>
          </div>

          {/* Native Share (Mobile) */}
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Button
              variant="outline"
              className="w-full"
              onClick={handleNativeShare}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share via...
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
