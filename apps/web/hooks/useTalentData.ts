'use client';

import { useState, useEffect } from 'react';

export interface ClothingSizeSystem {
  id: number;
  system_name: string;
  system_type: string;
  region: string;
  is_active: boolean;
  sort_order: number;
}

export interface ClothingSize {
  id: number;
  size_system_id: number;
  size_value: string;
  size_label: string;
  is_active: boolean;
  sort_order: number;
}

export interface ShoeSizeSystem {
  id: number;
  system_name: string;
  region: string;
  gender: string;
  is_active: boolean;
  sort_order: number;
}

export interface ShoeSize {
  id: number;
  size_system_id: number;
  size_value: string;
  size_label?: string;
  is_active: boolean;
  sort_order: number;
}

/**
 * Hook for fetching predefined talent-related data
 * Includes: talent categories, eye/hair colors, clothing/shoe size systems
 */
export function useTalentData() {
  const [predefinedTalentCategories, setPredefinedTalentCategories] = useState<string[]>([]);
  const [predefinedEyeColors, setPredefinedEyeColors] = useState<string[]>([]);
  const [predefinedHairColors, setPredefinedHairColors] = useState<string[]>([]);
  const [clothingSizeSystems, setClothingSizeSystems] = useState<ClothingSizeSystem[]>([]);
  const [clothingSizes, setClothingSizes] = useState<ClothingSize[]>([]);
  const [shoeSizeSystems, setShoeSizeSystems] = useState<ShoeSizeSystem[]>([]);
  const [shoeSizes, setShoeSizes] = useState<ShoeSize[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchPredefinedOptions = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/predefined-data');

        if (!response.ok) {
          throw new Error('Failed to fetch predefined data');
        }

        const data = await response.json();

        // Extract the data we need
        setPredefinedTalentCategories(
          data.talent_categories?.map((r: any) => r.category_name) ||
          data.performance_roles?.map((r: any) => r.category_name) ||
          []
        );
        setPredefinedEyeColors(data.eye_colors?.map((c: any) => c.color_name) || []);
        setPredefinedHairColors(data.hair_colors?.map((c: any) => c.color_name) || []);

        // Update clothing and shoe size data
        setClothingSizeSystems(data.clothing_size_systems || []);
        setClothingSizes(data.clothing_sizes || []);
        setShoeSizeSystems(data.shoe_size_systems || []);
        setShoeSizes(data.shoe_sizes || []);
      } catch (error) {
        console.error('Error fetching predefined options:', error);
        // Fallback to hardcoded values
        setPredefinedTalentCategories([
          'Model',
          'Actor',
          'Dancer',
          'Musician',
          'Artist',
          'Influencer',
          'Athlete',
          'Presenter',
          'Voice Actor',
          'Extra',
          'Stunt Performer',
        ]);
        setPredefinedEyeColors(['Brown', 'Blue', 'Green', 'Hazel', 'Gray', 'Amber', 'Violet']);
        setPredefinedHairColors([
          'Black',
          'Brown',
          'Blonde',
          'Red',
          'Gray',
          'White',
          'Auburn',
          'Chestnut',
          'Strawberry Blonde',
          'Platinum',
          'Silver',
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchPredefinedOptions();
  }, []);

  return {
    predefinedTalentCategories,
    predefinedEyeColors,
    predefinedHairColors,
    clothingSizeSystems,
    clothingSizes,
    shoeSizeSystems,
    shoeSizes,
    loading,
  };
}
