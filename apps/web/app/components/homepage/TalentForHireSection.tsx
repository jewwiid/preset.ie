'use client'

import Link from 'next/link';
import Image from 'next/image';
import { VerificationBadges } from '../../../components/VerificationBadges';
import { parseVerificationBadges } from '../../../lib/utils/verification-badges';

interface TalentProfile {
  id: string;
  handle: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  talent_categoriess?: string[];
  professional_skills?: string[];
  verification_badges?: any;
}

interface TalentForHireSectionProps {
  talentProfiles: TalentProfile[];
  platformImagesLoading: boolean;
  coverImage?: {
    image_url: string;
    alt_text?: string;
  } | null;
  getTalentCategoryImages: () => any[];
}

export default function TalentForHireSection({
  talentProfiles,
  platformImagesLoading,
  coverImage,
  getTalentCategoryImages
}: TalentForHireSectionProps) {
  return (
    <section className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header with Cover Image */}
        <div className="mb-16">
          {coverImage ? (
            <div className="relative h-[300px] rounded-2xl overflow-hidden mb-8">
              <Image
                src={coverImage.image_url}
                alt={coverImage.alt_text || 'Talent for hire'}
                fill
                className="object-cover"
                loading="lazy"
                quality={90}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
              />
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-black/40"></div>
              {/* Title overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <h2 className="text-5xl font-bold text-white">TALENT FOR HIRE</h2>
              </div>
            </div>
          ) : (
            <h2 className="text-4xl font-bold text-foreground mb-4">TALENT FOR HIRE</h2>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {(() => {
            const realTalents = talentProfiles;

            // Show loading state if still loading
            if (platformImagesLoading) {
              return Array.from({ length: 4 }, (_, index) => (
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
                    href={`/users/${talent.handle}`}
                    className="group cursor-pointer block"
                  >
                    {/* Talent Image */}
                    <div className="relative aspect-[4/5] mb-4">
                      <Image
                        src={imageSrc}
                        alt={talent.bio || displayName}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        quality={85}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
                        onError={(e) => {
                          const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/presetie_logo.png';
                          if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                            (e.target as HTMLImageElement).src = fallbackUrl;
                          }
                        }}
                      />
                    </div>

                    {/* Talent Info */}
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <h3 className="text-foreground font-medium text-lg">
                          {displayName}
                        </h3>
                        <VerificationBadges
                          verifiedIdentity={parseVerificationBadges(talent.verification_badges || null).identity}
                          verifiedProfessional={parseVerificationBadges(talent.verification_badges || null).professional}
                          verifiedBusiness={parseVerificationBadges(talent.verification_badges || null).business}
                          size="sm"
                        />
                      </div>
                      <p className="text-muted-foreground text-sm">
                        @{talent.handle}
                      </p>
                      <p className="text-muted-foreground text-sm mt-1">
                        {(talent as any).primary_skill ||
                          (talent.professional_skills && talent.professional_skills.length > 0 ? talent.professional_skills[0] : null) ||
                          'Creative Professional'}
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
              const categorySlug = category.toLowerCase().replace(/\s+/g, '-').replace(/-s$/, ''); // Remove trailing -s

              return (
                <Link key={category} href={`/${categorySlug}`} className="group cursor-pointer">
                  {/* Category Image */}
                  <div className="relative aspect-[4/5] mb-4">
                    <Image
                      src={imageSrc}
                      alt={imageAlt}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      quality={85}
                      placeholder="blur"
                      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
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
