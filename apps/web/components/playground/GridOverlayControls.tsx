'use client';

import { Minus, Grid3X3, X } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';

interface GridOverlayControlsProps {
  showGridOverlay: boolean;
  onGridOverlayChange: (show: boolean) => void;
  gridType: 'horizontal' | 'rule-of-thirds';
  onGridTypeChange: (type: 'horizontal' | 'rule-of-thirds') => void;
  onRemove?: () => void;
  switchId?: string;
}

export function GridOverlayControls({
  showGridOverlay,
  onGridOverlayChange,
  gridType,
  onGridTypeChange,
  onRemove,
  switchId = 'grid-overlay'
}: GridOverlayControlsProps) {
  return (
    <div className="flex items-center justify-between bg-muted/30 p-3 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label htmlFor={switchId} className="text-sm font-medium">
            Grid Overlay
          </Label>
          <Switch
            id={switchId}
            checked={showGridOverlay}
            onCheckedChange={onGridOverlayChange}
          />
        </div>

        {showGridOverlay && (
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Type:</Label>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={gridType === 'horizontal' ? 'default' : 'outline'}
                onClick={() => onGridTypeChange('horizontal')}
                className="h-8 px-3 text-xs"
              >
                <Minus className="h-3 w-3 mr-1" />
                Horizontal
              </Button>
              <Button
                size="sm"
                variant={gridType === 'rule-of-thirds' ? 'default' : 'outline'}
                onClick={() => onGridTypeChange('rule-of-thirds')}
                className="h-8 px-3 text-xs"
              >
                <Grid3X3 className="h-3 w-3 mr-1" />
                Rule of Thirds
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Optional Remove Base Image Button */}
      {onRemove && (
        <Button
          size="sm"
          variant="outline"
          onClick={onRemove}
          className="h-8 px-3 text-xs text-destructive hover:text-destructive-foreground hover:bg-destructive"
        >
          <X className="h-3 w-3 mr-1" />
          Remove
        </Button>
      )}
    </div>
  );
}
