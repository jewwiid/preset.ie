'use client'

import React, { useState } from 'react'
import { TagInputProps, ValidationType } from '../types/profile'
import { validateAndCheckTag } from '../../../lib/contentModeration'
import { X, Plus, Tag } from 'lucide-react'

export function TagInput({
  label,
  tags,
  onAddTag,
  onRemoveTag,
  placeholder = 'Add a tag...',
  predefinedOptions = [],
  validationType = 'talent_category',
  error,
  className = ''
}: TagInputProps) {
  const [newTag, setNewTag] = useState('')
  const [tagError, setTagError] = useState<string | null>(null)
  const [isValidating, setIsValidating] = useState(false)

  const handleAddTag = async () => {
    const trimmed = newTag.trim()
    if (!trimmed) return

    setIsValidating(true)
    setTagError(null)

    try {
      // Validate the tag
      const validation = await validateAndCheckTag(trimmed, validationType)
      if (!validation.isValid) {
        setTagError(validation.reason ?? 'Invalid tag')
        return
      }

      // Check if tag already exists
      if (tags.includes(trimmed)) {
        setTagError('Tag already exists')
        return
      }

      // Add the tag
      onAddTag(trimmed)
      setNewTag('')
      setTagError(null)
    } catch (err) {
      setTagError('Failed to validate tag')
    } finally {
      setIsValidating(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  const handlePredefinedTagClick = (tag: string) => {
    if (!tags.includes(tag)) {
      onAddTag(tag)
    }
  }

  const getLabelClasses = () => {
    const baseClasses = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    if (error || tagError) {
      return `${baseClasses} text-red-600 dark:text-red-400`
    }
    return baseClasses
  }

  return (
    <div className={`mb-4 ${className}`}>
      <label className={getLabelClasses()}>
        <Tag className="w-4 h-4 inline mr-1" />
        {label}
      </label>

      {/* Current tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemoveTag(tag)}
                className="ml-2 text-blue-600 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-100"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add new tag input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={isValidating}
          className={`flex-1 px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg focus:outline-none focus:ring-2 text-gray-900 dark:text-white transition-all duration-200 ${
            error || tagError 
              ? 'border-red-300 dark:border-red-600 focus:ring-red-500' 
              : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
          }`}
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={!newTag.trim() || isValidating}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200 flex items-center gap-1"
        >
          <Plus className="w-4 h-4" />
          {isValidating ? 'Adding...' : 'Add'}
        </button>
      </div>

      {/* Predefined options */}
      {predefinedOptions.length > 0 && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Suggested tags:</p>
          <div className="flex flex-wrap gap-2">
            {predefinedOptions
              .filter(option => !tags.includes(option))
              .slice(0, 10) // Limit to 10 suggestions
              .map((option, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePredefinedTagClick(option)}
                  className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  {option}
                </button>
              ))}
          </div>
        </div>
      )}

      {/* Error messages */}
      {(error || tagError) && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error || tagError}
        </p>
      )}
    </div>
  )
}

// Specialized tag input components for different tag types
export function StyleTagInput(props: Omit<TagInputProps, 'validationType'>) {
  return <TagInput {...props} validationType="talent_category" />
}

export function VibeTagInput(props: Omit<TagInputProps, 'validationType'>) {
  return <TagInput {...props} validationType="talent_category" />
}

export function SpecializationTagInput(props: Omit<TagInputProps, 'validationType'>) {
  return <TagInput {...props} validationType="specialization" />
}

export function EquipmentTagInput(props: Omit<TagInputProps, 'validationType'>) {
  return <TagInput {...props} validationType="brand" />
}
