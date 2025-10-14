'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, X, Video, Image as ImageIcon, Sparkles } from 'lucide-react';

export type FilterType = 'all' | 'images' | 'videos';
export type SortOption = 'newest' | 'oldest' | 'credits-high' | 'credits-low';

interface GenerationFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterType: FilterType;
  onFilterTypeChange: (type: FilterType) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  totalCount: number;
  filteredCount: number;
}

export function GenerationFilters({
  searchQuery,
  onSearchChange,
  filterType,
  onFilterTypeChange,
  sortBy,
  onSortChange,
  totalCount,
  filteredCount}: GenerationFiltersProps) {
  const filterOptions = [
    { value: 'all', label: 'All', icon: Sparkles },
    { value: 'images', label: 'Images', icon: ImageIcon },
    { value: 'videos', label: 'Videos', icon: Video },
  ] as const;

  const sortOptions = [
    { value: 'newest', label: 'Newest First' },
    { value: 'oldest', label: 'Oldest First' },
    { value: 'credits-high', label: 'Credits: High to Low' },
    { value: 'credits-low', label: 'Credits: Low to High' },
  ] as const;

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or prompt..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-9"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={() => onSearchChange('')}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Filter Type Chips */}
      <div>
        <Label className="text-xs text-muted-foreground mb-2 block">Filter by Type</Label>
        <div className="flex flex-wrap gap-2">
          {filterOptions.map(({ value, label, icon: Icon }) => (
            <Badge
              key={value}
              variant={filterType === value ? 'default' : 'outline'}
              className="cursor-pointer hover:bg-primary/10"
              onClick={() => onFilterTypeChange(value as FilterType)}
            >
              <Icon className="h-3 w-3 mr-1" />
              {label}
            </Badge>
          ))}
        </div>
      </div>

      {/* Sort and Count */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Sort By</Label>
          <Select value={sortBy} onValueChange={(value) => onSortChange(value as SortOption)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="text-right">
          <Label className="text-xs text-muted-foreground mb-1.5 block">Results</Label>
          <p className="text-sm font-medium">
            {filteredCount} of {totalCount}
          </p>
        </div>
      </div>
    </div>
  );
}
