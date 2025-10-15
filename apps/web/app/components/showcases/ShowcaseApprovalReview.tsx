'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Check, X, Eye, Clock, User, Calendar } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '../../../lib/auth-context';
import { useToast } from '../../../components/ui/toast';

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
  total_talents?: number;
  approved_talents?: number;
  change_requests?: number;
  media: Array<{
    id: string;
    url: string;
    exif_json: any;
  }>;
}

interface ApprovalData {
  id: string;
  talent_user_id: string;
  action: 'pending' | 'approve' | 'request_changes';
  note?: string;
  approved_at?: string;
  talent: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
}

export function ShowcaseApprovalReview({ 
  showcaseId, 
  onApproved, 
  onChangesRequested 
}: ShowcaseApprovalReviewProps) {
  const { user, session } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [showcase, setShowcase] = useState<ShowcaseData | null>(null);
  const [approvals, setApprovals] = useState<ApprovalData[]>([]);
  const [currentUserApproval, setCurrentUserApproval] = useState<ApprovalData | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isApproving, setIsApproving] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [showChangesDialog, setShowChangesDialog] = useState(false);

  useEffect(() => {
    fetchShowcase();
    fetchApprovals();
  }, [showcaseId]);

  const fetchApprovals = async () => {
    try {
      const response = await fetch(`/api/showcases/${showcaseId}/approvals`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch approvals');
      }

      const data = await response.json();
      setApprovals(data.approvals || []);
      
      // Find current user's approval
      const userApproval = data.approvals?.find((approval: ApprovalData) => 
        approval.talent_user_id === user?.id
      );
      setCurrentUserApproval(userApproval || null);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      // Don't show error for approvals as it's not critical
    }
  };

  const fetchShowcase = async () => {
    try {
      const response = await fetch(`/api/showcases/${showcaseId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch showcase');
      }

      const data = await response.json();
      setShowcase(data.showcase);
    } catch (error) {
      console.error('Error fetching showcase:', error);
      showError('Failed to load showcase');
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
          'Authorization': `Bearer ${session?.access_token}`
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

      showSuccess(result.message || 'Approval recorded!');
      setShowApprovalDialog(false);
      fetchApprovals(); // Refresh approval status
      onApproved?.();
      
    } catch (error) {
      console.error('Approve error:', error);
      showError('Failed to approve showcase');
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!feedback.trim()) {
      showError('Please provide feedback for requested changes');
      return;
    }

    setIsRequestingChanges(true);
    
    try {
      const response = await fetch(`/api/showcases/${showcaseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
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

      showSuccess(result.message || 'Changes requested from creator');
      setShowChangesDialog(false);
      fetchApprovals(); // Refresh approval status
      onChangesRequested?.();
      
    } catch (error) {
      console.error('Request changes error:', error);
      showError('Failed to request changes');
    } finally {
      setIsRequestingChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading showcase...</p>
        </div>
      </div>
    );
  }

  if (!showcase) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Showcase not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">
          Review Showcase: "{showcase.title}"
        </h2>
        <p className="text-muted-foreground">
          From gig: "{showcase.gig_title}"
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <User className="w-4 h-4" />
          <span>Created by @{showcase.creator_handle} ({showcase.creator_name})</span>
        </div>
      </div>

      {/* Status Badge */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">
              Pending Your Approval
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Talent Approval Status */}
      {approvals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Approval Status</CardTitle>
            <CardDescription>
              {showcase.total_talents && showcase.total_talents > 1 
                ? `All ${showcase.total_talents} talents must approve before showcase goes live`
                : 'Talent approval required before showcase goes live'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvals.map((approval) => (
                <div key={approval.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={approval.talent.avatar_url} />
                    <AvatarFallback>
                      {approval.talent.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{approval.talent.display_name}</p>
                    <p className="text-sm text-muted-foreground">@{approval.talent.handle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {approval.action === 'approve' && (
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="w-3 h-3 mr-1" />
                        Approved
                      </Badge>
                    )}
                    {approval.action === 'request_changes' && (
                      <Badge className="bg-orange-100 text-orange-800">
                        <X className="w-3 h-3 mr-1" />
                        Changes Requested
                      </Badge>
                    )}
                    {approval.action === 'pending' && (
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        Pending
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Summary */}
              {showcase.total_talents && showcase.total_talents > 1 && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span>Progress:</span>
                    <span className="font-semibold">
                      {showcase.approved_talents || 0}/{showcase.total_talents} approved
                    </span>
                  </div>
                  {showcase.change_requests && showcase.change_requests > 0 && (
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span className="text-orange-600">Change requests:</span>
                      <span className="font-semibold text-orange-600">
                        {showcase.change_requests}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Description */}
      {showcase.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm">{showcase.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Tags */}
      {showcase.tags.length > 0 && (
        <div className="space-y-2">
          <Label className="text-base font-semibold">Tags:</Label>
          <div className="flex flex-wrap gap-2">
            {showcase.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Media Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">
          Photos ({showcase.media.length}):
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {showcase.media.map((media) => (
            <Card key={media.id} className="overflow-hidden">
              <div className="aspect-square">
                <img
                  src={media.url}
                  alt="Showcase photo"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-2">
                <p className="text-xs text-muted-foreground text-center">
                  Custom Photo
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Previous Feedback */}
      {showcase.approval_notes && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-yellow-800">
                Previous Feedback:
              </h4>
              <p className="text-sm text-yellow-700">
                {showcase.approval_notes}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Input */}
      <div className="space-y-2">
        <Label htmlFor="feedback" className="text-base font-semibold">
          Your Feedback (Optional):
        </Label>
        <Textarea
          id="feedback"
          placeholder="Add any comments or feedback for the creator..."
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          rows={4}
        />
      </div>

      {/* Action Buttons - Only show if current user hasn't approved yet */}
      {currentUserApproval?.action === 'pending' && (
        <div className="flex justify-center gap-4">
          <Button
            variant="destructive"
            onClick={() => setShowChangesDialog(true)}
            disabled={isRequestingChanges}
          >
            <X className="w-4 h-4 mr-2" />
            Request Changes
          </Button>
          
          <Button
            onClick={() => setShowApprovalDialog(true)}
            disabled={isApproving}
          >
            <Check className="w-4 h-4 mr-2" />
            Approve & Publish
          </Button>
        </div>
      )}

      {/* Show current user's approval status if they've already acted */}
      {currentUserApproval && currentUserApproval.action !== 'pending' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {currentUserApproval.action === 'approve' ? (
                <>
                  <Check className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-semibold text-green-800">
                    You have approved this showcase
                  </span>
                </>
              ) : (
                <>
                  <X className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-semibold text-orange-800">
                    You have requested changes
                  </span>
                </>
              )}
            </div>
            {currentUserApproval.note && (
              <p className="text-sm text-muted-foreground mt-2">
                Your note: "{currentUserApproval.note}"
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={showApprovalDialog} onOpenChange={setShowApprovalDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Showcase?</AlertDialogTitle>
            <AlertDialogDescription>
              {showcase.total_talents && showcase.total_talents > 1 
                ? `This will record your approval. The showcase will go live once all ${showcase.total_talents} talents approve.`
                : 'This will publish the showcase and make it visible to everyone. The creator will be notified of your approval.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isApproving ? 'Approving...' : 'Approve'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Changes Request Dialog */}
      <AlertDialog open={showChangesDialog} onOpenChange={setShowChangesDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              {showcase.total_talents && showcase.total_talents > 1 
                ? `This will block the showcase from going live until the creator addresses your feedback. All talents must approve for the showcase to be published.`
                : 'The creator will be notified and can make changes before resubmitting for approval.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRequestChanges}
              disabled={isRequestingChanges || !feedback.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isRequestingChanges ? 'Sending...' : 'Request Changes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
