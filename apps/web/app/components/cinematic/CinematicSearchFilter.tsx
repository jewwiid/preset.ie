'use client';

import React, { useState, useEffect } from 'react';
import { 
  CinematicFilter,
  CameraAngle,
  DirectorStyle,
  SceneMood,
  ColorPalette,
  LensType,
  ShotSize,
  LightingStyle,
  AspectRatio,
  TimeSetting,
  WeatherCondition,
  LocationType
} from '../../../../../packages/types/src/cinematic-parameters';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Checkbox } from '../../../components/ui/checkbox';
import { Label } from '../../../components/ui/label';
import { Separator } from '../../../components/ui/separator';
import { 
  Search, 
  Filter, 
  Camera, 
  Lightbulb, 
  Palette, 
  Film, 
  Compass, 
  Clock, 
  MapPin,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface CinematicSearchFilterProps {
  onFiltersChange: (filters: CinematicFilter) => void;
  onSearchChange: (query: string) => void;
  onClearFilters: () => void;
  initialFilters?: CinematicFilter;
  initialQuery?: string;
  compact?: boolean;
}

interface FilterOptions {
  cameraAngles: string[];
  lensTypes: string[];
  directorStyles: string[];
  colorPalettes: string[];
  sceneMoods: string[];
  aspectRatios: string[];
  timeSettings: string[];
  weatherConditions: string[];
  locationTypes: string[];
}

export default function CinematicSearchFilter({
  onFiltersChange,
  onSearchChange,
  onClearFilters,
  initialFilters = {},
  initialQuery = '',
  compact = false
}: CinematicSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [filters, setFilters] = useState<CinematicFilter>(initialFilters);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    cameraAngles: [],
    lensTypes: [],
    directorStyles: [],
    colorPalettes: [],
    sceneMoods: [],
    aspectRatios: [],
    timeSettings: [],
    weatherConditions: [],
    locationTypes: []
  });
  const [activeTab, setActiveTab] = useState('search');
  const [isLoading, setIsLoading] = useState(false);

  // Load filter options on component mount
  useEffect(() => {
    loadFilterOptions();
  }, []);

  // Update parent when filters change
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  // Update parent when search query changes
  useEffect(() => {
    onSearchChange(searchQuery);
  }, [searchQuery, onSearchChange]);

  const loadFilterOptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/search-cinematic');
      const data = await response.json();
      
      if (data.success) {
        setFilterOptions(data.filterOptions);
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateFilter = <K extends keyof CinematicFilter>(
    key: K,
    value: CinematicFilter[K]
  ) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const toggleFilterValue = <K extends keyof CinematicFilter>(
    key: K,
    value: string
  ) => {
    const currentValues = (filters[key] as string[]) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    updateFilter(key, newValues as any);
  };

  const clearFilter = (key: keyof CinematicFilter) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters({});
    setSearchQuery('');
    onClearFilters();
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).reduce((count, filterArray) => {
      return count + (Array.isArray(filterArray) ? filterArray.length : 0);
    }, 0);
  };

  const FilterChip = ({ 
    label, 
    value, 
    onRemove 
  }: { 
    label: string; 
    value: string; 
    onRemove: () => void; 
  }) => (
    <Badge variant="secondary" className="flex items-center gap-1">
      {label}: {value}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-4 w-4 p-0"
      >
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );

  const MultiSelectFilter = ({
    label,
    values,
    options,
    onChange,
    icon: Icon
  }: {
    label: string;
    values: string[];
    options: string[];
    onChange: (values: string[]) => void;
    icon?: React.ComponentType<any>;
  }) => (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
        <Label className="text-sm font-medium">{label}</Label>
        {values.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange([])}
            className="h-6 w-6 p-0"
          >
            ×
          </Button>
        )}
      </div>
      <div className="space-y-2 max-h-32 overflow-y-auto">
        {options.map((option) => (
          <div key={option} className="flex items-center space-x-2">
            <Checkbox
              id={`${label}-${option}`}
              checked={values.includes(option)}
              onCheckedChange={() => toggleFilterValue(label.toLowerCase().replace(' ', '') as keyof CinematicFilter, option)}
            />
            <Label htmlFor={`${label}-${option}`} className="text-sm">
              {option.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  if (compact) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search cinematic images..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {getActiveFilterCount()} filters active
              </span>
            </div>
            {getActiveFilterCount() > 0 && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            )}
          </div>

          {/* Active Filters */}
          {getActiveFilterCount() > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, values]) => {
                  if (!Array.isArray(values) || values.length === 0) return null;
                  return values.map((value) => (
                    <FilterChip
                      key={`${key}-${value}`}
                      label={key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      value={value.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      onRemove={() => toggleFilterValue(key as keyof CinematicFilter, value)}
                    />
                  ));
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Cinematic Search & Filter
        </CardTitle>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {getActiveFilterCount()} filters active
            </span>
          </div>
          {getActiveFilterCount() > 0 && (
            <Button variant="outline" size="sm" onClick={clearAllFilters}>
              Clear All Filters
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Search
            </TabsTrigger>
            <TabsTrigger value="filters" className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by cinematic tags, director style, mood, etc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="text-sm text-muted-foreground">
              Search for images by cinematic parameters like "wes anderson", "low angle", "golden hour", etc.
            </div>
          </TabsContent>

          <TabsContent value="filters" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <MultiSelectFilter
                label="Camera Angles"
                values={filters.cameraAngles || []}
                options={filterOptions.cameraAngles}
                onChange={(values) => updateFilter('cameraAngles', values as CameraAngle[])}
                icon={Camera}
              />
              
              <MultiSelectFilter
                label="Director Styles"
                values={filters.directorStyles || []}
                options={filterOptions.directorStyles}
                onChange={(values) => updateFilter('directorStyles', values as DirectorStyle[])}
                icon={Film}
              />
              
              <MultiSelectFilter
                label="Scene Moods"
                values={filters.sceneMoods || []}
                options={filterOptions.sceneMoods}
                onChange={(values) => updateFilter('sceneMoods', values as SceneMood[])}
                icon={Palette}
              />
              
              <MultiSelectFilter
                label="Color Palettes"
                values={filters.colorPalettes || []}
                options={filterOptions.colorPalettes}
                onChange={(values) => updateFilter('colorPalettes', values as ColorPalette[])}
                icon={Lightbulb}
              />
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <MultiSelectFilter
                label="Lens Types"
                values={filters.lensTypes || []}
                options={filterOptions.lensTypes}
                onChange={(values) => updateFilter('lensTypes', values as LensType[])}
                icon={Camera}
              />
              
              <MultiSelectFilter
                label="Aspect Ratios"
                values={filters.aspectRatios || []}
                options={filterOptions.aspectRatios}
                onChange={(values) => updateFilter('aspectRatios', values as AspectRatio[])}
              />
              
              <MultiSelectFilter
                label="Time Settings"
                values={filters.timeSettings || []}
                options={filterOptions.timeSettings}
                onChange={(values) => updateFilter('timeSettings', values as TimeSetting[])}
                icon={Clock}
              />
              
              <MultiSelectFilter
                label="Weather Conditions"
                values={filters.weatherConditions || []}
                options={filterOptions.weatherConditions}
                onChange={(values) => updateFilter('weatherConditions', values as WeatherCondition[])}
              />
              
              <MultiSelectFilter
                label="Location Types"
                values={filters.locationTypes || []}
                options={filterOptions.locationTypes}
                onChange={(values) => updateFilter('locationTypes', values as LocationType[])}
                icon={MapPin}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Active Filters Summary */}
        {getActiveFilterCount() > 0 && (
          <>
            <Separator className="my-4" />
            <div className="space-y-2">
              <Label className="text-sm font-medium">Active Filters</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(filters).map(([key, values]) => {
                  if (!Array.isArray(values) || values.length === 0) return null;
                  return values.map((value) => (
                    <FilterChip
                      key={`${key}-${value}`}
                      label={key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                      value={value.replace(/-/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      onRemove={() => toggleFilterValue(key as keyof CinematicFilter, value)}
                    />
                  ));
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
