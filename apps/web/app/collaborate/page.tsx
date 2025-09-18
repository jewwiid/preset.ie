'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Calendar, MapPin, Users, Camera, Plus, Search, Filter } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

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
      username: string;
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
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    city: searchParams.get('city') || '',
    country: searchParams.get('country') || '',
    role_type: searchParams.get('role_type') || '',
    gear_category: searchParams.get('gear_category') || ''
  });
  const [sortBy, setSortBy] = useState(searchParams.get('sort_by') || 'created_at');

  const fetchProjects = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
        sort_by: sortBy,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => 
            value !== undefined && value !== ''
          )
        )
      });

      const response = await fetch(`/api/collab/projects?${params}`);
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
    fetchProjects();
  }, [filters, sortBy]);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      status: '',
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
      case 'published': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-gray-900">Collaborate</h1>
              <span className="ml-3 px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded-full">
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
        <div className="space-y-6">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search
                  </label>
                  <Input
                    placeholder="Search projects..."
                    value={filters.search}
                    onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select value={filters.status} onValueChange={(value) => handleFiltersChange({ ...filters, status: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <Input
                    placeholder="City"
                    value={filters.city}
                    onChange={(e) => handleFiltersChange({ ...filters, city: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <Input
                    placeholder="Country"
                    value={filters.country}
                    onChange={(e) => handleFiltersChange({ ...filters, country: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role Type
                  </label>
                  <Input
                    placeholder="Photographer, Model..."
                    value={filters.role_type}
                    onChange={(e) => handleFiltersChange({ ...filters, role_type: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Gear Category
                  </label>
                  <Input
                    placeholder="Camera, Lens..."
                    value={filters.gear_category}
                    onChange={(e) => handleFiltersChange({ ...filters, gear_category: e.target.value })}
                  />
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
                      <SelectItem value="created_at">Newest First</SelectItem>
                      <SelectItem value="start_date">Start Date</SelectItem>
                      <SelectItem value="title">Title A-Z</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-gray-900">
              {loading ? 'Loading...' : `${pagination.total} projects found`}
            </h2>
            {!loading && pagination.total > 0 && (
              <span className="text-sm text-gray-500">
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
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600">{error}</p>
              <Button onClick={() => fetchProjects()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : projects.length === 0 ? (
            <div className="text-center py-12">
              <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
              <p className="text-gray-500 mb-4">
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
                            className="hover:text-blue-600 transition-colors"
                          >
                            {project.title}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={getStatusColor(project.status)}>
                            {project.status.replace('_', ' ')}
                          </Badge>
                          {project.creator.verified && (
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
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {project.description}
                      </p>
                    )}
                    
                    <div className="space-y-3">
                      {/* Location */}
                      {(project.city || project.country) && (
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-2" />
                          {[project.city, project.country].filter(Boolean).join(', ')}
                        </div>
                      )}
                      
                      {/* Dates */}
                      {(project.start_date || project.end_date) && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Calendar className="h-4 w-4 mr-2" />
                          {project.start_date && formatDate(project.start_date)}
                          {project.start_date && project.end_date && ' - '}
                          {project.end_date && formatDate(project.end_date)}
                        </div>
                      )}
                      
                      {/* Roles */}
                      {project.collab_roles.length > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-2" />
                          {project.collab_roles.length} role{project.collab_roles.length !== 1 ? 's' : ''} needed
                        </div>
                      )}
                      
                      {/* Gear Requests */}
                      {project.collab_gear_requests.length > 0 && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Camera className="h-4 w-4 mr-2" />
                          {project.collab_gear_requests.length} gear request{project.collab_gear_requests.length !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-500">
                          <span>by {project.creator.display_name}</span>
                          {project.creator.rating && (
                            <span className="ml-2">⭐ {project.creator.rating.toFixed(1)}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
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
        </div>
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
