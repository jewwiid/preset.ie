'use client'

import { useState, useEffect } from 'react';
import { parseVerificationBadges } from '../../lib/utils/verification-badges'

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
  image_url: string;
  alt_text: string;
  title: string;
  category: string;
  usage_context?: {
    section?: string;
  };
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
  specializations: string[];
  talent_categories: string[];
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
          fetch('/api/platform-images?limit=10'),
          fetch('/api/talent-profiles?limit=8&role=TALENT'),
          fetch('/api/talent-profiles?limit=8&role=CONTRIBUTOR')
        ]);

        // Handle preset images
        if (presetResponse.status === 'fulfilled' && presetResponse.value.ok) {
          const presetData = await presetResponse.value.json();
          setPresetImages(presetData || []);
        } else {
          console.warn('Failed to fetch preset images:', presetResponse.status === 'rejected' ? presetResponse.reason : 'HTTP error');
          setPresetImages([]);
        }

        // Handle platform images
        if (platformResponse.status === 'fulfilled' && platformResponse.value.ok) {
          const platformData = await platformResponse.value.json();
          setPlatformImages(platformData || []);
        } else {
          console.warn('Failed to fetch platform images:', platformResponse.status === 'rejected' ? platformResponse.reason : 'HTTP error');
          setPlatformImages([]);
        }

        // Handle talent profiles
        if (talentResponse.status === 'fulfilled' && talentResponse.value.ok) {
          const talentData = await talentResponse.value.json();
          setTalentProfiles(talentData || []);
        } else {
          console.warn('Failed to fetch talent profiles:', talentResponse.status === 'rejected' ? talentResponse.reason : 'HTTP error');
          setTalentProfiles([]);
        }

        // Handle contributor profiles
        if (contributorResponse.status === 'fulfilled' && contributorResponse.value.ok) {
          const contributorData = await contributorResponse.value.json();
          setContributorProfiles(contributorData || []);
        } else {
          console.warn('Failed to fetch contributor profiles:', contributorResponse.status === 'rejected' ? contributorResponse.reason : 'HTTP error');
          setContributorProfiles([]);
        }

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
    getHeroImage: () => platformImages.find(img => img.usage_context?.section === 'hero'),
    getTalentCategoryImages: () => presetImages.slice(0, 8), // Get first 8 for talent categories
    getFeaturedWorkImages: () => presetImages, // All images for featured work carousel
    getWhyPresetImage: () => platformImages.find(img => img.category === 'about') || platformImages[0],
    getTalentProfiles: () => talentProfiles, // Real talent profiles for hire (models, actors, etc.)
    getContributorProfiles: () => contributorProfiles, // Real contributor profiles (photographers, videographers, etc.)
  };
}
