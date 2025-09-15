'use client'

import React, { useState } from 'react'
import { FormFieldProps } from '../types/profile'

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
  const baseInputClasses = "w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 dark:text-white transition-all duration-200"
  
  const getInputClasses = () => {
    if (error) {
      return `${baseInputClasses} border-red-300 dark:border-red-600 focus:ring-red-500`
    }
    return `${baseInputClasses} border-gray-300 dark:border-gray-600 focus:ring-blue-500`
  }

  const getLabelClasses = () => {
    const baseClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    if (error) {
      return `${baseClasses} text-red-600 dark:text-red-400`
    }
    return baseClasses
  }

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
            {...commonProps}
            rows={3}
            className={`${getInputClasses()} resize-none`}
          />
        )
      
      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
            min={min}
            max={max}
            step={step}
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
            className={`${getInputClasses()} h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer`}
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
          <input
            {...commonProps}
            type="text"
          />
        )
    }
  }

  return (
    <div className={`mb-4 ${className}`}>
      <label className={getLabelClasses()}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      {type === 'range' && typeof value === 'number' && (
        <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
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
  const baseSelectClasses = "w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 dark:text-white transition-all duration-200"
  
  const getSelectClasses = () => {
    if (error) {
      return `${baseSelectClasses} border-red-300 dark:border-red-600 focus:ring-red-500`
    }
    return `${baseSelectClasses} border-gray-300 dark:border-gray-600 focus:ring-blue-500`
  }

  const getLabelClasses = () => {
    const baseClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
    if (error) {
      return `${baseClasses} text-red-600 dark:text-red-400`
    }
    return baseClasses
  }

  return (
    <div className={`space-y-1 ${className}`}>
      <label className={getLabelClasses()}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {description && (
        <p className="text-xs text-gray-500 dark:text-gray-400">{description}</p>
      )}
      
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={getSelectClasses()}
        required={required}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
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
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
            ? 'bg-emerald-600 dark:bg-emerald-500' 
            : 'bg-gray-200 dark:bg-gray-700'
          }
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer hover:opacity-80'
          }
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
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
}

export function TagInput({ 
  label, 
  tags, 
  onAddTag, 
  onRemoveTag, 
  placeholder = "Add a tag...", 
  disabled = false, 
  className = '',
  predefinedOptions = []
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
      onAddTag(inputValue.trim())
      setInputValue('')
      setShowSuggestions(false)
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
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      
      {/* Tags Display */}
      <div className="flex flex-wrap gap-2 mb-2">
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
          >
            {tag}
            <button
              type="button"
              onClick={() => onRemoveTag(tag)}
              disabled={disabled}
              className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      {/* Input Field */}
      <div className="relative">
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(inputValue.length > 0)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white transition-all duration-200"
        />
        
        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-40 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-600"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
