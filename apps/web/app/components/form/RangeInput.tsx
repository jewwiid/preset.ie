'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface RangeInputProps {
  label: string;
  minLabel?: string;
  maxLabel?: string;
  minValue: number | null;
  maxValue: number | null;
  onMinChange: (value: number | null) => void;
  onMaxChange: (value: number | null) => void;
  minPlaceholder?: string;
  maxPlaceholder?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  description?: string;
}

export default function RangeInput({
  label,
  minLabel = 'Minimum',
  maxLabel = 'Maximum',
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  minPlaceholder = 'Min',
  maxPlaceholder = 'Max',
  min,
  max,
  step,
  unit,
  description}: RangeInputProps) {
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? null : parseFloat(e.target.value);
    onMinChange(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value === '' ? null : parseFloat(e.target.value);
    onMaxChange(value);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-base font-medium">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`min-${label}`} className="text-sm">
            {minLabel} {unit && <span className="text-muted-foreground">({unit})</span>}
          </Label>
          <Input
            id={`min-${label}`}
            type="number"
            placeholder={minPlaceholder}
            value={minValue ?? ''}
            onChange={handleMinChange}
            min={min}
            max={max}
            step={step}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`max-${label}`} className="text-sm">
            {maxLabel} {unit && <span className="text-muted-foreground">({unit})</span>}
          </Label>
          <Input
            id={`max-${label}`}
            type="number"
            placeholder={maxPlaceholder}
            value={maxValue ?? ''}
            onChange={handleMaxChange}
            min={min}
            max={max}
            step={step}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
}
