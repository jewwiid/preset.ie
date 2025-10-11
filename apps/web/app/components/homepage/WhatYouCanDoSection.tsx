'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePlatformGeneratedImages } from '@/app/hooks/usePlatformGeneratedImages';
import { optimizeSupabaseImage, IMAGE_SIZES } from '@/lib/utils/image-optimization';

interface WhatYouCanDoSectionProps {
  isLoggedIn: boolean;
}

export default function WhatYouCanDoSection({ isLoggedIn }: WhatYouCanDoSectionProps) {
  const { platformImages } = usePlatformGeneratedImages();

  // Get "For Contributors" and "For Talents" images from platform images
  const contributorsImage = Array.isArray(platformImages)
    ? platformImages.find(img => img.category === 'how-it-works-contributors')
    : undefined;

  const talentsImage = Array.isArray(platformImages)
    ? platformImages.find(img => img.category === 'how-it-works-talents')
    : undefined;

  const contributorsImageUrl = contributorsImage?.image_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/photoshoot-black-and-white.jpg';
  const talentsImageUrl = talentsImage?.image_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/portrait1.jpeg';

  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-foreground mb-4">How It Works</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Whether you're hiring creative talent or looking for work, Preset makes it simple to connect and collaborate.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* For Contributors Card */}
          <div className="relative bg-card border rounded-lg overflow-hidden flex flex-col lg:flex-row">
            {/* Image Section */}
            <div className="relative h-64 lg:h-auto lg:w-1/2">
              <Image
                src={optimizeSupabaseImage(contributorsImageUrl, IMAGE_SIZES.sectionImage)}
                alt="For Contributors"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
              />
            </div>

            {/* Content Section */}
            <div className="p-8 lg:w-1/2 flex flex-col justify-between">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-4">For Contributors</h3>
                <p className="text-muted-foreground mb-6">
                  Hire the best creative talent for your projects
                </p>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-foreground mb-2">Post your job</h4>
                    <p className="text-sm text-muted-foreground">
                      Tell us the specs for your job, including rate, date, and other details.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">Review applicants</h4>
                    <p className="text-sm text-muted-foreground">
                      Get access to thousands of top creative talent. Message, shortlist and share the ones you like.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">Hire and pay</h4>
                    <p className="text-sm text-muted-foreground">
                      Save hundreds of dollars in fees by booking the talent directly through our secure platform.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/browse"
                className="inline-flex items-center justify-center px-6 py-3 mt-6 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Browse Talent
              </Link>
            </div>
          </div>

          {/* For Talents Card */}
          <div className="relative bg-card border rounded-lg overflow-hidden flex flex-col lg:flex-row">
            {/* Content Section */}
            <div className="p-8 lg:w-1/2 flex flex-col justify-between order-2 lg:order-1">
              <div>
                <h3 className="text-3xl font-bold text-foreground mb-4">For Talents</h3>
                <p className="text-muted-foreground mb-6">
                  Find amazing creative projects and get hired
                </p>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-bold text-foreground mb-2">Browse opportunities</h4>
                    <p className="text-sm text-muted-foreground">
                      Discover exciting creative projects from brands, agencies, and fellow creatives.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">Apply and connect</h4>
                    <p className="text-sm text-muted-foreground">
                      Submit your portfolio and connect directly with clients who need your skills.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-bold text-foreground mb-2">Get hired and paid</h4>
                    <p className="text-sm text-muted-foreground">
                      Work on amazing projects and get paid securely through our platform.
                    </p>
                  </div>
                </div>
              </div>

              <Link
                href="/gigs"
                className="inline-flex items-center justify-center px-6 py-3 mt-6 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
              >
                Find Gigs
              </Link>
            </div>

            {/* Image Section */}
            <div className="relative h-64 lg:h-auto lg:w-1/2 order-1 lg:order-2">
              <Image
                src={optimizeSupabaseImage(talentsImageUrl, IMAGE_SIZES.sectionImage)}
                alt="For Talents"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                loading="lazy"
                quality={85}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
