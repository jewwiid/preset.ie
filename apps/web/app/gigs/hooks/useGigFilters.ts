import { useState } from 'react';
import { CompensationType, PurposeType } from '../types';

/**
 * Custom hook for managing all gig filter states
 * Centralizes all filter state management in one place
 */
export const useGigFilters = () => {
  // Basic filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCompType, setSelectedCompType] = useState<CompensationType | 'ALL'>('ALL');
  const [selectedPurpose, setSelectedPurpose] = useState<PurposeType | 'ALL'>('ALL');
  const [selectedUsageRights, setSelectedUsageRights] = useState<string>('ALL');
  const [locationFilter, setLocationFilter] = useState('');
  const [startDateFilter, setStartDateFilter] = useState('');
  const [endDateFilter, setEndDateFilter] = useState('');
  const [maxApplicantsFilter, setMaxApplicantsFilter] = useState<number | null>(null);

  // Visual filters
  const [selectedPalette, setSelectedPalette] = useState<string[]>([]);
  const [selectedStyleTags, setSelectedStyleTags] = useState<string[]>([]);
  const [selectedVibeTags, setSelectedVibeTags] = useState<string[]>([]);
  const [selectedRoleTypes, setSelectedRoleTypes] = useState<string[]>([]);

  // Creator profile filters
  const [minExperienceFilter, setMinExperienceFilter] = useState<number | null>(null);
  const [maxExperienceFilter, setMaxExperienceFilter] = useState<number | null>(null);
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([]);
  const [minRateFilter, setMinRateFilter] = useState<number | null>(null);
  const [maxRateFilter, setMaxRateFilter] = useState<number | null>(null);
  const [travelOnlyFilter, setTravelOnlyFilter] = useState(false);
  const [studioOnlyFilter, setStudioOnlyFilter] = useState(false);

  // UI state
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Clears all filters and resets to default state
   */
  const clearAllFilters = () => {
    setSearchTerm('');
    setSelectedCompType('ALL');
    setSelectedPurpose('ALL');
    setSelectedUsageRights('ALL');
    setLocationFilter('');
    setStartDateFilter('');
    setEndDateFilter('');
    setMaxApplicantsFilter(null);
    setSelectedPalette([]);
    setSelectedStyleTags([]);
    setSelectedVibeTags([]);
    setSelectedRoleTypes([]);
    setMinExperienceFilter(null);
    setMaxExperienceFilter(null);
    setSelectedSpecializations([]);
    setMinRateFilter(null);
    setMaxRateFilter(null);
    setTravelOnlyFilter(false);
    setStudioOnlyFilter(false);
  };

  /**
   * Checks if any filters are currently active
   */
  const hasActiveFilters = (): boolean => {
    return (
      selectedPalette.length > 0 ||
      selectedStyleTags.length > 0 ||
      selectedVibeTags.length > 0 ||
      selectedRoleTypes.length > 0 ||
      selectedPurpose !== 'ALL' ||
      selectedUsageRights !== 'ALL' ||
      !!startDateFilter ||
      !!endDateFilter ||
      maxApplicantsFilter !== null ||
      minExperienceFilter !== null ||
      maxExperienceFilter !== null ||
      selectedSpecializations.length > 0 ||
      minRateFilter !== null ||
      maxRateFilter !== null ||
      travelOnlyFilter ||
      studioOnlyFilter
    );
  };

  return {
    // Basic filters
    searchTerm,
    setSearchTerm,
    selectedCompType,
    setSelectedCompType,
    selectedPurpose,
    setSelectedPurpose,
    selectedUsageRights,
    setSelectedUsageRights,
    locationFilter,
    setLocationFilter,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    maxApplicantsFilter,
    setMaxApplicantsFilter,

    // Visual filters
    selectedPalette,
    setSelectedPalette,
    selectedStyleTags,
    setSelectedStyleTags,
    selectedVibeTags,
    setSelectedVibeTags,
    selectedRoleTypes,
    setSelectedRoleTypes,

    // Creator profile filters
    minExperienceFilter,
    setMinExperienceFilter,
    maxExperienceFilter,
    setMaxExperienceFilter,
    selectedSpecializations,
    setSelectedSpecializations,
    minRateFilter,
    setMinRateFilter,
    maxRateFilter,
    setMaxRateFilter,
    travelOnlyFilter,
    setTravelOnlyFilter,
    studioOnlyFilter,
    setStudioOnlyFilter,

    // UI state
    showFilters,
    setShowFilters,

    // Helper functions
    clearAllFilters,
    hasActiveFilters
  };
};
