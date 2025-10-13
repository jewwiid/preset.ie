'use client'

import React, { useState, KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { Input } from './input'
import { Badge } from './badge'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
  disabled?: boolean
}

export function TagInput({ 
  value = [], 
  onChange, 
  placeholder = "Add item...", 
  maxTags = 20,
  className = "",
  disabled = false
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (trimmedTag && !value.includes(trimmedTag) && value.length < maxTags) {
      onChange([...value, trimmedTag])
    }
    setInputValue('')
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter(tag => tag !== tagToRemove))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag(inputValue)
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1])
    }
  }

  const handleBlur = () => {
    if (inputValue.trim()) {
      addTag(inputValue)
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Tags Display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((tag, index) => (
            <Badge
              key={index}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-1 hover:text-destructive transition-colors"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      
      {/* Input */}
      <Input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder={value.length >= maxTags ? `Maximum ${maxTags} items` : placeholder}
        disabled={disabled || value.length >= maxTags}
        className="w-full"
      />
      
      {/* Helper Text */}
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          {value.length}/{maxTags} items • Press Enter or comma to add
        </p>
      )}
    </div>
  )
}
