'use client'

import { useState, useEffect } from 'react';

interface PresetImage {
  id: string;
  result_image_url: string;
  video_url?: string;
  media_type?: 'image' | 'video';
  title: string;
  description: string;
  tags: string[];
  created_at: string;
  user_id: string;
  users_profile?: {
    display_name: string;
    handle: string;
    verified_id: boolean;
    verification_badges?: Array<{
      badge_type: 'verified_identity' | 'verified_professional' | 'verified_business'
      issued_at: string
      expires_at: string | null
      revoked_at: string | null
    }>
  };
}

interface PlatformImage {
  id: string;
  image_key: string;
  image_type: string;
  category?: string;
  image_url: string;
  thumbnail_url?: string;
  alt_text?: string;
  title?: string;
  description?: string;
  width: number;
  height: number;
  file_size: number;
  format: string;
  usage_context?: any;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

interface TalentProfile {
  id: string;
  user_id: string;
  display_name: string;
  handle: string;
  avatar_url: string;
  bio: string;
  city: string;
  country: string;
  role_flags: string[];
  style_tags: string[];
  vibe_tags: string[];
  professional_skills: string[];    // Services they provide
  years_experience: number;
  account_status: string;
  profile_completion_percentage: number;
  verified_id: boolean;
  created_at: string;
  verification_badges?: Array<{
    badge_type: 'verified_identity' | 'verified_professional' | 'verified_business'
    issued_at: string
    expires_at: string | null
    revoked_at: string | null
  }>
}

export function usePlatformGeneratedImages() {
  const [presetImages, setPresetImages] = useState<PresetImage[]>([]);
  const [platformImages, setPlatformImages] = useState<PlatformImage[]>([]);
  const [talentProfiles, setTalentProfiles] = useState<TalentProfile[]>([]);
  const [contributorProfiles, setContributorProfiles] = useState<TalentProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchImages() {
      try {
        setLoading(true);
        setError(null);

        // Make all API calls in parallel for better performance
        const [presetResponse, platformResponse, talentResponse, contributorResponse] = await Promise.allSettled([
          fetch('/api/preset-images?limit=20'),
          fetch('/api/platform-images?limit=100'), // Increased limit to fetch all role images
          fetch('/api/talent-profiles?limit=4&role=TALENT'),
          fetch('/api/talent-profiles?limit=4&role=CONTRIBUTOR')
        ]);

        // Process all responses first, before updating state
        let presetData: PresetImage[] = [];
        let platformData: PlatformImage[] = [];
        let talentData: TalentProfile[] = [];
        let contributorData: TalentProfile[] = [];

        // Handle preset images
        if (presetResponse.status === 'fulfilled' && presetResponse.value.ok) {
          presetData = await presetResponse.value.json();
        } else {
          console.warn('Failed to fetch preset images:', presetResponse.status === 'rejected' ? presetResponse.reason : 'HTTP error');
        }

        // Handle platform images
        if (platformResponse.status === 'fulfilled' && platformResponse.value.ok) {
          const response = await platformResponse.value.json();
          platformData = response.images || response || [];
          console.log('Platform images loaded:', platformData.length);
        } else {
          console.warn('Failed to fetch platform images:', platformResponse.status === 'rejected' ? platformResponse.reason : 'HTTP error');
        }

        // Handle talent profiles
        if (talentResponse.status === 'fulfilled' && talentResponse.value.ok) {
          talentData = await talentResponse.value.json();
          console.log('Talent profiles loaded:', talentData.length);
        } else {
          console.warn('Failed to fetch talent profiles:', talentResponse.status === 'rejected' ? talentResponse.reason : 'HTTP error');
        }

        // Handle contributor profiles
        if (contributorResponse.status === 'fulfilled' && contributorResponse.value.ok) {
          contributorData = await contributorResponse.value.json();
          console.log('Contributor profiles loaded:', contributorData.length);
        } else {
          console.warn('Failed to fetch contributor profiles:', contributorResponse.status === 'rejected' ? contributorResponse.reason : 'HTTP error');
        }

        // Batch all state updates together to prevent multiple re-renders
        // React 18 will automatically batch these, but being explicit helps
        setPresetImages(presetData || []);
        setPlatformImages(platformData || []);
        setTalentProfiles(talentData || []);
        setContributorProfiles(contributorData || []);

      } catch (err) {
        console.error('Error fetching platform images:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch images');

        // Fallback to empty arrays on error
        setPresetImages([]);
        setPlatformImages([]);
        setTalentProfiles([]);
        setContributorProfiles([]);
      } finally {
        setLoading(false);
      }
    }

    fetchImages();
  }, []);

  return {
    presetImages,
    platformImages,
    talentProfiles,
    contributorProfiles,
    loading,
    error,
    // Helper functions
    getHeroImage: () => Array.isArray(platformImages) ? platformImages.find(img => img.usage_context?.section === 'hero') : undefined,
    getTalentCategoryImages: () => Array.isArray(presetImages) ? presetImages.slice(0, 8) : [], // Get first 8 for talent categories
    getFeaturedWorkImages: () => Array.isArray(presetImages) ? presetImages : [], // All images for featured work carousel
    getWhyPresetImage: () => Array.isArray(platformImages) ? (platformImages.find(img => img.category === 'about') || platformImages[0]) : undefined,
    getTalentProfiles: () => Array.isArray(talentProfiles) ? talentProfiles : [], // Real talent profiles for hire (models, actors, etc.)
    getContributorProfiles: () => Array.isArray(contributorProfiles) ? contributorProfiles : [], // Real contributor profiles (photographers, videographers, etc.)
    // Section-specific cover images
    getTalentForHireCoverImage: () => Array.isArray(platformImages) ? platformImages.find(img => img.category === 'talent-for-hire') : undefined,
    getCreativeRolesCoverImage: () => Array.isArray(platformImages) ? platformImages.find(img => img.category === 'creative-roles') : undefined,
    getContributorsCoverImage: () => Array.isArray(platformImages) ? platformImages.find(img => img.category === 'contributors') : undefined,
    // Role-specific images for individual role cards
    getRoleImage: (roleSlug: string) => {
      if (!Array.isArray(platformImages)) return undefined;
      return platformImages.find(img => img.category === `role-${roleSlug}` && img.is_active);
    },
  };
}
