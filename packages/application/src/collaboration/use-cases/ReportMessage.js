"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportMessageUseCase = void 0;
const domain_1 = require("@preset/domain");
class ReportMessageUseCase {
    constructor(reportRepository, eventBus, idGenerator) {
        this.reportRepository = reportRepository;
        this.eventBus = eventBus;
        this.idGenerator = idGenerator;
    }
    async execute(command) {
        // Validate required fields
        if (!command.reporterId || !command.messageId || !command.reason || !command.description) {
            throw new Error('Reporter ID, message ID, reason, and description are required');
        }
        // Check if user has already reported this message
        const existingReport = await this.reportRepository.getExistingReport(command.reporterId, command.messageId);
        if (existingReport) {
            throw new Error('You have already reported this message');
        }
        // Validate description length
        if (command.description.length < 10 || command.description.length > 1000) {
            throw new Error('Description must be between 10 and 1000 characters');
        }
        // Calculate priority based on reason
        const priority = this.calculatePriority(command.reason, command.description);
        // Generate report ID
        const reportId = domain_1.IdGenerator.generate();
        // Submit the report
        await this.reportRepository.submitReport({
            id: reportId,
            reporterId: command.reporterId,
            messageId: command.messageId,
            reason: command.reason,
            description: command.description,
            evidenceUrls: command.evidenceUrls,
            priority
        });
        // TODO: Publish domain event for notification system
        // await this.eventBus.publish(new MessageReportedEvent({
        //   reportId,
        //   messageId: command.messageId,
        //   reporterId: command.reporterId,
        //   reason: command.reason,
        //   priority
        // }));
        return {
            reportId,
            status: 'submitted',
            priority
        };
    }
    calculatePriority(reason, description) {
        // Critical priority keywords
        const criticalKeywords = ['threat', 'violence', 'harm', 'suicide', 'illegal', 'underage', 'minor'];
        // High priority reasons
        const highPriorityReasons = ['harassment', 'inappropriate'];
        // Check for critical keywords in description
        const lowerDescription = description.toLowerCase();
        if (criticalKeywords.some(keyword => lowerDescription.includes(keyword))) {
            return 'critical';
        }
        // Harassment and inappropriate content are high priority
        if (highPriorityReasons.includes(reason)) {
            return 'high';
        }
        // Scam reports are medium priority
        if (reason === 'scam') {
            return 'medium';
        }
        // Spam and other reports are low priority
        return 'low';
    }
}
exports.ReportMessageUseCase = ReportMessageUseCase;
//# sourceMappingURL=ReportMessage.js.map