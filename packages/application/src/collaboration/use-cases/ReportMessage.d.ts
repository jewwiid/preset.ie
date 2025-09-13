import { EventBus, IdGenerator } from '@preset/domain';
export interface ReportMessageCommand {
    reporterId: string;
    messageId: string;
    reason: 'spam' | 'inappropriate' | 'harassment' | 'scam' | 'other';
    description: string;
    evidenceUrls?: string[];
}
export interface ReportMessageResult {
    reportId: string;
    status: 'submitted';
    priority: 'low' | 'medium' | 'high' | 'critical';
}
export interface MessageReportRepository {
    submitReport(report: {
        id: string;
        reporterId: string;
        messageId: string;
        reason: string;
        description: string;
        evidenceUrls?: string[];
        priority: string;
    }): Promise<void>;
    getExistingReport(reporterId: string, messageId: string): Promise<string | null>;
}
export declare class ReportMessageUseCase {
    private reportRepository;
    private eventBus;
    private idGenerator;
    constructor(reportRepository: MessageReportRepository, eventBus: EventBus, idGenerator: IdGenerator);
    execute(command: ReportMessageCommand): Promise<ReportMessageResult>;
    private calculatePriority;
}
//# sourceMappingURL=ReportMessage.d.ts.map