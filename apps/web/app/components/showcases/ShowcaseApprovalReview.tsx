'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Check, X, Eye, Clock } from 'lucide-react';
import { useAuth } from '../../../lib/auth-context';
import { toast } from 'sonner';

interface ShowcaseApprovalReviewProps {
  showcaseId: string;
  onApproved?: () => void;
  onChangesRequested?: () => void;
}

interface ShowcaseData {
  id: string;
  title: string;
  description: string;
  tags: string[];
  gig_id: string;
  gig_title: string;
  creator_user_id: string;
  creator_name: string;
  creator_handle: string;
  approval_status: string;
  approval_notes?: string;
  media: Array<{
    id: string;
    url: string;
    exif_json: any;
  }>;
}

export function ShowcaseApprovalReview({ 
  showcaseId, 
  onApproved, 
  onChangesRequested 
}: ShowcaseApprovalReviewProps) {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [showcase, setShowcase] = useState<ShowcaseData | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);

  useEffect(() => {
    fetchShowcase();
  }, [showcaseId]);

  const fetchShowcase = async () => {
    try {
      const response = await fetch(`/api/showcases/${showcaseId}`, {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch showcase');
      }

      const data = await response.json();
      setShowcase(data.showcase);
    } catch (error) {
      console.error('Error fetching showcase:', error);
      showToast('Failed to load showcase', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    
    try {
      const response = await fetch(`/api/showcases/${showcaseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          action: 'approve',
          note: feedback.trim() || undefined
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to approve showcase');
      }

      showToast('Showcase approved and published!', 'success');
      setShowApprovalDialog(false);
      onApproved?.();
      
    } catch (error) {
      console.error('Approve error:', error);
      showToast('Failed to approve showcase', 'error');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      showToast('Please provide feedback for requested changes', 'error');
      return;
    }

    setIsRequestingChanges(true);
    
    try {
      const response = await fetch(`/api/showcases/${showcaseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          action: 'request_changes',
          note: feedback.trim()
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to request changes');
      }

      showToast('Changes requested from creator', 'success');
      setShowChangesDialog(false);
      onChangesRequested?.();
      
    } catch (error) {
      console.error('Request changes error:', error);
      showToast('Failed to request changes', 'error');
    } finally {
      setIsRequestingChanges(false);
    }
  };

  if (isLoading) {
    return (
      <YStack alignItems="center" justifyContent="center" padding="$6">
        <Text>Loading showcase...</Text>
      </YStack>
    );
  }

  if (!showcase) {
    return (
      <YStack alignItems="center" justifyContent="center" padding="$6">
        <Text>Showcase not found</Text>
      </YStack>
    );
  }

  return (
    <YStack space="$4" padding="$4" maxWidth={800} margin="0 auto">
      {/* Header */}
      <YStack space="$2">
        <Text fontSize="$6" fontWeight="bold">
          Review Showcase: "{showcase.title}"
        </Text>
        <Text fontSize="$4" color="$gray10">
          From gig: "{showcase.gig_title}"
        </Text>
        <Text fontSize="$3" color="$gray9">
          Created by @{showcase.creator_handle} ({showcase.creator_name})
        </Text>
      </YStack>

      {/* Status Badge */}
      <Card padding="$3" backgroundColor="$blue3">
        <XStack alignItems="center" space="$2">
          <Clock size={16} color="$blue10" />
          <Text fontSize="$3" color="$blue10" fontWeight="600">
            Pending Your Approval
          </Text>
        </XStack>
      </Card>

      {/* Description */}
      {showcase.description && (
        <Card padding="$4">
          <Text fontSize="$4">{showcase.description}</Text>
        </Card>
      )}

      {/* Tags */}
      {showcase.tags.length > 0 && (
        <YStack space="$2">
          <Text fontSize="$4" fontWeight="600">Tags:</Text>
          <XStack flexWrap="wrap" gap="$2">
            {showcase.tags.map((tag) => (
              <Card key={tag} padding="$2" backgroundColor="$gray3">
                <Text fontSize="$3">#{tag}</Text>
              </Card>
            ))}
          </XStack>
        </YStack>
      )}

      {/* Media Grid */}
      <YStack space="$3">
        <Text fontSize="$4" fontWeight="600">
          Photos ({showcase.media.length}):
        </Text>
        <XStack flexWrap="wrap" gap="$2">
          {showcase.media.map((media) => (
            <Card key={media.id} padding="$2">
              <Image
                src={media.url}
                width={150}
                height={150}
                borderRadius="$2"
                objectFit="cover"
              />
              <Text fontSize="$2" color="$gray9" marginTop="$1">
                Custom Photo
              </Text>
            </Card>
          ))}
        </XStack>
      </YStack>

      {/* Previous Feedback */}
      {showcase.approval_notes && (
        <Card padding="$4" backgroundColor="$yellow3">
          <YStack space="$2">
            <Text fontSize="$4" fontWeight="600" color="$yellow10">
              Previous Feedback:
            </Text>
            <Text fontSize="$3" color="$yellow10">
              {showcase.approval_notes}
            </Text>
          </YStack>
        </Card>
      )}

      {/* Feedback Input */}
      <YStack space="$2">
        <Text fontSize="$4" fontWeight="600">
          Your Feedback (Optional):
        </Text>
        <TextArea
          placeholder="Add any comments or feedback for the creator..."
          value={feedback}
          onChangeText={setFeedback}
          minHeight={100}
        />
      </YStack>

      {/* Action Buttons */}
      <XStack space="$3" justifyContent="center">
        <Button
          backgroundColor="$red9"
          color="white"
          onPress={() => setShowChangesDialog(true)}
          disabled={isRequestingChanges}
        >
          <X size={16} marginRight="$2" />
          Request Changes
        </Button>
        
        <Button
          backgroundColor="$green9"
          color="white"
          onPress={() => setShowApprovalDialog(true)}
          disabled={isApproving}
        >
          <Check size={16} marginRight="$2" />
          Approve & Publish
        </Button>
      </XStack>

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content>
            <AlertDialog.Title>Approve Showcase?</AlertDialog.Title>
            <AlertDialog.Description>
              This will publish the showcase and make it visible to everyone. The creator will be notified of your approval.
            </AlertDialog.Description>
            <XStack space="$3" justifyContent="flex-end" marginTop="$4">
              <Button variant="outlined" onPress={() => setShowApprovalDialog(false)}>
                Cancel
              </Button>
              <Button
                backgroundColor="$green9"
                color="white"
                onPress={handleApprove}
                disabled={isApproving}
              >
                {isApproving ? 'Approving...' : 'Approve'}
              </Button>
            </XStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>

      {/* Changes Request Dialog */}
      <AlertDialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <AlertDialog.Portal>
          <AlertDialog.Overlay />
          <AlertDialog.Content>
            <AlertDialog.Title>Request Changes?</AlertDialog.Title>
            <AlertDialog.Description>
              The creator will be notified and can make changes before resubmitting for approval.
            </AlertDialog.Description>
            <XStack space="$3" justifyContent="flex-end" marginTop="$4">
              <Button variant="outlined" onPress={() => setShowChangesDialog(false)}>
                Cancel
              </Button>
              <Button
                backgroundColor="$red9"
                color="white"
                onPress={handleRequestChanges}
                disabled={isRequestingChanges || !feedback.trim()}
              >
                {isRequestingChanges ? 'Sending...' : 'Request Changes'}
              </Button>
            </XStack>
          </AlertDialog.Content>
        </AlertDialog.Portal>
      </AlertDialog>
    </YStack>
  );
}
