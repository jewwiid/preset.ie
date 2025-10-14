'use client'

import { useState, useCallback } from 'react'
import { validateAndCheckTag } from '../../../lib/contentModeration'
import { ValidationResult, ValidationType, UseValidationReturn } from '../types/profile'

export function useValidation(): UseValidationReturn {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>()

  const validateField = useCallback((field: string, value: any): ValidationResult => {
    switch (field) {
      case 'display_name':
        if (!value || value.trim().length === 0) {
          return { isValid: false, error: 'Display name is required' }
        }
        if (value.trim().length < 2) {
          return { isValid: false, error: 'Display name must be at least 2 characters' }
        }
        if (value.trim().length > 50) {
          return { isValid: false, error: 'Display name must be 50 characters or less' }
        }
        return { isValid: true }

      case 'handle':
        if (!value || value.trim().length === 0) {
          return { isValid: false, error: 'Handle is required' }
        }
        if (!/^[a-zA-Z0-9_]+$/.test(value)) {
          return { isValid: false, error: 'Handle can only contain letters, numbers, and underscores' }
        }
        if (value.length < 3) {
          return { isValid: false, error: 'Handle must be at least 3 characters' }
        }
        if (value.length > 30) {
          return { isValid: false, error: 'Handle must be 30 characters or less' }
        }
        return { isValid: true }

      case 'email':
        if (!value || value.trim().length === 0) {
          return { isValid: false, error: 'Email is required' }
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return { isValid: false, error: 'Please enter a valid email address' }
        }
        return { isValid: true }

      case 'phone_number':
        if (value && value.trim().length > 0) {
          // Basic phone number validation
          const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
          if (!phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''))) {
            return { isValid: false, error: 'Please enter a valid phone number' }
          }
        }
        return { isValid: true }

      case 'website_url':
      case 'portfolio_url':
        if (value && value.trim().length > 0) {
          try {
            new URL(value)
          } catch {
            return { isValid: false, error: 'Please enter a valid URL' }
          }
        }
        return { isValid: true }

      case 'instagram_handle':
      case 'tiktok_handle':
        if (value && value.trim().length > 0) {
          const handle = value.replace('@', '').trim()
          if (!/^[a-zA-Z0-9._]+$/.test(handle)) {
            return { isValid: false, error: 'Handle can only contain letters, numbers, dots, and underscores' }
          }
          if (handle.length < 1) {
            return { isValid: false, error: 'Handle must be at least 1 character' }
          }
          if (handle.length > 30) {
            return { isValid: false, error: 'Handle must be 30 characters or less' }
          }
        }
        return { isValid: true }

      case 'years_experience':
        if (value !== null && value !== undefined) {
          if (value < 0) {
            return { isValid: false, error: 'Years of experience cannot be negative' }
          }
          if (value > 50) {
            return { isValid: false, error: 'Years of experience cannot exceed 50' }
          }
        }
        return { isValid: true }

      case 'hourly_rate_min':
      case 'hourly_rate_max':
        if (value !== null && value !== undefined) {
          if (value < 0) {
            return { isValid: false, error: 'Rate cannot be negative' }
          }
          if (value > 10000) {
            return { isValid: false, error: 'Rate cannot exceed $10,000' }
          }
        }
        return { isValid: true }

      case 'travel_radius_km':
        if (value !== null && value !== undefined) {
          if (value < 0) {
            return { isValid: false, error: 'Travel radius cannot be negative' }
          }
          if (value > 10000) {
            return { isValid: false, error: 'Travel radius cannot exceed 10,000 km' }
          }
        }
        return { isValid: true }

      case 'height_cm':
        if (value !== null && value !== undefined) {
          if (value < 50) {
            return { isValid: false, error: 'Height must be at least 50 cm' }
          }
          if (value > 300) {
            return { isValid: false, error: 'Height cannot exceed 300 cm' }
          }
        }
        return { isValid: true }

      case 'typical_turnaround_days':
        if (value !== null && value !== undefined) {
          if (value < 0) {
            return { isValid: false, error: 'Turnaround time cannot be negative' }
          }
          if (value > 365) {
            return { isValid: false, error: 'Turnaround time cannot exceed 365 days' }
          }
        }
        return { isValid: true }

      default:
        return { isValid: true }
    }
  }, [])

  const validateTag = useCallback(async (tag: string, type: ValidationType): Promise<ValidationResult> => {
    try {
      const result = await validateAndCheckTag(tag, type)
      return result
    } catch (error) {
      console.error('Tag validation error:', error)
      return { isValid: false, error: 'Failed to validate tag' }
    }
  }, [])

  const setFieldError = useCallback((field: string, error: string) => {
    setFieldErrors(prev => ({
      ...prev,
      [field]: error
    }))
  }, [])

  const clearFieldError = useCallback((field: string) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  return {
    validateField,
    validateTag,
    fieldErrors,
    setFieldError,
    clearFieldError
  }
}
