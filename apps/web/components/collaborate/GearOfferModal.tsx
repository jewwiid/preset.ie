'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, MapPin, Calendar, Package } from 'lucide-react';
import { toast } from 'sonner';
import { getAuthToken } from '../../lib/supabase';

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
    handle?: string;
    display_name: string;
    avatar_url?: string;
    verified_id?: boolean;
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
      const token = await getAuthToken();
      const response = await fetch('/api/marketplace/listings?my_listings=true', {
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` })
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
      const token = await getAuthToken();
      const offerData: any = {
        gear_request_id: gearRequest.id,
        listing_id: (formData.listing_id && formData.listing_id !== 'none') ? formData.listing_id : null,
        offer_type: formData.offer_type,
        message: formData.message
      };

      // Add pricing based on offer type
      if (formData.offer_type === 'rent' || formData.offer_type === 'borrow') {
        if (!formData.daily_rate_cents) {
          toast.error('Daily rate is required for rent/borrow offers');
          setLoading(false);
          return;
        }
        offerData.daily_rate_cents = Math.round(parseFloat(formData.daily_rate_cents) * 100);
      } else if (formData.offer_type === 'sell') {
        if (!formData.total_price_cents) {
          toast.error('Total price is required for sell offers');
          setLoading(false);
          return;
        }
        offerData.total_price_cents = Math.round(parseFloat(formData.total_price_cents) * 100);
      }

      const response = await fetch(`/api/collab/projects/${project.id}/gear-offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
        body: JSON.stringify(offerData)
      });

      if (response.ok) {
        toast.success('Offer submitted successfully!');
        onSuccess?.();
        onClose();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Failed to submit offer');
      }
    } catch (err) {
      console.error('Error submitting offer:', err);
      toast.error('Failed to submit offer');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make Equipment Offer</DialogTitle>
          <DialogDescription>
            Offer your equipment for {gearRequest.category}
            {gearRequest.equipment_spec && ` - ${gearRequest.equipment_spec}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Project & Gear Request Info */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-lg">{project.title}</h3>
              <p className="text-sm text-muted-foreground-600">{project.description}</p>
            </div>

            <div className="flex items-center space-x-4 text-sm text-muted-foreground-500">
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
            <div className="flex items-center space-x-3 p-3 bg-muted-50 rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={project.creator.avatar_url} />
                <AvatarFallback>
                  {project.creator.display_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{project.creator.display_name}</span>
                  {project.creator.verified_id && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground-500">@{project.creator.handle}</p>
              </div>
            </div>

            {/* Gear Request Details */}
            <div className="p-4 border border-border-200 rounded-lg">
              <div className="flex items-center mb-2">
                <Package className="h-4 w-4 mr-2" />
                <h4 className="font-medium">{gearRequest.category}</h4>
              </div>
              <div className="space-y-2 text-sm">
                {gearRequest.equipment_spec && (
                  <div>
                    <span className="text-muted-foreground-500">Specification:</span> {gearRequest.equipment_spec}
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground-500">Quantity:</span>
                  <span>{gearRequest.quantity}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground-500">Preference:</span>
                  <span>
                    {gearRequest.borrow_preferred ? 'Borrow preferred' : 'Rent preferred'}
                    {gearRequest.retainer_acceptable && ' (Retainer OK)'}
                  </span>
                </div>
                
                {gearRequest.max_daily_rate_cents && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground-500">Max daily rate:</span>
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
              <div className="p-3 bg-destructive-50 border border-destructive-200 rounded-md">
                <p className="text-destructive-600 text-sm">{error}</p>
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
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
