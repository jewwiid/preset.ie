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

        // Fetch preset images (user-generated content)
        const presetResponse = await fetch('/api/preset-images?limit=20');
        if (!presetResponse.ok) {
          throw new Error('Failed to fetch preset images');
        }
        const presetData = await presetResponse.json();
        setPresetImages(presetData || []);

        // Fetch platform images (official platform content)
        const platformResponse = await fetch('/api/platform-images?limit=10');
        if (!platformResponse.ok) {
          throw new Error('Failed to fetch platform images');
        }
        const platformData = await platformResponse.json();
        setPlatformImages(platformData || []);

        // Fetch talent profiles (models, actors, makeup artists, etc.)
        const talentResponse = await fetch('/api/talent-profiles?limit=8&role=TALENT');
        if (!talentResponse.ok) {
          throw new Error('Failed to fetch talent profiles');
        }
        const talentData = await talentResponse.json();
        setTalentProfiles(talentData || []);

        // Fetch contributor profiles (photographers, videographers, etc.)
        const contributorResponse = await fetch('/api/talent-profiles?limit=8&role=CONTRIBUTOR');
        if (!contributorResponse.ok) {
          throw new Error('Failed to fetch contributor profiles');
        }
        const contributorData = await contributorResponse.json();
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
    getHeroImage: () => platformImages.find(img => img.usage_context?.section === 'hero'),
    getTalentCategoryImages: () => presetImages.slice(0, 8), // Get first 8 for talent categories
    getFeaturedWorkImages: () => presetImages, // All images for featured work carousel
    getWhyPresetImage: () => platformImages.find(img => img.category === 'about') || platformImages[0],
    getTalentProfiles: () => talentProfiles, // Real talent profiles for hire (models, actors, etc.)
    getContributorProfiles: () => contributorProfiles, // Real contributor profiles (photographers, videographers, etc.)
  };
}
