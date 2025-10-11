'use client'

import Link from 'next/link';
import Image from 'next/image';

interface ContributorProfile {
  id: string;
  handle: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  professional_skills?: string[];
}

interface ContributorSectionProps {
  contributorProfiles: ContributorProfile[];
  platformImagesLoading: boolean;
  coverImage?: {
    image_url: string;
    alt_text?: string;
  } | null;
  getTalentCategoryImages: () => any[];
}

export default function ContributorSection({
  contributorProfiles,
  platformImagesLoading,
  coverImage,
  getTalentCategoryImages
}: ContributorSectionProps) {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Cover Image */}
        <div className="mb-16">
          {coverImage ? (
            <div className="relative h-[300px] rounded-2xl overflow-hidden mb-8">
              <Image
                src={coverImage.image_url}
                alt={coverImage.alt_text || 'Contributors'}
                fill
                className="object-cover"
              />
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40"></div>
              {/* Title overlay */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <h2 className="text-5xl font-bold text-white mb-4">CONTRIBUTORS</h2>
                <p className="text-xl text-white/90 max-w-2xl">
                  Connect with skilled photographers, videographers, and creative professionals
                </p>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-4xl font-bold text-foreground mb-4">CONTRIBUTORS</h2>
              <p className="text-xl text-muted-foreground">
                Connect with skilled photographers, videographers, and creative professionals
              </p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {(() => {
            const realContributors = contributorProfiles;

            // Show loading state if still loading
            if (platformImagesLoading) {
              return Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="animate-pulse">
                  <div className="w-[200px] h-[200px] mx-auto rounded-full bg-gray-200 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                </div>
              ));
            }

            // Show real contributor profiles
            if (realContributors.length > 0) {
              return realContributors.map((contributor) => {
                const imageSrc = contributor.avatar_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg';
                const displayName = contributor.display_name || contributor.handle || 'Creative Professional';
                const primarySkill = contributor.professional_skills && contributor.professional_skills.length > 0
                  ? contributor.professional_skills[0]
                  : 'Creative Professional';

                return (
                  <Link
                    key={contributor.id}
                    href={`/users/${contributor.handle}`}
                    className="group cursor-pointer block"
                  >
                    {/* Contributor Image */}
                    <div className="relative w-[200px] h-[200px] mx-auto mb-4">
                      <Image
                        src={imageSrc}
                        alt={contributor.bio || displayName}
                        fill
                        className="object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/presetie_logo.png';
                          if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                            (e.target as HTMLImageElement).src = fallbackUrl;
                          }
                        }}
                      />
                    </div>

                    {/* Contributor Info */}
                    <div className="text-center">
                      <h3 className="text-foreground font-medium text-lg">
                        {displayName} <span className="text-muted-foreground font-normal">@{contributor.handle}</span>
                      </h3>
                      <p className="text-muted-foreground text-sm mt-1">
                        {primarySkill}
                      </p>
                    </div>
                  </Link>
                );
              });
            }

            // Fallback to static categories if no real contributors available
            const contributorCategories = [
              'Photographers', 'Videographers', 'Directors', 'Editors',
              'Cinematographers', 'Producers', 'Sound Engineers', 'Lighting Technicians'
            ];
            const contributorImages = getTalentCategoryImages();

            return contributorCategories.map((category, index) => {
              const image = contributorImages[index];
              const imageSrc = image?.result_image_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg';
              const imageAlt = image?.title || `${category} contributor`;
              const categorySlug = category.toLowerCase().replace(/\s+/g, '-');

              return (
                <Link key={category} href={`/${categorySlug}`} className="group cursor-pointer">
                  {/* Category Image */}
                  <div className="relative aspect-[4/5] mb-4">
                    <Image
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/presetie_logo.png';
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
                </Link>
              );
            });
          })()}
        </div>
      </div>
    </section>
  );
}
