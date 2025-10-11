'use client';

import Image from 'next/image';
import { optimizeSupabaseImage, IMAGE_SIZES } from '@/lib/utils/image-optimization';

interface HeroImage {
  id: string;
  image_url: string;
  alt_text: string;
  title: string;
  attribution: string;
}

interface HeroSectionProps {
  currentImageIndex: number;
  heroImages: HeroImage[];
  isLoggedIn: boolean;
}

export default function HeroSection({ currentImageIndex, heroImages, isLoggedIn }: HeroSectionProps) {
  const currentImage = heroImages[currentImageIndex];
  const [line1, line2] = currentImage.attribution.split('\n');

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-4rem)]">
          {/* Left Column - Image */}
          <div className="relative order-1 lg:order-1">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
              <Image
                key={currentImage.id}
                src={optimizeSupabaseImage(currentImage.image_url, IMAGE_SIZES.hero)}
                alt={currentImage.alt_text}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover transition-opacity duration-1000"
                priority
                quality={90}
                placeholder="blur"
                blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjUwMCIgZmlsbD0iIzIwMjAyMCIvPjwvc3ZnPg=="
                style={{ opacity: 1 }}
              />
            </div>
            {/* Attribution */}
            <div className="mt-4 mb-8 text-sm text-muted-foreground">
              <span className="text-muted-foreground/60">{line1}</span>
              <br />
              <span className="text-primary font-medium">{line2}</span>
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
              {isLoggedIn ? (
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
                    href="/gigs"
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
  );
}
