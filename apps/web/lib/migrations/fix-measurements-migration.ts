/**
 * Migration script to fix measurements and clean up profile data
 * This script handles the migration from legacy measurements field to modern user_measurements table
 */

import { supabase } from '../supabase';

interface ProfileMeasurement {
  id: string;
  profile_id: string;
  measurement_type: string;
  measurement_value: number;
  unit: string;
  notes?: string;
}

interface UserProfile {
  id: string;
  user_id: string;
  display_name: string;
  handle: string;
  height_cm?: number;
  measurements?: string;
}

export class MeasurementsMigration {
  private supabase = supabase;

  /**
   * Main migration function
   */
  async migrate(): Promise<{ success: boolean; message: string; migratedCount: number }> {
    try {
      console.log('Starting measurements migration...');

      // Step 1: Get all profiles with measurements
      const profiles = await this.getProfilesWithMeasurements();
      console.log(`Found ${profiles.length} profiles with measurements`);

      let migratedCount = 0;

      // Step 2: Process each profile
      for (const profile of profiles) {
        const success = await this.migrateProfile(profile);
        if (success) {
          migratedCount++;
        }
      }

      // Step 3: Clean up legacy measurements field
      await this.cleanupLegacyMeasurements();

      return {
        success: true,
        message: `Successfully migrated ${migratedCount} profiles`,
        migratedCount
      };

    } catch (error) {
      console.error('Migration failed:', error);
      return {
        success: false,
        message: `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        migratedCount: 0
      };
    }
  }

  /**
   * Get all profiles that have measurements data
   */
  private async getProfilesWithMeasurements(): Promise<UserProfile[]> {
    const { data, error } = await this.supabase
      .from('users_profile')
      .select('id, user_id, display_name, handle, height_cm, measurements')
      .not('measurements', 'is', null)
      .neq('measurements', '');

    if (error) {
      throw new Error(`Failed to fetch profiles: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Migrate a single profile's measurements
   */
  private async migrateProfile(profile: UserProfile): Promise<boolean> {
    try {
      // Extract measurements from the legacy field
      const measurements = this.extractMeasurements(profile.measurements || '');
      
      if (measurements.length === 0) {
        return false;
      }

      // Insert measurements into user_measurements table
      const measurementInserts = measurements.map(measurement => ({
        profile_id: profile.id,
        measurement_type: measurement.type,
        measurement_value: measurement.value,
        unit: measurement.unit,
        notes: measurement.notes
      }));

      const { error } = await this.supabase
        .from('user_measurements')
        .upsert(measurementInserts, {
          onConflict: 'profile_id,measurement_type'
        });

      if (error) {
        console.error(`Failed to migrate measurements for profile ${profile.id}:`, error);
        return false;
      }

      // Update height_cm if we extracted height
      const heightMeasurement = measurements.find(m => m.type === 'height');
      if (heightMeasurement && !profile.height_cm) {
        const { error: heightError } = await this.supabase
          .from('users_profile')
          .update({ height_cm: heightMeasurement.value })
          .eq('id', profile.id);

        if (heightError) {
          console.error(`Failed to update height_cm for profile ${profile.id}:`, heightError);
        }
      }

      return true;

    } catch (error) {
      console.error(`Failed to migrate profile ${profile.id}:`, error);
      return false;
    }
  }

  /**
   * Extract measurements from the legacy measurements string
   */
  private extractMeasurements(measurementsString: string): Array<{
    type: string;
    value: number;
    unit: string;
    notes?: string;
  }> {
    const measurements: Array<{
      type: string;
      value: number;
      unit: string;
      notes?: string;
    }> = [];

    if (!measurementsString || measurementsString.trim() === '') {
      return measurements;
    }

    // Split by comma and process each measurement
    const parts = measurementsString.split(',').map(part => part.trim());
    
    for (const part of parts) {
      // Skip empty parts
      if (!part) continue;

      // Extract height measurements (most common case)
      const heightMatch = part.match(/Height:\s*(\d+(?:\.\d+)?)\s*(cm|in)/i);
      if (heightMatch) {
        measurements.push({
          type: 'height',
          value: parseFloat(heightMatch[1]),
          unit: heightMatch[2].toLowerCase()
        });
        continue;
      }

      // Extract other measurements
      const measurementMatch = part.match(/(\w+):\s*(\d+(?:\.\d+)?)\s*(cm|in)/i);
      if (measurementMatch) {
        measurements.push({
          type: measurementMatch[1].toLowerCase(),
          value: parseFloat(measurementMatch[2]),
          unit: measurementMatch[3].toLowerCase()
        });
      }
    }

    // Remove duplicates (keep only the first occurrence of each type)
    const uniqueMeasurements = measurements.filter((measurement, index, array) => 
      array.findIndex(m => m.type === measurement.type) === index
    );

    return uniqueMeasurements;
  }

  /**
   * Clean up the legacy measurements field
   */
  private async cleanupLegacyMeasurements(): Promise<void> {
    const { error } = await this.supabase
      .from('users_profile')
      .update({ measurements: null })
      .not('measurements', 'is', null);

    if (error) {
      console.error('Failed to cleanup legacy measurements:', error);
    }
  }

  /**
   * Verify migration results
   */
  async verifyMigration(): Promise<{
    profilesWithMeasurements: number;
    userMeasurementsCount: number;
    profilesWithLegacyMeasurements: number;
  }> {
    // Count profiles with measurements
    const { count: profilesWithMeasurements } = await this.supabase
      .from('users_profile')
      .select('*', { count: 'exact', head: true })
      .not('height_cm', 'is', null);

    // Count user_measurements records
    const { count: userMeasurementsCount } = await this.supabase
      .from('user_measurements')
      .select('*', { count: 'exact', head: true });

    // Count profiles with legacy measurements
    const { count: profilesWithLegacyMeasurements } = await this.supabase
      .from('users_profile')
      .select('*', { count: 'exact', head: true })
      .not('measurements', 'is', null);

    return {
      profilesWithMeasurements: profilesWithMeasurements || 0,
      userMeasurementsCount: userMeasurementsCount || 0,
      profilesWithLegacyMeasurements: profilesWithLegacyMeasurements || 0
    };
  }

  /**
   * Rollback migration (if needed)
   */
  async rollback(): Promise<{ success: boolean; message: string }> {
    try {
      // Delete all user_measurements records
      const { error } = await this.supabase
        .from('user_measurements')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (error) {
        throw new Error(`Failed to rollback user_measurements: ${error.message}`);
      }

      return {
        success: true,
        message: 'Migration rolled back successfully'
      };

    } catch (error) {
      return {
        success: false,
        message: `Rollback failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export a singleton instance
export const measurementsMigration = new MeasurementsMigration();

// Export the class for testing
export default MeasurementsMigration;
