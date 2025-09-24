'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Upload, X, Plus, Info, MapPin, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface CreateListingFormProps {
  onSuccess?: (listing: any) => void;
  onCancel?: () => void;
}

const categories = [
  'camera',
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

export default function CreateListingForm({ onSuccess, onCancel }: CreateListingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
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

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };


  const validateForm = () => {
    if (!formData.title.trim()) {
      toast.error('Title is required');
      return false;
    }
    if (!formData.category) {
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
    return true;
  };

  const uploadImages = async (listingId: string, files: File[]) => {
    if (files.length === 0) return [];

    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    formData.append('listingId', listingId);

    const response = await fetch('/api/marketplace/upload-images', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload images');
    }

    const data = await response.json();
    return data.images;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        rent_day_cents: formData.rent_day_cents ? parseInt(formData.rent_day_cents) * 100 : undefined,
        rent_week_cents: formData.rent_week_cents ? parseInt(formData.rent_week_cents) * 100 : undefined,
        sale_price_cents: formData.sale_price_cents ? parseInt(formData.sale_price_cents) * 100 : undefined,
        retainer_cents: formData.retainer_cents ? parseInt(formData.retainer_cents) * 100 : 0,
        deposit_cents: formData.deposit_cents ? parseInt(formData.deposit_cents) * 100 : 0,
        quantity: parseInt(formData.quantity),
        latitude: formData.latitude ? parseFloat(formData.latitude) : undefined,
        longitude: formData.longitude ? parseFloat(formData.longitude) : undefined
      };

      // Remove empty fields
      Object.keys(submitData).forEach(key => {
        if (submitData[key as keyof typeof submitData] === '' || submitData[key as keyof typeof submitData] === undefined) {
          delete submitData[key as keyof typeof submitData];
        }
      });

      // First, create the listing
      const response = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create listing');
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
        toast.success('Listing created successfully!');
      }

      if (onSuccess) {
        onSuccess(data.listing);
      } else {
        router.push(`/marketplace/listings/${data.listing.id}`);
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => handleInputChange('category', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
          <CardTitle>Location</CardTitle>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="latitude">Latitude (optional)</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => handleInputChange('latitude', e.target.value)}
                placeholder="e.g., 52.5200"
              />
            </div>
            <div>
              <Label htmlFor="longitude">Longitude (optional)</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => handleInputChange('longitude', e.target.value)}
                placeholder="e.g., 13.4050"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent>
          <ImageUpload
            value={images}
            onChange={setImages}
            maxFiles={10}
            maxSize={5}
            accept="image/*"
            disabled={loading}
          />
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
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Listing'}
        </Button>
      </div>
      </form>
    </div>
  );
}
