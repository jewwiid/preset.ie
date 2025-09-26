'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MapPin, 
  CreditCard,
  AlertCircle,
  Package,
  Star,
  X,
  CheckCircle
} from 'lucide-react';
import { OrderProcessingService } from '@/lib/services/order-processing.service';

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  condition: string;
  sale_price_cents: number;
  location_city?: string;
  location_country?: string;
  images?: string[];
  owner: {
    id: string;
    username: string;
    display_name: string;
    avatar_url?: string;
    verified: boolean;
    rating?: number;
  };
}

interface SaleOrderFlowProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (orderId: string) => void;
}

export default function SaleOrderFlow({
  listing,
  isOpen,
  onClose,
  onSuccess
}: SaleOrderFlowProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    deliveryMethod: 'pickup' as 'pickup' | 'delivery',
    deliveryAddress: '',
    specialRequests: ''
  });

  const handleNext = () => {
    if (step === 1) {
      if (formData.deliveryMethod === 'delivery' && !formData.deliveryAddress.trim()) {
        setError('Please provide delivery address');
        return;
      }
      setError(null);
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const orderData = {
        listingId: listing.id,
        buyerId: 'current-user-id', // This should come from auth context
        totalAmount: listing.sale_price_cents / 100,
        deliveryMethod: formData.deliveryMethod,
        deliveryAddress: formData.deliveryAddress,
        specialRequests: formData.specialRequests
      };

      const result = await OrderProcessingService.createSaleOrder(orderData);

      if (result.success && result.clientSecret) {
        // Here you would integrate with Stripe Elements for payment
        // For now, we'll simulate success
        onSuccess?.(result.orderId!);
        onClose();
      } else {
        setError(result.error || 'Failed to create sale order');
      }
    } catch (err) {
      console.error('Error creating sale order:', err);
      setError('Failed to create sale order');
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
          <CardTitle className="text-xl">Buy Equipment</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Listing Info */}
          <div className="p-4 bg-muted-50 rounded-lg">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-muted-200 rounded-lg flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{listing.title}</h3>
                <p className="text-sm text-muted-foreground-600 mb-2">{listing.category}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-primary-600 font-medium text-lg">
                    {formatPrice(listing.sale_price_cents)}
                  </span>
                  {(listing.location_city || listing.location_country) && (
                    <div className="flex items-center text-muted-foreground-500">
                      <MapPin className="h-3 w-3 mr-1" />
                      {[listing.location_city, listing.location_country].filter(Boolean).join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium">{listing.owner.display_name}</span>
                  {listing.owner.verified && (
                    <Badge variant="secondary" className="text-xs">Verified</Badge>
                  )}
                </div>
                {listing.owner.rating && (
                  <div className="flex items-center text-sm text-muted-foreground-500">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {listing.owner.rating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {[1, 2].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-primary-600 text-primary-foreground' 
                    : 'bg-muted-200 text-muted-foreground-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 2 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > stepNumber ? 'bg-primary-600' : 'bg-muted-200'
                  }`} />
                )}
              </div>
            ))}
            <div className="ml-4 text-sm text-muted-foreground-600">
              {step === 1 && 'Delivery Options'}
              {step === 2 && 'Review & Pay'}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-destructive-50 border border-destructive-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-destructive-600 mr-2" />
                <p className="text-destructive-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Delivery Options */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">Delivery Options</h3>
              <div>
                <Label>Delivery Method</Label>
                <Select
                  value={formData.deliveryMethod}
                  onValueChange={(value: 'pickup' | 'delivery') => 
                    setFormData(prev => ({ ...prev, deliveryMethod: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pickup">Pickup</SelectItem>
                    <SelectItem value="delivery">Delivery</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.deliveryMethod === 'delivery' && (
                <div>
                  <Label>Delivery Address</Label>
                  <Textarea
                    placeholder="Enter your delivery address..."
                    value={formData.deliveryAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    rows={3}
                  />
                </div>
              )}
              <div>
                <Label>Special Requests (Optional)</Label>
                <Textarea
                  placeholder="Any special instructions or requests..."
                  value={formData.specialRequests}
                  onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          )}

          {/* Step 2: Review & Payment */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="font-medium">Review Your Purchase</h3>
              <div className="p-4 bg-muted-50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span>Item:</span>
                  <span>{listing.title}</span>
                </div>
                <div className="flex justify-between">
                  <span>Condition:</span>
                  <span className="capitalize">{listing.condition}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="capitalize">{formData.deliveryMethod}</span>
                </div>
                {formData.deliveryMethod === 'delivery' && formData.deliveryAddress && (
                  <div className="flex justify-between">
                    <span>Address:</span>
                    <span className="text-sm text-muted-foreground-600 max-w-xs truncate">
                      {formData.deliveryAddress}
                    </span>
                  </div>
                )}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total:</span>
                    <span>{formatPrice(listing.sale_price_cents)}</span>
                  </div>
                </div>
              </div>

              {/* Important Notice */}
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-primary-600 mr-2 mt-0.5" />
                  <div className="text-sm text-primary-800">
                    <p className="font-medium mb-1">Important:</p>
                    <ul className="space-y-1 text-xs">
                      <li>• Payment will be processed immediately upon confirmation</li>
                      <li>• The seller will be notified of your purchase</li>
                      <li>• Arrange pickup/delivery details with the seller after payment</li>
                      <li>• All sales are final - please inspect the item before payment</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              onClick={step < 2 ? handleNext : handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-border mr-2"></div>
                  Processing...
                </>
              ) : step < 2 ? (
                'Next'
              ) : (
                <>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Pay Now
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
