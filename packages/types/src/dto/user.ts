import { UserRole, SubscriptionTier, VerificationStatus } from '../database/enums';

export interface UserDTO {
  id: string;
  email: string;
  role: UserRole;
  profile?: ProfileDTO;
  subscription?: SubscriptionDTO;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileDTO {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  styleTags: string[];
  verificationStatus: VerificationStatus;
  stats?: ProfileStatsDTO;
  socials?: SocialsDTO;
}

export interface ProfileStatsDTO {
  rating: number;
  reviewCount: number;
  showcaseCount: number;
  completedGigs: number;
  profileViews: number;
  responseRate: number;
  responseTime: number; // in minutes
}

export interface SocialsDTO {
  instagram?: string;
  website?: string;
  portfolio?: string;
  linkedin?: string;
  twitter?: string;
}

export interface SubscriptionDTO {
  tier: SubscriptionTier;
  status: string;
  startedAt: Date;
  expiresAt?: Date;
  features: SubscriptionFeatureDTO[];
  usage: SubscriptionUsageDTO;
}

export interface SubscriptionFeatureDTO {
  name: string;
  enabled: boolean;
  limit?: number;
  used?: number;
}

export interface SubscriptionUsageDTO {
  gigsThisMonth: number;
  applicationsThisMonth: number;
  showcases: number;
  boostsAvailable: number;
}

export interface PublicProfileDTO {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  role: UserRole;
  styleTags: string[];
  verificationStatus: VerificationStatus;
  rating?: number;
  reviewCount?: number;
  showcaseCount?: number;
  completedGigs?: number;
  socials?: SocialsDTO;
}

export interface UserSearchResultDTO {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  city?: string;
  role: UserRole;
  styleTags: string[];
  rating?: number;
  verified: boolean;
}