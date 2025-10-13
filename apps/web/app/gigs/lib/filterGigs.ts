import { Gig, GigFilters } from '../types';
import { colorDistance } from '../utils';

/**
 * Pure function to filter gigs based on provided filter criteria
 * @param gigs - Array of gigs to filter
 * @param filters - Filter criteria to apply
 * @returns Filtered array of gigs
 */
export const filterGigs = (gigs: Gig[], filters: GigFilters): Gig[] => {
  let filtered = [...gigs];

  // Search term filter
  if (filters.searchTerm) {
    filtered = filtered.filter(gig =>
      gig.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      gig.description.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
      gig.location_text.toLowerCase().includes(filters.searchTerm.toLowerCase())
    );
  }

  // Compensation type filter
  if (filters.selectedCompType !== 'ALL') {
    filtered = filtered.filter(gig => gig.comp_type === filters.selectedCompType);
  }

  // Purpose filter
  if (filters.selectedPurpose !== 'ALL') {
    filtered = filtered.filter(gig => gig.purpose === filters.selectedPurpose);
  }

  // Usage rights filter
  if (filters.selectedUsageRights !== 'ALL') {
    filtered = filtered.filter(gig =>
      gig.usage_rights && gig.usage_rights.toLowerCase().includes(filters.selectedUsageRights.toLowerCase())
    );
  }

  // Location filter
  if (filters.locationFilter) {
    filtered = filtered.filter(gig =>
      gig.location_text.toLowerCase().includes(filters.locationFilter.toLowerCase())
    );
  }

  // Start date filter
  if (filters.startDateFilter) {
    filtered = filtered.filter(gig =>
      new Date(gig.start_time) >= new Date(filters.startDateFilter)
    );
  }

  // End date filter
  if (filters.endDateFilter) {
    filtered = filtered.filter(gig =>
      new Date(gig.end_time) <= new Date(filters.endDateFilter + 'T23:59:59')
    );
  }

  // Max applicants filter
  if (filters.maxApplicantsFilter) {
    filtered = filtered.filter(gig =>
      gig.max_applicants <= filters.maxApplicantsFilter!
    );
  }

  // Palette color filter
  if (filters.selectedPalette.length > 0) {
    filtered = filtered.filter(gig =>
      gig.palette_colors && gig.palette_colors.some((color: string) =>
        filters.selectedPalette.some(selectedColor =>
          colorDistance(color, selectedColor) < 30 // Color similarity threshold
        )
      )
    );
  }

  // Style tags filter
  if (filters.selectedStyleTags.length > 0) {
    filtered = filtered.filter(gig =>
      gig.style_tags && gig.style_tags.some(tag =>
        filters.selectedStyleTags.includes(tag)
      )
    );
  }

  // Vibe tags filter
  if (filters.selectedVibeTags.length > 0) {
    filtered = filtered.filter(gig =>
      gig.vibe_tags && gig.vibe_tags.some(tag =>
        filters.selectedVibeTags.includes(tag)
      )
    );
  }

  // Role types filter
  if (filters.selectedRoleTypes.length > 0) {
    filtered = filtered.filter(gig =>
      gig.looking_for_types && gig.looking_for_types.some(type =>
        filters.selectedRoleTypes.includes(type)
      )
    );
  }

  // Minimum experience filter
  if (filters.minExperienceFilter !== null) {
    filtered = filtered.filter(gig =>
      gig.users_profile?.years_experience && gig.users_profile.years_experience >= filters.minExperienceFilter!
    );
  }

  // Maximum experience filter
  if (filters.maxExperienceFilter !== null) {
    filtered = filtered.filter(gig =>
      gig.users_profile?.years_experience && gig.users_profile.years_experience <= filters.maxExperienceFilter!
    );
  }

  // Specializations filter
  if (filters.selectedSpecializations.length > 0) {
    filtered = filtered.filter(gig =>
      gig.users_profile?.specializations && gig.users_profile.specializations.some(spec =>
        filters.selectedSpecializations.includes(spec)
      )
    );
  }

  // Minimum rate filter
  if (filters.minRateFilter !== null) {
    filtered = filtered.filter(gig =>
      gig.users_profile?.hourly_rate_min && gig.users_profile.hourly_rate_min >= filters.minRateFilter!
    );
  }

  // Maximum rate filter
  if (filters.maxRateFilter !== null) {
    filtered = filtered.filter(gig =>
      gig.users_profile?.hourly_rate_max && gig.users_profile.hourly_rate_max <= filters.maxRateFilter!
    );
  }

  // Travel availability filter
  if (filters.travelOnlyFilter) {
    filtered = filtered.filter(gig =>
      gig.users_profile?.available_for_travel === true
    );
  }

  // Studio availability filter
  if (filters.studioOnlyFilter) {
    filtered = filtered.filter(gig =>
      gig.users_profile?.has_studio === true
    );
  }

  return filtered;
};
