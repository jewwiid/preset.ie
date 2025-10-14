'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar, Euro } from 'lucide-react';

interface RequestTypeFormProps {
  requestType: 'rent' | 'buy';
  onRequestTypeChange: (type: 'rent' | 'buy') => void;
  rentalStartDate: string;
  rentalEndDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  maxDailyRate: string;
  maxTotalPrice: string;
  maxPurchasePrice: string;
  onMaxDailyRateChange: (rate: string) => void;
  onMaxTotalPriceChange: (price: string) => void;
  onMaxPurchasePriceChange: (price: string) => void;
  errors?: {
    rental_start_date?: string;
    rental_end_date?: string;
    max_daily_rate_cents?: string;
    max_total_cents?: string;
    max_purchase_price_cents?: string;
  };
}

export function RequestTypeForm({
  requestType,
  onRequestTypeChange,
  rentalStartDate,
  rentalEndDate,
  onStartDateChange,
  onEndDateChange,
  maxDailyRate,
  maxTotalPrice,
  maxPurchasePrice,
  onMaxDailyRateChange,
  onMaxTotalPriceChange,
  onMaxPurchasePriceChange,
  errors = {} }: RequestTypeFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Euro className="h-5 w-5" />
          Request Type & Pricing
        </CardTitle>
        <CardDescription>
          Specify whether you want to rent or buy, and your budget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Request Type Selection */}
        <div>
          <Label>Request Type <span className="text-destructive">*</span></Label>
          <RadioGroup value={requestType} onValueChange={onRequestTypeChange} className="mt-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="rent" id="rent" />
              <Label htmlFor="rent" className="font-normal cursor-pointer">
                Rent - I need this temporarily
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="buy" id="buy" />
              <Label htmlFor="buy" className="font-normal cursor-pointer">
                Buy - I want to purchase this
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Rental Details */}
        {requestType === 'rent' && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-md border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Rental Period</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rental_start_date">
                  Start Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rental_start_date"
                  type="date"
                  value={rentalStartDate}
                  onChange={(e) => onStartDateChange(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className={errors.rental_start_date ? 'border-destructive' : ''}
                />
                {errors.rental_start_date && (
                  <p className="text-sm text-destructive mt-1">{errors.rental_start_date}</p>
                )}
              </div>

              <div>
                <Label htmlFor="rental_end_date">
                  End Date <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="rental_end_date"
                  type="date"
                  value={rentalEndDate}
                  onChange={(e) => onEndDateChange(e.target.value)}
                  min={rentalStartDate || new Date().toISOString().split('T')[0]}
                  className={errors.rental_end_date ? 'border-destructive' : ''}
                />
                {errors.rental_end_date && (
                  <p className="text-sm text-destructive mt-1">{errors.rental_end_date}</p>
                )}
              </div>
            </div>

            {rentalStartDate && rentalEndDate && (
              <div className="text-sm text-muted-foreground">
                Rental duration: {Math.ceil((new Date(rentalEndDate).getTime() - new Date(rentalStartDate).getTime()) / (1000 * 60 * 60 * 24))} days
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <Label htmlFor="max_daily_rate">Maximum Daily Rate (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="max_daily_rate"
                    type="number"
                    value={maxDailyRate ? (parseInt(maxDailyRate) / 100).toString() : ''}
                    onChange={(e) => {
                      const cents = Math.round(parseFloat(e.target.value || '0') * 100);
                      onMaxDailyRateChange(cents.toString());
                    }}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={`pl-10 ${errors.max_daily_rate_cents ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.max_daily_rate_cents && (
                  <p className="text-sm text-destructive mt-1">{errors.max_daily_rate_cents}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Your maximum budget per day
                </p>
              </div>

              <div>
                <Label htmlFor="max_total_price">Maximum Total Price (€)</Label>
                <div className="relative">
                  <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="max_total_price"
                    type="number"
                    value={maxTotalPrice ? (parseInt(maxTotalPrice) / 100).toString() : ''}
                    onChange={(e) => {
                      const cents = Math.round(parseFloat(e.target.value || '0') * 100);
                      onMaxTotalPriceChange(cents.toString());
                    }}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    className={`pl-10 ${errors.max_total_cents ? 'border-destructive' : ''}`}
                  />
                </div>
                {errors.max_total_cents && (
                  <p className="text-sm text-destructive mt-1">{errors.max_total_cents}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Optional: Your maximum total budget for the entire rental
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Purchase Details */}
        {requestType === 'buy' && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-md border">
            <div className="flex items-center gap-2 mb-2">
              <Euro className="h-4 w-4 text-primary" />
              <h4 className="font-medium">Purchase Budget</h4>
            </div>

            <div>
              <Label htmlFor="max_purchase_price">Maximum Purchase Price (€)</Label>
              <div className="relative">
                <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="max_purchase_price"
                  type="number"
                  value={maxPurchasePrice ? (parseInt(maxPurchasePrice) / 100).toString() : ''}
                  onChange={(e) => {
                    const cents = Math.round(parseFloat(e.target.value || '0') * 100);
                    onMaxPurchasePriceChange(cents.toString());
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className={`pl-10 ${errors.max_purchase_price_cents ? 'border-destructive' : ''}`}
                />
              </div>
              {errors.max_purchase_price_cents && (
                <p className="text-sm text-destructive mt-1">{errors.max_purchase_price_cents}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Optional: Specify your maximum budget for purchasing this equipment
              </p>
            </div>
          </div>
        )}

        {/* Helper Info */}
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md border border-blue-200 dark:border-blue-900">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            💡 <strong>Tip:</strong> Setting a budget helps owners know if their equipment matches your price range.
            You can always negotiate the final price later.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
