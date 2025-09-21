'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketplaceLayout from '@/components/marketplace/MarketplaceLayout';
import CreateListingForm from '@/components/marketplace/CreateListingForm';
import { toast } from 'sonner';

export default function CreateListingPage() {
  const router = useRouter();

  const handleSuccess = (listing: any) => {
    toast.success('Listing created successfully!');
    router.push(`/marketplace/listings/${listing.id}`);
  };

  const handleCancel = () => {
    router.push('/marketplace');
  };

  return (
    <MarketplaceLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="mb-8 rounded-2xl p-8 border border-border">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <ShoppingBag className="h-8 w-8 text-primary mr-3" />
              <div>
                <h1 className="text-5xl font-bold text-primary mb-2">Create New Listing</h1>
                <p className="text-xl text-muted-foreground">List your equipment for rent or sale in the Preset marketplace</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button size="lg" className="px-8 py-3 text-lg font-semibold">
                <Plus className="h-5 w-5 mr-2" />
                Create Listing
              </Button>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto">

        <CreateListingForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
        </div>
      </div>
    </MarketplaceLayout>
  );
}
