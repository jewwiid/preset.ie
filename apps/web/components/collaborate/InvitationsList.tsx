'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, Check, X, Loader2, Mail } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Link from 'next/link';

interface Invitation {
  id: string;
  status: string;
  message?: string;
  created_at: string;
  expires_at: string;
  project: {
    id: string;
    title: string;
    description?: string;
    city?: string;
    country?: string;
    start_date?: string;
    end_date?: string;
    creator: {
      id: string;
      handle: string;
      display_name: string;
      avatar_url?: string;
    };
  };
  inviter: {
    id: string;
    handle: string;
    display_name: string;
    avatar_url?: string;
  };
  role?: {
    id: string;
    role_name: string;
  };
}

export function InvitationsList() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchInvitations = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!supabase) {
        setError('Supabase client not available');
        return;
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('Not authenticated');
        return;
      }

      const response = await fetch('/api/collab/invitations?status=pending', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setInvitations(data.invitations || []);
      } else {
        setError(data.error || 'Failed to fetch invitations');
      }
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const handleInvitationAction = async (invitationId: string, action: 'accept' | 'decline') => {
    setProcessingId(invitationId);

    try {
      if (!supabase) {
        throw new Error('Supabase client not available');
      }
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/collab/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (response.ok) {
        // Remove invitation from list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      } else {
        throw new Error(data.error || `Failed to ${action} invitation`);
      }
    } catch (err: any) {
      console.error(`Error ${action}ing invitation:`, err);
      alert(err.message || `Failed to ${action} invitation`);
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">{error}</p>
            <Button onClick={fetchInvitations} className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (invitations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Invitations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Mail className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">No pending invitations</h3>
            <p className="text-muted-foreground">
              You don't have any pending project invitations at the moment.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {invitations.map((invitation) => {
        const expired = isExpired(invitation.expires_at);
        const isProcessing = processingId === invitation.id;

        return (
          <Card key={invitation.id} className={expired ? 'opacity-60' : ''}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={invitation.inviter.avatar_url} />
                      <AvatarFallback>
                        {invitation.inviter.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {invitation.inviter.display_name}
                        </span>{' '}
                        invited you to join
                      </p>
                    </div>
                  </div>

                  <Link href={`/collaborate/projects/${invitation.project.id}`}>
                    <h3 className="text-lg font-semibold text-foreground hover:text-primary transition-colors mb-2">
                      {invitation.project.title}
                    </h3>
                  </Link>

                  {invitation.role && (
                    <Badge variant="secondary" className="mb-2">
                      {invitation.role.role_name}
                    </Badge>
                  )}

                  {invitation.project.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {invitation.project.description}
                    </p>
                  )}

                  {invitation.message && (
                    <div className="bg-muted p-3 rounded-lg mb-3">
                      <p className="text-sm text-foreground italic">
                        "{invitation.message}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      Sent {formatDate(invitation.created_at)}
                    </div>
                    <div className={expired ? 'text-destructive' : ''}>
                      {expired ? 'Expired' : `Expires ${formatDate(invitation.expires_at)}`}
                    </div>
                  </div>
                </div>

                {!expired && (
                  <div className="flex space-x-2 ml-4">
                    <Button
                      size="sm"
                      onClick={() => handleInvitationAction(invitation.id, 'accept')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInvitationAction(invitation.id, 'decline')}
                      disabled={isProcessing}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
