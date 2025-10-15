'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CheckSquare, Clock, Upload, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface PendingShowcase {
  id: string;
  title: string;
  description: string;
  gig_id: string;
  gig_title: string;
  creator_user_id: string;
  creator_name: string;
  creator_handle: string;
  creator_avatar_url?: string;
  approval_status: string;
  total_talents?: number;
  approved_talents?: number;
  change_requests?: number;
  created_at: string;
  updated_at: string;
}

export function PendingShowcaseApprovals() {
  const { user, session } = useAuth();
  const router = useRouter();
  const [pendingShowcases, setPendingShowcases] = useState<PendingShowcase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPendingShowcases();
    }
  }, [user]);

  const fetchPendingShowcases = async () => {
    try {
      const response = await fetch('/api/showcases/pending-approvals', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPendingShowcases(data.showcases || []);
      }
    } catch (error) {
      console.error('Error fetching pending showcases:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            Pending Your Approval
          </Badge>
        );
      case 'blocked_by_changes':
        return (
          <Badge className="bg-red-100 text-red-800">
            <CheckSquare className="w-3 h-3 mr-1" />
            Blocked by Changes
          </Badge>
        );
      case 'changes_requested':
        return (
          <Badge className="bg-orange-100 text-orange-800">
            <CheckSquare className="w-3 h-3 mr-1" />
            Changes Requested
          </Badge>
        );
      case 'draft':
        return (
          <Badge variant="outline">
            <Upload className="w-3 h-3 mr-1" />
            Draft
          </Badge>
        );
      default:
        return null;
    }
  };

  const getActionButton = (showcase: PendingShowcase) => {
    switch (showcase.approval_status) {
      case 'pending_approval':
        return (
          <Button
            size="sm"
            onClick={() => router.push(`/gigs/${showcase.gig_id}`)}
          >
            <CheckSquare className="w-4 h-4 mr-2" />
            Review & Approve
          </Button>
        );
      case 'blocked_by_changes':
        return (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => router.push(`/gigs/${showcase.gig_id}`)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Address Feedback
          </Button>
        );
      case 'changes_requested':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/gigs/${showcase.gig_id}`)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Make Changes
          </Button>
        );
      case 'draft':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => router.push(`/gigs/${showcase.gig_id}`)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Draft
          </Button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            Pending Showcase Approvals
          </CardTitle>
          <CardDescription>
            Showcases waiting for your action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (pendingShowcases.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            Pending Showcase Approvals
          </CardTitle>
          <CardDescription>
            Showcases waiting for your action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">All caught up!</h3>
            <p className="text-muted-foreground">
              No showcases are currently waiting for your approval.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-primary" />
              Pending Showcase Approvals
            </CardTitle>
            <CardDescription>
              {pendingShowcases.length} showcase{pendingShowcases.length !== 1 ? 's' : ''} waiting for your action
            </CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/showcases')}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingShowcases.map((showcase) => (
            <div
              key={showcase.id}
              className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center space-x-3 flex-1">
                <Avatar className="w-10 h-10">
                  <AvatarImage
                    src={showcase.creator_avatar_url || undefined}
                    alt={showcase.creator_name}
                  />
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {showcase.creator_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm truncate">
                      {showcase.title}
                    </h4>
                    {getStatusBadge(showcase.approval_status)}
                  </div>
                  
                  <p className="text-xs text-muted-foreground truncate">
                    From gig: "{showcase.gig_title}"
                  </p>
                  
                  <p className="text-xs text-muted-foreground">
                    by @{showcase.creator_handle}
                  </p>
                  
                  {/* Multi-talent approval progress */}
                  {showcase.total_talents && showcase.total_talents > 1 && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Approval Progress:</span>
                        <span className="font-semibold">
                          {showcase.approved_talents || 0}/{showcase.total_talents}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                        <div 
                          className="bg-green-600 h-1 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${((showcase.approved_talents || 0) / showcase.total_talents) * 100}%` 
                          }}
                        ></div>
                      </div>
                      {showcase.change_requests && showcase.change_requests > 0 && (
                        <p className="text-xs text-orange-600 mt-1">
                          {showcase.change_requests} change request{showcase.change_requests !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {getActionButton(showcase)}
              </div>
            </div>
          ))}
        </div>
        
        {pendingShowcases.length > 3 && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/showcases')}
            >
              View All Pending Approvals
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
