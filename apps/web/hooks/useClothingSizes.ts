'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface UserClothingSize {
  id: string;
  profile_id: string;
  clothing_type: string;
  size_system_id: string;
  size_value: string;
  notes?: string;
}

export interface UserMeasurement {
  id: string;
  profile_id: string;
  measurement_type: string;
  measurement_value: number;
  unit: string;
  notes?: string;
}

interface UseClothingSizesOptions {
  profileId?: string;
  userId?: string;
}

/**
 * Hook for managing user clothing sizes and measurements
 */
export function useClothingSizes({ profileId, userId }: UseClothingSizesOptions = {}) {
  const [userClothingSizes, setUserClothingSizes] = useState<UserClothingSize[]>([]);
  const [userMeasurements, setUserMeasurements] = useState<UserMeasurement[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user's existing clothing sizes and measurements
  const fetchUserData = useCallback(async () => {
    if (!supabase || !userId || !profileId) return;

    setLoading(true);
    try {
      // Fetch user's existing clothing sizes
      const { data: userClothingData, error: userClothingError } = await (supabase as any)
        .from('user_clothing_sizes')
        .select('*')
        .eq('profile_id', profileId);

      if (!userClothingError && userClothingData) {
        setUserClothingSizes(userClothingData as any);
      }

      // Fetch user's existing measurements
      const { data: userMeasurementData, error: userMeasurementError } = await (supabase as any)
        .from('user_measurements')
        .select('*')
        .eq('profile_id', profileId);

      if (!userMeasurementError && userMeasurementData) {
        setUserMeasurements(userMeasurementData as any);
      }
    } catch (error) {
      console.error('Error fetching user clothing data:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, profileId]);

  // Add clothing size
  const addClothingSize = useCallback(
    async (clothingType: string, sizeSystemId: string, sizeValue: string, notes?: string) => {
      if (!supabase || !profileId) return { success: false };

      try {
        const { data, error } = await (supabase as any).from('user_clothing_sizes').insert([
          {
            profile_id: profileId,
            clothing_type: clothingType,
            size_system_id: sizeSystemId,
            size_value: sizeValue,
            notes: notes || null,
          },
        ]).select();

        if (error) throw error;

        if (data && data.length > 0) {
          setUserClothingSizes((prev) => [...prev, data[0]]);
          return { success: true };
        }
        return { success: false };
      } catch (error) {
        console.error('Error adding clothing size:', error);
        return { success: false, error };
      }
    },
    [profileId]
  );

  // Delete clothing size
  const deleteClothingSize = useCallback(
    async (sizeId: string) => {
      if (!supabase) return { success: false };

      try {
        const { error } = await (supabase as any)
          .from('user_clothing_sizes')
          .delete()
          .eq('id', sizeId);

        if (error) throw error;

        setUserClothingSizes((prev) => prev.filter((size) => size.id !== sizeId));
        return { success: true };
      } catch (error) {
        console.error('Error deleting clothing size:', error);
        return { success: false, error };
      }
    },
    []
  );

  // Add measurement
  const addMeasurement = useCallback(
    async (
      measurementType: string,
      measurementValue: number,
      unit: string,
      notes?: string
    ) => {
      if (!supabase || !profileId) return { success: false };

      try {
        const { data, error } = await (supabase as any).from('user_measurements').insert([
          {
            profile_id: profileId,
            measurement_type: measurementType,
            measurement_value: measurementValue,
            unit,
            notes: notes || null,
          },
        ]).select();

        if (error) throw error;

        if (data && data.length > 0) {
          setUserMeasurements((prev) => [...prev, data[0]]);
          return { success: true };
        }
        return { success: false };
      } catch (error) {
        console.error('Error adding measurement:', error);
        return { success: false, error };
      }
    },
    [profileId]
  );

  // Delete measurement
  const deleteMeasurement = useCallback(
    async (measurementId: string) => {
      if (!supabase) return { success: false };

      try {
        const { error } = await (supabase as any)
          .from('user_measurements')
          .delete()
          .eq('id', measurementId);

        if (error) throw error;

        setUserMeasurements((prev) => prev.filter((m) => m.id !== measurementId));
        return { success: true };
      } catch (error) {
        console.error('Error deleting measurement:', error);
        return { success: false, error };
      }
    },
    []
  );

  // Auto-fetch on mount
  useEffect(() => {
    if (profileId && userId) {
      fetchUserData();
    }
  }, [profileId, userId, fetchUserData]);

  return {
    userClothingSizes,
    userMeasurements,
    loading,
    fetchUserData,
    addClothingSize,
    deleteClothingSize,
    addMeasurement,
    deleteMeasurement,
  };
}
