'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Euro } from 'lucide-react';
import { toast } from 'sonner';

interface MakeOfferFormProps {
  listing: {
    id: string;
    title: string;
    sale_price_cents?: number;
    owner_id: string;
  };
  onClose: () => void;
  onSuccess?: () => void;
}

export default function MakeOfferForm({ listing, onClose, onSuccess }: MakeOfferFormProps) {
  const [loading, setLoading] = useState(false);
  const [hasExistingOffer, setHasExistingOffer] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [formData, setFormData] = useState({
    offer_amount_cents: listing.sale_price_cents || 0,
    message: '',
    contact_preference: 'message' as 'message' | 'phone' | 'email'
  });

  // Check for existing offers on component mount
  React.useEffect(() => {
    checkExistingOffer();
  }, []);

  const checkExistingOffer = async () => {
    try {
      const { supabase } = await import('@/lib/supabase');
      if (!supabase) {
        setCheckingExisting(false);
        return;
      }
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        setCheckingExisting(false);
        return;
      }

      const response = await fetch('/api/marketplace/my-offers', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const existingOffer = data.offers?.find(
          (offer: any) => offer.listing_id === listing.id && offer.status === 'pending'
        );
        setHasExistingOffer(!!existingOffer);
      }
    } catch (error) {
      console.error('Error checking existing offer:', error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.offer_amount_cents <= 0) {
      toast.error('Offer amount must be greater than 0');
      return;
    }

    if (listing.sale_price_cents && formData.offer_amount_cents > listing.sale_price_cents * 1.5) {
      toast.error('Offer cannot exceed 150% of the asking price');
      return;
    }

    setLoading(true);
    try {
        // Get the current session
        const { supabase } = await import('@/lib/supabase');
        if (!supabase) {
          toast.error('Failed to initialize database connection');
          setLoading(false);
          return;
        }
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session?.access_token) {
          toast.error('Please sign in to send offers');
          setLoading(false);
          return;
        }

        const response = await fetch('/api/marketplace/offers', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
        body: JSON.stringify({
          listing_id: listing.id,
          owner_id: listing.owner_id,
          offer_amount_cents: formData.offer_amount_cents,
          message: formData.message,
          contact_preference: formData.contact_preference
        })
      });

      if (response.ok) {
        toast.success('Offer sent successfully!');
        onSuccess?.();
        onClose();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to send offer');
      }
    } catch (error) {
      console.error('Error sending offer:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const offerPercentage = listing.sale_price_cents 
    ? ((formData.offer_amount_cents - listing.sale_price_cents) / listing.sale_price_cents) * 100
    : 0;

  if (checkingExisting) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Make Offer</h3>
          <p className="text-sm text-muted-foreground">
            Checking for existing offers...
          </p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (hasExistingOffer) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold">Offer Already Sent</h3>
          <p className="text-sm text-muted-foreground">
            You already have a pending offer for this listing
          </p>
        </div>
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span className="text-sm font-medium">Pending Offer</span>
          </div>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            You can view and manage your offer in the "My Requests" section.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Close
          </Button>
          <Button onClick={() => window.open('/gear/my-requests', '_blank')} className="flex-1">
            View My Requests
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="offer_amount">Offer Amount</Label>
          <div className="relative mt-1">
            <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="offer_amount"
              type="number"
              min="1"
              max={listing.sale_price_cents ? listing.sale_price_cents * 1.5 : undefined}
              step="0.01"
              value={(formData.offer_amount_cents / 100).toFixed(2)}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                offer_amount_cents: Math.round(parseFloat(e.target.value) * 100) || 0 
              }))}
              className="pl-10"
            />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Asking price: €{listing.sale_price_cents ? (listing.sale_price_cents / 100).toFixed(2) : 'N/A'}
            {offerPercentage !== 0 && (
              <span className={`ml-2 ${offerPercentage > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                ({offerPercentage > 0 ? '+' : ''}{offerPercentage.toFixed(1)}%)
              </span>
            )}
          </p>
        </div>

        <div>
          <Label htmlFor="message">Message (Optional)</Label>
          <Textarea
            id="message"
            placeholder="Explain your offer or ask questions..."
            value={formData.message}
            onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
            className="mt-1"
            rows={4}
          />
        </div>

        <div>
          <Label htmlFor="contact_preference">Preferred Contact Method</Label>
          <Select
            value={formData.contact_preference}
            onValueChange={(value: 'message' | 'phone' | 'email') => 
              setFormData(prev => ({ ...prev, contact_preference: value }))
            }
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select contact method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="message">Message through platform</SelectItem>
              <SelectItem value="phone">Phone call</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Offer Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Offer Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between">
            <span>Your Offer</span>
            <span className="font-semibold">€{(formData.offer_amount_cents / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Asking Price</span>
            <span>€{listing.sale_price_cents ? (listing.sale_price_cents / 100).toFixed(2) : 'N/A'}</span>
          </div>
          {offerPercentage !== 0 && (
            <div className="flex justify-between text-sm">
              <span>Difference</span>
              <span className={offerPercentage > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                {offerPercentage > 0 ? '+' : ''}€{listing.sale_price_cents ? Math.abs(formData.offer_amount_cents - listing.sale_price_cents) / 100 : 'N/A'}
                ({offerPercentage > 0 ? '+' : ''}{offerPercentage.toFixed(1)}%)
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex space-x-3">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancel
        </Button>
        <Button type="submit" disabled={loading} className="flex-1">
          {loading ? 'Sending...' : 'Send Offer'}
        </Button>
      </div>
    </form>
  );
}
