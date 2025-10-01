'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, User, Star, MapPin, Calendar } from 'lucide-react';

interface Role {
  id: string;
  role_name: string;
  skills_required: string[];
  is_paid: boolean;
  compensation_details?: string;
  headcount: number;
  status: string;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  city?: string;
  country?: string;
  start_date?: string;
  end_date?: string;
  creator: {
    id: string;
    handle?: string;
    display_name: string;
    avatar_url?: string;
    verified_id?: boolean;
  };
}

interface RoleApplicationModalProps {
  role: Role;
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RoleApplicationModal({
  role,
  project,
  isOpen,
  onClose,
  onSuccess
}: RoleApplicationModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    message: '',
    portfolio_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/collab/projects/${project.id}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          role_id: role.id,
          application_type: 'role',
          message: formData.message,
          portfolio_url: formData.portfolio_url
        })
      });

      if (response.ok) {
        onSuccess?.();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      setError('Failed to submit application');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Apply for Role</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Project & Role Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">{project.title}</h3>
              <p className="text-sm text-muted-foreground-600">{project.description}</p>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground-500">
              {(project.city || project.country) && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {[project.city, project.country].filter(Boolean).join(', ')}
                </div>
              )}
              
              {(project.start_date || project.end_date) && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {project.start_date && formatDate(project.start_date)}
                  {project.start_date && project.end_date && ' - '}
                  {project.end_date && formatDate(project.end_date)}
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="flex items-center space-x-3 p-3 bg-muted-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={project.creator.avatar_url} />
                <AvatarFallback>
                  {project.creator.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{project.creator.display_name}</span>
                  {project.creator.verified_id && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground-500">@{project.creator.handle}</p>
              </div>
            </div>

            {/* Role Details */}
            <div className="p-4 border border-border-200 rounded-lg">
              <h4 className="font-medium mb-2">{role.role_name}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground-500">Positions:</span>
                  <span>{role.headcount} position{role.headcount !== 1 ? 's' : ''}</span>
                </div>
                
                {role.is_paid && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground-500">Compensation:</span>
                    <span className="text-primary-600 font-medium">Paid</span>
                  </div>
                )}
                
                {role.compensation_details && (
                  <div className="text-muted-foreground-600">
                    <span className="text-muted-foreground-500">Details:</span> {role.compensation_details}
                  </div>
                )}
                
                {role.skills_required.length > 0 && (
                  <div>
                    <span className="text-muted-foreground-500">Required Skills:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {role.skills_required.map((skill) => (
                        <Badge key={skill} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Application Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive-50 border border-destructive-200 rounded-md">
                <p className="text-destructive-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="message">Application Message *</Label>
              <Textarea
                id="message"
                placeholder="Tell the creator why you're interested in this role and what you can bring to the project..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={4}
                required
              />
            </div>

            <div>
              <Label htmlFor="portfolio_url">Portfolio URL (Optional)</Label>
              <Input
                id="portfolio_url"
                type="url"
                placeholder="https://yourportfolio.com"
                value={formData.portfolio_url}
                onChange={(e) => setFormData(prev => ({ ...prev, portfolio_url: e.target.value }))}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.message.trim()}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
