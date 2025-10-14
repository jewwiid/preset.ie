'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  ExternalLink,
  MapPin,
  Briefcase,
  User,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { getAuthToken } from '../../lib/supabase';
import { supabase } from '@/lib/supabase';

interface Application {
  id: string;
  project_id: string;
  role_id: string;
  applicant_id: string;
  message?: string;
  portfolio_url?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
  applicant: {
    id: string;
    handle?: string;
    display_name: string;
    avatar_url?: string;
    verified_id?: boolean;
    city?: string;
    country?: string;
    bio?: string;
    specializations?: string[];
  };
  role: {
    id: string;
    role_name: string;
    skills_required?: string[];
    is_paid: boolean;
    compensation_details?: string;
  };
}

interface ApplicationsListProps {
  projectId: string;
  applications: Application[];
  isCreator: boolean;
  onUpdate: () => void;
}

export default function ApplicationsList({
  projectId,
  applications,
  isCreator,
  onUpdate
}: ApplicationsListProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [compatibilityScores, setCompatibilityScores] = useState<Record<string, any>>();

  // Fetch compatibility scores for all applications (only for creators)
  useEffect(() => {
    if (!isCreator || applications.length === 0 || !supabase) return;

    const fetchCompatibilityScores = async () => {
      const scores: Record<string, any> = {};

      for (const app of applications) {
        try {
          if (!supabase) continue; // Additional null check for TypeScript
          const { data, error } = await supabase.rpc(
            'calculate_collaboration_compatibility',
            {
              p_profile_id: app.applicant_id,
              p_role_id: app.role_id
            }
          );

          if (!error && data && data.length > 0) {
            scores[app.id] = data[0];
          }
        } catch (err) {
          console.error(`Error fetching compatibility for application ${app.id}:`, err);
        }
      }

      setCompatibilityScores(scores);
    };

    fetchCompatibilityScores();
  }, [applications, isCreator]);

  const handleAccept = async (application: Application) => {
    setLoading(application.id);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `/api/collab/projects/${projectId}/applications/${application.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ status: 'accepted' })
        }
      );

      if (response.ok) {
        toast.success('Application accepted! Applicant has been added to the project.');
        onUpdate();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to accept application');
      }
    } catch (err) {
      console.error('Error accepting application:', err);
      toast.error('Failed to accept application');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async () => {
    if (!selectedApplication) return;

    setLoading(selectedApplication.id);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `/api/collab/projects/${projectId}/applications/${selectedApplication.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({
            status: 'rejected',
            rejection_reason: rejectionReason || undefined
          })
        }
      );

      if (response.ok) {
        toast.success('Application rejected');
        setRejectDialogOpen(false);
        setRejectionReason('');
        setSelectedApplication(null);
        onUpdate();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to reject application');
      }
    } catch (err) {
      console.error('Error rejecting application:', err);
      toast.error('Failed to reject application');
    } finally {
      setLoading(null);
    }
  };

  const handleWithdraw = async (application: Application) => {
    setLoading(application.id);
    try {
      const token = await getAuthToken();
      const response = await fetch(
        `/api/collab/projects/${projectId}/applications/${application.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          },
          body: JSON.stringify({ status: 'withdrawn' })
        }
      );

      if (response.ok) {
        toast.success('Application withdrawn');
        onUpdate();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to withdraw application');
      }
    } catch (err) {
      console.error('Error withdrawing application:', err);
      toast.error('Failed to withdraw application');
    } finally {
      setLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'accepted':
        return <Badge className="bg-primary/10 text-primary">Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'withdrawn':
        return <Badge variant="secondary">Withdrawn</Badge>;
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const getCompatibilityBadge = (score: number) => {
    if (score >= 70) {
      return (
        <Badge className="bg-primary/10 text-primary">
          <TrendingUp className="h-3 w-3 mr-1" />
          {Math.round(score)}% Match
        </Badge>
      );
    } else if (score >= 30) {
      return (
        <Badge className="bg-primary/10 text-primary">
          <AlertCircle className="h-3 w-3 mr-1" />
          {Math.round(score)}% Match
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          {Math.round(score)}% Match
        </Badge>
      );
    }
  };

  // Group applications by role
  const applicationsByRole = applications.reduce((acc, app) => {
    const roleName = app.role.role_name;
    if (!acc[roleName]) {
      acc[roleName] = [];
    }
    acc[roleName].push(app);
    return acc;
  }, {} as Record<string, Application[]>);

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <User className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-center">
            No applications yet
          </p>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Applications will appear here when people apply to your roles
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(applicationsByRole).map(([roleName, roleApplications]) => (
        <Card key={roleName}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{roleName}</span>
              <Badge variant="secondary">{roleApplications.length} application{roleApplications.length !== 1 ? 's' : ''}</Badge>
            </CardTitle>
            <CardDescription>
              {roleApplications[0]?.role.is_paid ? '💰 Paid role' : '🤝 Volunteer role'}
              {roleApplications[0]?.role.compensation_details && ` - ${roleApplications[0].role.compensation_details}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {roleApplications.map((application) => (
              <div
                key={application.id}
                className="border border-border rounded-lg p-4 space-y-4"
              >
                {/* Applicant Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={application.applicant.avatar_url} />
                      <AvatarFallback>
                        {application.applicant.display_name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        <h4 className="font-medium">{application.applicant.display_name}</h4>
                        {application.applicant.verified_id && (
                          <Badge variant="secondary" className="text-xs">Verified</Badge>
                        )}
                        {getStatusBadge(application.status)}
                        {isCreator && compatibilityScores[application.id] && (
                          getCompatibilityBadge(compatibilityScores[application.id].skill_match_score)
                        )}
                      </div>
                      {application.applicant.handle && (
                        <p className="text-sm text-muted-foreground">@{application.applicant.handle}</p>
                      )}
                      {(application.applicant.city || application.applicant.country) && (
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <MapPin className="h-3 w-3 mr-1" />
                          {[application.applicant.city, application.applicant.country].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Applied {new Date(application.created_at).toLocaleDateString()}
                  </div>
                </div>

                {/* Bio */}
                {application.applicant.bio && (
                  <div>
                    <p className="text-sm text-muted-foreground">{application.applicant.bio}</p>
                  </div>
                )}

                {/* Skill Match Breakdown for Creators */}
                {isCreator && compatibilityScores[application.id] && (
                  <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-primary">Compatibility Analysis</h5>
                      <span className="text-xs text-primary/80">
                        Overall: {Math.round(compatibilityScores[application.id].overall_score)}%
                      </span>
                    </div>

                    {/* Matched Skills */}
                    {compatibilityScores[application.id].matched_skills?.length > 0 && (
                      <div>
                        <p className="text-xs text-primary mb-1">✓ Matched Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {compatibilityScores[application.id].matched_skills.map((skill: string, idx: number) => (
                            <Badge key={idx} className="bg-primary/20 text-primary text-xs">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Skills */}
                    {compatibilityScores[application.id].missing_skills?.length > 0 && (
                      <div>
                        <p className="text-xs text-primary mb-1">⚠ Missing Skills:</p>
                        <div className="flex flex-wrap gap-1">
                          {compatibilityScores[application.id].missing_skills.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="text-xs">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Specializations */}
                {application.applicant.specializations && application.applicant.specializations.length > 0 && (
                  <div>
                    <h5 className="text-sm font-medium mb-2 flex items-center">
                      <Briefcase className="h-4 w-4 mr-1" />
                      All Specializations
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {application.applicant.specializations.map((spec, idx) => (
                        <Badge key={idx} variant="outline">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Application Message */}
                {application.message && (
                  <div className="p-3 bg-muted-50 rounded-lg">
                    <h5 className="text-sm font-medium mb-1">Application Message</h5>
                    <p className="text-sm text-muted-foreground-700">{application.message}</p>
                  </div>
                )}

                {/* Portfolio URL */}
                {application.portfolio_url && (
                  <div>
                    <a
                      href={application.portfolio_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      View Portfolio
                    </a>
                  </div>
                )}

                {/* Rejection Reason */}
                {application.status === 'rejected' && application.rejection_reason && (
                  <div className="p-3 bg-destructive-50 border border-destructive-200 rounded-lg">
                    <h5 className="text-sm font-medium text-destructive-800 mb-1">Rejection Reason</h5>
                    <p className="text-sm text-destructive-700">{application.rejection_reason}</p>
                  </div>
                )}

                {/* Actions */}
                {application.status === 'pending' && (
                  <div className="flex items-center space-x-2 pt-2">
                    {isCreator ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleAccept(application)}
                          disabled={loading === application.id}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            setSelectedApplication(application);
                            setRejectDialogOpen(true);
                          }}
                          disabled={loading === application.id}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleWithdraw(application)}
                        disabled={loading === application.id}
                      >
                        Withdraw Application
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        // TODO: Implement messaging
                        toast.info('Messaging feature coming soon!');
                      }}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Message
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to reject this application? You can optionally provide a reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="rejection_reason">Rejection Reason (Optional)</Label>
              <Textarea
                id="rejection_reason"
                placeholder="Explain why this application doesn't fit..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason('');
                setSelectedApplication(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={loading !== null}
            >
              {loading ? 'Rejecting...' : 'Reject Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
