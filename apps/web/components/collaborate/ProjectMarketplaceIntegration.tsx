'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Package, 
  ShoppingCart, 
  Link, 
  Plus, 
  TrendingUp, 
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import GearRequestToListingModal from './GearRequestToListingModal';
import LinkGearRequestModal from './LinkGearRequestModal';

interface GearRequestWithMatches {
  id: string;
  category: string;
  equipment_spec?: string;
  quantity: number;
  borrow_preferred: boolean;
  retainer_acceptable: boolean;
  max_daily_rate_cents?: number;
  status: string;
  matching_listings: any[];
  suggested_listings: any[];
}

interface ProjectMarketplaceStats {
  totalGearRequests: number;
  fulfilledRequests: number;
  pendingOffers: number;
  matchingListings: number;
}

interface ProjectMarketplaceIntegrationProps {
  projectId: string;
  isCreator?: boolean;
}

export default function ProjectMarketplaceIntegration({
  projectId,
  isCreator = false
}: ProjectMarketplaceIntegrationProps) {
  const [gearRequests, setGearRequests] = useState<GearRequestWithMatches[]>([]);
  const [stats, setStats] = useState<ProjectMarketplaceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGearRequest, setSelectedGearRequest] = useState<GearRequestWithMatches | null>(null);
  const [modalType, setModalType] = useState<'convert' | 'link' | null>(null);

  useEffect(() => {
    loadMarketplaceData();
  }, [projectId]);

  const loadMarketplaceData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/collab/projects/${projectId}/marketplace`);

      if (response.ok) {
        const data = await response.json();
        setGearRequests(data.gearRequestsWithMatches || []);
        setStats(data.stats);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load marketplace data');
      }
    } catch (err) {
      console.error('Error loading marketplace data:', err);
      setError('Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'fulfilled':
        return 'text-primary-600 bg-primary-50';
      case 'open':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const renderGearRequestCard = (gearRequest: GearRequestWithMatches) => (
    <Card key={gearRequest.id} className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <Package className="h-4 w-4" />
              <h3 className="font-medium">{gearRequest.category}</h3>
              <Badge className={`text-xs ${getStatusColor(gearRequest.status)}`}>
                {gearRequest.status}
              </Badge>
            </div>
            
            {gearRequest.equipment_spec && (
              <p className="text-sm text-gray-600 mb-2">{gearRequest.equipment_spec}</p>
            )}
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Qty: {gearRequest.quantity}</span>
              <span>
                {gearRequest.borrow_preferred ? 'Borrow preferred' : 'Rent preferred'}
                {gearRequest.retainer_acceptable && ' (Retainer OK)'}
              </span>
              {gearRequest.max_daily_rate_cents && (
                <span className="text-primary-600 font-medium">
                  Max: {formatPrice(gearRequest.max_daily_rate_cents)}/day
                </span>
              )}
            </div>
          </div>
          
          {isCreator && gearRequest.status === 'open' && (
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setSelectedGearRequest(gearRequest);
                  setModalType('convert');
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Create Listing
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setSelectedGearRequest(gearRequest);
                  setModalType('link');
                }}
              >
                <Link className="h-3 w-3 mr-1" />
                Link Existing
              </Button>
            </div>
          )}
        </div>

        {/* Matching Listings */}
        {gearRequest.matching_listings.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-primary-600 mb-2">
              Exact Matches ({gearRequest.matching_listings.length})
            </h4>
            <div className="space-y-2">
              {gearRequest.matching_listings.slice(0, 3).map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-2 bg-primary-50 rounded border border-primary/20">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{listing.title}</span>
                      <Badge variant="outline" className="text-xs">{listing.condition}</Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>{listing.owner.display_name}</span>
                      {listing.rent_day_cents && (
                        <span className="text-primary-600 font-medium">
                          {formatPrice(listing.rent_day_cents)}/day
                        </span>
                      )}
                      {listing.location_city && <span>{listing.location_city}</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    View Listing
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested Listings */}
        {gearRequest.suggested_listings.length > 0 && (
          <div className="mt-3">
            <h4 className="text-sm font-medium text-blue-600 mb-2">
              Suggestions ({gearRequest.suggested_listings.length})
            </h4>
            <div className="space-y-2">
              {gearRequest.suggested_listings.slice(0, 2).map((listing) => (
                <div key={listing.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-sm">{listing.title}</span>
                      <Badge variant="outline" className="text-xs">{listing.condition}</Badge>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                      <span>{listing.owner.display_name}</span>
                      {listing.rent_day_cents && (
                        <span className="text-blue-600 font-medium">
                          {formatPrice(listing.rent_day_cents)}/day
                        </span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    View Listing
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {gearRequest.matching_listings.length === 0 && gearRequest.suggested_listings.length === 0 && (
          <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
            <div className="flex items-center text-sm text-gray-500">
              <AlertCircle className="h-4 w-4 mr-2" />
              No matching listings found. Consider creating a listing or expanding your search criteria.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <ShoppingCart className="h-5 w-5" />
          <h2 className="text-lg font-medium">Marketplace Integration</h2>
        </div>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Marketplace Data</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <Button onClick={loadMarketplaceData}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <ShoppingCart className="h-5 w-5" />
        <h2 className="text-lg font-medium">Marketplace Integration</h2>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Package className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{stats.totalGearRequests}</div>
              <div className="text-sm text-gray-500">Gear Requests</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-primary-500" />
              </div>
              <div className="text-2xl font-bold">{stats.fulfilledRequests}</div>
              <div className="text-sm text-gray-500">Fulfilled</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">{stats.pendingOffers}</div>
              <div className="text-sm text-gray-500">Pending Offers</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <div className="text-2xl font-bold">{stats.matchingListings}</div>
              <div className="text-sm text-gray-500">Matching Listings</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Gear Requests */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">All Requests ({gearRequests.length})</TabsTrigger>
          <TabsTrigger value="open">Open ({gearRequests.filter(r => r.status === 'open').length})</TabsTrigger>
          <TabsTrigger value="fulfilled">Fulfilled ({gearRequests.filter(r => r.status === 'fulfilled').length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-4">
          {gearRequests.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Gear Requests</h3>
              <p className="text-gray-500">This project doesn't have any equipment requirements yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gearRequests.map(renderGearRequestCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="open" className="mt-4">
          {gearRequests.filter(r => r.status === 'open').length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-primary-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">All Requests Fulfilled</h3>
              <p className="text-gray-500">All gear requests for this project have been fulfilled.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gearRequests.filter(r => r.status === 'open').map(renderGearRequestCard)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="fulfilled" className="mt-4">
          {gearRequests.filter(r => r.status === 'fulfilled').length === 0 ? (
            <div className="text-center py-8">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Fulfilled Requests</h3>
              <p className="text-gray-500">No gear requests have been fulfilled yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {gearRequests.filter(r => r.status === 'fulfilled').map(renderGearRequestCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Modals */}
      {selectedGearRequest && modalType === 'convert' && (
        <GearRequestToListingModal
          gearRequest={selectedGearRequest}
          projectId={projectId}
          isOpen={true}
          onClose={() => {
            setSelectedGearRequest(null);
            setModalType(null);
          }}
          onSuccess={() => {
            loadMarketplaceData();
            setSelectedGearRequest(null);
            setModalType(null);
          }}
        />
      )}

      {selectedGearRequest && modalType === 'link' && (
        <LinkGearRequestModal
          gearRequest={selectedGearRequest}
          projectId={projectId}
          isOpen={true}
          onClose={() => {
            setSelectedGearRequest(null);
            setModalType(null);
          }}
          onSuccess={() => {
            loadMarketplaceData();
            setSelectedGearRequest(null);
            setModalType(null);
          }}
        />
      )}
    </div>
  );
}
