'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Package, MapPin, Euro } from 'lucide-react';

interface GearRequest {
  id: string;
  category: string;
  equipment_spec?: string;
  quantity: number;
  borrow_preferred: boolean;
  retainer_acceptable: boolean;
  max_daily_rate_cents?: number;
}

interface GearRequestToListingModalProps {
  gearRequest: GearRequest;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GearRequestToListingModal({
  gearRequest,
  projectId,
  isOpen,
  onClose,
  onSuccess
}: GearRequestToListingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    condition: 'good',
    rent_day_cents: '',
    sale_price_cents: '',
    location_city: '',
    location_country: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const listingData = {
        title: formData.title,
        description: formData.description,
        condition: formData.condition,
        rent_day_cents: formData.rent_day_cents ? parseInt(formData.rent_day_cents) * 100 : undefined,
        sale_price_cents: formData.sale_price_cents ? parseInt(formData.sale_price_cents) * 100 : undefined,
        location_city: formData.location_city,
        location_country: formData.location_country
      };

      const response = await fetch(`/api/collab/projects/${projectId}/marketplace/convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify({
          gearRequestId: gearRequest.id,
          listingData
        })
      });

      if (response.ok) {
        const data = await response.json();
        onSuccess?.();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to create listing');
      }
    } catch (err) {
      console.error('Error creating listing:', err);
      setError('Failed to create listing');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Create Marketplace Listing</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Gear Request Info */}
          <div className="p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center mb-2">
              <Package className="h-4 w-4 mr-2 text-primary-600" />
              <h3 className="font-medium text-primary-900">Converting Gear Request</h3>
            </div>
            <div className="space-y-1 text-sm text-primary-800">
              <div><strong>Category:</strong> {gearRequest.category}</div>
              {gearRequest.equipment_spec && (
                <div><strong>Specification:</strong> {gearRequest.equipment_spec}</div>
              )}
              <div><strong>Quantity:</strong> {gearRequest.quantity}</div>
              <div><strong>Preference:</strong> {gearRequest.borrow_preferred ? 'Borrow preferred' : 'Rent preferred'}</div>
              {gearRequest.max_daily_rate_cents && (
                <div><strong>Max Rate:</strong> {formatPrice(gearRequest.max_daily_rate_cents)}/day</div>
              )}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-destructive-50 border border-destructive-200 rounded-md">
                <p className="text-destructive-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="title">Listing Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Canon 5D Mark IV Camera Body"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the equipment, its condition, and any relevant details..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="condition">Condition *</Label>
              <Select
                value={formData.condition}
                onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="like_new">Like New</SelectItem>
                  <SelectItem value="good">Good</SelectItem>
                  <SelectItem value="fair">Fair</SelectItem>
                  <SelectItem value="used">Used</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rent_day_cents">Daily Rental Rate (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground-400" />
                  <Input
                    id="rent_day_cents"
                    type="number"
                    step="0.01"
                    placeholder="50.00"
                    value={formData.rent_day_cents}
                    onChange={(e) => setFormData(prev => ({ ...prev, rent_day_cents: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="sale_price_cents">Sale Price (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground-400" />
                  <Input
                    id="sale_price_cents"
                    type="number"
                    step="0.01"
                    placeholder="500.00"
                    value={formData.sale_price_cents}
                    onChange={(e) => setFormData(prev => ({ ...prev, sale_price_cents: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="location_city">City</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground-400" />
                  <Input
                    id="location_city"
                    placeholder="Dublin"
                    value={formData.location_city}
                    onChange={(e) => setFormData(prev => ({ ...prev, location_city: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="location_country">Country</Label>
                <Input
                  id="location_country"
                  placeholder="Ireland"
                  value={formData.location_country}
                  onChange={(e) => setFormData(prev => ({ ...prev, location_country: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || !formData.title.trim()}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Listing'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
