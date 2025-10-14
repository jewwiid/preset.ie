'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';

/**
 * Validation rule function type
 * Returns error message string if validation fails, null if valid
 */
export type ValidationRule<T, K extends keyof T> = (
  value: T[K],
  formData: T
) => string | null;

/**
 * Validation rules object mapping field names to validation functions
 */
export type ValidationRules<T> = {
  [K in keyof T]?: ValidationRule<T, K>;
};

/**
 * Options for useFormManager hook
 */
export interface UseFormManagerOptions<T extends Record<string, any>> {
  /** Initial form data */
  initialData: T;
  /** Validation rules for each field */
  validationRules?: ValidationRules<T>;
  /** Optional submit handler */
  onSubmit?: (data: T) => Promise<any>;
  /** Called when validation or submission fails */
  onError?: (error: string) => void;
  /** Called when submission succeeds */
  onSuccess?: () => void;
  /** Reset form after successful submission (default: false) */
  resetOnSuccess?: boolean;
}

/**
 * Generic form management hook
 *
 * Provides type-safe form state management, validation, and submission handling.
 * Eliminates boilerplate for forms by consolidating common patterns.
 *
 * @example
 * // Simple form with validation
 * const form = useFormManager({
 *   initialData: { title: '', email: '' },
 *   validationRules: {
 *     title: (val) => !val.trim() ? 'Title is required' : null,
 *     email: (val) => !val.includes('@') ? 'Invalid email' : null,
 *   },
 * });
 *
 * @example
 * // Form with API submission
 * const form = useFormManager({
 *   initialData: { name: '', description: '' },
 *   onSubmit: async (data) => {
 *     const res = await fetch('/api/items', {
 *       method: 'POST',
 *       body: JSON.stringify(data)
 *     });
 *     return res.json();
 *   },
 *   onSuccess: () => showToast('Created!'),
 *   onError: (err) => showToast(err),
 *   resetOnSuccess: true,
 * });
 */
export function useFormManager<T extends Record<string, any>>({
  initialData,
  validationRules,
  onSubmit,
  onError,
  onSuccess,
  resetOnSuccess = false,
}: UseFormManagerOptions<T>) {
  const [formData, setFormData] = useState<T>(initialData);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Track if form data has changed from initial values
  useEffect(() => {
    const hasChanged = Object.keys(initialData).some(
      (key) => formData[key as keyof T] !== initialData[key as keyof T]
    );
    setIsDirty(hasChanged);
  }, [formData, initialData]);

  /**
   * Update a single form field
   */
  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      setIsDirty(true);

      // Clear error for this field when user starts typing
      if (errors[field]) {
        setErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [errors]
  );

  /**
   * Update multiple fields at once
   */
  const updateMultipleFields = useCallback((updates: Partial<T>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    setIsDirty(true);
  }, []);

  /**
   * Set a specific error for a field
   */
  const setFieldError = useCallback((field: keyof T, error: string | null) => {
    setErrors((prev) => {
      if (error === null) {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      }
      return { ...prev, [field]: error };
    });
  }, []);

  /**
   * Validate all fields based on validation rules
   * Returns true if valid, false if errors found
   */
  const validateForm = useCallback((): boolean => {
    if (!validationRules) return true;

    const newErrors: Partial<Record<keyof T, string>> = {};
    let isValid = true;

    Object.entries(validationRules).forEach(([field, rule]) => {
      const error = rule(formData[field as keyof T], formData);
      if (error) {
        newErrors[field as keyof T] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    if (!isValid && onError) {
      const firstError = Object.values(newErrors)[0] as string;
      onError(firstError);
    }

    return isValid;
  }, [formData, validationRules, onError]);

  /**
   * Validate a single field
   * Returns true if valid, false if error found
   */
  const validateField = useCallback(
    (field: keyof T): boolean => {
      if (!validationRules || !validationRules[field]) return true;

      const rule = validationRules[field]!;
      const error = rule(formData[field], formData);

      if (error) {
        setFieldError(field, error);
        return false;
      }

      setFieldError(field, null);
      return true;
    },
    [formData, validationRules, setFieldError]
  );

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData(initialData);
    setErrors({});
    setIsDirty(false);
    setLoading(false);
  }, [initialData]);

  /**
   * Cancel editing and reset to initial data
   */
  const cancelEditing = useCallback(() => {
    resetForm();
  }, [resetForm]);

  /**
   * Submit the form
   * Validates, calls onSubmit handler, handles errors
   * Returns the result from onSubmit, or null if validation failed
   */
  const submitForm = useCallback(async (): Promise<any | null> => {
    // Validate before submitting
    if (!validateForm()) {
      return null;
    }

    // If no submit handler provided, just return the form data
    if (!onSubmit) {
      return formData;
    }

    setLoading(true);

    try {
      const result = await onSubmit(formData);

      // Call success callback
      onSuccess?.();

      // Reset form if requested
      if (resetOnSuccess) {
        resetForm();
      }

      return result;
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : 'Submission failed';

      // Set general form error
      setErrors((prev) => ({ ...prev, _form: errorMsg } as any));

      // Call error callback
      onError?.(errorMsg);

      return null;
    } finally {
      setLoading(false);
    }
  }, [
    formData,
    validateForm,
    onSubmit,
    onSuccess,
    onError,
    resetForm,
    resetOnSuccess,
  ]);

  /**
   * Check if form has any errors
   */
  const hasErrors = useMemo(() => {
    return Object.keys(errors).length > 0;
  }, [errors]);

  /**
   * Get error for a specific field
   */
  const getFieldError = useCallback(
    (field: keyof T): string | undefined => {
      return errors[field];
    },
    [errors]
  );

  return {
    // Form data
    formData,

    // State flags
    errors,
    loading,
    isDirty,
    hasErrors,

    // Field operations
    updateField,
    updateMultipleFields,
    setFieldError,
    getFieldError,

    // Validation
    validateForm,
    validateField,

    // Form operations
    resetForm,
    cancelEditing,
    submitForm,
  };
}
