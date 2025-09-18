'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  Euro, 
  CreditCard,
  CheckCircle,
  AlertCircle,
  Package,
  Star,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { OrderProcessingService } from '@/lib/services/order-processing.service';

interface Listing {
  id: string;
  title: string;
  description?: string;
  category: string;
  condition: string;
  rent_day_cents: number;
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

interface RentalOrderFlowProps {
  listing: Listing;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (orderId: string) => void;
}

export default function RentalOrderFlow({
  listing,
  isOpen,
  onClose,
  onSuccess
}: RentalOrderFlowProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    deliveryMethod: 'pickup' as 'pickup' | 'delivery',
    deliveryAddress: '',
    specialRequests: ''
  });
  const [orderSummary, setOrderSummary] = useState<{
    totalDays: number;
    dailyRate: number;
    totalAmount: number;
  } | null>(null);

  // Calculate order summary when dates change
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const dailyRate = listing.rent_day_cents / 100;
      const { totalDays, totalAmount } = OrderProcessingService.calculateRentalTotal(
        dailyRate,
        format(formData.startDate, 'yyyy-MM-dd'),
        format(formData.endDate, 'yyyy-MM-dd')
      );
      
      setOrderSummary({ totalDays, dailyRate, totalAmount });
    } else {
      setOrderSummary(null);
    }
  }, [formData.startDate, formData.endDate, listing.rent_day_cents]);

  const handleNext = () => {
    if (step === 1) {
      if (!formData.startDate || !formData.endDate) {
        setError('Please select rental dates');
        return;
      }
      if (formData.startDate >= formData.endDate) {
        setError('End date must be after start date');
        return;
      }
      setError(null);
      setStep(2);
    } else if (step === 2) {
      if (formData.deliveryMethod === 'delivery' && !formData.deliveryAddress.trim()) {
        setError('Please provide delivery address');
        return;
      }
      setError(null);
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    if (!orderSummary) return;

    setLoading(true);
    setError(null);

    try {
      const orderData = {
        listingId: listing.id,
        renterId: 'current-user-id', // This should come from auth context
        startDate: format(formData.startDate!, 'yyyy-MM-dd'),
        endDate: format(formData.endDate!, 'yyyy-MM-dd'),
        totalDays: orderSummary.totalDays,
        dailyRate: orderSummary.dailyRate,
        totalAmount: orderSummary.totalAmount,
        deliveryMethod: formData.deliveryMethod,
        deliveryAddress: formData.deliveryAddress,
        specialRequests: formData.specialRequests
      };

      const result = await OrderProcessingService.createRentalOrder(orderData);

      if (result.success && result.clientSecret) {
        // Here you would integrate with Stripe Elements for payment
        // For now, we'll simulate success
        onSuccess?.(result.orderId!);
        onClose();
      } else {
        setError(result.error || 'Failed to create rental order');
      }
    } catch (err) {
      console.error('Error creating rental order:', err);
      setError('Failed to create rental order');
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
          <CardTitle className="text-xl">Rent Equipment</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Listing Info */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium">{listing.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{listing.category}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="text-green-600 font-medium">
                    {formatPrice(listing.rent_day_cents)}/day
                  </span>
                  {(listing.location_city || listing.location_country) && (
                    <div className="flex items-center text-gray-500">
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
                  <div className="flex items-center text-sm text-gray-500">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    {listing.owner.rating.toFixed(1)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((stepNumber) => (
              <div key={stepNumber} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
            <div className="ml-4 text-sm text-gray-600">
              {step === 1 && 'Select Dates'}
              {step === 2 && 'Delivery Options'}
              {step === 3 && 'Review & Pay'}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Step 1: Date Selection */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="font-medium">Select Rental Dates</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, 'PPP') : 'Select start date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, startDate: date }))}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.endDate ? format(formData.endDate, 'PPP') : 'Select end date'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={formData.endDate}
                        onSelect={(date) => setFormData(prev => ({ ...prev, endDate: date }))}
                        disabled={(date) => date < (formData.startDate || new Date())}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Delivery Options */}
          {step === 2 && (
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

          {/* Step 3: Review & Payment */}
          {step === 3 && orderSummary && (
            <div className="space-y-4">
              <h3 className="font-medium">Review Your Order</h3>
              <div className="p-4 bg-gray-50 rounded-lg space-y-3">
                <div className="flex justify-between">
                  <span>Rental Period:</span>
                  <span>{orderSummary.totalDays} days</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Rate:</span>
                  <span>{formatPrice(orderSummary.dailyRate * 100)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery:</span>
                  <span className="capitalize">{formData.deliveryMethod}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between font-medium text-lg">
                    <span>Total:</span>
                    <span>{formatPrice(orderSummary.totalAmount * 100)}</span>
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
              onClick={step < 3 ? handleNext : handleSubmit}
              disabled={loading || (step === 3 && !orderSummary)}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : step < 3 ? (
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
