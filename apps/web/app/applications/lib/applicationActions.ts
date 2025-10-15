/**
 * Applications Module - Action Handlers
 *
 * Functions for performing actions on applications (accept, reject, etc.)
 * and sending notifications.
 */

import type { ApplicationStatus, Application } from '../types';

/**
 * Update application status in the database
 */
export async function updateApplicationStatus(
  supabase: any,
  applicationId: string,
  newStatus: ApplicationStatus
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  const { error } = await supabase
    .from('applications')
    .update({ status: newStatus })
    .eq('id', applicationId);

  if (error) {
    throw new Error(`Failed to update application status: ${error.message}`);
  }
}

/**
 * Update collaboration application status
 */
export async function updateCollaborationApplicationStatus(
  supabase: any,
  applicationId: string,
  newStatus: ApplicationStatus
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  const { error } = await supabase
    .from('collab_applications')
    .update({ status: newStatus })
    .eq('id', applicationId);

  if (error) {
    throw new Error(
      `Failed to update collaboration application status: ${error.message}`
    );
  }
}

/**
 * Withdraw an application (handles both gig and collaboration types)
 */
export async function withdrawApplication(
  supabase: any,
  applicationId: string
): Promise<{ success: boolean; error?: string }> {
  if (!supabase) {
    return { success: false, error: 'Supabase client not configured' };
  }

  try {
    // Try updating gig application first
    const { error: gigError } = await supabase
      .from('applications')
      .update({ status: 'withdrawn' })
      .eq('id', applicationId);

    // Try updating collaboration application
    const { error: collabError } = await supabase
      .from('collab_applications')
      .update({ status: 'withdrawn' })
      .eq('id', applicationId);

    // If both failed, return error
    if (gigError && collabError) {
      return { success: false, error: 'Failed to withdraw application' };
    }

    return { success: true };
  } catch (error: any) {
    return {
      success: false,
      error: error.message || 'Unknown error occurred',
    };
  }
}

/**
 * Delete an application (admin only)
 */
export async function deleteApplication(
  supabase: any,
  applicationId: string
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', applicationId);

  if (error) {
    throw new Error(`Failed to delete application: ${error.message}`);
  }
}

/**
 * Ban a user (admin only)
 */
export async function banUser(
  supabase: any,
  userId: string
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  // Get current user data
  const { data: userData, error: fetchError } = await supabase
    .from('users_profile')
    .select('account_type')
    .eq('id', userId)
    .single();

  if (fetchError) {
    throw new Error(`Failed to fetch user data: ${fetchError.message}`);
  }

  // Add BANNED flag to user
  const currentFlags = userData.account_type || [];
  if (!currentFlags.includes('BANNED')) {
    currentFlags.push('BANNED');
  }

  const { error } = await supabase
    .from('users_profile')
    .update({ account_type: currentFlags })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to ban user: ${error.message}`);
  }
}

/**
 * Bulk update application statuses
 */
export async function bulkUpdateApplicationStatus(
  supabase: any,
  applicationIds: string[],
  newStatus: ApplicationStatus
): Promise<{ success: number; failed: number }> {
  if (!supabase) {
    throw new Error('Supabase client not configured');
  }

  let success = 0;
  let failed = 0;

  for (const id of applicationIds) {
    try {
      await updateApplicationStatus(supabase, id, newStatus);
      success++;
    } catch (error) {
      failed++;
      console.error(`Failed to update application ${id}:`, error);
    }
  }

  return { success, failed };
}

/**
 * Send notification for application status change
 * TODO: Implement actual notification system
 */
export async function sendApplicationNotification(
  application: Application,
  action: 'accepted' | 'rejected' | 'shortlisted'
): Promise<void> {
  // Placeholder for future notification implementation
  console.log(
    `Notification would be sent for application ${application.id}: ${action}`
  );

  // Example: Could integrate with email service, push notifications, etc.
  // await emailService.sendApplicationUpdate(application, action);
  // await pushNotificationService.send(application.applicant.id, message);
}

/**
 * Validate if an action is allowed
 */
export function validateAction(
  status: ApplicationStatus,
  action: string,
  viewMode: 'contributor' | 'talent' | 'admin'
): { valid: boolean; reason?: string } {
  const permissions: Record<
    string,
    Record<ApplicationStatus, string[]>
  > = {
    contributor: {
      PENDING: ['shortlist', 'accept', 'decline'],
      SHORTLISTED: ['accept', 'decline'],
      ACCEPTED: [],
      DECLINED: [],
      pending: ['shortlist', 'accept', 'decline'],
      accepted: [],
      rejected: [],
      withdrawn: [],
    },
    talent: {
      PENDING: ['withdraw'],
      SHORTLISTED: ['withdraw'],
      ACCEPTED: [],
      DECLINED: [],
      pending: ['withdraw'],
      accepted: [],
      rejected: [],
      withdrawn: [],
    },
    admin: {
      PENDING: ['shortlist', 'accept', 'decline', 'ban', 'delete'],
      SHORTLISTED: ['accept', 'decline', 'ban', 'delete'],
      ACCEPTED: ['ban', 'delete'],
      DECLINED: ['ban', 'delete'],
      pending: ['shortlist', 'accept', 'decline', 'ban', 'delete'],
      accepted: ['ban', 'delete'],
      rejected: ['ban', 'delete'],
      withdrawn: ['ban', 'delete'],
    },
  };

  const allowedActions = permissions[viewMode]?.[status] || [];

  if (allowedActions.includes(action)) {
    return { valid: true };
  }

  return {
    valid: false,
    reason: `Action '${action}' is not allowed for status '${status}' in ${viewMode} mode`,
  };
}
