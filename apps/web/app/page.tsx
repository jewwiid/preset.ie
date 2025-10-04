'use client'

import { useAuth } from "../lib/auth-context";
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useHomepageImages, usePreloadCriticalImages } from './hooks/usePlatformImages';
import { usePlatformGeneratedImages } from './hooks/usePlatformGeneratedImages';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [currentHeroImageIndex, setCurrentHeroImageIndex] = useState(0);
  
  // Check if user is logged in
  const isLoggedIn = !!user;
  
  // Preload critical images on app startup
  usePreloadCriticalImages();
  
  // Fetch homepage images with caching
  const { images: homepageImages, loading: imagesLoading } = useHomepageImages({
    preload: true
  });

  // Fetch platform-generated images
  const { 
    presetImages, 
    platformImages, 
    talentProfiles,
    loading: platformImagesLoading,
    getHeroImage,
    getTalentCategoryImages,
    getFeaturedWorkImages,
    getWhyPresetImage,
    getTalentProfiles
  } = usePlatformGeneratedImages();

  // Helper functions for How It Works images
  const getHowItWorksContributorImage = () => {
    return {
      id: 'contributor-studio',
      image_url: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/studio.jpg',
      alt_text: 'Professional contributor in studio setting',
      title: 'Contributor Studio'
    };
  };
  
  const getHowItWorksTalentImage = () => {
    return {
      id: 'talent-portrait',
      image_url: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg',
      alt_text: 'Professional talent showcasing creative work',
      title: 'Talent Portrait'
    };
  };

  // Helper function for cycling hero images
  const getHeroImages = () => {
    const heroImages = [
      // First image - Female Model in Forest
      {
        id: 'femalemodelinforest',
        image_url: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/femalemodelinforest.jpg',
        alt_text: 'Female model in natural forest setting',
        title: 'Model in Forest',
        attribution: 'FASHION\nPhotographer, Preset Platform'
      },
      // Second image - Portrait
      {
        id: 'portrait1',
        image_url: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg',
        alt_text: 'Professional portrait photography',
        title: 'Portrait Photography',
        attribution: 'PORTRAIT\nPhotographer, Preset Platform'
      },
      // Third image - Photo Shoot Black and White
      {
        id: 'photoshoot-bw',
        image_url: 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/photoshoot-black-and-white.jpg',
        alt_text: 'Professional black and white photoshoot',
        title: 'Black & White Shoot',
        attribution: 'PORTRAIT\nPhotographer, Preset Platform'
      }
    ];
    
    return heroImages;
  };

  // Removed automatic redirect - let users choose to view homepage or go to dashboard

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Hero image cycling effect
  useEffect(() => {
    const heroImages = getHeroImages();
    const interval = setInterval(() => {
      setCurrentHeroImageIndex((prevIndex) => 
        (prevIndex + 1) % heroImages.length
      );
    }, 4000); // Change image every 4 seconds

    return () => clearInterval(interval);
  }, []);

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

  // Allow both authenticated and non-authenticated users to view the homepage

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation is now handled by the global NavBar in layout.tsx */}

      {/* Hero Section - Swipecast Style */}
      <section className="relative min-h-screen flex items-center overflow-hidden pt-16 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
            {/* Left Column - Image */}
            <div className="relative order-1 lg:order-1">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
          {(() => {
                  const heroImages = getHeroImages();
                  const currentImage = heroImages[currentHeroImageIndex];
            
            return (
              <Image
                      key={currentImage.id}
                      src={currentImage.image_url}
                      alt={currentImage.alt_text}
                fill
                      className="object-cover transition-opacity duration-1000"
                priority
                      style={{ opacity: 1 }}
              />
            );
          })()}
              </div>
              {/* Attribution */}
              <div className="mt-4 mb-8 text-sm text-muted-foreground">
                {(() => {
                  const heroImages = getHeroImages();
                  const currentImage = heroImages[currentHeroImageIndex];
                  const [line1, line2] = currentImage.attribution.split('\n');
                  
                  return (
                    <>
                      <span className="text-muted-foreground/60">{line1}</span>
                      <br />
                      <span className="text-primary font-medium">{line2}</span>
                    </>
                  );
                })()}
        </div>

            </div>

            {/* Right Column - Content */}
            <div className="order-2 lg:order-2 flex flex-col justify-center">
              <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
                Connect Creatives alike. Ready, set, Preset.
          </h1>
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                The go to platform, allowing creators and creatives to collaborate network and brainstorm together.
          </p>
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
            {user ? (
              <>
                <a
                      href="/gigs"
                      className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all hover:scale-105"
                >
                      Browse Gigs
                </a>
                <a
                      href="/dashboard"
                      className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-foreground bg-background border-2 border-border rounded-lg hover:border-primary transition-all"
                >
                      Go to Dashboard
                </a>
              </>
            ) : (
              <>
                <a
                  href="/auth/signin"
                      className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all hover:scale-105"
                >
                      Browse Gigs
                </a>
                <a
                      href="/auth/signup"
                      className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-foreground bg-background border-2 border-border rounded-lg hover:border-primary transition-all"
                >
                      Sign Up
                </a>
              </>
            )}
          </div>
            </div>
          </div>
        </div>
        </section>

        {/* What You Can Do Section */}
        <section className="py-20 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-foreground mb-4">What You Can Do</h2>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Discover amazing features that help you create, collaborate, and grow your creative career
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Step 1 */}
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-6">1</div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Generate AI Content</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Create stunning images and videos with AI-powered presets and treatments. Experiment with different styles and bring your ideas to life.
                </p>
              </div>

              {/* Step 2 */}
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-6">2</div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Connect & Collaborate</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Browse creative gigs, find talented collaborators, and build your professional network. Message, shortlist, and work with the best creatives.
                </p>
              </div>

              {/* Step 3 */}
              <div className="text-center">
                <div className="text-6xl font-bold text-primary mb-6">3</div>
                <h3 className="text-2xl font-bold text-foreground mb-4">Build Your Portfolio</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  Showcase your work with smart moodboards and collaborative showcases. Get discovered by brands and clients worldwide.
                </p>
              </div>
            </div>

            <div className="text-center mt-12">
              <a
                href={user ? "/dashboard" : "/auth/signup"}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-foreground bg-primary rounded-lg hover:bg-primary/90 transition-all hover:scale-105"
              >
                Get Started Today
              </a>
            </div>
          </div>
        </section>

        {/* Connecting Section */}
      <section className="py-16 bg-background overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">CONNECTING</h2>
        </div>

          <div className="relative space-y-8">
            {/* Top row - left to right */}
            <div className="flex animate-scroll-left gap-8 lg:gap-12">
              {/* First set */}
              <div className="flex gap-8 lg:gap-12 shrink-0">
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">PHOTOGRAPHERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">VIDEOGRAPHERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">FREELANCERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">CREATIVE DIRECTORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">BRAND MANAGERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">CONTENT CREATORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">ART DIRECTORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">AGENCIES</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">ENTREPRENEURS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">INFLUENCERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">MARKETING TEAMS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">SOCIAL MEDIA MANAGERS</div>
          </div>
        </div>

              {/* Duplicate set for seamless loop */}
              <div className="flex gap-8 lg:gap-12 shrink-0">
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">PHOTOGRAPHERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">VIDEOGRAPHERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">FREELANCERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">CREATIVE DIRECTORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">BRAND MANAGERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">CONTENT CREATORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">ART DIRECTORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">AGENCIES</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">ENTREPRENEURS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">INFLUENCERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">MARKETING TEAMS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">SOCIAL MEDIA MANAGERS</div>
                </div>
          </div>
        </div>

            {/* Bottom row - right to left */}
            <div className="flex animate-scroll-right gap-8 lg:gap-12">
              {/* First set */}
              <div className="flex gap-8 lg:gap-12 shrink-0">
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">STUDIOS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">MODELS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">MAKEUP ARTISTS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">HAIR STYLISTS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">FASHION STYLISTS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">PRODUCERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">DESIGNERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">ARTISTS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">EDITORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">WRITERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">CINEMATOGRAPHERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">DIRECTORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">CONTRACTORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">ACTORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">MUSICIANS</div>
          </div>
        </div>

              {/* Duplicate set for seamless loop */}
              <div className="flex gap-8 lg:gap-12 shrink-0">
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">STUDIOS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">MODELS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">MAKEUP ARTISTS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">HAIR STYLISTS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">FASHION STYLISTS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">PRODUCERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">DESIGNERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">ARTISTS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">EDITORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">WRITERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">CINEMATOGRAPHERS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">DIRECTORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">CONTRACTORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">ACTORS</div>
                </div>
                <div className="text-center">
                  <div className="text-xl font-semibold text-foreground whitespace-nowrap scrolling-text-bloc">MUSICIANS</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Whether you're hiring creative talent or looking for work, Preset makes it simple to connect and collaborate.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - For Contributors */}
            <div className="bg-background rounded-2xl border border-border overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch min-h-[500px]">
                {/* Image for Contributors */}
                <div className="relative h-64 lg:h-full w-full order-2 lg:order-1">
                  {(() => {
                    const contributorImage = getHowItWorksContributorImage();
                    return (
                      <Image
                        src={contributorImage.image_url}
                        alt={contributorImage.alt_text}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        onError={(e) => {
                          const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg';
                          if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                            (e.target as HTMLImageElement).src = fallbackUrl;
                          }
                        }}
                      />
                    );
                  })()}
                </div>

                {/* Text Content for Contributors */}
                <div className="p-8 order-1 lg:order-2 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">For Contributors</h3>
                    <p className="text-muted-foreground text-sm mb-6">Hire the best creative talent for your projects</p>

                    <div className="space-y-4">
                      {/* Step 1 */}
                      <div>
                        <h4 className="text-base font-semibold text-foreground mb-1">Post your job</h4>
                        <p className="text-muted-foreground text-sm">
                          Tell us the specs for your job, including rate, date, and other details.
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div>
                        <h4 className="text-base font-semibold text-foreground mb-1">Review applicants</h4>
                        <p className="text-muted-foreground text-sm">
                          Get access to thousands of top creative talent. Message, shortlist and share the ones you like.
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div>
                        <h4 className="text-base font-semibold text-foreground mb-1">Hire and pay</h4>
                        <p className="text-muted-foreground text-sm">
                          Save hundreds of dollars in fees by booking the talent directly through our secure platform.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    {!isLoggedIn ? (
                      <Link 
                        href="/register"
                        className="inline-block bg-primary text-background px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                      >
                        Post a Job
                      </Link>
                    ) : (
                      <Link 
                        href="/auth/signin"
                        className="inline-block bg-primary text-background px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                      >
                        Browse Talent
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - For Talents */}
            <div className="bg-background rounded-2xl border border-border overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 items-stretch min-h-[500px]">
                {/* Text Content for Talents */}
                <div className="p-8 order-1 lg:order-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-bold text-foreground mb-2">For Talents</h3>
                    <p className="text-muted-foreground text-sm mb-6">Find amazing creative projects and get hired</p>

                    <div className="space-y-4">
                      {/* Step 1 */}
                      <div>
                        <h4 className="text-base font-semibold text-foreground mb-1">Browse opportunities</h4>
                        <p className="text-muted-foreground text-sm">
                          Discover exciting creative projects from brands, agencies, and fellow creatives.
                        </p>
                      </div>

                      {/* Step 2 */}
                      <div>
                        <h4 className="text-base font-semibold text-foreground mb-1">Apply and connect</h4>
                        <p className="text-muted-foreground text-sm">
                          Submit your portfolio and connect directly with clients who need your skills.
                        </p>
                      </div>

                      {/* Step 3 */}
                      <div>
                        <h4 className="text-base font-semibold text-foreground mb-1">Get hired and paid</h4>
                        <p className="text-muted-foreground text-sm">
                          Work on amazing projects and get paid securely through our platform.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    {!isLoggedIn ? (
                      <Link 
                        href="/register"
                        className="inline-block border border-primary text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary/10 transition-colors text-sm"
                      >
                        Join as Talent
                      </Link>
                    ) : (
                      <Link 
                        href="/auth/signin"
                        className="inline-block border border-primary text-primary px-4 py-2 rounded-lg font-medium hover:bg-primary/10 transition-colors text-sm"
                      >
                        Find Jobs
                      </Link>
                    )}
                  </div>
                </div>

                {/* Image for Talents */}
                <div className="relative h-64 lg:h-full w-full order-2 lg:order-2">
                  {(() => {
                    const talentImage = getHowItWorksTalentImage();
                    return (
                      <Image
                        src={talentImage.image_url}
                        alt={talentImage.alt_text}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                        onError={(e) => {
                          const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/studio.jpg';
                          if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                            (e.target as HTMLImageElement).src = fallbackUrl;
                          }
                        }}
                      />
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Section */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">Everything You Need to Create</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              From AI-powered tools to collaborative workflows, Preset provides the complete creative toolkit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* AI Playground */}
            <div className="bg-background rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">AI Playground</h3>
              <p className="text-muted-foreground mb-4">
                Generate stunning images and videos with AI-powered presets and treatments. Experiment with different styles and techniques.
              </p>
            </div>

            {/* Gigs & Marketplace */}
            <div className="bg-background rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Gigs & Marketplace</h3>
              <p className="text-muted-foreground mb-4">
                Connect with creative talent worldwide. Post gigs, find collaborators, and build your creative network.
              </p>
            </div>

            {/* Moodboards */}
            <div className="bg-background rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Smart Moodboards</h3>
              <p className="text-muted-foreground mb-4">
                Create beautiful visual references with AI-powered moodboard builder. Upload images, extract palettes, and organize inspiration.
              </p>
            </div>

            {/* Showcases */}
            <div className="bg-background rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Collaborative Showcases</h3>
              <p className="text-muted-foreground mb-4">
                Build professional portfolios from completed projects. Mutual approval system ensures quality and proper attribution.
              </p>
            </div>

            {/* AI Treatments */}
            <div className="bg-background rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">AI Treatments</h3>
              <p className="text-muted-foreground mb-4">
                Generate professional treatments for Film/TV, Commercial, Documentary, and more using advanced AI models.
              </p>
            </div>

            {/* Collaboration Tools */}
            <div className="bg-background rounded-2xl p-8 border border-border hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-foreground mb-3">Collaboration Tools</h3>
              <p className="text-muted-foreground mb-4">
                Seamless communication and project management. Real-time messaging, file sharing, and progress tracking.
              </p>
            </div>
        </div>
      </div>
      </section>

      {/* Talent Categories Section - Swipecast Style */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">TALENT FOR HIRE</h2>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {(() => {
              const realTalents = getTalentProfiles();
              
              // Show loading state if still loading
              if (platformImagesLoading) {
                return Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="animate-pulse">
                    <div className="rounded-lg overflow-hidden bg-gray-200 aspect-[4/5] mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                  </div>
                ));
              }
              
              // Always try to show real talents first, even if empty
              if (realTalents.length > 0) {
                // Show real talent profiles with Swipecast styling
                return realTalents.map((talent, index) => {
                  const imageSrc = talent.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg';
                  const displayName = talent.display_name || talent.handle || 'Creative Professional';
                  
                  return (
                    <a 
                      key={talent.id} 
                      href="/auth/signin"
                      className="group cursor-pointer block"
                    >
                      {/* Talent Image */}
                      <div className="relative aspect-[4/5] mb-4">
                        <Image
                          src={imageSrc}
                          alt={talent.bio || displayName}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg';
                            if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                              (e.target as HTMLImageElement).src = fallbackUrl;
                            }
                          }}
                        />
                      </div>
                      
                      {/* Category Label */}
                      <div className="text-center">
                        <h3 className="text-foreground font-medium text-lg">
                          {displayName} <span className="text-muted-foreground font-normal">@{talent.handle}</span>
                        </h3>
                        <p className="text-muted-foreground text-sm mt-1">
                          {(() => {
                            if (talent.specializations && talent.specializations.length > 0) {
                              return talent.specializations[0];
                            }
                            if (talent.talent_categories && talent.talent_categories.length > 0) {
                              return talent.talent_categories[0];
                            }
                            if (talent.style_tags && talent.style_tags.length > 0) {
                              return talent.style_tags[0];
                            }
                            return 'Creative Professional';
                          })()}
                        </p>
                      </div>
                    </a>
                  );
                });
              }
              
              // Fallback to static categories if no real talents available
              const talentCategories = [
                'Photographers', 'Hair Stylists', 'Make-up Artists', 'Models',
                'Videographers', 'Stylists', 'Producers', 'Studios'
              ];
              const talentImages = getTalentCategoryImages();
              
              return talentCategories.map((category, index) => {
                const image = talentImages[index];
                const imageSrc = image?.result_image_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg';
                const imageAlt = image?.title || `${category} talent`;
                
                return (
                  <div key={category} className="group cursor-pointer">
                    {/* Category Image */}
                    <div className="relative aspect-[4/5] mb-4">
                      <Image
                        src={imageSrc}
                        alt={imageAlt}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg';
                          if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                            (e.target as HTMLImageElement).src = fallbackUrl;
                          }
                        }}
                      />
                    </div>
                    
                    {/* Category Label */}
                    <div className="text-center">
                      <h3 className="text-foreground font-medium text-lg">{category}</h3>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      </section>

      {/* User Generated Images Masonry Section */}
      <section className="py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">FEATURED WORK</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover amazing creative work from our community of talented professionals
            </p>
          </div>
          
          <div className="relative">
            <div className="overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <div className="flex gap-4 pb-4" style={{ width: 'max-content' }}>
                {(() => {
                  const featuredImages = getFeaturedWorkImages();
                  const heights = ['h-64', 'h-48', 'h-80', 'h-64', 'h-72', 'h-56', 'h-80', 'h-64', 'h-72', 'h-80'];
                  
                  if (featuredImages.length === 0) {
                    // Fallback placeholder images if no platform images available
                    return Array.from({ length: 10 }, (_, index) => (
                      <div key={index} className={`relative ${heights[index]} w-64 rounded-lg overflow-hidden bg-accent flex-shrink-0 group cursor-pointer`}>
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <span className="text-muted-foreground text-sm">Coming Soon</span>
                        </div>
                      </div>
                    ));
                  }
                  
                  return featuredImages.map((image, index) => (
                    <div key={image.id} className={`relative ${heights[index % heights.length]} w-64 rounded-lg overflow-hidden bg-accent flex-shrink-0 group cursor-pointer`}>
                      <Image
                        src={image.result_image_url}
                        alt={image.title || `Featured work ${index + 1}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/playground-gallery/saved-image-1759192759863-n6naz0pyecq.jpeg';
                          if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                            (e.target as HTMLImageElement).src = fallbackUrl;
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="text-background">
                          <p className="text-sm font-medium">{image.title || 'Creative Project'}</p>
                          <p className="text-xs text-background/70">
                            by {image.users_profile?.display_name || image.users_profile?.handle || 'Platform User'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>

            {/* Scroll indicators */}
            <div className="flex justify-center mt-8 space-x-2">
              <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
              <div className="w-2 h-2 bg-muted-foreground/30 rounded-full"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Preset Section - Swipecast Style */}
      <section id="features" className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left Column - Image */}
            <div className="relative order-2 lg:order-1">
              <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
                {(() => {
                  const whyPresetImage = getWhyPresetImage();
                  const imageSrc = whyPresetImage?.image_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg';
                  const imageAlt = whyPresetImage?.alt_text || 'Creative professional';
                  
                  return (
                    <Image
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg';
                        if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                          (e.target as HTMLImageElement).src = fallbackUrl;
                        }
                      }}
                    />
                  );
                })()}
              </div>
            </div>

            {/* Right Column - Content */}
            <div className="order-1 lg:order-2">
              <h2 className="text-4xl font-bold text-foreground mb-4">Why Preset?</h2>
              <h3 className="text-2xl font-bold text-foreground mb-6">Creative's Largest Global Collaboration Platform</h3>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Preset has over 10,000 curated users, including photographers, models, hair stylists, makeup artists, videographers, and even studios.
              </p>
              
              {/* Benefits List */}
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mr-4 mt-1">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">Cost Savings</h4>
                    <p className="text-muted-foreground">Connect directly to talent, saving 30% in lower commissions and fees.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mr-4 mt-1">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">Smooth Bookings</h4>
                    <p className="text-muted-foreground">Direct communication with talent, sharing of contact information post-confirmation, and 24/7 support for creative needs.</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mr-4 mt-1">
                    <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-2">Trusted Platform</h4>
                    <p className="text-muted-foreground">All jobs booked on Preset are backed by our guarantee, 24/7 support and booking protection.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Swipecast Style */}
      <section className="py-20 bg-primary">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6">
            Ready to Start Creating?
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8">
            Join thousands of creative professionals already using Preset. 
            Free to start, with powerful features to grow your creative business.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {user ? (
              <>
                <a
                  href="/dashboard"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary bg-primary-foreground rounded-lg hover:bg-primary-foreground/90 transition-all hover:scale-105"
                >
                  Go to Dashboard
                </a>
                <a
                  href="/gigs"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-foreground border-2 border-primary-foreground rounded-lg hover:bg-primary-foreground hover:text-primary transition-all"
                >
                  Browse Gigs →
                </a>
              </>
            ) : (
              <>
                <a
                  href="/auth/signup"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary bg-primary-foreground rounded-lg hover:bg-primary-foreground/90 transition-all hover:scale-105"
                >
                  Sign Up for Free
                </a>
                <a
                  href="/auth/signin"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium text-primary-foreground border-2 border-primary-foreground rounded-lg hover:bg-primary-foreground hover:text-primary transition-all"
                >
                  Sign In →
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-muted border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Image src="/logo.svg" alt="Preset" width={24} height={24} className="w-6 h-6" />
              <span className="font-bold text-lg text-foreground">Preset</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2025 Preset. Connecting creatives worldwide.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}