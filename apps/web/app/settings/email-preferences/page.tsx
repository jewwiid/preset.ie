'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { useFeedback } from '@/components/feedback/FeedbackContext';
import { Mail, Bell, MessageSquare, Calendar, Shield, TrendingUp } from 'lucide-react';

export default function EmailPreferencesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { showFeedback } = useFeedback();
  const [saving, setSaving] = useState(false);

  const [preferences, setPreferences] = useState({
    email_enabled: true,
    gig_notifications: true,
    application_notifications: true,
    message_notifications: true,
    booking_notifications: true,
    system_notifications: true,
    marketing_notifications: false,
    digest_frequency: 'real-time' as 'real-time' | 'hourly' | 'daily' | 'weekly',
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    if (!user || !supabase) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching preferences:', error);
        return;
      }

      if (data) {
        setPreferences({
          email_enabled: data.email_enabled ?? true,
          gig_notifications: data.gig_notifications ?? true,
          application_notifications: data.application_notifications ?? true,
          message_notifications: data.message_notifications ?? true,
          booking_notifications: data.booking_notifications ?? true,
          system_notifications: data.system_notifications ?? true,
          marketing_notifications: data.marketing_notifications ?? false,
          digest_frequency: data.digest_frequency ?? 'real-time',
        });
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const savePreferences = async () => {
    if (!user || !supabase) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user.id,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) {
        console.error('Error saving preferences:', error);
        showFeedback({
          type: 'error',
          title: 'Error',
          message: 'Failed to save preferences'
        });
      } else {
        showFeedback({
          type: 'success',
          title: 'Success',
          message: 'Email preferences updated successfully'
        });
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      showFeedback({
        type: 'error',
        title: 'Error',
        message: 'Failed to save preferences'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Email Preferences</h1>
        <p className="text-muted-foreground mt-2">
          Control which emails you receive from Preset. You can always update these preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Master Email Control */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Master control for all email notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="email-enabled" className="text-base font-semibold">
                  Enable Email Notifications
                </Label>
                <p className="text-sm text-muted-foreground">
                  Turn off to stop receiving all emails (except critical account security emails)
                </p>
              </div>
              <Switch
                id="email-enabled"
                checked={preferences.email_enabled}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, email_enabled: checked }))
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Category Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Email Categories</CardTitle>
            <CardDescription>
              Choose which types of emails you want to receive
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Bell className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-0.5">
                  <Label className="text-base">Gig Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    New gigs, deadline reminders, application alerts
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.gig_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, gig_notifications: checked }))
                }
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-0.5">
                  <Label className="text-base">Application Updates</Label>
                  <p className="text-sm text-muted-foreground">
                    Application status, shortlists, booking confirmations
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.application_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, application_notifications: checked }))
                }
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <MessageSquare className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-0.5">
                  <Label className="text-base">Messages</Label>
                  <p className="text-sm text-muted-foreground">
                    New messages, replies, unread digests
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.message_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, message_notifications: checked }))
                }
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Calendar className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-0.5">
                  <Label className="text-base">Booking & Collaboration</Label>
                  <p className="text-sm text-muted-foreground">
                    Shoot reminders, showcase approvals, reviews
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.booking_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, booking_notifications: checked }))
                }
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-0.5">
                  <Label className="text-base">Account & System</Label>
                  <p className="text-sm text-muted-foreground">
                    Subscription, credits, security, important updates
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.system_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, system_notifications: checked }))
                }
                disabled={!preferences.email_enabled}
              />
            </div>

            <div className="flex items-start justify-between border-t pt-6">
              <div className="flex gap-3">
                <TrendingUp className="h-5 w-5 text-primary mt-0.5" />
                <div className="space-y-0.5">
                  <Label className="text-base">Marketing & Tips</Label>
                  <p className="text-sm text-muted-foreground">
                    Weekly tips, feature updates, success stories
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.marketing_notifications}
                onCheckedChange={(checked) => 
                  setPreferences(prev => ({ ...prev, marketing_notifications: checked }))
                }
                disabled={!preferences.email_enabled}
              />
            </div>
          </CardContent>
        </Card>

        {/* Digest Frequency */}
        <Card>
          <CardHeader>
            <CardTitle>Email Frequency</CardTitle>
            <CardDescription>
              Choose how often you want to receive email notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Email Digest Frequency</Label>
                <Select
                  value={preferences.digest_frequency}
                  onValueChange={(value: any) => 
                    setPreferences(prev => ({ ...prev, digest_frequency: value }))
                  }
                  disabled={!preferences.email_enabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real-time">Real-time - As they happen</SelectItem>
                    <SelectItem value="hourly">Hourly - Batched every hour</SelectItem>
                    <SelectItem value="daily">Daily - Once per day at 9 AM</SelectItem>
                    <SelectItem value="weekly">Weekly - Monday mornings</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Important notifications like bookings are always sent immediately
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            onClick={savePreferences}
            disabled={saving}
            size="lg"
            className="flex-1"
          >
            {saving ? 'Saving...' : 'Save Email Preferences'}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/settings')}
            size="lg"
          >
            Back to Settings
          </Button>
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Note:</strong> You will continue to receive critical transactional emails (password resets, booking confirmations, security alerts) even if you disable notifications. This ensures important account information always reaches you.
          </p>
        </div>
      </div>
    </div>
  );
}

