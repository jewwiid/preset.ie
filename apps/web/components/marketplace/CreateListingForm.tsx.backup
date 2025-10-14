'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NumberInput } from '@/components/ui/number-input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { ImageUpload } from '@/components/ui/image-upload';
import { ExistingImageManager, ExistingImage } from '@/components/ui/existing-image-manager';
import { Upload, X, Plus, Info, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

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

// Helper function to convert icon names to emojis
const getIconEmoji = (iconName: string): string => {
  const iconMap: Record<string, string> = {
    'camera': '📷',
    'lens': '🔍',
    'lighting': '💡',
    'audio': '🎤',
    'tripod': '📐',
    'accessories': '🔧',
    'other': '📦',
    'camera_body': '📷',
    'video': '🎥',
    'computing': '💻',
    'studio': '🎬',
    'transportation': '🚗',
    'default': '📦'
  };
  return iconMap[iconName] || iconMap['default'];
};

// Helper function to format brand names
const formatBrandName = (brand: string): string => {
  return brand
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Geocoding function to get coordinates from city and country
const geocodeLocation = async (city: string, country: string): Promise<{ lat: number; lng: number } | null> => {
  if (!city || !country) return null;
  
  try {
    // Using OpenStreetMap Nominatim API (free, no API key required)
    const query = encodeURIComponent(`${city}, ${country}`);
    const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`);
    
    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        lat: parseFloat(data[0].lat),
        lng: parseFloat(data[0].lon)
      };
    }
    
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
};

const categories = [
  'camera_body',
  'lens',
  'lighting',
  'audio',
  'tripod',
  'accessories',
  'other'
];

const conditions = [
  { value: 'new', label: 'New' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'fair', label: 'Fair' },
  { value: 'poor', label: 'Poor' }
];

const retainerModes = [
  { value: 'none', label: 'No Retainer' },
  { value: 'credit_hold', label: 'Credit Hold' },
  { value: 'card_hold', label: 'Card Hold' }
];

export default function CreateListingForm({ onSuccess, onCancel, initialData, isEdit = false, listingId }: CreateListingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<ExistingImage[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    equipment_type: '',
    brand: '',
    model: '',
    condition: 'good',
    mode: 'rent' as 'rent' | 'sale' | 'both',
    rent_day_cents: '',
    rent_week_cents: '',
    sale_price_cents: '',
    retainer_mode: 'none' as 'none' | 'credit_hold' | 'card_hold',
    retainer_cents: '',
    deposit_cents: '',
    borrow_ok: false,
    quantity: '1',
    location_city: '',
    location_country: '',
    latitude: '',
    longitude: '',
    verified_only: false
  });

  // Equipment system state
  const [equipmentTypes, setEquipmentTypes] = useState<EquipmentType[]>([]);
  const [predefinedModels, setPredefinedModels] = useState<PredefinedModel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedModel, setSelectedModel] = useState('');
  const [availableModels, setAvailableModels] = useState<PredefinedModel[]>([]);
  const [customBrandInput, setCustomBrandInput] = useState('');
  const [customModelInput, setCustomModelInput] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [coordinatesFound, setCoordinatesFound] = useState(false);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
      
      // Set selected category if provided
      if (initialData.category) {
        setSelectedCategory(initialData.category);
      }
      
      // Set existing images if provided
      if (initialData.listing_images) {
        setExistingImages(initialData.listing_images);
      }
    }
  }, [initialData, isEdit]);

  // Filter models when category changes
  useEffect(() => {
    if (selectedCategory) {
      const filteredModels = predefinedModels.filter(model => 
        model.equipment_types?.name === selectedCategory
      );
      setAvailableModels(filteredModels);
      
      // Get unique brands for this category
      const uniqueBrands = [...new Set(filteredModels.map(model => model.brand))];
      
      // Reset brand and model when category changes
      setSelectedBrand('');
      setSelectedModel('');
      setFormData(prev => ({ 
        ...prev, 
        category: selectedCategory,
        equipment_type: '',
        brand: '',
        model: ''
      }));
    } else {
      setAvailableModels([]);
      setSelectedBrand('');
      setSelectedModel('');
    }
  }, [selectedCategory, predefinedModels]);

  // Auto-geocode when city or country changes
  useEffect(() => {
    const autoGeocode = async () => {
      if (formData.location_city && formData.location_country) {
        setIsGeocoding(true);
        setCoordinatesFound(false);
        const coordinates = await geocodeLocation(formData.location_city, formData.location_country);
        if (coordinates) {
          setFormData(prev => ({
            ...prev,
            latitude: coordinates.lat.toString(),
            longitude: coordinates.lng.toString()
          }));
          setCoordinatesFound(true);
        }
        setIsGeocoding(false);
      } else {
        setCoordinatesFound(false);
      }
    };

    // Debounce the geocoding to avoid too many API calls
    const timeoutId = setTimeout(autoGeocode, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.location_city, formData.location_country]);


  const validateForm = () => {
    console.log('Validating form with data:', {
      title: formData.title,
      category: formData.category,
      mode: formData.mode,
      rent_day_cents: formData.rent_day_cents,
      sale_price_cents: formData.sale_price_cents
    });
    
    if (!formData.title.trim()) {
      console.log('Validation failed: Title is required');
      toast.error('Title is required');
      return false;
    }
    if (!formData.category) {
      console.log('Validation failed: Category is required');
      toast.error('Category is required');
      return false;
    }
    if (formData.mode === 'rent' || formData.mode === 'both') {
      if (!formData.rent_day_cents || parseInt(formData.rent_day_cents) <= 0) {
        toast.error('Daily rent price is required');
        return false;
      }
    }
    if (formData.mode === 'sale' || formData.mode === 'both') {
      if (!formData.sale_price_cents || parseInt(formData.sale_price_cents) <= 0) {
        toast.error('Sale price is required');
        return false;
      }
    }
    console.log('Form validation passed');
    return true;
  };

  const uploadImages = async (listingId: string, files: File[]) => {
    if (files.length === 0) return [];

    // Get the current session for authentication
    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for image upload');
    }

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    formData.append('listingId', listingId);

    const response = await fetch('/api/marketplace/upload-images', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData,
    });

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

    // Get the current session for authentication
    if (!supabase) {
      throw new Error('Supabase client not available');
    }
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
      throw new Error('Authentication required for image deletion');
    }

    const response = await fetch(`/api/marketplace/listings/${listingId}/images/${imageId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete image');
    }

    // Remove from local state
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Form submitted, validating...');
    
    if (!validateForm()) {
      console.log('Form validation failed');
      return;
    }
    
    console.log('Form validation passed, checking auth...');

    setLoading(true);
    try {
      // Get the current session
      if (!supabase) {
        toast.error('Authentication service not available');
        setLoading(false);
        return;
      }
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      console.log('Session check:', { 
        session: !!session, 
        hasAccessToken: !!session?.access_token,
        error: sessionError 
      });
      
      if (sessionError || !session?.access_token) {
        console.log('No valid session, showing error');
        toast.error('Please sign in to create a listing');
        setLoading(false);
        return;
      }
      
      console.log('Valid session found, proceeding with submission...');

      const submitData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        equipment_type: formData.equipment_type,
        condition: formData.condition,
        mode: formData.mode,
        rentDayCents: formData.rent_day_cents ? parseInt(formData.rent_day_cents) * 100 : undefined,
        rentWeekCents: formData.rent_week_cents ? parseInt(formData.rent_week_cents) * 100 : undefined,
        salePriceCents: formData.sale_price_cents ? parseInt(formData.sale_price_cents) * 100 : undefined,
        retainerMode: formData.retainer_mode,
        retainerCents: formData.retainer_cents ? parseInt(formData.retainer_cents) * 100 : 0,
        depositCents: formData.deposit_cents ? parseInt(formData.deposit_cents) * 100 : 0,
        borrowOk: formData.borrow_ok,
        quantity: parseInt(formData.quantity),
        locationCity: formData.location_city,
        locationCountry: formData.location_country,
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined,
        verifiedOnly: formData.verified_only
      };

      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key as keyof typeof submitData] === '' || submitData[key as keyof typeof submitData] === undefined) {
          delete submitData[key as keyof typeof submitData];
        }
      });

      // Save custom equipment if provided
      if (formData.brand && formData.model && !selectedModel) {
        try {
          const customEquipmentResponse = await fetch('/api/marketplace/equipment/custom', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              equipment_name: formData.equipment_type,
              category: selectedCategory,
              brand: formData.brand,
              model: formData.model
            })
          });
          
          if (customEquipmentResponse.ok) {
            const customData = await customEquipmentResponse.json();
            console.log('Custom equipment saved:', customData);
          }
        } catch (error) {
          console.error('Error saving custom equipment:', error);
          // Don't fail the entire form submission for this
        }
      }

      // Create or update the listing
      console.log('Submitting listing data:', submitData);
      console.log('Using access token:', session.access_token?.substring(0, 20) + '...');
      console.log('Edit mode:', isEdit, 'Listing ID:', listingId);
      
      const url = isEdit ? `/api/marketplace/listings/${listingId}` : '/api/marketplace/listings';
      const method = isEdit ? 'PUT' : 'POST';
      
      console.log('API URL:', url, 'Method:', method);
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(submitData)
      });

      console.log('API response status:', response.status);
      const data = await response.json();
      console.log('API response data:', data);

      if (!response.ok) {
        const errorMessage = data.error || (isEdit ? 'Failed to update listing' : 'Failed to create listing');
        console.error('API Error:', { status: response.status, error: data.error, data });
        throw new Error(errorMessage);
      }

      // Then upload images if any
      if (images.length > 0) {
        try {
          await uploadImages(data.listing.id, images);
          toast.success('Listing created and images uploaded successfully!');
        } catch (imageError) {
          console.error('Image upload error:', imageError);
          toast.warning('Listing created but failed to upload some images. You can add them later.');
        }
      } else {
        toast.success(isEdit ? 'Listing updated successfully!' : 'Listing created successfully!');
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

  return (
    <div className="space-y-6">
      {/* Information Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Fill out the form below to create your listing. Required fields are marked with an asterisk (*).
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Debug: Form submission test */}
        <div style={{ display: 'none' }}>
          <button type="submit" onClick={() => console.log('Form submit button clicked')}>
            Debug Submit
          </button>
        </div>
        {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="e.g., Canon EOS R5 Camera"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe your equipment..."
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="category">Equipment Type *</Label>
              <Select
                value={selectedCategory}
                onValueChange={(value) => setSelectedCategory(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select equipment type">
                    {selectedCategory && (
                      <div className="flex items-center gap-2">
                        <span>{getIconEmoji(selectedCategory)}</span>
                        <span>{equipmentTypes.find(t => t.name === selectedCategory)?.display_name}</span>
                      </div>
                    )}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.name}>
                      <div className="flex items-center gap-2">
                        <span>{getIconEmoji(type.name)}</span>
                        <span>{type.display_name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedCategory && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="brand">Brand</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedBrand}
                    onValueChange={(value) => {
                      setSelectedBrand(value);
                      setSelectedModel('');
                      setFormData(prev => ({ 
                        ...prev, 
                        brand: value,
                        model: ''
                      }));
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {[...new Set(availableModels.map(model => model.brand))].map((brand) => (
                        <SelectItem key={brand} value={brand}>
                          {formatBrandName(brand)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {selectedBrand && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedBrand('');
                        setSelectedModel('');
                        setFormData(prev => ({ 
                          ...prev, 
                          brand: '',
                          model: ''
                        }));
                      }}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="model">Model</Label>
                <div className="flex gap-2">
                  <Select
                    value={selectedModel}
                    onValueChange={(value) => {
                      setSelectedModel(value);
                      const selectedModelData = availableModels.find(m => m.id === value);
                      setFormData(prev => ({ 
                        ...prev, 
                        model: selectedModelData?.model || '',
                        equipment_type: selectedModelData ? `${selectedModelData.brand} ${selectedModelData.model}` : ''
                      }));
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels
                        .filter(model => !selectedBrand || model.brand === selectedBrand)
                        .map((model) => (
                          <SelectItem key={model.id} value={model.id}>
                            {model.model}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {selectedModel && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedModel('');
                        setFormData(prev => ({ 
                          ...prev, 
                          model: '',
                          equipment_type: ''
                        }));
                      }}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Custom Brand/Model Input */}
          {selectedCategory && (
            <div className="p-4 bg-muted/50 rounded-lg border border-dashed">
              <div className="flex items-center gap-2 mb-4">
                <Info className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Don't see your equipment? Add it below and it will be available for others.
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customBrand" className="text-sm font-medium">Custom Brand</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="customBrand"
                      value={customBrandInput}
                      onChange={(e) => setCustomBrandInput(e.target.value)}
                      placeholder="Enter brand name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (customBrandInput.trim()) {
                          const formattedBrand = formatBrandName(customBrandInput.trim());
                          setSelectedBrand(formattedBrand);
                          setFormData(prev => ({ ...prev, brand: formattedBrand }));
                          setCustomBrandInput('');
                        }
                      }}
                      disabled={!customBrandInput.trim()}
                    >
                      Add Brand
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="customModel" className="text-sm font-medium">Custom Model</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      id="customModel"
                      value={customModelInput}
                      onChange={(e) => setCustomModelInput(e.target.value)}
                      placeholder="Enter model name"
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (customModelInput.trim()) {
                          const formattedModel = customModelInput.trim();
                          setSelectedModel(formattedModel);
                          setFormData(prev => ({ 
                            ...prev, 
                            model: formattedModel,
                            equipment_type: `${formData.brand || 'Custom'} ${formattedModel}`
                          }));
                          setCustomModelInput('');
                        }
                      }}
                      disabled={!customModelInput.trim()}
                    >
                      Add Model
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="condition">Condition</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => handleInputChange('condition', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {conditions.map((condition) => (
                    <SelectItem key={condition.value} value={condition.value}>
                      {condition.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="quantity">Quantity</Label>
            <NumberInput
              value={Number(formData.quantity)}
              onChange={(value) => handleInputChange('quantity', value.toString())}
              min={1}
              max={100}
              step={1}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle>Pricing & Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="mode">Listing Type *</Label>
            <Select
              value={formData.mode}
              onValueChange={(value) => handleInputChange('mode', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rent">Rent Only</SelectItem>
                <SelectItem value="sale">Sale Only</SelectItem>
                <SelectItem value="both">Rent & Sale</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {(formData.mode === 'rent' || formData.mode === 'both') && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rent_day_cents">Daily Rent Price (€) *</Label>
                <CurrencyInput
                  value={formData.rent_day_cents ? Number(formData.rent_day_cents) / 100 : 0}
                  onChange={(value) => handleInputChange('rent_day_cents', Math.round(value * 100).toString())}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="rent_week_cents">Weekly Rent Price (€)</Label>
                <CurrencyInput
                  value={formData.rent_week_cents ? Number(formData.rent_week_cents) / 100 : 0}
                  onChange={(value) => handleInputChange('rent_week_cents', Math.round(value * 100).toString())}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {(formData.mode === 'sale' || formData.mode === 'both') && (
            <div>
              <Label htmlFor="sale_price_cents">Sale Price (€) *</Label>
              <CurrencyInput
                value={formData.sale_price_cents ? Number(formData.sale_price_cents) / 100 : 0}
                onChange={(value) => handleInputChange('sale_price_cents', Math.round(value * 100).toString())}
                placeholder="0.00"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="retainer_mode">Retainer Mode</Label>
              <Select
                value={formData.retainer_mode}
                onValueChange={(value) => handleInputChange('retainer_mode', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {retainerModes.map((mode) => (
                    <SelectItem key={mode.value} value={mode.value}>
                      {mode.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="retainer_cents">Retainer Amount (€)</Label>
              <CurrencyInput
                value={formData.retainer_cents ? Number(formData.retainer_cents) / 100 : 0}
                onChange={(value) => handleInputChange('retainer_cents', Math.round(value * 100).toString())}
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="deposit_cents">Deposit Amount (€)</Label>
            <CurrencyInput
              value={formData.deposit_cents ? Number(formData.deposit_cents) / 100 : 0}
              onChange={(value) => handleInputChange('deposit_cents', Math.round(value * 100).toString())}
              placeholder="0.00"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="borrow_ok"
              checked={formData.borrow_ok}
              onCheckedChange={(checked) => handleInputChange('borrow_ok', checked)}
            />
            <Label htmlFor="borrow_ok">Allow free borrowing</Label>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Location
            {isGeocoding && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                <span>Getting coordinates...</span>
              </div>
            )}
            {coordinatesFound && !isGeocoding && (
              <div className="flex items-center gap-1 text-sm text-primary-600">
                <div className="h-3 w-3 rounded-full bg-primary-500"></div>
                <span>Coordinates found</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location_city">City</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location_city"
                  value={formData.location_city}
                  onChange={(e) => handleInputChange('location_city', e.target.value)}
                  placeholder="Enter city"
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="location_country">Country</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location_country"
                  value={formData.location_country}
                  onChange={(e) => handleInputChange('location_country', e.target.value)}
                  placeholder="Enter country"
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Latitude and Longitude are auto-filled based on city/country */}
          <input
            type="hidden"
            value={formData.latitude}
            onChange={(e) => handleInputChange('latitude', e.target.value)}
          />
          <input
            type="hidden"
            value={formData.longitude}
            onChange={(e) => handleInputChange('longitude', e.target.value)}
          />
        </CardContent>
      </Card>

      <Separator />

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Existing Images */}
          {existingImages.length > 0 ? (
            <ExistingImageManager
              existingImages={existingImages}
              onDeleteImage={handleDeleteExistingImage}
            />
          ) : (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">No existing images found</p>
            </div>
          )}
          
          {/* New Image Upload */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">Add New Images</h4>
            <ImageUpload
              value={images}
              onChange={setImages}
              maxFiles={10}
              maxSize={5}
              accept="image/*"
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="verified_only"
              checked={formData.verified_only}
              onCheckedChange={(checked) => handleInputChange('verified_only', checked)}
            />
            <Label htmlFor="verified_only">Only verified users can book</Label>
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end space-x-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button 
          type="submit" 
          disabled={loading}
          onClick={() => console.log('Submit button clicked')}
        >
          {loading ? (isEdit ? 'Updating...' : 'Creating...') : (isEdit ? 'Update Listing' : 'Create Listing')}
        </Button>
      </div>
      </form>
    </div>
  );
}
