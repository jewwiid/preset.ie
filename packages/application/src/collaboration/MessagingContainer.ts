import { SupabaseClient } from '@supabase/supabase-js';
import { ConversationRepository } from '@preset/domain/collaboration/ports/ConversationRepository';
import { UserBlockRepository } from '@preset/domain/collaboration/ports/UserBlockRepository';
import { GigRepository } from '@preset/domain/gigs/ports/GigRepository';
import { ApplicationRepository } from '@preset/domain/applications/ports/ApplicationRepository';
import { EventBus } from '@preset/domain/shared/EventBus';
import { IdGenerator } from '@preset/domain/shared/IdGenerator';
import { SupabaseConversationRepository } from '@preset/adapters/repositories/supabase-conversation-repository';
import { SupabaseUserBlockRepository } from '@preset/adapters/collaboration/SupabaseUserBlockRepository';
import { SupabaseGigRepository } from '@preset/adapters/persistence/SupabaseGigRepository';
import { SupabaseApplicationRepository } from '@preset/adapters/persistence/SupabaseApplicationRepository';
import { SupabaseEventBus } from '@preset/adapters/events/SupabaseEventBus';
import { SupabaseContentModerationRepository } from '@preset/adapters/moderation/SupabaseContentModerationRepository';
import { SupabaseMessageReportRepository } from '@preset/adapters/reports/SupabaseMessageReportRepository';
import { ContentModerationService } from './services/ContentModerationService';
import { SendMessageUseCase } from './use-cases/SendMessage';
import { GetConversationsUseCase } from './use-cases/GetConversations';
import { BlockUserUseCase } from './use-cases/BlockUser';
import { UnblockUserUseCase } from './use-cases/UnblockUser';
import { GetBlockedUsersUseCase } from './use-cases/GetBlockedUsers';
import { CheckUserBlockedUseCase } from './use-cases/CheckUserBlocked';
import { ReportMessageUseCase } from './use-cases/ReportMessage';

export class MessagingContainer {
  private static instance: MessagingContainer;
  
  // Infrastructure
  private eventBus: EventBus;
  private idGenerator: IdGenerator;
  
  // Repositories
  private conversationRepository: ConversationRepository;
  private userBlockRepository: UserBlockRepository;
  private gigRepository: GigRepository;
  private applicationRepository: ApplicationRepository;
  private contentModerationRepository: SupabaseContentModerationRepository;
  private messageReportRepository: SupabaseMessageReportRepository;
  
  // Services
  private contentModerationService: ContentModerationService;
  
  // Use Cases
  private sendMessageUseCase: SendMessageUseCase;
  private getConversationsUseCase: GetConversationsUseCase;
  private blockUserUseCase: BlockUserUseCase;
  private unblockUserUseCase: UnblockUserUseCase;
  private getBlockedUsersUseCase: GetBlockedUsersUseCase;
  private checkUserBlockedUseCase: CheckUserBlockedUseCase;
  private reportMessageUseCase: ReportMessageUseCase;

  private constructor(private supabase: SupabaseClient) {
    this.initializeInfrastructure();
    this.initializeRepositories();
    this.initializeServices();
    this.initializeUseCases();
  }

  static getInstance(supabase: SupabaseClient): MessagingContainer {
    if (!MessagingContainer.instance) {
      MessagingContainer.instance = new MessagingContainer(supabase);
    }
    return MessagingContainer.instance;
  }

  private initializeInfrastructure(): void {
    this.eventBus = new SupabaseEventBus(this.supabase);
    this.idGenerator = {
      generate: () => crypto.randomUUID()
    };
  }

  private initializeRepositories(): void {
    // Get Supabase connection details
    const supabaseUrl = this.supabase.supabaseUrl;
    const supabaseKey = this.supabase.supabaseKey;

    this.conversationRepository = new SupabaseConversationRepository(supabaseUrl, supabaseKey);
    this.userBlockRepository = new SupabaseUserBlockRepository(supabaseUrl, supabaseKey);
    this.gigRepository = new SupabaseGigRepository(this.supabase);
    this.applicationRepository = new SupabaseApplicationRepository(this.supabase);
    this.contentModerationRepository = new SupabaseContentModerationRepository(supabaseUrl, supabaseKey);
    this.messageReportRepository = new SupabaseMessageReportRepository(supabaseUrl, supabaseKey);
  }

  private initializeServices(): void {
    this.contentModerationService = new ContentModerationService(
      this.contentModerationRepository
    );
  }

  private initializeUseCases(): void {
    this.sendMessageUseCase = new SendMessageUseCase(
      this.conversationRepository,
      this.gigRepository,
      this.applicationRepository,
      this.eventBus,
      this.idGenerator,
      this.contentModerationService
    );

    this.getConversationsUseCase = new GetConversationsUseCase(
      this.conversationRepository,
      this.userBlockRepository
    );

    this.blockUserUseCase = new BlockUserUseCase(
      this.userBlockRepository,
      this.eventBus,
      this.idGenerator
    );

    this.unblockUserUseCase = new UnblockUserUseCase(
      this.userBlockRepository,
      this.eventBus
    );

    this.getBlockedUsersUseCase = new GetBlockedUsersUseCase(
      this.userBlockRepository
    );

    this.checkUserBlockedUseCase = new CheckUserBlockedUseCase(
      this.userBlockRepository
    );

    this.reportMessageUseCase = new ReportMessageUseCase(
      this.messageReportRepository,
      this.eventBus,
      this.idGenerator
    );
  }

  // Use Case Getters
  getSendMessageUseCase(): SendMessageUseCase {
    return this.sendMessageUseCase;
  }

  getGetConversationsUseCase(): GetConversationsUseCase {
    return this.getConversationsUseCase;
  }

  getBlockUserUseCase(): BlockUserUseCase {
    return this.blockUserUseCase;
  }

  getUnblockUserUseCase(): UnblockUserUseCase {
    return this.unblockUserUseCase;
  }

  getGetBlockedUsersUseCase(): GetBlockedUsersUseCase {
    return this.getBlockedUsersUseCase;
  }

  getCheckUserBlockedUseCase(): CheckUserBlockedUseCase {
    return this.checkUserBlockedUseCase;
  }

  getReportMessageUseCase(): ReportMessageUseCase {
    return this.reportMessageUseCase;
  }

  // Service Getters
  getContentModerationService(): ContentModerationService {
    return this.contentModerationService;
  }

  // Repository Getters
  getConversationRepository(): ConversationRepository {
    return this.conversationRepository;
  }

  getUserBlockRepository(): UserBlockRepository {
    return this.userBlockRepository;
  }

  getContentModerationRepository(): SupabaseContentModerationRepository {
    return this.contentModerationRepository;
  }

  // Infrastructure Getters
  getEventBus(): EventBus {
    return this.eventBus;
  }

  getIdGenerator(): IdGenerator {
    return this.idGenerator;
  }
}

/**
 * Factory function to create messaging container
 */
export function createMessagingContainer(supabase: SupabaseClient): MessagingContainer {
  return MessagingContainer.getInstance(supabase);
}