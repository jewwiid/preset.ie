'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Camera, MessageCircle, Star, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface Project {
  id: string;
  title: string;
  description?: string;
  synopsis?: string;
  city?: string;
  country?: string;
  start_date?: string;
  end_date?: string;
  visibility: string;
  status: string;
  created_at: string;
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    verified?: boolean;
    rating?: number;
    bio?: string;
    specializations?: string[];
  };
  collab_roles: Array<{
    id: string;
    role_name: string;
    skills_required: string[];
    is_paid: boolean;
    compensation_details?: string;
    headcount: number;
    status: string;
    created_at: string;
  }>;
  collab_gear_requests: Array<{
    id: string;
    category: string;
    equipment_spec?: string;
    quantity: number;
    borrow_preferred: boolean;
    retainer_acceptable: boolean;
    max_daily_rate_cents?: number;
    status: string;
    created_at: string;
  }>;
  collab_participants: Array<{
    id: string;
    role_type: string;
    status: string;
    joined_at: string;
    user: {
      id: string;
      username: string;
      display_name: string;
      avatar_url?: string;
      verified?: boolean;
      rating?: number;
    };
  }>;
  moodboard?: {
    id: string;
    title: string;
    description?: string;
    moodboard_items: Array<{
      id: string;
      image_url: string;
      description?: string;
      sort_order: number;
    }>;
  };
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const projectId = params.id as string;

  useEffect(() => {
    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      const response = await fetch(`/api/collab/projects/${projectId}`);
      const data = await response.json();

      if (response.ok) {
        setProject(data.project);
      } else {
        setError(data.error || 'Failed to fetch project');
      }
    } catch (err) {
      console.error('Error fetching project:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (roleId?: string) => {
    setApplying(true);
    try {
      const response = await fetch(`/api/collab/projects/${projectId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          role_id: roleId,
          application_type: roleId ? 'role' : 'general',
          message: 'I am interested in collaborating on this project!'
        })
      });

      if (response.ok) {
        // Show success message or redirect
        alert('Application submitted successfully!');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      alert('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-primary-100 text-primary-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getRoleStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-primary-100 text-primary-800';
      case 'filled': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Project not found'}</p>
          <Button onClick={() => router.push('/collaborate')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center py-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/collaborate')}
              className="mr-4"
            >
              ← Back
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900">{project.title}</h1>
              <div className="flex items-center space-x-4 mt-2">
                <Badge className={getStatusColor(project.status)}>
                  {project.status.replace('_', ' ')}
                </Badge>
                {project.creator.verified && (
                  <Badge variant="secondary">Verified Creator</Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-gray-600 whitespace-pre-wrap">{project.description}</p>
                  </div>
                )}
                
                {project.synopsis && (
                  <div>
                    <h4 className="font-medium mb-2">Synopsis</h4>
                    <p className="text-gray-600">{project.synopsis}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(project.city || project.country) && (
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {[project.city, project.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                  
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      {project.start_date && format(new Date(project.start_date), "MMM d, yyyy")}
                      {project.start_date && project.end_date && ' - '}
                      {project.end_date && format(new Date(project.end_date), "MMM d, yyyy")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="roles" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="roles">Roles ({project.collab_roles.length})</TabsTrigger>
                <TabsTrigger value="gear">Equipment ({project.collab_gear_requests.length})</TabsTrigger>
                <TabsTrigger value="team">Team ({project.collab_participants.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="roles" className="space-y-4">
                {project.collab_roles.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No roles defined for this project</p>
                    </CardContent>
                  </Card>
                ) : (
                  project.collab_roles.map((role) => (
                    <Card key={role.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{role.role_name}</CardTitle>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge className={getRoleStatusColor(role.status)}>
                                {role.status}
                              </Badge>
                              {role.is_paid && (
                                <Badge variant="secondary">Paid</Badge>
                              )}
                            </div>
                          </div>
                          {role.status === 'open' && (
                            <Button
                              onClick={() => handleApply(role.id)}
                              disabled={applying}
                              size="sm"
                            >
                              Apply
                            </Button>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <span className="font-medium">Headcount:</span> {role.headcount} position{role.headcount !== 1 ? 's' : ''}
                        </div>
                        
                        {role.skills_required.length > 0 && (
                          <div>
                            <span className="font-medium">Required Skills:</span>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {role.skills_required.map((skill) => (
                                <Badge key={skill} variant="outline">{skill}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {role.compensation_details && (
                          <div>
                            <span className="font-medium">Compensation:</span>
                            <p className="text-gray-600 mt-1">{role.compensation_details}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="gear" className="space-y-4">
                {project.collab_gear_requests.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No equipment requests for this project</p>
                    </CardContent>
                  </Card>
                ) : (
                  project.collab_gear_requests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{request.category}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {request.equipment_spec && (
                          <div>
                            <span className="font-medium">Specification:</span>
                            <p className="text-gray-600 mt-1">{request.equipment_spec}</p>
                          </div>
                        )}
                        
                        <div>
                          <span className="font-medium">Quantity:</span> {request.quantity} item{request.quantity !== 1 ? 's' : ''}
                        </div>
                        
                        <div className="flex items-center space-x-4">
                          {request.borrow_preferred && (
                            <div className="flex items-center text-primary-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Borrowing preferred
                            </div>
                          )}
                          {request.retainer_acceptable && (
                            <div className="flex items-center text-blue-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Retainer acceptable
                            </div>
                          )}
                        </div>
                        
                        {request.max_daily_rate_cents && (
                          <div>
                            <span className="font-medium">Max Daily Rate:</span> €{(request.max_daily_rate_cents / 100).toFixed(2)}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              <TabsContent value="team" className="space-y-4">
                {project.collab_participants.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No team members yet</p>
                    </CardContent>
                  </Card>
                ) : (
                  project.collab_participants.map((participant) => (
                    <Card key={participant.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={participant.user.avatar_url} />
                            <AvatarFallback>
                              {participant.user.display_name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h4 className="font-medium">{participant.user.display_name}</h4>
                              {participant.user.verified && (
                                <Badge variant="secondary" className="text-xs">Verified</Badge>
                              )}
                              {participant.user.rating && (
                                <div className="flex items-center text-sm text-gray-500">
                                  <Star className="h-3 w-3 mr-1 fill-current" />
                                  {participant.user.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 capitalize">
                              {participant.role_type.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={participant.status === 'active' ? 'bg-primary-100 text-primary-800' : 'bg-gray-100 text-gray-800'}>
                              {participant.status}
                            </Badge>
                            <p className="text-xs text-gray-400 mt-1">
                              Joined {format(new Date(participant.joined_at), "MMM d")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Creator Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Creator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={project.creator.avatar_url} />
                    <AvatarFallback>
                      {project.creator.display_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-medium">{project.creator.display_name}</h3>
                    <p className="text-sm text-gray-500">@{project.creator.username}</p>
                    {project.creator.verified && (
                      <Badge variant="secondary" className="mt-1">Verified</Badge>
                    )}
                    {project.creator.rating && (
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        {project.creator.rating.toFixed(1)} rating
                      </div>
                    )}
                  </div>
                </div>
                
                {project.creator.bio && (
                  <p className="text-sm text-gray-600 mt-4">{project.creator.bio}</p>
                )}
                
                {project.creator.specializations && project.creator.specializations.length > 0 && (
                  <div className="mt-4">
                    <span className="text-sm font-medium">Specializations:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {project.creator.specializations.map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleApply()}
                  disabled={applying || project.status !== 'published'}
                  className="w-full"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Apply to Project
                </Button>
                
                <Button variant="outline" className="w-full">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message Creator
                </Button>
                
                <Button variant="outline" className="w-full">
                  Share Project
                </Button>
              </CardContent>
            </Card>

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Created</span>
                  <span className="text-sm font-medium">
                    {format(new Date(project.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Roles</span>
                  <span className="text-sm font-medium">{project.collab_roles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Equipment Requests</span>
                  <span className="text-sm font-medium">{project.collab_gear_requests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Team Members</span>
                  <span className="text-sm font-medium">{project.collab_participants.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
