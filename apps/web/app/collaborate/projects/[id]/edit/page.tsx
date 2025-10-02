'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft, ArrowRight, Check, Users, Trash2, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RoleForm } from '@/components/collaborate/RoleForm';
import { getAuthToken } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

interface ProjectFormData {
  title: string;
  description: string;
  synopsis: string;
  city: string;
  country: string;
  start_date: string;
  end_date: string;
  visibility: 'public' | 'private' | 'invite_only';
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled';
  moodboard_id?: string;
}

interface RoleFormData {
  id?: string;
  role_name: string;
  skills_required: string[];
  is_paid: boolean;
  compensation_details: string;
  headcount: number;
}

interface GearRequestFormData {
  id?: string;
  category: string;
  equipment_spec: string;
  quantity: number;
  borrow_preferred: boolean;
  retainer_acceptable: boolean;
  max_daily_rate_cents?: number;
}

type ProjectStep = 'basics' | 'roles' | 'gear' | 'review';

export default function ProjectEditPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  const [currentStep, setCurrentStep] = useState<ProjectStep>('basics');
  const [projectData, setProjectData] = useState<ProjectFormData>({
    title: '',
    description: '',
    synopsis: '',
    city: '',
    country: '',
    start_date: '',
    end_date: '',
    visibility: 'public',
    status: 'draft'
  });

  const [roles, setRoles] = useState<RoleFormData[]>([]);
  const [gearRequests, setGearRequests] = useState<GearRequestFormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const steps = [
    { id: 'basics', title: 'Project Basics', description: 'Title, description, and location' },
    { id: 'roles', title: 'Roles Needed', description: 'Define the roles you need' },
    { id: 'gear', title: 'Equipment Needs', description: 'Specify equipment requirements' },
    { id: 'review', title: 'Review & Save', description: 'Review and save your changes' }
  ];

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = await getAuthToken();
        if (!token) {
          setError('You must be logged in to edit projects. Redirecting to login...');
          setTimeout(() => {
            router.push('/auth/signin');
          }, 2000);
          return;
        }

        const response = await fetch(`/api/collab/projects/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (response.ok) {
          setProjectData({
            title: data.project.title || '',
            description: data.project.description || '',
            synopsis: data.project.synopsis || '',
            city: data.project.city || '',
            country: data.project.country || '',
            start_date: data.project.start_date ? format(new Date(data.project.start_date), 'yyyy-MM-dd') : '',
            end_date: data.project.end_date ? format(new Date(data.project.end_date), 'yyyy-MM-dd') : '',
            visibility: data.project.visibility || 'public',
            status: data.project.status || 'draft',
            moodboard_id: data.project.moodboard_id
          });
          
          setRoles(data.project.collab_roles || []);
          setGearRequests(data.project.collab_gear_requests || []);
        } else {
          setError(data.error || 'Failed to fetch project for editing');
        }
      } catch (err) {
        console.error('Error fetching project for editing:', err);
        setError('An unexpected error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId, router]);

  const handleProjectDataChange = (field: keyof ProjectFormData, value: string) => {
    setProjectData(prev => ({ ...prev, [field]: value }));
  };

  const addRole = () => {
    setRoles(prev => [...prev, {
      role_name: '',
      skills_required: [],
      is_paid: false,
      compensation_details: '',
      headcount: 1
    }]);
  };

  const removeRole = (index: number) => {
    setRoles(prev => prev.filter((_, i) => i !== index));
  };

  const updateRole = (index: number, field: keyof RoleFormData, value: any) => {
    setRoles(prev => prev.map((role, i) => 
      i === index ? { ...role, [field]: value } : role
    ));
  };

  const addGearRequest = () => {
    setGearRequests(prev => [...prev, {
      category: '',
      equipment_spec: '',
      quantity: 1,
      borrow_preferred: false,
      retainer_acceptable: false,
      max_daily_rate_cents: undefined
    }]);
  };

  const removeGearRequest = (index: number) => {
    setGearRequests(prev => prev.filter((_, i) => i !== index));
  };

  const updateGearRequest = (index: number, field: keyof GearRequestFormData, value: any) => {
    setGearRequests(prev => prev.map((request, i) => 
      i === index ? { ...request, [field]: value } : request
    ));
  };

  const isStepValid = (step: ProjectStep): boolean => {
    switch (step) {
      case 'basics':
        return projectData.title.trim() !== '';
      case 'roles':
        return roles.length > 0 && roles.every(role => role.role_name.trim() !== '');
      case 'gear':
        return true; // Gear requests are optional
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === 'review') {
      handleSubmit();
    } else {
      const currentIndex = steps.findIndex(step => step.id === currentStep);
      if (currentIndex < steps.length - 1) {
        setCurrentStep(steps[currentIndex + 1].id as ProjectStep);
      }
    }
  };

  const handlePrevious = () => {
    const currentIndex = steps.findIndex(step => step.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1].id as ProjectStep);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    
    try {
      console.log('Getting auth token for project update...');
      const token = await getAuthToken();
      console.log('Auth token result:', token ? 'Token found' : 'No token');
      
      if (!token) {
        console.log('No auth token found, redirecting to login');
        setError('You must be logged in to edit projects. Please log in and try again.');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
        return;
      }

      // Update project basic info
      const projectResponse = await fetch(`/api/collab/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(projectData),
      });

      if (!projectResponse.ok) {
        const errorData = await projectResponse.json();
        throw new Error(errorData.error || 'Failed to update project');
      }

      // Update roles
      for (const role of roles) {
        if (role.id) {
          // Update existing role
          const roleResponse = await fetch(`/api/collab/projects/${projectId}/roles/${role.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(role),
          });
          
          if (!roleResponse.ok) {
            const errorData = await roleResponse.json();
            throw new Error(errorData.error || 'Failed to update role');
          }
        } else {
          // Create new role
          const roleResponse = await fetch(`/api/collab/projects/${projectId}/roles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(role),
          });
          
          if (!roleResponse.ok) {
            const errorData = await roleResponse.json();
            throw new Error(errorData.error || 'Failed to create role');
          }
        }
      }

      // Update gear requests
      for (const gearRequest of gearRequests) {
        if (gearRequest.id) {
          // Update existing gear request
          const gearResponse = await fetch(`/api/collab/projects/${projectId}/gear-requests/${gearRequest.id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(gearRequest),
          });
          
          if (!gearResponse.ok) {
            const errorData = await gearResponse.json();
            throw new Error(errorData.error || 'Failed to update equipment request');
          }
        } else {
          // Create new gear request
          const gearResponse = await fetch(`/api/collab/projects/${projectId}/gear-requests`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(gearRequest),
          });
          
          if (!gearResponse.ok) {
            const errorData = await gearResponse.json();
            throw new Error(errorData.error || 'Failed to create equipment request');
          }
        }
      }

      router.push(`/collaborate/projects/${projectId}`);
    } catch (err) {
      console.error('Error saving project:', err);
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
      return;
    }

    try {
      const token = await getAuthToken();
      if (!token) {
        setError('You must be logged in to delete projects. Please log in and try again.');
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
        return;
      }

      const response = await fetch(`/api/collab/projects/${projectId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete project');
      }

      router.push('/collaborate');
    } catch (err) {
      console.error('Error deleting project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error) {
    // Show special login prompt for authentication errors
    if (error.includes('logged in')) {
      return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">Authentication Required</h1>
                <p className="text-muted-foreground mb-6">
                  You need to be logged in to edit this project.
                </p>
              </div>
              
              <div className="bg-card border border-border rounded-lg p-6">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <h2 className="text-lg font-semibold mb-2">Please Log In</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                      Log in to your account to edit this collaboration project.
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button 
                      onClick={() => router.push('/auth/signin')}
                      className="w-full"
                      size="lg"
                    >
                      Go to Login Page
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      onClick={() => router.back()}
                      className="w-full"
                    >
                      Go Back
                    </Button>
                  </div>
                  
                  <div className="mt-6 text-xs text-muted-foreground">
                    <p>Don't have an account? <a href="/auth/signup" className="text-primary hover:underline">Sign up here</a></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Regular error display for other errors
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Edit Project</h1>
                <p className="text-muted-foreground">Modify your collaboration project</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = currentStep === step.id;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              const isValid = isStepValid(step.id as ProjectStep);

              return (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center">
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium",
                        isActive && "border-primary bg-primary text-primary-foreground",
                        isCompleted && "border-primary bg-primary text-primary-foreground",
                        !isActive && !isCompleted && "border-muted-foreground/50 text-muted-foreground"
                      )}
                    >
                      {isCompleted ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <div className="ml-3 hidden sm:block">
                      <p className={cn(
                        "text-sm font-medium",
                        isActive ? "text-primary" : "text-muted-foreground"
                      )}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="mx-4 h-px w-8 bg-muted-foreground/20" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Step Content */}
          <Card className="mb-6">
            <CardContent className="p-6">
              {currentStep === 'basics' && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="title">Project Title *</Label>
                    <Input
                      id="title"
                      value={projectData.title}
                      onChange={(e) => handleProjectDataChange('title', e.target.value)}
                      placeholder="Enter your project title"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={projectData.description}
                      onChange={(e) => handleProjectDataChange('description', e.target.value)}
                      placeholder="Describe your project"
                      rows={4}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="synopsis">Synopsis</Label>
                    <Textarea
                      id="synopsis"
                      value={projectData.synopsis}
                      onChange={(e) => handleProjectDataChange('synopsis', e.target.value)}
                      placeholder="Brief project summary"
                      rows={2}
                      className="mt-1"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={projectData.city}
                        onChange={(e) => handleProjectDataChange('city', e.target.value)}
                        placeholder="City"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="country">Country</Label>
                      <Input
                        id="country"
                        value={projectData.country}
                        onChange={(e) => handleProjectDataChange('country', e.target.value)}
                        placeholder="Country"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Start Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !projectData.start_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {projectData.start_date ? format(new Date(projectData.start_date), 'PPP') : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={projectData.start_date ? new Date(projectData.start_date) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                handleProjectDataChange('start_date', format(date, 'yyyy-MM-dd'));
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div>
                      <Label>End Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal mt-1",
                              !projectData.end_date && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {projectData.end_date ? format(new Date(projectData.end_date), 'PPP') : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={projectData.end_date ? new Date(projectData.end_date) : undefined}
                            onSelect={(date) => {
                              if (date) {
                                handleProjectDataChange('end_date', format(date, 'yyyy-MM-dd'));
                              }
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="visibility">Visibility</Label>
                      <Select
                        value={projectData.visibility}
                        onValueChange={(value) => handleProjectDataChange('visibility', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Public</SelectItem>
                          <SelectItem value="private">Private</SelectItem>
                          <SelectItem value="invite_only">Invite Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={projectData.status}
                        onValueChange={(value) => handleProjectDataChange('status', value)}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="published">Published</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 'roles' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Project Roles</h3>
                      <p className="text-sm text-muted-foreground">Define the roles you need for this project</p>
                    </div>
                    <Button onClick={addRole} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Role
                    </Button>
                  </div>

                  {roles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No roles added yet</p>
                      <p className="text-sm">Add roles to define what team members you need</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {roles.map((role, index) => (
                        <Card key={index} className="relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Role {index + 1}</CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeRole(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <RoleForm
                              role={role}
                              index={index}
                              onUpdate={updateRole}
                              onRemove={removeRole}
                            />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'gear' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Equipment Requests</h3>
                      <p className="text-sm text-muted-foreground">Specify equipment you need for this project</p>
                    </div>
                    <Button onClick={addGearRequest} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Equipment
                    </Button>
                  </div>

                  {gearRequests.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>No equipment requests added yet</p>
                      <p className="text-sm">Add equipment requests to specify what gear you need</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {gearRequests.map((request, index) => (
                        <Card key={index} className="relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-base">Equipment Request {index + 1}</CardTitle>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeGearRequest(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div>
                              <Label htmlFor={`category-${index}`}>Category</Label>
                              <Input
                                id={`category-${index}`}
                                value={request.category}
                                onChange={(e) => updateGearRequest(index, 'category', e.target.value)}
                                placeholder="e.g., Camera, Drone, Lighting"
                                className="mt-1"
                              />
                            </div>
                            
                            <div>
                              <Label htmlFor={`equipment-spec-${index}`}>Equipment Specification</Label>
                              <Textarea
                                id={`equipment-spec-${index}`}
                                value={request.equipment_spec}
                                onChange={(e) => updateGearRequest(index, 'equipment_spec', e.target.value)}
                                placeholder="Describe the specific equipment needed"
                                rows={3}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                              <Input
                                id={`quantity-${index}`}
                                type="number"
                                min="1"
                                value={request.quantity}
                                onChange={(e) => updateGearRequest(index, 'quantity', parseInt(e.target.value) || 1)}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label htmlFor={`max-daily-rate-${index}`}>Max Daily Rate (€)</Label>
                              <div className="relative mt-1">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">€</span>
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  placeholder="0.00"
                                  value={request.max_daily_rate_cents ? (request.max_daily_rate_cents / 100).toFixed(2) : ''}
                                  onChange={(e) => {
                                    const euroValue = parseFloat(e.target.value) || 0;
                                    const centsValue = Math.round(euroValue * 100);
                                    updateGearRequest(index, 'max_daily_rate_cents', centsValue > 0 ? centsValue : undefined);
                                  }}
                                  className="pl-8"
                                />
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                Enter the maximum daily rate in euros
                              </p>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`borrow-preferred-${index}`}
                                  checked={request.borrow_preferred}
                                  onCheckedChange={(checked) => updateGearRequest(index, 'borrow_preferred', checked)}
                                />
                                <Label htmlFor={`borrow-preferred-${index}`}>Borrow preferred</Label>
                              </div>

                              <div className="flex items-center space-x-2">
                                <Switch
                                  id={`retainer-acceptable-${index}`}
                                  checked={request.retainer_acceptable}
                                  onCheckedChange={(checked) => updateGearRequest(index, 'retainer_acceptable', checked)}
                                />
                                <Label htmlFor={`retainer-acceptable-${index}`}>Retainer acceptable</Label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {currentStep === 'review' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Review & Publish Your Project</h3>
                    <p className="text-muted-foreground mb-6">
                      Review your project details and choose how to save your changes.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Project Information</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div><strong>Title:</strong> {projectData.title}</div>
                        <div><strong>Description:</strong> {projectData.description}</div>
                        {projectData.synopsis && <div><strong>Synopsis:</strong> {projectData.synopsis}</div>}
                        <div><strong>Location:</strong> {projectData.city && projectData.country ? `${projectData.city}, ${projectData.country}` : 'Not specified'}</div>
                        <div><strong>Dates:</strong> {projectData.start_date && projectData.end_date ? `${format(new Date(projectData.start_date), 'PPP')} - ${format(new Date(projectData.end_date), 'PPP')}` : 'Not specified'}</div>
                        <div><strong>Visibility:</strong> {projectData.visibility}</div>
                        <div><strong>Current Status:</strong> 
                          <Badge variant={projectData.status === 'published' ? 'default' : 'secondary'} className="ml-2">
                            {projectData.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Project Status</CardTitle>
                        <CardDescription>Choose how to save your project</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="status">Project Status:</Label>
                          <Select
                            value={projectData.status}
                            onValueChange={(value) => setProjectData(prev => ({ ...prev, status: value as ProjectFormData['status'] }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="draft">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                  <span>Save as Draft</span>
                                </div>
                              </SelectItem>
                              <SelectItem value="published">
                                <div className="flex items-center space-x-2">
                                  <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                                  <span>Publish Project</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                          {projectData.status === 'draft' ? (
                            <div>
                              <p className="font-medium text-yellow-600">📝 Draft Mode</p>
                              <p>• Project will be saved as a draft and not visible to other users</p>
                              <p>• You can continue editing and publish later</p>
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-primary-600">🚀 Published Mode</p>
                              <p>• Project will be published and visible to other users for collaboration</p>
                              <p>• Users can apply to roles and respond to equipment requests</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Roles ({roles.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {roles.length === 0 ? (
                          <p className="text-muted-foreground">No roles defined</p>
                        ) : (
                          <div className="space-y-2">
                            {roles.map((role, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="font-medium">{role.role_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  Headcount: {role.headcount} • Skills: {role.skills_required.join(', ')}
                                  {role.is_paid && ' • Paid position'}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Equipment Requests ({gearRequests.length})</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {gearRequests.length === 0 ? (
                          <p className="text-muted-foreground">No equipment requests defined</p>
                        ) : (
                          <div className="space-y-2">
                            {gearRequests.map((request, index) => (
                              <div key={index} className="p-3 border rounded-lg">
                                <div className="font-medium">{request.category}</div>
                                <div className="text-sm text-muted-foreground">
                                  Quantity: {request.quantity} • {request.borrow_preferred ? 'Borrow preferred' : 'Purchase preferred'}
                                  {request.max_daily_rate_cents && ` • Max rate: €${(request.max_daily_rate_cents / 100).toFixed(2)}/day`}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 'basics'}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex items-center space-x-2">
              {currentStep === 'review' ? (
                <div className="flex space-x-3">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setProjectData(prev => ({ ...prev, status: 'draft' as ProjectFormData['status'] }));
                      handleSubmit();
                    }}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save as Draft'}
                  </Button>
                  
                  <Button 
                    onClick={() => {
                      setProjectData(prev => ({ ...prev, status: 'published' as ProjectFormData['status'] }));
                      handleSubmit();
                    }}
                    disabled={saving}
                    size="lg"
                  >
                    {saving ? 'Publishing...' : 'Publish Project'}
                  </Button>
                </div>
              ) : (
                <Button
                  onClick={handleNext}
                  disabled={!isStepValid(currentStep)}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}