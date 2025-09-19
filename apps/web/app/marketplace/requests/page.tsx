'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EquipmentRequestCard from '@/components/marketplace/EquipmentRequestCard';
import CreateRequestModal from '@/components/marketplace/CreateRequestModal';
import { Plus, Search, Filter, AlertCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabase';

interface EquipmentRequest {
  id: string;
  title: string;
  description?: string;
  category?: string;
  equipment_type?: string;
  request_type: 'rent' | 'buy' | 'both';
  rental_start_date?: string;
  rental_end_date?: string;
  max_daily_rate_cents?: number;
  max_total_cents?: number;
  max_purchase_price_cents?: number;
  location_city?: string;
  location_country?: string;
  urgent: boolean;
  verified_users_only: boolean;
  min_rating: number;
  expires_at: string;
  created_at: string;
  response_count: number;
  requester: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
    verified_id?: string;
    rating?: number;
  };
}

const CATEGORIES = [
  'camera',
  'lens', 
  'lighting',
  'audio',
  'accessories',
  'other'
];

export default function EquipmentRequestsPage() {
  const [requests, setRequests] = useState<EquipmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState('');
  const [urgentOnly, setUrgentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const fetchRequests = async (pageNum = 1, reset = false) => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '20'
      });
      
      if (selectedCategory && selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedCity) params.append('city', selectedCity);
      if (urgentOnly) params.append('urgent', 'true');

      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setError('Please sign in to view marketplace requests');
        return;
      }

      const response = await fetch(`/api/marketplace/requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        
        // Handle migration not applied case (503 status)
        if (response.status === 503) {
          setError(errorData.error || 'Equipment requests feature not yet available');
          setRequests([]);
          setHasMore(false);
          return;
        }
        
        throw new Error(errorData.error || 'Failed to fetch requests');
      }

      const data = await response.json();
      
      if (reset) {
        setRequests(data.requests);
      } else {
        setRequests(prev => [...prev, ...data.requests]);
      }
      
      setHasMore(data.pagination.has_more);
      setPage(pageNum);
      
    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests(1, true);
  }, [selectedCategory, selectedCity, urgentOnly]);

  const handleSearch = () => {
    // Filter requests locally based on search query
    // In a real app, you might want to implement server-side search
  };

  const handleLoadMore = () => {
    fetchRequests(page + 1, false);
  };

  const handleCreateSuccess = (newRequest: EquipmentRequest) => {
    setRequests(prev => [newRequest, ...prev]);
    setShowCreateModal(false);
  };

  const filteredRequests = requests.filter(request => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      request.title.toLowerCase().includes(query) ||
      request.description?.toLowerCase().includes(query) ||
      request.equipment_type?.toLowerCase().includes(query) ||
      request.category?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Equipment Requests</h1>
          <p className="text-gray-600 mt-2">
            Find equipment you need or respond to requests from other users
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Post Request</span>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Urgent Requests</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => r.urgent).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-blue-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-green-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600">Active Today</p>
                <p className="text-2xl font-bold">
                  {requests.filter(r => {
                    const today = new Date().toDateString();
                    return new Date(r.created_at).toDateString() === today;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <div className="w-5 h-5 bg-purple-500 rounded-full"></div>
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold">{CATEGORIES.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search requests..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map(category => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City
              </label>
              <Input
                placeholder="Enter city..."
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button
                variant={urgentOnly ? "default" : "outline"}
                onClick={() => setUrgentOnly(!urgentOnly)}
                className="w-full"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Urgent Only
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="mb-8 border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-red-600">{error}</p>
            {(error.includes('migration') || error.includes('not yet available')) ? (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  To enable the equipment requests feature, please apply the database migration:
                </p>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <p className="font-medium mb-1">Migration File:</p>
                  <code className="block">supabase/migrations/096_equipment_requests.sql</code>
                  <p className="mt-2 text-xs text-gray-500">
                    Copy the contents of this file and run it in your Supabase SQL Editor
                  </p>
                </div>
              </div>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => fetchRequests(1, true)}
                className="mt-2"
              >
                Try Again
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Requests Grid */}
      {loading && requests.length === 0 ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 mb-4">No equipment requests found</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Post First Request
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {filteredRequests.map((request) => (
              <EquipmentRequestCard key={request.id} request={request} />
            ))}
          </div>

          {/* Load More */}
          {hasMore && (
            <div className="text-center">
              <Button 
                onClick={handleLoadMore} 
                disabled={loading}
                variant="outline"
              >
                {loading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Create Request Modal */}
      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}
