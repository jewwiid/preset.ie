'use client';

import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StyleProviderSelectorsProps {
  // Style props
  currentStyle?: string;
  onStyleChange?: (style: string) => void;
  availableStyles: Array<{ style_name: string; display_name: string }>;
  loadingStyles?: boolean;

  // Provider props
  selectedProvider?: string;
  onProviderChange?: (provider: string) => void;
}

export function StyleProviderSelectors({
  currentStyle,
  onStyleChange,
  availableStyles,
  loadingStyles = false,
  selectedProvider,
  onProviderChange
}: StyleProviderSelectorsProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Style Selector */}
      {onStyleChange && (
        <div className="flex items-center gap-2">
          <Label htmlFor="style-selector" className="text-sm font-medium">Style:</Label>
          <Select value={currentStyle || ''} onValueChange={onStyleChange} disabled={loadingStyles}>
            <SelectTrigger className="w-[160px] h-8 text-sm">
              <SelectValue placeholder={loadingStyles ? "Loading..." : "Select style"} />
            </SelectTrigger>
            <SelectContent>
              {availableStyles.map((style) => (
                <SelectItem key={style.style_name} value={style.style_name}>
                  {style.display_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Provider Selector */}
      {onProviderChange && (
        <div className="flex items-center gap-2">
          <Label htmlFor="provider-selector" className="text-sm font-medium">Provider:</Label>
          <Select value={selectedProvider || 'nanobanana'} onValueChange={onProviderChange}>
            <SelectTrigger className="w-[140px] h-8 text-sm">
              <SelectValue placeholder="Select provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nanobanana">🍌 NanoBanana</SelectItem>
              <SelectItem value="seedream">🌊 Seedream</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
