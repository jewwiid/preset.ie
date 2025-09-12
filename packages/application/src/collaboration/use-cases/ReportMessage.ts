import { EventBus } from '@preset/domain/shared/EventBus';
import { IdGenerator } from '@preset/domain/shared/IdGenerator';

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

export class ReportMessageUseCase {
  constructor(
    private reportRepository: MessageReportRepository,
    private eventBus: EventBus,
    private idGenerator: IdGenerator
  ) {}

  async execute(command: ReportMessageCommand): Promise<ReportMessageResult> {
    // Validate required fields
    if (!command.reporterId || !command.messageId || !command.reason || !command.description) {
      throw new Error('Reporter ID, message ID, reason, and description are required');
    }

    // Check if user has already reported this message
    const existingReport = await this.reportRepository.getExistingReport(
      command.reporterId,
      command.messageId
    );

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
    const reportId = this.idGenerator.generate();

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

  private calculatePriority(reason: string, description: string): 'low' | 'medium' | 'high' | 'critical' {
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