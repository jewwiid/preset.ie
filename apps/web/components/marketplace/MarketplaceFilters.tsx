'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { X, Filter, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MarketplaceFiltersProps {
  filters: {
    search?: string;
    category?: string;
    mode?: string;
    condition?: string;
    city?: string;
    country?: string;
    verified_only?: boolean;
    min_price?: number;
    max_price?: number;
  };
  onFiltersChange: (filters: any) => void;
  onClearFilters: () => void;
  className?: string;
}

const categories = [
  'camera',
  'lens',
  'lighting',
  'audio',
  'tripod',
  'accessories',
  'other'
];

const conditions = [
  'new',
  'like_new',
  'good',
  'fair',
  'poor'
];

const modes = [
  { value: 'rent', label: 'Rent Only' },
  { value: 'sale', label: 'Sale Only' },
  { value: 'both', label: 'Rent & Sale' }
];

export default function MarketplaceFilters({ 
  filters, 
  onFiltersChange, 
  onClearFilters,
  className 
}: MarketplaceFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleClearFilters = () => {
    setLocalFilters({});
    onClearFilters();
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== false
  );

  const formatPrice = (cents: number) => {
    return `€${(cents / 100).toFixed(0)}`;
  };

  return (
    <div className={cn("bg-white rounded-lg border border-gray-200 p-4", className)}>
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search listings..."
            value={localFilters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Filter Toggle */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center space-x-2"
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2">
              {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== false).length}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="space-y-4 border-t border-gray-200 pt-4">
          {/* Category */}
          <div>
            <Label htmlFor="category" className="text-sm font-medium text-gray-700">
              Category
            </Label>
            <Select
              value={localFilters.category || ''}
              onValueChange={(value) => handleFilterChange('category', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mode */}
          <div>
            <Label htmlFor="mode" className="text-sm font-medium text-gray-700">
              Type
            </Label>
            <Select
              value={localFilters.mode || ''}
              onValueChange={(value) => handleFilterChange('mode', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All types</SelectItem>
                {modes.map((mode) => (
                  <SelectItem key={mode.value} value={mode.value}>
                    {mode.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div>
            <Label htmlFor="condition" className="text-sm font-medium text-gray-700">
              Condition
            </Label>
            <Select
              value={localFilters.condition || ''}
              onValueChange={(value) => handleFilterChange('condition', value || undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="All conditions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All conditions</SelectItem>
                {conditions.map((condition) => (
                  <SelectItem key={condition} value={condition}>
                    {condition.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                City
              </Label>
              <Input
                id="city"
                placeholder="Enter city"
                value={localFilters.city || ''}
                onChange={(e) => handleFilterChange('city', e.target.value || undefined)}
              />
            </div>
            <div>
              <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                Country
              </Label>
              <Input
                id="country"
                placeholder="Enter country"
                value={localFilters.country || ''}
                onChange={(e) => handleFilterChange('country', e.target.value || undefined)}
              />
            </div>
          </div>

          {/* Price Range */}
          <div>
            <Label className="text-sm font-medium text-gray-700">
              Price Range
            </Label>
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  type="number"
                  placeholder="Min price"
                  value={localFilters.min_price ? localFilters.min_price / 100 : ''}
                  onChange={(e) => handleFilterChange('min_price', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                />
                <Input
                  type="number"
                  placeholder="Max price"
                  value={localFilters.max_price ? localFilters.max_price / 100 : ''}
                  onChange={(e) => handleFilterChange('max_price', e.target.value ? parseInt(e.target.value) * 100 : undefined)}
                />
              </div>
            </div>
          </div>

          {/* Verified Only */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="verified_only"
              checked={localFilters.verified_only || false}
              onChange={(e) => handleFilterChange('verified_only', e.target.checked || undefined)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <Label htmlFor="verified_only" className="text-sm font-medium text-gray-700">
              Verified users only
            </Label>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-2">
            {filters.search && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Search: {filters.search}</span>
                <button
                  onClick={() => handleFilterChange('search', undefined)}
                  className="ml-1 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.category && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Category: {filters.category}</span>
                <button
                  onClick={() => handleFilterChange('category', undefined)}
                  className="ml-1 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.mode && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Type: {modes.find(m => m.value === filters.mode)?.label}</span>
                <button
                  onClick={() => handleFilterChange('mode', undefined)}
                  className="ml-1 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.condition && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Condition: {filters.condition}</span>
                <button
                  onClick={() => handleFilterChange('condition', undefined)}
                  className="ml-1 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.verified_only && (
              <Badge variant="secondary" className="flex items-center space-x-1">
                <span>Verified Only</span>
                <button
                  onClick={() => handleFilterChange('verified_only', undefined)}
                  className="ml-1 hover:text-gray-600"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
