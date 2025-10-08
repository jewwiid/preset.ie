'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Camera, MessageCircle, Star, CheckCircle, XCircle, Clock, UserPlus, Mail, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { InviteUserDialog } from '@/components/collaborate/InviteUserDialog';
import GearOfferModal from '@/components/collaborate/GearOfferModal';
import { GearOffersList } from '@/components/collaborate/GearOffersList';
import { ShareProjectModal } from '@/components/collaborate/ShareProjectModal';
import ApplicationsList from '@/components/collaborate/ApplicationsList';
import { WithdrawApplicationDialog } from '@/components/collaborate/WithdrawApplicationDialog';
import { getAuthToken } from '../../../../lib/supabase';

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
    handle?: string;
    display_name: string;
    avatar_url?: string;
    verified_id?: boolean;
    city?: string;
    country?: string;
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
      handle?: string;
      display_name: string;
      avatar_url?: string;
      verified_id?: boolean;
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
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedGearRequest, setSelectedGearRequest] = useState<any>(null);
  const [gearOffers, setGearOffers] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [userApplications, setUserApplications] = useState<any[]>([]);
  const [isCreator, setIsCreator] = useState(false);
  const [invitationStats, setInvitationStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('roles');
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [applicationToWithdraw, setApplicationToWithdraw] = useState<{
    id: string;
    roleId: string;
    roleName: string;
  } | null>(null);

  const projectId = params?.id as string;

  useEffect(() => {
    fetchProject();
    fetchUserApplications(); // Fetch user's own applications
  }, [projectId]);

  const fetchProject = async () => {
    try {
      // Get auth token using the helper function
      const token = await getAuthToken();

      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/collab/projects/${projectId}`, {
        headers
      });
      const data = await response.json();

      if (response.ok) {
        setProject(data.project);
        setIsCreator(data.isCreator);
        setInvitationStats(data.invitationStats);

        // Fetch gear offers and applications if user is creator
        if (data.isCreator) {
          fetchGearOffers(token ?? undefined);
          fetchApplications(token ?? undefined);
        }
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

  const fetchGearOffers = async (token?: string) => {
    try {
      const authToken = token || await getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/collab/projects/${projectId}/gear-offers`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setGearOffers(data.gearOffers || []);
      }
    } catch (err) {
      console.error('Error fetching gear offers:', err);
    }
  };

  const fetchApplications = async (token?: string) => {
    try {
      const authToken = token || await getAuthToken();
      const headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/collab/projects/${projectId}/applications`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    }
  };

  const fetchUserApplications = async () => {
    try {
      const token = await getAuthToken();
      if (!token) return; // User not logged in

      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };

      const response = await fetch(`/api/collab/projects/${projectId}/applications?user_only=true`, {
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setUserApplications(data.applications || []);
      }
    } catch (err) {
      console.error('Error fetching user applications:', err);
    }
  };

  // Helper function to check if user has already applied to a role
  const hasAppliedToRole = (roleId: string) => {
    return userApplications.some(app =>
      app.role_id === roleId && app.status === 'pending'
    );
  };

  // Helper function to get user's application for a role
  const getUserApplicationForRole = (roleId: string) => {
    return userApplications.find(app =>
      app.role_id === roleId && app.status === 'pending'
    );
  };

  // Handle withdraw application
  const handleWithdrawApplication = (roleId: string, roleName: string) => {
    const application = getUserApplicationForRole(roleId);
    if (application) {
      setApplicationToWithdraw({
        id: application.id,
        roleId: roleId,
        roleName: roleName
      });
      setWithdrawDialogOpen(true);
    }
  };

  const handleWithdrawSuccess = () => {
    toast.success('Application withdrawn successfully');
    fetchUserApplications(); // Refresh applications
  };

  const handleApply = async (roleId?: string) => {
    setApplying(true);
    try {
      const token = await getAuthToken();

      const response = await fetch(`/api/collab/projects/${projectId}/applications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify({
          role_id: roleId,
          application_type: roleId ? 'role' : 'general',
          message: 'I am interested in collaborating on this project!'
        })
      });

      if (response.ok) {
        toast.success('Application submitted successfully!');
        // Refresh user applications to update button states
        await fetchUserApplications();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to submit application');
      }
    } catch (err) {
      console.error('Error submitting application:', err);
      toast.error('Failed to submit application');
    } finally {
      setApplying(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-primary-100 text-primary-800';
      case 'in_progress': return 'bg-primary-100 text-primary-800';
      case 'completed': return 'bg-muted-100 text-muted-foreground-800';
      case 'cancelled': return 'bg-destructive-100 text-destructive-800';
      default: return 'bg-primary-100 text-primary-800';
    }
  };

  const getRoleStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-primary-100 text-primary-800';
      case 'filled': return 'bg-muted-100 text-muted-foreground-800';
      case 'cancelled': return 'bg-destructive-100 text-destructive-800';
      default: return 'bg-primary-100 text-primary-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-muted-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive-600 mb-4">{error || 'Project not found'}</p>
          <Button onClick={() => router.push('/collaborate')}>
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Banner with Moodboard Background */}
      <div className="relative h-[500px] overflow-hidden border-b border-border">
        {/* Background Image - Use moodboard images if available */}
        {project.moodboard && project.moodboard.moodboard_items && project.moodboard.moodboard_items.length > 0 ? (
          <>
            {/* Moodboard Image Grid */}
            <div className="absolute inset-0 grid grid-cols-3 gap-1">
              {project.moodboard.moodboard_items.slice(0, 6).map((item, index) => (
                <div
                  key={item.id}
                  className="relative w-full h-full"
                >
                  <img
                    src={item.image_url}
                    alt={item.description || `Moodboard ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            {/* Stronger gradient overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
          </>
        ) : (
          <>
            {/* Fallback gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }} />
          </>
        )}

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-between py-8">
          {/* Top Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.push('/collaborate')}
              className="backdrop-blur-sm bg-background/80 hover:bg-background/90"
            >
              ← Back to Projects
            </Button>

            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor(project.status)} backdrop-blur-sm`}>
                {project.status.replace('_', ' ')}
              </Badge>
              {project.creator.verified_id && (
                <Badge variant="secondary" className="backdrop-blur-sm bg-background/80">
                  Verified Creator
                </Badge>
              )}
            </div>
          </div>

          {/* Main Title Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-4 leading-tight">
                {project.title}
              </h1>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-4 text-muted-foreground">
                <div className="flex items-center gap-3">
                  <Avatar className="w-14 h-14 border-2 border-background shadow-xl ring-2 ring-primary/20">
                    <AvatarImage
                      src={project.creator.avatar_url || undefined}
                      alt={project.creator.display_name}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                      {project.creator.display_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="backdrop-blur-sm bg-background/60 px-3 py-2 rounded-lg">
                    <p className="text-xs text-muted-foreground/80">Created by</p>
                    <p className="font-semibold text-foreground">{project.creator.display_name}</p>
                  </div>
                </div>

                {(project.city || project.country) && (
                  <div className="flex items-center gap-2 backdrop-blur-sm bg-background/60 px-4 py-2 rounded-lg">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium">{[project.city, project.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                {project.start_date && (
                  <div className="flex items-center gap-2 backdrop-blur-sm bg-background/60 px-4 py-2 rounded-lg">
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">{format(new Date(project.start_date), 'MMM d, yyyy')}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 backdrop-blur-sm bg-background/60 px-4 py-2 rounded-lg">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{project.collab_roles.length} roles</span>
                </div>
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
                    <p className="text-muted-foreground-600 whitespace-pre-wrap">{project.description}</p>
                  </div>
                )}
                
                {project.synopsis && (
                  <div>
                    <h4 className="font-medium mb-2">Synopsis</h4>
                    <p className="text-muted-foreground-600">{project.synopsis}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(project.city || project.country) && (
                    <div className="flex items-center text-muted-foreground-600">
                      <MapPin className="h-4 w-4 mr-2" />
                      {[project.city, project.country].filter(Boolean).join(', ')}
                    </div>
                  )}
                  
                  {(project.start_date || project.end_date) && (
                    <div className="flex items-center text-muted-foreground-600">
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
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className={`grid w-full ${isCreator ? 'grid-cols-5' : 'grid-cols-3'}`}>
                <TabsTrigger value="roles">Roles ({project.collab_roles.length})</TabsTrigger>
                <TabsTrigger value="gear">Equipment ({project.collab_gear_requests.length})</TabsTrigger>
                <TabsTrigger value="team">Team ({project.collab_participants.length})</TabsTrigger>
                {isCreator && (
                  <>
                    <TabsTrigger value="applications">
                      Applications ({applications.length})
                    </TabsTrigger>
                    <TabsTrigger value="offers">
                      Offers ({gearOffers.length})
                    </TabsTrigger>
                  </>
                )}
              </TabsList>

              <TabsContent value="roles" className="space-y-4">
                {project.collab_roles.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-8">
                      <Users className="h-12 w-12 text-muted-foreground-400 mx-auto mb-4" />
                      <p className="text-muted-foreground-500">No roles defined for this project</p>
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
                          {!isCreator && role.status === 'open' && (
                            hasAppliedToRole(role.id) ? (
                              <div className="flex items-center gap-2">
                                <Button
                                  disabled
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Applied
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleWithdrawApplication(role.id, role.role_name)}
                                  className="text-destructive-600 hover:text-destructive-700 hover:bg-destructive-50"
                                >
                                  <X className="h-4 w-4 mr-1" />
                                  Withdraw
                                </Button>
                              </div>
                            ) : (
                              <Button
                                onClick={() => handleApply(role.id)}
                                disabled={applying}
                                size="sm"
                              >
                                Apply
                              </Button>
                            )
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
                            <p className="text-muted-foreground-600 mt-1">{role.compensation_details}</p>
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
                      <Camera className="h-12 w-12 text-muted-foreground-400 mx-auto mb-4" />
                      <p className="text-muted-foreground-500">No equipment requests for this project</p>
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
                            <p className="text-muted-foreground-600 mt-1">{request.equipment_spec}</p>
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
                            <div className="flex items-center text-primary-600">
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

                        {!isCreator && request.status === 'open' && (
                          <div className="pt-3 border-t border-border-200">
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedGearRequest(request);
                                setOfferModalOpen(true);
                              }}
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Make Offer
                            </Button>
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
                      <Users className="h-12 w-12 text-muted-foreground-400 mx-auto mb-4" />
                      <p className="text-muted-foreground-500">No team members yet</p>
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
                              {participant.user.verified_id && (
                                <Badge variant="secondary" className="text-xs">Verified</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground-500 capitalize">
                              {participant.role_type.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge className={participant.status === 'active' ? 'bg-primary-100 text-primary-800' : 'bg-muted-100 text-muted-foreground-800'}>
                              {participant.status}
                            </Badge>
                            <p className="text-xs text-muted-foreground-400 mt-1">
                              Joined project {format(new Date(participant.joined_at), "MMM d")}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Offers Tab - Only visible to creators */}
              {isCreator && (
                <>
                  <TabsContent value="applications" className="space-y-4">
                    <ApplicationsList
                      projectId={projectId}
                      applications={applications}
                      isCreator={isCreator}
                      onUpdate={() => {
                        fetchApplications();
                        fetchProject();
                      }}
                    />
                  </TabsContent>

                  <TabsContent value="offers" className="space-y-4">
                    <GearOffersList
                      projectId={projectId}
                      offers={gearOffers}
                      isCreator={isCreator}
                      onOfferUpdate={() => {
                        fetchGearOffers();
                        fetchProject();
                      }}
                    />
                  </TabsContent>
                </>
              )}
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
                    {project.creator.handle && (
                      <p className="text-sm text-muted-foreground-500">@{project.creator.handle}</p>
                    )}
                    {project.creator.verified_id && (
                      <Badge variant="secondary" className="mt-1">Verified</Badge>
                    )}
                  </div>
                </div>
                
                {project.creator.bio && (
                  <p className="text-sm text-muted-foreground-600 mt-4">{project.creator.bio}</p>
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
                {isCreator ? (
                  <>
                    <Button
                      onClick={() => setInviteDialogOpen(true)}
                      className="w-full"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Invite People
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setActiveTab('applications')}
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Manage Applications
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(`/collaborate/projects/${projectId}/edit`)}
                    >
                      Edit Project
                    </Button>
                  </>
                ) : !isCreator ? (
                  <>
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
                  </>
                ) : null}

                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setShareDialogOpen(true)}
                >
                  Share Project
                </Button>
              </CardContent>
            </Card>

            {/* Invitation Stats (for creators) */}
            {isCreator && invitationStats && (
              <Card>
                <CardHeader>
                  <CardTitle>Invitations</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground-500">Pending</span>
                    <span className="text-sm font-medium">{invitationStats.pending}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground-500">Accepted</span>
                    <span className="text-sm font-medium">{invitationStats.accepted}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground-500">Declined</span>
                    <span className="text-sm font-medium">{invitationStats.declined}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground-500">Total Sent</span>
                    <span className="text-sm font-medium">{invitationStats.total}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Project Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Project Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground-500">Created</span>
                  <span className="text-sm font-medium">
                    {format(new Date(project.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground-500">Roles</span>
                  <span className="text-sm font-medium">{project.collab_roles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground-500">Equipment Requests</span>
                  <span className="text-sm font-medium">{project.collab_gear_requests.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground-500">Team Members</span>
                  <span className="text-sm font-medium">{project.collab_participants.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Invite User Dialog */}
      {project && (
        <InviteUserDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          projectId={project.id}
          projectTitle={project.title}
          roles={project.collab_roles}
          onInviteSent={() => {
            // Refresh project data to update invitation stats
            fetchProject();
          }}
        />
      )}

      {/* Gear Offer Modal */}
      {project && selectedGearRequest && (
        <GearOfferModal
          gearRequest={selectedGearRequest}
          project={project}
          isOpen={offerModalOpen}
          onClose={() => {
            setOfferModalOpen(false);
            setSelectedGearRequest(null);
          }}
          onSuccess={() => {
            // Refresh project data to show updated offers
            fetchProject();
          }}
        />
      )}

      {/* Share Project Modal */}
      {project && (
        <ShareProjectModal
          open={shareDialogOpen}
          onClose={() => setShareDialogOpen(false)}
          projectId={project.id}
          projectTitle={project.title}
          projectDescription={project.description}
        />
      )}

      {/* Withdraw Application Dialog */}
      {applicationToWithdraw && (
        <WithdrawApplicationDialog
          isOpen={withdrawDialogOpen}
          onClose={() => {
            setWithdrawDialogOpen(false);
            setApplicationToWithdraw(null);
          }}
          onSuccess={handleWithdrawSuccess}
          projectId={projectId}
          applicationId={applicationToWithdraw.id}
          roleName={applicationToWithdraw.roleName}
        />
      )}
    </div>
  );
}
