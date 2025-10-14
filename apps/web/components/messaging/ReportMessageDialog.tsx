'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';
import { useFeedback } from '@/components/feedback/FeedbackContext';

interface ReportMessageDialogProps {
  isOpen: boolean;
  onClose: () => void;
  messageId: string;
  messageContent: string;
  senderName?: string;
}

interface ReportFormData {
  reason: 'spam' | 'inappropriate' | 'harassment' | 'scam' | 'other';
  description: string;
}

const REPORT_REASONS = [
  {
    value: 'spam' as const,
    label: 'Spam',
    description: 'Unwanted promotional content or repetitive messages'
  },
  {
    value: 'inappropriate' as const,
    label: 'Inappropriate Content',
    description: 'Content that violates community guidelines'
  },
  {
    value: 'harassment' as const,
    label: 'Harassment',
    description: 'Threatening, abusive, or bullying behavior'
  },
  {
    value: 'scam' as const,
    label: 'Scam/Fraud',
    description: 'Suspicious or fraudulent activity'
  },
  {
    value: 'other' as const,
    label: 'Other',
    description: 'Other violations not listed above'
  }
];

export function ReportMessageDialog({
  isOpen,
  onClose,
  messageId,
  messageContent,
  senderName
}: ReportMessageDialogProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    reason: 'spam',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showFeedback } = useFeedback();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      setError('Please provide a description of the issue');
      return;
    }

    if (formData.description.length < 10) {
      setError('Description must be at least 10 characters long');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/messages/${messageId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: formData.reason,
          description: formData.description.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      
      setIsSubmitted(true);
      showFeedback({
        type: 'success',
        title: "Report Submitted",
        message: "Thank you for your report. We'll review it and take appropriate action.",
        duration: 5000,
      });

      // Auto-close after showing success
      setTimeout(() => {
        handleClose();
      }, 3000);

    } catch (error) {
      console.error('Failed to submit report:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit report';
      setError(errorMessage);
      
      showFeedback({
        type: 'error',
        title: "Report Failed",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({ reason: 'spam', description: '' });
      setError(null);
      setIsSubmitted(false);
      onClose();
    }
  };

  const handleReasonChange = (value: string) => {
    setFormData(prev => ({ ...prev, reason: value as ReportFormData['reason'] }));
    setError(null);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, description: value }));
    setError(null);
  };

  if (isSubmitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[425px]">
          <div className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-primary-500 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Report Submitted</h3>
            <p className="text-sm text-muted-foreground text-center mb-4">
              Thank you for helping keep our community safe. We'll review your report and take appropriate action.
            </p>
            <Button onClick={handleClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-primary-500" />
            Report Message
          </DialogTitle>
          <DialogDescription>
            Help us keep the community safe by reporting inappropriate content.
          </DialogDescription>
        </DialogHeader>

        {/* Message Preview */}
        <div className="bg-muted rounded-lg p-3 mb-4">
          <div className="text-xs text-muted-foreground mb-1">
            Message from {senderName || 'User'}:
          </div>
          <div className="text-sm bg-background rounded p-2 border">
            {messageContent.length > 100 
              ? `${messageContent.substring(0, 100)}...` 
              : messageContent
            }
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason Selection */}
          <div className="space-y-3">
            <Label htmlFor="reason">Why are you reporting this message?</Label>
            <RadioGroup
              value={formData.reason}
              onValueChange={handleReasonChange}
              className="space-y-2"
            >
              {REPORT_REASONS.map((reason) => (
                <div key={reason.value} className="flex items-start space-x-2">
                  <RadioGroupItem value={reason.value} id={reason.value} className="mt-0.5" />
                  <div className="space-y-1">
                    <Label htmlFor={reason.value} className="text-sm font-medium">
                      {reason.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {reason.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              Additional details <span className="text-destructive-500">*</span>
            </Label>
            <Textarea
              id="description"
              placeholder="Please provide more details about the issue. What specifically violates our community guidelines?"
              value={formData.description}
              onChange={handleDescriptionChange}
              rows={4}
              maxLength={1000}
              className="resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Minimum 10 characters required</span>
              <span>{formData.description.length}/1000</span>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.description.trim() || formData.description.length < 10}
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </form>

        {/* Privacy Notice */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Privacy Notice:</strong> This report will be reviewed by our moderation team. 
            The reported user will not be notified of your report. False reporting may result in 
            action against your account.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}