'use client';

import { Search, Grid3X3, List } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

interface PresetFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  viewMode: 'grid' | 'list';
  onViewModeChange: (mode: 'grid' | 'list') => void;
  onSearch: () => void;
  onClearSearch: () => void;
  categories: Array<{ value: string; label: string }>;
}

export default function PresetFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  viewMode,
  onViewModeChange,
  onSearch,
  onClearSearch,
  categories}: PresetFiltersProps) {
  return (
    <div className="flex flex-col space-y-2">
      {/* Search and Category Row */}
      <div className="flex space-x-2">
        <Input
          placeholder="Search presets..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSearch();
            }
          }}
        />
        {searchQuery && (
          <Button variant="ghost" size="sm" onClick={onClearSearch} className="ml-2">
            Clear
          </Button>
        )}
        <Select value={selectedCategory} onValueChange={onCategoryChange}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="popular">Popular</SelectItem>
            <SelectItem value="likes">Most Liked</SelectItem>
            <SelectItem value="created_at">Newest</SelectItem>
            <SelectItem value="name">Name A-Z</SelectItem>
            <SelectItem value="usage_count">Most Used</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={onSearch} size="sm">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* View Mode Toggle */}
      <div className="flex justify-end">
        <div className="flex items-center space-x-1 border rounded-md p-1">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('grid')}
            className="h-7 px-2"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => onViewModeChange('list')}
            className="h-7 px-2"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
