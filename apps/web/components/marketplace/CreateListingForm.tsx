'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExistingImage } from '@/components/ui/existing-image-manager';
import { Info } from 'lucide-react';
import { toast } from 'sonner';
import { useFormManager } from '@/hooks/useFormManager';
import { useGeocoding } from '@/hooks/useGeocoding';
import { EquipmentDetailsForm } from './listing/EquipmentDetailsForm';
import { PricingForm } from './listing/PricingForm';
import { LocationForm } from './listing/LocationForm';
import { ImageUploadSection } from './listing/ImageUploadSection';
import { ListingSettings } from './listing/ListingSettings';

interface CreateListingFormProps {
  onSuccess?: (listing: any) => void;
  onCancel?: () => void;
  initialData?: any;
  isEdit?: boolean;
  listingId?: string;
}

interface EquipmentType {
  id: string;
  name: string;
  display_name: string;
  description: string;
  sort_order: number;
}

interface PredefinedModel {
  id: string;
  equipment_type_id: string;
  brand: string;
  model: string;
  description: string;
  sort_order: number;
  equipment_types?: {
    name: string;
    display_name: string;
  };
}

interface ListingFormData {
  title: string;
  description: string;
  category: string;
  equipment_type: string;
  brand: string;
  model: string;
  condition: string;
  mode: 'rent' | 'sale' | 'both';
  rent_day_cents: string;
  rent_week_cents: string;
  sale_price_cents: string;
  retainer_mode: 'none' | 'credit_hold' | 'card_hold';
  retainer_cents: string;
  deposit_cents: string;
  borrow_ok: boolean;
  quantity: string;
  location_city: string;
  location_country: string;
  latitude: string;
  longitude: string;
  verified_only: boolean;
}

export default function CreateListingForm({
  onSuccess,
  onCancel,
  initialData,
  isEdit = false,
  listingId}: CreateListingFormProps) {
  const router = useRouter();

  const defaultFormData: ListingFormData = {
    title: '',
    description: '',
    category: '',
    equipment_type: '',
    brand: '',
    model: '',
    condition: 'good',
    mode: 'rent',
    rent_day_cents: '',
    rent_week_cents: '',
    sale_price_cents: '',
    retainer_mode: 'none',
    retainer_cents: '',
    deposit_cents: '',
    borrow_ok: false,
    quantity: '1',
    location_city: '',
    location_country: '',
    latitude: '',
    longitude: '',
    verified_only: false};

  const formBase = useFormManager<ListingFormData>({
    initialData: isEdit && initialData ? { ...defaultFormData, ...initialData } : defaultFormData,
    validationRules: {
      title: (val) => !val.trim() ? 'Title is required' : null,
      category: (val) => !val ? 'Category is required' : null,
      rent_day_cents: (val, formData) => {
        if (formData.mode === 'rent' || formData.mode === 'both') {
          if (!val || parseInt(val) <= 0) return 'Daily rent price is required';
        }
        return null;
      },
      sale_price_cents: (val, formData) => {
        if (formData.mode === 'sale' || formData.mode === 'both') {
          if (!val || parseInt(val) <= 0) return 'Sale price is required';
        }
        return null;
      }},
    onError: (error) => toast.error(error)});

  const [loading, setLoading] = React.useState(false);

  // Compatibility wrapper for old API
  const formData = formBase.formData;
  const updateField = formBase.updateField;
  const updateMultipleFields = formBase.updateMultipleFields;
  const validateForm = (): boolean => {
    const isValid = formBase.validateForm();
    return isValid;
  };

  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [predefinedModels, setPredefinedModels] = useState<PredefinedModel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<PredefinedModel[]>([]);
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');

  const { coordinates, isGeocoding, coordinatesFound } = useGeocoding(
    formData.location_city,
    formData.location_country
  );

  // Update form coordinates when geocoding completes
  useEffect(() => {
    if (coordinates) {
      updateMultipleFields({
        latitude: coordinates.lat.toString(),
        longitude: coordinates.lng.toString()});
    }
  }, [coordinates]);

  // Fetch equipment data
  useEffect(() => {
    const fetchEquipmentData = async () => {
      try {
        const response = await fetch('/api/marketplace/equipment?type=all');
        if (response.ok) {
          const data = await response.json();
          setEquipmentTypes(data.equipmentTypes || []);
          setPredefinedModels(data.predefinedModels || []);
        }
      } catch (error) {
        console.error('Error fetching equipment data:', error);
      }
    };

    fetchEquipmentData();
  }, []);

  // Initialize form with data when editing
  useEffect(() => {
    if (initialData && isEdit) {
      if (initialData.category) {
        setSelectedCategory(initialData.category);
      }
      if (initialData.listing_images) {
        setExistingImages(initialData.listing_images);
      }
    }
  }, [initialData, isEdit]);

  // Filter models when category changes
  useEffect(() => {
    if (selectedCategory) {
      const filteredModels = predefinedModels.filter(
        (model) => model.equipment_types?.name === selectedCategory
      );
      setAvailableModels(filteredModels);
      setSelectedBrand('');
      setSelectedModel('');
      updateMultipleFields({
        category: selectedCategory,
        equipment_type: '',
        brand: '',
        model: ''});
    } else {
      setAvailableModels([]);
      setSelectedBrand('');
      setSelectedModel('');
    }
  }, [selectedCategory, predefinedModels]);

  const uploadImages = async (listingId: string, files: File[]) => {
    if (files.length === 0) return [];

    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    const {
      data: { session },
      error: sessionError} = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for image upload');
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append('images', file);
    });
    formData.append('listingId', listingId);

    const response = await fetch('/api/marketplace/upload-images', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`},
      body: formData});

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload images');
    }

    const data = await response.json();
    return data.images;
  };

  const handleDeleteExistingImage = async (imageId: string) => {
    if (!listingId) {
      throw new Error('Listing ID is required to delete images');
    }

    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    const {
      data: { session },
      error: sessionError} = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for image deletion');
    }

    const response = await fetch(
      `/api/marketplace/listings/${listingId}/images/${imageId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`}}
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete image');
    }

    setExistingImages((prev) => prev.filter((img) => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      if (!supabase) {
        toast.error('Authentication service not available');
        setLoading(false);
        return;
      }

      const {
        data: { session },
        error: sessionError} = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        toast.error('Please sign in to create a listing');
        setLoading(false);
        return;
      }

      const submitData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        equipment_type: formData.equipment_type,
        condition: formData.condition,
        mode: formData.mode,
        rentDayCents: formData.rent_day_cents
          ? parseInt(formData.rent_day_cents) * 100
          : undefined,
        rentWeekCents: formData.rent_week_cents
          ? parseInt(formData.rent_week_cents) * 100
          : undefined,
        salePriceCents: formData.sale_price_cents
          ? parseInt(formData.sale_price_cents) * 100
          : undefined,
        retainerMode: formData.retainer_mode,
        retainerCents: formData.retainer_cents
          ? parseInt(formData.retainer_cents) * 100
          : 0,
        depositCents: formData.deposit_cents
          ? parseInt(formData.deposit_cents) * 100
          : 0,
        borrowOk: formData.borrow_ok,
        quantity: parseInt(formData.quantity),
        locationCity: formData.location_city,
        locationCountry: formData.location_country,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        verifiedOnly: formData.verified_only};

      Object.keys(submitData).forEach((key) => {
        if (
          submitData[key as keyof typeof submitData] === '' ||
          submitData[key as keyof typeof submitData] === undefined
        ) {
          delete submitData[key as keyof typeof submitData];
        }
      });

      if (formData.brand && formData.model && !selectedModel) {
        try {
          const customEquipmentResponse = await fetch(
            '/api/marketplace/equipment/custom',
            {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${session.access_token}`},
              body: JSON.stringify({
                equipment_name: formData.equipment_type,
                category: selectedCategory,
                brand: formData.brand,
                model: formData.model})}
          );

          if (customEquipmentResponse.ok) {
            const customData = await customEquipmentResponse.json();
            console.log('Custom equipment saved:', customData);
          }
        } catch (error) {
          console.error('Error saving custom equipment:', error);
        }
      }

      const url = isEdit
        ? `/api/marketplace/listings/${listingId}`
        : '/api/marketplace/listings';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`},
        body: JSON.stringify(submitData)});

      const data = await response.json();

      if (!response.ok) {
        const errorMessage =
          data.error ||
          (isEdit ? 'Failed to update listing' : 'Failed to create listing');
        throw new Error(errorMessage);
      }

      if (images.length > 0) {
        try {
          await uploadImages(data.listing.id, images);
          toast.success('Listing created and images uploaded successfully!');
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          toast.warning(
            'Listing created but failed to upload some images. You can add them later.'
          );
        }
      } else {
        toast.success(
          isEdit ? 'Listing updated successfully!' : 'Listing created successfully!'
        );
      }

      if (onSuccess) {
        onSuccess({ id: data.listingId || listingId });
      } else {
        const redirectId = data.listingId || listingId;
        router.push(`/gear/listings/${redirectId}`);
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleBrandChange = (value: string) => {
    setSelectedBrand(value);
    setSelectedModel('');
    updateMultipleFields({
      brand: value,
      model: ''});
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    const selectedModelData = availableModels.find((m) => m.id === value);
    updateMultipleFields({
      model: selectedModelData?.model || '',
      equipment_type: selectedModelData
        ? `${selectedModelData.brand} ${selectedModelData.model}`
        : ''});
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Fill out the form below to create your listing. Required fields are marked with an
          asterisk (*).
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        <EquipmentDetailsForm
          title={formData.title}
          description={formData.description}
          selectedCategory={selectedCategory}
          selectedBrand={selectedBrand}
          selectedModel={selectedModel}
          customBrandInput={customBrandInput}
          customModelInput={customModelInput}
          condition={formData.condition}
          quantity={formData.quantity}
          equipmentTypes={equipmentTypes}
          availableModels={availableModels}
          onTitleChange={(value) => updateField('title', value)}
          onDescriptionChange={(value) => updateField('description', value)}
          onCategoryChange={setSelectedCategory}
          onBrandChange={handleBrandChange}
          onModelChange={handleModelChange}
          onCustomBrandChange={setCustomBrandInput}
          onCustomModelChange={setCustomModelInput}
          onConditionChange={(value) => updateField('condition', value)}
          onQuantityChange={(value) => updateField('quantity', value.toString())}
        />

        <Separator />

        <PricingForm
          mode={formData.mode}
          rentDayCents={formData.rent_day_cents}
          rentWeekCents={formData.rent_week_cents}
          salePriceCents={formData.sale_price_cents}
          retainerMode={formData.retainer_mode}
          retainerCents={formData.retainer_cents}
          depositCents={formData.deposit_cents}
          borrowOk={formData.borrow_ok}
          onModeChange={(value) => updateField('mode', value)}
          onRentDayChange={(value) => updateField('rent_day_cents', value)}
          onRentWeekChange={(value) => updateField('rent_week_cents', value)}
          onSalePriceChange={(value) => updateField('sale_price_cents', value)}
          onRetainerModeChange={(value) => updateField('retainer_mode', value)}
          onRetainerCentsChange={(value) => updateField('retainer_cents', value)}
          onDepositCentsChange={(value) => updateField('deposit_cents', value)}
          onBorrowOkChange={(value) => updateField('borrow_ok', value)}
        />

        <Separator />

        <LocationForm
          locationCity={formData.location_city}
          locationCountry={formData.location_country}
          isGeocoding={isGeocoding}
          coordinatesFound={coordinatesFound}
          onCityChange={(value) => updateField('location_city', value)}
          onCountryChange={(value) => updateField('location_country', value)}
        />

        <Separator />

        <ImageUploadSection
          images={images}
          existingImages={existingImages}
          loading={loading}
          onImagesChange={setImages}
          onDeleteExistingImage={handleDeleteExistingImage}
        />

        <Separator />

        <ListingSettings
          verifiedOnly={formData.verified_only}
          onVerifiedOnlyChange={(value) => updateField('verified_only', value)}
        />

        <div className="flex justify-end space-x-4">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading
              ? isEdit
                ? 'Updating...'
                : 'Creating...'
              : isEdit
              ? 'Update Listing'
              : 'Create Listing'}
          </Button>
        </div>
      </form>
    </div>
  );
}
