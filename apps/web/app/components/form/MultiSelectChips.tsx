'use client';

import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger} from '@/components/ui/popover';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface Option {
  value: string;
  label: string;
}

interface MultiSelectChipsProps {
  label: string;
  description?: string;
  options: Option[];
  selectedValues: string[];
  onValuesChange: (values: string[]) => void;
  placeholder?: string;
  emptyText?: string;
  maxSelections?: number;
  allowCustom?: boolean;
  customPlaceholder?: string;
}

export default function MultiSelectChips({
  label,
  description,
  options,
  selectedValues,
  onValuesChange,
  placeholder = 'Select options...',
  emptyText = 'No options found.',
  maxSelections,
  allowCustom = false,
  customPlaceholder = 'Add custom option...'}: MultiSelectChipsProps) {
  const [open, setOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const handleSelect = (value: string) => {
    if (selectedValues.includes(value)) {
      onValuesChange(selectedValues.filter((v) => v !== value));
    } else {
      if (maxSelections && selectedValues.length >= maxSelections) {
        return;
      }
      onValuesChange([...selectedValues, value]);
    }
  };

  const handleRemove = (value: string) => {
    onValuesChange(selectedValues.filter((v) => v !== value));
  };

  const handleAddCustom = () => {
    if (!customInput.trim()) return;

    const customValue = customInput.trim().toLowerCase();
    if (!selectedValues.includes(customValue)) {
      if (maxSelections && selectedValues.length >= maxSelections) {
        return;
      }
      onValuesChange([...selectedValues, customValue]);
    }
    setCustomInput('');
    setOpen(false);
  };

  const getLabel = (value: string) => {
    const option = options.find((opt) => opt.value === value);
    return option ? option.label : value;
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-base font-medium">{label}</Label>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
        {maxSelections && (
          <p className="text-xs text-muted-foreground mt-1">
            Max selections: {selectedValues.length}/{maxSelections}
          </p>
        )}
      </div>

      {/* Selected chips */}
      {selectedValues.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedValues.map((value) => (
            <Badge
              key={value}
              variant="secondary"
              className="pl-3 pr-2 py-1 flex items-center gap-1"
            >
              <span>{getLabel(value)}</span>
              <button
                type="button"
                onClick={() => handleRemove(value)}
                className="ml-1 hover:bg-muted rounded-full p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Selection dropdown */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
            disabled={maxSelections ? selectedValues.length >= maxSelections : false}
          >
            {selectedValues.length === 0
              ? placeholder
              : `${selectedValues.length} selected`}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput placeholder="Search options..." />
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        'mr-2 h-4 w-4',
                        selectedValues.includes(option.value)
                          ? 'opacity-100'
                          : 'opacity-0'
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>

          {/* Custom input section */}
          {allowCustom && (
            <div className="border-t p-2 flex gap-2">
              <input
                type="text"
                placeholder={customPlaceholder}
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustom();
                  }
                }}
                className="flex-1 px-2 py-1 text-sm border rounded"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddCustom}
                disabled={!customInput.trim()}
              >
                Add
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}
