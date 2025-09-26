'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft, ArrowRight, Check, Users } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface ProjectFormData {
  title: string;
  description: string;
  synopsis: string;
  city: string;
  country: string;
  start_date: string;
  end_date: string;
  visibility: 'public' | 'private' | 'invite_only';
  moodboard_id?: string;
}

interface RoleFormData {
  role_name: string;
  skills_required: string[];
  is_paid: boolean;
  compensation_details: string;
  headcount: number;
}

interface GearRequestFormData {
  category: string;
  equipment_spec: string;
  quantity: number;
  borrow_preferred: boolean;
  retainer_acceptable: boolean;
  max_daily_rate_cents?: number;
}

type ProjectStep = 'basics' | 'roles' | 'gear' | 'review';

const SKILL_OPTIONS = [
  'Photography', 'Videography', 'Modeling', 'Styling', 'Makeup', 'Hair',
  'Lighting', 'Sound', 'Editing', 'Directing', 'Producing', 'Writing',
  'Graphic Design', 'Web Design', 'Social Media', 'Marketing'
];

const GEAR_CATEGORIES = [
  'Camera', 'Lens', 'Lighting', 'Audio', 'Tripod', 'Gimbal', 'Drone',
  'Accessories', 'Studio Equipment', 'Props', 'Costumes', 'Other'
];

function CreateProjectPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentStep, setCurrentStep] = useState<ProjectStep>('basics');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [projectData, setProjectData] = useState<ProjectFormData>({
    title: '',
    description: '',
    synopsis: '',
    city: '',
    country: '',
    start_date: '',
    end_date: '',
    visibility: 'public'
  });

  const [roles, setRoles] = useState<RoleFormData[]>([]);
  const [gearRequests, setGearRequests] = useState<GearRequestFormData[]>([]);

  // Handle prefilled data from equipment request
  useEffect(() => {
    const fromEquipmentRequest = searchParams.get('from') === 'equipment-request';
    if (fromEquipmentRequest) {
      const equipmentRequestData = sessionStorage.getItem('equipmentRequestData');
      if (equipmentRequestData) {
        try {
          const data = JSON.parse(equipmentRequestData);
          
          // Prefill project data
          setProjectData(prev => ({
            ...prev,
            title: data.title || '',
            description: data.description || '',
            city: data.location_city || '',
            country: data.location_country || '',
            start_date: data.rental_start_date || '',
            end_date: data.rental_end_date || ''
          }));

          // Prefill gear request if equipment type is specified
          if (data.equipment_type || data.category) {
            setGearRequests([{
              category: data.category || 'Other',
              equipment_spec: data.equipment_type || '',
              quantity: 1,
              borrow_preferred: true,
              retainer_acceptable: false,
              max_daily_rate_cents: data.max_daily_rate_cents
            }]);
          }

          // Clear the stored data
          sessionStorage.removeItem('equipmentRequestData');
        } catch (error) {
          console.error('Error parsing equipment request data:', error);
        }
      }
    }
  }, [searchParams]);

  const steps = [
    { id: 'basics', title: 'Project Basics', description: 'Title, description, and location' },
    { id: 'roles', title: 'Roles Needed', description: 'Define the roles you need' },
    { id: 'gear', title: 'Equipment Needs', description: 'Specify equipment requirements' },
    { id: 'review', title: 'Review & Publish', description: 'Review and publish your project' }
  ];

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

  const updateRole = (index: number, field: keyof RoleFormData, value: any) => {
    setRoles(prev => prev.map((role, i) => 
      i === index ? { ...role, [field]: value } : role
    ));
  };

  const removeRole = (index: number) => {
    setRoles(prev => prev.filter((_, i) => i !== index));
  };

  const addGearRequest = () => {
    setGearRequests(prev => [...prev, {
      category: '',
      equipment_spec: '',
      quantity: 1,
      borrow_preferred: true,
      retainer_acceptable: false,
      max_daily_rate_cents: undefined
    }]);
  };

  const updateGearRequest = (index: number, field: keyof GearRequestFormData, value: any) => {
    setGearRequests(prev => prev.map((request, i) => 
      i === index ? { ...request, [field]: value } : request
    ));
  };

  const removeGearRequest = (index: number) => {
    setGearRequests(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = () => {
    switch (currentStep) {
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
    setLoading(true);
    setError(null);

    try {
      // Create project
      const projectResponse = await fetch('/api/collab/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(projectData)
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      const { project } = await projectResponse.json();

      // Create roles
      for (const role of roles) {
        await fetch(`/api/collab/projects/${project.id}/roles`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
          },
          body: JSON.stringify(role)
        });
      }

      // Create gear requests
      for (const gearRequest of gearRequests) {
        await fetch(`/api/collab/projects/${project.id}/gear-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
          },
          body: JSON.stringify(gearRequest)
        });
      }

      router.push(`/collaborate/projects/${project.id}`);
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'basics':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="title">Project Title *</Label>
              <Input
                id="title"
                placeholder="Enter your project title"
                value={projectData.title}
                onChange={(e) => handleProjectDataChange('title', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your project in detail"
                value={projectData.description}
                onChange={(e) => handleProjectDataChange('description', e.target.value)}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="synopsis">Synopsis</Label>
              <Textarea
                id="synopsis"
                placeholder="Brief synopsis of your project"
                value={projectData.synopsis}
                onChange={(e) => handleProjectDataChange('synopsis', e.target.value)}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="City"
                  value={projectData.city}
                  onChange={(e) => handleProjectDataChange('city', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  placeholder="Country"
                  value={projectData.country}
                  onChange={(e) => handleProjectDataChange('country', e.target.value)}
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
                        "w-full justify-start text-left font-normal",
                        !projectData.start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {projectData.start_date ? format(new Date(projectData.start_date), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={projectData.start_date ? new Date(projectData.start_date) : undefined}
                      onSelect={(date) => handleProjectDataChange('start_date', date ? date.toISOString().split('T')[0] : '')}
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
                        "w-full justify-start text-left font-normal",
                        !projectData.end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {projectData.end_date ? format(new Date(projectData.end_date), "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={projectData.end_date ? new Date(projectData.end_date) : undefined}
                      onSelect={(date) => handleProjectDataChange('end_date', date ? date.toISOString().split('T')[0] : '')}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={projectData.visibility} onValueChange={(value) => handleProjectDataChange('visibility', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public - Anyone can see and apply</SelectItem>
                  <SelectItem value="private">Private - Only invited users</SelectItem>
                  <SelectItem value="invite_only">Invite Only - By invitation only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'roles':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Project Roles</h3>
              <Button onClick={addRole} variant="outline">
                Add Role
              </Button>
            </div>

            {roles.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground-500">
                <p>No roles added yet. Click "Add Role" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {roles.map((role, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Role {index + 1}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeRole(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Role Name *</Label>
                        <Input
                          placeholder="e.g., Photographer, Model, Stylist"
                          value={role.role_name}
                          onChange={(e) => updateRole(index, 'role_name', e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Required Skills</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {SKILL_OPTIONS.map((skill) => (
                            <Button
                              key={skill}
                              variant={role.skills_required.includes(skill) ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => {
                                const newSkills = role.skills_required.includes(skill)
                                  ? role.skills_required.filter(s => s !== skill)
                                  : [...role.skills_required, skill];
                                updateRole(index, 'skills_required', newSkills);
                              }}
                            >
                              {skill}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Headcount</Label>
                          <Input
                            type="number"
                            min="1"
                            value={role.headcount}
                            onChange={(e) => updateRole(index, 'headcount', parseInt(e.target.value))}
                          />
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`paid-${index}`}
                            checked={role.is_paid}
                            onChange={(e) => updateRole(index, 'is_paid', e.target.checked)}
                          />
                          <Label htmlFor={`paid-${index}`}>This role is paid</Label>
                        </div>
                      </div>

                      {role.is_paid && (
                        <div>
                          <Label>Compensation Details</Label>
                          <Textarea
                            placeholder="Describe compensation, rates, etc."
                            value={role.compensation_details}
                            onChange={(e) => updateRole(index, 'compensation_details', e.target.value)}
                            rows={2}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'gear':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Equipment Needs</h3>
              <Button onClick={addGearRequest} variant="outline">
                Add Equipment Request
              </Button>
            </div>

            {gearRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground-500">
                <p>No equipment requests added yet. Click "Add Equipment Request" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {gearRequests.map((request, index) => (
                  <Card key={index}>
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Equipment Request {index + 1}</CardTitle>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeGearRequest(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label>Category *</Label>
                        <Select value={request.category} onValueChange={(value) => updateGearRequest(index, 'category', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {GEAR_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Equipment Specification</Label>
                        <Textarea
                          placeholder="Describe the specific equipment needed"
                          value={request.equipment_spec}
                          onChange={(e) => updateGearRequest(index, 'equipment_spec', e.target.value)}
                          rows={2}
                        />
                      </div>

                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          value={request.quantity}
                          onChange={(e) => updateGearRequest(index, 'quantity', parseInt(e.target.value))}
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`borrow-${index}`}
                            checked={request.borrow_preferred}
                            onChange={(e) => updateGearRequest(index, 'borrow_preferred', e.target.checked)}
                          />
                          <Label htmlFor={`borrow-${index}`}>Borrowing preferred</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`retainer-${index}`}
                            checked={request.retainer_acceptable}
                            onChange={(e) => updateGearRequest(index, 'retainer_acceptable', e.target.checked)}
                          />
                          <Label htmlFor={`retainer-${index}`}>Retainer acceptable</Label>
                        </div>
                      </div>

                      <div>
                        <Label>Max Daily Rate (cents)</Label>
                        <Input
                          type="number"
                          placeholder="Maximum daily rate in cents"
                          value={request.max_daily_rate_cents || ''}
                          onChange={(e) => updateGearRequest(index, 'max_daily_rate_cents', e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        );

      case 'review':
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium">Review Your Project</h3>
            
            <Card>
              <CardHeader>
                <CardTitle>{projectData.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {projectData.description && (
                  <div>
                    <Label className="font-medium">Description</Label>
                    <p className="text-muted-foreground-600">{projectData.description}</p>
                  </div>
                )}
                
                {(projectData.city || projectData.country) && (
                  <div>
                    <Label className="font-medium">Location</Label>
                    <p className="text-muted-foreground-600">
                      {[projectData.city, projectData.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
                
                {(projectData.start_date || projectData.end_date) && (
                  <div>
                    <Label className="font-medium">Dates</Label>
                    <p className="text-muted-foreground-600">
                      {projectData.start_date && format(new Date(projectData.start_date), "PPP")}
                      {projectData.start_date && projectData.end_date && ' - '}
                      {projectData.end_date && format(new Date(projectData.end_date), "PPP")}
                    </p>
                  </div>
                )}
                
                <div>
                  <Label className="font-medium">Visibility</Label>
                  <p className="text-muted-foreground-600 capitalize">{projectData.visibility.replace('_', ' ')}</p>
                </div>
              </CardContent>
            </Card>

            {roles.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Roles ({roles.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {roles.map((role, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted-50 rounded">
                        <div>
                          <span className="font-medium">{role.role_name}</span>
                          {role.skills_required.length > 0 && (
                            <span className="text-sm text-muted-foreground-500 ml-2">
                              ({role.skills_required.join(', ')})
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground-500">
                          {role.headcount} position{role.headcount !== 1 ? 's' : ''}
                          {role.is_paid && ' • Paid'}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {gearRequests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Equipment Requests ({gearRequests.length})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {gearRequests.map((request, index) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-muted-50 rounded">
                        <div>
                          <span className="font-medium">{request.category}</span>
                          {request.equipment_spec && (
                            <span className="text-sm text-muted-foreground-500 ml-2">
                              ({request.equipment_spec})
                            </span>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground-500">
                          {request.quantity} item{request.quantity !== 1 ? 's' : ''}
                          {request.max_daily_rate_cents && ` • Max €${(request.max_daily_rate_cents / 100).toFixed(2)}/day`}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl p-8 border border-border">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-5xl font-bold text-primary mb-2">Create Project</h1>
                <p className="text-xl text-muted-foreground">Build your creative team and collaborate on amazing projects</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={() => router.push('/collaborate')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
          </div>
        </div>

        <main className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium",
                    isActive ? "bg-primary-600 text-primary-foreground" : 
                    isCompleted ? "bg-primary-600 text-primary-foreground" : 
                    "bg-muted-200 text-muted-foreground-600"
                  )}>
                    {isCompleted ? <Check className="h-4 w-4" /> : index + 1}
                  </div>
                  <div className="ml-3">
                    <p className={cn(
                      "text-sm font-medium",
                      isActive ? "text-primary-600" : "text-muted-foreground-500"
                    )}>
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground-400">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-px bg-muted-200 mx-4" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <Card>
          <CardContent className="p-6">
            {searchParams.get('from') === 'equipment-request' && (
              <div className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-md">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <p className="text-primary font-medium">Form prefilled from your equipment request</p>
                </div>
                <p className="text-sm text-primary/80 mt-1">
                  Your equipment request details have been automatically filled in. You can modify any fields as needed.
                </p>
              </div>
            )}

            {error && (
              <div className="mb-6 p-4 bg-destructive-50 border border-destructive-200 rounded-md">
                <p className="text-destructive-600">{error}</p>
              </div>
            )}
            
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 'basics'}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <Button
            onClick={handleNext}
            disabled={!canProceed() || loading}
          >
            {loading ? 'Creating...' : 
             currentStep === 'review' ? 'Create Project' : 
             'Next'}
            {currentStep !== 'review' && <ArrowRight className="h-4 w-4 ml-2" />}
          </Button>
        </div>
        </main>
      </div>
    </div>
  );
}

export default function CreateProjectPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateProjectPageContent />
    </Suspense>
  );
}
