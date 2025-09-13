import { EventHandler } from '../../shared/EventHandler';
import { DomainEvent, GigRepository, UserRepository, ConversationRepository, Conversation, IdGenerator } from '@preset/domain';

export interface TalentBookedEvent extends DomainEvent {
  eventType: 'TalentBooked';
  payload: {
    applicationId: string;
    gigId: string;
    talentId: string;
    bookedAt: Date;
  };
}

/**
 * Handler for TalentBooked events
 * Creates conversation, sends notifications, updates stats
 */
export class TalentBookedHandler implements EventHandler<TalentBookedEvent> {
  eventType = 'TalentBooked';

  constructor(
    private gigRepo: GigRepository,
    private userRepo: UserRepository,
    private conversationRepo: ConversationRepository,
    private notificationService?: {
      sendBookingConfirmation(
        talentEmail: string,
        ownerEmail: string,
        gigTitle: string,
        gigDate: Date
      ): Promise<void>;
    }
  ) {}

  async handle(event: TalentBookedEvent): Promise<void> {
    const { gigId, talentId } = event.payload;

    // Get gig details
    const gig = await this.gigRepo.findById(gigId);
    if (!gig) {
      console.error(`Gig ${gigId} not found for booking`);
      return;
    }

    // Get talent and owner details
    const [talent, owner] = await Promise.all([
      this.userRepo.findById(talentId),
      this.userRepo.findById(gig.getOwnerId())
    ]);

    if (!talent || !owner) {
      console.error('Users not found for booking notification');
      return;
    }

    // Create or ensure conversation exists
    let conversation = await this.conversationRepo.findByGigAndParticipants(
      gigId,
      gig.getOwnerId(),
      talentId
    );

    if (!conversation) {
      // Create conversation for post-booking communication
      conversation = Conversation.create({
        id: IdGenerator.generate(),
        gigId,
        contributorId: gig.getOwnerId(),
        talentId
      });

      // Send initial booking confirmation message
      conversation.sendMessage({
        messageId: IdGenerator.generate(),
        fromUserId: gig.getOwnerId(),
        body: `Congratulations! You've been booked for "${gig.getTitle()}". Let's discuss the details.`,
        attachments: []
      });

      await this.conversationRepo.save(conversation);
    }

    // Send booking confirmation emails
    if (this.notificationService) {
      try {
        await this.notificationService.sendBookingConfirmation(
          talent.getEmail(),
          owner.getEmail(),
          gig.getTitle(),
          gig.getDateTimeWindow().getStartTime()
        );
      } catch (error) {
        console.error('Failed to send booking confirmation:', error);
      }
    }

    console.log(`Talent ${talent.getEmail()} booked for gig ${gig.getTitle()}`);
  }
}