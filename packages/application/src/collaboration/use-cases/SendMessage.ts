import { Conversation } from '@preset/domain/collaboration/entities/Conversation';
import { ConversationRepository } from '@preset/domain/collaboration/ports/ConversationRepository';
import { GigRepository } from '@preset/domain/gigs/ports/GigRepository';
import { ApplicationRepository } from '@preset/domain/applications/ports/ApplicationRepository';
import { EventBus } from '@preset/domain/shared/EventBus';
import { IdGenerator } from '@preset/domain/shared/IdGenerator';
import { Attachment } from '@preset/domain/collaboration/value-objects/Attachment';

export interface SendMessageCommand {
  gigId: string;
  fromUserId: string;
  toUserId: string;
  body: string;
  attachments?: Array<{
    url: string;
    name: string;
    size: number;
    type: string;
  }>;
}

export interface SendMessageResult {
  conversationId: string;
  messageId: string;
  sentAt: Date;
}

export class SendMessageUseCase {
  constructor(
    private conversationRepo: ConversationRepository,
    private gigRepo: GigRepository,
    private applicationRepo: ApplicationRepository,
    private eventBus: EventBus,
    private idGenerator: IdGenerator
  ) {}

  async execute(command: SendMessageCommand): Promise<SendMessageResult> {
    // Verify the gig exists
    const gig = await this.gigRepo.findById(command.gigId);
    if (!gig) {
      throw new Error('Gig not found');
    }

    // Check if sender is authorized to message
    // Either they're the gig owner or an applicant
    const isGigOwner = gig.getOwnerId() === command.fromUserId;
    
    if (!isGigOwner) {
      // Check if sender has applied to this gig
      const application = await this.applicationRepo.findByGigAndApplicant(
        command.gigId,
        command.fromUserId
      );
      
      if (!application) {
        throw new Error('You must apply to the gig before messaging');
      }

      // Only allow messaging if application is not declined
      if (application.isDeclined()) {
        throw new Error('Cannot message after application has been declined');
      }
    }

    // Check if recipient is valid
    if (isGigOwner) {
      // Gig owner is messaging an applicant
      const application = await this.applicationRepo.findByGigAndApplicant(
        command.gigId,
        command.toUserId
      );
      
      if (!application) {
        throw new Error('Recipient has not applied to this gig');
      }
    } else {
      // Applicant is messaging the gig owner
      if (command.toUserId !== gig.getOwnerId()) {
        throw new Error('Applicants can only message the gig owner');
      }
    }

    // Find or create conversation
    let conversation = await this.conversationRepo.findByGigAndParticipants(
      command.gigId,
      command.fromUserId,
      command.toUserId
    );

    if (!conversation) {
      // Create new conversation
      conversation = Conversation.create({
        id: this.idGenerator.generate(),
        gigId: command.gigId,
        contributorId: isGigOwner ? command.fromUserId : command.toUserId,
        talentId: isGigOwner ? command.toUserId : command.fromUserId
      });
    }

    // Process attachments
    const attachments = command.attachments?.map(file => 
      Attachment.fromFile(file)
    ) || [];

    // Send the message
    const message = conversation.sendMessage({
      messageId: this.idGenerator.generate(),
      fromUserId: command.fromUserId,
      body: command.body,
      attachments
    });

    // Save the conversation
    await this.conversationRepo.save(conversation);

    // Publish domain events
    const events = conversation.getUncommittedEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    conversation.markEventsAsCommitted();

    return {
      conversationId: conversation.getId(),
      messageId: message.getId(),
      sentAt: message.getSentAt()
    };
  }
}