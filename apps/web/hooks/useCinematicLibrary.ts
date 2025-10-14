'use client';

import { useState, useCallback, useMemo } from 'react';
import { useApiQuery } from './useApiQuery';

export interface CinematicTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  base_prompt: string;
  cinematic_parameters: Record<string, any>;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  usage_count: number;
  is_public: boolean;
  created_by?: string;
  created_at: string;
}

export interface CustomDirector {
  id: number;
  value: string;
  label: string;
  description?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

export interface CustomSceneMood {
  id: number;
  value: string;
  label: string;
  description?: string;
  is_active: boolean;
  usage_count: number;
  created_at: string;
  updated_at: string;
  created_by?: string;
}

interface TemplatesResponse {
  success: boolean;
  templates: CinematicTemplate[];
}

interface DirectorsResponse {
  success: boolean;
  directors: CustomDirector[];
}

interface MoodsResponse {
  success: boolean;
  moods: CustomSceneMood[];
}

interface UseCinematicLibraryOptions {
  autoLoad?: boolean;
}

export function useCinematicLibrary(options: UseCinematicLibraryOptions = {}) {
  const { autoLoad = true } = options;

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');

  // Tab state
  const [activeTab, setActiveTab] = useState('templates');

  // Build query params for templates
  const templateParams = useMemo(() => {
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (selectedDifficulty !== 'all') params.append('difficulty', selectedDifficulty);
    if (searchQuery) params.append('search', searchQuery);
    return params.toString();
  }, [selectedCategory, selectedDifficulty, searchQuery]);

  // Build query params for directors and moods
  const searchParams = useMemo(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.append('search', searchQuery);
    return params.toString();
  }, [searchQuery]);

  // Load templates
  const {
    data: templatesData,
    loading: templatesLoading,
    refetch: refetchTemplates,
  } = useApiQuery<TemplatesResponse>({
    endpoint: `/api/cinematic-prompts?${templateParams}`,
    enabled: autoLoad,
    dependencies: [templateParams],
    onError: (err) => console.error('Error loading templates:', err),
  });

  // Load directors
  const {
    data: directorsData,
    loading: directorsLoading,
    refetch: refetchDirectors,
  } = useApiQuery<DirectorsResponse>({
    endpoint: `/api/custom-directors?${searchParams}`,
    enabled: autoLoad,
    dependencies: [searchParams],
    onError: (err) => console.error('Error loading directors:', err),
  });

  // Load moods
  const {
    data: moodsData,
    loading: moodsLoading,
    refetch: refetchMoods,
  } = useApiQuery<MoodsResponse>({
    endpoint: `/api/custom-moods?${searchParams}`,
    enabled: autoLoad,
    dependencies: [searchParams],
    onError: (err) => console.error('Error loading moods:', err),
  });

  const templates = templatesData?.templates || [];
  const directors = directorsData?.directors || [];
  const moods = moodsData?.moods || [];
  const loading = templatesLoading || directorsLoading || moodsLoading;

  // Load all data
  const loadAll = useCallback(() => {
    refetchTemplates();
    refetchDirectors();
    refetchMoods();
  }, [refetchTemplates, refetchDirectors, refetchMoods]);

  // Create template
  const createTemplate = useCallback(async (formData: any) => {
    try {
      const response = await fetch('/api/cinematic-prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        // Refetch templates to include the new one
        refetchTemplates();
        return { success: true, data: data.template };
      }
      return { success: false, error: data.error };
    } catch (error) {
      console.error('Error creating template:', error);
      return { success: false, error: 'Failed to create template' };
    }
  }, [refetchTemplates]);

  // Create director
  const createDirector = useCallback(async (formData: any) => {
    try {
      const response = await fetch('/api/custom-directors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        // Refetch directors to include the new one
        refetchDirectors();
        return { success: true, data: data.director };
      }
      return { success: false, error: data.error };
    } catch (error) {
      console.error('Error creating director:', error);
      return { success: false, error: 'Failed to create director' };
    }
  }, [refetchDirectors]);

  // Create mood
  const createMood = useCallback(async (formData: any) => {
    try {
      const response = await fetch('/api/custom-moods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        // Refetch moods to include the new one
        refetchMoods();
        return { success: true, data: data.mood };
      }
      return { success: false, error: data.error };
    } catch (error) {
      console.error('Error creating mood:', error);
      return { success: false, error: 'Failed to create mood' };
    }
  }, [refetchMoods]);

  return {
    // Data
    templates,
    directors,
    moods,
    loading,

    // Filter state
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    selectedDifficulty,
    setSelectedDifficulty,

    // Tab state
    activeTab,
    setActiveTab,

    // Actions
    loadTemplates: refetchTemplates,
    loadDirectors: refetchDirectors,
    loadMoods: refetchMoods,
    loadAll,
    createTemplate,
    createDirector,
    createMood,
  };
}
