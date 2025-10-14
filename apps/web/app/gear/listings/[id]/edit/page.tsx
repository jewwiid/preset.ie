'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import MarketplaceLayout from '@/components/marketplace/MarketplaceLayout';
import CreateListingForm from '@/components/marketplace/CreateListingForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  condition: string;
  mode: 'rent' | 'sale' | 'both';
  rent_day_cents?: number;
  rent_week_cents?: number;
  sale_price_cents?: number;
  retainer_mode?: string;
  retainer_cents?: number;
  deposit_cents?: number;
  borrow_ok?: boolean;
  quantity: number;
  location_city?: string;
  location_country?: string;
  latitude?: number;
  longitude?: number;
  verified_only?: boolean;
  status: string;
  created_at: string;
  updated_at: string;
  owner_id: string;
  users_profile?: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
    verified_id?: boolean;
  };
  listing_images?: Array<{
    id: string;
    path: string;
    url: string;
    sort_order: number;
    alt_text?: string;
    file_size?: number;
    mime_type?: string;
  }>;
}

export default function EditListingPage() {
  const router = useRouter();
  const params = useParams();
  const { user, session } = useAuth();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserProfileId, setCurrentUserProfileId] = useState<string | null>(null);

  const listingId = params?.id as string;

  useEffect(() => {
    if (user && listingId) {
      fetchListing();
      fetchCurrentUserProfileId();
    }
  }, [user, listingId]);

  const fetchCurrentUserProfileId = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentUserProfileId(data.id);
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    }
  };

  const fetchListing = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/marketplace/listings/${listingId}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setListing(data.listing);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch listing');
      }
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = (updatedListing: any) => {
    toast.success('Listing updated successfully!');
    router.push(`/gear/listings/${listingId}`);
  };

  const handleCancel = () => {
    router.push(`/gear/listings/${listingId}`);
  };

  if (loading) {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex items-center gap-2">
              <LoadingSpinner size="md" />
              <span>Loading listing...</span>
            </div>
          </div>
        </div>
      </MarketplaceLayout>
    );
  }

  if (error) {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeft 
                  className="h-5 w-5 cursor-pointer" 
                  onClick={() => router.back()}
                />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </MarketplaceLayout>
    );
  }

  if (!listing) {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeft 
                  className="h-5 w-5 cursor-pointer" 
                  onClick={() => router.back()}
                />
                Listing Not Found
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">The listing you're looking for doesn't exist.</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </MarketplaceLayout>
    );
  }

  // Check if user owns this listing (wait for both listing and user profile to load)
  if (user && currentUserProfileId && listing && listing.owner_id !== currentUserProfileId) {
    return (
      <MarketplaceLayout>
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeft 
                  className="h-5 w-5 cursor-pointer" 
                  onClick={() => router.back()}
                />
                Unauthorized
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4">You don't have permission to edit this listing.</p>
              <Button onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </MarketplaceLayout>
    );
  }

  return (
    <MarketplaceLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Listing
          </Button>
          <h1 className="text-3xl font-bold">Edit Listing</h1>
          <p className="text-muted-foreground mt-2">
            Update your equipment listing details
          </p>
        </div>

        <CreateListingForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          initialData={{
            title: listing.title,
            description: listing.description || '',
            category: listing.category,
            condition: listing.condition,
            mode: listing.mode,
            rent_day_cents: listing.rent_day_cents ? (listing.rent_day_cents / 100).toString() : '',
            rent_week_cents: listing.rent_week_cents ? (listing.rent_week_cents / 100).toString() : '',
            sale_price_cents: listing.sale_price_cents ? (listing.sale_price_cents / 100).toString() : '',
            retainer_mode: listing.retainer_mode || '',
            retainer_cents: listing.retainer_cents ? (listing.retainer_cents / 100).toString() : '',
            deposit_cents: listing.deposit_cents ? (listing.deposit_cents / 100).toString() : '',
            borrow_ok: listing.borrow_ok || false,
            quantity: listing.quantity.toString(),
            location_city: listing.location_city || '',
            location_country: listing.location_country || '',
            latitude: listing.latitude?.toString() || '',
            longitude: listing.longitude?.toString() || '',
            verified_only: listing.verified_only || false,
            listing_images: listing.listing_images || []
          }}
          isEdit={true}
          listingId={listingId}
        />
      </div>
    </MarketplaceLayout>
  );
}
