/**
 * Applications Module - useApplicationFilters Hook
 *
 * Manages all filter state and logic for applications.
 */

import { useState, useMemo } from 'react';
import type { Application, ApplicationStatus, FilterState, SortOption } from '../types';
import { processApplications, hasActiveFilters as checkHasActiveFilters } from '../lib/applicationFilters';
import { DEFAULT_FILTER_STATE } from '../constants/applicationConfig';

interface UseApplicationFiltersReturn {
  // Filter state
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedStatus: ApplicationStatus | 'ALL';
  setSelectedStatus: (status: ApplicationStatus | 'ALL') => void;
  sortBy: SortOption;
  setSortBy: (sort: SortOption) => void;

  // Utilities
  clearFilters: () => void;
  hasActiveFilters: boolean;
  filterState: FilterState;

  // Apply filters to applications
  applyFilters: (applications: Application[]) => Application[];
}

export function useApplicationFilters(): UseApplicationFiltersReturn {
  const [searchTerm, setSearchTerm] = useState<string>(DEFAULT_FILTER_STATE.searchTerm);
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | 'ALL'>(
    DEFAULT_FILTER_STATE.selectedStatus
  );
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const filterState: FilterState = useMemo(
    () => ({
      searchTerm,
      selectedStatus,
      typeFilter: DEFAULT_FILTER_STATE.typeFilter,
      dateRange: DEFAULT_FILTER_STATE.dateRange,
    }),
    [searchTerm, selectedStatus]
  );

  const hasActiveFilters = useMemo(() => checkHasActiveFilters(filterState), [filterState]);

  const clearFilters = () => {
    setSearchTerm(DEFAULT_FILTER_STATE.searchTerm);
    setSelectedStatus(DEFAULT_FILTER_STATE.selectedStatus);
    setSortBy('date-desc');
  };

  const applyFilters = (applications: Application[]): Application[] => {
    return processApplications(applications, filterState, sortBy);
  };

  return {
    searchTerm,
    setSearchTerm,
    selectedStatus,
    setSelectedStatus,
    sortBy,
    setSortBy,
    clearFilters,
    hasActiveFilters,
    filterState,
    applyFilters,
  };
}
