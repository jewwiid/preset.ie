'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Ticket,
  Users,
  TrendingUp,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Award,
  UserCheck,
  Clock,
  Share2
} from 'lucide-react';

interface InviteStats {
  totalCodes: number;
  activeCodes: number;
  usedCodes: number;
  expiredCodes: number;
  totalReferrals: number;
  totalCreditsAwarded: number;
  pendingReferrals: number;
  totalInvitedUsers: number;
  profileCompletedCount: number;
  conversionRate: number;
}

interface InviteCode {
  code: string;
  status: 'active' | 'used' | 'expired';
  created_at: string;
  used_at?: string;
  isAdminCode?: boolean;
  expires_at?: string;
}

interface TopReferrer {
  id: string;
  displayName: string;
  totalReferrals: number;
  inviteCode: string;
  joinedAt: string;
}

interface RecentSignup {
  id: string;
  displayName: string;
  inviteCode: string;
  signedUpAt: string;
  profileCompleted: boolean;
  completedAt?: string;
}

export function InviteSystemManager() {
  const [inviteOnlyMode, setInviteOnlyMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [stats, setStats] = useState<InviteStats | null>(null);
  const [recentCodes, setRecentCodes] = useState<InviteCode[]>([]);
  const [topReferrers, setTopReferrers] = useState<TopReferrer[]>([]);
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([]);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    fetchInviteMode();
    fetchStats();
  }, []);

  const fetchInviteMode = async () => {
    try {
      const response = await fetch('/api/admin/settings/invite-mode');
      const data = await response.json();
      setInviteOnlyMode(data.enabled);
    } catch (error) {
      console.error('Error fetching invite mode:', error);
      setMessage({ type: 'error', text: 'Failed to load invite mode status' });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/invite-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentCodes(data.recentCodes || []);
        setTopReferrers(data.topReferrers || []);
        setRecentSignups(data.recentSignups || []);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const toggleInviteMode = async () => {
    setUpdating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/settings/invite-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !inviteOnlyMode })
      });

      const data = await response.json();

      if (response.ok) {
        setInviteOnlyMode(data.enabled);
        setMessage({
          type: 'success',
          text: `Invite-only mode ${data.enabled ? 'enabled' : 'disabled'} successfully`
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update invite mode' });
      }
    } catch (error) {
      console.error('Error toggling invite mode:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating invite mode' });
    } finally {
      setUpdating(false);
    }
  };

  const generateAdminCodes = async (count: number = 5) => {
    setUpdating(true);
    setMessage(null);
    try {
      const response = await fetch('/api/admin/generate-invite-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ count })
      });

      const data = await response.json();

      if (response.ok) {
        await fetchStats();
        setMessage({ type: 'success', text: `Generated ${data.count} new invite codes` });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to generate invite codes' });
      }
    } catch (error) {
      console.error('Error generating codes:', error);
      setMessage({ type: 'error', text: 'Failed to generate invite codes' });
    } finally {
      setUpdating(false);
    }
  };

  const copyCode = (code: string) => {
    const shareUrl = `${window.location.origin}/auth/signup?invite=${code}`;
    navigator.clipboard.writeText(shareUrl);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const shareCode = (code: string) => {
    const shareUrl = `${window.location.origin}/auth/signup?invite=${code}`;
    const shareText = `🎨 Join Preset - The Creative Platform

I'm inviting you to join Preset, where creatives connect, collaborate, and showcase their work.

✨ Sign up with my invite code: ${code}

🔗 ${shareUrl}

Join a growing community of designers, photographers, videographers, and creative professionals!`;

    navigator.clipboard.writeText(shareText);
    setCopiedCode(`share-${code}`);
    setTimeout(() => setCopiedCode(null), 3000);
  };

  if (loading) {
    return <div className="text-center py-8">Loading invite system...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Invite Mode Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Invite-Only Mode</CardTitle>
          <CardDescription>
            Control whether new users need an invite code to sign up
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/50">
            <div className="flex-1">
              <Label htmlFor="invite-toggle" className="text-base font-medium">
                Require invite codes for signup
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                When enabled, all new signups will require a valid invite code
              </p>
            </div>
            <Switch
              id="invite-toggle"
              checked={inviteOnlyMode}
              onCheckedChange={toggleInviteMode}
              disabled={updating}
            />
          </div>

          {message && (
            <Alert variant={message.type === 'error' ? 'destructive' : 'default'}>
              {message.type === 'success' ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Invite Codes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalCodes}</div>
                <Ticket className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {stats.activeCodes} active
                </Badge>
                <Badge variant="outline" className="text-gray-600 border-gray-600">
                  {stats.usedCodes} used
                </Badge>
                {stats.expiredCodes > 0 && (
                  <Badge variant="outline" className="text-red-600 border-red-600">
                    {stats.expiredCodes} expired
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Signups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalInvitedUsers}</div>
                <Users className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="outline" className="text-green-600 border-green-600">
                  {stats.profileCompletedCount} completed
                </Badge>
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  {stats.pendingReferrals} pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Conversion Rate
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.conversionRate}%</div>
                <TrendingUp className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Signups that completed profile
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Credits Awarded
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalCreditsAwarded}</div>
                <Award className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                From {stats.totalReferrals} successful referrals
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Admin Actions</CardTitle>
          <CardDescription>Generate new invite codes and manage the system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => generateAdminCodes(5)}
              disabled={updating}
            >
              Generate 5 Codes
            </Button>
            <Button
              onClick={() => generateAdminCodes(10)}
              disabled={updating}
              variant="outline"
            >
              Generate 10 Codes
            </Button>
            <Button
              onClick={() => generateAdminCodes(25)}
              disabled={updating}
              variant="outline"
            >
              Generate 25 Codes
            </Button>
            <Button
              onClick={fetchStats}
              disabled={updating}
              variant="outline"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tabs */}
      <Tabs defaultValue="codes" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="codes">Invite Codes</TabsTrigger>
          <TabsTrigger value="referrers">Top Referrers</TabsTrigger>
          <TabsTrigger value="signups">Recent Signups</TabsTrigger>
        </TabsList>

        {/* Invite Codes Tab */}
        <TabsContent value="codes" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Invite Codes</CardTitle>
              <CardDescription>Last 20 generated codes with full details</CardDescription>
            </CardHeader>
            <CardContent>
              {recentCodes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No invite codes generated yet. Click "Generate Codes" above to create some.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentCodes.map((code) => (
                    <div
                      key={code.code}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <code className="text-base font-mono font-bold">{code.code}</code>
                          <Badge
                            variant={
                              code.status === 'active'
                                ? 'default'
                                : code.status === 'used'
                                ? 'secondary'
                                : 'destructive'
                            }
                          >
                            {code.status}
                          </Badge>
                          {code.isAdminCode && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Created: {new Date(code.created_at).toLocaleString()}</span>
                          {code.used_at && (
                            <span className="flex items-center gap-1">
                              <UserCheck className="h-3 w-3" />
                              Used: {new Date(code.used_at).toLocaleString()}
                            </span>
                          )}
                          {code.expires_at && code.status === 'active' && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Expires: {new Date(code.expires_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      {code.status === 'active' && (
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyCode(code.code)}
                            title="Copy link"
                          >
                            {copiedCode === code.code ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => shareCode(code.code)}
                            title="Copy shareable message"
                          >
                            {copiedCode === `share-${code.code}` ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Copied!
                              </>
                            ) : (
                              <>
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Referrers Tab */}
        <TabsContent value="referrers" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Referrers</CardTitle>
              <CardDescription>Users with the most successful referrals</CardDescription>
            </CardHeader>
            <CardContent>
              {topReferrers.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No referrals yet. Users will appear here once they start inviting others.
                </p>
              ) : (
                <div className="space-y-2">
                  {topReferrers.map((referrer, index) => (
                    <div
                      key={referrer.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-semibold">{referrer.displayName}</p>
                          <p className="text-xs text-muted-foreground">
                            Code: <code className="font-mono">{referrer.inviteCode}</code>
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-primary">{referrer.totalReferrals}</p>
                        <p className="text-xs text-muted-foreground">referrals</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recent Signups Tab */}
        <TabsContent value="signups" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Signups</CardTitle>
              <CardDescription>Latest users who signed up with invite codes</CardDescription>
            </CardHeader>
            <CardContent>
              {recentSignups.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No signups yet. Users will appear here once they sign up with invite codes.
                </p>
              ) : (
                <div className="space-y-2">
                  {recentSignups.map((signup) => (
                    <div
                      key={signup.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{signup.displayName}</p>
                          <Badge
                            variant={signup.profileCompleted ? 'default' : 'outline'}
                            className={signup.profileCompleted ? 'bg-green-600' : ''}
                          >
                            {signup.profileCompleted ? 'Completed' : 'Pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span>Code: <code className="font-mono">{signup.inviteCode}</code></span>
                          <span>Signed up: {new Date(signup.signedUpAt).toLocaleString()}</span>
                          {signup.completedAt && (
                            <span>Completed: {new Date(signup.completedAt).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
