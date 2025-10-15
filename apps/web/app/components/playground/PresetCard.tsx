'use client';

import { Star, Users, PlayCircle, Heart, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { getPresetCategoryColor, getPresetTypeBadge } from '../../../lib/utils/badge-helpers';

interface Preset {
  id: string;
  name: string;
  description?: string;
  category: string;
  usage_count: number;
  likes_count: number;
  is_public: boolean;
  is_featured: boolean;
  creator: {
    id: string;
    display_name: string;
    handle: string;
    avatar_url?: string;
  };
  cinematic_settings?: {
    enableCinematicMode?: boolean;
    generationMode?: 'text-to-image' | 'image-to-image';
    video?: any;
  };
  sample_images?: {
    before_images?: string[];
    after_images?: string[];
    descriptions?: string[];
  };
}

interface PresetCardProps {
  preset: Preset;
  viewMode?: 'grid' | 'list';
  onClick: (preset: Preset) => void;
  onDelete?: (preset: Preset) => void;
  showDeleteButton?: boolean;
  highlighted?: boolean;
}

// Helper function for rendering preset type badge
function renderPresetTypeBadge(presetId: string) {
  const badgeConfig = getPresetTypeBadge(presetId);
  if (!badgeConfig) return null;

  const label = presetId.toLowerCase().includes('product') || presetId.toLowerCase().includes('ecommerce')
    ? 'Product'
    : 'Professional';

  return (
    <Badge variant={badgeConfig.variant} className={badgeConfig.className}>
      {label}
    </Badge>
  );
}

function getGenerationModeBadge(preset: Preset) {
  if (preset.cinematic_settings?.generationMode === 'image-to-image') {
    return (
      <Badge variant="outline" className="text-xs bg-orange-50 border-orange-200 text-orange-700">
        Img2Img
      </Badge>
    );
  }
  return null;
}

function getVideoSettingsBadge(preset: Preset) {
  if (preset.cinematic_settings?.video) {
    return (
      <Badge variant="outline" className="text-xs bg-primary-50 border-primary/20 text-primary-700">
        Video Ready
      </Badge>
    );
  }
  return null;
}

export default function PresetCard({
  preset,
  viewMode = 'grid',
  onClick,
  onDelete,
  showDeleteButton = false,
  highlighted = false}: PresetCardProps) {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(preset);
  };

  if (viewMode === 'list') {
    return (
      <div
        className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
          highlighted ? 'border-primary/20' : ''
        }`}
        onClick={() => onClick(preset)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-medium text-sm truncate">{preset.name}</h3>
            {highlighted && <Star className="h-3 w-3 text-primary fill-current" />}
            <Badge className={`text-xs ${getPresetCategoryColor(preset.category)}`}>
              {preset.category}
            </Badge>
            {renderPresetTypeBadge(preset.id)}
            {getGenerationModeBadge(preset)}
            {getVideoSettingsBadge(preset)}
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <PlayCircle className="h-3 w-3" />
              <span>{preset.usage_count}</span>
            </div>
            <div className="flex items-center space-x-1 text-xs text-primary">
              <Heart className="h-3 w-3" />
              <span>{preset.likes_count || 0}</span>
            </div>
          </div>
          {preset.description && (
            <p className="text-xs text-muted-foreground truncate">
              {preset.description}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            by @{preset.creator.handle}
          </p>
        </div>
        <div className="flex items-center space-x-1 ml-4">
          {preset.is_featured && <Star className="h-4 w-4 text-primary" />}
          {preset.is_public && <Users className="h-4 w-4 text-primary" />}
          {showDeleteButton && onDelete && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Grid view
  return (
    <Card
      className={`cursor-pointer hover:shadow-md transition-shadow ${
        highlighted ? 'border-primary/20' : ''
      }`}
      onClick={() => onClick(preset)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <CardTitle className="text-sm">{preset.name}</CardTitle>
          <div className="flex items-center space-x-1">
            {highlighted && <Star className="h-3 w-3 text-primary fill-current" />}
            {preset.is_featured && <Star className="h-3 w-3 text-primary" />}
            {preset.is_public && <Users className="h-3 w-3 text-primary" />}
            {showDeleteButton && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={handleDelete}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-xs ${getPresetCategoryColor(preset.category)}`}>
            {preset.category}
          </Badge>
          {renderPresetTypeBadge(preset.id)}
          {getGenerationModeBadge(preset)}
          {getVideoSettingsBadge(preset)}
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <PlayCircle className="h-3 w-3" />
            <span>{preset.usage_count}</span>
          </div>
          <div className="flex items-center space-x-1 text-xs text-primary">
            <Heart className="h-3 w-3" />
            <span>{preset.likes_count || 0}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {preset.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
            {preset.description}
          </p>
        )}

        {/* Sample Images Preview */}
        {preset.sample_images && (preset.sample_images.before_images?.length || preset.sample_images.after_images?.length) && (
          <div className="mb-2">
            <div className="text-xs text-muted-foreground mb-1">Sample Images:</div>
            <div className="flex gap-1">
              {preset.sample_images.before_images?.slice(0, 2).map((url, index) => (
                <img
                  key={`before-${index}`}
                  src={url}
                  alt={`Before ${index + 1}`}
                  className="w-8 h-8 object-cover rounded border"
                />
              ))}
              {preset.sample_images.after_images?.slice(0, 2).map((url, index) => (
                <img
                  key={`after-${index}`}
                  src={url}
                  alt={`After ${index + 1}`}
                  className="w-8 h-8 object-cover rounded border"
                />
              ))}
              {((preset.sample_images.before_images?.length || 0) + (preset.sample_images.after_images?.length || 0)) > 4 && (
                <div className="w-8 h-8 bg-muted rounded border flex items-center justify-center text-xs text-muted-foreground">
                  +{((preset.sample_images.before_images?.length || 0) + (preset.sample_images.after_images?.length || 0)) - 4}
                </div>
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          by @{preset.creator.handle}
        </p>
      </CardContent>
    </Card>
  );
}
