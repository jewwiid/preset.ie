'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';

interface LibrarySearchFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  selectedDifficulty?: string;
  onDifficultyChange?: (difficulty: string) => void;
  showFilters?: boolean;
}

export function LibrarySearchFilters({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  selectedDifficulty,
  onDifficultyChange,
  showFilters = true
}: LibrarySearchFiltersProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search templates, directors, moods..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      {showFilters && onCategoryChange && (
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={onCategoryChange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="portrait">Portrait</SelectItem>
              <SelectItem value="landscape">Landscape</SelectItem>
              <SelectItem value="cinematic">Cinematic</SelectItem>
              <SelectItem value="fashion">Fashion</SelectItem>
              <SelectItem value="architecture">Architecture</SelectItem>
              <SelectItem value="nature">Nature</SelectItem>
              <SelectItem value="abstract">Abstract</SelectItem>
            </SelectContent>
          </Select>
          {onDifficultyChange && (
            <Select value={selectedDifficulty} onValueChange={onDifficultyChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Difficulty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="beginner">Beginner</SelectItem>
                <SelectItem value="intermediate">Intermediate</SelectItem>
                <SelectItem value="advanced">Advanced</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      )}
    </div>
  );
}
