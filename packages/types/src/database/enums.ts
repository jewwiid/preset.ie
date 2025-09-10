export enum UserRole {
  CONTRIBUTOR = 'contributor',
  TALENT = 'talent',
  ADMIN = 'admin',
}

export enum SubscriptionTier {
  FREE = 'free',
  PLUS = 'plus',
  PRO = 'pro',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  PAST_DUE = 'past_due',
}

export enum GigStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

export enum ApplicationStatus {
  PENDING = 'pending',
  SHORTLISTED = 'shortlisted',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  WITHDRAWN = 'withdrawn',
}

export enum CompensationType {
  TFP = 'tfp',
  PAID = 'paid',
  EXPENSES = 'expenses',
}

export enum MediaType {
  IMAGE = 'image',
  VIDEO = 'video',
  PDF = 'pdf',
}

export enum ShowcaseStatus {
  DRAFT = 'draft',
  PENDING_APPROVAL = 'pending_approval',
  APPROVED = 'approved',
  PUBLISHED = 'published',
  REJECTED = 'rejected',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWING = 'reviewing',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

export enum ReportType {
  SPAM = 'spam',
  INAPPROPRIATE = 'inappropriate',
  HARASSMENT = 'harassment',
  FAKE_PROFILE = 'fake_profile',
  SAFETY_CONCERN = 'safety_concern',
  COPYRIGHT = 'copyright',
  OTHER = 'other',
}

export enum NotificationType {
  APPLICATION_RECEIVED = 'application_received',
  APPLICATION_STATUS = 'application_status',
  MESSAGE = 'message',
  GIG_REMINDER = 'gig_reminder',
  SHOWCASE_REQUEST = 'showcase_request',
  REVIEW_REQUEST = 'review_request',
  SUBSCRIPTION = 'subscription',
  SYSTEM = 'system',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  EMAIL_VERIFIED = 'email_verified',
  PHONE_VERIFIED = 'phone_verified',
  ID_VERIFIED = 'id_verified',
  FULLY_VERIFIED = 'fully_verified',
}