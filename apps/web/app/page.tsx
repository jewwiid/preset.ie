'use client'

import { useAuth } from "../lib/auth-context";
import { useEffect, useState } from 'react';
import { useHomepageImages, usePreloadCriticalImages } from './hooks/usePlatformImages';
import { usePlatformGeneratedImages } from './hooks/usePlatformGeneratedImages';

// Import homepage section components
import HeroSection from './components/homepage/HeroSection';
import WhatYouCanDoSection from './components/homepage/WhatYouCanDoSection';
import ConnectingSection from './components/homepage/ConnectingSection';
import CreativeRolesSection from './components/homepage/CreativeRolesSection';
import TalentForHireSection from './components/homepage/TalentForHireSection';
import ContributorSection from './components/homepage/ContributorSection';
import FeaturedWorkSection from './components/homepage/FeaturedWorkSection';
import AboutSection from './components/homepage/AboutSection';

export default function Home() {
  const { user, loading } = useAuth();
  const [currentHeroImageIndex, setCurrentHeroImageIndex] = useState(0);
  const [randomizedRoles, setRandomizedRoles] = useState<any[]>([]);

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
        attribution: img.description || 'Creative Professional\nPreset Platform'
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
        attribution: img.description || 'Creative Professional\nPreset Platform'
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

  // Initialize randomized creative roles once on mount
  useEffect(() => {
    // Separate talent and contributor profiles for correct role matching
    const talents = getTalentProfiles(); // For performance roles (actors, models, singers, etc.)
    const contributors = getContributorProfiles(); // For service providers (photographers, videographers, etc.)

    const allCreativeRoles = [
      {
        name: 'Freelancers',
        slug: 'freelancers',
        description: 'Independent creative professionals',
        imageUrl: contributors.find(t => t.professional_skills?.some(s => s.toLowerCase().includes('freelance')))?.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg'
      },
      {
        name: 'Photographers',
        slug: 'photographers',
        description: 'Portrait, fashion, and commercial photography',
        imageUrl: contributors.find(t => t.professional_skills?.some(s => s.includes('Photography')))?.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/femalemodelinforest.jpg'
      },
      {
        name: 'Videographers',
        slug: 'videographers',
        description: 'Wedding, commercial, and event videography',
        imageUrl: contributors.find(t => t.professional_skills?.some(s => s.includes('Videographer')))?.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/studio.jpg'
      },
      {
        name: 'Models',
        slug: 'models',
        description: 'Fashion, commercial, and editorial modeling',
        imageUrl: talents.find(t => t.performance_roles?.includes('Model'))?.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/photoshoot-black-and-white.jpg'
      },
      {
        name: 'Makeup Artists',
        slug: 'makeup-artists',
        description: 'Beauty, fashion, and special effects makeup',
        imageUrl: contributors.find(t => t.professional_skills?.some(s => s.toLowerCase().includes('makeup')))?.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg'
      },
      {
        name: 'Hair Stylists',
        slug: 'hair-stylists',
        description: 'Fashion, editorial, and commercial styling',
        imageUrl: contributors.find(t => t.professional_skills?.some(s => s.toLowerCase().includes('hair') || s.toLowerCase().includes('stylist')))?.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/femalemodelinforest.jpg'
      },
      {
        name: 'Directors',
        slug: 'directors',
        description: 'Film, commercial, and creative direction',
        imageUrl: contributors.find(t => t.professional_skills?.some(s => s.toLowerCase().includes('director')))?.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/studio.jpg'
      },
      {
        name: 'Producers',
        slug: 'producers',
        description: 'Film, commercial, and event production',
        imageUrl: contributors.find(t => t.professional_skills?.some(s => s.toLowerCase().includes('producer')))?.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/photoshoot-black-and-white.jpg'
      },
      {
        name: 'Creative Directors',
        slug: 'creative-directors',
        description: 'Vision and creative strategy leadership',
        imageUrl: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/studio.jpg'
      },
      {
        name: 'Brand Managers',
        slug: 'brand-managers',
        description: 'Brand strategy and marketing leadership',
        imageUrl: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg'
      },
      {
        name: 'Content Creators',
        slug: 'content-creators',
        description: 'Digital content and social media creators',
        imageUrl: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/femalemodelinforest.jpg'
      },
      {
        name: 'Art Directors',
        slug: 'art-directors',
        description: 'Visual design and art direction',
        imageUrl: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/photoshoot-black-and-white.jpg'
      },
      {
        name: 'Studios',
        slug: 'studios',
        description: 'Professional production studios',
        imageUrl: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/studio.jpg'
      },
      {
        name: 'Fashion Stylists',
        slug: 'fashion-stylists',
        description: 'Fashion styling and wardrobe',
        imageUrl: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/femalemodelinforest.jpg'
      },
      {
        name: 'Designers',
        slug: 'designers',
        description: 'Graphic and visual designers',
        imageUrl: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg'
      },
      {
        name: 'Editors',
        slug: 'editors',
        description: 'Video and photo editing professionals',
        imageUrl: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/studio.jpg'
      },
      {
        name: 'Writers',
        slug: 'writers',
        description: 'Content writers and copywriters',
        imageUrl: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg'
      },
      {
        name: 'Cinematographers',
        slug: 'cinematographers',
        description: 'Film and video cinematography',
        imageUrl: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/studio.jpg'
      },
      {
        name: 'Actors',
        slug: 'actors',
        description: 'Professional actors and performers',
        imageUrl: talents.find(t => t.performance_roles?.includes('Actor'))?.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/photoshoot-black-and-white.jpg'
      },
      {
        name: 'Musicians',
        slug: 'musicians',
        description: 'Music composers and performers',
        imageUrl: talents.find(t => t.performance_roles?.includes('Musician'))?.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg'
      }
    ];

    // Shuffle and pick random 8 roles once on mount
    const shuffled = [...allCreativeRoles].sort(() => Math.random() - 0.5);
    setRandomizedRoles(shuffled.slice(0, 8));
  }, [platformImagesLoading, talentProfiles, contributorProfiles]); // eslint-disable-line react-hooks/exhaustive-deps

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
    </div>
  );
}
