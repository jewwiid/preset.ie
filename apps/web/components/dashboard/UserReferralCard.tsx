'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Copy,
  Share2,
  CheckCircle,
  Users,
  Award,
  Clock,
  TrendingUp,
  ExternalLink,
  Edit,
  RotateCcw
} from 'lucide-react';

interface ReferralStats {
  inviteCode: string;
  totalReferrals: number;
  totalCreditsEarned: number;
  pendingReferrals: number;
  successfulReferrals: Array<{
    id: string;
    creditsEarned: number;
    awardedAt: string;
  }>;
  shareUrl: string;
}

interface UserReferralCardProps {
  userRole?: {
    isTalent?: boolean;
    isContributor?: boolean;
    isAdmin?: boolean;
  };
  userName?: string;
}

export function UserReferralCard({ userRole, userName }: UserReferralCardProps) {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<'link' | 'share' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCustomize, setShowCustomize] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  useEffect(() => {
    fetchReferralStats();
  }, []);

  const fetchReferralStats = async () => {
    try {
      const response = await fetch('/api/referrals');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load referral stats');
      }
    } catch (err) {
      console.error('Error fetching referral stats:', err);
      setError('Unable to load referral information');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (!stats?.shareUrl) return;
    navigator.clipboard.writeText(stats.shareUrl);
    setCopied('link');
    setTimeout(() => setCopied(null), 2000);
  };

  const getDefaultShareMessage = () => {
    if (!stats) return '';

    // Personalize message based on user role
    let roleSpecificMessage = '';
    let roleEmoji = '🎨';

    if (userRole?.isAdmin) {
      roleEmoji = '👑';
      roleSpecificMessage = "As a Preset admin, I'm personally inviting you to join our growing creative platform.";
    } else if (userRole?.isContributor) {
      roleEmoji = '🎬';
      roleSpecificMessage = "As a creative contributor on Preset, I'm inviting you to join our community where you can post gigs, discover talent, and bring your creative visions to life.";
    } else if (userRole?.isTalent) {
      roleEmoji = '⭐';
      roleSpecificMessage = "As a creative talent on Preset, I'm inviting you to join our platform where you can showcase your work, find exciting gigs, and connect with amazing clients.";
    } else {
      roleSpecificMessage = "I'm inviting you to join Preset, where creatives connect, collaborate, and showcase their work.";
    }

    const greeting = userName ? `Hey! ${userName} here. ` : '';

    return `${roleEmoji} Join Preset - The Creative Platform

${greeting}${roleSpecificMessage}

✨ Sign up with my invite code: ${stats.inviteCode}

🔗 ${stats.shareUrl}

Join a growing community of designers, photographers, videographers, and creative professionals!`;
  };

  const copyShareMessage = () => {
    if (!stats) return;
    const messageToShare = customMessage || getDefaultShareMessage();
    navigator.clipboard.writeText(messageToShare);
    setCopied('share');
    setTimeout(() => setCopied(null), 3000);
  };

  const handleCustomize = () => {
    setShowCustomize(!showCustomize);
    if (!showCustomize) {
      // Load default message when opening customize
      setCustomMessage(getDefaultShareMessage());
    }
  };

  const resetToDefault = () => {
    setCustomMessage(getDefaultShareMessage());
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Loading referral stats...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Program</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>
              {error || 'Unable to load referral information. Please try again later.'}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Invite Friends & Earn Credits
        </CardTitle>
        <CardDescription>
          Share your invite code and earn 5 credits for each friend who completes their profile
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invite Code Section */}
        <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
          <div className="text-sm font-medium text-muted-foreground mb-2">Your Invite Code</div>
          <div className="flex items-center justify-between gap-4">
            <code className="text-2xl font-bold font-mono tracking-wider text-primary">
              {stats.inviteCode}
            </code>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={copyLink}
                className="min-w-[80px]"
              >
                {copied === 'link' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy Link
                  </>
                )}
              </Button>
              <Button
                size="sm"
                onClick={copyShareMessage}
                className="min-w-[80px]"
              >
                {copied === 'share' ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Share2 className="h-4 w-4 mr-1" />
                    Share
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              <ExternalLink className="h-3 w-3 inline mr-1" />
              {stats.shareUrl}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCustomize}
              className="text-xs"
            >
              <Edit className="h-3 w-3 mr-1" />
              {showCustomize ? 'Hide' : 'Customize Message'}
            </Button>
          </div>
        </div>

        {/* Customizable Share Message */}
        {showCustomize && (
          <div className="p-4 border border-border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">Customize Your Share Message</h4>
              <Button
                size="sm"
                variant="ghost"
                onClick={resetToDefault}
                className="text-xs"
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Reset
              </Button>
            </div>
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={8}
              className="font-mono text-sm"
              placeholder="Edit your share message..."
            />
            <p className="text-xs text-muted-foreground">
              💡 Tip: Keep your invite code and link in the message for best results
            </p>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.totalReferrals}</div>
                <div className="text-xs text-muted-foreground mt-1">Total Referrals</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground opacity-50" />
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{stats.totalCreditsEarned}</div>
                <div className="text-xs text-muted-foreground mt-1">Credits Earned</div>
              </div>
              <Award className="h-8 w-8 text-green-600 opacity-50" />
            </div>
          </div>

          <div className="p-4 border border-border rounded-lg bg-muted/30">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-yellow-600">{stats.pendingReferrals}</div>
                <div className="text-xs text-muted-foreground mt-1">Pending</div>
              </div>
              <Clock className="h-8 w-8 text-yellow-600 opacity-50" />
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-primary" />
            <h4 className="font-semibold text-sm">How It Works</h4>
          </div>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0">1</Badge>
              <span>Share your invite code or link with friends</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0">2</Badge>
              <span>They sign up using your code</span>
            </li>
            <li className="flex items-start gap-2">
              <Badge variant="outline" className="mt-0.5 shrink-0">3</Badge>
              <span>You earn <strong className="text-foreground">5 credits</strong> when they complete their profile</span>
            </li>
          </ol>
        </div>

        {/* Recent Referrals */}
        {stats.successfulReferrals.length > 0 && (
          <div className="pt-4 border-t border-border">
            <h4 className="font-semibold text-sm mb-3">Recent Referrals</h4>
            <div className="space-y-2">
              {stats.successfulReferrals.slice(0, 3).map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">
                      {new Date(referral.awardedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    +{referral.creditsEarned} credits
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pending Message */}
        {stats.pendingReferrals > 0 && (
          <Alert>
            <Clock className="h-4 w-4" />
            <AlertDescription>
              You have <strong>{stats.pendingReferrals}</strong> pending {stats.pendingReferrals === 1 ? 'referral' : 'referrals'}.
              You'll earn credits once they complete their profile!
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
