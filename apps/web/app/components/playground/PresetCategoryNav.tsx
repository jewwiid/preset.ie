'use client';

import { Camera, Package, Star } from 'lucide-react';
import { Button } from '../../../components/ui/button';

interface PresetCategoryNavProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  showTrending: boolean;
  onToggleTrending: () => void;
  presetsCount: number;
}

export default function PresetCategoryNav({
  selectedCategory,
  onCategoryChange,
  showTrending,
  onToggleTrending,
  presetsCount}: PresetCategoryNavProps) {
  return (
    <div className="flex justify-between items-center">
      {/* Quick Access Buttons */}
      <div className="flex items-center space-x-2">
        <Button
          variant={selectedCategory === 'headshot' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('headshot')}
          className="flex items-center"
        >
          <Camera className="h-4 w-4 mr-1" />
          Headshots
        </Button>
        <Button
          variant={selectedCategory === 'product_photography' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('product_photography')}
          className="flex items-center"
        >
          <Package className="h-4 w-4 mr-1" />
          Product Photos
        </Button>
        <Button
          variant={showTrending ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleTrending}
          className="flex items-center"
        >
          <Star className="h-4 w-4 mr-1" />
          Trending
        </Button>
      </div>

      {/* Presets Count */}
      <div className="text-sm text-muted-foreground">
        {presetsCount} preset{presetsCount !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
