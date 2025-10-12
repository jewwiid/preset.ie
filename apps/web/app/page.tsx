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
import CallToActionSection from './components/homepage/CallToActionSection';
import Footer from './components/homepage/Footer';

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
        imageUrl: getRoleImage('freelancers')?.image_url
      },
      {
        name: 'Photographers',
        slug: 'photographers',
        description: 'Portrait, fashion, and commercial photography',
        imageUrl: getRoleImage('photographers')?.image_url
      },
      {
        name: 'Videographers',
        slug: 'videographers',
        description: 'Wedding, commercial, and event videography',
        imageUrl: getRoleImage('videographers')?.image_url
      },
      {
        name: 'Models',
        slug: 'models',
        description: 'Fashion, commercial, and editorial modeling',
        imageUrl: getRoleImage('models')?.image_url
      },
      {
        name: 'Makeup Artists',
        slug: 'makeup-artists',
        description: 'Beauty, fashion, and special effects makeup',
        imageUrl: getRoleImage('makeup-artists')?.image_url
      },
      {
        name: 'Hair Stylists',
        slug: 'hair-stylists',
        description: 'Fashion, editorial, and commercial styling',
        imageUrl: getRoleImage('hair-stylists')?.image_url
      },
      {
        name: 'Directors',
        slug: 'directors',
        description: 'Film, commercial, and creative direction',
        imageUrl: getRoleImage('directors')?.image_url
      },
      {
        name: 'Producers',
        slug: 'producers',
        description: 'Film, commercial, and event production',
        imageUrl: getRoleImage('producers')?.image_url
      },
      {
        name: 'Creative Directors',
        slug: 'creative-directors',
        description: 'Vision and creative strategy leadership',
        imageUrl: getRoleImage('creative-directors')?.image_url
      },
      {
        name: 'Brand Managers',
        slug: 'brand-managers',
        description: 'Brand strategy and marketing leadership',
        imageUrl: getRoleImage('brand-managers')?.image_url
      },
      {
        name: 'Content Creators',
        slug: 'content-creators',
        description: 'Digital content and social media creators',
        imageUrl: getRoleImage('content-creators')?.image_url
      },
      {
        name: 'Art Directors',
        slug: 'art-directors',
        description: 'Visual design and art direction',
        imageUrl: getRoleImage('art-directors')?.image_url
      },
      {
        name: 'Studios',
        slug: 'studios',
        description: 'Professional production studios',
        imageUrl: getRoleImage('studios')?.image_url
      },
      {
        name: 'Fashion Stylists',
        slug: 'fashion-stylists',
        description: 'Fashion styling and wardrobe',
        imageUrl: getRoleImage('fashion-stylists')?.image_url
      },
      {
        name: 'Designers',
        slug: 'designers',
        description: 'Graphic and visual designers',
        imageUrl: getRoleImage('designers')?.image_url
      },
      {
        name: 'Editors',
        slug: 'editors',
        description: 'Video and photo editing professionals',
        imageUrl: getRoleImage('editors')?.image_url
      },
      {
        name: 'Writers',
        slug: 'writers',
        description: 'Content writers and copywriters',
        imageUrl: getRoleImage('writers')?.image_url
      },
      {
        name: 'Cinematographers',
        slug: 'cinematographers',
        description: 'Film and video cinematography',
        imageUrl: getRoleImage('cinematographers')?.image_url
      },
      {
        name: 'Actors',
        slug: 'actors',
        description: 'Professional actors and performers',
        imageUrl: getRoleImage('actors')?.image_url
      },
      {
        name: 'Musicians',
        slug: 'musicians',
        description: 'Music composers and performers',
        imageUrl: getRoleImage('musicians')?.image_url
      },
      {
        name: 'Singers',
        slug: 'singers',
        description: 'Vocal performers and artists',
        imageUrl: getRoleImage('singers')?.image_url
      },
      {
        name: 'Dancers',
        slug: 'dancers',
        description: 'Dance performers and choreographers',
        imageUrl: getRoleImage('dancers')?.image_url
      },
      {
        name: 'Actresses',
        slug: 'actresses',
        description: 'Female actors and performers',
        imageUrl: getRoleImage('actresses')?.image_url
      },
      {
        name: 'Hand Models',
        slug: 'hand-models',
        description: 'Specialized hand modeling',
        imageUrl: getRoleImage('hand-models')?.image_url
      },
      {
        name: 'Fitness Models',
        slug: 'fitness-models',
        description: 'Fitness and athletic modeling',
        imageUrl: getRoleImage('fitness-models')?.image_url
      },
      {
        name: 'Commercial Models',
        slug: 'commercial-models',
        description: 'Commercial and advertising modeling',
        imageUrl: getRoleImage('commercial-models')?.image_url
      },
      {
        name: 'Fashion Models',
        slug: 'fashion-models',
        description: 'Runway and fashion modeling',
        imageUrl: getRoleImage('fashion-models')?.image_url
      },
      {
        name: 'Plus-Size Models',
        slug: 'plus-size-models',
        description: 'Plus-size fashion and commercial modeling',
        imageUrl: getRoleImage('plus-size-models')?.image_url
      },
      {
        name: 'Voice Actors',
        slug: 'voice-actors',
        description: 'Voice-over artists and narrators',
        imageUrl: getRoleImage('voice-actors')?.image_url
      },
      {
        name: 'Influencers',
        slug: 'influencers',
        description: 'Social media influencers and creators',
        imageUrl: getRoleImage('influencers')?.image_url
      },
      {
        name: 'Performers',
        slug: 'performers',
        description: 'General performance artists',
        imageUrl: getRoleImage('performers')?.image_url
      },
      {
        name: 'Stunt Performers',
        slug: 'stunt-performers',
        description: 'Professional stunt artists',
        imageUrl: getRoleImage('stunt-performers')?.image_url
      },
      {
        name: 'Extras/Background Actors',
        slug: 'extras-background-actors',
        description: 'Background performers for productions',
        imageUrl: getRoleImage('extras-background-actors')?.image_url
      }
    ];

    // Filter roles that have images uploaded, then shuffle and pick random 8
    const rolesWithImages = allCreativeRoles.filter(role => role.imageUrl);
    console.log('🔍 Debug - Roles with images:', rolesWithImages.length, 'out of', allCreativeRoles.length);
    console.log('🔍 Debug - Platform images loaded:', platformImages?.length || 0);
    if (rolesWithImages.length > 0) {
      console.log('🔍 Debug - Sample role:', rolesWithImages[0].name, rolesWithImages[0].imageUrl);
    }

    const shuffled = [...rolesWithImages].sort(() => Math.random() - 0.5);
    setRandomizedRoles(shuffled.slice(0, Math.min(8, shuffled.length)));
  }, [platformImagesLoading, platformImages, talentProfiles, contributorProfiles]); // eslint-disable-line react-hooks/exhaustive-deps

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
