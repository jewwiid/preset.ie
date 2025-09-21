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
import { Upload, X, Plus, Euro } from 'lucide-react';
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

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 5 * 1024 * 1024; // 5MB
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      toast.error('Some files were skipped. Only images under 5MB are allowed.');
    }

    setImages(prev => [...prev, ...validFiles].slice(0, 10)); // Max 10 images
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
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

      const response = await fetch('/api/marketplace/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Listing created successfully!');
        if (onSuccess) {
          onSuccess(data.listing);
        } else {
          router.push(`/marketplace/listings/${data.listing.id}`);
        }
      } else {
        toast.error(data.error || 'Failed to create listing');
      }
    } catch (error) {
      console.error('Error creating listing:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
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
            <Input
              id="quantity"
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

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
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rent_day_cents"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rent_day_cents}
                    onChange={(e) => handleInputChange('rent_day_cents', e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="rent_week_cents">Weekly Rent Price (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="rent_week_cents"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.rent_week_cents}
                    onChange={(e) => handleInputChange('rent_week_cents', e.target.value)}
                    className="pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          )}

          {(formData.mode === 'sale' || formData.mode === 'both') && (
            <div>
              <Label htmlFor="sale_price_cents">Sale Price (€) *</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="sale_price_cents"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.sale_price_cents}
                  onChange={(e) => handleInputChange('sale_price_cents', e.target.value)}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
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
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="retainer_cents"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.retainer_cents}
                  onChange={(e) => handleInputChange('retainer_cents', e.target.value)}
                  className="pl-10"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="deposit_cents">Deposit Amount (€)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="deposit_cents"
                type="number"
                min="0"
                step="0.01"
                value={formData.deposit_cents}
                onChange={(e) => handleInputChange('deposit_cents', e.target.value)}
                className="pl-10"
                placeholder="0.00"
              />
            </div>
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

      {/* Location */}
      <Card>
        <CardHeader>
          <CardTitle>Location</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="location_city">City</Label>
              <Input
                id="location_city"
                value={formData.location_city}
                onChange={(e) => handleInputChange('location_city', e.target.value)}
                placeholder="Enter city"
              />
            </div>
            <div>
              <Label htmlFor="location_country">Country</Label>
              <Input
                id="location_country"
                value={formData.location_country}
                onChange={(e) => handleInputChange('location_country', e.target.value)}
                placeholder="Enter country"
              />
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

      {/* Images */}
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="images">Upload Images (max 10, 5MB each)</Label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="mt-2"
            />
          </div>

          {images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative group">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
  );
}
