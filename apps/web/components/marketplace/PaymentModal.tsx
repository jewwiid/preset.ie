'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { CreditCard, Coins, Shield, Euro, AlertCircle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PaymentModalProps {
  order: {
    id: string;
    type: 'rental' | 'sale';
    amount_cents: number;
    retainer_cents?: number;
    deposit_cents?: number;
    title: string;
    owner_name: string;
  };
  onSuccess?: (paymentResult: any) => void;
  onCancel?: () => void;
}

interface UserCredits {
  current_balance: number;
  monthly_allowance: number;
  consumed_this_month: number;
}

export default function PaymentModal({ order, onSuccess, onCancel }: PaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'credits' | 'stripe'>('credits');
  const [userCredits, setUserCredits] = useState<UserCredits | null>(null);
  const [loading, setLoading] = useState(false);
  const [creditsLoading, setCreditsLoading] = useState(true);

  useEffect(() => {
    fetchUserCredits();
  }, []);

  const fetchUserCredits = async () => {
    try {
      setCreditsLoading(true);
      const response = await fetch('/api/admin/credit-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Find user's credit info in the response
        // This is a simplified approach - in production, you'd have a dedicated endpoint
        setUserCredits({
          current_balance: data.user_balance || 0,
          monthly_allowance: data.monthly_allowance || 0,
          consumed_this_month: data.consumed_this_month || 0
        });
      }
    } catch (error) {
      console.error('Error fetching user credits:', error);
    } finally {
      setCreditsLoading(false);
    }
  };

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(2)}`;
  };

  const calculateTotal = () => {
    return order.amount_cents + (order.retainer_cents || 0) + (order.deposit_cents || 0);
  };

  const canPayWithCredits = () => {
    if (!userCredits) return false;
    return userCredits.current_balance >= calculateTotal();
  };

  const handlePayment = async () => {
    if (loading) return;

    setLoading(true);
    try {
      const paymentData = {
        order_type: order.type,
        order_id: order.id,
        payment_method: paymentMethod,
        amount_cents: order.amount_cents,
        retainer_cents: order.retainer_cents || 0,
        deposit_cents: order.deposit_cents || 0
      };

      const response = await fetch('/api/marketplace/payments/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
        },
        body: JSON.stringify(paymentData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Payment processed successfully!');
        if (onSuccess) {
          onSuccess(data);
        }
      } else {
        toast.error(data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Complete Payment</CardTitle>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel}>
                ×
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Order Summary</h3>
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Item:</span>
                <span className="text-sm font-medium">{order.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Owner:</span>
                <span className="text-sm font-medium">{order.owner_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <Badge variant="outline" className="text-xs">
                  {order.type}
                </Badge>
              </div>
            </div>
          </div>

          {/* Payment Breakdown */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Payment Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Base amount:</span>
                <span className="text-sm font-medium">{formatPrice(order.amount_cents)}</span>
              </div>
              {order.retainer_cents && order.retainer_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Retainer:</span>
                  <span className="text-sm font-medium">{formatPrice(order.retainer_cents)}</span>
                </div>
              )}
              {order.deposit_cents && order.deposit_cents > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Deposit:</span>
                  <span className="text-sm font-medium">{formatPrice(order.deposit_cents)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total:</span>
                <span>{formatPrice(calculateTotal())}</span>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">Payment Method</h3>
            <RadioGroup value={paymentMethod} onValueChange={(value: 'credits' | 'stripe') => setPaymentMethod(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="credits" id="credits" />
                <Label htmlFor="credits" className="flex items-center space-x-2 cursor-pointer">
                  <Coins className="h-4 w-4 text-yellow-500" />
                  <span>Credits</span>
                  {userCredits && (
                    <span className="text-sm text-gray-500">
                      ({userCredits.current_balance} available)
                    </span>
                  )}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="stripe" id="stripe" />
                <Label htmlFor="stripe" className="flex items-center space-x-2 cursor-pointer">
                  <CreditCard className="h-4 w-4 text-blue-500" />
                  <span>Credit Card</span>
                </Label>
              </div>
            </RadioGroup>

            {/* Credits Status */}
            {paymentMethod === 'credits' && (
              <div className="mt-3">
                {creditsLoading ? (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                    <span>Loading credit balance...</span>
                  </div>
                ) : userCredits ? (
                  <div className={`p-3 rounded-lg ${
                    canPayWithCredits() ? 'bg-primary-50 border border-primary/20' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {canPayWithCredits() ? (
                        <CheckCircle className="h-4 w-4 text-primary-600" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className={`text-sm font-medium ${
                        canPayWithCredits() ? 'text-primary-800' : 'text-red-800'
                      }`}>
                        {canPayWithCredits() 
                          ? `Sufficient credits available (${userCredits.current_balance} credits)`
                          : `Insufficient credits (need ${calculateTotal()}, have ${userCredits.current_balance})`
                        }
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <span className="text-sm font-medium text-red-800">
                        Unable to load credit balance
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <Shield className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Secure Payment</p>
                <p>Your payment is processed securely. Retainers are held until order completion.</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {onCancel && (
              <Button variant="outline" className="flex-1" onClick={onCancel}>
                Cancel
              </Button>
            )}
            <Button
              className="flex-1"
              onClick={handlePayment}
              disabled={loading || (paymentMethod === 'credits' && !canPayWithCredits())}
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <Euro className="h-4 w-4 mr-2" />
                  Pay {formatPrice(calculateTotal())}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
