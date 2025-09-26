'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, Crown, TrendingUp, X } from 'lucide-react';

interface EnhancementOption {
  type: 'basic_bump' | 'priority_bump' | 'premium_bump';
  title: string;
  subtitle: string;
  price: number;
  duration: string;
  benefits: string[];
  icon: React.ReactNode;
  gradient: string;
  sellMultiplier: string;
}

const ENHANCEMENT_OPTIONS: EnhancementOption[] = [
  {
    type: 'premium_bump',
    title: 'Premium Boost',
    subtitle: '7 days on top with Premium badge',
    price: 7,
    duration: '7 days',
    benefits: ['Top placement', 'Premium badge', 'Maximum visibility'],
    icon: <Crown className="w-6 h-6" />,
    gradient: 'bg-secondary',
    sellMultiplier: 'Sell 3x faster'
  },
  {
    type: 'priority_bump',
    title: 'Priority Boost',
    subtitle: '3 days above basic ads',
    price: 5,
    duration: '3 days',
    benefits: ['Above basic listings', 'Priority placement'],
    icon: <Zap className="w-6 h-6" />,
    gradient: 'bg-primary',
    sellMultiplier: 'Sell 2x faster'
  },
  {
    type: 'basic_bump',
    title: 'Basic Boost',
    subtitle: 'Moves to the top of all basic ads',
    price: 1,
    duration: '1 day',
    benefits: ['Top of basic listings', 'Increased visibility'],
    icon: <TrendingUp className="w-6 h-6" />,
    gradient: 'bg-muted',
    sellMultiplier: 'Basic Boost'
  }
];

interface ListingEnhancementModalProps {
  listingId: string;
  isOpen: boolean;
  onClose: () => void;
  userSubscriptionTier?: string;
}

export default function ListingEnhancementModal({ 
  listingId, 
  isOpen, 
  onClose,
  userSubscriptionTier = 'FREE'
}: ListingEnhancementModalProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEnhancement = async (option: EnhancementOption) => {
    setLoading(true);
    try {
      // Check if user has subscription benefits first
      if (userSubscriptionTier !== 'FREE') {
        const response = await fetch('/api/marketplace/enhancements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            listingId,
            enhancementType: option.type,
            userId: 'current-user-id' // TODO: Get from auth context
          })
        });

        const result = await response.json();
        
        if (result.success) {
          // Enhancement applied using subscription benefit
          alert('Enhancement applied using your subscription benefit!');
          onClose();
          return;
        }
      }

      // Create Stripe Checkout session for paid enhancement
      const response = await fetch('/api/marketplace/enhancements/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          enhancementType: option.type,
          userId: 'current-user-id' // TODO: Get from auth context
        })
      });

      const { url, amount, duration_days } = await response.json();
      
      if (url) {
        // Redirect to Stripe Checkout
        window.location.href = url;
      }
      
    } catch (error) {
      console.error('Enhancement failed:', error);
      alert('Failed to apply enhancement. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSubscriptionBenefit = (option: EnhancementOption) => {
    if (userSubscriptionTier === 'PLUS' && option.type === 'priority_bump') {
      return { included: true, remaining: 1 }; // This should come from API
    }
    if (userSubscriptionTier === 'PRO' && option.type === 'premium_bump') {
      return { included: true, remaining: 3 }; // This should come from API
    }
    return { included: false, remaining: 0 };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-muted-foreground-900">Select Boost Type</h2>
            <button 
              onClick={onClose} 
              className="text-muted-foreground-400 hover:text-muted-foreground-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {ENHANCEMENT_OPTIONS.map((option) => {
            const benefit = getSubscriptionBenefit(option);
            
            return (
              <Card 
                key={option.type}
                className={`cursor-pointer transition-all border-2 ${
                  selectedOption === option.type 
                    ? 'border-primary-500 shadow-lg' 
                    : 'border-border-200 hover:border-border-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedOption(option.type)}
              >
                <CardContent className="p-0">
                  {/* Header */}
                  <div className={`${option.gradient} text-primary-foreground rounded-t-lg p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {option.icon}
                        <div>
                          <h3 className="text-xl font-bold">{option.sellMultiplier}</h3>
                          <p className="text-primary-foreground/90 text-sm">{option.subtitle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">€{option.price}</div>
                        <div className="text-sm text-primary-foreground/80">{option.duration}</div>
                      </div>
                    </div>
                  </div>

                  {/* Benefits List */}
                  <div className="p-4 space-y-2">
                    {option.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="px-4 pb-4">
                    {benefit.included ? (
                      <div className="space-y-2">
                        <Badge variant="secondary">
                          Included in {userSubscriptionTier} subscription
                        </Badge>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnhancement(option);
                          }}
                          disabled={loading || benefit.remaining === 0}
                          className="w-full"
                        >
                          {benefit.remaining === 0 
                            ? 'Monthly limit reached' 
                            : `Use Free ${option.title} (${benefit.remaining} remaining)`
                          }
                        </Button>
                      </div>
                    ) : (
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEnhancement(option);
                        }}
                        disabled={loading}
                        variant="outline"
                        className="w-full"
                      >
                        {option.title} for €{option.price}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border-200 px-6 py-4 rounded-b-2xl">
          <div className="text-center">
            <a 
              href="#" 
              className="text-primary-600 hover:text-primary-800 text-sm transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Show help modal about free bumps
                alert('Free bumps are available for new users in their first 30 days!');
              }}
            >
              What happened to my free boost after 30 days?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
