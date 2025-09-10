import { 
  UserRole, 
  SubscriptionTier, 
  SubscriptionStatus,
  GigStatus,
  ApplicationStatus,
  CompensationType,
  MediaType,
  ShowcaseStatus,
  ReportStatus,
  ReportType,
  NotificationType,
  VerificationStatus
} from './enums';

export interface Database {
  public: {
    Tables: {
      users_profile: {
        Row: UserProfile;
        Insert: Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<UserProfile, 'id'>>;
      };
      gigs: {
        Row: Gig;
        Insert: Omit<Gig, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Gig, 'id'>>;
      };
      applications: {
        Row: Application;
        Insert: Omit<Application, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Application, 'id'>>;
      };
      media: {
        Row: Media;
        Insert: Omit<Media, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Media, 'id'>>;
      };
      moodboards: {
        Row: Moodboard;
        Insert: Omit<Moodboard, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Moodboard, 'id'>>;
      };
      showcases: {
        Row: Showcase;
        Insert: Omit<Showcase, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Showcase, 'id'>>;
      };
      messages: {
        Row: Message;
        Insert: Omit<Message, 'id' | 'created_at'>;
        Update: Partial<Omit<Message, 'id'>>;
      };
      subscriptions: {
        Row: Subscription;
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Subscription, 'id'>>;
      };
      reviews: {
        Row: Review;
        Insert: Omit<Review, 'id' | 'created_at'>;
        Update: Partial<Omit<Review, 'id'>>;
      };
      reports: {
        Row: Report;
        Insert: Omit<Report, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Report, 'id'>>;
      };
      notifications: {
        Row: Notification;
        Insert: Omit<Notification, 'id' | 'created_at'>;
        Update: Partial<Omit<Notification, 'id'>>;
      };
      domain_events: {
        Row: DomainEvent;
        Insert: Omit<DomainEvent, 'id' | 'created_at'>;
        Update: never;
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      user_role: UserRole;
      subscription_tier: SubscriptionTier;
      subscription_status: SubscriptionStatus;
      gig_status: GigStatus;
      application_status: ApplicationStatus;
      compensation_type: CompensationType;
      media_type: MediaType;
      showcase_status: ShowcaseStatus;
      report_status: ReportStatus;
      report_type: ReportType;
      notification_type: NotificationType;
      verification_status: VerificationStatus;
    };
  };
}

export interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  handle: string;
  avatar_url?: string;
  bio?: string;
  city?: string;
  role: UserRole;
  style_tags: string[];
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  verification_status: VerificationStatus;
  stripe_customer_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Gig {
  id: string;
  owner_user_id: string;
  title: string;
  description: string;
  purpose?: string;
  comp_type: CompensationType;
  location_text: string;
  lat?: number;
  lng?: number;
  radius_m?: number;
  start_time: string;
  end_time?: string;
  application_deadline: string;
  max_applicants?: number;
  usage_rights?: string;
  safety_notes?: string;
  status: GigStatus;
  boost_level: number;
  created_at: string;
  updated_at: string;
}

export interface Application {
  id: string;
  gig_id: string;
  applicant_user_id: string;
  note?: string;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface Media {
  id: string;
  owner_user_id: string;
  gig_id?: string;
  showcase_id?: string;
  type: MediaType;
  bucket: string;
  path: string;
  url?: string;
  width?: number;
  height?: number;
  duration?: number;
  palette?: string[];
  blurhash?: string;
  exif_json?: Record<string, any>;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
}

export interface Moodboard {
  id: string;
  gig_id: string;
  owner_user_id: string;
  title?: string;
  summary?: string;
  palette?: string[];
  items: MoodboardItem[];
  created_at: string;
  updated_at: string;
}

export interface MoodboardItem {
  media_id: string;
  order: number;
  caption?: string;
}

export interface Showcase {
  id: string;
  gig_id: string;
  creator_user_id: string;
  talent_user_id: string;
  media_ids: string[];
  caption?: string;
  tags?: string[];
  palette?: string[];
  approved_by_creator_at?: string;
  approved_by_talent_at?: string;
  status: ShowcaseStatus;
  visibility: 'public' | 'private';
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  gig_id: string;
  from_user_id: string;
  to_user_id: string;
  body: string;
  attachments?: string[];
  read_at?: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripe_subscription_id?: string;
  stripe_price_id?: string;
  started_at: string;
  expires_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Review {
  id: string;
  gig_id: string;
  reviewer_user_id: string;
  reviewed_user_id: string;
  rating: number;
  comment?: string;
  tags?: string[];
  created_at: string;
}

export interface Report {
  id: string;
  reporter_user_id: string;
  reported_user_id?: string;
  reported_gig_id?: string;
  reported_showcase_id?: string;
  reported_message_id?: string;
  type: ReportType;
  description: string;
  status: ReportStatus;
  resolved_by?: string;
  resolution_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read_at?: string;
  created_at: string;
}

export interface DomainEvent {
  id: string;
  aggregate_id: string;
  aggregate_type: string;
  event_type: string;
  event_version: number;
  event_data: Record<string, any>;
  metadata?: Record<string, any>;
  created_at: string;
}