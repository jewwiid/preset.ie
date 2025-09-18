import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface CollaborationNotification {
  id: string;
  type: string;
  metadata: any;
  read: boolean;
  created_at: string;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: { [key: string]: number };
}

export class CollaborationNotificationsService {
  /**
   * Create a collaboration notification
   */
  static async createNotification(
    userId: string,
    type: string,
    metadata: any = {}
  ): Promise<{ success: boolean; notificationId?: string; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('create_collaboration_notification', {
        p_user_id: userId,
        p_type: type,
        p_metadata: metadata
      });

      if (error) {
        console.error('Error creating notification:', error);
        return { success: false, error: 'Failed to create notification' };
      }

      return { success: true, notificationId: data };

    } catch (error) {
      console.error('Error creating collaboration notification:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Notify all project participants
   */
  static async notifyProjectParticipants(
    projectId: string,
    type: string,
    metadata: any = {},
    excludeUserId?: string
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('notify_project_participants', {
        p_project_id: projectId,
        p_type: type,
        p_metadata: metadata,
        p_exclude_user_id: excludeUserId || null
      });

      if (error) {
        console.error('Error notifying project participants:', error);
        return { success: false, error: 'Failed to notify participants' };
      }

      return { success: true, count: data };

    } catch (error) {
      console.error('Error notifying project participants:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get collaboration notifications for a user
   */
  static async getCollaborationNotifications(
    userId: string,
    limit: number = 20,
    offset: number = 0
  ): Promise<CollaborationNotification[]> {
    try {
      const { data, error } = await supabase.rpc('get_collaboration_notifications', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset
      });

      if (error) {
        console.error('Error getting collaboration notifications:', error);
        return [];
      }

      return data || [];

    } catch (error) {
      console.error('Error getting collaboration notifications:', error);
      return [];
    }
  }

  /**
   * Mark collaboration notifications as read
   */
  static async markNotificationsRead(
    userId: string,
    notificationIds?: string[]
  ): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
      const { data, error } = await supabase.rpc('mark_collaboration_notifications_read', {
        p_user_id: userId,
        p_notification_ids: notificationIds || null
      });

      if (error) {
        console.error('Error marking notifications as read:', error);
        return { success: false, error: 'Failed to mark notifications as read' };
      }

      return { success: true, count: data };

    } catch (error) {
      console.error('Error marking notifications as read:', error);
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get notification statistics for a user
   */
  static async getNotificationStats(userId: string): Promise<NotificationStats> {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('type, read')
        .eq('user_id', userId)
        .like('type', 'collab_%');

      if (error) {
        console.error('Error getting notification stats:', error);
        return { total: 0, unread: 0, byType: {} };
      }

      const stats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.read).length,
        byType: {}
      };

      // Count by type
      notifications.forEach(notification => {
        if (!stats.byType[notification.type]) {
          stats.byType[notification.type] = 0;
        }
        stats.byType[notification.type]++;
      });

      return stats;

    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { total: 0, unread: 0, byType: {} };
    }
  }

  /**
   * Get notification details with related data
   */
  static async getNotificationDetails(notificationId: string): Promise<any> {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      if (error || !notification) {
        return null;
      }

      // Enrich notification with related data based on type
      const enrichedNotification = { ...notification };

      if (notification.type === 'collab_project_published') {
        const { data: project } = await supabase
          .from('collab_projects')
          .select(`
            id,
            title,
            description,
            city,
            country,
            creator:users_profile!collab_projects_creator_id_fkey(
              id,
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('id', notification.metadata.project_id)
          .single();

        enrichedNotification.project = project;
      }

      if (notification.type === 'collab_role_application_received') {
        const { data: application } = await supabase
          .from('collab_applications')
          .select(`
            id,
            application_type,
            message,
            applicant:users_profile!collab_applications_applicant_id_fkey(
              id,
              username,
              display_name,
              avatar_url
            ),
            role:collab_roles(
              id,
              role_name,
              skills_required
            ),
            project:collab_projects(
              id,
              title
            )
          `)
          .eq('id', notification.metadata.application_id)
          .single();

        enrichedNotification.application = application;
      }

      if (notification.type === 'collab_gear_offer_received') {
        const { data: offer } = await supabase
          .from('collab_gear_offers')
          .select(`
            id,
            offer_type,
            daily_rate_cents,
            total_price_cents,
            message,
            offerer:users_profile!collab_gear_offers_offerer_id_fkey(
              id,
              username,
              display_name,
              avatar_url
            ),
            gear_request:collab_gear_requests(
              id,
              category,
              equipment_spec
            ),
            listing:listings(
              id,
              title,
              category
            ),
            project:collab_projects(
              id,
              title
            )
          `)
          .eq('id', notification.metadata.offer_id)
          .single();

        enrichedNotification.offer = offer;
      }

      return enrichedNotification;

    } catch (error) {
      console.error('Error getting notification details:', error);
      return null;
    }
  }

  /**
   * Create specific notification types
   */
  static async notifyProjectPublished(projectId: string, creatorId: string): Promise<void> {
    const { data: project } = await supabase
      .from('collab_projects')
      .select('title, city, country')
      .eq('id', projectId)
      .single();

    if (project) {
      await this.createNotification(
        creatorId,
        'collab_project_published',
        {
          project_id: projectId,
          project_title: project.title,
          project_city: project.city,
          project_country: project.country
        }
      );
    }
  }

  static async notifyRoleApplication(
    projectId: string,
    creatorId: string,
    applicationId: string,
    applicantId: string,
    roleId: string
  ): Promise<void> {
    await this.createNotification(
      creatorId,
      'collab_role_application_received',
      {
        application_id: applicationId,
        project_id: projectId,
        role_id: roleId,
        applicant_id: applicantId
      }
    );
  }

  static async notifyGearOffer(
    projectId: string,
    creatorId: string,
    offerId: string,
    offererId: string,
    gearRequestId: string,
    listingId?: string
  ): Promise<void> {
    await this.createNotification(
      creatorId,
      'collab_gear_offer_received',
      {
        offer_id: offerId,
        project_id: projectId,
        gear_request_id: gearRequestId,
        offerer_id: offererId,
        listing_id: listingId
      }
    );
  }

  static async notifyApplicationStatusChange(
    applicantId: string,
    applicationId: string,
    projectId: string,
    roleId: string,
    status: string
  ): Promise<void> {
    await this.createNotification(
      applicantId,
      `collab_role_application_${status}`,
      {
        application_id: applicationId,
        project_id: projectId,
        role_id: roleId,
        status
      }
    );
  }

  static async notifyGearOfferStatusChange(
    offererId: string,
    offerId: string,
    projectId: string,
    gearRequestId: string,
    status: string
  ): Promise<void> {
    await this.createNotification(
      offererId,
      `collab_gear_offer_${status}`,
      {
        offer_id: offerId,
        project_id: projectId,
        gear_request_id: gearRequestId,
        status
      }
    );
  }

  static async notifyProjectStatusChange(
    projectId: string,
    status: string
  ): Promise<void> {
    await this.notifyProjectParticipants(
      projectId,
      `collab_project_${status}`,
      {
        project_id: projectId,
        status
      }
    );
  }
}
