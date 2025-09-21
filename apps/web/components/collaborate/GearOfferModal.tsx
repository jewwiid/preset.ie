'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Send, MapPin, Calendar, Package } from 'lucide-react';

interface GearRequest {
  id: string;
  category: string;
  equipment_spec?: string;
  quantity: number;
  borrow_preferred: boolean;
  retainer_acceptable: boolean;
  max_daily_rate_cents?: number;
}

interface Project {
  id: string;
  title: string;
  description?: string;
  city?: string;
  country?: string;
  start_date?: string;
  end_date?: string;
  creator: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    verified: boolean;
    rating?: number;
  };
}

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  condition: string;
  rent_day_cents?: number;
  sale_price_cents?: number;
  location_city?: string;
  location_country?: string;
}

interface GearOfferModalProps {
  gearRequest: GearRequest;
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function GearOfferModal({
  gearRequest,
  project,
  isOpen,
  onClose,
  onSuccess
}: GearOfferModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userListings, setUserListings] = useState<Listing[]>([]);
  const [formData, setFormData] = useState({
    listing_id: '',
    offer_type: 'rent' as 'rent' | 'sell' | 'borrow',
    daily_rate_cents: '',
    total_price_cents: '',
    message: ''
  });

  // Load user's listings when modal opens
  useEffect(() => {
    if (isOpen) {
      loadUserListings();
    }
  }, [isOpen]);

  const loadUserListings = async () => {
    try {
      const response = await fetch('/api/marketplace/listings?my_listings=true', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserListings(data.listings || []);
      }
    } catch (err) {
      console.error('Error loading user listings:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const offerData: any = {
        gear_request_id: gearRequest.id,
        listing_id: formData.listing_id || null,
        offer_type: formData.offer_type,
        message: formData.message
      };

      // Add pricing based on offer type
      if (formData.offer_type === 'rent' || formData.offer_type === 'borrow') {
        if (!formData.daily_rate_cents) {
          setError('Daily rate is required for rent/borrow offers');
          setLoading(false);
          return;
        }
        offerData.daily_rate_cents = parseInt(formData.daily_rate_cents);
      } else if (formData.offer_type === 'sell') {
        if (!formData.total_price_cents) {
          setError('Total price is required for sell offers');
          setLoading(false);
          return;
        }
        offerData.total_price_cents = parseInt(formData.total_price_cents);
      }

      const response = await fetch(`/api/collab/projects/${project.id}/gear-offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(offerData)
      });

      if (response.ok) {
        onSuccess?.();
        onClose();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit offer');
      }
    } catch (err) {
      console.error('Error submitting offer:', err);
      setError('Failed to submit offer');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">Make Equipment Offer</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Project & Gear Request Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">{project.title}</h3>
              <p className="text-sm text-gray-600">{project.description}</p>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              {(project.city || project.country) && (
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {[project.city, project.country].filter(Boolean).join(', ')}
                </div>
              )}
              
              {(project.start_date || project.end_date) && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {project.start_date && formatDate(project.start_date)}
                  {project.start_date && project.end_date && ' - '}
                  {project.end_date && formatDate(project.end_date)}
                </div>
              )}
            </div>

            {/* Creator Info */}
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={project.creator.avatar_url} />
                <AvatarFallback>
                  {project.creator.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{project.creator.display_name}</span>
                  {project.creator.verified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-500">@{project.creator.username}</p>
              </div>
            </div>

            {/* Gear Request Details */}
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Package className="h-4 w-4 mr-2" />
                <h4 className="font-medium">{gearRequest.category}</h4>
              </div>
              <div className="space-y-2 text-sm">
                {gearRequest.equipment_spec && (
                  <div>
                    <span className="text-gray-500">Specification:</span> {gearRequest.equipment_spec}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Quantity:</span>
                  <span>{gearRequest.quantity}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Preference:</span>
                  <span>
                    {gearRequest.borrow_preferred ? 'Borrow preferred' : 'Rent preferred'}
                    {gearRequest.retainer_acceptable && ' (Retainer OK)'}
                  </span>
                </div>
                
                {gearRequest.max_daily_rate_cents && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Max daily rate:</span>
                    <span className="text-primary-600 font-medium">
                      {formatPrice(gearRequest.max_daily_rate_cents)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Offer Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <div>
              <Label htmlFor="offer_type">Offer Type *</Label>
              <Select
                value={formData.offer_type}
                onValueChange={(value: 'rent' | 'sell' | 'borrow') => 
                  setFormData(prev => ({ ...prev, offer_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rent">Rent</SelectItem>
                  <SelectItem value="borrow">Borrow</SelectItem>
                  <SelectItem value="sell">Sell</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="listing_id">Your Equipment (Optional)</Label>
              <Select
                value={formData.listing_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, listing_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select from your listings or leave blank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No specific listing</SelectItem>
                  {userListings.map((listing) => (
                    <SelectItem key={listing.id} value={listing.id}>
                      {listing.title} ({listing.condition})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(formData.offer_type === 'rent' || formData.offer_type === 'borrow') && (
              <div>
                <Label htmlFor="daily_rate_cents">Daily Rate (€) *</Label>
                <Input
                  id="daily_rate_cents"
                  type="number"
                  step="0.01"
                  placeholder="50.00"
                  value={formData.daily_rate_cents}
                  onChange={(e) => setFormData(prev => ({ ...prev, daily_rate_cents: e.target.value }))}
                  required
                />
              </div>
            )}

            {formData.offer_type === 'sell' && (
              <div>
                <Label htmlFor="total_price_cents">Total Price (€) *</Label>
                <Input
                  id="total_price_cents"
                  type="number"
                  step="0.01"
                  placeholder="500.00"
                  value={formData.total_price_cents}
                  onChange={(e) => setFormData(prev => ({ ...prev, total_price_cents: e.target.value }))}
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                placeholder="Add any additional details about your offer..."
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Offer
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
