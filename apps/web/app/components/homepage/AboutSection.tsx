'use client'

import Image from 'next/image';

interface AboutSectionProps {
  whyPresetImage?: {
    image_url: string;
    alt_text?: string;
  } | null;
}

export default function AboutSection({ whyPresetImage }: AboutSectionProps) {
  const imageSrc = whyPresetImage?.image_url || 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/hero-bg.jpeg';
  const imageAlt = whyPresetImage?.alt_text || 'Creative professional';

  return (
    <section id="features" className="py-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Image */}
          <div className="relative order-2 lg:order-1">
            <div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted">
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover"
                onError={(e) => {
                  const fallbackUrl = 'https://zbsmgymyfhnwjdnmlelr.supabase.co/storage/v1/object/public/platform-images/logo.png';
                  if ((e.target as HTMLImageElement).src !== fallbackUrl) {
                    (e.target as HTMLImageElement).src = fallbackUrl;
                  }
                }}
              />
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
  );
}
