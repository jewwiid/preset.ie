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
    title: 'Premium Bump',
    subtitle: '7 days on top with Premium badge',
    price: 7,
    duration: '7 days',
    benefits: ['Top placement', 'Premium badge', 'Maximum visibility'],
    icon: <Crown className="w-6 h-6" />,
    gradient: 'from-pink-500 to-red-600',
    sellMultiplier: 'Sell 3x faster'
  },
  {
    type: 'priority_bump',
    title: 'Priority Bump',
    subtitle: '3 days above basic ads',
    price: 5,
    duration: '3 days',
    benefits: ['Above basic listings', 'Priority placement'],
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-purple-500 to-purple-700',
    sellMultiplier: 'Sell 2x faster'
  },
  {
    type: 'basic_bump',
    title: 'Basic Bump',
    subtitle: 'Bumps to the top of all basic ads',
    price: 1,
    duration: '1 day',
    benefits: ['Top of basic listings', 'Increased visibility'],
    icon: <TrendingUp className="w-6 h-6" />,
    gradient: 'from-gray-400 to-gray-600',
    sellMultiplier: 'Basic Bump'
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
            userId: 'current-user-id' // This should come from auth context
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

      // Create payment intent for paid enhancement
      const response = await fetch('/api/marketplace/enhancements/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          enhancementType: option.type,
          userId: 'current-user-id' // This should come from auth context
        })
      });

      const { client_secret, amount, duration_days } = await response.json();
      
      if (client_secret) {
        // TODO: Integrate with Stripe Checkout or Elements
        console.log('Payment intent created:', { client_secret, amount, duration_days });
        alert(`Payment required: €${option.price} for ${option.duration}`);
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
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Select Bump Type</h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
                    ? 'border-emerald-500 shadow-lg' 
                    : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
                onClick={() => setSelectedOption(option.type)}
              >
                <CardContent className="p-0">
                  {/* Gradient Header */}
                  <div className={`bg-gradient-to-r ${option.gradient} text-white rounded-t-lg p-4`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {option.icon}
                        <div>
                          <h3 className="text-xl font-bold">{option.sellMultiplier}</h3>
                          <p className="text-white/90 text-sm">{option.subtitle}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">€{option.price}</div>
                        <div className="text-sm text-white/80">{option.duration}</div>
                      </div>
                    </div>
                  </div>

                  {/* Benefits List */}
                  <div className="p-4 space-y-2">
                    {option.benefits.map((benefit, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Star className="w-4 h-4 text-emerald-500 fill-current" />
                        <span className="text-gray-700 text-sm">{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Button */}
                  <div className="px-4 pb-4">
                    {benefit.included ? (
                      <div className="space-y-2">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                          Included in {userSubscriptionTier} subscription
                        </Badge>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEnhancement(option);
                          }}
                          disabled={loading || benefit.remaining === 0}
                          className="w-full bg-emerald-600 hover:bg-emerald-700"
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
                        className="w-full bg-white text-gray-900 border border-gray-300 hover:bg-gray-50"
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
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-2xl">
          <div className="text-center">
            <a 
              href="#" 
              className="text-blue-600 hover:text-blue-800 text-sm transition-colors"
              onClick={(e) => {
                e.preventDefault();
                // TODO: Show help modal about free bumps
                alert('Free bumps are available for new users in their first 30 days!');
              }}
            >
              What happened to my free bump after 30 days?
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
