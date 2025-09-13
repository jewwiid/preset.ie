import { DomainError } from '@preset/domain';
export interface ModerationResult {
    shouldFlag: boolean;
    reasons: ModerationReason[];
    severityScore: number;
    action: ModerationAction;
}
export type ModerationReason = 'inappropriate_language' | 'potential_spam' | 'excessive_caps' | 'spam_pattern' | 'external_links' | 'harassment' | 'hate_speech' | 'explicit_content';
export type ModerationAction = 'allow' | 'flag_for_review' | 'auto_reject' | 'shadow_ban' | 'rate_limit';
export interface ContentModerationRequest {
    content: string;
    contentType: 'message' | 'gig' | 'profile' | 'showcase';
    userId: string;
    metadata?: Record<string, unknown>;
}
export interface ModerationQueueItem {
    id: string;
    contentId: string;
    contentType: string;
    contentText: string;
    userId: string;
    flaggedReasons: string[];
    severityScore: number;
    status: 'pending' | 'reviewing' | 'approved' | 'rejected' | 'escalated';
    reviewerId?: string;
    autoFlaggedAt: Date;
    reviewedAt?: Date;
    resolutionNotes?: string;
    metadata: Record<string, unknown>;
}
export interface UserModerationStats {
    totalFlagged: number;
    flaggedLast30Days: number;
    resolvedViolations: number;
    currentRiskScore: number;
}
export interface ContentModerationRepository {
    queueForModeration(item: {
        contentId: string;
        contentType: string;
        contentText: string;
        userId: string;
        flaggedReasons: string[];
        severityScore: number;
    }): Promise<string>;
    resolveItem(queueId: string, reviewerId: string, status: string, notes?: string): Promise<boolean>;
    getModerationQueue(filters?: {
        status?: string;
        severityMin?: number;
        limit?: number;
        offset?: number;
    }): Promise<ModerationQueueItem[]>;
    getUserModerationStats(userId: string): Promise<UserModerationStats>;
}
export declare class ContentModerationService {
    private moderationRepo;
    constructor(moderationRepo: ContentModerationRepository);
    /**
     * Moderate content in real-time before it's sent/posted
     */
    moderateContent(request: ContentModerationRequest): Promise<ModerationResult>;
    /**
     * Queue existing content for moderation (post-creation)
     */
    queueExistingContent(contentId: string, contentType: string, content: string, userId: string): Promise<string | null>;
    /**
     * Resolve a moderation queue item
     */
    resolveModeration(queueId: string, reviewerId: string, decision: 'approved' | 'rejected' | 'escalated', notes?: string): Promise<boolean>;
    /**
     * Get pending moderation queue
     */
    getModerationQueue(filters?: {
        status?: string;
        severityMin?: number;
        limit?: number;
        offset?: number;
    }): Promise<ModerationQueueItem[]>;
    /**
     * Get user's moderation statistics
     */
    getUserStats(userId: string): Promise<UserModerationStats>;
    /**
     * Analyze content for potential violations
     */
    private analyzeContent;
    /**
     * Calculate risk multiplier based on user history
     */
    private calculateRiskMultiplier;
    /**
     * Determine what action to take based on score and user history
     */
    private determineAction;
}
export declare class ContentModerationError extends DomainError {
    readonly code: string;
    constructor(message: string, code: string);
}
export declare class ContentRejectedError extends ContentModerationError {
    constructor(reasons: ModerationReason[]);
}
export declare class ContentFlaggedError extends ContentModerationError {
    constructor(message?: string);
}
//# sourceMappingURL=ContentModerationService.d.ts.map