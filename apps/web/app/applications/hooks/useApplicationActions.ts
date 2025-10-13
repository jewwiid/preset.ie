/**
 * Applications Module - useApplicationActions Hook
 *
 * Manages application actions (accept, reject, shortlist, withdraw, etc.)
 */

import { useState, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import type { Application, ApplicationStatus } from '../types';
import {
  updateApplicationStatus as updateStatus,
  withdrawApplication as withdraw,
  banUser as performBanUser,
  deleteApplication as performDelete,
  sendApplicationNotification,
} from '../lib/applicationActions';

interface UseApplicationActionsOptions {
  onSuccess?: (applicationId: string, action: string) => void;
  onError?: (error: Error) => void;
  onApplicationUpdate?: (applications: Application[]) => void;
}

interface UseApplicationActionsReturn {
  // Loading states
  updating: Set<string>;

  // Individual actions
  acceptApplication: (id: string) => Promise<void>;
  rejectApplication: (id: string) => Promise<void>;
  shortlistApplication: (id: string) => Promise<void>;
  withdrawApplication: (id: string) => Promise<void>;

  // Admin actions
  banUser: (userId: string, displayName: string) => Promise<void>;
  deleteApplication: (id: string) => Promise<void>;

  // Bulk actions
  bulkAccept: (ids: string[]) => Promise<void>;
  bulkReject: (ids: string[]) => Promise<void>;
  bulkShortlist: (ids: string[]) => Promise<void>;
}

export function useApplicationActions(
  options: UseApplicationActionsOptions = {}
): UseApplicationActionsReturn {
  const [updating, setUpdating] = useState<Set<string>>(new Set());

  const addUpdating = (id: string) => {
    setUpdating((prev) => new Set(prev).add(id));
  };

  const removeUpdating = (id: string) => {
    setUpdating((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const updateApplicationStatus = useCallback(
    async (applicationId: string, newStatus: ApplicationStatus, action: string) => {
      addUpdating(applicationId);

      try {
        await updateStatus(supabase, applicationId, newStatus);

        if (options.onSuccess) {
          options.onSuccess(applicationId, action);
        }
      } catch (error) {
        console.error(`Error ${action} application:`, error);

        if (options.onError && error instanceof Error) {
          options.onError(error);
        }

        throw error;
      } finally {
        removeUpdating(applicationId);
      }
    },
    [options]
  );

  const acceptApplication = useCallback(
    async (id: string) => {
      await updateApplicationStatus(id, 'ACCEPTED', 'accepting');
    },
    [updateApplicationStatus]
  );

  const rejectApplication = useCallback(
    async (id: string) => {
      await updateApplicationStatus(id, 'DECLINED', 'rejecting');
    },
    [updateApplicationStatus]
  );

  const shortlistApplication = useCallback(
    async (id: string) => {
      await updateApplicationStatus(id, 'SHORTLISTED', 'shortlisting');
    },
    [updateApplicationStatus]
  );

  const withdrawApplication = useCallback(
    async (id: string) => {
      addUpdating(id);

      try {
        const result = await withdraw(supabase, id);

        if (!result.success) {
          throw new Error(result.error || 'Failed to withdraw application');
        }

        if (options.onSuccess) {
          options.onSuccess(id, 'withdrawing');
        }
      } catch (error) {
        console.error('Error withdrawing application:', error);

        if (options.onError && error instanceof Error) {
          options.onError(error);
        }

        throw error;
      } finally {
        removeUpdating(id);
      }
    },
    [options]
  );

  const banUser = useCallback(
    async (userId: string, displayName: string) => {
      if (
        !confirm(
          `Are you sure you want to ban user "${displayName}"? This will prevent them from using the platform.`
        )
      ) {
        return;
      }

      addUpdating(userId);

      try {
        await performBanUser(supabase, userId);

        alert(`User "${displayName}" has been banned successfully.`);

        if (options.onSuccess) {
          options.onSuccess(userId, 'banning');
        }
      } catch (error) {
        console.error('Error banning user:', error);
        alert('Failed to ban user. Please try again.');

        if (options.onError && error instanceof Error) {
          options.onError(error);
        }
      } finally {
        removeUpdating(userId);
      }
    },
    [options]
  );

  const deleteApplication = useCallback(
    async (id: string) => {
      if (
        !confirm(
          'Are you sure you want to delete this application? This action cannot be undone.'
        )
      ) {
        return;
      }

      addUpdating(id);

      try {
        await performDelete(supabase, id);

        alert('Application deleted successfully.');

        if (options.onSuccess) {
          options.onSuccess(id, 'deleting');
        }
      } catch (error) {
        console.error('Error deleting application:', error);
        alert('Failed to delete application. Please try again.');

        if (options.onError && error instanceof Error) {
          options.onError(error);
        }
      } finally {
        removeUpdating(id);
      }
    },
    [options]
  );

  const bulkAccept = useCallback(
    async (ids: string[]) => {
      for (const id of ids) {
        try {
          await acceptApplication(id);
        } catch (error) {
          console.error(`Failed to accept application ${id}:`, error);
        }
      }
    },
    [acceptApplication]
  );

  const bulkReject = useCallback(
    async (ids: string[]) => {
      for (const id of ids) {
        try {
          await rejectApplication(id);
        } catch (error) {
          console.error(`Failed to reject application ${id}:`, error);
        }
      }
    },
    [rejectApplication]
  );

  const bulkShortlist = useCallback(
    async (ids: string[]) => {
      for (const id of ids) {
        try {
          await shortlistApplication(id);
        } catch (error) {
          console.error(`Failed to shortlist application ${id}:`, error);
        }
      }
    },
    [shortlistApplication]
  );

  return {
    updating,
    acceptApplication,
    rejectApplication,
    shortlistApplication,
    withdrawApplication,
    banUser,
    deleteApplication,
    bulkAccept,
    bulkReject,
    bulkShortlist,
  };
}
