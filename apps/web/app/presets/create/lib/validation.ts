/**
 * Preset Create Module - Validation Logic
 *
 * Form validation functions for preset creation.
 */

import type { PresetData, ValidationErrors } from '../types';

/**
 * Validate preset data
 */
export function validatePresetData(data: PresetData): ValidationErrors {
  const errors: ValidationErrors = {};

  // Basic Info Validation
  if (!data.name || data.name.trim() === '') {
    errors.name = 'Preset name is required';
  } else if (data.name.length < 3) {
    errors.name = 'Preset name must be at least 3 characters';
  } else if (data.name.length > 100) {
    errors.name = 'Preset name must be less than 100 characters';
  }

  if (!data.description || data.description.trim() === '') {
    errors.description = 'Description is required';
  } else if (data.description.length < 10) {
    errors.description = 'Description must be at least 10 characters';
  }

  if (!data.category) {
    errors.category = 'Category is required';
  }

  // Prompt Validation
  if (!data.prompt_template || data.prompt_template.trim() === '') {
    errors.prompt_template = 'Prompt template is required';
  }

  // Marketplace Validation (if for sale)
  if (data.is_for_sale) {
    if (!data.marketplace_title || data.marketplace_title.trim() === '') {
      errors.marketplace_title = 'Marketplace title is required for sale items';
    }

    if (data.sale_price <= 0) {
      errors.sale_price = 'Sale price must be greater than 0';
    }
  }

  return errors;
}

/**
 * Check if preset data is valid
 */
export function isValidPresetData(data: PresetData): boolean {
  const errors = validatePresetData(data);
  return Object.keys(errors).length === 0;
}

/**
 * Validate marketplace data specifically
 */
export function validateMarketplaceData(data: PresetData): ValidationErrors {
  const errors: ValidationErrors = {};

  if (data.is_for_sale) {
    if (!data.marketplace_title || data.marketplace_title.trim() === '') {
      errors.marketplace_title = 'Marketplace title is required';
    }

    if (data.sale_price <= 0) {
      errors.sale_price = 'Price must be greater than 0';
    } else if (data.sale_price > 1000) {
      errors.sale_price = 'Price must be less than 1000';
    }

    if (data.marketplace_tags.length === 0) {
      errors.marketplace_title = 'At least one tag is required';
    }
  }

  return errors;
}
