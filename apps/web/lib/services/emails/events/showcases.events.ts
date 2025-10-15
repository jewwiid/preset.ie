import { EventHandler } from '../types/event';
import { EmailService } from '../../email-service';
import {
  getShowcaseSubmittedForApprovalTemplate,
  getShowcaseApprovedTemplate,
  getShowcaseChangesRequestedTemplate
} from '../templates/showcases.templates';

export class ShowcaseEventHandlers {
  private emailService = new EmailService();

  async handleShowcaseSubmittedForApproval(event: any): Promise<void> {
    try {
      const { showcaseId, gigId, creatorId, talentId } = event.payload;
      
      // Get user details
      const [creator, talent, gig] = await Promise.all([
        this.getUserDetails(creatorId),
        this.getUserDetails(talentId),
        this.getGigDetails(gigId)
      ]);

      if (!creator || !talent || !gig) {
        console.error('Missing user or gig details for showcase notification');
        return;
      }

      // Send email to talent
      const template = getShowcaseSubmittedForApprovalTemplate({
        talentName: talent.display_name,
        talentEmail: talent.email,
        gigTitle: gig.title,
        creatorName: creator.display_name,
        showcaseId,
        platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://preset.ie'
      });

      await this.emailService.sendEmail(template);
      
      console.log(`Showcase approval notification sent to ${talent.email}`);
    } catch (error) {
      console.error('Error handling showcase submitted for approval:', error);
    }
  }

  async handleShowcaseApproved(event: any): Promise<void> {
    try {
      const { showcaseId, gigId, creatorId, talentId } = event.payload;
      
      // Get user details
      const [creator, talent, gig] = await Promise.all([
        this.getUserDetails(creatorId),
        this.getUserDetails(talentId),
        this.getGigDetails(gigId)
      ]);

      if (!creator || !talent || !gig) {
        console.error('Missing user or gig details for showcase approval notification');
        return;
      }

      // Send email to creator
      const template = getShowcaseApprovedTemplate({
        creatorName: creator.display_name,
        creatorEmail: creator.email,
        gigTitle: gig.title,
        talentName: talent.display_name,
        totalTalents: 1, // TODO: Get actual count from event
        approvedTalents: 1, // TODO: Get actual count from event
        showcaseId,
        platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://preset.ie'
      });

      await this.emailService.sendEmail(template);
      
      console.log(`Showcase approved notification sent to ${creator.email}`);
    } catch (error) {
      console.error('Error handling showcase approved:', error);
    }
  }

  async handleShowcaseChangesRequested(event: any): Promise<void> {
    try {
      const { showcaseId, gigId, creatorId, talentId, note } = event.payload;
      
      // Get user details
      const [creator, talent, gig] = await Promise.all([
        this.getUserDetails(creatorId),
        this.getUserDetails(talentId),
        this.getGigDetails(gigId)
      ]);

      if (!creator || !talent || !gig) {
        console.error('Missing user or gig details for showcase changes notification');
        return;
      }

      // Send email to creator
      const template = getShowcaseChangesRequestedTemplate({
        creatorName: creator.display_name,
        creatorEmail: creator.email,
        gigTitle: gig.title,
        talentName: talent.display_name,
        feedback: note || 'Please review the uploaded photos and make any necessary changes.',
        totalTalents: 1, // TODO: Get actual count from event
        changeRequests: 1, // TODO: Get actual count from event
        showcaseId,
        platformUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://preset.ie'
      });

      await this.emailService.sendEmail(template);
      
      console.log(`Showcase changes requested notification sent to ${creator.email}`);
    } catch (error) {
      console.error('Error handling showcase changes requested:', error);
    }
  }

  private async getUserDetails(userId: string): Promise<any> {
    try {
      // This would typically use your user service or database
      // For now, we'll simulate the structure
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('users_profile')
        .select('id, display_name, email, handle')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user details:', error);
      return null;
    }
  }

  private async getGigDetails(gigId: string): Promise<any> {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      const { data, error } = await supabase
        .from('gigs')
        .select('id, title, description')
        .eq('id', gigId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching gig details:', error);
      return null;
    }
  }
}

// Event handler registration
export const showcaseEventHandlers: EventHandler[] = [
  {
    eventType: 'ShowcaseSubmittedForApproval',
    handler: (eventHandlers: ShowcaseEventHandlers) => 
      eventHandlers.handleShowcaseSubmittedForApproval.bind(eventHandlers)
  },
  {
    eventType: 'ShowcaseApproved',
    handler: (eventHandlers: ShowcaseEventHandlers) => 
      eventHandlers.handleShowcaseApproved.bind(eventHandlers)
  },
  {
    eventType: 'ShowcaseChangesRequested',
    handler: (eventHandlers: ShowcaseEventHandlers) => 
      eventHandlers.handleShowcaseChangesRequested.bind(eventHandlers)
  }
];