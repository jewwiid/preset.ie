// Temporarily disabled until Stripe package is installed properly
// import Stripe from 'stripe';

// Placeholder for Stripe functionality
export const stripe = {
  // Placeholder methods
  customers: {
    create: () => Promise.reject(new Error('Stripe not installed')),
    retrieve: () => Promise.reject(new Error('Stripe not installed')),
    update: () => Promise.reject(new Error('Stripe not installed')),
    del: () => Promise.reject(new Error('Stripe not installed')),
  },
  paymentMethods: {
    list: () => Promise.reject(new Error('Stripe not installed')),
  },
  invoices: {
    list: () => Promise.reject(new Error('Stripe not installed')),
  },
  checkout: {
    sessions: {
      create: () => Promise.reject(new Error('Stripe not installed')),
      retrieve: () => Promise.reject(new Error('Stripe not installed')),
    }
  },
  webhooks: {
    constructEvent: () => { throw new Error('Stripe not installed'); }
  }
};

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
} as const;

export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 10,
    priceUsd: 5.00,
    stripePriceId: 'price_starter_pack', // Replace with actual Stripe price ID
    description: '10 credits for image enhancements',
  },
  {
    id: 'creative',
    name: 'Creative Pack',
    credits: 50,
    priceUsd: 20.00,
    stripePriceId: 'price_creative_pack', // Replace with actual Stripe price ID
    description: '50 credits for image enhancements',
    popular: true,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 100,
    priceUsd: 35.00,
    stripePriceId: 'price_pro_pack', // Replace with actual Stripe price ID
    description: '100 credits for image enhancements',
  },
  {
    id: 'studio',
    name: 'Studio Pack',
    credits: 500,
    priceUsd: 150.00,
    stripePriceId: 'price_studio_pack', // Replace with actual Stripe price ID
    description: '500 credits for image enhancements',
  },
] as const;

export type CreditPackage = typeof CREDIT_PACKAGES[number];