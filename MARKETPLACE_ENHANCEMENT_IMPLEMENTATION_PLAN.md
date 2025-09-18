# 🚀 Marketplace Listing Enhancement System - Complete Implementation Plan

## 📋 Overview

This plan implements a comprehensive marketplace listing enhancement system similar to the image you shared, with subscription tiers, bumping features, prominent badges, and Stripe payment integration.

## 🎯 Features to Implement

### 1. **Listing Enhancement Tiers**
- **Basic Bump** (€1): Bumps listing to top of basic ads
- **Priority Bump** (€5): 3 days above basic ads  
- **Premium Bump** (€7): 7 days on top with Premium badge

### 2. **Subscription Benefits**
- **Free Tier**: Basic listings only
- **Plus Tier**: Priority bump included monthly
- **Pro Tier**: Premium bump included monthly + unlimited bumps

### 3. **Prominent Badges**
- **Premium Badge**: For premium bumped listings
- **Verified Badge**: For verified users
- **Subscription Badge**: Shows user's subscription tier

### 4. **Payment Integration**
- Stripe payment processing
- One-time payments for bumps
- Subscription-based benefits
- Credit system integration

---

## 🗄️ Database Schema Extensions

### 1. **Listing Enhancements Table**

```sql
-- Marketplace listing enhancements
CREATE TABLE IF NOT EXISTS listing_enhancements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  enhancement_type VARCHAR(20) NOT NULL CHECK (enhancement_type IN ('basic_bump', 'priority_bump', 'premium_bump')),
  payment_intent_id VARCHAR(255), -- Stripe payment intent
  amount_cents INTEGER NOT NULL,
  duration_days INTEGER NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_listing_enhancements_listing_id ON listing_enhancements(listing_id);
CREATE INDEX idx_listing_enhancements_user_id ON listing_enhancements(user_id);
CREATE INDEX idx_listing_enhancements_expires_at ON listing_enhancements(expires_at);
CREATE INDEX idx_listing_enhancements_status ON listing_enhancements(status);
```

### 2. **Subscription Benefits Table**

```sql
-- Subscription benefits tracking
CREATE TABLE IF NOT EXISTS subscription_benefits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users_profile(id) ON DELETE CASCADE,
  subscription_tier VARCHAR(20) NOT NULL,
  benefit_type VARCHAR(50) NOT NULL, -- 'monthly_bump', 'unlimited_bumps', etc.
  benefit_value JSONB NOT NULL, -- Flexible benefit data
  used_this_month INTEGER DEFAULT 0,
  monthly_limit INTEGER DEFAULT 0,
  last_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, benefit_type)
);

-- Indexes
CREATE INDEX idx_subscription_benefits_user_id ON subscription_benefits(user_id);
CREATE INDEX idx_subscription_benefits_tier ON subscription_benefits(subscription_tier);
```

### 3. **Enhanced Listings Table**

```sql
-- Add enhancement fields to existing listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS current_enhancement_type VARCHAR(20),
ADD COLUMN IF NOT EXISTS enhancement_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS boost_level INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS premium_badge BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_badge BOOLEAN DEFAULT FALSE;

-- Index for enhanced listings
CREATE INDEX idx_listings_enhancement_expires ON listings(enhancement_expires_at) WHERE enhancement_expires_at IS NOT NULL;
CREATE INDEX idx_listings_boost_level ON listings(boost_level);
```

---

## 💳 Payment Integration

### 1. **Stripe Payment Intent Creation**

```typescript
// apps/web/app/api/marketplace/enhancements/create-payment-intent/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const ENHANCEMENT_PRICING = {
  basic_bump: { amount: 100, duration_days: 1 }, // €1
  priority_bump: { amount: 500, duration_days: 3 }, // €5
  premium_bump: { amount: 700, duration_days: 7 } // €7
};

export async function POST(request: NextRequest) {
  try {
    const { listingId, enhancementType, userId } = await request.json();
    
    // Verify user owns the listing
    const { data: listing } = await supabase
      .from('listings')
      .select('id, owner_id')
      .eq('id', listingId)
      .eq('owner_id', userId)
      .single();
    
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }
    
    const pricing = ENHANCEMENT_PRICING[enhancementType];
    
    // Create Stripe payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: pricing.amount,
      currency: 'eur',
      metadata: {
        listing_id: listingId,
        enhancement_type: enhancementType,
        user_id: userId
      }
    });
    
    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      amount: pricing.amount,
      duration_days: pricing.duration_days
    });
    
  } catch (error) {
    return NextResponse.json({ error: 'Payment intent creation failed' }, { status: 500 });
  }
}
```

### 2. **Payment Confirmation Webhook**

```typescript
// apps/web/app/api/stripe/webhook/route.ts
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    
    // Create listing enhancement
    await createListingEnhancement({
      listingId: paymentIntent.metadata.listing_id,
      userId: paymentIntent.metadata.user_id,
      enhancementType: paymentIntent.metadata.enhancement_type,
      paymentIntentId: paymentIntent.id,
      amountCents: paymentIntent.amount,
      durationDays: ENHANCEMENT_PRICING[paymentIntent.metadata.enhancement_type].duration_days
    });
  }
  
  return NextResponse.json({ received: true });
}
```

---

## 🎨 Frontend Components

### 1. **Enhancement Selection Modal**

```typescript
// apps/web/components/marketplace/ListingEnhancementModal.tsx
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Zap, Crown, TrendingUp } from 'lucide-react';

interface EnhancementOption {
  type: 'basic_bump' | 'priority_bump' | 'premium_bump';
  title: string;
  subtitle: string;
  price: number;
  duration: string;
  benefits: string[];
  icon: React.ReactNode;
  gradient: string;
}

const ENHANCEMENT_OPTIONS: EnhancementOption[] = [
  {
    type: 'basic_bump',
    title: 'Basic Bump',
    subtitle: 'Bumps to the top of all basic ads',
    price: 1,
    duration: '1 day',
    benefits: ['Top of basic listings', 'Increased visibility'],
    icon: <TrendingUp className="w-6 h-6" />,
    gradient: 'from-gray-400 to-gray-600'
  },
  {
    type: 'priority_bump',
    title: 'Priority Bump',
    subtitle: '3 days above basic ads',
    price: 5,
    duration: '3 days',
    benefits: ['Above basic listings', 'Priority placement', '2x faster selling'],
    icon: <Zap className="w-6 h-6" />,
    gradient: 'from-purple-500 to-purple-700'
  },
  {
    type: 'premium_bump',
    title: 'Premium Bump',
    subtitle: '7 days on top with Premium badge',
    price: 7,
    duration: '7 days',
    benefits: ['Top placement', 'Premium badge', '3x faster selling', 'Maximum visibility'],
    icon: <Crown className="w-6 h-6" />,
    gradient: 'from-pink-500 to-red-600'
  }
];

export default function ListingEnhancementModal({ 
  listingId, 
  isOpen, 
  onClose 
}: { 
  listingId: string; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleEnhancement = async (option: EnhancementOption) => {
    setLoading(true);
    try {
      // Create payment intent
      const response = await fetch('/api/marketplace/enhancements/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId,
          enhancementType: option.type
        })
      });

      const { client_secret } = await response.json();
      
      // Redirect to Stripe Checkout or handle payment
      // Implementation depends on your Stripe setup
      
    } catch (error) {
      console.error('Enhancement failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Select Bump Type</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="space-y-4">
          {ENHANCEMENT_OPTIONS.map((option) => (
            <Card 
              key={option.type}
              className={`cursor-pointer transition-all ${
                selectedOption === option.type ? 'ring-2 ring-emerald-500' : 'hover:shadow-lg'
              }`}
              onClick={() => setSelectedOption(option.type)}
            >
              <CardContent className="p-6">
                <div className={`bg-gradient-to-r ${option.gradient} text-white rounded-lg p-4 mb-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {option.icon}
                      <div>
                        <h3 className="text-xl font-bold">{option.title}</h3>
                        <p className="text-white/90">{option.subtitle}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">€{option.price}</div>
                      <div className="text-sm text-white/80">{option.duration}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {option.benefits.map((benefit, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Star className="w-4 h-4 text-emerald-500 fill-current" />
                      <span className="text-gray-700">{benefit}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleEnhancement(option)}
                  disabled={loading}
                  className="w-full"
                >
                  {option.title} for €{option.price}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 text-center">
          <a href="#" className="text-blue-600 hover:text-blue-800 text-sm">
            What happened to my free bump after 30 days?
          </a>
        </div>
      </div>
    </div>
  );
}
```

### 2. **Enhanced Listing Card**

```typescript
// apps/web/components/marketplace/EnhancedListingCard.tsx
'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Zap, TrendingUp, Star } from 'lucide-react';

interface EnhancedListingCardProps {
  listing: {
    id: string;
    title: string;
    description: string;
    price_cents: number;
    images: Array<{ url: string; alt_text?: string }>;
    current_enhancement_type?: string;
    enhancement_expires_at?: string;
    premium_badge?: boolean;
    verified_badge?: boolean;
    boost_level: number;
  };
}

export default function EnhancedListingCard({ listing }: EnhancedListingCardProps) {
  const getEnhancementBadge = () => {
    if (listing.current_enhancement_type === 'premium_bump') {
      return (
        <Badge className="bg-gradient-to-r from-pink-500 to-red-600 text-white">
          <Crown className="w-3 h-3 mr-1" />
          Premium
        </Badge>
      );
    }
    if (listing.current_enhancement_type === 'priority_bump') {
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-purple-700 text-white">
          <Zap className="w-3 h-3 mr-1" />
          Priority
        </Badge>
      );
    }
    if (listing.current_enhancement_type === 'basic_bump') {
      return (
        <Badge className="bg-gray-600 text-white">
          <TrendingUp className="w-3 h-3 mr-1" />
          Bumped
        </Badge>
      );
    }
    return null;
  };

  const getBoostIndicator = () => {
    if (listing.boost_level > 0) {
      return (
        <div className="flex items-center space-x-1 text-emerald-600">
          <Star className="w-4 h-4 fill-current" />
          <span className="text-sm font-medium">Boosted</span>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="relative overflow-hidden">
      {/* Enhancement Badge */}
      {getEnhancementBadge() && (
        <div className="absolute top-2 left-2 z-10">
          {getEnhancementBadge()}
        </div>
      )}

      {/* Boost Indicator */}
      {getBoostIndicator() && (
        <div className="absolute top-2 right-2 z-10">
          {getBoostIndicator()}
        </div>
      )}

      <CardContent className="p-0">
        {/* Listing Image */}
        <div className="aspect-square relative">
          <img
            src={listing.images[0]?.url || '/placeholder-image.jpg'}
            alt={listing.images[0]?.alt_text || listing.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Listing Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg mb-2 line-clamp-2">
            {listing.title}
          </h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {listing.description}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-emerald-600">
              €{(listing.price_cents / 100).toFixed(2)}/day
            </div>
            
            {/* User Badges */}
            <div className="flex space-x-1">
              {listing.verified_badge && (
                <Badge variant="secondary" className="text-xs">
                  Verified
                </Badge>
              )}
              {listing.premium_badge && (
                <Badge className="bg-gradient-to-r from-pink-500 to-red-600 text-white text-xs">
                  Premium
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 🔧 Backend Services

### 1. **Enhancement Service**

```typescript
// apps/web/lib/services/enhancement.service.ts
import { supabase } from '@/lib/supabase';

export class EnhancementService {
  static async createListingEnhancement(data: {
    listingId: string;
    userId: string;
    enhancementType: string;
    paymentIntentId: string;
    amountCents: number;
    durationDays: number;
  }) {
    const startsAt = new Date();
    const expiresAt = new Date(startsAt.getTime() + data.durationDays * 24 * 60 * 60 * 1000);

    // Create enhancement record
    const { data: enhancement, error } = await supabase
      .from('listing_enhancements')
      .insert({
        listing_id: data.listingId,
        user_id: data.userId,
        enhancement_type: data.enhancementType,
        payment_intent_id: data.paymentIntentId,
        amount_cents: data.amountCents,
        duration_days: data.durationDays,
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    // Update listing with enhancement
    await supabase
      .from('listings')
      .update({
        current_enhancement_type: data.enhancementType,
        enhancement_expires_at: expiresAt.toISOString(),
        premium_badge: data.enhancementType === 'premium_bump',
        boost_level: this.getBoostLevel(data.enhancementType)
      })
      .eq('id', data.listingId);

    return enhancement;
  }

  static getBoostLevel(enhancementType: string): number {
    switch (enhancementType) {
      case 'premium_bump': return 3;
      case 'priority_bump': return 2;
      case 'basic_bump': return 1;
      default: return 0;
    }
  }

  static async getActiveEnhancements(listingId: string) {
    const { data, error } = await supabase
      .from('listing_enhancements')
      .select('*')
      .eq('listing_id', listingId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())
      .order('expires_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async expireEnhancements() {
    // Run this as a cron job to expire enhancements
    const { data, error } = await supabase
      .from('listing_enhancements')
      .update({ status: 'expired' })
      .lt('expires_at', new Date().toISOString())
      .eq('status', 'active')
      .select();

    if (error) throw error;

    // Update listings to remove expired enhancements
    for (const enhancement of data || []) {
      await supabase
        .from('listings')
        .update({
          current_enhancement_type: null,
          enhancement_expires_at: null,
          premium_badge: false,
          boost_level: 0
        })
        .eq('id', enhancement.listing_id);
    }

    return data;
  }
}
```

### 2. **Subscription Benefits Service**

```typescript
// apps/web/lib/services/subscription-benefits.service.ts
export class SubscriptionBenefitsService {
  static async checkMonthlyBumpEligibility(userId: string, subscriptionTier: string): Promise<boolean> {
    const { data: benefit, error } = await supabase
      .from('subscription_benefits')
      .select('*')
      .eq('user_id', userId)
      .eq('benefit_type', 'monthly_bump')
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    if (!benefit) {
      // Create benefit record
      const monthlyLimit = this.getMonthlyBumpLimit(subscriptionTier);
      await supabase
        .from('subscription_benefits')
        .insert({
          user_id: userId,
          subscription_tier: subscriptionTier,
          benefit_type: 'monthly_bump',
          benefit_value: { type: 'monthly_bump' },
          monthly_limit: monthlyLimit,
          used_this_month: 0
        });
      
      return monthlyLimit > 0;
    }

    // Reset monthly usage if new month
    const now = new Date();
    const lastReset = new Date(benefit.last_reset_at);
    if (now.getMonth() !== lastReset.getMonth() || now.getFullYear() !== lastReset.getFullYear()) {
      await supabase
        .from('subscription_benefits')
        .update({
          used_this_month: 0,
          last_reset_at: now.toISOString()
        })
        .eq('id', benefit.id);
      
      return benefit.monthly_limit > 0;
    }

    return benefit.used_this_month < benefit.monthly_limit;
  }

  static async useMonthlyBump(userId: string, listingId: string) {
    const { data: benefit, error } = await supabase
      .from('subscription_benefits')
      .select('*')
      .eq('user_id', userId)
      .eq('benefit_type', 'monthly_bump')
      .single();

    if (error) throw error;

    // Increment usage
    await supabase
      .from('subscription_benefits')
      .update({
        used_this_month: benefit.used_this_month + 1
      })
      .eq('id', benefit.id);

    // Create enhancement using subscription benefit
    const enhancementType = this.getSubscriptionBumpType(benefit.subscription_tier);
    return EnhancementService.createListingEnhancement({
      listingId,
      userId,
      enhancementType,
      paymentIntentId: `subscription_${benefit.id}`,
      amountCents: 0, // Free for subscribers
      durationDays: this.getSubscriptionBumpDuration(enhancementType)
    });
  }

  static getMonthlyBumpLimit(tier: string): number {
    switch (tier) {
      case 'FREE': return 0;
      case 'PLUS': return 1;
      case 'PRO': return 3;
      default: return 0;
    }
  }

  static getSubscriptionBumpType(tier: string): string {
    switch (tier) {
      case 'PLUS': return 'priority_bump';
      case 'PRO': return 'premium_bump';
      default: return 'basic_bump';
    }
  }

  static getSubscriptionBumpDuration(enhancementType: string): number {
    switch (enhancementType) {
      case 'premium_bump': return 7;
      case 'priority_bump': return 3;
      case 'basic_bump': return 1;
      default: return 1;
    }
  }
}
```

---

## 📱 API Endpoints

### 1. **Enhancement Management**

```typescript
// apps/web/app/api/marketplace/enhancements/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listing_id');
  
  if (!listingId) {
    return NextResponse.json({ error: 'Listing ID required' }, { status: 400 });
  }

  const enhancements = await EnhancementService.getActiveEnhancements(listingId);
  return NextResponse.json({ enhancements });
}

export async function POST(request: NextRequest) {
  const { listingId, enhancementType, userId } = await request.json();
  
  // Check if user has subscription benefits
  const { data: profile } = await supabase
    .from('users_profile')
    .select('subscription_tier')
    .eq('id', userId)
    .single();

  if (profile?.subscription_tier !== 'FREE') {
    const eligible = await SubscriptionBenefitsService.checkMonthlyBumpEligibility(
      userId, 
      profile.subscription_tier
    );
    
    if (eligible) {
      await SubscriptionBenefitsService.useMonthlyBump(userId, listingId);
      return NextResponse.json({ 
        success: true, 
        message: 'Enhancement applied using subscription benefit' 
      });
    }
  }

  // Fall back to paid enhancement
  return NextResponse.json({ 
    error: 'Payment required for enhancement' 
  }, { status: 402 });
}
```

### 2. **Listing Feed with Enhancements**

```typescript
// apps/web/app/api/marketplace/listings/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  // Enhanced query with boost levels
  const { data: listings, error } = await supabase
    .from('listings')
    .select(`
      *,
      listing_enhancements!inner(
        enhancement_type,
        expires_at
      )
    `)
    .eq('status', 'active')
    .order('boost_level', { ascending: false }) // Premium bumps first
    .order('enhancement_expires_at', { ascending: false }) // Active enhancements first
    .order('created_at', { ascending: false }) // Then by creation date
    .range(offset, offset + limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ listings });
}
```

---

## 🔄 Implementation Steps

### **Phase 1: Database Setup (Week 1)**
1. ✅ Run database migrations for enhancement tables
2. ✅ Set up Stripe webhook endpoints
3. ✅ Create enhancement service classes
4. ✅ Test payment flow integration

### **Phase 2: Frontend Components (Week 2)**
1. ✅ Build enhancement selection modal
2. ✅ Create enhanced listing cards
3. ✅ Add subscription benefit indicators
4. ✅ Implement payment flow UI

### **Phase 3: Backend Integration (Week 3)**
1. ✅ Connect Stripe payment processing
2. ✅ Implement subscription benefit logic
3. ✅ Create enhancement expiration cron jobs
4. ✅ Add notification system integration

### **Phase 4: Testing & Polish (Week 4)**
1. ✅ Test all payment flows
2. ✅ Verify subscription benefits work correctly
3. ✅ Test enhancement expiration
4. ✅ Add analytics and monitoring

---

## 🎯 Expected Results

### **User Experience**
- **Free Users**: Can see enhancement options, must pay for bumps
- **Plus Users**: Get 1 priority bump per month included
- **Pro Users**: Get 3 premium bumps per month included
- **All Users**: Clear visual indicators of enhanced listings

### **Revenue Model**
- **One-time Payments**: €1-€7 per enhancement
- **Subscription Upsells**: Higher tiers get more included benefits
- **Increased Engagement**: Enhanced listings get more visibility

### **Technical Benefits**
- **Scalable Architecture**: Uses existing Stripe and Supabase infrastructure
- **Real-time Updates**: Enhancements expire automatically
- **Analytics Ready**: Track enhancement performance and revenue

This implementation provides a complete marketplace listing enhancement system that integrates seamlessly with your existing subscription model and payment infrastructure! 🚀
