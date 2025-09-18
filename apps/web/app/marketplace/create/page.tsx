'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Create New Listing</h1>
          <p className="mt-2 text-gray-600">
            List your equipment for rent or sale in the Preset marketplace
          </p>
        </div>

        <CreateListingForm
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </div>
    </MarketplaceLayout>
  );
}
