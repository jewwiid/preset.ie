import Stripe from 'stripe';

// Initialize Stripe with secret key
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
} as const;

export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    priceUsd: 1.99,
    stripePriceId: 'price_starter_pack', // Replace with actual Stripe price ID
    description: 'Perfect for trying out image enhancements',
  },
  {
    id: 'basic',
    name: 'Basic Pack',
    credits: 25,
    priceUsd: 4.99,
    stripePriceId: 'price_basic_pack', // Replace with actual Stripe price ID
    description: 'Great for regular users',
  },
  {
    id: 'popular',
    name: 'Popular Pack',
    credits: 50,
    priceUsd: 8.99,
    stripePriceId: 'price_popular_pack', // Replace with actual Stripe price ID
    description: 'Most popular choice - best value',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 100,
    priceUsd: 14.99,
    stripePriceId: 'price_pro_pack', // Replace with actual Stripe price ID
    description: 'Perfect for power users',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 250,
    priceUsd: 29.99,
    stripePriceId: 'price_enterprise_pack', // Replace with actual Stripe price ID
    description: 'Maximum credits for heavy usage',
  },
  {
    id: 'creator',
    name: 'Creator Pack',
    credits: 500,
    priceUsd: 49.99,
    stripePriceId: 'price_creator_pack', // Replace with actual Stripe price ID
    description: 'Ultimate pack for professional creators',
  },
] as const;

export type CreditPackage = typeof CREDIT_PACKAGES[number];