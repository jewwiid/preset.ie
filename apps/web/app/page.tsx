'use client'

import { useAuth } from "../lib/auth-context";
import { useEffect, useState } from 'react';
import { useHomepageImages, usePreloadCriticalImages } from './hooks/usePlatformImages';
import { usePlatformGeneratedImages } from './hooks/usePlatformGeneratedImages';
import { createRoleCard, RoleCard } from '../lib/utils/role-slug-mapper';

import { LoadingSpinner } from '@/components/ui/loading-spinner';
// Import homepage section components
import HeroSection from './components/homepage/HeroSection';
import WhatYouCanDoSection from './components/homepage/WhatYouCanDoSection';
import ConnectingSection from './components/homepage/ConnectingSection';
import CreativeRolesSection from './components/homepage/CreativeRolesSection';
import TalentForHireSection from './components/homepage/TalentForHireSection';
import ContributorSection from './components/homepage/ContributorSection';
import FeaturedWorkSection from './components/homepage/FeaturedWorkSection';
import AboutSection from './components/homepage/AboutSection';
import CallToActionSection from './components/homepage/CallToActionSection';
import Footer from './components/homepage/Footer';

export default function Home() {
  const { user, loading } = useAuth();
  const [currentHeroImageIndex, setCurrentHeroImageIndex] = useState(0);
  const [randomizedRoles, setRandomizedRoles] = useState<RoleCard[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Check if user is logged in
  const isLoggedIn = !!user;

  // Preload critical images on app startup
  usePreloadCriticalImages();

  // Fetch homepage images with caching
  const { images: homepageImages } = useHomepageImages({
    preload: true
  });

  // Fetch platform-generated images
  const {
    presetImages,
    platformImages,
    talentProfiles,
    contributorProfiles,
    loading: platformImagesLoading,
    getTalentCategoryImages,
    getFeaturedWorkImages,
    getWhyPresetImage,
    getTalentProfiles,
    getContributorProfiles,
    getTalentForHireCoverImage,
    getCreativeRolesCoverImage,
    getContributorsCoverImage,
    getRoleImage
  } = usePlatformGeneratedImages();

  // Helper function for cycling hero images
  const getHeroImages = () => {
    // First, try to get from useHomepageImages hook (image_type='homepage')
    const heroImagesFromHomepage = Array.isArray(homepageImages)
      ? homepageImages.filter(img => img.image_type === 'homepage' && img.is_active)
      : [];

    if (heroImagesFromHomepage.length > 0) {
      return heroImagesFromHomepage.map(img => ({
        id: img.id,
        image_url: img.image_url,
        alt_text: img.alt_text || 'Hero image',
        title: img.title || 'Hero',
        attribution: `${img.title || 'CREATIVE'}\n${img.description || 'Preset Platform'}`
      }));
    }

    // Fallback: try category='hero' from platformImages
    const heroImagesFromDb = Array.isArray(platformImages)
      ? platformImages.filter(img => img.category === 'hero' && img.is_active)
      : [];

    if (heroImagesFromDb.length > 0) {
      return heroImagesFromDb.map(img => ({
        id: img.id,
        image_url: img.image_url,
        alt_text: img.alt_text || 'Hero image',
        title: img.title || 'Hero',
        attribution: `${img.title || 'CREATIVE'}\n${img.description || 'Preset Platform'}`
      }));
    }

    // Final fallback to default images if no admin images uploaded
    return [
      {
        id: 'femalemodelinforest',
        image_url: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/femalemodelinforest.jpg',
        alt_text: 'Female model in natural forest setting',
        title: 'Model in Forest',
        attribution: 'FASHION\nPhotographer, Preset Platform'
      },
      {
        id: 'portrait1',
        image_url: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg',
        alt_text: 'Professional portrait photography',
        title: 'Portrait Photography',
        attribution: 'PORTRAIT\nPhotographer, Preset Platform'
      },
      {
        id: 'photoshoot-bw',
        image_url: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/photoshoot-black-and-white.jpg',
        alt_text: 'Black and white portrait photoshoot',
        title: 'B&W Portrait',
        attribution: 'STUDIO\nPhotographer, Preset Platform'
      }
    ];
  };

  // Rotate hero images every 5 seconds
  useEffect(() => {
    const heroImages = getHeroImages();
    const interval = setInterval(() => {
      setCurrentHeroImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [homepageImages, platformImages]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initialize randomized creative roles from database
  useEffect(() => {
    const fetchRolesFromDatabase = async () => {
      setLoadingRoles(true);
      try {
        const response = await fetch('/api/predefined-data');
        if (!response.ok) {
          throw new Error('Failed to fetch roles');
        }

        const data = await response.json();
        
        // Combine contributor roles and talent categories
        const contributorRoleCards: RoleCard[] = (data.predefined_roles || []).map((role: any) => 
          createRoleCard(role, getRoleImage, 'contributor')
        );
        
        const talentRoleCards: RoleCard[] = (data.talent_categories || []).map((talent: any) => 
          createRoleCard(talent, getRoleImage, 'talent')
        );

        // Combine all roles
        const allRoles = [...contributorRoleCards, ...talentRoleCards];
        
        // Filter roles that have images uploaded, then shuffle and pick random 8
        const rolesWithImages = allRoles.filter(role => role.imageUrl);
        console.log('🔍 Database Roles - Total:', allRoles.length);
        console.log('🔍 Database Roles - With images:', rolesWithImages.length);
        
        // Always show roles from database (prioritize ones with images)
        if (rolesWithImages.length > 0) {
          const shuffled = [...rolesWithImages].sort(() => Math.random() - 0.5);
          setRandomizedRoles(shuffled.slice(0, Math.min(8, shuffled.length)));
        } else if (allRoles.length > 0) {
          // Show roles even without images (they'll be added as admins upload)
          const shuffled = [...allRoles].sort(() => Math.random() - 0.5);
          setRandomizedRoles(shuffled.slice(0, Math.min(8, shuffled.length)));
        } else {
          console.warn('No roles found in database');
          setRandomizedRoles([]);
        }
      } catch (error) {
        console.error('Error fetching roles from database:', error);
        // Don't use fallback - show error state instead
        setRandomizedRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRolesFromDatabase();
  }, [platformImagesLoading, platformImages]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-preset-200"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-preset-500 border-t-transparent absolute top-0"></div>
        </div>
      </div>
    );
  }

  const heroImages = getHeroImages();
  const whyPresetImage = getWhyPresetImage();
  const featuredImages = getFeaturedWorkImages();
  const talentForHireCover = getTalentForHireCoverImage();
  const creativeRolesCover = getCreativeRolesCoverImage();
  const contributorsCover = getContributorsCoverImage();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation is now handled by the global NavBar in layout.tsx */}

      <HeroSection
        currentImageIndex={currentHeroImageIndex}
        heroImages={heroImages}
        isLoggedIn={isLoggedIn}
      />

      <WhatYouCanDoSection isLoggedIn={isLoggedIn} />

      <ConnectingSection />

      <CreativeRolesSection
        randomizedRoles={randomizedRoles}
        coverImage={creativeRolesCover}
        getRoleImage={getRoleImage}
      />

      <TalentForHireSection
        talentProfiles={talentProfiles}
        platformImagesLoading={platformImagesLoading}
        coverImage={talentForHireCover}
        getTalentCategoryImages={getTalentCategoryImages}
      />

      <ContributorSection
        contributorProfiles={contributorProfiles}
        platformImagesLoading={platformImagesLoading}
        coverImage={contributorsCover}
        getTalentCategoryImages={getTalentCategoryImages}
      />

      <FeaturedWorkSection featuredImages={featuredImages} />

      <AboutSection whyPresetImage={whyPresetImage} />

      <CallToActionSection isLoggedIn={isLoggedIn} />

      <Footer />
    </div>
  );
}
