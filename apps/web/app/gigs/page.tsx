'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, Users, Sparkles, Eye, Grid, Map } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { PageHeader } from '@/components/PageHeader';
import { usePageHeaderImage } from '@/hooks/usePageHeaderImage';
import { useGigs } from './hooks/useGigs';
import { useSavedGigs } from './hooks/useSavedGigs';
import { useGigFilters } from './hooks/useGigFilters';
import { useSimulatedData } from './hooks/useSimulatedData';
import { filterGigs } from './lib/filterGigs';
import { GigFilters } from './components/GigFilters';
import { GigGrid } from './components/GigGrid';
import { EmptyState } from './components/EmptyState';
import { Gig, MapGig } from './types';
import GigsMap from '@/components/GigsMap';
import GigsMapSidebar from '@/components/GigsMapSidebar';

/**
 * Main Gig Discovery Page
 * Displays published gigs with comprehensive filtering and search capabilities
 */
export default function GigDiscoveryPage() {
  const router = useRouter();
  const { headerImage } = usePageHeaderImage('gigs-header');

  // Custom hooks for data and state management
  const { gigs, loading, availablePalettes, availableRoleTypes, availableSpecializations } = useGigs();
  const { savedGigs, toggleSaveGig } = useSavedGigs();
  const filters = useGigFilters();
  const { availableStyleTags, availableVibeTags, getSimulatedGigData } = useSimulatedData();

  // Local state for enhanced gigs
  const [enhancedGigs, setEnhancedGigs] = useState<Gig[]>([]);
  const [filteredGigs, setFilteredGigs] = useState<Gig[]>([]);
  
  // Map view state
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [mapGigs, setMapGigs] = useState<MapGig[]>([]);
  const [selectedGig, setSelectedGig] = useState<MapGig | null>(null);

  // Enhance gigs with simulated data when gigs are loaded
  useEffect(() => {
    if (gigs.length > 0) {
      const enhanced = gigs.map(gig => ({
        ...gig,
        ...getSimulatedGigData(gig)
      }));
      setEnhancedGigs(enhanced);
    }
  }, [gigs]);

  // Apply filters whenever enhanced gigs or filter values change
  useEffect(() => {
    const filtered = filterGigs(enhancedGigs, {
      searchTerm: filters.searchTerm,
      selectedCompType: filters.selectedCompType,
      selectedPurpose: filters.selectedPurpose,
      selectedUsageRights: filters.selectedUsageRights,
      locationFilter: filters.locationFilter,
      startDateFilter: filters.startDateFilter,
      endDateFilter: filters.endDateFilter,
      maxApplicantsFilter: filters.maxApplicantsFilter,
      selectedPalette: filters.selectedPalette,
      selectedStyleTags: filters.selectedStyleTags,
      selectedVibeTags: filters.selectedVibeTags,
      selectedRoleTypes: filters.selectedRoleTypes,
      minExperienceFilter: filters.minExperienceFilter,
      maxExperienceFilter: filters.maxExperienceFilter,
      selectedSpecializations: filters.selectedSpecializations,
      minRateFilter: filters.minRateFilter,
      maxRateFilter: filters.maxRateFilter,
      travelOnlyFilter: filters.travelOnlyFilter,
      studioOnlyFilter: filters.studioOnlyFilter
    });
    setFilteredGigs(filtered);
  }, [
    enhancedGigs,
    filters.searchTerm,
    filters.selectedCompType,
    filters.selectedPurpose,
    filters.selectedUsageRights,
    filters.locationFilter,
    filters.startDateFilter,
    filters.endDateFilter,
    filters.maxApplicantsFilter,
    filters.selectedPalette,
    filters.selectedStyleTags,
    filters.selectedVibeTags,
    filters.selectedRoleTypes,
    filters.minExperienceFilter,
    filters.maxExperienceFilter,
    filters.selectedSpecializations,
    filters.minRateFilter,
    filters.maxRateFilter,
    filters.travelOnlyFilter,
    filters.studioOnlyFilter
  ]);

  // Handle save gig with redirect to sign-in if not authenticated
  const handleToggleSave = (gigId: string) => {
    toggleSaveGig(gigId, () => router.push('/auth/signin'));
  };

  // Map handlers
  const handleGigSelect = (gig: MapGig) => {
    setSelectedGig(gig);
  };

  const handleGigView = (gig: MapGig) => {
    router.push(`/gigs/${gig.id}`);
  };

  const handleMapGigsUpdate = (gigs: MapGig[]) => {
    setMapGigs(gigs);
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Header */}
        <PageHeader
          title="Gigs"
          subtitle="Discover creative opportunities and collaborate with talented professionals"
          icon={Camera}
          stats={[
            { icon: Users, label: `${gigs.length} Active Gigs` },
            { icon: Sparkles, label: 'Find Your Next Creative Project' }
          ]}
          actions={
            <>
              <Link href="/gigs/my-gigs">
                <Button size="lg" variant="outline" className="px-6 py-3 text-base font-semibold">
                  <Eye className="h-5 w-5 mr-2" />
                  My Gigs
                </Button>
              </Link>
              <Link href="/gigs/create">
                <Button size="lg" className="px-8 py-3 text-base font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow">
                  <Sparkles className="h-5 w-5" />
                  Create Gig
                </Button>
              </Link>
            </>
          }
          backgroundImage={headerImage}
        />

        {/* Filters */}
        <GigFilters
          // Basic filters
          searchTerm={filters.searchTerm}
          setSearchTerm={filters.setSearchTerm}
          selectedCompType={filters.selectedCompType}
          setSelectedCompType={filters.setSelectedCompType}
          locationFilter={filters.locationFilter}
          setLocationFilter={filters.setLocationFilter}
          showFilters={filters.showFilters}
          setShowFilters={filters.setShowFilters}
          // Advanced filters
          selectedPurpose={filters.selectedPurpose}
          setSelectedPurpose={filters.setSelectedPurpose}
          selectedUsageRights={filters.selectedUsageRights}
          setSelectedUsageRights={filters.setSelectedUsageRights}
          startDateFilter={filters.startDateFilter}
          setStartDateFilter={filters.setStartDateFilter}
          endDateFilter={filters.endDateFilter}
          setEndDateFilter={filters.setEndDateFilter}
          maxApplicantsFilter={filters.maxApplicantsFilter}
          setMaxApplicantsFilter={filters.setMaxApplicantsFilter}
          // Visual filters
          availableStyleTags={availableStyleTags}
          selectedStyleTags={filters.selectedStyleTags}
          setSelectedStyleTags={filters.setSelectedStyleTags}
          availableVibeTags={availableVibeTags}
          selectedVibeTags={filters.selectedVibeTags}
          setSelectedVibeTags={filters.setSelectedVibeTags}
          availableRoleTypes={availableRoleTypes}
          selectedRoleTypes={filters.selectedRoleTypes}
          setSelectedRoleTypes={filters.setSelectedRoleTypes}
          availablePalettes={availablePalettes}
          selectedPalette={filters.selectedPalette}
          setSelectedPalette={filters.setSelectedPalette}
          // Creator profile filters
          minExperienceFilter={filters.minExperienceFilter}
          setMinExperienceFilter={filters.setMinExperienceFilter}
          maxExperienceFilter={filters.maxExperienceFilter}
          setMaxExperienceFilter={filters.setMaxExperienceFilter}
          availableSpecializations={availableSpecializations}
          selectedSpecializations={filters.selectedSpecializations}
          setSelectedSpecializations={filters.setSelectedSpecializations}
          minRateFilter={filters.minRateFilter}
          setMinRateFilter={filters.setMinRateFilter}
          maxRateFilter={filters.maxRateFilter}
          setMaxRateFilter={filters.setMaxRateFilter}
          travelOnlyFilter={filters.travelOnlyFilter}
          setTravelOnlyFilter={filters.setTravelOnlyFilter}
          studioOnlyFilter={filters.studioOnlyFilter}
          setStudioOnlyFilter={filters.setStudioOnlyFilter}
          // Actions
          onClearFilters={filters.clearAllFilters}
        />

        {/* View Toggle & Results Count */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Found {viewMode === 'grid' ? filteredGigs.length : mapGigs.length} gigs
            {filters.hasActiveFilters() && (
              <span className="ml-2 text-primary">(filtered)</span>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid className="w-4 h-4 mr-2" />
              Grid
            </Button>
            <Button 
              variant={viewMode === 'map' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setViewMode('map')}
            >
              <Map className="w-4 h-4 mr-2" />
              Map
            </Button>
          </div>
        </div>

        {/* Gig Grid, Map, or Empty State */}
        {viewMode === 'map' ? (
          <div className="h-[calc(100vh-400px)]">
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel defaultSize={70} minSize={40} className="min-w-0">
                <GigsMap 
                  onGigSelect={handleGigSelect}
                  className="h-full"
                />
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20} className="min-w-0">
                <GigsMapSidebar
                  gigs={mapGigs}
                  selectedGig={selectedGig}
                  onGigSelect={handleGigSelect}
                  onGigView={handleGigView}
                  className="h-full"
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          </div>
        ) : filteredGigs.length > 0 ? (
          <GigGrid
            gigs={filteredGigs}
            savedGigs={savedGigs}
            onToggleSave={handleToggleSave}
            gigsPerPage={12}
          />
        ) : (
          <EmptyState
            hasFilters={filters.hasActiveFilters()}
            onClearFilters={filters.clearAllFilters}
          />
        )}
      </div>
    </div>
  );
}
