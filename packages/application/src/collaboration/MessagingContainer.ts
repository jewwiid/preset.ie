import { SupabaseClient } from '@supabase/supabase-js';
import { ConversationRepository, UserBlockRepository, GigRepository, ApplicationRepository, EventBus, IdGenerator, ProfileRepository } from '@preset/domain';
// TODO: Implement these adapters
// import { SupabaseConversationRepository } from '@preset/adapters/repositories/supabase-conversation-repository';
// import { SupabaseUserBlockRepository } from '@preset/adapters/repositories/supabase-user-block-repository';
// import { SupabaseGigRepository } from '@preset/adapters/repositories/supabase-gig-repository';
// import { SupabaseApplicationRepository } from '@preset/adapters/repositories/supabase-application-repository';
// import { SupabaseProfileRepository } from '@preset/adapters/repositories/supabase-profile-repository';
// TODO: Implement these adapters
// import { SupabaseEventBus } from '@preset/adapters/events/SupabaseEventBus';
// import { SupabaseContentModerationRepository } from '@preset/adapters/moderation/SupabaseContentModerationRepository';
// import { SupabaseMessageReportRepository } from '@preset/adapters/reports/SupabaseMessageReportRepository';
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
  private profileRepository: ProfileRepository;
  private contentModerationRepository: SupabaseContentModerationRepository;
  private messageReportRepository: SupabaseMessageReportRepository;
  
  // Services
  private contentModerationService!: ContentModerationService;
  
  // Use Cases
  private sendMessageUseCase!: SendMessageUseCase;
  private getConversationsUseCase!: GetConversationsUseCase;
  private blockUserUseCase!: BlockUserUseCase;
  private unblockUserUseCase!: UnblockUserUseCase;
  private getBlockedUsersUseCase!: GetBlockedUsersUseCase;
  private checkUserBlockedUseCase!: CheckUserBlockedUseCase;
  private reportMessageUseCase!: ReportMessageUseCase;

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
    // TODO: Implement these repository adapters
    // this.conversationRepository = new SupabaseConversationRepository(this.supabase);
    // this.userBlockRepository = new SupabaseUserBlockRepository(this.supabase);
    // this.gigRepository = new SupabaseGigRepository(this.supabase);
    // this.applicationRepository = new SupabaseApplicationRepository(this.supabase);
    // this.profileRepository = new SupabaseProfileRepository(this.supabase);
    // TODO: Implement these repositories
    // this.contentModerationRepository = new SupabaseContentModerationRepository(this.supabase);
    // this.messageReportRepository = new SupabaseMessageReportRepository(this.supabase);
  }

  private initializeServices(): void {
    // TODO: Implement when repositories are available
    // this.contentModerationService = new ContentModerationService(
    //   this.contentModerationRepository
    // );
  }

  private initializeUseCases(): void {
    // TODO: Implement these use cases when repositories are available
    // this.sendMessageUseCase = new SendMessageUseCase(
    //   this.conversationRepository,
    //   this.gigRepository,
    //   this.applicationRepository,
    //   this.eventBus,
    //   this.idGenerator,
    //   this.contentModerationService
    // );

    // this.getConversationsUseCase = new GetConversationsUseCase(
    //   this.conversationRepository,
    //   this.userBlockRepository
    // );

    // this.blockUserUseCase = new BlockUserUseCase(
    //   this.userBlockRepository,
    //   this.profileRepository,
    //   this.eventBus,
    //   this.idGenerator
    // );

    // this.unblockUserUseCase = new UnblockUserUseCase(
    //   this.userBlockRepository,
    //   this.eventBus
    // );

    // this.getBlockedUsersUseCase = new GetBlockedUsersUseCase(
    //   this.userBlockRepository,
    //   this.profileRepository
    // );

    // this.checkUserBlockedUseCase = new CheckUserBlockedUseCase(
    //   this.userBlockRepository
    // );

    // TODO: Implement when repositories are available
    // this.reportMessageUseCase = new ReportMessageUseCase(
    //   this.messageReportRepository,
    //   this.eventBus,
    //   this.idGenerator
    // );
  }

  // Use Case Getters
  // TODO: Implement these when repositories are available
  // getSendMessageUseCase(): SendMessageUseCase {
  //   return this.sendMessageUseCase;
  // }

  // getGetConversationsUseCase(): GetConversationsUseCase {
  //   return this.getConversationsUseCase;
  // }

  // getBlockUserUseCase(): BlockUserUseCase {
  //   return this.blockUserUseCase;
  // }

  // getUnblockUserUseCase(): UnblockUserUseCase {
  //   return this.unblockUserUseCase;
  // }

  // getGetBlockedUsersUseCase(): GetBlockedUsersUseCase {
  //   return this.getBlockedUsersUseCase;
  // }

  // getCheckUserBlockedUseCase(): CheckUserBlockedUseCase {
  //   return this.checkUserBlockedUseCase;
  // }

  // TODO: Implement when repositories are available
  // getReportMessageUseCase(): ReportMessageUseCase {
  //   return this.reportMessageUseCase;
  // }

  // Service Getters
  // TODO: Implement when repositories are available
  // getContentModerationService(): ContentModerationService {
  //   return this.contentModerationService;
  // }

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