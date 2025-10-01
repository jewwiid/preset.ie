'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
}

export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select option...",
  emptyText = "No option found.",
  className,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: string) => {
    onValueChange(option === value ? "" : option);
    setOpen(false);
    setSearchTerm('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              {emptyText}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option) => (
                <div
                  key={option}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    value === option && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

interface MultiSelectComboboxProps {
  values: string[];
  onValuesChange: (values: string[]) => void;
  options: string[];
  placeholder?: string;
  emptyText?: string;
  className?: string;
  disabled?: boolean;
  maxSelections?: number;
}

export function MultiSelectCombobox({
  values,
  onValuesChange,
  options,
  placeholder = "Select options...",
  emptyText = "No options found.",
  className,
  disabled = false,
  maxSelections,
}: MultiSelectComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredOptions = options.filter(option =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (option: string) => {
    if (values.includes(option)) {
      onValuesChange(values.filter(v => v !== option));
    } else {
      if (maxSelections && values.length >= maxSelections) {
        return; // Don't add if max selections reached
      }
      onValuesChange([...values, option]);
    }
  };

  const displayText = values.length === 0 
    ? placeholder 
    : values.length === 1 
      ? values[0]
      : `${values.length} selected`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {displayText}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <div className="p-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={`Search ${placeholder.toLowerCase()}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="max-h-60 overflow-auto">
          {filteredOptions.length === 0 ? (
            <div className="p-2 text-sm text-muted-foreground text-center">
              {emptyText}
            </div>
          ) : (
            <div className="p-1">
              {filteredOptions.map((option) => (
                <div
                  key={option}
                  className={cn(
                    "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    values.includes(option) && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => handleSelect(option)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      values.includes(option) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {option}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
