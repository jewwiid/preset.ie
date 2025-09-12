"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContentFlaggedError = exports.ContentRejectedError = exports.ContentModerationError = exports.ContentModerationService = void 0;
const DomainError_1 = require("../../shared/DomainError");
class ContentModerationService {
    constructor(moderationRepo) {
        this.moderationRepo = moderationRepo;
    }
    /**
     * Moderate content in real-time before it's sent/posted
     */
    async moderateContent(request) {
        const { content, contentType, userId } = request;
        // Get user's moderation history
        const userStats = await this.moderationRepo.getUserModerationStats(userId);
        // Perform content analysis
        const analysis = this.analyzeContent(content);
        // Apply user history multiplier
        const riskMultiplier = this.calculateRiskMultiplier(userStats);
        const adjustedScore = Math.min(100, analysis.severityScore * riskMultiplier);
        // Determine action based on score and user history
        const action = this.determineAction(adjustedScore, userStats, contentType);
        const result = {
            shouldFlag: analysis.shouldFlag || action !== 'allow',
            reasons: analysis.reasons,
            severityScore: adjustedScore,
            action
        };
        // Queue for manual review if flagged
        if (result.shouldFlag && action === 'flag_for_review') {
            await this.moderationRepo.queueForModeration({
                contentId: `temp_${Date.now()}_${userId}`, // Will be replaced with actual ID
                contentType,
                contentText: content,
                userId,
                flaggedReasons: result.reasons,
                severityScore: adjustedScore
            });
        }
        return result;
    }
    /**
     * Queue existing content for moderation (post-creation)
     */
    async queueExistingContent(contentId, contentType, content, userId) {
        const analysis = this.analyzeContent(content);
        if (analysis.shouldFlag) {
            return await this.moderationRepo.queueForModeration({
                contentId,
                contentType,
                contentText: content,
                userId,
                flaggedReasons: analysis.reasons,
                severityScore: analysis.severityScore
            });
        }
        return null;
    }
    /**
     * Resolve a moderation queue item
     */
    async resolveModeration(queueId, reviewerId, decision, notes) {
        return await this.moderationRepo.resolveItem(queueId, reviewerId, decision, notes);
    }
    /**
     * Get pending moderation queue
     */
    async getModerationQueue(filters) {
        return await this.moderationRepo.getModerationQueue(filters);
    }
    /**
     * Get user's moderation statistics
     */
    async getUserStats(userId) {
        return await this.moderationRepo.getUserModerationStats(userId);
    }
    /**
     * Analyze content for potential violations
     */
    analyzeContent(content) {
        const reasons = [];
        let score = 0;
        let shouldFlag = false;
        const lowerContent = content.toLowerCase();
        // Check for inappropriate language
        const inappropriateWords = [
            'fuck', 'shit', 'damn', 'bitch', 'asshole', 'bastard', 'crap'
        ];
        const hateSpeechWords = [
            'hate', 'nazi', 'racist', 'sexist', 'homophobic', 'transphobic'
        ];
        const explicitWords = [
            'nude', 'naked', 'sex', 'porn', 'xxx', 'nsfw', 'adult'
        ];
        const spamPatterns = [
            'buy now', 'click here', 'free money', 'get rich', 'promotion',
            'follow me', 'like for like', 'sub4sub', 'follow4follow',
            'visit my profile', 'check out my', 'dm me', 'message me',
            'whatsapp', 'instagram', 'telegram', 'snapchat', 'onlyfans'
        ];
        // Check inappropriate language
        if (inappropriateWords.some(word => lowerContent.includes(word))) {
            reasons.push('inappropriate_language');
            score += 20;
            shouldFlag = true;
        }
        // Check hate speech
        if (hateSpeechWords.some(word => lowerContent.includes(word))) {
            reasons.push('hate_speech');
            score += 40;
            shouldFlag = true;
        }
        // Check explicit content
        if (explicitWords.some(word => lowerContent.includes(word))) {
            reasons.push('explicit_content');
            score += 30;
            shouldFlag = true;
        }
        // Check spam patterns
        if (spamPatterns.some(pattern => lowerContent.includes(pattern))) {
            reasons.push('potential_spam');
            score += 25;
            shouldFlag = true;
        }
        // Check for excessive caps (>50% of text)
        if (content.length > 10) {
            const capsCount = (content.match(/[A-Z]/g) || []).length;
            const capsRatio = capsCount / content.length;
            if (capsRatio > 0.5) {
                reasons.push('excessive_caps');
                score += 15;
                shouldFlag = true;
            }
        }
        // Check for repeated characters (spam pattern)
        if (/(.)\1{4,}/.test(content)) {
            reasons.push('spam_pattern');
            score += 15;
            shouldFlag = true;
        }
        // Check for URLs
        if (/(https?:\/\/|www\.|\.com|\.org|\.net)/.test(lowerContent)) {
            reasons.push('external_links');
            score += 20;
            shouldFlag = true;
        }
        // Cap the severity score
        score = Math.min(score, 100);
        return { shouldFlag, reasons, severityScore: score };
    }
    /**
     * Calculate risk multiplier based on user history
     */
    calculateRiskMultiplier(stats) {
        let multiplier = 1.0;
        // Recent violations increase risk
        if (stats.flaggedLast30Days > 3)
            multiplier += 0.5;
        if (stats.flaggedLast30Days > 5)
            multiplier += 0.5;
        // Total violations
        if (stats.totalFlagged > 5)
            multiplier += 0.3;
        if (stats.totalFlagged > 10)
            multiplier += 0.3;
        // Resolved violations (confirmed bad behavior)
        if (stats.resolvedViolations > 2)
            multiplier += 0.4;
        if (stats.resolvedViolations > 5)
            multiplier += 0.4;
        // Cap the multiplier
        return Math.min(multiplier, 3.0);
    }
    /**
     * Determine what action to take based on score and user history
     */
    determineAction(score, userStats, contentType) {
        // Auto-reject for very high scores
        if (score >= 80 || userStats.resolvedViolations >= 5) {
            return 'auto_reject';
        }
        // Shadow ban for repeat offenders
        if (score >= 60 && userStats.flaggedLast30Days >= 3) {
            return 'shadow_ban';
        }
        // Rate limit for moderate scores with history
        if (score >= 40 && userStats.totalFlagged >= 3) {
            return 'rate_limit';
        }
        // Flag for manual review
        if (score >= 30 || (score >= 20 && userStats.totalFlagged > 0)) {
            return 'flag_for_review';
        }
        // Allow content
        return 'allow';
    }
}
exports.ContentModerationService = ContentModerationService;
// Error classes
class ContentModerationError extends DomainError_1.DomainError {
    constructor(message, code) {
        super(message);
        this.code = code;
        this.name = 'ContentModerationError';
    }
}
exports.ContentModerationError = ContentModerationError;
class ContentRejectedError extends ContentModerationError {
    constructor(reasons) {
        super(`Content rejected: ${reasons.join(', ')}`, 'CONTENT_REJECTED');
    }
}
exports.ContentRejectedError = ContentRejectedError;
class ContentFlaggedError extends ContentModerationError {
    constructor(message = 'Content flagged for review') {
        super(message, 'CONTENT_FLAGGED');
    }
}
exports.ContentFlaggedError = ContentFlaggedError;
//# sourceMappingURL=ContentModerationService.js.map