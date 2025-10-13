/**
 * Applications Module - Filtering and Sorting Logic
 *
 * Pure functions for filtering, sorting, and searching applications.
 */

import type {
  Application,
  ApplicationStatus,
  FilterState,
  SortOption,
} from '../types';

/**
 * Filter applications based on filter state
 */
export function filterApplications(
  applications: Application[],
  filters: FilterState
): Application[] {
  let filtered = [...applications];

  // Apply status filter
  if (filters.selectedStatus !== 'ALL') {
    filtered = filtered.filter((app) => app.status === filters.selectedStatus);
  }

  // Apply type filter (if present)
  if (filters.typeFilter && filters.typeFilter !== 'all') {
    filtered = filtered.filter(
      (app) => app.application_type === filters.typeFilter
    );
  }

  // Apply date range filter (if present)
  if (filters.dateRange?.from || filters.dateRange?.to) {
    filtered = filtered.filter((app) => {
      const appDate = new Date(app.applied_at);

      if (filters.dateRange?.from && appDate < filters.dateRange.from) {
        return false;
      }

      if (filters.dateRange?.to && appDate > filters.dateRange.to) {
        return false;
      }

      return true;
    });
  }

  return filtered;
}

/**
 * Search applications by term
 */
export function searchApplications(
  applications: Application[],
  searchTerm: string
): Application[] {
  if (!searchTerm.trim()) {
    return applications;
  }

  const lowerSearchTerm = searchTerm.toLowerCase();

  return applications.filter((app) => {
    // Search in project title
    if (app.project_title?.toLowerCase().includes(lowerSearchTerm)) {
      return true;
    }

    // Search in gig title
    if (app.gig?.title?.toLowerCase().includes(lowerSearchTerm)) {
      return true;
    }

    // Search in applicant name
    if (app.applicant?.display_name?.toLowerCase().includes(lowerSearchTerm)) {
      return true;
    }

    // Search in applicant handle
    if (app.applicant?.handle?.toLowerCase().includes(lowerSearchTerm)) {
      return true;
    }

    // Search in role name
    if (app.role_name?.toLowerCase().includes(lowerSearchTerm)) {
      return true;
    }

    // Search in project description
    if (app.project_description?.toLowerCase().includes(lowerSearchTerm)) {
      return true;
    }

    return false;
  });
}

/**
 * Sort applications by the specified option
 */
export function sortApplications(
  applications: Application[],
  sortBy: SortOption
): Application[] {
  const sorted = [...applications];

  switch (sortBy) {
    case 'date-desc':
      return sorted.sort(
        (a, b) =>
          new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime()
      );

    case 'date-asc':
      return sorted.sort(
        (a, b) =>
          new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime()
      );

    case 'status':
      // Define status priority for sorting
      const statusPriority: Record<ApplicationStatus, number> = {
        PENDING: 1,
        pending: 1,
        SHORTLISTED: 2,
        ACCEPTED: 3,
        accepted: 3,
        DECLINED: 4,
        rejected: 4,
        withdrawn: 5,
      };

      return sorted.sort((a, b) => {
        const priorityA = statusPriority[a.status] || 999;
        const priorityB = statusPriority[b.status] || 999;
        return priorityA - priorityB;
      });

    case 'compatibility-desc':
      return sorted.sort((a, b) => {
        const scoreA = a.compatibility_score ?? -1;
        const scoreB = b.compatibility_score ?? -1;
        return scoreB - scoreA;
      });

    case 'compatibility-asc':
      return sorted.sort((a, b) => {
        const scoreA = a.compatibility_score ?? 999;
        const scoreB = b.compatibility_score ?? 999;
        return scoreA - scoreB;
      });

    default:
      return sorted;
  }
}

/**
 * Apply all filters and sorting to applications
 */
export function processApplications(
  applications: Application[],
  filters: FilterState,
  sortBy: SortOption = 'date-desc'
): Application[] {
  // First, apply search
  let processed = searchApplications(applications, filters.searchTerm);

  // Then apply filters
  processed = filterApplications(processed, filters);

  // Finally, apply sorting
  processed = sortApplications(processed, sortBy);

  return processed;
}

/**
 * Get count of applications by status
 */
export function getApplicationCountsByStatus(
  applications: Application[]
): Record<ApplicationStatus | 'total', number> {
  const counts: any = {
    total: applications.length,
    PENDING: 0,
    SHORTLISTED: 0,
    ACCEPTED: 0,
    DECLINED: 0,
    pending: 0,
    accepted: 0,
    rejected: 0,
    withdrawn: 0,
  };

  applications.forEach((app) => {
    counts[app.status] = (counts[app.status] || 0) + 1;
  });

  return counts;
}

/**
 * Get count of applications by type
 */
export function getApplicationCountsByType(
  applications: Application[]
): { gig: number; collaboration: number } {
  return applications.reduce(
    (acc, app) => {
      if (app.application_type === 'gig') {
        acc.gig++;
      } else {
        acc.collaboration++;
      }
      return acc;
    },
    { gig: 0, collaboration: 0 }
  );
}

/**
 * Check if any filters are active
 */
export function hasActiveFilters(filters: FilterState): boolean {
  return (
    filters.searchTerm !== '' ||
    filters.selectedStatus !== 'ALL' ||
    (filters.typeFilter !== undefined && filters.typeFilter !== 'all') ||
    filters.dateRange !== undefined
  );
}
