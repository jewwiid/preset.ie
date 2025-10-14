'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Mail, AlertCircle } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [unsubscribed, setUnsubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [preferences, setPreferences] = useState({
    gig: true,
    application: true,
    message: true,
    booking: true,
    system: true,
    marketing: true});

  const email = searchParams.get('email');
  const userId = searchParams.get('userId');

  const handleUnsubscribeAll = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email-preferences/unsubscribe-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId })});

      if (!response.ok) {
        throw new Error('Failed to unsubscribe');
      }

      setUnsubscribed(true);
    } catch (err) {
      setError('Failed to unsubscribe. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePreferences = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/email-preferences/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, userId, preferences })});

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setUnsubscribed(true);
    } catch (err) {
      setError('Failed to update preferences. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!email && !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <CardTitle>Invalid Link</CardTitle>
            </div>
            <CardDescription>
              This unsubscribe link is invalid or expired. Please use the link from your email.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (unsubscribed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <CardTitle>Preferences Updated</CardTitle>
            </div>
            <CardDescription>
              Your email preferences have been updated successfully.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              You can update your preferences anytime in your account settings.
            </p>
            <Button asChild className="w-full">
              <a href="/">Return to Preset</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-6 w-6 text-primary" />
            <CardTitle>Email Preferences</CardTitle>
          </div>
          <CardDescription>
            Manage which emails you receive from Preset
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Email: <span className="font-medium text-foreground">{email}</span>
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-foreground">Choose which emails to receive:</h3>
            
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="gig"
                  checked={preferences.gig}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, gig: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="gig" className="font-medium cursor-pointer">
                    Gig Notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    New gigs published, deadline reminders, gig updates
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="application"
                  checked={preferences.application}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, application: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="application" className="font-medium cursor-pointer">
                    Application Updates
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Application status changes, shortlists, booking confirmations
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="message"
                  checked={preferences.message}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, message: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="message" className="font-medium cursor-pointer">
                    Messages
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    New messages, message replies, unread digests
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="booking"
                  checked={preferences.booking}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, booking: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="booking" className="font-medium cursor-pointer">
                    Booking & Collaboration
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Shoot reminders, showcase approvals, reviews
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <Checkbox
                  id="system"
                  checked={preferences.system}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, system: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="system" className="font-medium cursor-pointer">
                    Account & System
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Subscription updates, credits, security alerts, important announcements
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-3 border-t pt-3">
                <Checkbox
                  id="marketing"
                  checked={preferences.marketing}
                  onCheckedChange={(checked) => 
                    setPreferences(prev => ({ ...prev, marketing: checked as boolean }))
                  }
                />
                <div className="space-y-1">
                  <Label htmlFor="marketing" className="font-medium cursor-pointer">
                    Marketing & Tips
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly tips, feature announcements, success stories, promotions
                  </p>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={handleUpdatePreferences}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Updating...' : 'Update Preferences'}
            </Button>
            <Button
              variant="outline"
              onClick={handleUnsubscribeAll}
              disabled={loading}
            >
              Unsubscribe from All
            </Button>
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Note: You will continue to receive important transactional emails (password resets, booking confirmations, etc.) even if you unsubscribe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}

