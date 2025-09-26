'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  FileText, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Download,
  Share2,
  Calendar,
  Wand2,
  Users
} from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { supabase } from '../../lib/supabase';

interface Treatment {
  id: string;
  title: string;
  format: string;
  theme: string;
  status: string;
  created_at: string;
  updated_at: string;
  gigs?: {
    id: string;
    title: string;
    status: string;
  };
  moodboards?: {
    id: string;
    title: string;
  };
}

interface TreatmentsResponse {
  treatments: Treatment[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const TREATMENT_FORMATS = {
  film_tv: { label: 'Film / TV', icon: '🎬' },
  documentary: { label: 'Documentary', icon: '📽️' },
  commercial_brand: { label: 'Commercial / Brand', icon: '📺' },
  music_video: { label: 'Music Video', icon: '🎵' },
  short_social: { label: 'Short Social', icon: '📱' },
  corporate_promo: { label: 'Corporate / Promo', icon: '🏢' }
};

const TREATMENT_STATUSES = {
  draft: { label: 'Draft', color: 'bg-primary/10 text-primary' },
  published: { label: 'Published', color: 'bg-primary/10 text-primary' },
  archived: { label: 'Archived', color: 'bg-muted text-muted-foreground' }
};

export default function TreatmentsPage() {
  const { user } = useAuth();
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    format: 'all',
    status: 'all'
  });

  const fetchTreatments = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString(),
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
        setError('Please sign in to view your treatments');
        return;
      }

      const response = await fetch(`/api/treatments?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data: TreatmentsResponse = await response.json();

      if (response.ok) {
        setTreatments(data.treatments);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch treatments');
      }
    } catch (err) {
      console.error('Error fetching treatments:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTreatments();
    }
  }, [user, filters]);

  const handleFiltersChange = (newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      format: 'all',
      status: 'all'
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-4 text-foreground">Sign In Required</h2>
            <p className="text-muted-foreground mb-4">Please sign in to view your treatments.</p>
            <Link href="/auth/signin">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl p-8 border border-border">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-5xl font-bold text-primary mb-2">Treatments</h1>
                <p className="text-xl text-muted-foreground">Create and manage professional treatments</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/treatments/create">
                <Button size="lg" className="px-8 py-3 text-lg font-semibold">
                  <Plus className="h-5 w-5 mr-2" />
                  Create Treatment
                </Button>
              </Link>
            </div>
          </div>
        </div>

        <main>
        <div className="space-y-6">
          {/* Smart Filters Bar */}
          <Card className="mb-8">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                {/* Search and Controls */}
                <div className="flex gap-3 items-center w-full lg:w-auto">
                  <div className="relative flex-1 lg:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search treatments..."
                      value={filters.search}
                      onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                      className="pl-10 w-full lg:w-64"
                    />
                  </div>
                  
                  <Select value={filters.format} onValueChange={(value) => handleFiltersChange({ ...filters, format: value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All formats" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All formats</SelectItem>
                      {Object.entries(TREATMENT_FORMATS).map(([key, format]) => (
                        <SelectItem key={key} value={key}>
                          <span className="mr-2">{format.icon}</span>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={filters.status} onValueChange={(value) => handleFiltersChange({ ...filters, status: value })}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      {Object.entries(TREATMENT_STATUSES).map(([key, status]) => (
                        <SelectItem key={key} value={key}>
                          {status.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results Header */}
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium text-foreground">
              {loading ? 'Loading...' : `${pagination.total} treatments found`}
            </h2>
            {!loading && pagination.total > 0 && (
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.pages}
              </span>
            )}
          </div>

          {/* Treatments Grid */}
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
              <Button onClick={() => fetchTreatments()} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : treatments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No treatments found</h3>
              <p className="text-muted-foreground mb-4">
                Create your first treatment to get started with professional project presentations.
              </p>
              <Link href="/treatments/create">
                <Button>Create Treatment</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {treatments.map((treatment) => (
                <Card key={treatment.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg mb-2">
                          <Link 
                            href={`/treatments/${treatment.id}/edit`}
                            className="hover:text-primary transition-colors"
                          >
                            {treatment.title}
                          </Link>
                        </CardTitle>
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge className={TREATMENT_STATUSES[treatment.status as keyof typeof TREATMENT_STATUSES]?.color}>
                            {TREATMENT_STATUSES[treatment.status as keyof typeof TREATMENT_STATUSES]?.label}
                          </Badge>
                          <Badge variant="secondary">
                            <span className="mr-1">
                              {TREATMENT_FORMATS[treatment.format as keyof typeof TREATMENT_FORMATS]?.icon}
                            </span>
                            {TREATMENT_FORMATS[treatment.format as keyof typeof TREATMENT_FORMATS]?.label}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-3">
                      {/* Related Project */}
                      {treatment.gigs && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Users className="h-4 w-4 mr-2" />
                          <span>From gig: {treatment.gigs.title}</span>
                        </div>
                      )}
                      
                      {/* Moodboard */}
                      {treatment.moodboards && (
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Wand2 className="h-4 w-4 mr-2" />
                          <span>From moodboard: {treatment.moodboards.title}</span>
                        </div>
                      )}
                      
                      {/* Dates */}
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Updated {formatDate(treatment.updated_at)}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex space-x-2">
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Export
                          </Button>
                          <Button size="sm" variant="outline">
                            <Share2 className="h-3 w-3 mr-1" />
                            Share
                          </Button>
                        </div>
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
                onClick={() => fetchTreatments(pagination.page - 1)}
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
                      onClick={() => fetchTreatments(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchTreatments(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
        </main>
      </div>
    </div>
  );
}
