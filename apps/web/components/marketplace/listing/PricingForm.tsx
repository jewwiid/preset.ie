'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CurrencyInput } from '@/components/ui/currency-input';
import { DollarSign } from 'lucide-react';

interface PricingFormProps {
  mode: 'rent' | 'sale' | 'both';
  rentDayCents: string;
  rentWeekCents: string;
  salePriceCents: string;
  retainerMode: 'none' | 'credit_hold' | 'card_hold';
  retainerCents: string;
  depositCents: string;
  borrowOk: boolean;
  onModeChange: (value: 'rent' | 'sale' | 'both') => void;
  onRentDayChange: (value: string) => void;
  onRentWeekChange: (value: string) => void;
  onSalePriceChange: (value: string) => void;
  onRetainerModeChange: (value: 'none' | 'credit_hold' | 'card_hold') => void;
  onRetainerCentsChange: (value: string) => void;
  onDepositCentsChange: (value: string) => void;
  onBorrowOkChange: (value: boolean) => void;
}

const retainerModes = [
  { value: 'none', label: 'No Retainer' },
  { value: 'credit_hold', label: 'Credit Hold' },
  { value: 'card_hold', label: 'Card Hold' },
];

export function PricingForm({
  mode,
  rentDayCents,
  rentWeekCents,
  salePriceCents,
  retainerMode,
  retainerCents,
  depositCents,
  borrowOk,
  onModeChange,
  onRentDayChange,
  onRentWeekChange,
  onSalePriceChange,
  onRetainerModeChange,
  onRetainerCentsChange,
  onDepositCentsChange,
  onBorrowOkChange}: PricingFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Pricing & Availability
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="mode">Listing Type *</Label>
          <Select value={mode} onValueChange={onModeChange}>
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

        {(mode === 'rent' || mode === 'both') && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rent_day_cents">Daily Rent Price (€) *</Label>
              <CurrencyInput
                value={rentDayCents ? Number(rentDayCents) / 100 : 0}
                onChange={(value) => onRentDayChange(Math.round(value * 100).toString())}
                placeholder="0.00"
              />
            </div>
            <div>
              <Label htmlFor="rent_week_cents">Weekly Rent Price (€)</Label>
              <CurrencyInput
                value={rentWeekCents ? Number(rentWeekCents) / 100 : 0}
                onChange={(value) => onRentWeekChange(Math.round(value * 100).toString())}
                placeholder="0.00"
              />
            </div>
          </div>
        )}

        {(mode === 'sale' || mode === 'both') && (
          <div>
            <Label htmlFor="sale_price_cents">Sale Price (€) *</Label>
            <CurrencyInput
              value={salePriceCents ? Number(salePriceCents) / 100 : 0}
              onChange={(value) => onSalePriceChange(Math.round(value * 100).toString())}
              placeholder="0.00"
            />
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="retainer_mode">Retainer Mode</Label>
            <Select value={retainerMode} onValueChange={onRetainerModeChange}>
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
            <CurrencyInput
              value={retainerCents ? Number(retainerCents) / 100 : 0}
              onChange={(value) => onRetainerCentsChange(Math.round(value * 100).toString())}
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="deposit_cents">Deposit Amount (€)</Label>
          <CurrencyInput
            value={depositCents ? Number(depositCents) / 100 : 0}
            onChange={(value) => onDepositCentsChange(Math.round(value * 100).toString())}
            placeholder="0.00"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Switch id="borrow_ok" checked={borrowOk} onCheckedChange={onBorrowOkChange} />
          <Label htmlFor="borrow_ok">Allow free borrowing</Label>
        </div>
      </CardContent>
    </Card>
  );
}
