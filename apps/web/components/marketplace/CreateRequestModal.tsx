'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Users } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useFormManager } from '../../hooks/useFormManager';
import { useEquipmentData } from '../../hooks/useEquipmentData';
import { useUserRating } from '../../hooks/useUserRating';
import { EquipmentSelector } from './request/EquipmentSelector';
import { RequestDetailsForm } from './request/RequestDetailsForm';
import { RequestTypeForm } from './request/RequestTypeForm';
import { LocationPreferences } from './request/LocationPreferences';
import { PurposeSelector } from './request/PurposeSelector';
import { RatingRequirements } from './request/RatingRequirements';
import { UrgencyToggle } from './request/UrgencyToggle';

interface RequestFormData {
  title: string;
  description: string;
  category: string;
  equipment_type: string;
  brand: string;
  model: string;
  condition_preference: string;
  request_type: 'rent' | 'buy';
  rental_start_date: string;
  rental_end_date: string;
  max_daily_rate_cents: string;
  max_total_cents: string;
  max_purchase_price_cents: string;
  location_city: string;
  location_country: string;
  pickup_preferred: boolean;
  delivery_acceptable: boolean;
  max_distance_km: string;
  verified_users_only: boolean;
  min_rating: number;
  urgent: boolean;
  purpose_id: string;
  purpose_category: string;
  reference_type: string;
  reference_title: string;
  reference_url: string;
  reference_description: string;
  reference_thumbnail_url: string;
}

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (request: any) => void;
}

export default function CreateRequestModal({
  isOpen,
  onClose,
  onSuccess
}: CreateRequestModalProps) {
  // Fetch equipment data and user rating
  const {
    equipmentTypes,
    equipmentBrands,
    predefinedModels,
    purposes,
    loading: dataLoading
  } = useEquipmentData(isOpen);

  const { userRating } = useUserRating({ enabled: isOpen });

  // Form state management using useFormManager
  const formBase = useFormManager<RequestFormData>({
    initialData: {
      title: '',
      description: '',
      category: '',
      equipment_type: '',
      brand: '',
      model: '',
      condition_preference: 'any',
      request_type: 'rent',
      rental_start_date: '',
      rental_end_date: '',
      max_daily_rate_cents: '',
      max_total_cents: '',
      max_purchase_price_cents: '',
      location_city: '',
      location_country: '',
      pickup_preferred: true,
      delivery_acceptable: false,
      max_distance_km: '50',
      verified_users_only: false,
      min_rating: 0,
      urgent: false,
      purpose_id: '',
      purpose_category: '',
      reference_type: '',
      reference_title: '',
      reference_url: '',
      reference_description: '',
      reference_thumbnail_url: ''
    },
    validationRules: {
      title: (val) => !val?.trim() ? 'Title is required' : null,
      description: (val) => !val?.trim() ? 'Description is required' : null,
      equipment_type: (val) => !val?.trim() ? 'Equipment type is required' : null,
      location_city: (val) => !val?.trim() ? 'City is required' : null,
      location_country: (val) => !val?.trim() ? 'Country is required' : null,
      rental_start_date: (val, formData) => {
        if (formData.request_type === 'rent' && !val) {
          return 'Start date is required for rentals';
        }
        return null;
      },
      rental_end_date: (val, formData) => {
        if (formData.request_type === 'rent') {
          if (!val) return 'End date is required for rentals';
          if (formData.rental_start_date && val) {
            const startDate = new Date(formData.rental_start_date);
            const endDate = new Date(val);
            if (endDate <= startDate) {
              return 'End date must be after start date';
            }
          }
        }
        return null;
      },
      max_daily_rate_cents: (val) => val && isNaN(Number(val)) ? 'Invalid daily rate' : null,
      max_total_cents: (val) => val && isNaN(Number(val)) ? 'Invalid total price' : null,
      max_purchase_price_cents: (val) => val && isNaN(Number(val)) ? 'Invalid purchase price' : null},
    onError: (error) => toast.error(error)});

  // Compatibility wrapper for old API
  const formData = formBase.formData;
  const errors = React.useMemo(() => {
    const errorObj: Record<string, string> = {};
    Object.entries(formBase.errors).forEach(([key, value]) => {
      if (value) errorObj[key] = value;
    });
    return errorObj;
  }, [formBase.errors]);
  const loading = formBase.loading;
  const updateField = formBase.updateField;
  const updateMultipleFields = formBase.updateMultipleFields;

  const submitRequest = async () => {
    if (!formBase.validateForm()) {
      toast.error('Please fix the errors before submitting');
      return null;
    }

    try {
      const { data: { session } } = await supabase?.auth.getSession() || { data: { session: null } };
      if (!session) {
        toast.error('You must be logged in to create a request');
        return null;
      }

      const response = await fetch('/api/marketplace/requests', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'},
        body: JSON.stringify(formData)});

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create request');
      }

      const data = await response.json();
      toast.success('Request created successfully!');

      // Reset form
      formBase.resetForm();

      return data;
    } catch (error: any) {
      console.error('Error creating request:', error);
      toast.error(error.message || 'Failed to create request');
      return null;
    }
  };

  const resetForm = formBase.resetForm;

  const handleSubmit = async () => {
    const result = await submitRequest();
    if (result) {
      onSuccess?.(result);
      onClose();
      resetForm();
    }
  };

  const handleClose = () => {
    onClose();
    // Optional: Reset form on close
    // resetForm();
  };

  const handleConvertToCollaboration = () => {
    // Store current form data in sessionStorage for collaboration form
    sessionStorage.setItem('equipmentRequestData', JSON.stringify(formData));
    handleClose();
    // Navigate to collaboration create page
    window.location.href = '/collaborate/create?from=equipment-request';
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Equipment Request</DialogTitle>
          <DialogDescription>
            Tell us what equipment you need and we'll help you find available options from our community
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Request Details */}
          <RequestDetailsForm
            title={formData.title}
            description={formData.description}
            conditionPreference={formData.condition_preference}
            onTitleChange={(value) => updateField('title', value)}
            onDescriptionChange={(value) => updateField('description', value)}
            onConditionChange={(value) => updateField('condition_preference', value)}
            errors={{
              title: errors.title,
              description: errors.description}}
          />

          {/* Equipment Selection */}
          <EquipmentSelector
            equipmentTypes={equipmentTypes}
            brands={equipmentBrands}
            models={predefinedModels}
            selectedCategory={formData.category}
            selectedBrand={formData.brand}
            selectedModel={formData.model}
            equipmentType={formData.equipment_type}
            onCategoryChange={(category) => {
              updateMultipleFields({
                category,
                brand: '',
                model: '',
                equipment_type: ''
              });
            }}
            onBrandChange={(brand) => {
              updateMultipleFields({
                brand,
                model: '',
                equipment_type: ''
              });
            }}
            onModelChange={(model) => updateField('model', model)}
            onEquipmentTypeChange={(equipmentType) => updateField('equipment_type', equipmentType)}
            error={errors.equipment_type}
          />

          {/* Request Type & Pricing */}
          <RequestTypeForm
            requestType={formData.request_type}
            onRequestTypeChange={(type) => updateField('request_type', type)}
            rentalStartDate={formData.rental_start_date}
            rentalEndDate={formData.rental_end_date}
            onStartDateChange={(date) => updateField('rental_start_date', date)}
            onEndDateChange={(date) => updateField('rental_end_date', date)}
            maxDailyRate={formData.max_daily_rate_cents}
            maxTotalPrice={formData.max_total_cents}
            maxPurchasePrice={formData.max_purchase_price_cents}
            onMaxDailyRateChange={(rate) => updateField('max_daily_rate_cents', rate)}
            onMaxTotalPriceChange={(price) => updateField('max_total_cents', price)}
            onMaxPurchasePriceChange={(price) => updateField('max_purchase_price_cents', price)}
            errors={{
              rental_start_date: errors.rental_start_date,
              rental_end_date: errors.rental_end_date,
              max_daily_rate_cents: errors.max_daily_rate_cents,
              max_total_cents: errors.max_total_cents,
              max_purchase_price_cents: errors.max_purchase_price_cents}}
          />

          {/* Location & Delivery */}
          <LocationPreferences
            city={formData.location_city}
            country={formData.location_country}
            pickupPreferred={formData.pickup_preferred}
            deliveryAcceptable={formData.delivery_acceptable}
            maxDistanceKm={formData.max_distance_km}
            onCityChange={(city) => updateField('location_city', city)}
            onCountryChange={(country) => updateField('location_country', country)}
            onPickupChange={(pickup) => updateField('pickup_preferred', pickup)}
            onDeliveryChange={(delivery) => updateField('delivery_acceptable', delivery)}
            onMaxDistanceChange={(distance) => updateField('max_distance_km', distance)}
            errors={{
              location_city: errors.location_city,
              location_country: errors.location_country}}
          />

          {/* Purpose & References */}
          <PurposeSelector
            purposes={purposes}
            selectedPurposeId={formData.purpose_id}
            selectedPurposeCategory={formData.purpose_category}
            referenceType={formData.reference_type}
            referenceTitle={formData.reference_title}
            referenceUrl={formData.reference_url}
            referenceDescription={formData.reference_description}
            referenceThumbnailUrl={formData.reference_thumbnail_url}
            onPurposeChange={(id, category) => {
              updateMultipleFields({
                purpose_id: id,
                purpose_category: category
              });
            }}
            onReferenceChange={(field, value) => updateField(field as keyof typeof formData, value)}
          />

          {/* Rating Requirements */}
          <RatingRequirements
            verifiedUsersOnly={formData.verified_users_only}
            minRating={formData.min_rating}
            userRating={userRating}
            onVerifiedUsersChange={(verified) => updateField('verified_users_only', verified)}
            onMinRatingChange={(rating) => updateField('min_rating', rating)}
          />

          {/* Urgency */}
          <UrgencyToggle
            urgent={formData.urgent}
            onUrgentChange={(urgent) => updateField('urgent', urgent)}
          />

          {/* Convert to Collaboration */}
          <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground">Need a team for your project?</h4>
                <p className="text-sm text-muted-foreground">
                  Convert this equipment request into a collaboration project to find photographers, models, and other creatives.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleConvertToCollaboration}
                className="flex-shrink-0"
              >
                <Users className="h-4 w-4 mr-2" />
                Convert to Collaboration
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || dataLoading}
          >
            {loading ? 'Creating Request...' : 'Create Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
