'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { AlertCircle, Calendar, MapPin, Euro } from 'lucide-react';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (request: any) => void;
}

const CATEGORIES = [
  'camera',
  'lens', 
  'lighting',
  'audio',
  'accessories',
  'other'
];

const CONDITIONS = [
  'any',
  'new',
  'like_new', 
  'used',
  'fair'
];

export default function CreateRequestModal({ isOpen, onClose, onSuccess }: CreateRequestModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    equipment_type: '',
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
    min_rating: '0',
    urgent: false
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get auth token
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        throw new Error('Authentication required');
      }

      // Prepare request data
      const requestData = {
        ...formData,
        max_daily_rate_cents: formData.max_daily_rate_cents ? parseInt(formData.max_daily_rate_cents) * 100 : undefined,
        max_total_cents: formData.max_total_cents ? parseInt(formData.max_total_cents) * 100 : undefined,
        max_purchase_price_cents: formData.max_purchase_price_cents ? parseInt(formData.max_purchase_price_cents) * 100 : undefined,
        max_distance_km: parseInt(formData.max_distance_km),
        min_rating: parseFloat(formData.min_rating)
      };

      const response = await fetch('/api/marketplace/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create request');
      }

      const result = await response.json();
      
      if (onSuccess) {
        onSuccess(result.request);
      }
      
      onClose();
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        equipment_type: '',
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
        min_rating: '0',
        urgent: false
      });

    } catch (error) {
      console.error('Error creating request:', error);
      alert(error instanceof Error ? error.message : 'Failed to create request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl font-bold">Request Equipment</CardTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ✕
              </Button>
            </div>
            <p className="text-gray-600 text-sm">
              Post what you're looking for and let equipment owners respond with offers
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Basic Information</h3>
                
                <div>
                  <Label htmlFor="title">Request Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="e.g., Need Canon 5D Mark IV for wedding shoot"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your project, requirements, or any specific needs..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map(category => (
                          <SelectItem key={category} value={category}>
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="equipment_type">Equipment Type</Label>
                    <Input
                      id="equipment_type"
                      value={formData.equipment_type}
                      onChange={(e) => handleInputChange('equipment_type', e.target.value)}
                      placeholder="e.g., Canon 5D Mark IV"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="condition_preference">Condition Preference</Label>
                    <Select value={formData.condition_preference} onValueChange={(value) => handleInputChange('condition_preference', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITIONS.map(condition => (
                          <SelectItem key={condition} value={condition}>
                            {condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="request_type">Request Type *</Label>
                    <Select value={formData.request_type} onValueChange={(value) => handleInputChange('request_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="rent">Rental Only</SelectItem>
                        <SelectItem value="buy">Purchase Only</SelectItem>
                        <SelectItem value="both">Rent or Buy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Rental Information */}
              {(formData.request_type === 'rent' || formData.request_type === 'both') && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Rental Details</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="rental_start_date">Start Date *</Label>
                      <Input
                        id="rental_start_date"
                        type="date"
                        value={formData.rental_start_date}
                        onChange={(e) => handleInputChange('rental_start_date', e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="rental_end_date">End Date *</Label>
                      <Input
                        id="rental_end_date"
                        type="date"
                        value={formData.rental_end_date}
                        onChange={(e) => handleInputChange('rental_end_date', e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="max_daily_rate_cents">Max Daily Rate (€)</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="max_daily_rate_cents"
                          type="number"
                          value={formData.max_daily_rate_cents}
                          onChange={(e) => handleInputChange('max_daily_rate_cents', e.target.value)}
                          placeholder="50"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="max_total_cents">Max Total Budget (€)</Label>
                      <div className="relative">
                        <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <Input
                          id="max_total_cents"
                          type="number"
                          value={formData.max_total_cents}
                          onChange={(e) => handleInputChange('max_total_cents', e.target.value)}
                          placeholder="500"
                          className="pl-10"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Purchase Information */}
              {(formData.request_type === 'buy' || formData.request_type === 'both') && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Purchase Details</h3>
                  
                  <div>
                    <Label htmlFor="max_purchase_price_cents">Max Purchase Price (€)</Label>
                    <div className="relative">
                      <Euro className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <Input
                        id="max_purchase_price_cents"
                        type="number"
                        value={formData.max_purchase_price_cents}
                        onChange={(e) => handleInputChange('max_purchase_price_cents', e.target.value)}
                        placeholder="2000"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Location</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location_city">City</Label>
                    <Input
                      id="location_city"
                      value={formData.location_city}
                      onChange={(e) => handleInputChange('location_city', e.target.value)}
                      placeholder="Dublin"
                    />
                  </div>

                  <div>
                    <Label htmlFor="location_country">Country</Label>
                    <Input
                      id="location_country"
                      value={formData.location_country}
                      onChange={(e) => handleInputChange('location_country', e.target.value)}
                      placeholder="Ireland"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="max_distance_km">Max Distance (km)</Label>
                  <Input
                    id="max_distance_km"
                    type="number"
                    value={formData.max_distance_km}
                    onChange={(e) => handleInputChange('max_distance_km', e.target.value)}
                    placeholder="50"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="pickup_preferred"
                      checked={formData.pickup_preferred}
                      onCheckedChange={(checked) => handleInputChange('pickup_preferred', checked)}
                    />
                    <Label htmlFor="pickup_preferred">Pickup preferred</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="delivery_acceptable"
                      checked={formData.delivery_acceptable}
                      onCheckedChange={(checked) => handleInputChange('delivery_acceptable', checked)}
                    />
                    <Label htmlFor="delivery_acceptable">Delivery acceptable</Label>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Preferences</h3>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="verified_users_only"
                      checked={formData.verified_users_only}
                      onCheckedChange={(checked) => handleInputChange('verified_users_only', checked)}
                    />
                    <Label htmlFor="verified_users_only">Only verified users</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="urgent"
                      checked={formData.urgent}
                      onCheckedChange={(checked) => handleInputChange('urgent', checked)}
                    />
                    <Label htmlFor="urgent" className="flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1 text-orange-500" />
                      Urgent request
                    </Label>
                  </div>
                </div>

                <div>
                  <Label htmlFor="min_rating">Minimum User Rating</Label>
                  <Input
                    id="min_rating"
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formData.min_rating}
                    onChange={(e) => handleInputChange('min_rating', e.target.value)}
                    placeholder="0.0"
                  />
                </div>
              </div>

              {/* Submit */}
              <div className="flex space-x-3 pt-4">
                <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'Creating...' : 'Create Request'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
