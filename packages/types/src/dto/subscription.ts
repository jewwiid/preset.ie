import { SubscriptionTier, SubscriptionStatus } from '../database/enums';

export interface SubscriptionDTO {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  startedAt: Date;
  expiresAt?: Date;
  cancelledAt?: Date;
  features: FeatureDTO[];
  limits: LimitsDTO;
  usage: UsageDTO;
  billing?: BillingDTO;
}

export interface FeatureDTO {
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  value?: any;
}

export interface LimitsDTO {
  gigsPerMonth: number;
  applicationsPerMonth: number;
  showcases: number;
  boostLevel: number;
  maxApplicantsPerGig: number;
  moodboardItems: number;
  messageAttachments: number;
  storageGB: number;
}

export interface UsageDTO {
  gigsThisMonth: number;
  applicationsThisMonth: number;
  showcasesTotal: number;
  boostsUsed: number;
  storageUsedGB: number;
  periodStart: Date;
  periodEnd: Date;
}

export interface BillingDTO {
  nextBillingDate?: Date;
  amount?: number;
  currency?: string;
  paymentMethod?: PaymentMethodDTO;
  invoices?: InvoiceDTO[];
}

export interface PaymentMethodDTO {
  id: string;
  type: 'card' | 'bank_account';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface InvoiceDTO {
  id: string;
  amount: number;
  currency: string;
  status: 'draft' | 'open' | 'paid' | 'void';
  paidAt?: Date;
  dueAt?: Date;
  downloadUrl?: string;
}

export interface SubscriptionPlanDTO {
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly?: number;
    currency: string;
  };
  features: string[];
  limits: LimitsDTO;
  highlighted?: boolean;
}

export interface CheckoutSessionDTO {
  sessionId: string;
  url: string;
  expiresAt: Date;
}

export interface UpgradeOptionsDTO {
  currentTier: SubscriptionTier;
  availablePlans: SubscriptionPlanDTO[];
  proratedAmount?: number;
  immediateUpgrade: boolean;
}