/**
 * Utility functions for validating and managing measurements
 * Prevents duplicate measurements and ensures data consistency
 */

export interface Measurement {
  id?: string;
  measurement_type: string;
  measurement_value: number;
  unit: string;
  notes?: string;
}

export interface MeasurementValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

/**
 * Validates a single measurement
 */
export function validateMeasurement(measurement: Measurement): MeasurementValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  if (!measurement.measurement_type || measurement.measurement_type.trim() === '') {
    errors.push('Measurement type is required');
  }

  if (!measurement.measurement_value || measurement.measurement_value <= 0) {
    errors.push('Measurement value must be greater than 0');
  }

  if (!measurement.unit || !['cm', 'in'].includes(measurement.unit.toLowerCase())) {
    errors.push('Unit must be either "cm" or "in"');
  }

  // Check for reasonable values
  if (measurement.measurement_type.toLowerCase() === 'height') {
    if (measurement.unit.toLowerCase() === 'cm') {
      if (measurement.measurement_value < 100 || measurement.measurement_value > 250) {
        warnings.push('Height seems unusual. Please verify the value.');
      }
    } else if (measurement.unit.toLowerCase() === 'in') {
      if (measurement.measurement_value < 39 || measurement.measurement_value > 98) {
        warnings.push('Height seems unusual. Please verify the value.');
      }
    }
  }

  // Check for other measurement types
  const measurementType = measurement.measurement_type.toLowerCase();
  if (['chest', 'waist', 'hips', 'inseam', 'shoulder', 'sleeve', 'neck'].includes(measurementType)) {
    if (measurement.unit.toLowerCase() === 'cm') {
      if (measurement.measurement_value < 30 || measurement.measurement_value > 200) {
        warnings.push(`${measurementType} measurement seems unusual. Please verify the value.`);
      }
    } else if (measurement.unit.toLowerCase() === 'in') {
      if (measurement.measurement_value < 12 || measurement.measurement_value > 79) {
        warnings.push(`${measurementType} measurement seems unusual. Please verify the value.`);
      }
    }
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join(', ') : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Validates a list of measurements and checks for duplicates
 */
export function validateMeasurementsList(measurements: Measurement[]): MeasurementValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for duplicates
  const seenTypes = new Set<string>();
  const duplicates: string[] = [];

  for (const measurement of measurements) {
    const type = measurement.measurement_type.toLowerCase();
    if (seenTypes.has(type)) {
      duplicates.push(type);
    } else {
      seenTypes.add(type);
    }

    // Validate individual measurement
    const validation = validateMeasurement(measurement);
    if (!validation.isValid) {
      errors.push(`${measurement.measurement_type}: ${validation.error}`);
    }
    if (validation.warnings) {
      warnings.push(...validation.warnings.map(w => `${measurement.measurement_type}: ${w}`));
    }
  }

  if (duplicates.length > 0) {
    errors.push(`Duplicate measurement types found: ${duplicates.join(', ')}`);
  }

  return {
    isValid: errors.length === 0,
    error: errors.length > 0 ? errors.join('; ') : undefined,
    warnings: warnings.length > 0 ? warnings : undefined
  };
}

/**
 * Converts measurements between units
 */
export function convertMeasurement(value: number, fromUnit: string, toUnit: string): number {
  if (fromUnit === toUnit) return value;

  // Convert to cm first
  let valueInCm: number;
  if (fromUnit.toLowerCase() === 'in') {
    valueInCm = value * 2.54;
  } else {
    valueInCm = value;
  }

  // Convert to target unit
  if (toUnit.toLowerCase() === 'in') {
    return Math.round(valueInCm / 2.54 * 100) / 100; // Round to 2 decimal places
  } else {
    return Math.round(valueInCm * 100) / 100; // Round to 2 decimal places
  }
}

/**
 * Formats a measurement for display
 */
export function formatMeasurement(measurement: Measurement): string {
  let formatted = `${measurement.measurement_value} ${measurement.unit}`;
  if (measurement.notes) {
    formatted += ` (${measurement.notes})`;
  }
  return formatted;
}

/**
 * Sorts measurements by type for consistent display
 */
export function sortMeasurementsByType(measurements: Measurement[]): Measurement[] {
  const typeOrder = ['height', 'chest', 'waist', 'hips', 'inseam', 'shoulder', 'sleeve', 'neck'];
  
  return measurements.sort((a, b) => {
    const aIndex = typeOrder.indexOf(a.measurement_type.toLowerCase());
    const bIndex = typeOrder.indexOf(b.measurement_type.toLowerCase());
    
    // If both types are in the predefined order, sort by that order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // If only one is in the predefined order, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // Otherwise, sort alphabetically
    return a.measurement_type.localeCompare(b.measurement_type);
  });
}

/**
 * Cleans and normalizes measurement data
 */
export function cleanMeasurementData(measurement: Partial<Measurement>): Measurement {
  return {
    measurement_type: measurement.measurement_type?.trim().toLowerCase() || '',
    measurement_value: typeof measurement.measurement_value === 'number' ? measurement.measurement_value : 0,
    unit: measurement.unit?.toLowerCase() || 'cm',
    notes: measurement.notes?.trim() || undefined
  };
}

/**
 * Checks if two measurements are equivalent (same type and similar value)
 */
export function areMeasurementsEquivalent(
  measurement1: Measurement, 
  measurement2: Measurement, 
  tolerance: number = 0.1
): boolean {
  if (measurement1.measurement_type.toLowerCase() !== measurement2.measurement_type.toLowerCase()) {
    return false;
  }

  // Convert both to the same unit for comparison
  const unit1 = measurement1.unit.toLowerCase();
  const unit2 = measurement2.unit.toLowerCase();
  
  let value1 = measurement1.measurement_value;
  let value2 = measurement2.measurement_value;
  
  if (unit1 !== unit2) {
    // Convert to cm for comparison
    if (unit1 === 'in') value1 = convertMeasurement(value1, 'in', 'cm');
    if (unit2 === 'in') value2 = convertMeasurement(value2, 'in', 'cm');
  }
  
  return Math.abs(value1 - value2) <= tolerance;
}

/**
 * Removes duplicate measurements from a list
 */
export function removeDuplicateMeasurements(measurements: Measurement[]): Measurement[] {
  const seen = new Map<string, Measurement>();
  
  for (const measurement of measurements) {
    const key = measurement.measurement_type.toLowerCase();
    const existing = seen.get(key);
    
    if (!existing || measurement.measurement_value > existing.measurement_value) {
      // Keep the measurement with the higher value (more recent)
      seen.set(key, measurement);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Validates measurement type against allowed values
 */
export function isValidMeasurementType(type: string): boolean {
  const validTypes = [
    'height', 'chest', 'waist', 'hips', 'inseam', 
    'shoulder', 'sleeve', 'neck', 'bust', 'underbust'
  ];
  
  return validTypes.includes(type.toLowerCase());
}

/**
 * Gets display name for measurement type
 */
export function getMeasurementTypeDisplayName(type: string): string {
  const displayNames: Record<string, string> = {
    height: 'Height',
    chest: 'Chest',
    waist: 'Waist',
    hips: 'Hips',
    inseam: 'Inseam',
    shoulder: 'Shoulder',
    sleeve: 'Sleeve',
    neck: 'Neck',
    bust: 'Bust',
    underbust: 'Underbust'
  };
  
  return displayNames[type.toLowerCase()] || type;
}

export default {
  validateMeasurement,
  validateMeasurementsList,
  convertMeasurement,
  formatMeasurement,
  sortMeasurementsByType,
  cleanMeasurementData,
  areMeasurementsEquivalent,
  removeDuplicateMeasurements,
  isValidMeasurementType,
  getMeasurementTypeDisplayName
};
