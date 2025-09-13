import { Application, EntityId, IdGenerator } from '@preset/domain';
import { ApplicationRepository } from '../../ports/repositories/application-repository';
import { GigRepository } from '../../ports/repositories/gig-repository';
import { UserRepository } from '../../ports/repositories/user-repository';
import { NotificationService } from '../../ports/services/notification-service';

export interface ApplyToGigCommand {
  gigId: string;
  applicantUserId: string;
  note?: string;
}

export class ApplyToGigUseCase {
  constructor(
    private applicationRepository: ApplicationRepository,
    private gigRepository: GigRepository,
    private userRepository: UserRepository,
    private notificationService: NotificationService
  ) {}

  async execute(command: ApplyToGigCommand): Promise<{ applicationId: string }> {
    // Get the gig
    const gig = await this.gigRepository.findById(EntityId.from(command.gigId));
    if (!gig) {
      throw new Error('Gig not found');
    }

    // Check if gig is open for applications
    if (!gig.isApplicationOpen()) {
      throw new Error('Gig is not accepting applications');
    }

    // Get the applicant
    const applicant = await this.userRepository.findByUserId(command.applicantUserId);
    if (!applicant) {
      throw new Error('Applicant not found');
    }

    if (!applicant.roles.isTalent()) {
      throw new Error('User must be talent to apply to gigs');
    }

    // Check subscription limits
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    
    const applicationCount = await this.applicationRepository.countByApplicant(
      EntityId.from(applicant.id.toString()),
      startOfMonth
    );

    if (!applicant.canApply(applicationCount)) {
      throw new Error('Application limit reached for current subscription tier');
    }

    // Check if already applied
    const existingApplication = await this.applicationRepository.findByGigAndApplicant(
      EntityId.from(command.gigId),
      EntityId.from(applicant.id.toString())
    );

    if (existingApplication) {
      throw new Error('Already applied to this gig');
    }

    // Check max applicants
    const currentApplicationCount = await this.applicationRepository.countByGig(
      EntityId.from(command.gigId)
    );

    if (currentApplicationCount >= gig.maxApplicants) {
      throw new Error('Maximum number of applicants reached');
    }

    // Create application
    const application = Application.create({
      id: IdGenerator.generate(),
      gigId: command.gigId,
      applicantId: applicant.id.toString(),
      note: command.note
    });

    // Save application
    await this.applicationRepository.save(application);

    // Notify gig owner
    const gigOwner = await this.userRepository.findById(gig.ownerUserId);
    if (gigOwner) {
      await this.notificationService.sendPushNotification(
        gigOwner.userId,
        'New Application',
        `${applicant.displayName} applied to your gig "${gig.title}"`,
        { gigId: command.gigId, applicationId: application.getId() }
      );
    }

    return { applicationId: application.getId() };
  }
}