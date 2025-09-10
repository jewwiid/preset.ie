export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  field?: string;
  timestamp?: string;
}

export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
  version?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface BatchResponse<T = any> {
  success: boolean;
  results: BatchResult<T>[];
  summary: BatchSummary;
}

export interface BatchResult<T = any> {
  id: string;
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface BatchSummary {
  total: number;
  succeeded: number;
  failed: number;
  duration: number;
}

export interface UploadResponse {
  success: boolean;
  mediaId: string;
  url: string;
  signedUrl?: string;
  expiresAt?: string;
  metadata?: MediaMetadata;
}

export interface MediaMetadata {
  width?: number;
  height?: number;
  duration?: number;
  format?: string;
  size: number;
  blurhash?: string;
  palette?: string[];
}

export interface AuthResponse {
  success: boolean;
  user?: AuthUser;
  session?: Session;
  error?: ApiError;
}

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  profile?: UserProfileResponse;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  expiresIn: number;
}

export interface UserProfileResponse {
  id: string;
  userId: string;
  displayName: string;
  handle: string;
  avatarUrl?: string;
  bio?: string;
  city?: string;
  role: string;
  styleTags: string[];
  subscriptionTier: string;
  verificationStatus: string;
  rating?: number;
  reviewCount?: number;
  showcaseCount?: number;
  completedGigs?: number;
  createdAt: string;
}

export interface GigResponse {
  id: string;
  owner: UserProfileResponse;
  title: string;
  description: string;
  purpose?: string;
  compType: string;
  locationText: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  radiusM?: number;
  startTime: string;
  endTime?: string;
  applicationDeadline: string;
  maxApplicants?: number;
  currentApplicants: number;
  usageRights?: string;
  safetyNotes?: string;
  status: string;
  boostLevel: number;
  moodboard?: MoodboardResponse;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MoodboardResponse {
  id: string;
  title?: string;
  summary?: string;
  palette?: string[];
  items: MoodboardItemResponse[];
}

export interface MoodboardItemResponse {
  mediaId: string;
  url: string;
  thumbnailUrl?: string;
  order: number;
  caption?: string;
  blurhash?: string;
}

export interface ApplicationResponse {
  id: string;
  gig: GigResponse;
  applicant: UserProfileResponse;
  note?: string;
  status: string;
  appliedAt: string;
  updatedAt: string;
}

export interface ShowcaseResponse {
  id: string;
  gig: GigResponse;
  creator: UserProfileResponse;
  talent: UserProfileResponse;
  media: MediaResponse[];
  caption?: string;
  tags?: string[];
  palette?: string[];
  status: string;
  visibility: string;
  approvedByCreator: boolean;
  approvedByTalent: boolean;
  createdAt: string;
  publishedAt?: string;
}

export interface MediaResponse {
  id: string;
  url: string;
  thumbnailUrl?: string;
  type: string;
  width?: number;
  height?: number;
  duration?: number;
  blurhash?: string;
  caption?: string;
}

export interface MessageResponse {
  id: string;
  gigId: string;
  from: UserProfileResponse;
  to: UserProfileResponse;
  body: string;
  attachments?: MediaResponse[];
  readAt?: string;
  createdAt: string;
}

export interface ConversationResponse {
  gigId: string;
  gig: GigResponse;
  otherUser: UserProfileResponse;
  lastMessage?: MessageResponse;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewResponse {
  id: string;
  gig: GigResponse;
  reviewer: UserProfileResponse;
  reviewed: UserProfileResponse;
  rating: number;
  comment?: string;
  tags?: string[];
  response?: string;
  createdAt: string;
}

export interface NotificationResponse {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  readAt?: string;
  createdAt: string;
}

export interface SubscriptionResponse {
  id: string;
  tier: string;
  status: string;
  startedAt: string;
  expiresAt?: string;
  cancelledAt?: string;
  features: string[];
  limits: SubscriptionLimits;
}

export interface SubscriptionLimits {
  gigsPerMonth?: number;
  applicationsPerMonth?: number;
  showcases?: number;
  boostLevel?: number;
  maxApplicantsPerGig?: number;
}

export interface StatsResponse {
  totalGigs: number;
  activeGigs: number;
  completedGigs: number;
  totalApplications: number;
  averageRating?: number;
  totalReviews: number;
  showcases: number;
  profileViews: number;
  period?: string;
}