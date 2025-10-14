/**
 * Enhanced Mention Suggestions Dropdown
 * 
 * Categorized autocomplete dropdown with search across all categories,
 * keyboard navigation, visual icons, and color previews.
 */

'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { MentionableEntity, MentionType } from '@/lib/utils/mention-types';
import { 
  Type, Camera, Palette, MapPin, Ruler, Sparkles, 
  Search, ArrowUp, ArrowDown, CornerDownLeft, X 
} from 'lucide-react';

interface MentionSuggestionsProps {
  entities: MentionableEntity[];
  onSelect: (entity: MentionableEntity) => void;
  onClose: () => void;
  position: { top: number; left: number };
  className?: string;
  maxHeight?: number;
}

interface CategorizedEntities {
  [category: string]: MentionableEntity[];
}

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  'Camera': Camera,
  'Lighting': Sparkles,
  'Location': MapPin,
  'Color': Palette,
  'Dimensions': Ruler,
  'Style': Sparkles,
  'Subject': Type,
  'Mood': Type,
  'Time': Type,
  'Weather': Type,
  'Edit': Type,
  'Video': Camera,
  'Image': Camera,
  'Default': Type
};

const CATEGORY_COLORS: Record<string, string> = {
  'Camera': '#3B82F6',
  'Lighting': '#F59E0B',
  'Location': '#10B981',
  'Color': '#EF4444',
  'Dimensions': '#8B5CF6',
  'Style': '#EC4899',
  'Subject': '#06B6D4',
  'Mood': '#84CC16',
  'Time': '#F97316',
  'Weather': '#6366F1',
  'Edit': '#14B8A6',
  'Video': '#DC2626',
  'Image': '#7C3AED',
  'Default': '#6B7280'
};

export default function MentionSuggestions({
  entities,
  onSelect,
  onClose,
  position,
  className = '',
  maxHeight = 400
}: MentionSuggestionsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Categorize entities
  const categorizedEntities = useMemo((): CategorizedEntities => {
    const categories: CategorizedEntities = {};
    
    entities.forEach(entity => {
      const category = entity.metadata?.category || 'Default';
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(entity);
    });
    
    return categories;
  }, [entities]);

  // Filter entities based on search query
  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) {
      return entities;
    }
    
    const query = searchQuery.toLowerCase();
    return entities.filter(entity => 
      entity.label.toLowerCase().includes(query) ||
      entity.value.toLowerCase().includes(query) ||
      entity.metadata?.description?.toLowerCase().includes(query) ||
      entity.metadata?.synonyms?.some(syn => syn.toLowerCase().includes(query))
    );
  }, [entities, searchQuery]);

  // Get flat list of filtered entities for keyboard navigation
  const flatFilteredEntities = useMemo(() => {
    const flat: MentionableEntity[] = [];
    
    Object.entries(categorizedEntities).forEach(([category, categoryEntities]) => {
      const filtered = categoryEntities.filter(entity => 
        filteredEntities.includes(entity)
      );
      if (filtered.length > 0) {
        flat.push(...filtered);
      }
    });
    
    return flat;
  }, [categorizedEntities, filteredEntities]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < flatFilteredEntities.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : flatFilteredEntities.length - 1
        );
        break;
      case 'CornerDownLeft':
        e.preventDefault();
        if (flatFilteredEntities[selectedIndex]) {
          onSelect(flatFilteredEntities[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Reset selected index when search changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery, flatFilteredEntities.length]);

  // Render entity item
  const renderEntityItem = (entity: MentionableEntity, index: number, isSelected: boolean) => {
    const category = entity.metadata?.category || 'Default';
    const IconComponent = CATEGORY_ICONS[category] || Type;
    const categoryColor = CATEGORY_COLORS[category] || '#6B7280';
    
    return (
      <div
        key={entity.id}
        className={cn(
          'flex items-center gap-3 p-2 rounded-md cursor-pointer transition-all duration-150',
          isSelected
            ? 'bg-primary text-primary-foreground shadow-sm scale-[1.02]'
            : 'hover:bg-muted/80 hover:scale-[1.01]'
        )}
        onClick={() => onSelect(entity)}
      >
        {/* Category icon */}
        <div 
          className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${categoryColor}20` }}
        >
          <IconComponent 
            size={16} 
            style={{ color: categoryColor }}
          />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm truncate">
            @{entity.label}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Badge 
              variant={isSelected ? "secondary" : "outline"} 
              className="text-xs"
              style={{ 
                backgroundColor: isSelected ? undefined : `${categoryColor}15`,
                borderColor: isSelected ? undefined : categoryColor,
                color: isSelected ? undefined : categoryColor
              }}
            >
              {category}
            </Badge>
            {entity.metadata?.subcategory && (
              <span className="text-xs text-muted-foreground">
                {entity.metadata.subcategory}
              </span>
            )}
          </div>
          {entity.metadata?.description && (
            <div className="text-xs text-muted-foreground truncate mt-1">
              {entity.metadata.description}
            </div>
          )}
        </div>
        
        {/* Color preview for color entities */}
        {entity.type === 'color' && entity.color && (
          <div 
            className="w-4 h-4 rounded border border-border flex-shrink-0"
            style={{ backgroundColor: entity.color }}
          />
        )}
        
        {/* Selection indicator */}
        {isSelected && (
          <div className="w-2 h-2 rounded-full bg-primary-foreground flex-shrink-0" />
        )}
      </div>
    );
  };

  // Render category section
  const renderCategorySection = (category: string, categoryEntities: MentionableEntity[]) => {
    const filtered = categoryEntities.filter(entity => 
      filteredEntities.includes(entity)
    );
    
    if (filtered.length === 0) return null;
    
    const IconComponent = CATEGORY_ICONS[category] || Type;
    const categoryColor = CATEGORY_COLORS[category] || '#6B7280';
    
    return (
      <div key={category} className="mb-4 last:mb-0">
        <div className="flex items-center gap-2 px-2 py-1 mb-2">
          <IconComponent size={14} style={{ color: categoryColor }} />
          <span className="text-xs font-medium text-muted-foreground">
            {category}
          </span>
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">
            {filtered.length}
          </span>
        </div>
        
        <div className="space-y-1">
          {filtered.map((entity, index) => {
            const globalIndex = flatFilteredEntities.indexOf(entity);
            return renderEntityItem(entity, globalIndex, globalIndex === selectedIndex);
          })}
        </div>
      </div>
    );
  };

  return (
    <Card 
      ref={containerRef}
      className={cn(
        'absolute z-50 w-96 shadow-xl border-2 border-primary/30 bg-background/95 backdrop-blur-sm ring-1 ring-primary/10 animate-in fade-in-0 zoom-in-95 duration-200',
        className
      )}
      style={{
        top: position.top,
        left: position.left,
        maxHeight: maxHeight
      }}
    >
      <CardContent className="p-0">
        {/* Search header */}
        <div className="p-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Search size={16} className="text-muted-foreground" />
            <Input
              ref={inputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search mentions..."
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-3 max-h-80 overflow-y-auto">
          {filteredEntities.length > 0 ? (
            <div className="space-y-4">
              {Object.entries(categorizedEntities).map(([category, categoryEntities]) =>
                renderCategorySection(category, categoryEntities)
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground mb-2">
                No mentions found
              </div>
              <div className="text-xs text-muted-foreground">
                Try a different search term
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with keyboard shortcuts */}
        <div className="px-3 py-2 border-t border-border bg-muted/30">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <ArrowUp size={12} />
                <ArrowDown size={12} />
                <span>Navigate</span>
              </div>
              <div className="flex items-center gap-1">
                <CornerDownLeft size={12} />
                <span>Select</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <span>ESC</span>
              <span>Close</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
