'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { FormFieldProps } from '../types/profile'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  disabled = false,
  required = false,
  error,
  className = '',
  min,
  max,
  step
}: FormFieldProps) {
  const baseInputClasses = "w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 text-foreground transition-all duration-200"
  
  const getInputClasses = () => {
    if (error) {
      return `${baseInputClasses} border-destructive focus:ring-destructive`
    }
    return `${baseInputClasses} border-border focus:ring-ring`
  }

  const getLabelClasses = () => {
    const baseClasses = "block text-sm font-medium text-foreground mb-1"
    if (error) {
      return `${baseClasses} text-destructive`
    }
    return baseClasses
  }

  const fieldId = `input-${label.toLowerCase().replace(/\s+/g, '-')}`

  const renderInput = () => {
    const commonProps = {
      value: value || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value),
      disabled,
      className: getInputClasses(),
      placeholder,
      required
    }

    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            {...commonProps}
            rows={3}
            className={`${getInputClasses()} resize-none`}
          />
        )
      
      case 'number':
        return (
          <Input
            id={fieldId}
            {...commonProps}
            type="number"
            min={min}
            max={max}
            step={step}
            className={error ? 'border-destructive focus:ring-destructive' : ''}
          />
        )
      
      case 'range':
        return (
          <input
            {...commonProps}
            type="range"
            min={min}
            max={max}
            step={step}
            className={`${getInputClasses()} h-2 bg-muted rounded-lg appearance-none cursor-pointer`}
          />
        )
      
      case 'email':
        return (
          <input
            {...commonProps}
            type="email"
          />
        )
      
      case 'url':
        return (
          <input
            {...commonProps}
            type="url"
          />
        )
      
      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
          />
        )
      
      default:
        return (
          <Input
            id={fieldId}
            {...commonProps}
            type="text"
            className={error ? 'border-destructive focus:ring-destructive' : ''}
          />
        )
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={fieldId} className={error ? 'text-destructive' : ''}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {renderInput()}
      
      {error && (
        <p className="text-xs text-destructive">
          {error}
        </p>
      )}
      
      {type === 'range' && typeof value === 'number' && (
        <div className="mt-1 text-sm text-muted-foreground">
          Current value: {value}
        </div>
      )}
    </div>
  )
}

// Specialized form field components for common use cases
export function TextField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="text" />
}

export function TextareaField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="textarea" />
}

export function NumberField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="number" />
}

export function RangeField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="range" />
}

export function EmailField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="email" />
}

export function UrlField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="url" />
}

export function DateField(props: Omit<FormFieldProps, 'type'>) {
  return <FormField {...props} type="date" />
}

// SelectField component
interface SelectOption {
  value: string
  label: string
}

interface SelectFieldProps {
  label: string
  value?: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  required?: boolean
  error?: string
  className?: string
  description?: string
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  required = false,
  error,
  className = '',
  description
}: SelectFieldProps) {
  const baseSelectClasses = "w-full px-3 py-2 bg-background border rounded-lg focus:outline-none focus:ring-2 text-foreground transition-all duration-200"
  
  const getSelectClasses = () => {
    if (error) {
      return `${baseSelectClasses} border-destructive focus:ring-destructive`
    }
    return `${baseSelectClasses} border-border focus:ring-ring`
  }

  const getLabelClasses = () => {
    const baseClasses = "block text-sm font-medium text-foreground mb-1"
    if (error) {
      return `${baseClasses} text-destructive`
    }
    return baseClasses
  }

  const selectFieldId = `select-${label.toLowerCase().replace(/\s+/g, '-')}`

  return (
    <div className={`space-y-2 ${className}`}>
      <Label htmlFor={selectFieldId} className={error ? 'text-destructive' : ''}>
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      
      <Select
        value={value || ''}
        onValueChange={onChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger id={selectFieldId} className={error ? 'border-destructive focus:ring-destructive' : ''}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
    </div>
  )
}

// Toggle Switch Component
interface ToggleSwitchProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  description?: string
}

export function ToggleSwitch({ 
  label, 
  checked, 
  onChange, 
  disabled = false, 
  className = '',
  description
}: ToggleSwitchProps) {
  return (
    <div className={`py-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <label className="text-sm font-medium text-foreground">
            {label}
          </label>
          {description && (
            <p className="text-xs text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${checked 
            ? 'bg-primary' 
            : 'bg-muted'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:opacity-80'
          }
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-background transition-transform
            ${checked ? 'translate-x-6' : 'translate-x-1'}
          `}
        />
      </button>
      </div>
    </div>
  )
}

// Tag Input Component
interface TagInputProps {
  label: string
  tags: string[]
  onAddTag: (tag: string) => void
  onRemoveTag: (tag: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  predefinedOptions?: string[]
  strictMode?: boolean // Only allow predefined options
  hint?: string
  loading?: boolean
}

export function TagInput({ 
  label, 
  tags, 
  onAddTag, 
  onRemoveTag, 
  placeholder = "Add a tag...", 
  disabled = false, 
  className = '',
  predefinedOptions = [],
  strictMode = false,
  hint,
  loading = false
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setInputValue(value)
    setShowSuggestions(value.length > 0)
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault()
      const trimmedValue = inputValue.trim()
      
      // In strict mode, only allow predefined options
      if (strictMode) {
        const isValidOption = predefinedOptions.includes(trimmedValue)
        if (isValidOption) {
          onAddTag(trimmedValue)
          setInputValue('')
          setShowSuggestions(false)
        }
        // If not valid, do nothing (user must select from suggestions)
      } else {
        // Normal mode - allow any input
        onAddTag(trimmedValue)
        setInputValue('')
        setShowSuggestions(false)
      }
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    onAddTag(suggestion)
    setInputValue('')
    setShowSuggestions(false)
  }

  const filteredSuggestions = predefinedOptions.filter(
    option => option.toLowerCase().includes(inputValue.toLowerCase()) && 
    !tags.includes(option)
  )

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <Label className="block text-sm font-medium text-foreground mb-2">
          {label}
        </Label>
      )}
      
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="inline-flex items-center gap-1 pr-1"
          >
            {tag}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onRemoveTag(tag)}
              disabled={disabled}
              className="h-auto p-0 ml-1 hover:bg-transparent"
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {/* Input Field */}
      <div className="relative">
        <Input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(inputValue.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
        />
        
        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-background border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filteredSuggestions.slice(0, 10).map((suggestion, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full justify-start text-left text-sm h-auto p-3"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        )}
        
        {/* Show available options hint */}
        {loading ? (
          <div className="text-xs text-muted-foreground mt-1">
            Loading options...
          </div>
        ) : hint ? (
          <div className="text-xs text-muted-foreground mt-1">
            {hint}
          </div>
        ) : predefinedOptions.length > 0 && !showSuggestions && (
          <div className="text-xs text-muted-foreground mt-1">
            {strictMode ? (
              <>
                {predefinedOptions.length} predefined options available. Select from suggestions only.
              </>
            ) : (
              <>
                {predefinedOptions.length} predefined options available. Start typing to see suggestions.
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
