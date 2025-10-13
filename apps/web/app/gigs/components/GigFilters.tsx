import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter, X, Tag, Sparkles } from 'lucide-react';
import { CompensationType, PurposeType } from '../types';
import { getLookingForLabel } from '../utils';

interface GigFiltersProps {
  // Basic filters
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  selectedCompType: CompensationType | 'ALL';
  setSelectedCompType: (value: CompensationType | 'ALL') => void;
  locationFilter: string;
  setLocationFilter: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;

  // Advanced filters
  selectedPurpose: PurposeType | 'ALL';
  setSelectedPurpose: (value: PurposeType | 'ALL') => void;
  selectedUsageRights: string;
  setSelectedUsageRights: (value: string) => void;
  startDateFilter: string;
  setStartDateFilter: (value: string) => void;
  endDateFilter: string;
  setEndDateFilter: (value: string) => void;
  maxApplicantsFilter: number | null;
  setMaxApplicantsFilter: (value: number | null) => void;

  // Visual filters
  availableStyleTags: string[];
  selectedStyleTags: string[];
  setSelectedStyleTags: (value: string[]) => void;
  availableVibeTags: string[];
  selectedVibeTags: string[];
  setSelectedVibeTags: (value: string[]) => void;
  availableRoleTypes: string[];
  selectedRoleTypes: string[];
  setSelectedRoleTypes: (value: string[]) => void;
  availablePalettes: string[];
  selectedPalette: string[];
  setSelectedPalette: (value: string[]) => void;

  // Creator profile filters
  minExperienceFilter: number | null;
  setMinExperienceFilter: (value: number | null) => void;
  maxExperienceFilter: number | null;
  setMaxExperienceFilter: (value: number | null) => void;
  availableSpecializations: string[];
  selectedSpecializations: string[];
  setSelectedSpecializations: (value: string[]) => void;
  minRateFilter: number | null;
  setMinRateFilter: (value: number | null) => void;
  maxRateFilter: number | null;
  setMaxRateFilter: (value: number | null) => void;
  travelOnlyFilter: boolean;
  setTravelOnlyFilter: (value: boolean) => void;
  studioOnlyFilter: boolean;
  setStudioOnlyFilter: (value: boolean) => void;

  // Actions
  onClearFilters: () => void;
}

/**
 * Comprehensive filters component for gig discovery
 * Includes search, basic filters, and advanced filter panel
 */
export const GigFilters = (props: GigFiltersProps) => {
  const toggleArrayValue = <T,>(array: T[], value: T, setter: (value: T[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter(item => item !== value));
    } else {
      setter([...array, value]);
    }
  };

  return (
    <>
      {/* Search and Basic Filters */}
      <Card className="sticky top-4 z-10 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Search gigs, styles, or keywords..."
                className="pl-10"
                value={props.searchTerm}
                onChange={(e) => props.setSearchTerm(e.target.value)}
              />
            </div>

            {/* Filter Buttons - Mobile Responsive */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
              {/* First row on mobile: Type selector and Location */}
              <div className="flex gap-2 flex-1">
                <Select value={props.selectedCompType} onValueChange={(value) => props.setSelectedCompType(value as CompensationType | 'ALL')}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="TFP">TFP</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="EXPENSES">Expenses</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  type="text"
                  placeholder="Location..."
                  className="flex-1 min-w-0"
                  value={props.locationFilter}
                  onChange={(e) => props.setLocationFilter(e.target.value)}
                />
              </div>

              {/* Filter button - always visible */}
              <Button
                variant="outline"
                onClick={() => props.setShowFilters(!props.showFilters)}
                className="flex items-center gap-2 flex-shrink-0 whitespace-nowrap"
              >
                <Filter className="w-4 h-4" />
                <span className="hidden sm:inline">Filters</span>
                <span className="sm:hidden">Filt</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Filters Panel */}
      {props.showFilters && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Purpose Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Purpose
                </label>
                <Select value={props.selectedPurpose} onValueChange={(value) => props.setSelectedPurpose(value as PurposeType | 'ALL')}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="All Purposes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Purposes</SelectItem>
                    <SelectItem value="PORTFOLIO">Portfolio</SelectItem>
                    <SelectItem value="COMMERCIAL">Commercial</SelectItem>
                    <SelectItem value="EDITORIAL">Editorial</SelectItem>
                    <SelectItem value="FASHION">Fashion</SelectItem>
                    <SelectItem value="BEAUTY">Beauty</SelectItem>
                    <SelectItem value="LIFESTYLE">Lifestyle</SelectItem>
                    <SelectItem value="WEDDING">Wedding</SelectItem>
                    <SelectItem value="EVENT">Event</SelectItem>
                    <SelectItem value="PRODUCT">Product</SelectItem>
                    <SelectItem value="ARCHITECTURE">Architecture</SelectItem>
                    <SelectItem value="STREET">Street</SelectItem>
                    <SelectItem value="CONCEPTUAL">Conceptual</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Usage Rights Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Usage Rights
                </label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={props.selectedUsageRights}
                  onChange={(e) => props.setSelectedUsageRights(e.target.value)}
                >
                  <option value="ALL">All Usage Rights</option>
                  <option value="portfolio">Portfolio</option>
                  <option value="social">Social Media</option>
                  <option value="commercial">Commercial</option>
                  <option value="editorial">Editorial</option>
                  <option value="print">Print</option>
                  <option value="web">Website</option>
                </select>
              </div>

              {/* Start Date Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Start Date From
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={props.startDateFilter}
                  onChange={(e) => props.setStartDateFilter(e.target.value)}
                />
              </div>

              {/* End Date Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  End Date Until
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={props.endDateFilter}
                  onChange={(e) => props.setEndDateFilter(e.target.value)}
                />
              </div>

              {/* Max Applicants Filter */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Max Applicants
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  value={props.maxApplicantsFilter || ''}
                  onChange={(e) => props.setMaxApplicantsFilter(e.target.value ? parseInt(e.target.value) : null)}
                />
              </div>
            </div>

            {/* Style Tags Filter */}
            {props.availableStyleTags.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Style Tags
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {props.availableStyleTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => toggleArrayValue(props.selectedStyleTags, tag, props.setSelectedStyleTags)}
                      className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                        props.selectedStyleTags.includes(tag)
                          ? 'bg-primary/20 text-primary border-2 border-primary'
                          : 'bg-muted text-foreground border-2 border-border hover:border-primary/50'
                      }`}
                    >
                      <Tag className="w-3 h-3 inline mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
                {props.selectedStyleTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {props.selectedStyleTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary/20 text-primary text-xs rounded-full"
                      >
                        <Tag className="w-3 h-3" />
                        {tag}
                        <button
                          onClick={() => toggleArrayValue(props.selectedStyleTags, tag, props.setSelectedStyleTags)}
                          className="hover:text-primary/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Vibe Tags Filter */}
            {props.availableVibeTags.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Vibe Tags
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {props.availableVibeTags.map((tag, index) => (
                    <button
                      key={index}
                      onClick={() => toggleArrayValue(props.selectedVibeTags, tag, props.setSelectedVibeTags)}
                      className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                        props.selectedVibeTags.includes(tag)
                          ? 'bg-secondary/20 text-secondary-foreground border-2 border-secondary'
                          : 'bg-muted text-foreground border-2 border-border hover:border-primary/50'
                      }`}
                    >
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      {tag}
                    </button>
                  ))}
                </div>
                {props.selectedVibeTags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {props.selectedVibeTags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary/20 text-secondary-foreground text-xs rounded-full"
                      >
                        <Sparkles className="w-3 h-3" />
                        {tag}
                        <button
                          onClick={() => toggleArrayValue(props.selectedVibeTags, tag, props.setSelectedVibeTags)}
                          className="hover:text-secondary-foreground/80"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Role Types Filter */}
            {props.availableRoleTypes.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Looking For
                </label>
                <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                  {props.availableRoleTypes.map((type, index) => (
                    <button
                      key={index}
                      onClick={() => toggleArrayValue(props.selectedRoleTypes, type, props.setSelectedRoleTypes)}
                      className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                        props.selectedRoleTypes.includes(type)
                          ? 'bg-primary-100 text-primary-700 border-2 border-primary-300'
                          : 'bg-muted text-foreground border-2 border-border hover:border-primary/50'
                      }`}
                    >
                      {getLookingForLabel(type)}
                    </button>
                  ))}
                </div>
                {props.selectedRoleTypes.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {props.selectedRoleTypes.map((type, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
                      >
                        {getLookingForLabel(type)}
                        <button
                          onClick={() => toggleArrayValue(props.selectedRoleTypes, type, props.setSelectedRoleTypes)}
                          className="hover:text-primary-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Color Palette Filter */}
            {props.availablePalettes.length > 0 && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Color Palette
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {props.availablePalettes.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => toggleArrayValue(props.selectedPalette, color, props.setSelectedPalette)}
                      className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                        props.selectedPalette.includes(color)
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                {props.selectedPalette.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {props.selectedPalette.map((color, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-foreground text-xs rounded-full"
                      >
                        <div
                          className="w-3 h-3 rounded-full border"
                          style={{ backgroundColor: color }}
                        />
                        {color}
                        <button
                          onClick={() => toggleArrayValue(props.selectedPalette, color, props.setSelectedPalette)}
                          className="hover:text-foreground"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Creator Profile Filters */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="bg-card backdrop-blur-sm rounded-2xl p-6 border border-border shadow-xl">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Creator Profile Filters</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Experience Range Filter */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20">
                    <label className="block text-sm font-medium text-primary mb-3">
                      Experience (Years)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        max="50"
                        placeholder="Min"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        value={props.minExperienceFilter || ''}
                        onChange={(e) => props.setMinExperienceFilter(e.target.value ? parseInt(e.target.value) : null)}
                      />
                      <input
                        type="number"
                        min="0"
                        max="50"
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        value={props.maxExperienceFilter || ''}
                        onChange={(e) => props.setMaxExperienceFilter(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                  </div>

                  {/* Rate Range Filter */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20">
                    <label className="block text-sm font-medium text-primary mb-3">
                      Hourly Rate ($)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        value={props.minRateFilter || ''}
                        onChange={(e) => props.setMinRateFilter(e.target.value ? parseInt(e.target.value) : null)}
                      />
                      <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        className="w-full px-3 py-2 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                        value={props.maxRateFilter || ''}
                        onChange={(e) => props.setMaxRateFilter(e.target.value ? parseInt(e.target.value) : null)}
                      />
                    </div>
                  </div>

                  {/* Availability Filters */}
                  <div className="bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20">
                    <label className="block text-sm font-medium text-primary mb-3">
                      Availability
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={props.travelOnlyFilter}
                          onChange={(e) => props.setTravelOnlyFilter(e.target.checked)}
                          className="mr-3 w-4 h-4 text-primary bg-card border-primary/30 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground">Available for Travel</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={props.studioOnlyFilter}
                          onChange={(e) => props.setStudioOnlyFilter(e.target.checked)}
                          className="mr-3 w-4 h-4 text-primary bg-card border-primary/30 rounded focus:ring-primary"
                        />
                        <span className="text-sm text-foreground dark:text-muted-foreground-300">Has Studio</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Specializations Filter */}
                {props.availableSpecializations.length > 0 && (
                  <div className="mt-4 bg-gradient-to-r from-primary/10 to-primary/20 rounded-xl p-4 border border-primary/20">
                    <label className="block text-sm font-medium text-primary mb-3">
                      Specializations
                    </label>
                    <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                      {props.availableSpecializations.map((spec, index) => (
                        <button
                          key={index}
                          onClick={() => toggleArrayValue(props.selectedSpecializations, spec, props.setSelectedSpecializations)}
                          className={`px-3 py-1 rounded-full text-sm transition-all hover:scale-105 ${
                            props.selectedSpecializations.includes(spec)
                              ? 'bg-primary-100 dark:bg-primary-800 text-primary-800 dark:text-primary-200 border-2 border-primary-500'
                              : 'bg-card dark:bg-muted-700 text-foreground dark:text-muted-foreground-300 border-2 border-primary-200 dark:border-primary-600 hover:border-primary-400'
                          }`}
                        >
                          <Tag className="w-3 h-3 inline mr-1" />
                          {spec}
                        </button>
                      ))}
                    </div>
                    {props.selectedSpecializations.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1">
                        {props.selectedSpecializations.map((spec, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-200 text-xs rounded-full"
                          >
                            <Tag className="w-3 h-3" />
                            {spec}
                            <button
                              onClick={() => toggleArrayValue(props.selectedSpecializations, spec, props.setSelectedSpecializations)}
                              className="hover:text-secondary-foreground/80 dark:hover:text-primary-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Clear Filters */}
              <div className="mt-4 flex justify-between items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={props.onClearFilters}
                  className="text-sm underline"
                >
                  Clear all filters
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => props.setShowFilters(false)}
                  className="text-sm font-medium"
                >
                  Hide filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
