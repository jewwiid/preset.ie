'use client';

import React from 'react';
import { CreditCard, Loader2 } from 'lucide-react';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface CreditPackageCardProps {
  packageData: {
    id: string;
    name: string;
    credits: number;
    price_usd: number;
    available?: boolean;
  };
  isPopular?: boolean;
  savings?: number;
  isPurchasing?: boolean;
  onPurchase: (packageId: string) => void;
  disabled?: boolean;
  badge?: string;
  badgeEmoji?: string;
}

export function CreditPackageCard({
  packageData,
  isPopular = false,
  savings = 0,
  isPurchasing = false,
  onPurchase,
  disabled = false,
  badge,
  badgeEmoji
}: CreditPackageCardProps) {
  const pricePerCredit = (packageData.price_usd / packageData.credits).toFixed(3);

  return (
    <div
      className={`relative rounded-lg border-2 p-6 flex flex-col h-full ${
        isPopular
          ? 'border-primary-500 shadow-lg'
          : 'border-border-200 hover:border-border-300'
      } ${!packageData.available ? 'opacity-50' : ''}`}
    >
      {/* Badge */}
      {(isPopular || badge) && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-md ${
            isPopular
              ? 'bg-primary-500 text-primary-foreground'
              : 'bg-primary text-primary-foreground'
          }`}>
            {badgeEmoji && `${badgeEmoji} `}
            {badge || 'MOST POPULAR'}
          </span>
        </div>
      )}

      {/* Content */}
      <div className="text-center flex-grow flex flex-col justify-center">
        <h3 className="text-xl font-bold text-muted-foreground-900">{packageData.name}</h3>
        <div className="mt-2">
          <span className="text-3xl font-bold text-muted-foreground-900">{packageData.credits}</span>
          <span className="text-muted-foreground-600 ml-1">credits</span>
        </div>
        <div className="mt-1">
          <span className="text-2xl font-bold text-primary-600">${packageData.price_usd.toFixed(2)}</span>
        </div>
        <div className="text-sm text-muted-foreground-500 mt-1">
          ${pricePerCredit} per credit
        </div>

        {/* Savings Badge */}
        {savings > 0 && (
          <div className="mt-3 mb-2">
            <span className="inline-block bg-primary-100 text-primary-700 px-2 py-1 rounded-full text-xs font-semibold">
              Save {savings}%
            </span>
          </div>
        )}

        {/* Unavailable Badge */}
        {packageData.available === false && (
          <div className="mt-2">
            <span className="inline-block bg-destructive-100 text-destructive-700 px-2 py-1 rounded-full text-xs font-semibold">
              Temporarily Unavailable
            </span>
          </div>
        )}
      </div>

      {/* Purchase Button */}
      <button
        onClick={() => onPurchase(packageData.id)}
        disabled={disabled || isPurchasing || packageData.available === false}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors flex items-center justify-center gap-2 ${
          isPopular
            ? 'bg-primary-600 text-primary-foreground hover:bg-primary-700'
            : 'bg-muted-900 text-primary-foreground hover:bg-muted-800'
        } disabled:opacity-50`}
      >
        {isPurchasing ? (
          <>
            <LoadingSpinner size="sm" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            {packageData.available === false ? 'Unavailable' : 'Purchase'}
          </>
        )}
      </button>
    </div>
  );
}
