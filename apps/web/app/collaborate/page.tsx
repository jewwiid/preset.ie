'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Users, Camera, Plus, Search, Filter, Mail } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '../../lib/supabase';
import { ROLE_TYPES, GEAR_CATEGORIES, PROJECT_STATUSES, SORT_OPTIONS, COMMON_COUNTRIES } from './filter-constants';
import { InvitationsList } from '@/components/collaborate/InvitationsList';

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
    handle: string;
    display_name: string;
    avatar_url?: string;
    verified_id?: boolean;
  };
  collab_roles: Array<{
    id: string;
    role_name: string;
    skills_required: string[];
    is_paid: boolean;
    headcount: number;
    status: string;
  }>;
  collab_gear_requests: Array<{
    id: string;
    category: string;
    equipment_spec?: string;
    quantity: number;
    status: string;
  }>;
  collab_participants: Array<{
    id: string;
    role_type: string;
    status: string;
    user: {
      id: string;
      handle: string;
      display_name: string;
      avatar_url?: string;
    };
  }>;
}

interface ProjectsResponse {
  projects: Project[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

function CollaboratePageContent() {
  const searchParams = useSearchParams();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: searchParams?.get('search') || '',
    status: searchParams?.get('status') || 'all',
    city: searchParams?.get('city') || '',
    country: searchParams?.get('country') || '',
    role_type: searchParams?.get('role_type') || '',
    gear_category: searchParams?.get('gear_category') || ''
  });
  const [sortBy, setSortBy] = useState(searchParams?.get('sort_by') || 'created_at');

  const fetchProjects = async (page = 1, view = 'all') => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        view: view,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value !== undefined && value !== '' && value !== 'all'
          )
        )
      });

      // Check if supabase is available
      if (!supabase) {
        setError('Database connection not available');
        return;
      }

      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Please sign in to view collaboration projects');
        return;
      }

      const response = await fetch(`/api/collab/projects?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data: ProjectsResponse = await response.json();

      if (response.ok) {
        setProjects(data.projects);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch projects');
      }
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects(1, activeTab);
  }, [filters, sortBy, activeTab]);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      city: '',
      country: '',
      role_type: '',
      gear_category: ''
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    fetchProjects(page);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-primary/10 text-primary';
      case 'in_progress': return 'bg-secondary/10 text-secondary';
      case 'completed': return 'bg-muted text-muted-foreground';
      case 'cancelled': return 'bg-destructive/10 text-destructive';
      default: return 'bg-accent/10 text-accent';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-foreground">Collaborate</h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                Beta
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/collaborate/create">
                <Button className="inline-flex items-center">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="all">All Projects</TabsTrigger>
            <TabsTrigger value="my_projects">My Projects</TabsTrigger>
            <TabsTrigger value="invited">
              <Mail className="h-4 w-4 mr-2" />
              Invitations
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Filter className="h-5 w-5 mr-2" />
                  Filters
                </CardTitle>
              </CardHeader>
              <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Search
                  </label>
                  <Input
                    placeholder="Search projects..."
                    value={filters.search}
                    onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Status
                  </label>
                  <Select value={filters.status} onValueChange={(value) => handleFiltersChange({ ...filters, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      {PROJECT_STATUSES.map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    City
                  </label>
                  <Input
                    placeholder="City"
                    value={filters.city}
                    onChange={(e) => handleFiltersChange({ ...filters, city: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Country
                  </label>
                  <Select value={filters.country} onValueChange={(value) => handleFiltersChange({ ...filters, country: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All countries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All countries</SelectItem>
                      {COMMON_COUNTRIES.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Role Type
                  </label>
                  <Select value={filters.role_type} onValueChange={(value) => handleFiltersChange({ ...filters, role_type: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All roles</SelectItem>
                      {ROLE_TYPES.map((role) => (
                        <SelectItem key={role} value={role}>
                          {role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Gear Category
                  </label>
                  <Select value={filters.gear_category} onValueChange={(value) => handleFiltersChange({ ...filters, gear_category: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All gear" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All gear</SelectItem>
                      {GEAR_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex justify-between">
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear Filters
                </Button>
                
                <div className="flex items-center space-x-4">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SORT_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              </CardContent>
            </Card>

            {/* Results Header */}
            <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-foreground">
              {loading ? 'Loading...' : `${pagination.total} projects found`}
            </h2>
            {!loading && pagination.total > 0 && (
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
            )}
          </div>

          {/* Projects Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">{error}</p>
              <Button onClick={() => fetchProjects()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                No projects match your criteria. Try adjusting your filters or create a new project.
              </p>
              <Link href="/collaborate/create">
                <Button>Create Project</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          <Link 
                            href={`/collaborate/projects/${project.id}`}
                            className="hover:text-primary transition-colors"
                          >
                            {project.title}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                          {project.creator.verified_id && (
                            <Badge variant="secondary">Verified</Badge>
                          )}
                        </div>
                      </div>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={project.creator.avatar_url} />
                        <AvatarFallback>
                          {project.creator.display_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    {project.description && (
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="space-y-3">
                      {/* Location */}
                      {(project.city || project.country) && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4 mr-2" />
                          {[project.city, project.country].filter(Boolean).join(', ')}
                        </div>
                      )}
                      
                      {/* Dates */}
                      {(project.start_date || project.end_date) && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-4 w-4 mr-2" />
                          {project.start_date && formatDate(project.start_date)}
                          {project.start_date && project.end_date && ' - '}
                          {project.end_date && formatDate(project.end_date)}
                        </div>
                      )}
                      
                      {/* Roles */}
                      {project.collab_roles.length > 0 && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-2" />
                          {project.collab_roles.length} role{project.collab_roles.length !== 1 ? 's' : ''} needed
                        </div>
                      )}
                      
                      {/* Gear Requests */}
                      {project.collab_gear_requests.length > 0 && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Camera className="h-4 w-4 mr-2" />
                          {project.collab_gear_requests.length} gear request{project.collab_gear_requests.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-muted-foreground">
                          <span>by {project.creator.display_name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(project.created_at)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

            {/* Pagination */}
            {!loading && pagination.pages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                    const pageNum = i + 1;
                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handlePageChange(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my_projects" className="space-y-6">
            {/* Results Header */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-foreground">
                {loading ? 'Loading...' : `${pagination.total} project${pagination.total !== 1 ? 's' : ''}`}
              </h2>
            </div>

            {/* Projects Grid (same as all projects) */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-3 bg-muted rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-3 bg-muted rounded"></div>
                        <div className="h-3 bg-muted rounded w-5/6"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-destructive">{error}</p>
                <Button onClick={() => fetchProjects(1, 'my_projects')} className="mt-4">
                  Try Again
                </Button>
              </div>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No projects yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't created any projects yet. Start collaborating by creating your first project!
                </p>
                <Link href="/collaborate/create">
                  <Button>Create Project</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <Card key={project.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg mb-2">
                            <Link 
                              href={`/collaborate/projects/${project.id}`}
                              className="hover:text-primary transition-colors"
                            >
                              {project.title}
                            </Link>
                          </CardTitle>
                          <div className="flex items-center space-x-2 mb-2">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="outline">
                              {project.visibility}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {project.description && (
                        <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
                          {project.description}
                        </p>
                      )}
                      
                      <div className="space-y-3">
                        {(project.city || project.country) && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <MapPin className="h-4 w-4 mr-2" />
                            {[project.city, project.country].filter(Boolean).join(', ')}
                          </div>
                        )}
                        
                        {project.collab_roles.length > 0 && (
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Users className="h-4 w-4 mr-2" />
                            {project.collab_roles.length} role{project.collab_roles.length !== 1 ? 's' : ''} needed
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          Created {formatDate(project.created_at)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="invited" className="space-y-6">
            <InvitationsList />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

export default function CollaboratePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CollaboratePageContent />
    </Suspense>
  );
}
